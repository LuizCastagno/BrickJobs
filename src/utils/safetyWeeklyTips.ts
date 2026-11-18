/**
 * Utilitários e dados para a seção "Dicas de Segurança no Canteiro"
 * com conteúdo dinâmico e lembretes semanais sobre uso de EPIs (Normas Regulamentadoras NR-6, NR-18, NR-35).
 */

export type EpiCategory =
  | 'cabeca'
  | 'pes'
  | 'olhos'
  | 'ouvidos'
  | 'altura'
  | 'respiratoria'
  | 'maos';

export interface SafetyWeeklyReminder {
  id: string;
  epiName: string;
  category: EpiCategory;
  categoryLabel: string;
  title: string;
  nrReference: string;
  whyItMatters: string;
  inspectionChecklist: string[];
  commonMistakes: string[];
  penaltyOrRisk: string;
}

export interface SafetyWeeklyPayload {
  weekKey: string;
  weekLabel: string;
  themeTitle: string;
  themeDescription: string;
  weeklyHighlights: SafetyWeeklyReminder[];
  generalNotice: string;
  source: 'gemini' | 'curated';
  generatedAt: string;
}

export interface IsoWeekInfo {
  weekKey: string;
  weekLabel: string;
  weekNumber: number;
  year: number;
}

export function getIsoWeekString(date: Date = new Date()): IsoWeekInfo {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7; // Monday is 0
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  const year = new Date(firstThursday).getFullYear();
  const paddedWeek = String(weekNumber).padStart(2, '0');
  return {
    weekKey: `${year}-W${paddedWeek}`,
    weekLabel: `Semana ${paddedWeek}/${year}`,
    weekNumber,
    year,
  };
}

