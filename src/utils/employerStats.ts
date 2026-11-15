import type { CompanyRating, JobPosting } from '../types/brickjobs';

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
