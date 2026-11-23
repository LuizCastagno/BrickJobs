import assert from 'node:assert/strict';
import test from 'node:test';
import { SEED_COMPANY_RATINGS, SEED_JOBS } from '../data/rondonopolisSeed.ts';
import type { CompanyRating, JobApplication, JobPosting } from '../types/brickjobs';
import {
  buildCategoryFillTimeStats,
  buildCategoryOpenVsClosedStats,
  buildCategoryRatingStats,
  buildMonthlyFinalizedHiringsHistory,
  computeFillTimeDays,
  mapRoleToServiceCategory,
} from './employerStats.ts';

test('mapRoleToServiceCategory groups construction roles into clean service categories', () => {
  assert.equal(mapRoleToServiceCategory('Pedreiro'), 'Alvenaria');
  assert.equal(mapRoleToServiceCategory('Instalações Elétricas'), 'Elétrica e Redes');
  assert.equal(mapRoleToServiceCategory('Manutenção de Redes Elétricas'), 'Elétrica e Redes');
  assert.equal(mapRoleToServiceCategory('Pintor Predial'), 'Pintura e Acabamento');
  assert.equal(mapRoleToServiceCategory('Armador de Ferragem'), 'Ferragem e Estrutura');
  assert.equal(mapRoleToServiceCategory('Servente de Obras'), 'Apoio de Obras');
});

test('computeFillTimeDays calculates positive fill durations and rejects invalid dates', () => {
  assert.equal(computeFillTimeDays('2026-11-01', '2026-11-05'), 4);
  assert.equal(computeFillTimeDays('2026-11-10', '2026-11-10'), 1);
  assert.equal(computeFillTimeDays('2026-11-10', '2026-11-05'), null);
  assert.equal(computeFillTimeDays('2026-11-10', undefined), null);
});

test('buildCategoryRatingStats computes overall and per-category averages accurately', () => {
  const sampleRatings: CompanyRating[] = [
    {
      id: 'r1',
      applicationId: 'a1',
      companyId: 'comp-1',
      companyName: 'Construtora A',
      jobId: 'j1',
      jobRole: 'Pedreiro',
      workerId: 'w1',
      workerName: 'Marcos',
      stars: 5,
      createdAt: '2026-11-10',
    },
    {
      id: 'r2',
      applicationId: 'a2',
      companyId: 'comp-1',
      companyName: 'Construtora A',
      jobId: 'j2',
      jobRole: 'Mestre de Obras',
      workerId: 'w2',
      workerName: 'João',
      stars: 4,
      createdAt: '2026-11-12',
    },
    {
      id: 'r3',
      applicationId: 'a3',
      companyId: 'comp-2',
      companyName: 'Construtora B',
      jobId: 'j3',
      jobRole: 'Instalações Elétricas',
      workerId: 'w3',
      workerName: 'Lucas',
      stars: 3,
      createdAt: '2026-11-11',
    },
  ];

  const all = buildCategoryRatingStats({ ratings: sampleRatings });
  assert.equal(all.totalRatings, 3);
  assert.equal(all.overallAverage, 4);
  assert.equal(all.formattedOverallAverage, '4,0');
  assert.equal(all.satisfiedSharePercent, 67);
  assert.equal(all.byCategory[0].category, 'Alvenaria');
  assert.equal(all.byCategory[0].averageRating, 4.5);
  assert.equal(all.byCategory[0].count, 2);

  const scoped = buildCategoryRatingStats({
    ratings: sampleRatings,
    companyId: 'comp-1',
  });
  assert.equal(scoped.totalRatings, 2);
  assert.equal(scoped.overallAverage, 4.5);
});

