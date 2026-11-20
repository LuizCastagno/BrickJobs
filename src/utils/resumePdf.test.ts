import test from 'node:test';
import assert from 'node:assert/strict';
import type { WorkerProfile } from '../types/brickjobs';
import {
  buildResumePdfData,
  buildResumePdfFilename,
  canGenerateDraftResumePdf,
  generateWorkerResumePdfBuffer,
  prepareWorkerDraftForPdf,
} from './resumePdf';

const sampleWorker: WorkerProfile = {
  id: 'w-test-1',
  nomeCompleto: 'João Carlos da Silva',
  telefone: '(66) 99911-2233',
  email: 'joao.pedreiro@exemplo.com.br',
  bairro: 'Vila Aurora',
  cidade: 'Rondonópolis - MT',
  regiaoInteresse: 'Toda Rondonópolis e Região',
  funcaoPrincipal: 'Pedreiro',
  disponibilidade: 'Imediata',
  tipoHistorico: 'experiencias',
  pdfCurriculo: null,
  experiencias: [
    {
      id: 'exp-1',
      empresaLocal: 'Construtora Cerrado Sul · Rondonópolis-MT',
      funcao: 'Pedreiro de Alvenaria',
      dataInicio: '2023-01',
      dataFim: '2024-12',
      atual: false,
      atividades: 'Alvenaria estrutural e reboco interno.',
    },
    {
      id: 'exp-2',
      empresaLocal: 'Obras Pantanal · Vila Operária',
      funcao: 'Azulejista',
      dataInicio: '2025-01',
      dataFim: '2025-06',
      atual: false,
      atividades: 'Assentamento de porcelanato e acabamento.',
    },
  ],
  resumoProfissional: 'Possuo ferramentas próprias e CNH B.',
  updatedAt: '2026-11-14',
};

test('buildResumePdfFilename creates clean ASCII slugged PDF filename', () => {
  assert.equal(
    buildResumePdfFilename('João Carlos da Silva'),
    'curriculo-joao-carlos-da-silva-brickjobs.pdf'
  );
  assert.equal(buildResumePdfFilename('   '), 'curriculo-profissional-brickjobs.pdf');
});

test('buildResumePdfData aggregates total duration and formats experiences accurately', () => {
  const data = buildResumePdfData(sampleWorker, new Date('2026-11-14T15:00:00.000Z'));
  assert.equal(data.fullName, 'João Carlos da Silva');
  assert.equal(data.primaryRole, 'Pedreiro');
  assert.equal(data.totalMonths, 30);
  assert.equal(data.totalDurationLabel, '2 anos e 6 meses');
  assert.equal(data.experiences.length, 2);
  assert.equal(data.experiences[0].duracaoLabel, '2 anos');
  assert.equal(data.experiences[1].duracaoLabel, '6 meses');
});

test('generateWorkerResumePdfBuffer outputs valid binary PDF starting with %PDF-', () => {
  const result = generateWorkerResumePdfBuffer(
    sampleWorker,
    new Date('2026-11-14T15:00:00.000Z')
  );
  assert.equal(result.fileName, 'curriculo-joao-carlos-da-silva-brickjobs.pdf');
  assert.ok(result.bytes.length > 1000, 'Expected non-empty PDF buffer');
  assert.equal(result.pageCount, 1);

  const header = new TextDecoder().decode(result.bytes.slice(0, 5));
  assert.equal(header, '%PDF-');
});

test('canGenerateDraftResumePdf rejects empty name and accepts valid draft', () => {
  const invalid = canGenerateDraftResumePdf({ nomeCompleto: '   ' });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.error.length > 0);

  const valid = canGenerateDraftResumePdf({ nomeCompleto: '  Carlos Souza  ' });
  assert.equal(valid.valid, true);
});

test('prepareWorkerDraftForPdf drops blank draft experiences and sanitizes filled entries', () => {
  const draft: WorkerProfile = {
    ...sampleWorker,
    nomeCompleto: '  Carlos Souza  ',
    telefone: '  (66) 99900-1122 ',
    resumoProfissional: '  Experiência em obras comerciais.  ',
    experiencias: [
      {
        id: 'empty-row',
        empresaLocal: '   ',
        funcao: '',
        dataInicio: '2025-01',
        dataFim: '',
        atual: true,
        atividades: '   ',
      },
      {
        id: 'filled-row',
        empresaLocal: '  Obra Centro  ',
        funcao: '  Pedreiro  ',
        dataInicio: '2024-01',
        dataFim: '2024-12',
        atual: false,
        atividades: '  Alvenaria e contrapiso  ',
      },
    ],
  };

  const prepared = prepareWorkerDraftForPdf(draft);
  assert.equal(prepared.nomeCompleto, 'Carlos Souza');
  assert.equal(prepared.telefone, '(66) 99900-1122');
  assert.equal(prepared.resumoProfissional, 'Experiência em obras comerciais.');
  assert.equal(prepared.experiencias.length, 1);
  assert.equal(prepared.experiencias[0].empresaLocal, 'Obra Centro');
  assert.equal(prepared.experiencias[0].funcao, 'Pedreiro');
  assert.equal(prepared.experiencias[0].atividades, 'Alvenaria e contrapiso');

  const pdf = generateWorkerResumePdfBuffer(prepared, new Date('2026-11-14T15:00:00.000Z'));
  assert.equal(pdf.fileName, 'curriculo-carlos-souza-brickjobs.pdf');
  assert.equal(new TextDecoder().decode(pdf.bytes.slice(0, 5)), '%PDF-');
});
