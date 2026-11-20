/**
 * @file src/utils/jobPriority.test.ts
 * @description Testes unitários para normalização, ordenação, filtragem e metadados de
 *   prioridade e urgência das vagas do BrickJobs.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import type { JobPosting } from '../types/brickjobs';
import {
  countUrgentJobs,
  filterJobsByUrgency,
  getJobPriorityMeta,
  getJobPriorityRank,
  isHighlightedPriorityJob,
  isUrgentJob,
  JOB_PRIORITY_OPTIONS,
  normalizeJobPriority,
  sortJobsByPriority,
} from './jobPriority';

function makeJob(overrides: Partial<JobPosting>): JobPosting {
  return {
    id: 'job-1',
    companyId: 'comp-1',
    companyName: 'Construtora Exemplo',
    funcao: 'Pedreiro',
    quantidadeVagas: 2,
    bairro: 'Centro',
    regiaoInteresse: 'Centro',
    salarioOuDiaria: 'R$ 200/dia',
    turno: 'Comercial (07h–17h)',
    descricao: 'Obra residencial.',
    telefoneContato: '(66) 99999-0000',
    status: 'aberta',
    createdAt: '2026-11-12',
    ...overrides,
  };
}

test('JOB_PRIORITY_OPTIONS exposes normal, alta, and urgente tiers', () => {
  assert.deepEqual(JOB_PRIORITY_OPTIONS, ['normal', 'alta', 'urgente']);
});

test('normalizeJobPriority handles valid, mixed-case, and legacy undefined values', () => {
  assert.equal(normalizeJobPriority('urgente'), 'urgente');
  assert.equal(normalizeJobPriority(' URGENTE '), 'urgente');
  assert.equal(normalizeJobPriority('alta'), 'alta');
  assert.equal(normalizeJobPriority('ALTA'), 'alta');
  assert.equal(normalizeJobPriority('normal'), 'normal');
  assert.equal(normalizeJobPriority(undefined), 'normal');
  assert.equal(normalizeJobPriority(null), 'normal');
  assert.equal(normalizeJobPriority('desconhecida'), 'normal');
});

test('getJobPriorityMeta returns expected highlight and fire-icon flags', () => {
  const normalMeta = getJobPriorityMeta('normal');
  assert.equal(normalMeta.isHighlighted, false);
  assert.equal(normalMeta.showFireIcon, false);

  const highMeta = getJobPriorityMeta('alta');
  assert.equal(highMeta.isHighlighted, true);
  assert.equal(highMeta.showFireIcon, false);
  assert.equal(highMeta.shortLabel, 'Prioridade alta');

  const urgentMeta = getJobPriorityMeta('urgente');
  assert.equal(urgentMeta.isHighlighted, true);
  assert.equal(urgentMeta.showFireIcon, true);
  assert.equal(urgentMeta.shortLabel, 'Urgente');
});

test('sortJobsByPriority places urgente first, then alta, then normal while keeping relative order', () => {
  const jNormal1 = makeJob({ id: 'n1', prioridade: 'normal' });
  const jLegacy = makeJob({ id: 'n2', prioridade: undefined });
  const jAlta = makeJob({ id: 'a1', prioridade: 'alta' });
  const jUrgent1 = makeJob({ id: 'u1', prioridade: 'urgente' });
  const jUrgent2 = makeJob({ id: 'u2', prioridade: 'urgente' });

  const sorted = sortJobsByPriority([jNormal1, jAlta, jUrgent1, jLegacy, jUrgent2]);
  assert.deepEqual(
    sorted.map((j) => j.id),
    ['u1', 'u2', 'a1', 'n1', 'n2']
  );
  assert.equal(getJobPriorityRank('urgente') > getJobPriorityRank('alta'), true);
  assert.equal(getJobPriorityRank('alta') > getJobPriorityRank('normal'), true);
});

test('filterJobsByUrgency and countUrgentJobs evaluate open urgent opportunities accurately', () => {
  const jobs = [
    makeJob({ id: 'u-open', status: 'aberta', prioridade: 'urgente' }),
    makeJob({ id: 'u-closed', status: 'encerrada', prioridade: 'urgente' }),
    makeJob({ id: 'a-open', status: 'aberta', prioridade: 'alta' }),
    makeJob({ id: 'n-open', status: 'aberta', prioridade: 'normal' }),
  ];

  assert.equal(countUrgentJobs(jobs, true), 1);
  assert.equal(countUrgentJobs(jobs, false), 2);
  assert.equal(isUrgentJob(jobs[0]), true);
  assert.equal(isHighlightedPriorityJob(jobs[2]), true);
  assert.equal(isHighlightedPriorityJob(jobs[3]), false);

  assert.deepEqual(
    filterJobsByUrgency(jobs, true).map((j) => j.id),
    ['u-open', 'u-closed']
  );
  assert.equal(filterJobsByUrgency(jobs, false).length, 4);
});
