/**
 * @file src/utils/employerProfessionalsExport.test.ts
 * @description Testes unitários para geração de CSV e PDF da lista de profissionais registrados da construtora.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRegisteredProfessionalsCsv,
  buildRegisteredProfessionalsExportFilename,
  buildRegisteredProfessionalsPdfData,
  createRegisteredProfessionalsPdfDocument,
  exportRegisteredProfessionalsCsv,
  exportRegisteredProfessionalsPdf,
  sanitizeCsvCell,
} from './employerProfessionalsExport';
import type { RegisteredEmployerProfessional } from './employerProfessionals';
import type { CompanyProfile } from '../types/brickjobs';

const sampleCompany: CompanyProfile = {
  id: 'comp-1',
  nomeFantasia: 'Construtora São José',
  razaoSocial: 'Construtora São José Ltda',
  cnpj: '12.345.678/0001-99',
  responsavel: 'Roberto Almeida',
  telefone: '(66) 99988-1122',
  email: 'contato@saojose.com.br',
  bairro: 'Vila Aurora',
  endereco: 'Av. Lions Internacional, 1200',
  especialidade: 'Obras Residenciais',
  updatedAt: '2026-11-20',
};

const sampleRegistered: RegisteredEmployerProfessional[] = [
  {
    key: 'registered-app-1',
    applicationId: 'app-1',
    workerId: 'w-1',
    nomeCompleto: 'Marcos Antônio Pereira',
    funcaoContratada: 'Pedreiro',
    empresaContratante: 'Construtora São José',
    bairroObra: 'Vila Aurora',
    status: 'aceita',
    statusLabel: 'Registrado · Em serviço',
    appliedAt: '2026-11-14',
    telefone: '(66) 99641-2280',
    resumoProfissional: 'Alvenaria estrutural, reboco e assentamento de pisos.',
    totalExperienceMonths: 24,
    experiencias: [],
  },
  {
    key: 'registered-app-2',
    applicationId: 'app-2',
    workerId: 'w-2',
    nomeCompleto: 'Claudinei Rocha',
    funcaoContratada: 'Armador de Ferragem',
    empresaContratante: 'Construtora São José',
    bairroObra: 'Distrito Industrial',
    status: 'concluida',
    statusLabel: 'Registrado · Serviço concluído',
    appliedAt: '2026-11-01',
    completedAt: '2026-11-12',
    telefone: '(66) 99918-5503',
    totalExperienceMonths: 0,
    experiencias: [],
    pdfFileName: 'claudinei-cv.pdf',
  },
];

test('buildRegisteredProfessionalsExportFilename normalizes accents and includes ISO date', () => {
  const fixedDate = new Date(2026, 10, 21); // 2026-11-21
  assert.equal(
    buildRegisteredProfessionalsExportFilename('Construtora São José', 'csv', fixedDate),
    'profissionais-registrados-construtora-sao-jose-2026-11-21.csv'
  );
  assert.equal(
    buildRegisteredProfessionalsExportFilename('   ', 'pdf', fixedDate),
    'profissionais-registrados-construtora-2026-11-21.pdf'
  );
});

test('sanitizeCsvCell escapes quotes, commas, newlines, and spreadsheet formula prefixes', () => {
  assert.equal(sanitizeCsvCell('Pedreiro, Mestre'), '"Pedreiro, Mestre"');
  assert.equal(sanitizeCsvCell('Nota "A"'), '"Nota ""A"""');
  assert.equal(sanitizeCsvCell('=SUM(A1:A2)'), "'=SUM(A1:A2)");
  assert.equal(sanitizeCsvCell('Linha 1\nLinha 2'), 'Linha 1 Linha 2');
});

test('buildRegisteredProfessionalsCsv includes UTF-8 BOM, headers, and formatted worker rows', () => {
  const csv = buildRegisteredProfessionalsCsv(sampleRegistered);
  assert.ok(csv.startsWith('\uFEFF'), 'CSV must start with UTF-8 BOM');

  const lines = csv.slice(1).split('\r\n');
  assert.equal(lines.length, 3);
  assert.match(lines[0], /^Nome Completo,Função Contratada,Status,/);
  assert.ok(lines[1].includes('Marcos Antônio Pereira'));
  assert.ok(lines[1].includes('2 anos'));
  assert.ok(lines[1].includes('"Alvenaria estrutural, reboco e assentamento de pisos."'));
  assert.ok(lines[2].includes('Claudinei Rocha'));
  assert.ok(lines[2].includes('2026-11-12'));
  assert.ok(lines[2].includes('PDF: claudinei-cv.pdf'));
});

test('buildRegisteredProfessionalsPdfData computes active/completed counters and sanitizes rows', () => {
  const fixedDate = new Date(2026, 10, 21);
  const data = buildRegisteredProfessionalsPdfData(
    sampleCompany,
    sampleRegistered,
    fixedDate
  );

  assert.equal(data.totalRegistered, 2);
  assert.equal(data.activeCount, 1);
  assert.equal(data.completedCount, 1);
  assert.equal(data.items[0].isActive, true);
  assert.equal(data.items[1].isActive, false);
  assert.equal(data.items[1].detailLine, 'Currículo anexado: claudinei-cv.pdf');
});

test('createRegisteredProfessionalsPdfDocument builds multi-item PDF cleanly including pagination', () => {
  const manyWorkers: RegisteredEmployerProfessional[] = Array.from(
    { length: 16 },
    (_, i) => ({
      ...sampleRegistered[i % 2],
      key: `reg-${i}`,
      applicationId: `app-${i}`,
      workerId: `w-${i}`,
      nomeCompleto: `Profissional Teste ${i + 1}`,
    })
  );

  const { doc, fileName, data } = createRegisteredProfessionalsPdfDocument(
    sampleCompany,
    manyWorkers,
    new Date(2026, 10, 21)
  );

  assert.equal(
    fileName,
    'profissionais-registrados-construtora-sao-jose-2026-11-21.pdf'
  );
  assert.equal(data.totalRegistered, 16);
  assert.ok(doc.getNumberOfPages() >= 2);
});

test('export helpers return explicit validation error when registered list is empty', () => {
  const csvRes = exportRegisteredProfessionalsCsv(sampleCompany, []);
  const pdfRes = exportRegisteredProfessionalsPdf(sampleCompany, []);

  assert.equal(csvRes.ok, false);
  assert.equal(pdfRes.ok, false);
  if (!csvRes.ok) {
    assert.match(csvRes.error, /Não há profissionais registrados/);
  }
  if (!pdfRes.ok) {
    assert.match(pdfRes.error, /Não há profissionais registrados/);
  }
});
