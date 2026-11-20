/**
 * @file src/utils/lgpdConsent.ts
 * @description Persistência de consentimento de cookies, catálogo de dados sensíveis e direitos do titular conforme a LGPD.
 */

export const LGPD_CONSENT_STORAGE_KEY = 'brickjobs_lgpd_consent_v1';
export const LGPD_POLICY_VERSION = '2025.1';

export type CookieCategoryId = 'essenciais' | 'funcionais' | 'analiticos';
export type LgpdModalTab = 'cookies' | 'dados-sensiveis';

export interface CookieCategoryDescriptor {
  id: CookieCategoryId;
  title: string;
  description: string;
  examples: string;
  required: boolean;
}

export interface SensitiveDataDescriptor {
  id: string;
  title: string;
  legalNote: string;
  purpose: string;
  retention: string;
}

export interface LgpdConsentState {
  version: string;
  cookiesConfigured: boolean;
  cookiesAnsweredAt: string | null;
  cookies: {
    essenciais: true;
    funcionais: boolean;
    analiticos: boolean;
  };
  sensitiveDataConsent: boolean;
  sensitiveDataAnsweredAt: string | null;
}

export const COOKIE_CATEGORIES: CookieCategoryDescriptor[] = [
  {
    id: 'essenciais',
    title: 'Cookies Essenciais e Armazenamento Local',
    description:
      'Necessários para manter seu cadastro, candidaturas, mensagens no chat e preferências de segurança funcionando corretamente.',
    examples: 'Sessão local, preferências de consentimento LGPD, estado das candidaturas.',
    required: true,
  },
  {
    id: 'funcionais',
    title: 'Cookies Funcionais e de Experiência',
    description:
      'Lembram sua região selecionada em Rondonópolis-MT, modo claro/escuro e progresso no tour guiado do aplicativo.',
    examples: 'Tema visual, bairro preferido, lembretes de obra e filtros de habilidades.',
    required: false,
  },
  {
    id: 'analiticos',
    title: 'Cookies Analíticos e de Desempenho',
    description:
      'Ajudam a medir de forma agregada quais categorias de serviços têm maior demanda para melhorar as estatísticas das obras.',
    examples: 'Métricas agregadas de buscas por função e tempo de preenchimento de vagas.',
    required: false,
  },
];

export const SENSITIVE_DATA_ITEMS: SensitiveDataDescriptor[] = [
  {
    id: 'geolocalizacao',
    title: 'Dados de Geolocalização e Proximidade (km)',
    legalNote: 'Coletados somente quando você aciona o filtro "Perto de mim".',
    purpose:
      'Calcular a distância aproximada até os canteiros de obra em Rondonópolis-MT sem exibir seu endereço exato a terceiros.',
    retention:
      'Utilizados apenas durante a filtragem ativa em tela e nunca compartilhados com terceiros fora da candidatura.',
  },
  {
    id: 'curriculo-documentos',
    title: 'Currículo em PDF, Experiência e Documentos Pessoais',
    legalNote: 'Art. 5º, II e Art. 11 da LGPD (Lei nº 13.709/2018).',
    purpose:
      'Comprovação de qualificação profissional, envio de candidaturas às construtoras e geração automática do currículo em PDF.',
    retention:
      'Armazenados localmente no navegador sob seu controle; podem ser removidos ou revogados a qualquer momento.',
  },
  {
    id: 'saude-nrs',
    title: 'Certificações de Segurança e Saúde Ocupacional (NRs)',
    legalNote: 'Ex.: NR-10 (elétrica), NR-18 (construção) e NR-35 (trabalho em altura).',
    purpose:
      'Garantir conformidade trabalhista e segurança nas atividades em canteiro de obras quando informadas voluntariamente no resumo ou PDF.',
    retention:
      'Tratados exclusivamente para compatibilidade com a vaga mediante seu consentimento específico e destacado.',
  },
];

export const TITULAR_RIGHTS_ART18: string[] = [
  'Confirmação da existência de tratamento e acesso imediato aos seus dados cadastrados.',
  'Correção de dados incompletos, inexatos ou desatualizados diretamente nas abas de cadastro.',
  'Revogação do consentimento de dados sensíveis e cookies opcionais a qualquer instante.',
  'Eliminação completa das preferências e dados locais armazenados neste dispositivo.',
];

export function createDefaultLgpdConsent(): LgpdConsentState {
  return {
    version: LGPD_POLICY_VERSION,
    cookiesConfigured: false,
    cookiesAnsweredAt: null,
    cookies: {
      essenciais: true,
      funcionais: false,
      analiticos: false,
    },
    sensitiveDataConsent: false,
    sensitiveDataAnsweredAt: null,
  };
}

