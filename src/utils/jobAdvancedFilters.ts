/**
 * @file src/utils/jobAdvancedFilters.ts
 * @description Regras puras para o sistema de filtros avançados da listagem de vagas
 *   (região de atuação, faixa salarial estimada, tipo de serviço e modelo de contrato).
 */

import type { JobPosting } from '../types/brickjobs';
import { filterJobsByLocationAndQuery } from './duration';
import { filterJobsByUrgency } from './jobPriority';
import {
  CONSTRUCTION_SKILL_TAGS,
  formatSkillTagLabel,
  getJobSkillTags,
  normalizeSkillTag,
} from './skillTags';
import { parseJobSalaryEstimate } from './workerEarnings';

export type SalaryBandKey =
  | 'Todas'
  | 'ate_3000'
  | '3001_4200'
  | 'acima_4200'
  | 'a_combinar';

export interface SalaryBandOption {
  value: SalaryBandKey;
  label: string;
  shortLabel: string;
}

export const DEFAULT_REGION_LABEL = 'Toda Rondonópolis e Região';

export const SALARY_BAND_OPTIONS: SalaryBandOption[] = [
  {
    value: 'Todas',
    label: 'Todas as faixas salariais',
    shortLabel: 'Todas as faixas',
  },
  {
    value: 'ate_3000',
    label: 'Até R$ 3.000/mês (ou diária até R$ 136)',
    shortLabel: 'Até R$ 3.000/mês',
  },
  {
    value: '3001_4200',
    label: 'De R$ 3.001 a R$ 4.200/mês',
    shortLabel: 'R$ 3.001 a R$ 4.200/mês',
  },
  {
    value: 'acima_4200',
    label: 'Acima de R$ 4.200/mês (ou diária acima de R$ 191)',
    shortLabel: 'Acima de R$ 4.200/mês',
  },
  {
    value: 'a_combinar',
    label: 'A combinar',
    shortLabel: 'A combinar',
  },
];

export interface ServiceTypeOption {
  value: string;
  label: string;
}

export interface AdvancedJobFilterCriteria {
  region: string;
  query: string;
  onlyOpen?: boolean;
  occupation?: string;
  contractType?: string;
  experienceLevel?: string;
  salaryBand?: SalaryBandKey;
  serviceType?: string;
  skillTags?: string[];
  onlyUrgent?: boolean;
}

export interface ActiveAdvancedFilterItem {
  key:
    | 'region'
    | 'salaryBand'
    | 'serviceType'
    | 'contractType'
    | 'occupation'
    | 'experienceLevel'
    | 'onlyUrgent';
  label: string;
  value: string;
}

export function getSalaryBandShortLabel(band: SalaryBandKey): string {
  return (
    SALARY_BAND_OPTIONS.find((item) => item.value === band)?.shortLabel ??
    'Todas as faixas'
  );
}

export function matchesSalaryBand(
  salarioOuDiaria: string,
  band: SalaryBandKey
): boolean {
  if (!band || band === 'Todas') return true;

  const parsed = parseJobSalaryEstimate(salarioOuDiaria);
  if (band === 'a_combinar') {
    return parsed.rateType === 'a_combinar' || parsed.estimatedMonthlyBrl <= 0;
  }

  if (parsed.rateType === 'a_combinar' || parsed.estimatedMonthlyBrl <= 0) {
    return false;
  }

  if (band === 'ate_3000') {
    return parsed.estimatedMonthlyBrl <= 3000;
  }
  if (band === '3001_4200') {
    return (
      parsed.estimatedMonthlyBrl > 3000 && parsed.estimatedMonthlyBrl <= 4200
    );
  }
  if (band === 'acima_4200') {
    return parsed.estimatedMonthlyBrl > 4200;
  }

  return true;
}

export function matchesServiceType(
  job: Pick<JobPosting, 'funcao' | 'descricao' | 'skillTags'>,
  serviceType: string
): boolean {
  const normalizedTarget = normalizeSkillTag(serviceType);
  if (!normalizedTarget || normalizedTarget === 'todos') {
    return true;
  }

  const jobTags = getJobSkillTags(job);
  return jobTags.includes(normalizedTarget);
}

