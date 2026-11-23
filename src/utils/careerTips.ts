/**
 * @file src/utils/careerTips.ts
 * @description Modelos, cache semanal local e fallback estruturado de dicas de carreira e entrevista para construção civil.
 */

export type CareerTipCategory = 'Currículo' | 'Entrevista';

export type CareerTipFocus = 'todos' | 'curriculo' | 'entrevista';

export interface CareerTipItem {
  category: CareerTipCategory;
  title: string;
  action: string;
  impact: string;
}

export interface WeeklyCareerTipsBundle {
  weekKey: string;
  weekLabel: string;
  role: string;
  headline: string;
  summary: string;
  tips: CareerTipItem[];
  generatedAt: string;
  notice?: string;
}

const CAREER_TIPS_CACHE_KEY = 'brickjobs_weekly_career_tips_v1';

const PT_MONTH_SHORT = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

export function getIsoWeekInfo(date: Date = new Date()): {
  weekKey: string;
  weekLabel: string;
} {
  const utcDate = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((utcDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  const year = utcDate.getUTCFullYear();
  const weekPadded = String(weekNo).padStart(2, '0');
  const monthShort = PT_MONTH_SHORT[date.getMonth()] ?? 'Mês';

  return {
    weekKey: `${year}-W${weekPadded}`,
    weekLabel: `Semana ${weekNo} · ${monthShort}/${year}`,
  };
}

export function normalizeCareerTipCategory(raw: string): CareerTipCategory {
  const lower = raw.trim().toLowerCase();
  if (lower.includes('entrev')) return 'Entrevista';
  return 'Currículo';
}

export function parseCareerTipsPayload(rawText: string): {
  headline: string;
  summary: string;
  tips: CareerTipItem[];
} {
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const parsed = JSON.parse(cleaned) as {
    headline?: unknown;
    summary?: unknown;
    tips?: Array<{
      category?: unknown;
      title?: unknown;
      action?: unknown;
      impact?: unknown;
    }>;
  };

  const headline =
    typeof parsed.headline === 'string' && parsed.headline.trim()
      ? parsed.headline.trim()
      : 'Como fortalecer seu perfil na construção civil nesta semana';

  const summary =
    typeof parsed.summary === 'string' && parsed.summary.trim()
      ? parsed.summary.trim()
      : 'Sugestões práticas para destacar sua experiência em obra e mandar bem na conversa com o contratante.';

  const rawTips = Array.isArray(parsed.tips) ? parsed.tips : [];
  const tips: CareerTipItem[] = rawTips
    .map((item) => ({
      category: normalizeCareerTipCategory(
        typeof item?.category === 'string' ? item.category : 'Currículo'
      ),
      title: typeof item?.title === 'string' ? item.title.trim() : '',
      action: typeof item?.action === 'string' ? item.action.trim() : '',
      impact: typeof item?.impact === 'string' ? item.impact.trim() : '',
    }))
    .filter((item) => item.title.length > 0 && item.action.length > 0);

  if (tips.length === 0) {
    throw new Error('A resposta não trouxe dicas válidas para exibição.');
  }

  return { headline, summary, tips };
}

export function filterCareerTipsByFocus(
  tips: CareerTipItem[],
  focus: CareerTipFocus
): CareerTipItem[] {
  if (focus === 'todos') return tips;
  if (focus === 'curriculo') {
    return tips.filter((t) => t.category === 'Currículo');
  }
  return tips.filter((t) => t.category === 'Entrevista');
}

export function loadCachedWeeklyCareerTips(
  weekKey: string,
  role: string
): WeeklyCareerTipsBundle | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CAREER_TIPS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WeeklyCareerTipsBundle;
    if (
      !parsed ||
      parsed.weekKey !== weekKey ||
      parsed.role.toLowerCase() !== role.trim().toLowerCase() ||
      !Array.isArray(parsed.tips) ||
      parsed.tips.length === 0
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveCachedWeeklyCareerTips(bundle: WeeklyCareerTipsBundle): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CAREER_TIPS_CACHE_KEY, JSON.stringify(bundle));
  } catch {
    // Ignore storage quota issues for non-critical weekly cache
  }
}

export function getCuratedCareerTips(params?: {
  role?: string;
  focus?: CareerTipFocus;
  weekKey?: string;
  weekLabel?: string;
  notice?: string;
  now?: Date;
}): WeeklyCareerTipsBundle {
  const roleLabel =
    params?.role && params.role.trim()
      ? params.role.trim()
      : 'Profissional da Construção Civil';
  const focus: CareerTipFocus = params?.focus ?? 'todos';
  const weekInfo = getIsoWeekInfo(params?.now ?? new Date());
  const weekKey = params?.weekKey || weekInfo.weekKey;
  const weekLabel = params?.weekLabel || weekInfo.weekLabel;

  const curriculumTips: CareerTipItem[] = [
    {
      category: 'Currículo',
      title: `Detalhe frentes de obra como ${roleLabel}`,
      action: `Informe os tipos de serviço executados como ${roleLabel} (ex.: residencial, galpão industrial, pré-moldados ou acabamento) e os meses trabalhados em cada obra.`,
      impact:
        'Facilita para o mestre de obras confirmar sua vivência prática antes mesmo da ligação.',
    },
    {
      category: 'Currículo',
      title: 'Destaque certificações e NRs válidas',
      action:
        'Liste treinamentos como NR-06, NR-11, NR-18 ou NR-35, além de ferramentas próprias ou leitura de planta básica no topo do cadastro.',
      impact:
        'Construtoras priorizam profissionais que já chegam aptos às exigências de segurança do canteiro.',
    },
  ];

  const interviewTips: CareerTipItem[] = [
    {
      category: 'Entrevista',
      title: 'Leve exemplos concretos de entrega no prazo',
      action:
        'Na conversa com o encarregado ou engenheiro, conte uma obra recente em que você cumpriu o cronograma sem retrabalho e com organização do local.',
      impact:
        'Mostra comprometimento com produtividade, limpeza do canteiro e redução de desperdício.',
    },
    {
      category: 'Entrevista',
      title: 'Confirme disponibilidade, região e EPIs',
      action:
        'Deixe claro seu bairro em Rondonópolis-MT, facilidade de deslocamento e o compromisso com o uso diário de capacete, botina e óculos de proteção.',
      impact:
        'Evita dúvidas sobre início imediato e transmite postura profissional à equipe de contratação.',
    },
  ];

  const allTips =
    focus === 'curriculo'
      ? [...curriculumTips, ...interviewTips.slice(0, 1)]
      : focus === 'entrevista'
        ? [...interviewTips, ...curriculumTips.slice(0, 1)]
        : [...curriculumTips, ...interviewTips];

  return {
    weekKey,
    weekLabel,
    role: roleLabel,
    headline: `Boas práticas da semana para ${roleLabel}`,
    summary:
      'Orientações objetivas para valorizar sua experiência em obra no currículo e mandar bem na entrevista presencial.',
    tips: allTips,
    generatedAt: (params?.now ?? new Date()).toISOString(),
    notice: params?.notice,
  };
}
