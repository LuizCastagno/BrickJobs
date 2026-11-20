/**
 * @file src/utils/duration.ts
 * @description Cálculo de duração de experiências profissionais, formatação em pt-BR e filtragem combinada de vagas.
 */

import type { JobPosting, WorkExperience } from '../types/brickjobs';
import { filterJobsBySkillTags, getJobSkillTags } from './skillTags';

export interface DurationCalculation {
  months: number;
  valid: boolean;
  error?: string;
}

function parseYearMonth(value: string): { year: number; month: number } | null {
  if (!value) return null;
  const trimmed = value.trim();
  const match = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(trimmed);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }
  return { year, month };
}

export function calculateExperienceMonths(
  dataInicio: string,
  dataFim?: string,
  atual?: boolean,
  referenceDate: Date = new Date()
): DurationCalculation {
  const start = parseYearMonth(dataInicio);
  if (!start) {
    return { months: 0, valid: false, error: 'Informe uma data de início válida.' };
  }

  let end: { year: number; month: number };
  if (atual) {
    end = {
      year: referenceDate.getFullYear(),
      month: referenceDate.getMonth() + 1,
    };
  } else {
    const parsedEnd = parseYearMonth(dataFim ?? '');
    if (!parsedEnd) {
      return {
        months: 0,
        valid: false,
        error: 'Informe a data de término ou marque como trabalho atual.',
      };
    }
    end = parsedEnd;
  }

  const diff = (end.year - start.year) * 12 + (end.month - start.month);
  if (diff < 0) {
    return {
      months: 0,
      valid: false,
      error: 'A data de término não pode ser anterior à data de início.',
    };
  }

  // Inclusive counting for same-month short contracts counts as at least 1 month
  return { months: Math.max(1, diff + 1), valid: true };
}

export function formatDurationPtBr(totalMonths: number): string {
  const safeMonths = Math.max(0, Math.floor(totalMonths));
  if (safeMonths === 0) return 'Menos de 1 mês';

  const years = Math.floor(safeMonths / 12);
  const months = safeMonths % 12;

  const yearLabel = years === 1 ? '1 ano' : years > 1 ? `${years} anos` : '';
  const monthLabel = months === 1 ? '1 mês' : months > 1 ? `${months} meses` : '';

  if (yearLabel && monthLabel) return `${yearLabel} e ${monthLabel}`;
  return yearLabel || monthLabel;
}

export function calculateTotalExperienceMonths(
  experiences: Array<Pick<WorkExperience, 'dataInicio' | 'dataFim' | 'atual'>>,
  referenceDate: Date = new Date()
): number {
  return experiences.reduce((acc, exp) => {
    const res = calculateExperienceMonths(exp.dataInicio, exp.dataFim, exp.atual, referenceDate);
    return res.valid ? acc + res.months : acc;
  }, 0);
}

