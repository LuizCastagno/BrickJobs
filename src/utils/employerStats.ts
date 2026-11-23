/**
 * @file src/utils/employerStats.ts
 * @description Estatísticas por ocupação: notas médias, tempo de preenchimento em dias e proporção de vagas abertas/encerradas.
 */

import type {
  CompanyRating,
  JobApplication,
  JobPosting,
} from '../types/brickjobs';
import { formatShortMonthLabelPtBr } from './employerMonthlyDashboard';
import { formatMonthKeyLabelPtBr } from './employerPerformance';

export interface CategoryRatingStat {
  category: string;
  averageRating: number;
  formattedAverage: string;
  count: number;
  minRating: number;
  maxRating: number;
}

export interface CategoryRatingOverview {
  overallAverage: number;
  formattedOverallAverage: string;
  totalRatings: number;
  satisfiedSharePercent: number;
  byCategory: CategoryRatingStat[];
  recentRatings: CompanyRating[];
}

export interface CategoryFillTimeStat {
  category: string;
  averageDays: number;
  formattedAverageDays: string;
  closedPostings: number;
  closedVacancies: number;
  minDays: number;
  maxDays: number;
}

export interface CategoryFillTimeOverview {
  overallAverageDays: number;
  formattedOverallDays: string;
  totalClosedPostings: number;
  totalClosedVacancies: number;
  fastestCategory: { category: string; averageDays: number } | null;
  byCategory: CategoryFillTimeStat[];
}

function stripDiacritics(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function mapRoleToServiceCategory(role: string): string {
  const normalized = stripDiacritics(role.trim());
  if (!normalized) return 'Outros Serviços';

  if (
    /\beletric/.test(normalized) ||
    /\bredes?\b/.test(normalized) ||
    /\binstalacoes eletricas\b/.test(normalized)
  ) {
    return 'Elétrica e Redes';
  }
  if (
    /\bpedreir/.test(normalized) ||
    /\balvenaria\b/.test(normalized) ||
    /\bmestre de obras\b/.test(normalized)
  ) {
    return 'Alvenaria';
  }
  if (
    /\bpintor/.test(normalized) ||
    /\bpintura\b/.test(normalized) ||
    /\bazulej/.test(normalized) ||
    /\brevest/.test(normalized) ||
    /\bgesseir/.test(normalized)
  ) {
    return 'Pintura e Acabamento';
  }
  if (
    /\barmador/.test(normalized) ||
    /\bferragem\b/.test(normalized) ||
    /\bcarpint/.test(normalized)
  ) {
    return 'Ferragem e Estrutura';
  }
  if (/\bencanador/.test(normalized) || /\bhidraul/.test(normalized)) {
    return 'Hidráulica';
  }
  if (/\bservente/.test(normalized) || /\bauxiliar\b/.test(normalized)) {
    return 'Apoio de Obras';
  }
  if (
    /\bseguranca\b/.test(normalized) ||
    /\bengenheir/.test(normalized) ||
    /\btecnico\b/.test(normalized)
  ) {
    return 'Segurança e Gestão';
  }
  if (/\bsoldador/.test(normalized) || /\bserralh/.test(normalized)) {
    return 'Serralheria e Solda';
  }
  if (/\boperador/.test(normalized) || /\bmaquina/.test(normalized)) {
    return 'Operação de Máquinas';
  }

  return role.trim();
}

function parseIsoDayUtc(value?: string): number | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const ts = Date.UTC(year, month - 1, day);
  if (!Number.isFinite(ts)) return null;
  return ts;
}

export function computeFillTimeDays(
  createdAt: string,
  closedAt?: string
): number | null {
  const startMs = parseIsoDayUtc(createdAt);
  const endMs = parseIsoDayUtc(closedAt);
  if (startMs === null || endMs === null) return null;
  if (endMs < startMs) return null;
  const diffDays = Math.round((endMs - startMs) / 86_400_000);
  return Math.max(1, diffDays);
}

export function formatDecimalPtBr(value: number, decimals = 1): string {
  return value.toFixed(decimals).replace('.', ',');
}

