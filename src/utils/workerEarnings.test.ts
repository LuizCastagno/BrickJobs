import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAccumulatedMonthlyEarnings,
  formatCompactBrlAxis,
  parseJobSalaryEstimate,
  STANDARD_WORK_DAYS_PER_MONTH,
} from './workerEarnings.ts';
import { SEED_JOBS } from '../data/rondonopolisSeed.ts';
import type { JobApplication, JobPosting } from '../types/brickjobs.ts';

function makeJob(partial: Partial<JobPosting>): JobPosting {
  return {
    id: partial.id ?? 'job-1',
    companyId: partial.companyId ?? 'comp-1',
    companyName: partial.companyName ?? 'Construtora Teste',
    funcao: partial.funcao ?? 'Pedreiro',
    quantidadeVagas: partial.quantidadeVagas ?? 1,
    bairro: partial.bairro ?? 'Centro',
    regiaoInteresse: partial.regiaoInteresse ?? 'Centro',
    salarioOuDiaria: partial.salarioOuDiaria ?? 'R$ 200/dia',
    turno: partial.turno ?? 'Comercial',
    descricao: partial.descricao ?? 'Obra residencial.',
    telefoneContato: partial.telefoneContato ?? '(66) 99999-0000',
    status: partial.status ?? 'encerrada',
    createdAt: partial.createdAt ?? '2026-10-01',
    closedAt: partial.closedAt,
  };
}

function makeApplication(partial: Partial<JobApplication>): JobApplication {
  return {
    id: partial.id ?? 'app-1',
    jobId: partial.jobId ?? 'job-1',
    workerId: partial.workerId ?? 'worker-1',
    workerName: partial.workerName ?? 'Carlos Eduardo',
    appliedAt: partial.appliedAt ?? '2026-11-05',
    status: partial.status ?? 'concluida',
    completedAt: partial.completedAt,
  };
}

describe('parseJobSalaryEstimate', () => {
  it('converts daily rate strings using 22 standard work days per month', () => {
    const parsed = parseJobSalaryEstimate('R$ 195/dia');
    assert.equal(parsed.rateType, 'diaria');
    assert.equal(parsed.baseValue, 195);
    assert.equal(parsed.estimatedMonthlyBrl, 195 * STANDARD_WORK_DAYS_PER_MONTH);
  });

  it('parses monthly salary strings with Brazilian thousands separator', () => {
    const parsed = parseJobSalaryEstimate('R$ 3.900/mês');
    assert.equal(parsed.rateType, 'mensal');
    assert.equal(parsed.baseValue, 3900);
    assert.equal(parsed.estimatedMonthlyBrl, 3900);
  });

  it('calculates midpoint for salary ranges', () => {
    const parsed = parseJobSalaryEstimate('R$ 3.400 – R$ 3.800/mês');
    assert.equal(parsed.rateType, 'mensal');
    assert.equal(parsed.isRange, true);
    assert.equal(parsed.baseValue, 3600);
    assert.equal(parsed.estimatedMonthlyBrl, 3600);
  });

  it('parses Brazilian decimal cents accurately', () => {
    const parsed = parseJobSalaryEstimate('R$ 1.850,50/mês');
    assert.equal(parsed.rateType, 'mensal');
    assert.equal(parsed.estimatedMonthlyBrl, 1850.5);
  });

  it('returns zero for A combinar or empty salary strings', () => {
    assert.equal(parseJobSalaryEstimate('A combinar').estimatedMonthlyBrl, 0);
    assert.equal(parseJobSalaryEstimate('A combinar').rateType, 'a_combinar');
    assert.equal(parseJobSalaryEstimate('').estimatedMonthlyBrl, 0);
  });
});

