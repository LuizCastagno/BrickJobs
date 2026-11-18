import assert from 'node:assert/strict';
import test from 'node:test';
import type { CompanyProfile, CompanyRating, JobPosting } from '../types/brickjobs';
import {
  buildEmployerReportPdfData,
  buildEmployerReportPdfFilename,
  createEmployerReportPdfDocument,
} from './employerReportPdf.ts';

test('buildEmployerReportPdfFilename generates clean filenames', () => {
  assert.equal(
    buildEmployerReportPdfFilename('Construtora Cerrado Sul Ltda.'),
    'relatorio-desempenho-construtora-cerrado-sul-ltda-brickjobs.pdf'
  );
});

test('buildEmployerReportPdfData aggregates job stats and ratings accurately', () => {
  const sampleCompany: CompanyProfile = {
    id: 'comp-1',
    nomeFantasia: 'Construtora Exemplo',
    razaoSocial: 'Exemplo S.A.',
    cnpj: '12.345.678/0001-90',
    telefone: '(66) 99999-1111',
    email: 'contato@exemplo.com',
    bairro: 'Vila Aurora',
    endereco: 'Av. Brasil, 100',
    especialidade: 'Alvenaria',
    responsavel: 'Carlos',
    documentosAnexos: {},
    updatedAt: '2026-11-17',
  };

  const sampleJobs: JobPosting[] = [
    {
      id: 'j1',
      companyId: 'comp-1',
      companyName: 'Construtora Exemplo',
      funcao: 'Pedreiro',
      quantidadeVagas: 3,
      bairro: 'Vila Aurora',
      regiaoInteresse: 'Vila Aurora',
      salarioOuDiaria: 'R$ 195/dia',
      turno: 'Comercial',
      descricao: 'Alvenaria',
      telefoneContato: '(66) 99999-1111',
      status: 'encerrada',
      createdAt: '2026-11-01',
      closedAt: '2026-11-04',
    },
    {
      id: 'j2',
      companyId: 'comp-1',
      companyName: 'Construtora Exemplo',
      funcao: 'Eletricista Predial',
      quantidadeVagas: 2,
      bairro: 'Centro',
      regiaoInteresse: 'Centro',
      salarioOuDiaria: 'R$ 3.900/mês',
      turno: 'Comercial',
      descricao: 'Elétrica',
      telefoneContato: '(66) 99999-1111',
      status: 'aberta',
      createdAt: '2026-11-10',
    },
  ];

  const sampleRatings: CompanyRating[] = [
    {
      id: 'r1',
      applicationId: 'a1',
      companyId: 'comp-1',
      companyName: 'Construtora Exemplo',
      jobId: 'j1',
      jobRole: 'Pedreiro',
      workerId: 'w1',
      workerName: 'Marcos',
      stars: 5,
      createdAt: '2026-11-05',
    },
  ];

  const data = buildEmployerReportPdfData(sampleCompany, sampleJobs, sampleRatings);
  assert.equal(data.companyName, 'Construtora Exemplo');
  assert.equal(data.totalJobs, 2);
  assert.equal(data.openJobs, 1);
  assert.equal(data.closedJobs, 1);
  assert.equal(data.totalVacanciesFilled, 3);
  assert.equal(data.totalRatings, 1);
  assert.equal(data.overallRating, 5);
  assert.equal(data.completedJobsList.length, 1);
  assert.equal(data.completedJobsList[0].funcao, 'Pedreiro');

  const { doc, fileName } = createEmployerReportPdfDocument(
    sampleCompany,
    sampleJobs,
    sampleRatings
  );
  assert.ok(doc);
  assert.ok(fileName.endsWith('.pdf'));
  assert.ok(doc.getNumberOfPages() >= 1);
});
