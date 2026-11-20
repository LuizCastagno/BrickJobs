/**
 * @file src/utils/workerEarnings.ts
 * @description Parser de faixas salariais/diárias e projeção mensal acumulada de ganhos do trabalhador.
 */

import type { JobApplication, JobPosting } from '../types/brickjobs';

export const STANDARD_WORK_DAYS_PER_MONTH = 22;

export type EarningsScope = 'todas' | 'minhas';

export type ParsedSalaryRateType = 'diaria' | 'mensal' | 'a_combinar';

export interface ParsedSalaryEstimate {
  rawText: string;
  rateType: ParsedSalaryRateType;
  baseValue: number;
  estimatedMonthlyBrl: number;
  isRange: boolean;
}

export interface CompletedJobEarningItem {
  id: string;
  jobId: string;
  funcao: string;
  companyName: string;
  bairro: string;
  salarioOuDiaria: string;
  estimatedMonthlyBrl: number;
  rateType: ParsedSalaryRateType;
  completionDate: string;
  monthKey: string;
  source: 'candidatura_concluida' | 'vaga_encerrada';
}

export interface MonthlyAccumulatedEarningsPoint {
  monthKey: string;
  shortMonthLabel: string;
  fullMonthLabel: string;
  monthlyEarnings: number;
  cumulativeEarnings: number;
  completedJobsCount: number;
  personalCompletedCount: number;
  dailyJobsCount: number;
  monthlySalaryJobsCount: number;
  items: CompletedJobEarningItem[];
}

export interface WorkerEarningsDashboardSummary {
  months: MonthlyAccumulatedEarningsPoint[];
  totalAccumulatedBrl: number;
  totalCompletedJobs: number;
  personalCompletedJobs: number;
  averagePerJobBrl: number;
  latestMonthEarningsBrl: number;
  latestMonthLabel: string;
  dailyConvertedCount: number;
  monthlySalaryCount: number;
  negotiableCount: number;
}

const SHORT_MONTHS_PT_BR = [
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
] as const;

const FULL_MONTHS_PT_BR = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const;

export function extractMonthKey(dateString?: string): string | null {
  if (!dateString || typeof dateString !== 'string') return null;
  const match = /^(\d{4})-(\d{2})/.exec(dateString.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }
  return `${match[1]}-${match[2]}`;
}

export function formatShortMonthKeyPtBr(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const monthIdx = Number(monthStr) - 1;
  const shortName = SHORT_MONTHS_PT_BR[monthIdx] ?? monthStr;
  return `${shortName}/${yearStr.slice(-2)}`;
}

export function formatFullMonthKeyPtBr(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const monthIdx = Number(monthStr) - 1;
  const fullName = FULL_MONTHS_PT_BR[monthIdx] ?? monthStr;
  return `${fullName} de ${yearStr}`;
}

export function formatBrlCurrency(value: number): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeValue);
}

export function formatCompactBrlAxis(value: number): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  if (safeValue === 0) return 'R$ 0';
  if (safeValue >= 1000) {
    const thousands = safeValue / 1000;
    const formatted =
      thousands % 1 === 0
        ? thousands.toFixed(0)
        : thousands.toFixed(1).replace('.', ',');
    return `R$ ${formatted} mil`;
  }
  return `R$ ${Math.round(safeValue)}`;
}

function parseBrazilianNumericToken(token: string): number {
  const trimmed = token.trim();
  if (!trimmed) return NaN;

  if (trimmed.includes(',')) {
    const normalized = trimmed.replace(/\./g, '').replace(',', '.');
    return Number.parseFloat(normalized);
  }

  if (/^\d{1,3}(\.\d{3})+$/.test(trimmed)) {
    return Number.parseFloat(trimmed.replace(/\./g, ''));
  }

  return Number.parseFloat(trimmed);
}

/**
 * Converte a string de remuneração (`R$ 195/dia`, `R$ 3.400 – R$ 3.800/mês`, `A combinar`)
 * em uma estimativa mensal em BRL. Diárias são convertidas para 22 dias úteis/mês.
 */
export function parseJobSalaryEstimate(salarioOuDiaria: string): ParsedSalaryEstimate {
  const rawText = (salarioOuDiaria ?? '').trim();
  if (!rawText) {
    return {
      rawText: '',
      rateType: 'a_combinar',
      baseValue: 0,
      estimatedMonthlyBrl: 0,
      isRange: false,
    };
  }

  const normalized = rawText
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (normalized.includes('combinar')) {
    return {
      rawText,
      rateType: 'a_combinar',
      baseValue: 0,
      estimatedMonthlyBrl: 0,
      isRange: false,
    };
  }

  const numberTokens =
    rawText.match(/\d+(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:\.\d+)?/g) ?? [];
  const parsedNumbers = numberTokens
    .map(parseBrazilianNumericToken)
    .filter((n) => Number.isFinite(n) && n > 0);

  if (parsedNumbers.length === 0) {
    return {
      rawText,
      rateType: 'a_combinar',
      baseValue: 0,
      estimatedMonthlyBrl: 0,
      isRange: false,
    };
  }

  const isRange = parsedNumbers.length >= 2;
  const baseValue = isRange
    ? (parsedNumbers[0] + parsedNumbers[1]) / 2
    : parsedNumbers[0];

  const explicitlyDaily =
    /\/\s*di(a|aria)|por\s+dia|diaria/.test(normalized);
  const explicitlyMonthly =
    /\/\s*mes|por\s+mes|mensal/.test(normalized);

  const rateType: ParsedSalaryRateType = explicitlyDaily
    ? 'diaria'
    : explicitlyMonthly
      ? 'mensal'
      : baseValue <= 600
        ? 'diaria'
        : 'mensal';

  const rawEstimated =
    rateType === 'diaria'
      ? baseValue * STANDARD_WORK_DAYS_PER_MONTH
      : baseValue;

  return {
    rawText,
    rateType,
    baseValue: Math.round(baseValue * 100) / 100,
    estimatedMonthlyBrl: Math.round(rawEstimated * 100) / 100,
    isRange,
  };
}