function sanitizeConsentState(raw: unknown): LgpdConsentState {
  const fallback = createDefaultLgpdConsent();
  if (!raw || typeof raw !== 'object') return fallback;

  const obj = raw as Record<string, unknown>;
  const rawCookies =
    obj.cookies && typeof obj.cookies === 'object'
      ? (obj.cookies as Record<string, unknown>)
      : {};

  return {
    version: typeof obj.version === 'string' && obj.version ? obj.version : LGPD_POLICY_VERSION,
    cookiesConfigured: Boolean(obj.cookiesConfigured),
    cookiesAnsweredAt: typeof obj.cookiesAnsweredAt === 'string' ? obj.cookiesAnsweredAt : null,
    cookies: {
      essenciais: true,
      funcionais: Boolean(rawCookies.funcionais),
      analiticos: Boolean(rawCookies.analiticos),
    },
    sensitiveDataConsent: Boolean(obj.sensitiveDataConsent),
    sensitiveDataAnsweredAt:
      typeof obj.sensitiveDataAnsweredAt === 'string' ? obj.sensitiveDataAnsweredAt : null,
  };
}

export function loadLgpdConsent(): LgpdConsentState {
  if (typeof window === 'undefined') {
    return createDefaultLgpdConsent();
  }
  try {
    const raw = window.localStorage.getItem(LGPD_CONSENT_STORAGE_KEY);
    if (!raw) return createDefaultLgpdConsent();
    return sanitizeConsentState(JSON.parse(raw));
  } catch {
    return createDefaultLgpdConsent();
  }
}

export function saveLgpdConsent(state: LgpdConsentState): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(LGPD_CONSENT_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function acceptAllCookiesConsent(
  prev: LgpdConsentState,
  now: Date = new Date()
): LgpdConsentState {
  return {
    ...prev,
    version: LGPD_POLICY_VERSION,
    cookiesConfigured: true,
    cookiesAnsweredAt: now.toISOString(),
    cookies: {
      essenciais: true,
      funcionais: true,
      analiticos: true,
    },
  };
}

export function rejectOptionalCookiesConsent(
  prev: LgpdConsentState,
  now: Date = new Date()
): LgpdConsentState {
  return {
    ...prev,
    version: LGPD_POLICY_VERSION,
    cookiesConfigured: true,
    cookiesAnsweredAt: now.toISOString(),
    cookies: {
      essenciais: true,
      funcionais: false,
      analiticos: false,
    },
  };
}

export function saveCookiePreferences(
  prev: LgpdConsentState,
  prefs: { funcionais: boolean; analiticos: boolean },
  now: Date = new Date()
): LgpdConsentState {
  return {
    ...prev,
    version: LGPD_POLICY_VERSION,
    cookiesConfigured: true,
    cookiesAnsweredAt: now.toISOString(),
    cookies: {
      essenciais: true,
      funcionais: Boolean(prefs.funcionais),
      analiticos: Boolean(prefs.analiticos),
    },
  };
}

export function setSensitiveDataConsent(
  prev: LgpdConsentState,
  granted: boolean,
  now: Date = new Date()
): LgpdConsentState {
  return {
    ...prev,
    version: LGPD_POLICY_VERSION,
    sensitiveDataConsent: granted,
    sensitiveDataAnsweredAt: now.toISOString(),
  };
}

export function resetAllLgpdData(): LgpdConsentState {
  const next = createDefaultLgpdConsent();
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(LGPD_CONSENT_STORAGE_KEY);
    } catch {
      // Ignore storage removal errors
    }
  }
  return next;
}

export function shouldShowCookieBanner(state: LgpdConsentState): boolean {
  return !state.cookiesConfigured;
}

export function formatLgpdStatusSummary(state: LgpdConsentState): {
  cookiesLabel: string;
  sensitiveLabel: string;
} {
  let cookiesLabel = 'Aguardando definição';
  if (state.cookiesConfigured) {
    if (state.cookies.funcionais && state.cookies.analiticos) {
      cookiesLabel = 'Todos aceitos';
    } else if (!state.cookies.funcionais && !state.cookies.analiticos) {
      cookiesLabel = 'Apenas essenciais';
    } else {
      const ativos = [
        'Essenciais',
        state.cookies.funcionais ? 'Funcionais' : null,
        state.cookies.analiticos ? 'Analíticos' : null,
      ].filter(Boolean);
      cookiesLabel = ativos.join(' + ');
    }
  }

  const sensitiveLabel = state.sensitiveDataConsent
    ? 'Consentimento ativo'
    : state.sensitiveDataAnsweredAt
      ? 'Autorização revogada'
      : 'Pendente de autorização';

  return { cookiesLabel, sensitiveLabel };
}

export function formatConsentTimestampPtBr(iso: string | null): string {
  if (!iso) return 'Ainda não registrado';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return 'Ainda não registrado';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
}
