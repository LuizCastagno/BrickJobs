import assert from 'node:assert/strict';
import test from 'node:test';
import type { JobApplication, JobPosting } from '../types/brickjobs';
import {
  buildMonthlyPerformanceSummary,
  formatMonthKeyLabelPtBr,
  getAvailablePerformanceMonths,
  shortenCategoryLabel,
} from './employerPerformance.ts';

const SAMPLE_JOBS: JobPosting[] = [
  {
    id: 'j1',
    companyId: 'my-company',
    companyName: 'Minha Construtora',
    funcao: 'Pedreiro',
    quantidadeVagas: 5,
    bairro: 'Centro',
    regiaoInteresse: 'Centro',
    salarioOuDiaria: 'R$ 200/dia',
    turno: 'Comercial (07h–17h)',
    descricao: 'Alvenaria',
    telefoneContato: '(66) 99999-0001',
    status: 'aberta',
    createdAt: '2026-11-12',
  },
  {
    id: 'j2',
    companyId: 'my-company',
    companyName: 'Minha Construtora',
    funcao: 'Pedreiro',
    quantidadeVagas: 2,
    bairro: 'Vila Aurora',
    regiaoInteresse: 'Vila Aurora',
    salarioOuDiaria: 'R$ 200/dia',
    turno: 'Comercial (07h–17h)',
    descricao: 'Reboco',
    telefoneContato: '(66) 99999-0001',
    status: 'encerrada',
    createdAt: '2026-11-04',
  },
  {
    id: 'j3',
    companyId: 'seed-comp-1',
    companyName: 'Cerrado Sul',
    funcao: 'Servente de Obras',
    quantidadeVagas: 6,
    bairro: 'Cidade Salmen',
    regiaoInteresse: 'Cidade Salmen',
    salarioOuDiaria: 'R$ 140/dia',
    turno: 'Comercial (07h–17h)',
    descricao: 'Apoio',
    telefoneContato: '(66) 99999-0002',
    status: 'aberta',
    createdAt: '2026-11-10',
  },
  {
    id: 'j4',
    companyId: 'my-company',
    companyName: 'Minha Construtora',
    funcao: 'Carpinteiro',
    quantidadeVagas: 3,
    bairro: 'Centro',
    regiaoInteresse: 'Centro',
    salarioOuDiaria: 'R$ 210/dia',
    turno: 'Comercial (07h–17h)',
    descricao: 'Fôrmas',
    telefoneContato: '(66) 99999-0001',
    status: 'encerrada',
    createdAt: '2026-10-20',
  },
];

const SAMPLE_APPS: JobApplication[] = [
  {
    id: 'a1',
    jobId: 'j1',
    workerId: 'w1',
    workerName: 'Carlos',
    appliedAt: '2026-11-13',
    status: 'aceita',
  },
  {
    id: 'a2',
    jobId: 'j1',
    workerId: 'w2',
    workerName: 'Lucas',
    appliedAt: '2026-11-13',
    status: 'pendente',
  },
];

test('formatMonthKeyLabelPtBr formats YYYY-MM into Portuguese month/year', () => {
  assert.equal(formatMonthKeyLabelPtBr('2026-11'), 'Novembro de 2026');
  assert.equal(formatMonthKeyLabelPtBr('2026-01'), 'Janeiro de 2026');
});

test('shortenCategoryLabel keeps mobile axis labels compact and readable', () => {
  assert.equal(shortenCategoryLabel('Pedreiro'), 'Pedreiro');
  assert.equal(shortenCategoryLabel('Servente de Obras'), 'Servente');
  assert.equal(shortenCategoryLabel('Armador de Ferragem'), 'Armador');
});

test('getAvailablePerformanceMonths lists unique months sorted newest first', () => {
  const months = getAvailablePerformanceMonths(SAMPLE_JOBS);
  assert.deepEqual(months, [
    { key: '2026-11', label: 'Novembro de 2026' },
    { key: '2026-10', label: 'Outubro de 2026' },
  ]);
});

test('buildMonthlyPerformanceSummary aggregates open vs filled vacancies by category and month', () => {
  const summary = buildMonthlyPerformanceSummary({
    jobs: SAMPLE_JOBS,
    applications: SAMPLE_APPS,
    monthKey: '2026-11',
  });

  // j1 has 5 slots with 1 accepted => 4 open, 1 filled; j2 is closed (2 filled); j3 => 6 open
  assert.equal(summary.totalAbertas, 10);
  assert.equal(summary.totalPreenchidas, 3);
  assert.equal(summary.fillRatePercent, 23);
  assert.equal(summary.categories.length, 2);

  const pedreiro = summary.categories.find((c) => c.category === 'Pedreiro');
  assert.ok(pedreiro);
  assert.equal(pedreiro.abertas, 4);
  assert.equal(pedreiro.preenchidas, 3);
  assert.equal(pedreiro.fillRate, 43);

  const companyOnly = buildMonthlyPerformanceSummary({
    jobs: SAMPLE_JOBS,
    applications: SAMPLE_APPS,
    monthKey: '2026-11',
    companyId: 'my-company',
  });
  assert.equal(companyOnly.categories.length, 1);
  assert.equal(companyOnly.totalAbertas, 4);
  assert.equal(companyOnly.totalPreenchidas, 3);
});
