/**
 * @file src/utils/jobPriority.ts
 * @description Utilitários puros para normalização, classificação, ordenação, filtragem e
 *   apresentação visual de prioridade/urgência das vagas publicadas pelas construtoras.
 */

import type { JobPosting, JobPriority } from '../types/brickjobs';

export interface JobPriorityMeta {
  value: JobPriority;
  label: string;
  selectLabel: string;
  shortLabel: string;
  description: string;
  isHighlighted: boolean;
  showFireIcon: boolean;
}

export const JOB_PRIORITY_OPTIONS: JobPriority[] = ['normal', 'alta', 'urgente'];

const PRIORITY_META_MAP: Record<JobPriority, JobPriorityMeta> = {
  normal: {
    value: 'normal',
    label: 'Prioridade normal',
    selectLabel: 'Normal (prazo padrão)',
    shortLabel: 'Normal',
    description: 'Prazo padrão de contratação',
    isHighlighted: false,
    showFireIcon: false,
  },
  alta: {
    value: 'alta',
    label: 'Prioridade alta',
    selectLabel: 'Alta (obra em andamento)',
    shortLabel: 'Prioridade alta',
    description: 'Frente de obra em andamento',
    isHighlighted: true,
    showFireIcon: false,
  },
  urgente: {
    value: 'urgente',
    label: 'Urgente · Contratação imediata',
    selectLabel: 'Urgente — Contratação imediata',
    shortLabel: 'Urgente',
    description: 'Início imediato no canteiro',
    isHighlighted: true,
    showFireIcon: true,
  },
};

export function normalizeJobPriority(value: unknown): JobPriority {
  if (typeof value !== 'string') return 'normal';
  const normalized = value.trim().toLowerCase();
  if (normalized === 'urgente') return 'urgente';
  if (normalized === 'alta') return 'alta';
  return 'normal';
}

export function getJobPriorityMeta(priority?: JobPriority | unknown): JobPriorityMeta {
  return PRIORITY_META_MAP[normalizeJobPriority(priority)];
}

export function getJobPriorityRank(priority?: JobPriority | unknown): number {
  const normalized = normalizeJobPriority(priority);
  if (normalized === 'urgente') return 2;
  if (normalized === 'alta') return 1;
  return 0;
}

export function isUrgentJob(job: Pick<JobPosting, 'prioridade'>): boolean {
  return normalizeJobPriority(job.prioridade) === 'urgente';
}

export function isHighlightedPriorityJob(job: Pick<JobPosting, 'prioridade'>): boolean {
  return getJobPriorityRank(job.prioridade) > 0;
}

export function sortJobsByPriority<T extends Pick<JobPosting, 'prioridade'>>(
  jobs: T[]
): T[] {
  return jobs
    .map((job, index) => ({
      job,
      index,
      rank: getJobPriorityRank(job.prioridade),
    }))
    .sort((a, b) => {
      if (b.rank !== a.rank) return b.rank - a.rank;
      return a.index - b.index;
    })
    .map((entry) => entry.job);
}

export function filterJobsByUrgency<T extends Pick<JobPosting, 'prioridade'>>(
  jobs: T[],
  onlyUrgent: boolean
): T[] {
  if (!onlyUrgent) return jobs;
  return jobs.filter((job) => isUrgentJob(job));
}

export function countUrgentJobs<T extends Pick<JobPosting, 'prioridade' | 'status'>>(
  jobs: T[],
  onlyOpen: boolean = true
): number {
  return jobs.reduce((count, job) => {
    if (onlyOpen && job.status !== 'aberta') return count;
    return isUrgentJob(job) ? count + 1 : count;
  }, 0);
}