export function buildCategoryRatingStats(params: {
  ratings: CompanyRating[];
  companyId?: string;
  companyName?: string;
}): CategoryRatingOverview {
  const { ratings, companyId, companyName } = params;
  const normalizedName = companyName?.trim().toLowerCase() ?? '';

  const scoped = ratings.filter((r) => {
    if (!companyId && !normalizedName) return true;
    if (companyId && r.companyId === companyId) return true;
    if (
      normalizedName &&
      r.companyName.trim().toLowerCase() === normalizedName
    ) {
      return true;
    }
    return false;
  });

  if (scoped.length === 0) {
    return {
      overallAverage: 0,
      formattedOverallAverage: '—',
      totalRatings: 0,
      satisfiedSharePercent: 0,
      byCategory: [],
      recentRatings: [],
    };
  }

  const buckets = new Map<string, number[]>();
  let totalStars = 0;
  let satisfiedCount = 0;

  for (const r of scoped) {
    const category = mapRoleToServiceCategory(r.jobRole);
    const arr = buckets.get(category) ?? [];
    arr.push(r.stars);
    buckets.set(category, arr);
    totalStars += r.stars;
    if (r.stars >= 4) satisfiedCount += 1;
  }

  const byCategory: CategoryRatingStat[] = Array.from(buckets.entries())
    .map(([category, starsList]) => {
      const sum = starsList.reduce((acc, s) => acc + s, 0);
      const avg = Math.round((sum / starsList.length) * 10) / 10;
      return {
        category,
        averageRating: avg,
        formattedAverage: formatDecimalPtBr(avg, 1),
        count: starsList.length,
        minRating: Math.min(...starsList),
        maxRating: Math.max(...starsList),
      };
    })
    .sort((a, b) => {
      if (b.averageRating !== a.averageRating) {
        return b.averageRating - a.averageRating;
      }
      if (b.count !== a.count) return b.count - a.count;
      return a.category.localeCompare(b.category, 'pt-BR');
    });

  const overallAverage = Math.round((totalStars / scoped.length) * 10) / 10;
  const recentRatings = scoped
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return {
    overallAverage,
    formattedOverallAverage: formatDecimalPtBr(overallAverage, 1),
    totalRatings: scoped.length,
    satisfiedSharePercent: Math.round((satisfiedCount / scoped.length) * 100),
    byCategory,
    recentRatings,
  };
}

export function buildCategoryFillTimeStats(params: {
  jobs: JobPosting[];
  companyId?: string;
}): CategoryFillTimeOverview {
  const { jobs, companyId } = params;

  const scopedClosed = jobs.filter((job) => {
    if (job.status !== 'encerrada') return false;
    if (companyId && job.companyId !== companyId) return false;
    return computeFillTimeDays(job.createdAt, job.closedAt) !== null;
  });

  if (scopedClosed.length === 0) {
    return {
      overallAverageDays: 0,
      formattedOverallDays: '—',
      totalClosedPostings: 0,
      totalClosedVacancies: 0,
      fastestCategory: null,
      byCategory: [],
    };
  }

  const buckets = new Map<
    string,
    { daysList: number[]; totalVacancies: number }
  >();
  let totalWeightedDays = 0;
  let totalClosedVacancies = 0;

  for (const job of scopedClosed) {
    const days = computeFillTimeDays(job.createdAt, job.closedAt);
    if (days === null) continue;
    const category = mapRoleToServiceCategory(job.funcao);
    const vacancies = Math.max(1, Math.floor(job.quantidadeVagas || 1));

    const bucket = buckets.get(category) ?? { daysList: [], totalVacancies: 0 };
    bucket.daysList.push(days);
    bucket.totalVacancies += vacancies;
    buckets.set(category, bucket);

    totalWeightedDays += days;
    totalClosedVacancies += vacancies;
  }

  const byCategory: CategoryFillTimeStat[] = Array.from(buckets.entries())
    .map(([category, bucket]) => {
      const sum = bucket.daysList.reduce((acc, d) => acc + d, 0);
      const avg = Math.round((sum / bucket.daysList.length) * 10) / 10;
      return {
        category,
        averageDays: avg,
        formattedAverageDays: `${formatDecimalPtBr(avg, 1)} ${
          avg === 1 ? 'dia' : 'dias'
        }`,
        closedPostings: bucket.daysList.length,
        closedVacancies: bucket.totalVacancies,
        minDays: Math.min(...bucket.daysList),
        maxDays: Math.max(...bucket.daysList),
      };
    })
    .sort((a, b) => {
      if (a.averageDays !== b.averageDays) return a.averageDays - b.averageDays;
      return b.closedVacancies - a.closedVacancies;
    });

  const overallAverageDays =
    Math.round((totalWeightedDays / scopedClosed.length) * 10) / 10;

  const fastest = byCategory[0] ?? null;

  return {
    overallAverageDays,
    formattedOverallDays: `${formatDecimalPtBr(overallAverageDays, 1)} ${
      overallAverageDays === 1 ? 'dia' : 'dias'
    }`,
    totalClosedPostings: scopedClosed.length,
    totalClosedVacancies,
    fastestCategory: fastest
      ? { category: fastest.category, averageDays: fastest.averageDays }
      : null,
    byCategory,
  };
}