export function formatFileSizePtBr(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function formatMonthYearPtBr(value: string): string {
  const parsed = parseYearMonth(value);
  if (!parsed) return value || '—';
  const months = [
    'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
    'jul', 'ago', 'set', 'out', 'nov', 'dez',
  ];
  return `${months[parsed.month - 1]}/${parsed.year}`;
}

export function filterJobsByLocationAndQuery(
  jobs: JobPosting[],
  filters: {
    region: string;
    query: string;
    onlyOpen?: boolean;
    occupation?: string;
    contractType?: string;
    experienceLevel?: string;
    skillTags?: string[];
  }
): JobPosting[] {
  const normalizedQuery = filters.query.trim().toLowerCase();
  const normalizedRegion = filters.region.trim();
  const normalizedOccupation = (filters.occupation ?? '').trim().toLowerCase();
  const normalizedContract = (filters.contractType ?? '').trim().toLowerCase();
  const normalizedExperience = (filters.experienceLevel ?? '').trim().toLowerCase();
  const allRegionsLabel = 'Toda Rondonópolis e Região';

  const baseFiltered = jobs.filter((job) => {
    if (filters.onlyOpen && job.status !== 'aberta') {
      return false;
    }

    if (normalizedRegion && normalizedRegion !== allRegionsLabel) {
      const matchesNeighborhood =
        job.bairro.toLowerCase() === normalizedRegion.toLowerCase() ||
        job.regiaoInteresse.toLowerCase() === normalizedRegion.toLowerCase() ||
        job.regiaoInteresse === allRegionsLabel;
      if (!matchesNeighborhood) {
        return false;
      }
    }

    if (normalizedOccupation && normalizedOccupation !== 'todas') {
      if (job.funcao.trim().toLowerCase() !== normalizedOccupation) {
        return false;
      }
    }

    if (normalizedContract && normalizedContract !== 'todos') {
      const jobContract = (job.tipoContrato ?? 'CLT').trim().toLowerCase();
      if (jobContract !== normalizedContract) {
        return false;
      }
    }

    if (normalizedExperience && normalizedExperience !== 'todos') {
      const jobExp = (job.nivelExperiencia ?? 'Intermediário (1 a 3 anos)')
        .trim()
        .toLowerCase();
      if (jobExp !== normalizedExperience) {
        return false;
      }
    }

    if (normalizedQuery) {
      const haystack = [
        job.funcao,
        job.companyName,
        job.bairro,
        job.descricao,
        job.beneficios ?? '',
        job.tipoContrato ?? '',
        job.nivelExperiencia ?? '',
        job.turno,
        ...(job.competenciasRequeridas ?? []),
        ...(job.competenciasPreferenciais ?? []),
        ...getJobSkillTags(job),
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(normalizedQuery)) {
        return false;
      }
    }

    return true;
  });

  if (filters.skillTags && filters.skillTags.length > 0) {
    return filterJobsBySkillTags(baseFiltered, filters.skillTags);
  }

  return baseFiltered;
}

export function countActiveAdvancedFilters(filters: {
  occupation: string;
  contractType: string;
  experienceLevel: string;
}): number {
  let count = 0;
  if (filters.occupation && filters.occupation !== 'Todas') count += 1;
  if (filters.contractType && filters.contractType !== 'Todos') count += 1;
  if (filters.experienceLevel && filters.experienceLevel !== 'Todos') count += 1;
  return count;
}

export function filterJobsByTitleOrDescription(
  jobs: JobPosting[],
  query: string
): JobPosting[] {
  const normalizedQuery = query.trim().toLowerCase();
  const openJobs = jobs.filter((job) => job.status === 'aberta');
  if (!normalizedQuery) return openJobs;

  return openJobs.filter((job) => {
    const title = job.funcao.toLowerCase();
    const description = job.descricao.toLowerCase();
    return title.includes(normalizedQuery) || description.includes(normalizedQuery);
  });
}

const RONDONOPOLIS_ANCHORS: Array<{ region: string; lat: number; lng: number }> = [
  { region: 'Centro', lat: -16.4708, lng: -54.6356 },
  { region: 'Vila Aurora', lat: -16.4622, lng: -54.6184 },
  { region: 'Jardim Primavera', lat: -16.4535, lng: -54.6112 },
  { region: 'Cidade Salmen', lat: -16.4841, lng: -54.6231 },
  { region: 'Vila Operária', lat: -16.4765, lng: -54.6518 },
  { region: 'Parque Sagrada Família', lat: -16.4478, lng: -54.6442 },
  { region: 'Distrito Industrial', lat: -16.4985, lng: -54.6645 },
  { region: 'Jardim Atlântico', lat: -16.4445, lng: -54.6279 },
];

export function resolveNearestRondonopolisRegion(lat: number, lng: number): string {
  // Check rough distance to Rondonópolis center (~45km radius covers municipality and nearby worksites)
  const distToCenter = Math.hypot(lat - -16.4708, lng - -54.6356);
  if (distToCenter > 0.45) {
    return 'Toda Rondonópolis e Região';
  }

  let bestRegion = 'Centro';
  let minDistance = Number.POSITIVE_INFINITY;
  for (const anchor of RONDONOPOLIS_ANCHORS) {
    const d = Math.hypot(lat - anchor.lat, lng - anchor.lng);
    if (d < minDistance) {
      minDistance = d;
      bestRegion = anchor.region;
    }
  }
  return bestRegion;
}
