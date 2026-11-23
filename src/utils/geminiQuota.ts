/**
 * @file src/utils/geminiQuota.ts
 * @description Utilitários para detecção de erros de cota/rate-limit da API Gemini e gestão
 *   compartilhada de cooldown no servidor Express, evitando chamadas repetidas e logs brutos em stderr.
 */

export const DEFAULT_QUOTA_COOLDOWN_MS = 15 * 60 * 1000;
export const MIN_QUOTA_COOLDOWN_MS = 60 * 1000;
export const MAX_QUOTA_COOLDOWN_MS = 60 * 60 * 1000;
export const TRANSIENT_FAILURE_COOLDOWN_MS = 2 * 60 * 1000;

export function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message || err.name;
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object') {
    const obj = err as { message?: unknown; error?: { message?: unknown } };
    if (typeof obj.message === 'string') return obj.message;
    if (obj.error && typeof obj.error.message === 'string') {
      return obj.error.message;
    }
    try {
      return JSON.stringify(err);
    } catch {
      return 'Erro desconhecido';
    }
  }
  return 'Erro desconhecido';
}

export function isGeminiQuotaError(err: unknown): boolean {
  if (err && typeof err === 'object') {
    const obj = err as {
      status?: unknown;
      code?: unknown;
      error?: { code?: unknown; status?: unknown };
    };
    if (obj.status === 429 || obj.code === 429) return true;
    if (obj.error?.code === 429 || obj.error?.status === 'RESOURCE_EXHAUSTED') {
      return true;
    }
  }
  const msg = extractErrorMessage(err);
  return (
    msg.includes('429') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    /exceeded your current quota/i.test(msg) ||
    /rate[- ]limit/i.test(msg) ||
    /too many requests/i.test(msg)
  );
}

function clampCooldown(ms: number): number {
  if (!Number.isFinite(ms) || ms <= 0) return DEFAULT_QUOTA_COOLDOWN_MS;
  return Math.min(MAX_QUOTA_COOLDOWN_MS, Math.max(MIN_QUOTA_COOLDOWN_MS, ms));
}

export function extractRetryDelayMs(
  err: unknown,
  defaultMs: number = DEFAULT_QUOTA_COOLDOWN_MS
): number {
  const msg = extractErrorMessage(err);

  const jsonSecondsMatch = msg.match(/"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/i);
  if (jsonSecondsMatch) {
    const ms = Math.ceil(Number(jsonSecondsMatch[1]) * 1000);
    return clampCooldown(ms);
  }

  const humanMatch = msg.match(
    /retry in\s+(?:(\d+)h)?\s*(?:(\d+)m)?\s*(\d+(?:\.\d+)?)s/i
  );
  if (humanMatch) {
    const hours = Number(humanMatch[1] || 0);
    const mins = Number(humanMatch[2] || 0);
    const secs = Number(humanMatch[3] || 0);
    const ms = Math.ceil((hours * 3600 + mins * 60 + secs) * 1000);
    if (ms > 0) return clampCooldown(ms);
  }

  return clampCooldown(defaultMs);
}

export function formatSanitizedFallbackNotice(
  routeLabel: string,
  err: unknown,
  cooldownMs: number
): string {
  const minutes = Math.max(1, Math.round(cooldownMs / 60000));
  if (isGeminiQuotaError(err)) {
    return `[BrickJobs] ${routeLabel}: limite temporário de consultas externas atingido; usando conteúdo curado por ${minutes} min.`;
  }
  return `[BrickJobs] ${routeLabel}: consulta externa indisponível no momento; usando conteúdo curado por ${minutes} min.`;
}

export interface GeminiCooldownState {
  isActive: (now?: number) => boolean;
  getRemainingMs: (now?: number) => number;
  getExpiresAt: () => number;
  recordFailure: (
    routeLabel: string,
    err: unknown,
    now?: number
  ) => { quotaLimited: boolean; cooldownMs: number; logMessage: string | null };
  reset: () => void;
}

export function createGeminiCooldownGuard(): GeminiCooldownState {
  let cooldownUntil = 0;

  return {
    isActive(now: number = Date.now()) {
      return now < cooldownUntil;
    },
    getRemainingMs(now: number = Date.now()) {
      return Math.max(0, cooldownUntil - now);
    },
    getExpiresAt() {
      return cooldownUntil;
    },
    recordFailure(routeLabel: string, err: unknown, now: number = Date.now()) {
      const wasActive = now < cooldownUntil;
      const quotaLimited = isGeminiQuotaError(err);
      const cooldownMs = quotaLimited
        ? extractRetryDelayMs(err, DEFAULT_QUOTA_COOLDOWN_MS)
        : TRANSIENT_FAILURE_COOLDOWN_MS;

      const candidateUntil = now + cooldownMs;
      if (candidateUntil > cooldownUntil) {
        cooldownUntil = candidateUntil;
      }

      return {
        quotaLimited,
        cooldownMs,
        logMessage: wasActive
          ? null
          : formatSanitizedFallbackNotice(routeLabel, err, cooldownMs),
      };
    },
    reset() {
      cooldownUntil = 0;
    },
  };
}
