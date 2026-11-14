import { DEFAULT_APP_STATE, type BrickJobsAppState } from '../data/rondonopolisSeed';

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
      },
      workerProfile: {
        ...DEFAULT_APP_STATE.workerProfile,
        ...(parsed.workerProfile ?? {}),
        experiencias: Array.isArray(parsed.workerProfile?.experiencias)
          ? parsed.workerProfile.experiencias
          : DEFAULT_APP_STATE.workerProfile.experiencias,
      },
      jobs: Array.isArray(parsed.jobs) && parsed.jobs.length > 0 ? parsed.jobs : DEFAULT_APP_STATE.jobs,
      seedWorkers:
        Array.isArray(parsed.seedWorkers) && parsed.seedWorkers.length > 0
          ? parsed.seedWorkers
          : DEFAULT_APP_STATE.seedWorkers,
      applications: Array.isArray(parsed.applications) ? parsed.applications : [],
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