export const CURATED_SAFETY_WEEKLY_THEMES: SafetyWeeklyPayload[] = [
  {
    weekKey: 'default-w1',
    weekLabel: 'Ciclo 1 · Proteção Fundamental',
    themeTitle: 'Tolerância Zero para Quedas e Impactos na Obra',
    themeDescription:
      'Lembretes semanais focados nos EPIs que salvam vidas diariamente em frentes estruturais, alvenaria e trabalhos em altura em Rondonópolis.',
    source: 'curated',
    generatedAt: new Date().toISOString(),
    generalNotice:
      'O Diálogo Diário de Segurança (DDS) matinal é obrigatório antes de iniciar qualquer atividade no canteiro.',
    weeklyHighlights: [
      {
        id: 'epi-capacete-jugular-w1',
        epiName: 'Capacete de Segurança com Jugular',
        category: 'cabeca',
        categoryLabel: 'Proteção para Cabeça',
        title: 'Trave a jugular mesmo em trabalhos no nível do chão',
        nrReference: 'NR-06 & NR-18.10',
        whyItMatters:
          'Queda de ferramentas ou fragmentos de concreto de andares superiores pode atingir o operário com força multiplicada. A jugular impede que o capacete saia da cabeça em caso de tropeço ou vento forte.',
        inspectionChecklist: [
          'Verifique se a carneira plástica está sem trincas e devidamente travada na catraca.',
          'Confirme se a tira de jugular sob o queixo está firme e com fecho íntegro.',
          'Substitua imediatamente o casco se houver fissuras ou se tiver sofrido impacto severo.',
        ],
        commonMistakes: [
          'Deixar a fivela da jugular solta ou pendurada atrás do pescoço.',
          'Usar boné comum por baixo do capacete que comprometa o amortecimento da carneira.',
        ],
        penaltyOrRisk:
          'Traumatismo cranioencefálico grave ou perda de equilíbrio com o impacto.',
      },
      {
        id: 'epi-cinto-paraquedista-w1',
        epiName: 'Cinto Tipo Paraquedista com Duplo Talabarte',
        category: 'altura',
        categoryLabel: 'Proteção Contra Quedas (NR-35)',
        title: 'Ancoragem 100% do tempo acima de 2 metros',
        nrReference: 'NR-35 & NR-18.15',
        whyItMatters:
          'Em lajes, andaimes fachadeiros e montagem de fôrmas, a queda em altura é a causa mais severa de acidentes fatais. A ancoragem dupla garante conexão ininterrupta na troca de pontos.',
        inspectionChecklist: [
          'Inspecione fitas têxteis em busca de desfiamento, queimaduras de sol ou respingos de químicos.',
          'Teste as travas dos mosquetões de dupla ação; o fechamento deve ser automático.',
          'Confirme a fixação do absorvedor de energia (fita dobrada/costurada sem rompimento).',
        ],
        commonMistakes: [
          'Conectar o mosquetão em tubos provisórios ou arames sem certificação de 1.500 kgf.',
          'Desconectar ambos os talabartes simultaneamente durante deslocamentos no andaime.',
        ],
        penaltyOrRisk:
          'Queda livre de altura com lesões irreversíveis ou óbito imediato.',
      },
      {
        id: 'epi-botina-biqueira-w1',
        epiName: 'Botina de Couro com Biqueira de Aço/Composite',
        category: 'pes',
        categoryLabel: 'Proteção para os Pés',
        title: 'Solado com palmilha de aço contra pregos e pontas',
        nrReference: 'NR-06 & NR-18.10',
        whyItMatters:
          'Desformas de madeira deixam pregos oxidados expostos no solo do canteiro. A biqueira suporta queda de vigas e blocos pesados sem esmagar os dedos.',
        inspectionChecklist: [
          'Verifique o desgaste do solado antiderrapante; solados lisos causam escorregões graves.',
          'Examine a biqueira e certifique-se de que o couro não rasgou expondo a armação metálica.',
          'Certifique-se de que o calçado possui Certificado de Aprovação (CA) gravado e legível.',
        ],
        commonMistakes: [
          'Pisar sobre o calcanhar da botina usando-a como chinelo dentro do canteiro.',
          'Permanecer o dia todo com meias úmidas ou botinas rasgadas em contato com calda de cimento.',
        ],
        penaltyOrRisk:
          'Perfurações graves com risco de tétano e fraturas por esmagamento dos artelhos.',
      },
      {
        id: 'epi-mascara-pff2-w1',
        epiName: 'Respirador PFF2 / N95 contra Poeira de Sílica',
        category: 'respiratoria',
        categoryLabel: 'Proteção Respiratória',
        title: 'Corte a seco de pisos e lixamento exigem selagem facial',
        nrReference: 'NR-06 & NR-15 Anexo 12',
        whyItMatters:
          'A sílica cristalina presente no cimento e na brita penetra nos alvéolos pulmonares. O calor e o clima seco de Mato Grosso aceleram a suspensão de pó no canteiro.',
        inspectionChecklist: [
          'Ajuste o clipe nasal metálico moldando-o exatamente sobre a ponte do nariz.',
          'Passe os dois elásticos: um na nuca e o outro no alto da cabeça (nunca ambos na orelha).',
          'Faça o teste de pressão positiva soprando suavemente: não pode haver vazamento nas bordas.',
        ],
        commonMistakes: [
          'Abaixar a máscara para o pescoço enquanto corta alvenaria ou prepara massas.',
          'Reutilizar respiradores descartáveis saturados de terra ou amassados.',
        ],
        penaltyOrRisk:
          'Silicose pulmonar crônica irreversível e redução progressiva da capacidade respiratória.',
      },
    ],
  },
  {
    weekKey: 'default-w2',
    weekLabel: 'Ciclo 2 · Proteção Sensorial e Membros',
    themeTitle: 'Visão, Audição e Mãos: Blindagem Diária no Canteiro',
    themeDescription:
      'Equipamentos essenciais para operadores de betoneira, serras circulares, marteletes e manipuladores de armações de ferro em Rondonópolis.',
    source: 'curated',
    generatedAt: new Date().toISOString(),
    generalNotice:
      'Todo EPI fornecido pela construtora deve ter CA válido emitido pelo Ministério do Trabalho.',
    weeklyHighlights: [
      {
        id: 'epi-oculos-antirrisco-w2',
        epiName: 'Óculos de Proteção com Proteção Lateral',
        category: 'olhos',
        categoryLabel: 'Proteção Ocular',
        title: 'Estilhaços de ferro e respingos de argamassa',
        nrReference: 'NR-06 & NR-18.10',
        whyItMatters:
          'Rebarbas de aço cortado em maquita e respingos cáusticos de cal/cimento causam úlceras de córnea em frações de segundo. Lentes escurecidas protegem contra radiação solar intensa do Centro-Oeste.',
        inspectionChecklist: [
          'Confirme se as lentes não estão riscadas a ponto de prejudicar o campo visual.',
          'Verifique as hastes com regulagem e apoios de nariz sem quebras.',
          'Use modelos com vedação periférica ou protetor facial se for cortar concreto ou ferro.',
        ],
        commonMistakes: [
          'Colocar os óculos na testa para enxergar de perto em local com poeira suspensa.',
          'Limpar lentes sujas de cimento seco com a luva áspera, riscando o visor.',
        ],
        penaltyOrRisk:
          'Queimadura química por cal viva, laceração de córnea e perda permanente da visão.',
      },
      {
        id: 'epi-abafador-w2',
        epiName: 'Protetor Auditivo tipo Concha ou Plugue de Silicone',
        category: 'ouvidos',
        categoryLabel: 'Proteção Auditiva (NR-15)',
        title: 'Atenuação constante contra betoneiras e marteletes',
        nrReference: 'NR-15 Anexo 1 & NR-18.10',
        whyItMatters:
          'Ruídos acima de 85 dB gerados por compactadores de solo e compressores destroem as células auditivas de forma lenta e indolor. Uma vez perdida, a audição nunca mais se regenera.',
        inspectionChecklist: [
          'Em abafadores tipo concha, verifique se as espumas de vedação estão macias e sem rasgos.',
          'Em plugues de inserção, lave diariamente com água morna e sabão neutro para evitar otites.',
          'Garanta encaixe completo puxando a orelha para trás e para cima na inserção.',
        ],
        commonMistakes: [
          'Retirar o protetor a cada minuto para conversar com colegas de turno.',
          'Empurrar o plugue com as mãos cheias de graxa ou poeira de brita.',
        ],
        penaltyOrRisk:
          'Perda auditiva induzida por ruído (PAIR) permanente e zumbido contínuo no ouvido.',
      },
      {
        id: 'epi-luva-vaqueta-w2',
        epiName: 'Luva de Vaqueta e Luva Nitrílica Emborrachada',
        category: 'maos',
        categoryLabel: 'Proteção para Mãos',
        title: 'Armações de aço cortante e impermeabilidade contra cimento',
        nrReference: 'NR-06 & NR-18.10',
        whyItMatters:
          'O arame recozido e os vergalhões cortam a pele com facilidade. Já a água alcalina do cimento fresco causa dermatites de contato severas se atingir a pele desprotegida.',
        inspectionChecklist: [
          'Verifique costuras e palma da luva de vaqueta para detectar furos ou desgaste fino.',
          'Certifique-se de que a luva de nitrilo não tem microfuros enchendo-a de ar e torcendo a boca.',
          'Escolha o tamanho exato da mão para não perder tato e firmeza ao manusear ferramentas.',
        ],
        commonMistakes: [
          'Manusear massa de cimento com luva de tecido simples que encharca e queima a pele.',
          'Operar eixos rotativos de tornos ou furadeiras de bancada com luvas folgadas.',
        ],
        penaltyOrRisk:
          'Dermatite cáustica incapacitante e cortes profundos com lesão de tendões.',
      },
      {
        id: 'epi-trava-quedas-w2',
        epiName: 'Dispositivo Trava-Quedas para Cabo de Aço/Corda',
        category: 'altura',
        categoryLabel: 'Proteção Contra Quedas (NR-35)',
        title: 'Linha de vida independente e travamento imediato',
        nrReference: 'NR-35.5',
        whyItMatters:
          'Em balancins suspensos ou escadas marinheiro, o trava-quedas corre livremente durante a subida e bloqueia instantaneamente em caso de qualquer aceleração descendente.',
        inspectionChecklist: [
          'Movimente o cursor manualmente para cima e dê um tranco para baixo para testar a trava.',
          'Verifique a indicação de direção "UP / CIMA" gravada no corpo do trava-quedas.',
          'Certifique-se de que o diâmetro da corda ou cabo de aço coincide rigorosamente com o especificado no aparelho.',
        ],
        commonMistakes: [
          'Instalar o trava-quedas de cabeça para baixo na linha de vida vertical.',
          'Fixar a linha de vida na própria estrutura móvel do andaime em vez de ancoragem independente.',
        ],
        penaltyOrRisk:
          'Falha mecânica com queda livre e impacto direto contra o solo.',
      },
    ],
  },
];