test('buildCategoryFillTimeStats computes average fill days per service category and handles seed data', () => {
  const sampleJobs: JobPosting[] = [
    {
      id: 'j1',
      companyId: 'comp-1',
      companyName: 'Construtora A',
      funcao: 'Servente de Obras',
      quantidadeVagas: 5,
      bairro: 'Centro',
      regiaoInteresse: 'Centro',
      salarioOuDiaria: 'R$ 135/dia',
      turno: 'Comercial',
      descricao: 'Apoio',
      telefoneContato: '(66) 99999-0001',
      status: 'encerrada',
      createdAt: '2026-11-01',
      closedAt: '2026-11-03', // 2 days
    },
    {
      id: 'j2',
      companyId: 'comp-1',
      companyName: 'Construtora A',
      funcao: 'Instalações Elétricas',
      quantidadeVagas: 2,
      bairro: 'Centro',
      regiaoInteresse: 'Centro',
      salarioOuDiaria: 'R$ 230/dia',
      turno: 'Comercial',
      descricao: 'Quadros elétricos',
      telefoneContato: '(66) 99999-0001',
      status: 'encerrada',
      createdAt: '2026-11-01',
      closedAt: '2026-11-07', // 6 days
    },
    {
      id: 'j3',
      companyId: 'comp-1',
      companyName: 'Construtora A',
      funcao: 'Pedreiro',
      quantidadeVagas: 3,
      bairro: 'Centro',
      regiaoInteresse: 'Centro',
      salarioOuDiaria: 'R$ 195/dia',
      turno: 'Comercial',
      descricao: 'Alvenaria',
      telefoneContato: '(66) 99999-0001',
      status: 'aberta',
      createdAt: '2026-11-10',
    },
  ];

  const stats = buildCategoryFillTimeStats({ jobs: sampleJobs });
  assert.equal(stats.totalClosedPostings, 2);
  assert.equal(stats.totalClosedVacancies, 7);
  assert.equal(stats.overallAverageDays, 4);
  assert.equal(stats.fastestCategory?.category, 'Apoio de Obras');
  assert.equal(stats.fastestCategory?.averageDays, 2);

  // Verify real seed dataset yields rich multi-category stats
  const seedRatings = buildCategoryRatingStats({ ratings: SEED_COMPANY_RATINGS });
  const seedFillTimes = buildCategoryFillTimeStats({ jobs: SEED_JOBS });
  assert.ok(seedRatings.byCategory.length >= 4);
  assert.ok(seedFillTimes.byCategory.length >= 4);
});

test('buildCategoryOpenVsClosedStats compares open vs closed vacancies per category accurately', () => {
  const sampleJobs: JobPosting[] = [
    {
      id: 'j1',
      companyId: 'comp-1',
      companyName: 'Construtora A',
      funcao: 'Pedreiro',
      quantidadeVagas: 4,
      bairro: 'Centro',
      regiaoInteresse: 'Centro',
      salarioOuDiaria: 'R$ 195/dia',
      turno: 'Comercial',
      descricao: 'Alvenaria',
      telefoneContato: '(66) 99999-0001',
      status: 'aberta',
      createdAt: '2026-11-10',
    },
    {
      id: 'j2',
      companyId: 'comp-1',
      companyName: 'Construtora A',
      funcao: 'Pedreiro',
      quantidadeVagas: 2,
      bairro: 'Centro',
      regiaoInteresse: 'Centro',
      salarioOuDiaria: 'R$ 195/dia',
      turno: 'Comercial',
      descricao: 'Alvenaria',
      telefoneContato: '(66) 99999-0001',
      status: 'encerrada',
      createdAt: '2026-11-01',
      closedAt: '2026-11-05',
    },
    {
      id: 'j3',
      companyId: 'comp-2',
      companyName: 'Construtora B',
      funcao: 'Eletricista Predial',
      quantidadeVagas: 3,
      bairro: 'Centro',
      regiaoInteresse: 'Centro',
      salarioOuDiaria: 'R$ 3.900/mês',
      turno: 'Comercial',
      descricao: 'Elétrica',
      telefoneContato: '(66) 99999-0002',
      status: 'aberta',
      createdAt: '2026-11-12',
    },
  ];

  const results = buildCategoryOpenVsClosedStats({ jobs: sampleJobs });
  const alvenaria = results.find((r) => r.category === 'Alvenaria');
  assert.ok(alvenaria);
  assert.equal(alvenaria.abertas, 4);
  assert.equal(alvenaria.encerradas, 2);
  assert.equal(alvenaria.total, 6);

  const eletrica = results.find((r) => r.category === 'Elétrica e Redes');
  assert.ok(eletrica);
  assert.equal(eletrica.abertas, 3);
  assert.equal(eletrica.encerradas, 0);

  const scoped = buildCategoryOpenVsClosedStats({ jobs: sampleJobs, companyId: 'comp-2' });
  assert.equal(scoped.length, 1);
  assert.equal(scoped[0].category, 'Elétrica e Redes');
});

