import assert from 'node:assert/strict';
import test from 'node:test';
import { SEED_JOBS } from '../data/rondonopolisSeed.ts';
import type { JobPosting } from '../types/brickjobs';
import {
  buildSkillTagSummaries,
  CONSTRUCTION_SKILL_TAGS,
  filterJobsBySkillTags,
  formatCompetencyList,
  formatSkillTagLabel,
  getJobSkillTags,
  inferJobSkillTags,
  parseCompetencyList,
  SPECIALTY_SKILL_TAGS,
  toggleSkillTagSelection,
} from './skillTags.ts';

function makeJob(partial: Partial<JobPosting>): JobPosting {
  return {
    id: partial.id ?? 'job-1',
    companyId: partial.companyId ?? 'comp-1',
    companyName: partial.companyName ?? 'Construtora Teste',
    funcao: partial.funcao ?? 'Pedreiro',
    quantidadeVagas: partial.quantidadeVagas ?? 2,
    bairro: partial.bairro ?? 'Centro',
    regiaoInteresse: partial.regiaoInteresse ?? 'Centro',
    salarioOuDiaria: partial.salarioOuDiaria ?? 'R$ 190/dia',
    turno: partial.turno ?? 'Comercial (07h–17h)',
    descricao: partial.descricao ?? 'Obra residencial.',
    skillTags: partial.skillTags,
    competenciasRequeridas: partial.competenciasRequeridas,
    competenciasPreferenciais: partial.competenciasPreferenciais,
    telefoneContato: partial.telefoneContato ?? '(66) 99999-0000',
    status: partial.status ?? 'aberta',
    createdAt: partial.createdAt ?? '2026-11-15',
  };
}

test('inferJobSkillTags extracts accurate tags from role and description when explicit tags are absent', () => {
  const pedreiroTags = inferJobSkillTags({
    funcao: 'Pedreiro',
    descricao: 'Execução de alvenaria estrutural e reboco interno.',
  });
  assert.ok(pedreiroTags.includes('alvenaria'));
  assert.ok(pedreiroTags.includes('acabamento'));

  const eletricaTags = inferJobSkillTags({
    funcao: 'Instalações Elétricas',
    descricao: 'Montagem de QDC e aterramento conforme NBR 5410.',
  });
  assert.deepEqual(eletricaTags, ['elétrica']);

  const pinturaTags = inferJobSkillTags({
    funcao: 'Pintor Predial',
    descricao: 'Pintura de fachada com selador acrílico.',
  });
  assert.deepEqual(pinturaTags, ['pintura']);

  const industrialPrecastTags = inferJobSkillTags({
    funcao: 'Montador de Pré-Moldados',
    descricao: 'Içamento de vigas protendidas e laje alveolar para galpão industrial.',
    competenciasRequeridas: ['Certificado NR-11 e NR-35', 'Plano de rigging'],
  });
  assert.ok(industrialPrecastTags.includes('construções industriais'));
  assert.ok(industrialPrecastTags.includes('pré-moldados'));
  assert.ok(industrialPrecastTags.includes('segurança'));

  const sustainableTags = inferJobSkillTags({
    funcao: 'Especialista em Construções Sustentáveis',
    descricao: 'Montagem de light steel frame, tijolo ecológico e captação pluvial.',
  });
  assert.ok(sustainableTags.includes('construções alternativas e sustentáveis'));
});

test('getJobSkillTags respects explicit normalized skillTags and deduplicates them', () => {
  const job = makeJob({
    funcao: 'Pedreiro',
    skillTags: [' Alvenaria ', 'ACABAMENTO', 'alvenaria'],
  });
  assert.deepEqual(getJobSkillTags(job), ['alvenaria', 'acabamento']);
});

test('toggleSkillTagSelection adds, removes, and normalizes clicked chip tags', () => {
  const step1 = toggleSkillTagSelection([], 'Elétrica');
  assert.deepEqual(step1, ['elétrica']);

  const step2 = toggleSkillTagSelection(step1, 'Alvenaria');
  assert.deepEqual(step2, ['elétrica', 'alvenaria']);

  const step3 = toggleSkillTagSelection(step2, 'elétrica');
  assert.deepEqual(step3, ['alvenaria']);
});

test('filterJobsBySkillTags filters by single and multiple selected skill tags', () => {
  const jobs: JobPosting[] = [
    makeJob({ id: 'j1', funcao: 'Pedreiro', skillTags: ['alvenaria'] }),
    makeJob({ id: 'j2', funcao: 'Instalações Elétricas', skillTags: ['elétrica'] }),
    makeJob({ id: 'j3', funcao: 'Pintor Predial', skillTags: ['pintura', 'acabamento'] }),
  ];

  assert.equal(filterJobsBySkillTags(jobs, []).length, 3);

  const onlyElectrical = filterJobsBySkillTags(jobs, ['elétrica']);
  assert.deepEqual(
    onlyElectrical.map((j) => j.id),
    ['j2']
  );

  const masonryOrPainting = filterJobsBySkillTags(jobs, ['alvenaria', 'pintura']);
  assert.deepEqual(
    masonryOrPainting.map((j) => j.id),
    ['j1', 'j3']
  );
});

test('buildSkillTagSummaries prioritizes core tags and includes industrial, precast, and sustainable specialties', () => {
  const openSeedJobs = SEED_JOBS.filter((j) => j.status === 'aberta');
  const summaries = buildSkillTagSummaries(openSeedJobs, openSeedJobs);

  assert.equal(summaries[0].tag, 'alvenaria');
  assert.equal(summaries[1].tag, 'elétrica');
  assert.equal(summaries[2].tag, 'pintura');

  for (const specialty of SPECIALTY_SKILL_TAGS) {
    assert.ok(CONSTRUCTION_SKILL_TAGS.includes(specialty));
    const found = summaries.find((s) => s.tag === specialty);
    assert.ok(found && found.count >= 1, `Expected open seed jobs for ${specialty}`);
  }

  const electricalSummary = summaries.find((s) => s.tag === 'elétrica');
  assert.ok(electricalSummary && electricalSummary.count >= 3);

  const paintingSummary = summaries.find((s) => s.tag === 'pintura');
  assert.ok(paintingSummary && paintingSummary.count >= 1);

  assert.equal(formatSkillTagLabel('obra e apoio'), 'Obra e apoio');
  assert.equal(formatSkillTagLabel('pré-moldados'), 'Pré-moldados');
  assert.equal(formatSkillTagLabel('construções industriais'), 'Construções industriais');
  assert.equal(
    formatSkillTagLabel('construções alternativas e sustentáveis'),
    'Construções alternativas e sustentáveis'
  );
});

test('parseCompetencyList and formatCompetencyList normalize and deduplicate competency arrays', () => {
  const parsed = parseCompetencyList(
    'NR-11 válida; NR-35 em dia\n• Leitura de plano de rigging, nr-11 válida '
  );
  assert.deepEqual(parsed, [
    'NR-11 válida',
    'NR-35 em dia',
    'Leitura de plano de rigging',
  ]);
  assert.equal(
    formatCompetencyList(parsed),
    'NR-11 válida · NR-35 em dia · Leitura de plano de rigging'
  );
  assert.equal(formatCompetencyList([]), '');
});
