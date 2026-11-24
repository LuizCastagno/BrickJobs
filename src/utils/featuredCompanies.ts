/**
 * @file src/utils/featuredCompanies.ts
 * @description Agregação, ordenação e formatação de "Construtoras em Destaque"
 *   a partir da média de avaliações dos usuários e vagas publicadas.
 */

import type { CompanyRating, JobPosting } from '../types/brickjobs';
import { isValidStarRating } from './ratings';

export type FeaturedCompaniesSortMode = 'nota' | 'avaliacoes';

export interface FeaturedCompanyItem {
  companyId: string;
  companyName: string;
  shortName: string;
  averageRating: number;
  formattedAverage: string;
  ratingsCount: number;
  fiveStarCount: number;
  openJobsCount: number;
  neighborhoods: string[];
  latestComment?: string;
  latestCommentAuthor?: string;
  latestJobRole?: string;
  latestCreatedAt?: string;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface FeaturedCompaniesSummary {
  companies: FeaturedCompanyItem[];
  totalRatings: number;
  overallAverage: number;
  formattedOverallAverage: string;
  topRatedCompany: FeaturedCompanyItem | null;
  mostReviewedCompany: FeaturedCompanyItem | null;
}

export function formatRatingDecimalPtBr(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0,0';
  return value.toFixed(1).replace('.', ',');
}

export function shortenCompanyLabel(name: string, maxLength = 18): string {
  const clean = name.trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, Math.max(1, maxLength - 1)).trimEnd()}…`;
}

function normalizeCompanyKey(companyId: string, companyName: string): string {
  const id = companyId.trim();
  if (id) return `id:${id}`;
  return `name:${companyName.trim().toLowerCase()}`;
}

export function buildFeaturedCompaniesSummary(params: {
  ratings: CompanyRating[];
  jobs?: JobPosting[];
  sortBy?: FeaturedCompaniesSortMode;
  limit?: number;
}): FeaturedCompaniesSummary {
  const { ratings, jobs = [], sortBy = 'nota', limit } = params;

  const validRatings = ratings.filter((r) => isValidStarRating(r.stars));
  if (validRatings.length === 0) {
    return {
      companies: [],
      totalRatings: 0,
      overallAverage: 0,
      formattedOverallAverage: '0,0',
      topRatedCompany: null,
      mostReviewedCompany: null,
    };
  }

  interface Bucket {
    companyId: string;
    companyName: string;
    ratings: CompanyRating[];
  }

  const buckets = new Map<string, Bucket>();
  const nameToKey = new Map<string, string>();

  for (const rating of validRatings) {
    const cleanName = rating.companyName.trim() || 'Construtora parceira';
    const lowerName = cleanName.toLowerCase();
    let key = normalizeCompanyKey(rating.companyId, cleanName);

    if (!buckets.has(key) && nameToKey.has(lowerName)) {
      key = nameToKey.get(lowerName)!;
    }

    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = {
        companyId: rating.companyId.trim() || key,
        companyName: cleanName,
        ratings: [],
      };
      buckets.set(key, bucket);
      nameToKey.set(lowerName, key);
    }
    bucket.ratings.push(rating);
  }

  const items: FeaturedCompanyItem[] = [];
  let grandTotalStars = 0;

  for (const bucket of buckets.values()) {
    const distribution: Record<1 | 2 | 3 | 4 | 5, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };
    let starsSum = 0;

    for (const r of bucket.ratings) {
      const s = r.stars as 1 | 2 | 3 | 4 | 5;
      distribution[s] += 1;
      starsSum += r.stars;
      grandTotalStars += r.stars;
    }

    const count = bucket.ratings.length;
    const averageRating = Math.round((starsSum / count) * 10) / 10;

    const sortedByDate = bucket.ratings
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const latestWithComment =
      sortedByDate.find((r) => Boolean(r.comment?.trim())) ?? sortedByDate[0];

    const matchingOpenJobs = jobs.filter((job) => {
      if (job.status !== 'aberta') return false;
      if (bucket.companyId && job.companyId === bucket.companyId) return true;
      return (
        job.companyName.trim().toLowerCase() ===
        bucket.companyName.trim().toLowerCase()
      );
    });

    const neighborhoods = Array.from(
      new Set(
        matchingOpenJobs
          .map((j) => j.bairro.trim())
          .filter(Boolean)
      )
    );

    items.push({
      companyId: bucket.companyId,
      companyName: bucket.companyName,
      shortName: shortenCompanyLabel(bucket.companyName),
      averageRating,
      formattedAverage: formatRatingDecimalPtBr(averageRating),
      ratingsCount: count,
      fiveStarCount: distribution[5],
      openJobsCount: matchingOpenJobs.length,
      neighborhoods,
      latestComment: latestWithComment?.comment?.trim() || undefined,
      latestCommentAuthor: latestWithComment?.workerName?.trim() || undefined,
      latestJobRole: latestWithComment?.jobRole?.trim() || undefined,
      latestCreatedAt: latestWithComment?.createdAt || undefined,
      distribution,
    });
  }

  const byNota = items.slice().sort((a, b) => {
    if (b.averageRating !== a.averageRating) {
      return b.averageRating - a.averageRating;
    }
    if (b.ratingsCount !== a.ratingsCount) {
      return b.ratingsCount - a.ratingsCount;
    }
    if (b.openJobsCount !== a.openJobsCount) {
      return b.openJobsCount - a.openJobsCount;
    }
    return a.companyName.localeCompare(b.companyName, 'pt-BR');
  });

  const byAvaliacoes = items.slice().sort((a, b) => {
    if (b.ratingsCount !== a.ratingsCount) {
      return b.ratingsCount - a.ratingsCount;
    }
    if (b.averageRating !== a.averageRating) {
      return b.averageRating - a.averageRating;
    }
    return a.companyName.localeCompare(b.companyName, 'pt-BR');
  });

  const sorted = sortBy === 'avaliacoes' ? byAvaliacoes : byNota;
  const companies =
    typeof limit === 'number' && limit > 0 ? sorted.slice(0, limit) : sorted;

  const totalRatings = validRatings.length;
  const overallAverage = Math.round((grandTotalStars / totalRatings) * 10) / 10;

  return {
    companies,
    totalRatings,
    overallAverage,
    formattedOverallAverage: formatRatingDecimalPtBr(overallAverage),
    topRatedCompany: byNota[0] ?? null,
    mostReviewedCompany: byAvaliacoes[0] ?? null,
  };
}
