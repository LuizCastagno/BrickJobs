import assert from 'node:assert/strict';
import test from 'node:test';
import type { JobPosting } from '../types/brickjobs';
import {
  buildMonthlyVacancyDashboard,
  formatShortMonthLabelPtBr,
} from './employerMonthlyDashboard.ts';

const SAMPLE_JOBS: JobPosting[] = [
  {
    id: 'j-aug-1',
    companyId: 'comp-1',
    companyName: 'Construtora A',
    funcao: 'Pedreiro',
    quantidadeVagas: 6,
    bairro: 'Centro',
    regiaoInteresse: 'Centro',
    salarioOuDiaria: 'R$ 190/dia',
    turno: 'Comercial (07h–17h)',
    descricao: 'Obra residencial',
    telefoneContato: '(66) 99999-0001',
    status: 'encerrada',
    createdAt: '2026-08-14',
  },
  {
    id: 'j-sep-1',
    companyId: 'comp-1',
    companyName: 'Construtora A',
    funcao: 'Servente de Obras',
    quantidadeVagas: 4,
    bairro: 'Vila Aurora',
    regiaoInteresse: 'Vila Aurora',
    salarioOuDiaria: 'R$ 135/dia',
    turno: 'Comercial (07h–17h)',
    descricao: 'Apoio',
    telefoneContato: '(66) 99999-0001',
    status: 'encerrada',
    createdAt: '2026-09-10',
  },
  {
    id: 'j-sep-2',
    companyId: 'comp-2',
    companyName: 'Construtora B',
    funcao: 'Eletricista Predial',
    quantidadeVagas: 2,
    bairro: 'Jardim Primavera',
    regiaoInteresse: 'Jardim Primavera',
    salarioOuDiaria: 'R$ 3.800/mês',
    turno: 'Comercial (07h–17h)',
    descricao: 'Infraestrutura elétrica',
    telefoneContato: '(66) 99999-0002',
    status: 'aberta',
    createdAt: '2026-09-22',
  },
  {
    id: 'j-nov-1',
    companyId: 'comp-1',
    companyName: 'Construtora A',
    funcao: 'Instalações Elétricas',
    quantidadeVagas: 5,
    bairro: 'Distrito Industrial',
    regiaoInteresse: 'Distrito Industrial',
    salarioOuDiaria: 'R$ 230/dia',
    turno: 'Comercial (07h–17h)',
    descricao: 'QDC e circuitos',
    telefoneContato: '(66) 99999-0001',
    status: 'aberta',
    createdAt: '2026-11-12',
  },
  {
    id: 'j-nov-2',
    companyId: 'comp-1',
    companyName: 'Construtora A',
    funcao: 'Mestre de Obras',
    quantidadeVagas: 3,
    bairro: 'Centro',
    regiaoInteresse: 'Centro',
    salarioOuDiaria: 'R$ 5.800/mês',
    turno: 'Comercial (07h–17h)',
    descricao: 'Coordenação',
    telefoneContato: '(66) 99999-0001',
    status: 'encerrada',
    createdAt: '2026-11-04',
  },
];

test('formatShortMonthLabelPtBr formats YYYY-MM into compact Portuguese label', () => {
  assert.equal(formatShortMonthLabelPtBr('2026-08'), 'Ago/26');
  assert.equal(formatShortMonthLabelPtBr('2026-11'), 'Nov/26');
  assert.equal(formatShortMonthLabelPtBr('invalid'), 'invalid');
});

test('buildMonthlyVacancyDashboard aggregates open vs closed vacancies chronologically by month', () => {
  const summary = buildMonthlyVacancyDashboard({ jobs: SAMPLE_JOBS });

  assert.equal(summary.months.length, 3);
  assert.deepEqual(
    summary.months.map((m) => m.monthKey),
    ['2026-08', '2026-09', '2026-11']
  );

  // August: 0 open, 6 closed
  assert.equal(summary.months[0].shortMonthLabel, 'Ago/26');
  assert.equal(summary.months[0].abertas, 0);
  assert.equal(summary.months[0].encerradas, 6);
  assert.equal(summary.months[0].taxaEncerramentoPercent, 100);

  // September: 2 open, 4 closed
  assert.equal(summary.months[1].abertas, 2);
  assert.equal(summary.months[1].encerradas, 4);
  assert.equal(summary.months[1].taxaEncerramentoPercent, 67);

  // November: 5 open, 3 closed
  assert.equal(summary.months[2].abertas, 5);
  assert.equal(summary.months[2].encerradas, 3);
  assert.equal(summary.months[2].taxaEncerramentoPercent, 38);

  // Totals: 7 open, 13 closed, 20 total -> 65% closed
  assert.equal(summary.totalAbertas, 7);
  assert.equal(summary.totalEncerradas, 13);
  assert.equal(summary.totalVagas, 20);
  assert.equal(summary.taxaEncerramentoPercent, 65);
});

test('buildMonthlyVacancyDashboard filters accurately by companyId and handles maxMonths', () => {
  const companySummary = buildMonthlyVacancyDashboard({
    jobs: SAMPLE_JOBS,
    companyId: 'comp-1',
  });

  assert.equal(companySummary.months.length, 3);
  assert.equal(companySummary.totalAbertas, 5);
  assert.equal(companySummary.totalEncerradas, 13);

  const limited = buildMonthlyVacancyDashboard({
    jobs: SAMPLE_JOBS,
    maxMonths: 2,
  });
  assert.deepEqual(
    limited.months.map((m) => m.monthKey),
    ['2026-09', '2026-11']
  );

  const empty = buildMonthlyVacancyDashboard({
    jobs: SAMPLE_JOBS,
    companyId: 'non-existent',
  });
  assert.equal(empty.months.length, 0);
  assert.equal(empty.totalVagas, 0);
});