describe('buildAccumulatedMonthlyEarnings', () => {
  it('aggregates seed closed jobs chronologically with monotonic cumulative earnings', () => {
    const summary = buildAccumulatedMonthlyEarnings({
      jobs: SEED_JOBS,
      applications: [],
      scope: 'todas',
    });

    assert.equal(summary.months.length, 4);
    assert.deepEqual(
      summary.months.map((m) => m.monthKey),
      ['2026-08', '2026-09', '2026-10', '2026-11']
    );
    assert.deepEqual(
      summary.months.map((m) => m.shortMonthLabel),
      ['Ago/26', 'Set/26', 'Out/26', 'Nov/26']
    );

    let running = 0;
    for (const point of summary.months) {
      running += point.monthlyEarnings;
      assert.equal(point.cumulativeEarnings, running);
    }

    assert.equal(summary.totalCompletedJobs, 9);
    assert.equal(summary.totalAccumulatedBrl, 35020);
    assert.equal(summary.months[0].monthlyEarnings, 8380);
    assert.equal(summary.months[1].monthlyEarnings, 2970);
    assert.equal(summary.months[2].monthlyEarnings, 8910);
    assert.equal(summary.months[3].monthlyEarnings, 14760);
  });

  it('adds newly completed worker application earnings and avoids double counting', () => {
    const openJob = makeJob({
      id: 'job-open-1',
      status: 'aberta',
      salarioOuDiaria: 'R$ 200/dia',
      createdAt: '2026-11-12',
    });
    const closedJob = makeJob({
      id: 'job-closed-1',
      status: 'encerrada',
      salarioOuDiaria: 'R$ 3.500/mês',
      createdAt: '2026-10-10',
      closedAt: '2026-10-15',
    });

    const summary = buildAccumulatedMonthlyEarnings({
      jobs: [openJob, closedJob],
      applications: [
        makeApplication({
          id: 'app-open',
          jobId: 'job-open-1',
          status: 'concluida',
          completedAt: '2026-11-17',
        }),
        makeApplication({
          id: 'app-closed',
          jobId: 'job-closed-1',
          status: 'concluida',
          completedAt: '2026-10-15',
        }),
      ],
      scope: 'todas',
    });

    assert.equal(summary.totalCompletedJobs, 2);
    assert.equal(summary.personalCompletedJobs, 2);
    assert.equal(summary.months[0].monthKey, '2026-10');
    assert.equal(summary.months[0].monthlyEarnings, 3500);
    assert.equal(summary.months[0].cumulativeEarnings, 3500);
    assert.equal(summary.months[1].monthKey, '2026-11');
    assert.equal(summary.months[1].monthlyEarnings, 4400);
    assert.equal(summary.months[1].cumulativeEarnings, 7900);
    assert.equal(summary.totalAccumulatedBrl, 7900);
  });

  it('filters strictly to personal completed applications in minhas scope', () => {
    const openJob = makeJob({
      id: 'job-open-1',
      status: 'aberta',
      salarioOuDiaria: 'R$ 4.000/mês',
      createdAt: '2026-11-12',
    });
    const closedJob = makeJob({
      id: 'job-closed-1',
      status: 'encerrada',
      salarioOuDiaria: 'R$ 3.500/mês',
      createdAt: '2026-10-10',
      closedAt: '2026-10-15',
    });

    const emptyPersonal = buildAccumulatedMonthlyEarnings({
      jobs: [openJob, closedJob],
      applications: [
        makeApplication({
          id: 'app-pending',
          jobId: 'job-open-1',
          status: 'aceita',
        }),
      ],
      scope: 'minhas',
    });
    assert.equal(emptyPersonal.months.length, 0);
    assert.equal(emptyPersonal.totalAccumulatedBrl, 0);

    const withPersonal = buildAccumulatedMonthlyEarnings({
      jobs: [openJob, closedJob],
      applications: [
        makeApplication({
          id: 'app-done',
          jobId: 'job-open-1',
          status: 'concluida',
          completedAt: '2026-11-17',
        }),
      ],
      scope: 'minhas',
    });
    assert.equal(withPersonal.totalCompletedJobs, 1);
    assert.equal(withPersonal.totalAccumulatedBrl, 4000);
  });

  it('formats compact BRL axis labels cleanly', () => {
    assert.equal(formatCompactBrlAxis(0), 'R$ 0');
    assert.equal(formatCompactBrlAxis(850), 'R$ 850');
    assert.equal(formatCompactBrlAxis(10000), 'R$ 10 mil');
    assert.equal(formatCompactBrlAxis(14500), 'R$ 14,5 mil');
  });
});
