/**
 * @file src/utils/siteSafetyGuides.ts
 * @description Catálogo offline-first de guias práticos "Dicas de Segurança no Canteiro de Obras"
 *   (NRs 06, 10, 11, 12, 18, 21 e 35), filtragem e persistência local para consulta sem internet.
 */

export type SiteSafetyCategory =
  | 'todas'
  | 'altura'
  | 'estrutura_valas'
  | 'eletrica_maquinas'
  | 'cargas_premoldados'
  | 'saude_clima';

export interface SiteSafetyGuide {
  id: string;
  category: Exclude<SiteSafetyCategory, 'todas'>;
  categoryLabel: string;
  nrReference: string;
  title: string;
  summary: string;
  doList: string[];
  avoidList: string[];
  emergencyAction: string;
  targetRoles: string[];
}

export interface OfflineSiteSafetySnapshot {
  version: number;
  syncedAt: string;
  guides: SiteSafetyGuide[];
}

export const SITE_SAFETY_CATEGORY_OPTIONS: Array<{
  id: SiteSafetyCategory;
  label: string;
}> = [
  { id: 'todas', label: 'Todas as frentes' },
  { id: 'altura', label: 'Altura (NR-35)' },
  { id: 'estrutura_valas', label: 'Andaimes e Valas (NR-18)' },
  { id: 'eletrica_maquinas', label: 'Elétrica e Máquinas' },
  { id: 'cargas_premoldados', label: 'Cargas e Pré-Moldados' },
  { id: 'saude_clima', label: 'Calor, Poeira e Saúde' },
];

