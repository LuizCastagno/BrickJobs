import test from 'node:test';
import assert from 'node:assert/strict';
import { SEED_COMPANY_RATINGS, SEED_JOBS } from '../data/rondonopolisSeed';
import type { CompanyRating } from '../types/brickjobs';
import {
  buildFeaturedCompaniesSummary,
  formatRatingDecimalPtBr,
  shortenCompanyLabel,
} from './featuredCompanies';

test('formatRatingDecimalPtBr and shortenCompanyLabel format values cleanly', () => {
  assert.equal(formatRatingDecimalPtBr(4.7), '4,7');
  assert.equal(formatRatingDecimalPtBr(5), '5,0');
  assert.equal(formatRatingDecimalPtBr(0), '0,0');

  assert.equal(shortenCompanyLabel('Pantanal Edificações', 22), 'Pantanal Edificações');
  assert.equal(
    shortenCompanyLabel('Engenharia Mato Grosso Ltda'),
    'Engenharia Mato G…'
  );
});

test('buildFeaturedCompaniesSummary aggregates seed ratings and sorts by average or count', () => {
  const byNota = buildFeaturedCompaniesSummary({
    ratings: SEED_COMPANY_RATINGS,
    jobs: SEED_JOBS,
    sortBy: 'nota',
  });

  assert.equal(byNota.totalRatings, 7);
  assert.equal(byNota.companies.length, 4);
  assert.equal(byNota.topRatedCompany?.companyName, 'Engenharia Mato Grosso Ltda');
  assert.equal(byNota.topRatedCompany?.averageRating, 5.0);
  assert.equal(byNota.mostReviewedCompany?.companyName, 'Construtora Cerrado Sul');
  assert.equal(byNota.mostReviewedCompany?.ratingsCount, 3);
  assert.equal(byNota.mostReviewedCompany?.averageRating, 4.7);
  assert.equal(byNota.mostReviewedCompany?.formattedAverage, '4,7');

  const byAvaliacoes = buildFeaturedCompaniesSummary({
    ratings: SEED_COMPANY_RATINGS,
    jobs: SEED_JOBS,
    sortBy: 'avaliacoes',
  });

  assert.equal(byAvaliacoes.companies[0].companyName, 'Construtora Cerrado Sul');
  assert.equal(byAvaliacoes.companies[0].openJobsCount, 4);
  assert.ok(byAvaliacoes.companies[0].neighborhoods.includes('Vila Aurora'));
});

test('buildFeaturedCompaniesSummary merges matching company names and updates live with new ratings', () => {
  const extraRatings: CompanyRating[] = [
    ...SEED_COMPANY_RATINGS,
    {
      id: 'rating-live-1',
      applicationId: 'app-live-1',
      companyId: 'alt-comp-3',
      companyName: 'Rondonópolis Obras & Infra',
      jobId: 'job-roo-7',
      jobRole: 'Manutenção de Redes Elétricas',
      workerId: 'worker-live',
      workerName: 'Carlos Eduardo',
      stars: 5,
      comment: 'Excelente organização e pagamento antecipado.',
      createdAt: '2026-11-24',
    },
  ];

  const summary = buildFeaturedCompaniesSummary({
    ratings: extraRatings,
    jobs: SEED_JOBS,
    sortBy: 'nota',
  });

  const infra = summary.companies.find(
    (c) => c.companyName === 'Rondonópolis Obras & Infra'
  );
  assert.ok(infra);
  assert.equal(infra.ratingsCount, 2);
  assert.equal(infra.averageRating, 4.5);
  assert.equal(infra.latestComment, 'Excelente organização e pagamento antecipado.');
});

test('buildFeaturedCompaniesSummary handles empty or invalid ratings gracefully', () => {
  const empty = buildFeaturedCompaniesSummary({
    ratings: [
      {
        id: 'bad-1',
        applicationId: 'app-bad',
        companyId: 'c1',
        companyName: 'Empresa X',
        jobId: 'j1',
        jobRole: 'Pedreiro',
        workerId: 'w1',
        workerName: 'João',
        stars: 0,
        createdAt: '2026-11-24',
      },
    ],
    jobs: SEED_JOBS,
  });

  assert.equal(empty.totalRatings, 0);
  assert.equal(empty.companies.length, 0);
  assert.equal(empty.topRatedCompany, null);
});
