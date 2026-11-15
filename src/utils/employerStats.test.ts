import assert from 'node:assert/strict';
import test from 'node:test';
import { SEED_COMPANY_RATINGS, SEED_JOBS } from '../data/rondonopolisSeed.ts';
import type { CompanyRating, JobPosting } from '../types/brickjobs';
import {
  buildCategoryFillTimeStats,
  buildCategoryRatingStats,
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
