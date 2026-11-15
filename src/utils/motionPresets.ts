export const MOTION_EASE_SETTLE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const INITIAL_SPLASH_DURATION_MS = 720;
export const ROUTE_TRANSITION_DURATION_MS = 280;

export type AppRouteScreen = 'cover' | 'contratante' | 'contratado';

export function getRouteTransitionLabel(target: AppRouteScreen): string {
  if (target === 'contratante') return 'Abrindo Portal da Construtora';
  if (target === 'contratado') return 'Abrindo Área do Contratado';
  return 'Retornando à página inicial';
}

export const SPLASH_OVERLAY_VARIANTS = {
  initial: { opacity: 1 },
  animate: { opacity: 1 },
  exit: {
    opacity: 0,
    scale: 1.015,
    transition: { duration: 0.24, delay: 0, ease: MOTION_EASE_SETTLE },
  },
};

export const ROUTE_OVERLAY_VARIANTS = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: {
    opacity: 0,
    transition: { duration: 0.16, delay: 0, ease: MOTION_EASE_SETTLE },
  },
};

export const PAGE_TRANSITION_VARIANTS = {
  initial: { opacity: 0, y: 14, scale: 0.992 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.995,
    transition: { duration: 0.16, delay: 0, ease: MOTION_EASE_SETTLE },
  },
};

export const PAGE_TRANSITION_CONFIG = {
  duration: 0.24,
  ease: MOTION_EASE_SETTLE,
};

export const TAB_TRANSITION_VARIANTS = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.14, delay: 0, ease: MOTION_EASE_SETTLE },
  },
};

export const TAB_TRANSITION_CONFIG = {
  duration: 0.2,
  ease: MOTION_EASE_SETTLE,
};

export const JOB_CARD_STAGGER_STEP_SEC = 0.035;
export const JOB_CARD_MAX_STAGGER_SEC = 0.18;

export function getJobCardEnterDelay(index: number): number {
  if (!Number.isFinite(index) || index <= 0) return 0;
  const raw = index * JOB_CARD_STAGGER_STEP_SEC;
  return Math.min(Number(raw.toFixed(3)), JOB_CARD_MAX_STAGGER_SEC);
}

export const JOB_CARD_TRANSITION = (index: number) => ({
  duration: 0.22,
  delay: getJobCardEnterDelay(index),
  ease: MOTION_EASE_SETTLE,
});

export const JOB_CARD_VARIANTS = {
  initial: { opacity: 0, y: 12, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: {
    opacity: 0,
    scale: 0.97,
    transition: { duration: 0.14, delay: 0, ease: MOTION_EASE_SETTLE },
  },
};

export const CHAT_BACKDROP_TRANSITION = {
  duration: 0.18,
  ease: 'easeOut' as const,
};

export const CHAT_MODAL_TRANSITION = {
  duration: 0.22,
  ease: MOTION_EASE_SETTLE,
};

export const CHAT_MODAL_VARIANTS = {
  initial: { opacity: 0, y: 24, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 18, scale: 0.97 },
};

export const CHAT_MESSAGE_TRANSITION = {
  duration: 0.16,
  ease: MOTION_EASE_SETTLE,
};

export const PANEL_REVEAL_VARIANTS = {
  initial: { opacity: 0, y: -6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

export const PANEL_REVEAL_TRANSITION = {
  duration: 0.18,
  ease: MOTION_EASE_SETTLE,
};
