/**
 * @file storage.ts
 * @description Persistência e migração retrocompatível do estado principal do BrickJobs em
 *   `localStorage` (`brickjobs_rondonopolis_state_v1`).
 */
import { DEFAULT_APP_STATE, type BrickJobsAppState } from '../data/rondonopolisSeed';
import {
  normalizeRegistrantSex,
  sanitizeRequiredDocumentsMap,
} from './requiredDocuments';
import { normalizeJobPriority } from './jobPriority';

const STORAGE_KEY = 'brickjobs_rondonopolis_state_v1';

export function loadBrickJobsState(): BrickJobsAppState {
  if (typeof window === 'undefined') {
    return DEFAULT_APP_STATE;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_APP_STATE;
    const parsed = JSON.parse(raw) as Partial<BrickJobsAppState>;
    return {
      companyProfile: {
        ...DEFAULT_APP_STATE.companyProfile,
        ...(parsed.companyProfile ?? {}),
        fotoPerfilUrl:
          typeof parsed.companyProfile?.fotoPerfilUrl === 'string'
            ? parsed.companyProfile.fotoPerfilUrl
            : '',
        sexoResponsavel: normalizeRegistrantSex(
          parsed.companyProfile?.sexoResponsavel
        ),
        documentosAnexos: sanitizeRequiredDocumentsMap(
          parsed.companyProfile?.documentosAnexos
        ),
      },
      workerProfile: {
        ...DEFAULT_APP_STATE.workerProfile,
        ...(parsed.workerProfile ?? {}),
        fotoPerfilUrl:
          typeof parsed.workerProfile?.fotoPerfilUrl === 'string'
            ? parsed.workerProfile.fotoPerfilUrl
            : '',
        sexo: normalizeRegistrantSex(parsed.workerProfile?.sexo),
        documentosAnexos: sanitizeRequiredDocumentsMap(
          parsed.workerProfile?.documentosAnexos
        ),
        experiencias: Array.isArray(parsed.workerProfile?.experiencias)
          ? parsed.workerProfile.experiencias
          : DEFAULT_APP_STATE.workerProfile.experiencias,
        categoriasNotificacao: Array.isArray(parsed.workerProfile?.categoriasNotificacao)
          ? parsed.workerProfile.categoriasNotificacao.filter(
              (item): item is string => typeof item === 'string' && item.trim().length > 0
            )
          : DEFAULT_APP_STATE.workerProfile.categoriasNotificacao ?? [],
      },
      jobs:
        Array.isArray(parsed.jobs) && parsed.jobs.length > 0
          ? parsed.jobs.map((job) => {
              const normalizedPrioridade = normalizeJobPriority(job.prioridade);
              const competenciasRequeridas = Array.isArray(job.competenciasRequeridas)
                ? job.competenciasRequeridas.filter(
                    (c): c is string => typeof c === 'string' && c.trim().length > 0
                  )
                : undefined;
              const competenciasPreferenciais = Array.isArray(
                job.competenciasPreferenciais
              )
                ? job.competenciasPreferenciais.filter(
                    (c): c is string => typeof c === 'string' && c.trim().length > 0
                  )
                : undefined;
              if (job.status === 'encerrada' && !job.closedAt) {
                const seedMatch = DEFAULT_APP_STATE.jobs.find(
                  (seedJob) => seedJob.id === job.id
                );
                if (seedMatch?.closedAt) {
                  return {
                    ...job,
                    prioridade: normalizedPrioridade,
                    competenciasRequeridas,
                    competenciasPreferenciais,
                    closedAt: seedMatch.closedAt,
                  };
                }
              }
              return {
                ...job,
                prioridade: normalizedPrioridade,
                competenciasRequeridas,
                competenciasPreferenciais,
              };
            })
          : DEFAULT_APP_STATE.jobs,
      seedWorkers:
        Array.isArray(parsed.seedWorkers) && parsed.seedWorkers.length > 0
          ? parsed.seedWorkers
          : DEFAULT_APP_STATE.seedWorkers,
      applications: Array.isArray(parsed.applications)
        ? parsed.applications.map((app) => {
            const normalizedStatus =
              app.status === 'concluida'
                ? 'concluida'
                : app.status === 'aceita'
                  ? 'aceita'
                  : 'pendente';
            return {
              ...app,
              status: normalizedStatus,
              completedAt:
                typeof app.completedAt === 'string' && app.completedAt.trim()
                  ? app.completedAt
                  : normalizedStatus === 'concluida'
                    ? app.appliedAt
                    : undefined,
            };
          })
        : [],
      companyRatings:
        Array.isArray(parsed.companyRatings)
          ? parsed.companyRatings
          : DEFAULT_APP_STATE.companyRatings,
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
      chatMessages: Array.isArray(parsed.chatMessages) ? parsed.chatMessages : [],
      workReminders: Array.isArray(parsed.workReminders) ? parsed.workReminders : [],
      selectedRegion: parsed.selectedRegion || DEFAULT_APP_STATE.selectedRegion,
    };
  } catch {
    return DEFAULT_APP_STATE;
  }
}

export function saveBrickJobsState(state: BrickJobsAppState): { ok: boolean; error?: string } {
  if (typeof window === 'undefined') return { ok: true };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: 'Espaço local insuficiente para salvar o arquivo completo. Tente um PDF menor (até 1,5 MB).',
    };
  }
}