export const SITE_SAFETY_GUIDES: SiteSafetyGuide[] = [
  {
    id: 'site-altura-ancoragem',
    category: 'altura',
    categoryLabel: 'Trabalho em Altura',
    nrReference: 'NR-35 & NR-18',
    title: 'Ancoragem, talabarte duplo e linha de vida acima de 2 metros',
    summary:
      'Todo serviço em beiral de laje, telhado ou andaime acima de 2,00 m exige cinto tipo paraquedista conectado 100% do tempo a ponto estrutural certificado.',
    doList: [
      'Inspecione costuras, fivelas e mosquetões antes de subir e use talabarte em "Y" para permanecer ancorado durante trocas de ponto.',
      'Confirme com o mestre ou técnico de segurança se o ponto de ancoragem suporta carga de queda e está livre de quinas vivas.',
      'Mantenha ferramentas amarradas com fiel retrátil para evitar queda de objetos sobre colegas nos pavimentos inferiores.',
    ],
    avoidList: [
      'Nunca ancore o mosquetão em guarda-corpo provisório, tubulação de PVC ou escoras soltas.',
      'Não trabalhe em altura sob chuva forte, ventania ou tontura causada por calor excessivo.',
    ],
    emergencyAction:
      'Em caso de queda suspensa no cinto, acione o resgate imediatamente e evite que o trabalhador fique imóvel por mais de 15 minutos sem apoio nos pés.',
    targetRoles: ['Pedreiro', 'Montador de Pré-Moldados', 'Pintor Predial', 'Carpinteiro', 'Eletricista Predial'],
  },
  {
    id: 'site-andaime-escavacao',
    category: 'estrutura_valas',
    categoryLabel: 'Andaimes e Escavações',
    nrReference: 'NR-18',
    title: 'Montagem estável de andaimes, pranchões e proteção de valas',
    summary:
      'Plataformas de trabalho e escavações de fundação/saneamento exigem base nivelada, travamento completo e escoramento a partir de 1,25 m de profundidade.',
    doList: [
      'Verifique sapatas apoiadas sobre pranchões firmes, travas diagonais instaladas e rodapé de 20 cm com guarda-corpo duplo (1,20 m e 0,70 m).',
      'Mantenha terra escavada e pilhas de tijolos afastadas pelo menos da metade da profundidade da vala (mínimo 1 m da borda).',
      'Instale escadas de saída a cada 15 metros dentro de valas para evacuação rápida.',
    ],
    avoidList: [
      'Nunca improvise tábuas trincadas, blocos ou latas como apoio de plataforma.',
      'Jamais entre em vala com mais de 1,25 m sem escoramento ou talude seguro, principalmente após chuva.',
    ],
    emergencyAction:
      'Se notar rachaduras na borda da vala ou estalos nas escoras, saia imediatamente da escavação e isole a área.',
    targetRoles: ['Pedreiro', 'Servente de Obras', 'Carpinteiro', 'Azulejista / Revestidor', 'Mestre de Obras'],
  },
  {
    id: 'site-eletrica-bloqueio',
    category: 'eletrica_maquinas',
    categoryLabel: 'Elétrica no Canteiro',
    nrReference: 'NR-10 & NR-18',
    title: 'Quadros provisórios com DR, cabos elevados e bloqueio antes de mexer',
    summary:
      'Circuitos provisórios de obra precisam de disjuntor diferencial residual (DR), aterramento e cabos protegidos contra umidade e passagem de carrinhos.',
    doList: [
      'Passe extensões por suportes isolantes elevados, longe de poças de água, vergalhões e passagens de caminhões.',
      'Desligue, bloqueie e sinalize o disjuntor com cadeado/etiqueta antes de abrir quadros ou trocar tomadas.',
      'Use apenas plugues industriais inteiros e ferramentas com duplo isolamento.',
    ],
    avoidList: [
      'Nunca faça emendas desencapadas com fita comum no chão úmido ou conecte fios direto nos bornes sem plugue.',
      'Não remova o pino terra de extensões nem opere equipamentos elétricos descalço ou com luva molhada.',
    ],
    emergencyAction:
      'Em choque elétrico, nunca toque diretamente na vítima antes de desligar a chave geral ou afastar o cabo com material seco e isolante.',
    targetRoles: ['Eletricista Predial', 'Manutenção de Redes Elétricas', 'Instalações Elétricas', 'Servente de Obras'],
  },
  {
    id: 'site-maquinas-serra-betoneira',
    category: 'eletrica_maquinas',
    categoryLabel: 'Máquinas e Ferramentas',
    nrReference: 'NR-12 & NR-18',
    title: 'Proteção de disco em serras circulares, lixadeiras e betoneiras',
    summary:
      'Equipamentos rotativos concentram alto risco de corte e aprisionamento e só devem operar com coifa protetora, botão de emergência e operador autorizado.',
    doList: [
      'Confirme que a coifa retrátil da serra de bancada, o cutelo divisor e a proteção da correia da betoneira estão firmes.',
      'Use empurrador de madeira ao cortar peças curtas na serra circular e mantenha óculos ampla visão + protetor auricular.',
      'Desconecte o plugue da tomada antes de limpar tambores, trocar discos ou ajustar guias.',
    ],
    avoidList: [
      'Nunca trave o gatilho da esmerilhadeira ou retire a capa de proteção para caber disco maior.',
      'Não use roupas largas, correntes ou luvas frouxas perto de eixos e correias em movimento.',
    ],
    emergencyAction:
      'Acione imediatamente o botão de parada de emergência (vermelho) e não puxe membros presos antes de desligar a energia.',
    targetRoles: ['Carpinteiro', 'Armador de Ferragem', 'Servente de Obras', 'Pedreiro', 'Especialista em Construções Sustentáveis'],
  },
  {
    id: 'site-cargas-premoldados',
    category: 'cargas_premoldados',
    categoryLabel: 'Içamento e Pré-Moldados',
    nrReference: 'NR-11 & NR-18',
    title: 'Área isolada sob cargas suspensas e travamento de pré-moldados',
    summary:
      'Na descarga com caminhão munck, guindaste ou montagem de galpões pré-moldados, ninguém deve permanecer no raio de queda ou esmagamento da peça.',
    doList: [
      'Isole o perímetro com cones e fita zebrada e conduza a peça apenas com cordas-guia laterais à distância segura.',
      'Inspecione cintas têxteis, manilhas e olhais de içamento procurando cortes, fios rompidos ou deformações.',
      'Aguarde o travamento completo de pilares e vigas nos cálices/chumbadores antes de soltar os cabos.',
    ],
    avoidList: [
      'Nunca passe ou permaneça embaixo de paletes de blocos, feixes de aço ou vigas suspensas.',
      'Jamais use a mão diretamente para alinhar pilar ou placa descendo sobre o apoio.',
    ],
    emergencyAction:
      'Ao ouvir ruído anormal em cintas ou perceber balanço descontrolado da carga, sinalize parada imediata ao operador e afaste toda a equipe.',
    targetRoles: ['Montador de Pré-Moldados', 'Armador de Ferragem', 'Servente de Obras', 'Mestre de Obras'],
  },
  {
    id: 'site-calor-hidratacao-rondonopolis',
    category: 'saude_clima',
    categoryLabel: 'Calor, Poeira e Saúde',
    nrReference: 'NR-18, NR-21 & NR-06',
    title: 'Hidratação no calor de Rondonópolis, proteção solar e controle de poeira',
    summary:
      'No clima quente e seco de Mato Grosso, insolação e poeira mineral (sílica de corte e cimento) exigem pausas à sombra, água fresca e respirador PFF2.',
    doList: [
      'Beba água fresca em pequenas quantidades a cada 20–30 minutos e aproveite áreas sombreadas nos horários de sol forte.',
      'Use respirador PFF2 ao cortar piso, lixar massa corrida, varrer cimento seco ou misturar argamassa.',
      'Aplique protetor solar em áreas expostas e mantenha o uniforme completo com manga longa em frentes a céu aberto.',
    ],
    avoidList: [
      'Não espere sentir sede intensa ou tontura para beber água e fazer pausa.',
      'Nunca corte cerâmica, bloco ou concreto a seco sem máscara PFF2 e óculos vedados.',
    ],
    emergencyAction:
      'Se um colega apresentar tontura, pele muito quente, fraqueza ou confusão mental, leve-o para a sombra, refresque com água e acione o atendimento médico.',
    targetRoles: ['Pedreiro', 'Servente de Obras', 'Azulejista / Revestidor', 'Pintor Predial', 'Especialista em Construções Sustentáveis'],
  },
];