export function getCuratedSafetyWeeklyReminders(weekNumber?: number): SafetyWeeklyPayload {
  const current = getIsoWeekString();
  const effectiveWeek = typeof weekNumber === 'number' ? weekNumber : current.weekNumber;
  const themeIndex = Math.abs(effectiveWeek) % CURATED_SAFETY_WEEKLY_THEMES.length;
  const base = CURATED_SAFETY_WEEKLY_THEMES[themeIndex] ?? CURATED_SAFETY_WEEKLY_THEMES[0];

  return {
    ...base,
    weekKey: current.weekKey,
    weekLabel: current.weekLabel,
    generatedAt: new Date().toISOString(),
  };
}

export function parseSafetyWeeklyTipsPayload(
  raw: string | unknown,
  fallbackWeekKey?: string
): SafetyWeeklyPayload {
  const defaultFallback = getCuratedSafetyWeeklyReminders();
  if (!raw) return defaultFallback;

  let parsed: unknown = raw;
  if (typeof raw === 'string') {
    try {
      const sanitized = raw
        .trim()
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      parsed = JSON.parse(sanitized);
    } catch {
      return defaultFallback;
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    return defaultFallback;
  }

  const obj = parsed as Record<string, unknown>;

  const themeTitle =
    typeof obj.themeTitle === 'string' && obj.themeTitle.trim()
      ? obj.themeTitle.trim()
      : defaultFallback.themeTitle;

  const themeDescription =
    typeof obj.themeDescription === 'string' && obj.themeDescription.trim()
      ? obj.themeDescription.trim()
      : defaultFallback.themeDescription;

  const generalNotice =
    typeof obj.generalNotice === 'string' && obj.generalNotice.trim()
      ? obj.generalNotice.trim()
      : defaultFallback.generalNotice;

  const rawHighlights = Array.isArray(obj.weeklyHighlights)
    ? obj.weeklyHighlights
    : Array.isArray(obj.tips)
      ? obj.tips
      : [];

  const weeklyHighlights: SafetyWeeklyReminder[] = [];

  for (let i = 0; i < rawHighlights.length; i++) {
    const item = rawHighlights[i];
    if (!item || typeof item !== 'object') continue;
    const r = item as Record<string, unknown>;

    const epiName =
      typeof r.epiName === 'string' && r.epiName.trim()
        ? r.epiName.trim()
        : typeof r.name === 'string' && r.name.trim()
          ? r.name.trim()
          : `EPI Essencial #${i + 1}`;

    const title =
      typeof r.title === 'string' && r.title.trim()
        ? r.title.trim()
        : `Inspeção e uso de ${epiName}`;

    const categoryRaw = String(r.category ?? 'cabeca').toLowerCase();
    const validCategories: EpiCategory[] = [
      'cabeca',
      'pes',
      'olhos',
      'ouvidos',
      'altura',
      'respiratoria',
      'maos',
    ];
    const category: EpiCategory = validCategories.includes(
      categoryRaw as EpiCategory
    )
      ? (categoryRaw as EpiCategory)
      : 'cabeca';

    const categoryLabel =
      typeof r.categoryLabel === 'string' && r.categoryLabel.trim()
        ? r.categoryLabel.trim()
        : getCategoryLabel(category);

    const nrReference =
      typeof r.nrReference === 'string' && r.nrReference.trim()
        ? r.nrReference.trim()
        : 'NR-06 & NR-18';

    const whyItMatters =
      typeof r.whyItMatters === 'string' && r.whyItMatters.trim()
        ? r.whyItMatters.trim()
        : typeof r.description === 'string' && r.description.trim()
          ? r.description.trim()
          : 'Uso indispensável para proteção física contra acidentes graves no canteiro.';

    const inspectionChecklist = Array.isArray(r.inspectionChecklist)
      ? r.inspectionChecklist
          .map((c) => String(c).trim())
          .filter((c) => c.length > 0)
      : [
          'Verifique a integridade física antes de usar.',
          'Ajuste as presilhas e encaixes corretamente.',
          'Substitua o equipamento se apresentar qualquer dano.',
        ];

    const commonMistakes = Array.isArray(r.commonMistakes)
      ? r.commonMistakes.map((m) => String(m).trim()).filter((m) => m.length > 0)
      : ['Deixar o EPI frouxo ou desencaixado.', 'Trabalhar sem travar fechos de segurança.'];

    const penaltyOrRisk =
      typeof r.penaltyOrRisk === 'string' && r.penaltyOrRisk.trim()
        ? r.penaltyOrRisk.trim()
        : 'Risco de acidentes severos, autuação da fiscalização e afastamento.';

    weeklyHighlights.push({
      id: typeof r.id === 'string' && r.id.trim() ? r.id.trim() : `epi-ai-${i + 1}`,
      epiName,
      category,
      categoryLabel,
      title,
      nrReference,
      whyItMatters,
      inspectionChecklist,
      commonMistakes,
      penaltyOrRisk,
    });
  }

  const effectiveHighlights =
    weeklyHighlights.length >= 2
      ? weeklyHighlights
      : defaultFallback.weeklyHighlights;

  const current = getIsoWeekString();

  return {
    weekKey: fallbackWeekKey || (typeof obj.weekKey === 'string' && obj.weekKey ? obj.weekKey : current.weekKey),
    weekLabel: typeof obj.weekLabel === 'string' && obj.weekLabel ? obj.weekLabel : current.weekLabel,
    themeTitle,
    themeDescription,
    weeklyHighlights: effectiveHighlights,
    generalNotice,
    source: 'gemini',
    generatedAt: new Date().toISOString(),
  };
}

export function getCategoryLabel(category: EpiCategory): string {
  switch (category) {
    case 'cabeca':
      return 'Cabeça e Crânio';
    case 'pes':
      return 'Pés e Membros Inferiores';
    case 'olhos':
      return 'Olhos e Face';
    case 'ouvidos':
      return 'Audição';
    case 'altura':
      return 'Trabalho em Altura (NR-35)';
    case 'respiratoria':
      return 'Vias Respiratórias';
    case 'maos':
      return 'Mãos e Braços';
    default:
      return 'Segurança';
  }
}

export function formatCategoryBadgeStyle(category: EpiCategory): {
  bgClass: string;
  textClass: string;
  borderClass: string;
} {
  switch (category) {
    case 'altura':
      return {
        bgClass: 'bg-red-50 dark:bg-red-950/40',
        textClass: 'text-red-700 dark:text-red-300',
        borderClass: 'border-red-200 dark:border-red-900/60',
      };
    case 'cabeca':
      return {
        bgClass: 'bg-amber-50 dark:bg-amber-950/40',
        textClass: 'text-amber-800 dark:text-amber-300',
        borderClass: 'border-amber-200 dark:border-amber-900/60',
      };
    case 'olhos':
      return {
        bgClass: 'bg-blue-50 dark:bg-blue-950/40',
        textClass: 'text-blue-700 dark:text-blue-300',
        borderClass: 'border-blue-200 dark:border-blue-900/60',
      };
    case 'ouvidos':
      return {
        bgClass: 'bg-purple-50 dark:bg-purple-950/40',
        textClass: 'text-purple-700 dark:text-purple-300',
        borderClass: 'border-purple-200 dark:border-purple-900/60',
      };
    case 'pes':
      return {
        bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
        textClass: 'text-emerald-700 dark:text-emerald-300',
        borderClass: 'border-emerald-200 dark:border-emerald-900/60',
      };
    case 'respiratoria':
      return {
        bgClass: 'bg-cyan-50 dark:bg-cyan-950/40',
        textClass: 'text-cyan-700 dark:text-cyan-300',
        borderClass: 'border-cyan-200 dark:border-cyan-900/60',
      };
    case 'maos':
    default:
      return {
        bgClass: 'bg-orange-50 dark:bg-orange-950/40',
        textClass: 'text-orange-700 dark:text-orange-300',
        borderClass: 'border-orange-200 dark:border-orange-900/60',
      };
  }
}

const CHECKLIST_STORAGE_KEY = 'brickjobs_weekly_epi_checklist';

export function loadWeeklyEpiChecklist(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CHECKLIST_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveWeeklyEpiChecklist(state: Record<string, boolean>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota issues
  }
}

export function toggleWeeklyEpiChecklistItem(
  current: Record<string, boolean>,
  itemId: string
): Record<string, boolean> {
  const next = { ...current };
  if (next[itemId]) {
    delete next[itemId];
  } else {
    next[itemId] = true;
  }
  saveWeeklyEpiChecklist(next);
  return next;
}