export function getAvailableServiceTypeOptions(
  jobs: JobPosting[]
): ServiceTypeOption[] {
  const seen = new Set<string>(CONSTRUCTION_SKILL_TAGS);
  for (const job of jobs) {
    for (const tag of getJobSkillTags(job)) {
      if (tag) seen.add(tag);
    }
  }

  return Array.from(seen)
    .sort((a, b) => {
      const aKnown = CONSTRUCTION_SKILL_TAGS.indexOf(a);
      const bKnown = CONSTRUCTION_SKILL_TAGS.indexOf(b);
      if (aKnown !== -1 && bKnown !== -1) return aKnown - bKnown;
      if (aKnown !== -1) return -1;
      if (bKnown !== -1) return 1;
      return formatSkillTagLabel(a).localeCompare(
        formatSkillTagLabel(b),
        'pt-BR'
      );
    })
    .map((tag) => ({
      value: tag,
      label: formatSkillTagLabel(tag),
    }));
}

export function filterJobsAdvanced(
  jobs: JobPosting[],
  filters: AdvancedJobFilterCriteria
): JobPosting[] {
  const base = filterJobsByLocationAndQuery(jobs, {
    region: filters.region,
    query: filters.query,
    onlyOpen: filters.onlyOpen,
    occupation: filters.occupation,
    contractType: filters.contractType,
    experienceLevel: filters.experienceLevel,
    skillTags: filters.skillTags,
  });

  const salaryBand = filters.salaryBand ?? 'Todas';
  const serviceType = filters.serviceType ?? 'Todos';
  const onlyUrgent = Boolean(filters.onlyUrgent);

  const matched = base.filter(
    (job) =>
      matchesSalaryBand(job.salarioOuDiaria, salaryBand) &&
      matchesServiceType(job, serviceType)
  );

  return filterJobsByUrgency(matched, onlyUrgent);
}

export function getActiveAdvancedFilterItems(filters: {
  region: string;
  salaryBand: SalaryBandKey;
  serviceType: string;
  contractType: string;
  occupation: string;
  experienceLevel: string;
  onlyUrgent?: boolean;
}): ActiveAdvancedFilterItem[] {
  const items: ActiveAdvancedFilterItem[] = [];

  if (filters.region && filters.region !== DEFAULT_REGION_LABEL) {
    items.push({
      key: 'region',
      label: 'Região',
      value: filters.region,
    });
  }
  if (filters.salaryBand && filters.salaryBand !== 'Todas') {
    items.push({
      key: 'salaryBand',
      label: 'Faixa salarial',
      value: getSalaryBandShortLabel(filters.salaryBand),
    });
  }
  if (filters.serviceType && filters.serviceType !== 'Todos') {
    items.push({
      key: 'serviceType',
      label: 'Serviço',
      value: formatSkillTagLabel(filters.serviceType),
    });
  }
  if (filters.contractType && filters.contractType !== 'Todos') {
    items.push({
      key: 'contractType',
      label: 'Contrato',
      value: filters.contractType,
    });
  }
  if (filters.occupation && filters.occupation !== 'Todas') {
    items.push({
      key: 'occupation',
      label: 'Ocupação',
      value: filters.occupation,
    });
  }
  if (filters.experienceLevel && filters.experienceLevel !== 'Todos') {
    items.push({
      key: 'experienceLevel',
      label: 'Experiência',
      value: filters.experienceLevel,
    });
  }
  if (filters.onlyUrgent) {
    items.push({
      key: 'onlyUrgent',
      label: 'Urgência',
      value: 'Somente urgentes',
    });
  }

  return items;
}

export function countAllActiveAdvancedFilters(filters: {
  region: string;
  salaryBand: SalaryBandKey;
  serviceType: string;
  contractType: string;
  occupation: string;
  experienceLevel: string;
  onlyUrgent?: boolean;
}): number {
  return getActiveAdvancedFilterItems(filters).length;
}