const OFFLINE_SNAPSHOT_STORAGE_KEY = 'brickjobs_offline_site_safety_v1';
const SAVED_GUIDES_STORAGE_KEY = 'brickjobs_saved_site_safety_guides_v1';

/**
 * Filtra os guias de segurança do canteiro por categoria, busca textual e opção de favoritos.
 */
export function filterSiteSafetyGuides(
  guides: SiteSafetyGuide[],
  options: {
    category?: SiteSafetyCategory;
    query?: string;
    onlySaved?: boolean;
    savedIds?: string[];
  } = {}
): SiteSafetyGuide[] {
  const category = options.category ?? 'todas';
  const normalizedQuery = (options.query ?? '').trim().toLowerCase();
  const savedSet = new Set(options.savedIds ?? []);

  return guides.filter((guide) => {
    if (category !== 'todas' && guide.category !== category) {
      return false;
    }
    if (options.onlySaved && !savedSet.has(guide.id)) {
      return false;
    }
    if (!normalizedQuery) return true;

    const searchable = [
      guide.title,
      guide.summary,
      guide.nrReference,
      guide.categoryLabel,
      ...guide.doList,
      ...guide.avoidList,
      ...guide.targetRoles,
    ]
      .join(' ')
      .toLowerCase();

    return searchable.includes(normalizedQuery);
  });
}

/**
 * Verifica se o guia tem relação direta com a ocupação principal do trabalhador.
 */
export function isSiteSafetyGuideRelevantToRole(
  guide: SiteSafetyGuide,
  roleHint?: string
): boolean {
  const normalizedRole = (roleHint ?? '').trim().toLowerCase();
  if (!normalizedRole) return false;
  return guide.targetRoles.some(
    (role) =>
      role.toLowerCase().includes(normalizedRole) ||
      normalizedRole.includes(role.toLowerCase())
  );
}

/**
 * Persiste o catálogo completo no localStorage para garantir disponibilidade offline imediata.
 */
export function saveOfflineSiteSafetySnapshot(
  guides: SiteSafetyGuide[] = SITE_SAFETY_GUIDES,
  now: Date = new Date()
): OfflineSiteSafetySnapshot {
  const snapshot: OfflineSiteSafetySnapshot = {
    version: 1,
    syncedAt: now.toISOString(),
    guides,
  };
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(
        OFFLINE_SNAPSHOT_STORAGE_KEY,
        JSON.stringify(snapshot)
      );
    } catch {
      // Ignora erro de cota sem impedir leitura do catálogo em memória
    }
  }
  return snapshot;
}

/**
 * Recupera o snapshot salvo localmente ou retorna o catálogo embarcado no bundle.
 */
export function loadOfflineSiteSafetySnapshot(): OfflineSiteSafetySnapshot {
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(OFFLINE_SNAPSHOT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<OfflineSiteSafetySnapshot>;
        if (Array.isArray(parsed.guides) && parsed.guides.length > 0) {
          return {
            version: typeof parsed.version === 'number' ? parsed.version : 1,
            syncedAt:
              typeof parsed.syncedAt === 'string' && parsed.syncedAt
                ? parsed.syncedAt
                : new Date().toISOString(),
            guides: parsed.guides,
          };
        }
      }
    } catch {
      // Fallback seguro para catálogo embarcado
    }
  }
  return {
    version: 1,
    syncedAt: new Date().toISOString(),
    guides: SITE_SAFETY_GUIDES,
  };
}

export function loadSavedSiteSafetyGuideIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(SAVED_GUIDES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === 'string')
      : [];
  } catch {
    return [];
  }
}

export function toggleSavedSiteSafetyGuide(
  currentIds: string[],
  guideId: string
): string[] {
  const exists = currentIds.includes(guideId);
  const next = exists
    ? currentIds.filter((id) => id !== guideId)
    : [...currentIds, guideId];

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(
        SAVED_GUIDES_STORAGE_KEY,
        JSON.stringify(next)
      );
    } catch {
      // Ignora erro de armazenamento local
    }
  }
  return next;
}
