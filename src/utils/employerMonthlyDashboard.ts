/**
 * @file src/utils/employerMonthlyDashboard.ts
 * @description Agregação mensal de vagas abertas e encerradas por construtora para o painel comparativo.
 */

import type { JobPosting } from '../types/brickjobs';
import { formatMonthKeyLabelPtBr } from './employerPerformance';

export interface MonthlyVacancyStatusDatum {
  monthKey: string;
  shortMonthLabel: string;
  fullMonthLabel: string;
  abertas: number;
  encerradas: number;
  postingsAbertas: number;
  postingsEncerradas: number;
  totalVagas: number;
  taxaEncerramentoPercent: number;
}

export interface MonthlyVacancyDashboardSummary {
  months: MonthlyVacancyStatusDatum[];
  totalAbertas: number;
  totalEncerradas: number;
  totalVagas: number;
  taxaEncerramentoPercent: number;
}

const SHORT_MONTH_NAMES_PT_BR = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

export function formatShortMonthLabelPtBr(monthKey: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(monthKey.trim());
  if (!match) return monthKey;
  const shortYear = match[1].slice(2);
  const monthIdx = Number(match[2]) - 1;
  const shortName = SHORT_MONTH_NAMES_PT_BR[monthIdx];
  if (!shortName) return monthKey;
  return `${shortName}/${shortYear}`;
}

export function buildMonthlyVacancyDashboard(params: {
  jobs: JobPosting[];
  companyId?: string;
  maxMonths?: number;
}): MonthlyVacancyDashboardSummary {
  const { jobs, companyId, maxMonths = 12 } = params;

  const byMonth = new Map<
    string,
    {
      abertas: number;
      encerradas: number;
      postingsAbertas: number;
      postingsEncerradas: number;
    }
  >();

  for (const job of jobs) {
    if (companyId && job.companyId !== companyId) continue;
    const match = /^(\d{4}-\d{2})/.exec((job.createdAt ?? '').trim());
    if (!match) continue;

    const monthKey = match[1];
    const current = byMonth.get(monthKey) ?? {
      abertas: 0,
      encerradas: 0,
      postingsAbertas: 0,
      postingsEncerradas: 0,
    };

    const vacancies = Math.max(0, Math.floor(job.quantidadeVagas || 0));
    if (job.status === 'encerrada') {
      current.encerradas += vacancies;
      current.postingsEncerradas += 1;
    } else {
      current.abertas += vacancies;
      current.postingsAbertas += 1;
    }

    byMonth.set(monthKey, current);
  }

  const sortedMonthKeys = Array.from(byMonth.keys()).sort((a, b) =>
    a.localeCompare(b)
  );
  const slicedKeys =
    maxMonths > 0 && sortedMonthKeys.length > maxMonths
      ? sortedMonthKeys.slice(-maxMonths)
      : sortedMonthKeys;

  const months: MonthlyVacancyStatusDatum[] = slicedKeys.map((monthKey) => {
    const bucket = byMonth.get(monthKey)!;
    const totalVagas = bucket.abertas + bucket.encerradas;
    return {
      monthKey,
      shortMonthLabel: formatShortMonthLabelPtBr(monthKey),
      fullMonthLabel: formatMonthKeyLabelPtBr(monthKey),
      abertas: bucket.abertas,
      encerradas: bucket.encerradas,
      postingsAbertas: bucket.postingsAbertas,
      postingsEncerradas: bucket.postingsEncerradas,
      totalVagas,
      taxaEncerramentoPercent:
        totalVagas > 0 ? Math.round((bucket.encerradas / totalVagas) * 100) : 0,
    };
  });

  const totalAbertas = months.reduce((sum, m) => sum + m.abertas, 0);
  const totalEncerradas = months.reduce((sum, m) => sum + m.encerradas, 0);
  const totalVagas = totalAbertas + totalEncerradas;
  const taxaEncerramentoPercent =
    totalVagas > 0 ? Math.round((totalEncerradas / totalVagas) * 100) : 0;

  return {
    months,
    totalAbertas,
    totalEncerradas,
    totalVagas,
    taxaEncerramentoPercent,
  };
}
