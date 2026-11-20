/**
 * @file src/utils/pwaInstall.ts
 * @description Detecção de plataforma iOS/standalone, resolução do modo de instalação PWA e passos manuais.
 */

export type PwaInstallMode =
  | 'installed'
  | 'native_prompt'
  | 'ios_guide'
  | 'manual_guide';

export type PwaInstallOutcome = 'accepted' | 'dismissed';

export interface ResolvePwaInstallModeInput {
  isInstalled: boolean;
  hasDeferredPrompt: boolean;
  isIOS: boolean;
}

export interface PwaManualStep {
  stepNumber: number;
  title: string;
  description: string;
}

export function detectIsIOSUserAgent(userAgent: string): boolean {
  if (!userAgent) return false;
  return /iphone|ipad|ipod/i.test(userAgent);
}

export function detectStandaloneDisplayMode(options: {
  matchMediaStandalone: boolean;
  navigatorStandalone?: boolean;
}): boolean {
  return Boolean(options.matchMediaStandalone || options.navigatorStandalone === true);
}

export function resolvePwaInstallMode({
  isInstalled,
  hasDeferredPrompt,
  isIOS,
}: ResolvePwaInstallModeInput): PwaInstallMode {
  if (isInstalled) return 'installed';
  if (hasDeferredPrompt) return 'native_prompt';
  if (isIOS) return 'ios_guide';
  return 'manual_guide';
}

export function formatPwaInstallFeedback(outcome: PwaInstallOutcome): string {
  if (outcome === 'accepted') {
    return 'BrickJobs adicionado à tela inicial com sucesso.';
  }
  return 'Instalação cancelada. Você pode adicionar à tela inicial quando quiser.';
}

export function getPwaInstallSteps(mode: 'ios_guide' | 'manual_guide'): PwaManualStep[] {
  if (mode === 'ios_guide') {
    return [
      {
        stepNumber: 1,
        title: 'Abra o menu Compartilhar',
        description: 'Toque no ícone de compartilhamento na barra do navegador Safari.',
      },
      {
        stepNumber: 2,
        title: 'Adicionar à Tela de Início',
        description: 'Role as opções e toque em "Adicionar à Tela de Início".',
      },
      {
        stepNumber: 3,
        title: 'Confirme o atalho',
        description: 'Toque em "Adicionar" para abrir o BrickJobs direto como aplicativo.',
      },
    ];
  }

  return [
    {
      stepNumber: 1,
      title: 'Abra o menu do navegador',
      description: 'Toque no botão de menu (⋮) no celular ou no ícone de instalação na barra de endereços.',
    },
    {
      stepNumber: 2,
      title: 'Selecione instalar ou adicionar',
      description: 'Escolha "Instalar aplicativo" ou "Adicionar à tela inicial".',
    },
    {
      stepNumber: 3,
      title: 'Acesso direto em Rondonópolis',
      description: 'O ícone do BrickJobs aparecerá na sua tela inicial para acesso em um toque.',
    },
  ];
}