export interface CategoryOpenVsClosedStat {
  category: string;
  abertas: number;
  encerradas: number;
  total: number;
}

export function buildCategoryOpenVsClosedStats(params: {
  jobs: JobPosting[];
  companyId?: string;
}): CategoryOpenVsClosedStat[] {
  const { jobs, companyId } = params;
  const scoped = jobs.filter((job) => {
    if (companyId && job.companyId !== companyId) return false;
    return true;
  });

  const map = new Map<string, { abertas: number; encerradas: number }>();

  for (const job of scoped) {
    const category = mapRoleToServiceCategory(job.funcao);
    const vagas = Math.max(1, Math.floor(job.quantidadeVagas || 1));
    const current = map.get(category) ?? { abertas: 0, encerradas: 0 };
    if (job.status === 'aberta') {
      current.abertas += vagas;
    } else {
      current.encerradas += vagas;
    }
    map.set(category, current);
  }

  return Array.from(map.entries())
    .map(([category, counts]) => ({
      category,
      abertas: counts.abertas,
      encerradas: counts.encerradas,
      total: counts.abertas + counts.encerradas,
    }))
    .sort(
      (a, b) =>
        b.total - a.total || a.category.localeCompare(b.category, 'pt-BR')
    );
}

export interface MonthlyFinalizedHiringDatum {
  monthKey: string;
  shortMonthLabel: string;
  fullMonthLabel: string;
  finalizadas: number;
  vagasEncerradas: number;
  candidaturasConcluidas: number;
}

export interface MonthlyFinalizedHiringsSummary {
  months: MonthlyFinalizedHiringDatum[];
  totalFinalized: number;
  peakMonth: MonthlyFinalizedHiringDatum | null;
  averagePerMonth: number;
}

function buildRecentMonthKeys(referenceDate: Date, monthCount: number): string[] {
  const safeCount = Math.max(1, Math.floor(monthCount));
  const baseYear = referenceDate.getFullYear();
  const baseMonthIndex = referenceDate.getMonth();
  const keys: string[] = [];

  for (let offset = safeCount - 1; offset >= 0; offset -= 1) {
    const dt = new Date(baseYear, baseMonthIndex - offset, 1);
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    keys.push(`${yyyy}-${mm}`);
  }

  return keys;
}

