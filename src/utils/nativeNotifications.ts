/**
 * @file src/utils/nativeNotifications.ts
 * @description Integração com Notification API e Service Worker para disparo de alertas nativos do navegador.
 */

import type { WorkerNotification } from '../types/brickjobs';

export type NativePushPermission = 'default' | 'granted' | 'denied' | 'unsupported';

export interface NativePushPreference {
  enabled: boolean;
  dismissedBanner: boolean;
}

export type EffectiveNativePushState =
  | 'unsupported'
  | 'denied'
  | 'default'
  | 'enabled'
  | 'paused';

export interface NativeNotificationPayload {
  title: string;
  body: string;
  tag: string;
  url?: string;
}

const NATIVE_PUSH_PREF_KEY = 'brickjobs_native_push_pref_v1';

export const DEFAULT_NATIVE_PUSH_PREF: NativePushPreference = {
  enabled: true,
  dismissedBanner: false,
};

export function loadNativePushPreference(): NativePushPreference {
  if (typeof window === 'undefined') return DEFAULT_NATIVE_PUSH_PREF;
  try {
    const raw = window.localStorage.getItem(NATIVE_PUSH_PREF_KEY);
    if (!raw) return DEFAULT_NATIVE_PUSH_PREF;
    const parsed = JSON.parse(raw) as Partial<NativePushPreference>;
    return {
      enabled:
        typeof parsed.enabled === 'boolean'
          ? parsed.enabled
          : DEFAULT_NATIVE_PUSH_PREF.enabled,
      dismissedBanner:
        typeof parsed.dismissedBanner === 'boolean'
          ? parsed.dismissedBanner
          : DEFAULT_NATIVE_PUSH_PREF.dismissedBanner,
    };
  } catch {
    return DEFAULT_NATIVE_PUSH_PREF;
  }
}

export function saveNativePushPreference(pref: NativePushPreference): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(NATIVE_PUSH_PREF_KEY, JSON.stringify(pref));
  } catch {
    // Ignore storage quota errors
  }
}

export function getBrowserNotificationPermission(): NativePushPermission {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return 'unsupported';
  }
  return Notification.permission;
}

export function getEffectivePushState(
  permission: NativePushPermission,
  pref: NativePushPreference
): EffectiveNativePushState {
  if (permission === 'unsupported') return 'unsupported';
  if (permission === 'denied') return 'denied';
  if (permission === 'default') return 'default';
  return pref.enabled ? 'enabled' : 'paused';
}

export function canDispatchNativeNotification(
  permission: NativePushPermission,
  pref: NativePushPreference
): boolean {
  return permission === 'granted' && pref.enabled;
}

export function shouldShowPushPromptBanner(
  permission: NativePushPermission,
  pref: NativePushPreference
): boolean {
  if (permission === 'unsupported' || permission === 'denied') return false;
  if (permission === 'granted' && pref.enabled) return false;
  if (pref.dismissedBanner && permission === 'default') return false;
  return true;
}

export function formatNativeNotificationPayload(
  notification: Pick<WorkerNotification, 'id' | 'type' | 'title' | 'message'>
): NativeNotificationPayload {
  const prefix =
    notification.type === 'candidatura_aceita'
      ? 'BrickJobs · Candidatura aceita'
      : notification.type === 'lembrete_trabalho'
        ? 'BrickJobs · Lembrete de trabalho (30 min)'
        : 'BrickJobs · Nova vaga na região';

  return {
    title: notification.title ? `${prefix} — ${notification.title}` : prefix,
    body: notification.message,
    tag: `brickjobs-${notification.id}`,
    url: '/?autostart=contratado',
  };
}

export async function registerNotificationServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const existing = await navigator.serviceWorker.getRegistration('/');
    if (existing) {
      return existing;
    }
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    return registration;
  } catch {
    return null;
  }
}

export async function requestNativeNotificationPermission(): Promise<NativePushPermission> {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return 'unsupported';
  }
  try {
    const result = await Notification.requestPermission();
    if (result === 'granted') {
      await registerNotificationServiceWorker();
    }
    return result;
  } catch {
    return Notification.permission;
  }
}

export async function dispatchNativeBrowserNotification(
  payload: NativeNotificationPayload,
  pref: NativePushPreference
): Promise<boolean> {
  const permission = getBrowserNotificationPermission();
  if (!canDispatchNativeNotification(permission, pref)) {
    return false;
  }

  try {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      const existingReg = await navigator.serviceWorker.getRegistration('/');
      const reg = existingReg ?? (await registerNotificationServiceWorker());
      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(payload.title, {
          body: payload.body,
          tag: payload.tag,
          data: { url: payload.url ?? '/' },
        });
        return true;
      }
    }

    const instance = new Notification(payload.title, {
      body: payload.body,
      tag: payload.tag,
    });
    instance.onclick = () => {
      if (typeof window !== 'undefined') {
        window.focus();
      }
      instance.close();
    };
    return true;
  } catch {
    return false;
  }
}
