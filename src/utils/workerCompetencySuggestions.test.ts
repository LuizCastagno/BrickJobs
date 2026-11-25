import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCompetencyAnalysisRequestPayload,
  buildWorkerCompetencyFingerprint,
  hasAnalyzableExperiences,
  hasCompleteExperienceForAutoSuggest,
  isCompetencyApplied,
  mergeAppliedCompetencies,
  parseGeminiCompetencySuggestions,
  sanitizeAnalyzableExperiences,
  toggleAppliedCompetency,
} from './workerCompetencySuggestions';

test('sanitizeAnalyzableExperiences trims strings and skips completely empty rows', () => {
  const sanitized = sanitizeAnalyzableExperiences([
    {
      empresaLocal: '   ',
      funcao: ' ',
      atividades: '',
      dataInicio: '2024-01',
      dataFim: '2025-01',
      atual: false,
    },
    {
      empresaLocal: '  Construtora Cerrado Sul · Rondonópolis  ',
      funcao: '  Pedreiro de Alvenaria ',
      atividades: '  Reboco, alvenaria estrutural e leitura de planta  ',
      dataInicio: '2023-01',
      dataFim: '2025-10',
      atual: true,
    },
  ]);

  assert.equal(sanitized.length, 1);
  assert.equal(sanitized[0].empresaLocal, 'Construtora Cerrado Sul · Rondonópolis');
  assert.equal(sanitized[0].funcao, 'Pedreiro de Alvenaria');
  assert.equal(sanitized[0].dataFim, '');
  assert.equal(sanitized[0].atual, true);
});

test('hasAnalyzableExperiences vs hasCompleteExperienceForAutoSuggest distinguishes partial and complete entries', () => {
  assert.equal(hasAnalyzableExperiences([]), false);
  assert.equal(
    hasAnalyzableExperiences([{ funcao: 'Pedreiro', empresaLocal: '', atividades: '' }]),
    true
  );
  assert.equal(
    hasCompleteExperienceForAutoSuggest([{ funcao: 'Pedreiro', empresaLocal: '', atividades: '' }]),
    false
  );
  assert.equal(
    hasCompleteExperienceForAutoSuggest([
      { funcao: 'Pedreiro', empresaLocal: 'Construtora Sul', atividades: '' },
    ]),
    true
  );
});

test('buildWorkerCompetencyFingerprint is invariant to whitespace, casing, and experience order', () => {
  const fpA = buildWorkerCompetencyFingerprint({
    funcaoPrincipal: 'Pedreiro',
    resumoProfissional: 'Foco em alvenaria estrutural',
    experiencias: [
      {
        empresaLocal: 'Obra Alpha',
        funcao: 'Pedreiro',
        dataInicio: '2022-01',
        dataFim: '2024-06',
        atual: false,
        atividades: 'Reboco e contrapiso',
      },
      {
        empresaLocal: 'Obra Beta',
        funcao: 'Azulejista',
        dataInicio: '2024-07',
        dataFim: '',
        atual: true,
        atividades: 'Porcelanato',
      },
    ],
  });

  const fpB = buildWorkerCompetencyFingerprint({
    funcaoPrincipal: '  pedreiro ',
    resumoProfissional: 'foco em alvenaria estrutural',
    experiencias: [
      {
        empresaLocal: 'obra beta',
        funcao: 'AZULEJISTA',
        dataInicio: '2024-07',
        dataFim: '2026-01',
        atual: true,
        atividades: 'porcelanato',
      },
      {
        empresaLocal: 'Obra Alpha',
        funcao: 'Pedreiro',
        dataInicio: '2022-01',
        dataFim: '2024-06',
        atual: false,
        atividades: 'Reboco   e contrapiso',
      },
    ],
  });

  assert.equal(fpA, fpB);
});