export function buildMonthlyFinalizedHiringsHistory(params: {
  jobs: JobPosting[];
  applications?: JobApplication[];
  companyId?: string;
  monthCount?: number;
  referenceDate?: Date;
}): MonthlyFinalizedHiringsSummary {
  const {
    jobs,
    applications = [],
    companyId,
    monthCount = 6,
    referenceDate = new Date(),
  } = params;

  const monthKeys = buildRecentMonthKeys(referenceDate, monthCount);
  const bucketMap = new Map<
    string,
    {
      vagasEncerradas: number;
      candidaturasConcluidas: number;
      finalizadas: number;
    }
  >();

  for (const key of monthKeys) {
    bucketMap.set(key, {
      vagasEncerradas: 0,
      candidaturasConcluidas: 0,
      finalizadas: 0,
    });
  }

  const scopedJobs = jobs.filter(
    (job) => !companyId || job.companyId === companyId
  );
  const scopedJobIds = new Set(scopedJobs.map((job) => job.id));

  // Group completed applications per job so closed postings and completed applications don't double-count
  const completedAppsByJob = new Map<string, string[]>();
  for (const app of applications) {
    if (app.status !== 'concluida') continue;
    if (companyId && !scopedJobIds.has(app.jobId)) continue;
    const rawDate = (app.completedAt || app.appliedAt || '').trim();
    const monthMatch = /^(\d{4}-\d{2})/.exec(rawDate);
    if (!monthMatch) continue;
    const monthKey = monthMatch[1];
    const list = completedAppsByJob.get(app.jobId) ?? [];
    list.push(monthKey);
    completedAppsByJob.set(app.jobId, list);
  }

  for (const job of scopedJobs) {
    const appMonths = completedAppsByJob.get(job.id) ?? [];

    if (job.status === 'encerrada') {
      const rawClosedDate = (job.closedAt || job.createdAt || '').trim();
      const closedMatch = /^(\d{4}-\d{2})/.exec(rawClosedDate);
      const closedMonthKey = closedMatch ? closedMatch[1] : null;
      const closedVacancies = Math.max(1, Math.floor(job.quantidadeVagas || 1));

      if (closedMonthKey) {
        const closedBucket = bucketMap.get(closedMonthKey);
        if (closedBucket) {
          closedBucket.vagasEncerradas += closedVacancies;
          closedBucket.finalizadas += closedVacancies;
        }
      }

      let coveredByJobClosure = closedVacancies;
      for (const appMonthKey of appMonths) {
        const appBucket = bucketMap.get(appMonthKey);
        if (appBucket) {
          appBucket.candidaturasConcluidas += 1;
          if (coveredByJobClosure > 0) {
            coveredByJobClosure -= 1;
          } else {
            appBucket.finalizadas += 1;
          }
        }
      }
    } else {
      for (const appMonthKey of appMonths) {
        const appBucket = bucketMap.get(appMonthKey);
        if (appBucket) {
          appBucket.candidaturasConcluidas += 1;
          appBucket.finalizadas += 1;
        }
      }
    }
  }

  // Handle completed applications referencing jobs not present in jobs array (global scope only)
  if (!companyId) {
    for (const [jobId, appMonths] of completedAppsByJob.entries()) {
      if (scopedJobIds.has(jobId)) continue;
      for (const appMonthKey of appMonths) {
        const appBucket = bucketMap.get(appMonthKey);
        if (appBucket) {
          appBucket.candidaturasConcluidas += 1;
          appBucket.finalizadas += 1;
        }
      }
    }
  }

  const months: MonthlyFinalizedHiringDatum[] = monthKeys.map((monthKey) => {
    const bucket = bucketMap.get(monthKey)!;
    return {
      monthKey,
      shortMonthLabel: formatShortMonthLabelPtBr(monthKey),
      fullMonthLabel: formatMonthKeyLabelPtBr(monthKey),
      finalizadas: bucket.finalizadas,
      vagasEncerradas: bucket.vagasEncerradas,
      candidaturasConcluidas: bucket.candidaturasConcluidas,
    };
  });

  const totalFinalized = months.reduce((sum, item) => sum + item.finalizadas, 0);
  const peakMonth =
    totalFinalized > 0
      ? months.reduce((best, item) =>
          item.finalizadas >= best.finalizadas ? item : best
        )
      : null;
  const averagePerMonth =
    months.length > 0
      ? Math.round((totalFinalized / months.length) * 10) / 10
      : 0;

  return {
    months,
    totalFinalized,
    peakMonth,
    averagePerMonth,
  };
}
