/**
 * @file src/hooks/usePWAInstall.ts
 * @description Hook React para gerenciar o fluxo de instalação PWA (`beforeinstallprompt`), detecção de modo standalone e instruções manuais/iOS.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  detectIsIOSUserAgent,
  detectStandaloneDisplayMode,
  formatPwaInstallFeedback,
  resolvePwaInstallMode,
  type PwaInstallMode,
  type PwaInstallOutcome,
} from '../utils/pwaInstall';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: PwaInstallOutcome; platform: string }>;
}

export interface UsePWAInstallResult {
  installMode: PwaInstallMode;
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isInstalling: boolean;
  installFeedback: string;
  triggerInstall: () => Promise<'prompted' | 'guide' | 'installed'>;
  clearFeedback: () => void;
}

export function usePWAInstall(): UsePWAInstallResult {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const matchMediaStandalone =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(display-mode: standalone)').matches
        : false;
    const navigatorStandalone = (
      window.navigator as unknown as { standalone?: boolean }
    ).standalone;
    return detectStandaloneDisplayMode({
      matchMediaStandalone,
      navigatorStandalone,
    });
  });
  const [isIOS] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return detectIsIOSUserAgent(window.navigator.userAgent);
  });
  const [isInstalling, setIsInstalling] = useState<boolean>(false);
  const [installFeedback, setInstallFeedback] = useState<string>('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const standaloneQuery =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(display-mode: standalone)')
        : null;

    const syncStandalone = () => {
      const navigatorStandalone = (
        window.navigator as unknown as { standalone?: boolean }
      ).standalone;
      if (
        detectStandaloneDisplayMode({
          matchMediaStandalone: standaloneQuery?.matches ?? false,
          navigatorStandalone,
        })
      ) {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    };

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setInstallFeedback('');
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setInstallFeedback(formatPwaInstallFeedback('accepted'));
    };

    syncStandalone();
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    standaloneQuery?.addEventListener?.('change', syncStandalone);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      standaloneQuery?.removeEventListener?.('change', syncStandalone);
    };
  }, []);

  const installMode = resolvePwaInstallMode({
    isInstalled,
    hasDeferredPrompt: Boolean(deferredPrompt),
    isIOS,
  });

  const triggerInstall = useCallback(async (): Promise<
    'prompted' | 'guide' | 'installed'
  > => {
    if (isInstalled) {
      return 'installed';
    }

    if (!deferredPrompt) {
      return 'guide';
    }

    setIsInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setInstallFeedback(formatPwaInstallFeedback(outcome));
      setDeferredPrompt(null);
      if (outcome === 'accepted') {
        setIsInstalled(true);
        return 'installed';
      }
      return 'prompted';
    } catch {
      return 'guide';
    } finally {
      setIsInstalling(false);
    }
  }, [deferredPrompt, isInstalled]);

  const clearFeedback = useCallback(() => {
    setInstallFeedback('');
  }, []);

  return {
    installMode,
    isInstallable: Boolean(deferredPrompt),
    isInstalled,
    isIOS,
    isInstalling,
    installFeedback,
    triggerInstall,
    clearFeedback,
  };
}