test('buildMonthlyFinalizedHiringsHistory returns last 6 consecutive months and merges closed jobs with completed applications without double counting', () => {
  const referenceDate = new Date(2026, 10, 23); // Nov 23, 2026 -> Jun/26 .. Nov/26
  const sampleJobs: JobPosting[] = [
    {
      id: 'j-closed-oct',
      companyId: 'comp-1',
      companyName: 'Construtora A',
      funcao: 'Pedreiro',
      quantidadeVagas: 3,
      bairro: 'Centro',
      regiaoInteresse: 'Centro',
      salarioOuDiaria: 'R$ 200/dia',
      turno: 'Comercial',
      descricao: 'Alvenaria',
      telefoneContato: '(66) 99999-0001',
      status: 'encerrada',
      createdAt: '2026-10-02',
      closedAt: '2026-10-12',
    },
    {
      id: 'j-open-nov',
      companyId: 'comp-1',
      companyName: 'Construtora A',
      funcao: 'Servente de Obras',
      quantidadeVagas: 4,
      bairro: 'Vila Aurora',
      regiaoInteresse: 'Vila Aurora',
      salarioOuDiaria: 'R$ 135/dia',
      turno: 'Comercial',
      descricao: 'Apoio',
      telefoneContato: '(66) 99999-0001',
      status: 'aberta',
      createdAt: '2026-11-01',
    },
    {
      id: 'j-other-comp',
      companyId: 'comp-2',
      companyName: 'Construtora B',
      funcao: 'Pintor Predial',
      quantidadeVagas: 5,
      bairro: 'Centro',
      regiaoInteresse: 'Centro',
      salarioOuDiaria: 'R$ 180/dia',
      turno: 'Comercial',
      descricao: 'Pintura',
      telefoneContato: '(66) 99999-0002',
      status: 'encerrada',
      createdAt: '2026-09-05',
      closedAt: '2026-09-10',
    },
  ];

  const sampleApps: JobApplication[] = [
    // Completed on closed job j-closed-oct (already counted in 3 vacancies)
    {
      id: 'a-1',
      jobId: 'j-closed-oct',
      workerId: 'w-1',
      workerName: 'Marcos',
      appliedAt: '2026-10-03',
      completedAt: '2026-10-12',
      status: 'concluida',
    },
    // Completed on open job j-open-nov (adds 1 finalized hiring in Nov)
    {
      id: 'a-2',
      jobId: 'j-open-nov',
      workerId: 'w-2',
      workerName: 'Claudinei',
      appliedAt: '2026-11-05',
      completedAt: '2026-11-18',
      status: 'concluida',
    },
    // Active accepted (not finalized yet) should NOT count
    {
      id: 'a-3',
      jobId: 'j-open-nov',
      workerId: 'w-3',
      workerName: 'João',
      appliedAt: '2026-11-10',
      status: 'aceita',
    },
  ];

  const companyHistory = buildMonthlyFinalizedHiringsHistory({
    jobs: sampleJobs,
    applications: sampleApps,
    companyId: 'comp-1',
    referenceDate,
  });

  assert.equal(companyHistory.months.length, 6);
  assert.deepEqual(
    companyHistory.months.map((m) => m.monthKey),
    ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11']
  );
  assert.deepEqual(
    companyHistory.months.map((m) => m.shortMonthLabel),
    ['Jun/26', 'Jul/26', 'Ago/26', 'Set/26', 'Out/26', 'Nov/26']
  );
  assert.equal(companyHistory.months[4].finalizadas, 3); // Oct: 3 (not 4)
  assert.equal(companyHistory.months[5].finalizadas, 1); // Nov: 1 completed app
  assert.equal(companyHistory.totalFinalized, 4);
  assert.equal(companyHistory.peakMonth?.monthKey, '2026-10');

  // Verify regional seed data produces rich multi-month history
  const seedHistory = buildMonthlyFinalizedHiringsHistory({
    jobs: SEED_JOBS,
    applications: [],
    referenceDate,
  });
  assert.equal(seedHistory.months.length, 6);
  assert.ok(seedHistory.totalFinalized > 0);
  assert.ok(seedHistory.months[2].finalizadas > 0); // Aug/26
  assert.ok(seedHistory.months[3].finalizadas > 0); // Set/26
  assert.ok(seedHistory.months[4].finalizadas > 0); // Out/26
  assert.ok(seedHistory.months[5].finalizadas > 0); // Nov/26
});