test('buildCompetencyAnalysisRequestPayload produces normalized request payload and fingerprint', () => {
  const payload = buildCompetencyAnalysisRequestPayload({
    funcaoPrincipal: '',
    resumoProfissional: '  Experiência em obras industriais  ',
    experiencias: [
      {
        empresaLocal: 'AgroEstrutura Engenharia',
        funcao: 'Armador de Ferragem',
        dataInicio: '2023-02',
        dataFim: '',
        atual: true,
        atividades: 'Corte, dobra e montagem de aço CA-50',
      },
    ],
  });

  assert.equal(payload.role, 'Profissional da Construção Civil');
  assert.equal(payload.summary, 'Experiência em obras industriais');
  assert.equal(payload.experiences.length, 1);
  assert.ok(payload.fingerprint.length > 10);
});

test('parseGeminiCompetencySuggestions parses fenced JSON, deduplicates names, and enforces exactly 3 items', () => {
  const raw = `\`\`\`json
  {
    "summary": "Perfil sólido em alvenaria estrutural e acabamento fino.",
    "competencies": [
      {
        "name": "Alvenaria Estrutural",
        "category": "Execução de Obra",
        "rationale": "Atuação contínua com blocos estruturais na Construtora Vale Verde."
      },
      {
        "name": "alvenaria estrutural",
        "category": "Duplicada",
        "rationale": "Deve ser ignorada na deduplicação."
      },
      {
        "name": "Assentamento de Porcelanato",
        "category": "Acabamento",
        "rationale": "Experiência recente como azulejista em Jaciara-MT."
      },
      {
        "name": "Leitura de Planta Baixa",
        "category": "Projetos e Medidas",
        "rationale": "Necessária para manter prumo, nível e esquadro na execução."
      },
      {
        "name": "Quarta Competência Extra",
        "category": "Extra",
        "rationale": "Não deve exceder 3 itens."
      }
    ]
  }
  \`\`\``;

  const parsed = parseGeminiCompetencySuggestions(raw, 'fp-123');
  assert.equal(parsed.fingerprint, 'fp-123');
  assert.equal(parsed.competencies.length, 3);
  assert.deepEqual(
    parsed.competencies.map((c) => c.name),
    [
      'Alvenaria Estrutural',
      'Assentamento de Porcelanato',
      'Leitura de Planta Baixa',
    ]
  );
});

test('parseGeminiCompetencySuggestions throws when fewer than 3 valid unique competencies are returned', () => {
  assert.throws(
    () =>
      parseGeminiCompetencySuggestions(
        JSON.stringify({
          summary: 'Incompleto',
          competencies: [
            { name: 'Reboco', category: 'Alvenaria', rationale: 'Ok' },
            { name: 'Reboco', category: 'Alvenaria', rationale: 'Dup' },
          ],
        })
      ),
    /eram esperadas 3/
  );

  assert.throws(() => parseGeminiCompetencySuggestions('not-json'), /JSON/);
  assert.throws(() => parseGeminiCompetencySuggestions(''), /vazia/);
});

test('applied competency merge, toggle, and membership checks work case-insensitively without duplicates', () => {
  const merged = mergeAppliedCompetencies(
    ['Leitura de Planta'],
    ['leitura de planta', 'NR-35 Trabalho em Altura', 'Alvenaria Estrutural']
  );
  assert.deepEqual(merged, [
    'Leitura de Planta',
    'NR-35 Trabalho em Altura',
    'Alvenaria Estrutural',
  ]);
  assert.equal(isCompetencyApplied(merged, 'nr-35 trabalho em altura'), true);
  assert.equal(isCompetencyApplied(merged, 'Soldagem MIG'), false);

  const toggledOff = toggleAppliedCompetency(merged, 'NR-35 Trabalho em Altura');
  assert.deepEqual(toggledOff, ['Leitura de Planta', 'Alvenaria Estrutural']);

  const toggledOn = toggleAppliedCompetency(toggledOff, 'Impermeabilização de Lajes');
  assert.deepEqual(toggledOn, [
    'Leitura de Planta',
    'Alvenaria Estrutural',
    'Impermeabilização de Lajes',
  ]);
});
