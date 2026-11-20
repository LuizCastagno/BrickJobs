/**
 * @file notificationSound.ts
 * @description Motor de síntese sonora via Web Audio API para alertas do BrickJobs
 *   (`contract_accepted`, `job_alert` e `reminder`), com controle persistente de ligar/silenciar.
 */
import type { WorkerNotification } from '../types/brickjobs';

export type NotificationSoundProfile =
  | 'contract_accepted'
  | 'job_alert'
  | 'reminder';

export interface SynthNote {
  freq: number;
  startSec: number;
  durationSec: number;
  gain: number;
  type: OscillatorType;
}

const SOUND_PREF_KEY = 'brickjobs_notification_sound_enabled_v1';

let sharedAudioContext: AudioContext | null = null;

export function loadNotificationSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = window.localStorage.getItem(SOUND_PREF_KEY);
    if (raw === null) return true;
    return raw !== 'false';
  } catch {
    return true;
  }
}

export function saveNotificationSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SOUND_PREF_KEY, enabled ? 'true' : 'false');
  } catch {
    // Ignore storage quota errors
  }
}

export function resolveSoundProfileForNotification(
  type: WorkerNotification['type']
): NotificationSoundProfile {
  switch (type) {
    case 'candidatura_aceita':
      return 'contract_accepted';
    case 'lembrete_trabalho':
      return 'reminder';
    case 'nova_vaga_regiao':
    default:
      return 'job_alert';
  }
}

export function getSoundNotesForProfile(
  profile: NotificationSoundProfile
): ReadonlyArray<SynthNote> {
  switch (profile) {
    case 'contract_accepted':
      // Celebratory ascending Cmaj9 arpeggio
      return [
        { freq: 523.25, startSec: 0.0, durationSec: 0.18, gain: 0.11, type: 'triangle' },
        { freq: 659.25, startSec: 0.09, durationSec: 0.2, gain: 0.11, type: 'triangle' },
        { freq: 783.99, startSec: 0.18, durationSec: 0.22, gain: 0.11, type: 'triangle' },
        { freq: 987.77, startSec: 0.27, durationSec: 0.24, gain: 0.1, type: 'sine' },
        { freq: 1046.5, startSec: 0.36, durationSec: 0.36, gain: 0.13, type: 'sine' },
      ];
    case 'reminder':
      return [
        { freq: 659.25, startSec: 0.0, durationSec: 0.18, gain: 0.09, type: 'sine' },
        { freq: 880.0, startSec: 0.14, durationSec: 0.26, gain: 0.1, type: 'sine' },
      ];
    case 'job_alert':
    default:
      return [
        { freq: 783.99, startSec: 0.0, durationSec: 0.14, gain: 0.08, type: 'sine' },
        { freq: 987.77, startSec: 0.1, durationSec: 0.22, gain: 0.09, type: 'sine' },
      ];
  }
}

function getOrCreateAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as {
    AudioContext?: typeof AudioContext;
    webkitAudioContext?: typeof AudioContext;
  };
  const AudioCtx = win.AudioContext ?? win.webkitAudioContext;
  if (typeof AudioCtx !== 'function') return null;

  try {
    if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
      sharedAudioContext = new AudioCtx();
    }
    return sharedAudioContext;
  } catch {
    return null;
  }
}

export function playNotificationSound(
  profile: NotificationSoundProfile,
  enabled: boolean = loadNotificationSoundEnabled()
): boolean {
  if (!enabled) return false;
  const ctx = getOrCreateAudioContext();
  if (!ctx) return false;

  try {
    if (ctx.state === 'suspended') {
      void ctx.resume().catch(() => {});
    }

    const baseTime = ctx.currentTime + 0.01;
    const notes = getSoundNotesForProfile(profile);

    for (const note of notes) {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = note.type;
      osc.frequency.setValueAtTime(note.freq, baseTime + note.startSec);

      gainNode.gain.setValueAtTime(0.0001, baseTime + note.startSec);
      gainNode.gain.exponentialRampToValueAtTime(
        note.gain,
        baseTime + note.startSec + 0.02
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.0001,
        baseTime + note.startSec + note.durationSec
      );

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(baseTime + note.startSec);
      osc.stop(baseTime + note.startSec + note.durationSec + 0.02);
    }

    return true;
  } catch {
    return false;
  }
}

export function playContractAcceptedSound(
  enabled: boolean = loadNotificationSoundEnabled()
): boolean {
  return playNotificationSound('contract_accepted', enabled);
}