export function buildAccumulatedMonthlyEarnings(params: {
  jobs: JobPosting[];
  applications: JobApplication[];
  scope?: EarningsScope;
}): WorkerEarningsDashboardSummary {
  const { jobs, applications, scope = 'todas' } = params;
  const jobsById = new Map<string, JobPosting>();
  for (const job of jobs) {
    jobsById.set(job.id, job);
  }

  const items: CompletedJobEarningItem[] = [];
  const completedJobIdsFromApps = new Set<string>();

  for (const app of applications) {
    if (app.status !== 'concluida') continue;
    const job = jobsById.get(app.jobId);
    if (!job) continue;

    const completionDate =
      app.completedAt || job.closedAt || app.appliedAt || job.createdAt;
    const monthKey = extractMonthKey(completionDate);
    if (!monthKey) continue;

    const parsedSalary = parseJobSalaryEstimate(job.salarioOuDiaria);
    completedJobIdsFromApps.add(job.id);
    items.push({
      id: `app-${app.id}`,
      jobId: job.id,
      funcao: job.funcao,
      companyName: job.companyName,
      bairro: job.bairro,
      salarioOuDiaria: job.salarioOuDiaria,
      estimatedMonthlyBrl: parsedSalary.estimatedMonthlyBrl,
      rateType: parsedSalary.rateType,
      completionDate,
      monthKey,
      source: 'candidatura_concluida',
    });
  }

  const personalCompletedJobs = items.length;

  if (scope === 'todas') {
    for (const job of jobs) {
      if (job.status !== 'encerrada') continue;
      if (completedJobIdsFromApps.has(job.id)) continue;

      const completionDate = job.closedAt || job.createdAt;
      const monthKey = extractMonthKey(completionDate);
      if (!monthKey) continue;

      const parsedSalary = parseJobSalaryEstimate(job.salarioOuDiaria);
      items.push({
        id: `job-${job.id}`,
        jobId: job.id,
        funcao: job.funcao,
        companyName: job.companyName,
        bairro: job.bairro,
        salarioOuDiaria: job.salarioOuDiaria,
        estimatedMonthlyBrl: parsedSalary.estimatedMonthlyBrl,
        rateType: parsedSalary.rateType,
        completionDate,
        monthKey,
        source: 'vaga_encerrada',
      });
    }
  }

  const monthBuckets = new Map<string, CompletedJobEarningItem[]>();
  for (const item of items) {
    const existing = monthBuckets.get(item.monthKey);
    if (existing) {
      existing.push(item);
    } else {
      monthBuckets.set(item.monthKey, [item]);
    }
  }

  const sortedMonthKeys = Array.from(monthBuckets.keys()).sort((a, b) =>
    a.localeCompare(b)
  );

  let runningCumulative = 0;
  let dailyConvertedCount = 0;
  let monthlySalaryCount = 0;
  let negotiableCount = 0;

  const months: MonthlyAccumulatedEarningsPoint[] = sortedMonthKeys.map(
    (monthKey) => {
      const monthItems = (monthBuckets.get(monthKey) ?? []).sort((a, b) =>
        b.completionDate.localeCompare(a.completionDate)
      );

      let monthlyEarnings = 0;
      let personalCount = 0;
      let monthDailyCount = 0;
      let monthSalaryCount = 0;

      for (const item of monthItems) {
        monthlyEarnings += item.estimatedMonthlyBrl;
        if (item.source === 'candidatura_concluida') {
          personalCount += 1;
        }
        if (item.rateType === 'diaria') {
          monthDailyCount += 1;
          dailyConvertedCount += 1;
        } else if (item.rateType === 'mensal') {
          monthSalaryCount += 1;
          monthlySalaryCount += 1;
        } else {
          negotiableCount += 1;
        }
      }

      monthlyEarnings = Math.round(monthlyEarnings * 100) / 100;
      runningCumulative = Math.round((runningCumulative + monthlyEarnings) * 100) / 100;

      return {
        monthKey,
        shortMonthLabel: formatShortMonthKeyPtBr(monthKey),
        fullMonthLabel: formatFullMonthKeyPtBr(monthKey),
        monthlyEarnings,
        cumulativeEarnings: runningCumulative,
        completedJobsCount: monthItems.length,
        personalCompletedCount: personalCount,
        dailyJobsCount: monthDailyCount,
        monthlySalaryJobsCount: monthSalaryCount,
        items: monthItems,
      };
    }
  );

  const totalCompletedJobs = items.length;
  const totalAccumulatedBrl = runningCumulative;
  const averagePerJobBrl =
    totalCompletedJobs > 0
      ? Math.round((totalAccumulatedBrl / totalCompletedJobs) * 100) / 100
      : 0;
  const latestMonth = months[months.length - 1];

  return {
    months,
    totalAccumulatedBrl,
    totalCompletedJobs,
    personalCompletedJobs,
    averagePerJobBrl,
    latestMonthEarningsBrl: latestMonth?.monthlyEarnings ?? 0,
    latestMonthLabel: latestMonth?.shortMonthLabel ?? '—',
    dailyConvertedCount,
    monthlySalaryCount,
    negotiableCount,
  };
}
