/**
 * @file src/utils/ratings.ts
 * @description Validação e agregação de avaliações por estrelas feitas pelos trabalhadores às construtoras.
 */

import type {
  CompanyRating,
  JobApplication,
  JobPosting,
} from '../types/brickjobs';

export interface CompanyRatingSummary {
  average: number;
  count: number;
  formattedAverage: string;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export function isValidStarRating(stars: number): boolean {
  return Number.isInteger(stars) && stars >= 1 && stars <= 5;
}

export function canAcceptApplication(
  application: Pick<JobApplication, 'status'> | null | undefined
): boolean {
  return Boolean(application && application.status === 'pendente');
}

export function canCompleteWork(
  application: Pick<JobApplication, 'status'> | null | undefined
): boolean {
  return Boolean(application && application.status === 'aceita');
}

export function canApplyToJob(
  job: Pick<JobPosting, 'id' | 'status'> | null | undefined,
  existingApplications: Pick<JobApplication, 'jobId'>[]
): boolean {
  if (!job || job.status !== 'aberta') {
    return false;
  }
  return !existingApplications.some((app) => app.jobId === job.id);
}

export function hasApplicationBeenRated(
  ratings: CompanyRating[],
  applicationId: string
): boolean {
  return ratings.some((r) => r.applicationId === applicationId);
}

export function canRateCompanyForApplication(
  application: Pick<JobApplication, 'id' | 'status'> | null | undefined,
  existingRatings: CompanyRating[]
): boolean {
  if (!application || application.status !== 'concluida') {
    return false;
  }
  return !hasApplicationBeenRated(existingRatings, application.id);
}

export function getRatingForApplication(
  ratings: CompanyRating[],
  applicationId: string
): CompanyRating | undefined {
  return ratings.find((r) => r.applicationId === applicationId);
}

export function filterRatingsForCompany(
  ratings: CompanyRating[],
  companyId: string,
  companyName?: string
): CompanyRating[] {
  const normalizedTargetName = companyName?.trim().toLowerCase() ?? '';
  return ratings
    .filter((rating) => {
      if (companyId && rating.companyId === companyId) return true;
      if (
        normalizedTargetName &&
        rating.companyName.trim().toLowerCase() === normalizedTargetName
      ) {
        return true;
      }
      return false;
    })
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function computeCompanyRatingSummary(
  ratings: CompanyRating[],
  companyId: string,
  companyName?: string
): CompanyRatingSummary {
  const matching = filterRatingsForCompany(ratings, companyId, companyName);
  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  if (matching.length === 0) {
    return {
      average: 0,
      count: 0,
      formattedAverage: '—',
      distribution,
    };
  }

  let total = 0;
  for (const rating of matching) {
    if (isValidStarRating(rating.stars)) {
      const key = rating.stars as 1 | 2 | 3 | 4 | 5;
      distribution[key] += 1;
      total += rating.stars;
    }
  }

  const count = matching.length;
  const average = Math.round((total / count) * 10) / 10;
  return {
    average,
    count,
    formattedAverage: average.toFixed(1).replace('.', ','),
    distribution,
  };
}

export function formatRatingSummaryLabel(summary: CompanyRatingSummary): string {
  if (summary.count === 0) {
    return 'Sem avaliações ainda';
  }
  const unit = summary.count === 1 ? 'avaliação' : 'avaliações';
  return `${summary.formattedAverage} (${summary.count} ${unit})`;
}

export function getRatingStarLabel(stars: number): string {
  switch (stars) {
    case 1:
      return 'Muito ruim';
    case 2:
      return 'Regular';
    case 3:
      return 'Bom';
    case 4:
      return 'Muito bom';
    case 5:
      return 'Excelente';
    default:
      return 'Selecione uma nota';
  }
}

export function createCompanyRating(params: {
  application: JobApplication;
  job: JobPosting;
  stars: number;
  comment?: string;
  workerName?: string;
  existingRatings: CompanyRating[];
  now?: Date;
}): { ok: true; rating: CompanyRating } | { ok: false; error: string } {
  if (params.application.status !== 'concluida') {
    return {
      ok: false,
      error: 'A avaliação é liberada somente após a conclusão do trabalho.',
    };
  }

  if (hasApplicationBeenRated(params.existingRatings, params.application.id)) {
    return {
      ok: false,
      error: 'Você já avaliou a empresa para este trabalho.',
    };
  }

  if (!isValidStarRating(params.stars)) {
    return {
      ok: false,
      error: 'Selecione uma nota de 1 a 5 estrelas.',
    };
  }

  const trimmedComment = (params.comment ?? '').trim().slice(0, 240);
  const createdAt = (params.now ?? new Date()).toISOString().slice(0, 10);

  return {
    ok: true,
    rating: {
      id: `rating-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      applicationId: params.application.id,
      companyId: params.job.companyId,
      companyName: params.job.companyName,
      jobId: params.job.id,
      jobRole: params.job.funcao,
      workerId: params.application.workerId,
      workerName:
        params.workerName?.trim() || params.application.workerName || 'Profissional',
      stars: params.stars,
      comment: trimmedComment || undefined,
      createdAt,
    },
  };
}
