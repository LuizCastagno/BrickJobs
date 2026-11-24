/**
 * @file src/utils/onboarding.ts
 * @description Passos do tour guiado de onboarding e controle de exibição por perfil no localStorage.
 */

import type { UserRole } from '../types/brickjobs';

export interface OnboardingStep {
  id: string;
  tabId: string;
  tabLabel: string;
  title: string;
  summary: string;
  highlights: string[];
}

export type OnboardingSeenMap = Record<UserRole, boolean>;

export const ONBOARDING_STORAGE_KEY = 'brickjobs_onboarding_seen_v1';

const DEFAULT_SEEN_MAP: OnboardingSeenMap = {
  contratado: false,
  contratante: false,
};

export function getOnboardingStepsForRole(role: UserRole): OnboardingStep[] {
  if (role === 'contratante') {
    return [
      {
        id: 'employer-vagas',
        tabId: 'vagas',
        tabLabel: 'Vagas',
        title: 'Aba Vagas: busca e desempenho mensal',
        summary:
          'Publique oportunidades para sua obra e acompanhe o preenchimento das vagas em Rondonópolis.',
        highlights: [
          'Informe função, quantidade de vagas, turno, faixa salarial e benefícios.',
          'Use sugestões automáticas de descrição e requisitos conforme a ocupação.',
          'Acompanhe no gráfico D3 as vagas abertas versus preenchidas ao longo do mês.',
        ],
      },
      {
        id: 'employer-cadastro',
        tabId: 'cadastro',
        tabLabel: 'Dados da Empresa',
        title: 'Aba Dados da Empresa: perfil da construtora',
        summary:
          'Mantenha o perfil da empresa atualizado para transmitir confiança aos trabalhadores da região.',
        highlights: [
          'Cadastre nome fantasia, razão social, CNPJ, responsável e WhatsApp.',
          'Defina o bairro sede ou canteiro principal em Rondonópolis-MT.',
          'Suas vagas publicadas exibem automaticamente os dados de contato da empresa.',
        ],
      },
      {
        id: 'employer-perfil',
        tabId: 'profissionais',
        tabLabel: 'Profissionais',
        title: 'Aba Profissionais: registrados e disponíveis',
        summary:
          'Visualize os contratados registrados na empresa e os profissionais disponíveis para serviço na região.',
        highlights: [
          'Consulte contratados registrados com exportação rápida em PDF ou CSV.',
          'Filtre trabalhadores disponíveis por bairro de Rondonópolis, nome ou ocupação.',
          'Veja currículos anexados em PDF ou experiências com tempo total calculado.',
        ],
      },
    ];
  }

  return [
    {
      id: 'worker-vagas',
      tabId: 'vagas',
      tabLabel: 'Vagas',
      title: 'Aba Vagas: oportunidades próximas de você',
      summary:
        'Encontre obras abertas em Rondonópolis e região com filtros rápidos por localização e perfil.',
      highlights: [
        'Escolha a distância máxima (km) e use sua localização para ver apenas vagas próximas.',
        'Refine sua busca por ocupação, tipo de contrato (CLT, autônomo, temporário) e nível.',
        'Candidate-se com um toque e receba notificações quando houver aceitação ou nova vaga.',
      ],
    },
    {
      id: 'worker-cadastro',
      tabId: 'cadastro',
      tabLabel: 'Cadastro',
      title: 'Aba Cadastro: PDF ou experiências profissionais',
      summary:
        'Informe seus dados básicos e escolha a forma mais prática de apresentar seu histórico.',
      highlights: [
        'Preencha nome, telefone/WhatsApp, ocupação principal e bairro de interesse.',
        'Anexe seu currículo em PDF pronto ou preencha as sub-abas de experiências.',
        'O sistema calcula automaticamente a duração e o tempo total de atuação em cada obra.',
      ],
    },
    {
      id: 'worker-perfil',
      tabId: 'perfil',
      tabLabel: 'Perfil',
      title: 'Aba Perfil: currículo gerado para as construtoras',
      summary:
        'Confira seu perfil profissional completo pronto para ser avaliado pelas empresas.',
      highlights: [
        'Reúne seus dados de contato, região de interesse e disponibilidade de início.',
        'Exibe o PDF anexado para download ou a linha do tempo com tempo total de experiência.',
        'Acompanhe o status de todas as candidaturas enviadas (aguardando ou aceita).',
      ],
    },
  ];
}

export interface TourTabResolution {
  nextStepIndex: number | null;
  shouldDismissTour: boolean;
}

export function resolveTourTabSelection(
  isTourOpen: boolean,
  steps: OnboardingStep[],
  clickedTabId: string
): TourTabResolution {
  if (!isTourOpen) {
    return { nextStepIndex: null, shouldDismissTour: false };
  }
  const matchingIndex = steps.findIndex((step) => step.tabId === clickedTabId);
  if (matchingIndex >= 0) {
    return { nextStepIndex: matchingIndex, shouldDismissTour: false };
  }
  return { nextStepIndex: null, shouldDismissTour: true };
}

export function parseOnboardingSeenMap(raw: string | null): OnboardingSeenMap {
  if (!raw) return { ...DEFAULT_SEEN_MAP };
  try {
    const parsed = JSON.parse(raw) as Partial<OnboardingSeenMap>;
    return {
      contratado: Boolean(parsed.contratado),
      contratante: Boolean(parsed.contratante),
    };
  } catch {
    return { ...DEFAULT_SEEN_MAP };
  }
}

export function loadOnboardingSeenState(): OnboardingSeenMap {
  if (typeof window === 'undefined') return { ...DEFAULT_SEEN_MAP };
  try {
    return parseOnboardingSeenMap(window.localStorage.getItem(ONBOARDING_STORAGE_KEY));
  } catch {
    return { ...DEFAULT_SEEN_MAP };
  }
}

export function saveOnboardingSeenState(state: OnboardingSeenMap): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage write failures cleanly
  }
}

export function markRoleOnboardingSeen(
  current: OnboardingSeenMap,
  role: UserRole
): OnboardingSeenMap {
  const next: OnboardingSeenMap = {
    ...current,
    [role]: true,
  };
  saveOnboardingSeenState(next);
  return next;
}
