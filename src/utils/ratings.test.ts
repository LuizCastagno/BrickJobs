import test from 'node:test';
import assert from 'node:assert/strict';
import type { CompanyRating, JobApplication, JobPosting } from '../types/brickjobs';
import {
  canCompleteWork,
  canRateCompanyForApplication,
  computeCompanyRatingSummary,
  createCompanyRating,
  formatRatingSummaryLabel,
  isValidStarRating,
} from './ratings';

const sampleJob: JobPosting = {
  id: 'job-1',
  companyId: 'comp-1',
  companyName: 'Construtora Cerrado Sul',
  funcao: 'Pedreiro',
  quantidadeVagas: 2,
  bairro: 'Vila Aurora',
  regiaoInteresse: 'Vila Aurora',
  salarioOuDiaria: 'R$ 200/dia',
  turno: 'Comercial (07h–17h)',
  descricao: 'Alvenaria estrutural.',
  telefoneContato: '(66) 99999-0000',
  status: 'aberta',
  createdAt: '2026-11-10',
};

const acceptedApp: JobApplication = {
  id: 'app-1',
  jobId: 'job-1',
  workerId: 'worker-1',
  workerName: 'João Carlos',
  appliedAt: '2026-11-11',
  status: 'aceita',
};

const completedApp: JobApplication = {
  ...acceptedApp,
  status: 'concluida',
};

test('isValidStarRating validates integers 1 through 5 only', () => {
  assert.equal(isValidStarRating(1), true);
  assert.equal(isValidStarRating(5), true);
  assert.equal(isValidStarRating(0), false);
  assert.equal(isValidStarRating(6), false);
  assert.equal(isValidStarRating(3.5), false);
});

test('canCompleteWork and canRateCompanyForApplication enforce workflow transitions', () => {
  assert.equal(canCompleteWork(acceptedApp), true);
  assert.equal(canCompleteWork(completedApp), false);
  assert.equal(canRateCompanyForApplication(acceptedApp, []), false);
  assert.equal(canRateCompanyForApplication(completedApp, []), true);
});

test('createCompanyRating rejects uncompleted jobs, duplicate ratings, and invalid stars', () => {
  const notCompleted = createCompanyRating({
    application: acceptedApp,
    job: sampleJob,
    stars: 5,
    existingRatings: [],
  });
  assert.equal(notCompleted.ok, false);

  const badStars = createCompanyRating({
    application: completedApp,
    job: sampleJob,
    stars: 0,
    existingRatings: [],
  });
  assert.equal(badStars.ok, false);

  const created = createCompanyRating({
    application: completedApp,
    job: sampleJob,
    stars: 5,
    comment: '  Pagamento pontual e obra organizada.  ',
    existingRatings: [],
    now: new Date('2026-11-14T12:00:00.000Z'),
  });
  assert.equal(created.ok, true);
  if (created.ok) {
    assert.equal(created.rating.stars, 5);
    assert.equal(created.rating.comment, 'Pagamento pontual e obra organizada.');
    assert.equal(created.rating.createdAt, '2026-11-14');

    const duplicate = createCompanyRating({
      application: completedApp,
      job: sampleJob,
      stars: 4,
      existingRatings: [created.rating],
    });
    assert.equal(duplicate.ok, false);
  }
});

test('computeCompanyRatingSummary computes average, count, distribution, and labels', () => {
  const ratings: CompanyRating[] = [
    {
      id: 'r1',
      applicationId: 'a1',
      companyId: 'comp-1',
      companyName: 'Construtora Cerrado Sul',
      jobId: 'job-1',
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
      companyName: 'Construtora Cerrado Sul',
      jobId: 'job-2',
      jobRole: 'Servente',
      workerId: 'w2',
      workerName: 'Lucas',
      stars: 4,
      createdAt: '2026-11-12',
    },
  ];

  const summary = computeCompanyRatingSummary(ratings, 'comp-1');
  assert.equal(summary.average, 4.5);
  assert.equal(summary.count, 2);
  assert.equal(summary.formattedAverage, '4,5');
  assert.equal(summary.distribution[5], 1);
  assert.equal(summary.distribution[4], 1);
  assert.equal(formatRatingSummaryLabel(summary), '4,5 (2 avaliações)');

  const emptySummary = computeCompanyRatingSummary(ratings, 'comp-unknown');
  assert.equal(emptySummary.count, 0);
  assert.equal(formatRatingSummaryLabel(emptySummary), 'Sem avaliações ainda');
});
