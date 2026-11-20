/**
 * @file src/utils/safetyTips.ts
 * @description Dicas técnicas de segurança (NR-06, NR-18, NR-35), banco do quiz diário e placar regional simulado.
 */

export type SafetyTipCategory =
  | 'todos'
  | 'epis'
  | 'prevencao'
  | 'altura_eletrica'
  | 'canteiro';

export interface SafetyTip {
  id: string;
  category: Exclude<SafetyTipCategory, 'todos'>;
  categoryLabel: string;
  nrReference: string;
  title: string;
  recommendedPractice: string;
  whyItMatters: string;
  requiredPpe: string[];
  targetRoles: string[];
  requiredCompetencies: string[];
  preferredCompetencies: string[];
}

export interface DailySafetyTipResult {
  tip: SafetyTip;
  index: number;
  totalInScope: number;
  dateKey: string;
  dateLabel: string;
}

export interface SafetyQuizQuestion {
  id: string;
  tipId: string;
  nrReference: string;
  question: string;
  options: [string, string, string];
  correctIndex: 0 | 1 | 2;
  explanation: string;
}

export interface SafetyQuizAnswerFeedback {
  questionId: string;
  selectedIndex: number | null;
  correctIndex: number;
  isCorrect: boolean;
}

export interface SafetyQuizSummary {
  total: number;
  correctCount: number;
  percentage: number;
  passed: boolean;
  items: SafetyQuizAnswerFeedback[];
}

export interface StoredSafetyQuizResult {
  dateKey: string;
  correctCount: number;
  total: number;
  percentage: number;
  completedAt: string;
}

export interface WorkerSafetyQuizStats {
  points: number;
  quizzesCompleted: number;
  totalCorrect: number;
  totalAnswered: number;
  lastUpdatedAt: string | null;
}

export interface SafetyLeaderboardPeer {
  id: string;
  name: string;
  role: string;
  neighborhood: string;
  points: number;
  quizzesCompleted: number;
  totalCorrect: number;
  totalAnswered: number;
}

export interface SafetyLeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  role: string;
  neighborhood: string;
  points: number;
  quizzesCompleted: number;
  accuracyPct: number;
  isCurrentUser: boolean;
}

export interface SafetyLeaderboardResult {
  topThree: SafetyLeaderboardEntry[];
  currentUserEntry: SafetyLeaderboardEntry;
  totalParticipants: number;
  pointsToTopThree: number;
}

const SAFETY_READ_STORAGE_PREFIX = 'brickjobs:safety_read:';
const SAFETY_QUIZ_STORAGE_PREFIX = 'brickjobs:safety_quiz:';
const SAFETY_STATS_STORAGE_KEY = 'brickjobs:safety_quiz_stats';

export const SAFETY_CATEGORY_OPTIONS: Array<{
  id: SafetyTipCategory;
  label: string;
}> = [
  { id: 'todos', label: 'Todas' },
  { id: 'epis', label: 'EPIs' },
  { id: 'prevencao', label: 'Prevenção' },
  { id: 'altura_eletrica', label: 'Altura e Elétrica' },
  { id: 'canteiro', label: 'Canteiro e Saúde' },
];

export const DAILY_SAFETY_TIPS: SafetyTip[] = [
  {
    id: 'epi-capacete-jugular',
    category: 'epis',
    categoryLabel: 'Uso de EPIs',
    nrReference: 'NR-06 · Proteção da Cabeça',
    title: 'Use capacete com jugular ajustada em toda área de obra',
    recommendedPractice:
      'Mantenha o capacete classe B ajustado com a fita jugular presa abaixo do queixo e substitua imediatamente o casco se houver trincas, amassados ou desgaste na suspensão interna.',
    whyItMatters:
      'Evita traumatismos por queda de blocos, ferramentas manuais ou impactos contra andaimes e escoramentos.',
    requiredPpe: [
      'Capacete com jugular',
      'Óculos de proteção',
      'Botina com biqueira',
    ],
    targetRoles: ['Geral', 'Pedreiro', 'Servente', 'Mestre de Obras'],
    requiredCompetencies: [
      'Inspeção visual pré-uso do casco e suspensão (NR-06)',
      'Cumprimento das regras de circulação e DDS no canteiro (NR-18)',
    ],
    preferredCompetencies: [
      'Conhecimento de classes de isolamento do capacete (Classe A/B)',
      'Participação ativa em treinamentos periódicos de segurança',
    ],
  },
  {
    id: 'altura-cinto-ancoragem',
    category: 'altura_eletrica',
    categoryLabel: 'Altura e Elétrica',
    nrReference: 'NR-35 · Trabalho em Altura',
    title: 'Acima de 2 metros, ancore o cinto paraquedista antes de pisar no andaime',
    recommendedPractice:
      'Conecte o talabarte duplo ou trava-quedas em ponto de ancoragem estrutural independente (linha de vida), nunca no próprio guarda-corpo do andaime.',
    whyItMatters:
      'Quedas de altura são a principal causa de acidentes graves na construção; a ancoragem dupla mantém você preso durante toda a movimentação.',
    requiredPpe: [
      'Cinto tipo paraquedista',
      'Talabarte duplo com absorvedor',
      'Capacete com jugular',
    ],
    targetRoles: ['Pedreiro', 'Carpinteiro', 'Pintor', 'Armador', 'Azulejista'],
    requiredCompetencies: [
      'Certificado NR-35 válido e ASO com aptidão para altura',
      'Identificação de pontos de ancoragem independentes (1.500 kgf)',
    ],
    preferredCompetencies: [
      'Experiência em montagem e conferência de andaimes fachadeiros',
      'Noções de resgate e cálculo de zona livre de queda (ZLQ)',
    ],
  },
  {
    id: 'prevencao-serra-disco',
    category: 'prevencao',
    categoryLabel: 'Prevenção de Acidentes',
    nrReference: 'NR-12 · Máquinas e Ferramentas',
    title: 'Nunca remova a coifa protetora da serra circular ou esmerilhadeira',
    recommendedPractice:
      'Verifique antes de ligar se o disco corresponde à rotação da máquina, se a proteção retrátil está livre e desligue o cabo da tomada antes de trocar o disco.',
    whyItMatters:
      'Impede estilhaçamento de disco em alta rotação e cortes profundos em mãos, braços e rosto.',
    requiredPpe: [
      'Protetor facial ou óculos ampla visão',
      'Protetor auricular',
      'Luva de vaqueta ou anticorte',
    ],
    targetRoles: ['Carpinteiro', 'Armador', 'Pedreiro', 'Azulejista'],
    requiredCompetencies: [
      'Capacitação NR-12 para operação segura de serras e ferramentas rotativas',
      'Conferência de RPM máxima e validade do disco de corte',
    ],
    preferredCompetencies: [
      'Prática em bloqueio e desconexão elétrica na troca de acessórios',
      'Checklist diário de cabos, plugues e coifa retrátil',
    ],
  },
  {
    id: 'eletrica-bloqueio-quadro',
    category: 'altura_eletrica',
    categoryLabel: 'Altura e Elétrica',
    nrReference: 'NR-10 · Segurança em Eletricidade',
    title: 'Desenergize, bloqueie e teste antes de tocar em qualquer circuito',
    recommendedPractice:
      'Desligue o disjuntor correspondente, trave e sinalize o quadro de distribuição e confirme ausência de tensão com multímetro ou detector calibrado.',
    whyItMatters:
      'Evita choques elétricos, arcos voltaicos e queimaduras ao montar quadros (QDC) ou passar cabeamento.',
    requiredPpe: [
      'Luva isolante de borracha',
      'Botina sem partes metálicas (isolante)',
      'Óculos de segurança anti-arco',
    ],
    targetRoles: ['Eletricista', 'Instalações Elétricas', 'Manutenção'],
    requiredCompetencies: [
      'Certificado NR-10 atualizado e leitura de diagramas unifilares',
      'Procedimento de bloqueio, etiquetagem (LOTO) e teste de ausência de tensão',
    ],
    preferredCompetencies: [
      'Qualificação NR-10 SEP para redes de média tensão e subestações',
      'Experiência em painéis industriais (QGBT) e testes com megômetro',
    ],
  },
  {
    id: 'epi-respiratorio-cimento',
    category: 'epis',
    categoryLabel: 'Uso de EPIs',
    nrReference: 'NR-06 · Vias Aéreas e Pele',
    title: 'Proteja pulmões e mãos ao preparar argamassa, lixar ou cortar blocos',
    recommendedPractice:
      'Utilize respirador PFF2 ao ensacar cimento, lixar massa corrida ou cortar revestimentos cerâmicos a seco, além de luvas impermeáveis no contato com cal e cimento.',
    whyItMatters:
      'Reduz a inalação de poeira de sílica e previne dermatites químicas causadas pela alcalinidade do cimento úmido.',
    requiredPpe: [
      'Respirador PFF2 com válvula',
      'Luva nitrílica ou látex reforçado',
      'Óculos de vedação',
    ],
    targetRoles: ['Servente', 'Pedreiro', 'Pintor', 'Azulejista'],
    requiredCompetencies: [
      'Teste prático de vedação facial do respirador PFF2 (NR-06)',
      'Higienização e escolha correta de luvas contra agentes alcalinos',
    ],
    preferredCompetencies: [
      'Corte úmido para redução de poeira de sílica no canteiro',
      'Identificação precoce de desgaste e saturação de filtros',
    ],
  },
  {
    id: 'canteiro-hidratacao-sol',
    category: 'canteiro',
    categoryLabel: 'Canteiro e Saúde',
    nrReference: 'NR-21 · Trabalho a Céu Aberto',
    title: 'Reforce a hidratação e pausas à sombra nos horários de pico em Rondonópolis',
    recommendedPractice:
      'Beba água potável a cada 30 minutos em lajes e frentes externas, use camisa de manga longa com proteção UV e aplique protetor solar nas áreas expostas.',
    whyItMatters:
      'Previne insolação, tontura e perda de atenção operacional causadas pelo calor intenso do cerrado mato-grossense.',
    requiredPpe: [
      'Capacete com aba ou touca árabe',
      'Uniforme manga longa',
      'Óculos com filtro UV',
    ],
    targetRoles: ['Geral', 'Armador', 'Servente', 'Pedreiro'],
    requiredCompetencies: [
      'Reconhecimento de sinais de estresse térmico e desidratação (NR-21)',
      'Uso contínuo de vestimenta UV e proteção ocular externa',
    ],
    preferredCompetencies: [
      'Organização de rodízio de pausas em lajes e pátios industriais abertos',
      'Noções de primeiros socorros em caso de insolação',
    ],
  },
  {
    id: 'prevencao-vergalhoes-pontas',
    category: 'prevencao',
    categoryLabel: 'Prevenção de Acidentes',
    nrReference: 'NR-18 · Armações e Arranques',
    title: 'Isole todas as pontas expostas de vergalhões com protetores plásticos',
    recommendedPractice:
      'Antes de iniciar a concretagem ou circular perto de pilares e sapatas, confira se cada espera de aço vertical está coberta com ponteira protetora laranja ou dobrada.',
    whyItMatters:
      'Elimina o risco de perfurações graves em caso de tropeço ou queda próxima a arranques de pilares.',
    requiredPpe: [
      'Luva de raspa ou anticorte',
      'Botina com palmilha antiperfurante',
      'Capacete',
    ],
    targetRoles: ['Armador', 'Pedreiro', 'Servente', 'Mestre de Obras'],
    requiredCompetencies: [
      'Bloqueio e proteção de esperas verticais conforme NR-18',
      'Uso de botina com palmilha antiperfurante e biqueira resistente',
    ],
    preferredCompetencies: [
      'Leitura de projeto de arranques e cálices de fundação',
      'Organização de estoque de aço CA-50/CA-60 em bancadas',
    ],
  },
  {
    id: 'prevencao-escavacao-talude',
    category: 'prevencao',
    categoryLabel: 'Prevenção de Acidentes',
    nrReference: 'NR-18 · Escavações e Valas',
    title: 'Não entre em valas acima de 1,25 m sem escoramento e escada de saída',
    recommendedPractice:
      'Mantenha a terra retirada a pelo menos 1 metro da borda da vala, verifique rachaduras no solo após chuvas e garanta escada de acesso próxima à frente de serviço.',
    whyItMatters:
      'Previne soterramentos por desmoronamento súbito de barrancos, especialmente após chuvas fortes.',
    requiredPpe: [
      'Capacete com jugular',
      'Botina impermeável de segurança',
      'Colete refletivo',
    ],
    targetRoles: ['Servente', 'Pedreiro', 'Mestre de Obras'],
    requiredCompetencies: [
      'Avaliação visual de taludes e escoramento de valas (NR-18)',
      'Sinalização periférica e afastamento de sobrecarga nas bordas',
    ],
    preferredCompetencies: [
      'Atuação coordenada com operador de retroescavadeira (NR-11)',
      'Conhecimento de drenagem provisória em fundações industriais',
    ],
  },
  {
    id: 'epi-auditivo-martelete',
    category: 'epis',
    categoryLabel: 'Uso de EPIs',
    nrReference: 'NR-06 / NR-15 · Proteção Auditiva',
    title: 'Use protetor auricular contínuo ao operar martelete, betoneira ou makita',
    recommendedPractice:
      'Coloque o protetor tipo plugue ou concha antes de iniciar o corte ou demolição, higienize o equipamento ao fim do turno e guarde em estojo limpo.',
    whyItMatters:
      'Protege contra perda auditiva irreversível e reduz a fadiga causada por ruído acima de 85 dB.',
    requiredPpe: [
      'Protetor auricular (plugue ou concha)',
      'Óculos de proteção contra impactos',
      'Luva antivibração',
    ],
    targetRoles: ['Pedreiro', 'Servente', 'Carpinteiro', 'Azulejista'],
    requiredCompetencies: [
      'Colocação e vedação corretas do protetor auditivo (NR-06 / NR-15)',
      'Uso de luva antivibração e controle de tempo de exposição',
    ],
    preferredCompetencies: [
      'Noções de dupla proteção auditiva em áreas com ruído acima de 95 dB',
      'Inspeção periódica de espumas e selos do abafador concha',
    ],
  },
  {
    id: 'canteiro-organizacao-fios',
    category: 'canteiro',
    categoryLabel: 'Canteiro e Saúde',
    nrReference: 'NR-18 · Ordem e Limpeza',
    title: 'Passe extensões elétricas pelo alto e retire pregos de tábuas usadas',
    recommendedPractice:
      'Suspenda cabos de ferramentas em ganchos isolantes longe de poças d’água e desentorte ou retire todos os pregos de formas desmontadas antes de empilhá-las.',
    whyItMatters:
      'Evita quedas no mesmo nível, curtos-circuitos em piso molhado e perfurações nos pés.',
    requiredPpe: [
      'Botina com palmilha de aço/kevlar',
      'Luva de raspa',
      'Capacete',
    ],
    targetRoles: ['Carpinteiro', 'Servente', 'Eletricista', 'Geral'],
    requiredCompetencies: [
      'Aplicação de organização 5S e rotas desobstruídas no canteiro (NR-18)',
      'Suspensão segura de cabos longe de umidade e trânsito de máquinas',
    ],
    preferredCompetencies: [
      'Triagem de madeiras e sucata metálica para descarte sustentável',
      'Verificação de quadro elétrico provisório com dispositivo DR',
    ],
  },
  {
    id: 'altura-escada-inclinacao',
    category: 'altura_eletrica',
    categoryLabel: 'Altura e Elétrica',
    nrReference: 'NR-18 / NR-35 · Escadas Portáteis',
    title: 'Apoie a escada em piso firme, ultrapassando 1 metro o ponto de chegada',
    recommendedPractice:
      'Posicione a base na proporção 1:4 da altura, amarre o topo ou peça apoio no pé da escada e nunca suba carregando baldes ou ferramentas nas mãos.',
    whyItMatters:
      'Impede escorregamento da base da escada e desequilíbrio durante a subida e descida.',
    requiredPpe: [
      'Botina com solado antiderrapante',
      'Cinto de ferramentas',
      'Capacete com jugular',
    ],
    targetRoles: ['Pintor', 'Eletricista', 'Pedreiro', 'Carpinteiro'],
    requiredCompetencies: [
      'Regra de inclinação 1:4, amarração no topo e regra dos 3 pontos de apoio',
      'Uso de escada de fibra isolante em proximidade elétrica (NR-10 / NR-35)',
    ],
    preferredCompetencies: [
      'Preferência por plataforma elevatória (PTA) ou andaime com guarda-corpo',
      'Uso de bolsa ou cinto porta-ferramentas certificado',
    ],
  },
  {
    id: 'canteiro-postura-carga',
    category: 'canteiro',
    categoryLabel: 'Canteiro e Saúde',
    nrReference: 'NR-17 · Ergonomia na Obra',
    title: 'Divida cargas pesadas e dobre os joelhos ao levantar sacos de cimento',
    recommendedPractice:
      'Mantenha a coluna reta, aproxime o peso do corpo ao erguer materiais e utilize carrinho de mão ou ajuda de um colega para volumes acima de 25 kg.',
    whyItMatters:
      'Previne lombalgias, hérnias e afastamentos por esforço repetitivo no transporte de massa e blocos.',
    requiredPpe: [
      'Luva pigmentada ou vaqueta',
      'Botina de segurança',
      'Capacete',
    ],
    targetRoles: ['Servente', 'Pedreiro', 'Armador', 'Geral'],
    requiredCompetencies: [
      'Técnica ergonômica de levantamento manual de cargas (NR-17)',
      'Uso de carrinhos, paleteiras ou apoio em dupla para cargas acima de 25 kg',
    ],
    preferredCompetencies: [
      'Noções de amarração e distribuição de carga em paletes',
      'Alongamento breve antes do turno de trabalho',
    ],
  },
  {
    id: 'industrial-icamento-premoldados',
    category: 'prevencao',
    categoryLabel: 'Pré-Moldados e Industriais',
    nrReference: 'NR-11 / NR-18 · Içamento de Pré-Moldados',
    title: 'Isole o raio de giro e use cordas-guia ao içar pilares e vigas pré-moldadas',
    recommendedPractice:
      'Antes de erguer elementos pré-moldados com guindaste ou munck, inspecione cintas, cabos de aço e manilhas, confira o patolamento em solo firme e conduza a peça apenas com cordas-guia fora da área isolada.',
    whyItMatters:
      'Cargas suspensas de toneladas são fatais em caso de ruptura de cinta ou balanço por vento; nunca passe ou posicione mãos sob peças pré-moldadas em movimentação.',
    requiredPpe: [
      'Capacete com jugular e proteção contra impacto lateral',
      'Botina com biqueira composite/aço e palmilha antiperfurante',
      'Luva de vaqueta ou anticorte reforçada',
      'Colete de alta visibilidade (classe 2)',
    ],
    targetRoles: [
      'Montador de Pré-Moldados',
      'Operador de Guindaste / Içamento',
      'Armador',
      'Operador de Máquinas',
      'Mestre de Obras',
    ],
    requiredCompetencies: [
      'Capacitação NR-11 em movimentação, içamento e armazenagem de cargas',
      'Atendimento ao plano de rigging, isolamento de área e sinais padronizados (NR-18)',
    ],
    preferredCompetencies: [
      'Vivência na montagem de pilares, vigas protendidas e lajes alveolares',
      'Inspeção visual de cintas têxteis, olhais de içamento e manilhas',
    ],
  },
  {
    id: 'industrial-central-premoldados-nr12',
    category: 'epis',
    categoryLabel: 'Pré-Moldados e Industriais',
    nrReference: 'NR-12 / NR-06 · Máquinas e Centrais Industriais',
    title: 'Proteja audição, olhos e pulmões em centrais de pré-moldados e mesas vibratórias',
    recommendedPractice:
      'Nunca burle grades de segurança, sensores ou botões de parada de emergência em pontes rolantes, betoneiras industriais e policortes. Use dupla proteção onde o ruído superar 95 dB e respirador PFF2 contra sílica.',
    whyItMatters:
      'Máquinas de pré-fabricação possuem pontos de esmagamento, cisalhamento e alta emissão de ruído e poeira mineral de concreto.',
    requiredPpe: [
      'Protetor auditivo tipo concha de alta atenuação',
      'Óculos de ampla visão contra estilhaços e nata de cimento',
      'Respirador PFF2 contra sílica cristalina',
      'Luva antivibração ou anticorte',
    ],
    targetRoles: [
      'Montador de Pré-Moldados',
      'Operador de Máquinas',
      'Soldador',
      'Pedreiro',
      'Servente',
    ],
    requiredCompetencies: [
      'Treinamento NR-12 para operação segura e bloqueio de energia perigosa',
      'Uso correto de EPIs para ruído (NR-15) e poeira mineral (NR-06)',
    ],
    preferredCompetencies: [
      'Experiência em pátio ou fábrica de elementos pré-moldados',
      'Checklist diário de ponte rolante, vibradores de concreto e esmerilhadeiras',
    ],
  },
  {
    id: 'industrial-montagem-altura-galpoes',
    category: 'altura_eletrica',
    categoryLabel: 'Pré-Moldados e Industriais',
    nrReference: 'NR-35 / NR-18 · Montagem Industrial em Altura',
    title: 'Na montagem de galpões e coberturas pré-moldadas, ancore-se em linha de vida certificada',
    recommendedPractice:
      'Instale a linha de vida horizontal antes do içamento das vigas e terças, utilize plataforma elevatória (PTA/PEMT) com guarda-corpo travado e paralise o içamento se o vento ultrapassar o limite técnico da APR.',
    whyItMatters:
      'Montagens industriais acontecem acima de 6 a 12 metros com peças pesadas e risco combinado de queda, vento lateral e proximidade de redes elétricas.',
    requiredPpe: [
      'Cinto paraquedista com 2 pontos de ancoragem e absorvedor',
      'Trava-quedas retrátil ou talabarte em Y certificado',
      'Capacete com jugular de 3 pontos',
      'Botina antiderrapante com suporte de tornozelo',
    ],
    targetRoles: [
      'Montador de Pré-Moldados',
      'Soldador',
      'Eletricista',
      'Carpinteiro',
      'Mestre de Obras',
    ],
    requiredCompetencies: [
      'Certificado NR-35 válido e emissão diária de Permissão de Trabalho (PT)',
      'Operação segura com linha de vida, trava-quedas e Análise Preliminar de Risco (APR)',
    ],
    preferredCompetencies: [
      'Qualificação para operação de plataforma elevatória móvel (PEMT/PTA — NR-18)',
      'Experiência com solda ou aparafusamento estrutural em galpões industriais',
    ],
  },
  {
    id: 'sustentavel-epis-alternativas',
    category: 'epis',
    categoryLabel: 'Construções Sustentáveis',
    nrReference: 'NR-06 / NR-18 · Construções Alternativas e Sustentáveis',
    title: 'Corte de placas cimentícias, steel frame e solo-cimento exige PFF2 e luva anticorte',
    recommendedPractice:
      'Ao cortar perfis metálicos de Light Steel Frame, chapas de drywall/cimentícias ou prensar tijolo ecológico de solo-cimento, utilize respirador PFF2 vedado, óculos herméticos e luvas táteis anticorte.',
    whyItMatters:
      'Construções secas e ecológicas reduzem entulho, mas liberam partículas finas respiráveis e bordas metálicas cortantes nos perfis galvanizados.',
    requiredPpe: [
      'Respirador PFF2/PFF3 com vedação nasal ajustada',
      'Óculos de segurança com vedação periférica',
      'Luva anticorte tátil (nível A3/A4) para perfis metálicos',
      'Protetor auricular',
    ],
    targetRoles: [
      'Especialista em Construções Sustentáveis',
      'Carpinteiro',
      'Pedreiro',
      'Soldador',
    ],
    requiredCompetencies: [
      'Verificação de CA válido e conservação de EPIs conforme NR-06',
      'Leitura de projeto modulado para montagem seca ou solo-cimento (NR-18)',
    ],
    preferredCompetencies: [
      'Prática em Light Steel Frame, Wood Frame ou tijolo ecológico',
      'Triagem limpa e reaproveitamento de sobras metálicas e minerais',
    ],
  },
];

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatSafetyDatePtBr(date: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
    }).format(date);
  } catch {
    return getLocalDateKey(date);
  }
}

export function filterSafetyTips(
  tips: SafetyTip[],
  category: SafetyTipCategory
): SafetyTip[] {
  if (category === 'todos') return tips;
  return tips.filter((tip) => tip.category === category);
}

export function isTipRelevantToRole(tip: SafetyTip, role?: string): boolean {
  const normalizedRole = normalizeText(role ?? '');
  if (!normalizedRole) return false;
  return tip.targetRoles.some((target) => {
    const normalizedTarget = normalizeText(target);
    if (normalizedTarget === 'geral') return false;
    return (
      normalizedRole.includes(normalizedTarget) ||
      normalizedTarget.includes(normalizedRole)
    );
  });
}

export function getDailyTipIndex(
  date: Date,
  totalTips: number,
  roleHint?: string
): number {
  if (totalTips <= 0) return 0;
  const epochDays = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000
  );
  const roleShift = normalizeText(roleHint ?? '')
    .split('')
    .reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const raw = (epochDays + roleShift) % totalTips;
  return raw < 0 ? raw + totalTips : raw;
}

export function getDailySafetyTip(params?: {
  date?: Date;
  roleHint?: string;
  category?: SafetyTipCategory;
  offset?: number;
  tips?: SafetyTip[];
}): DailySafetyTipResult {
  const date = params?.date ?? new Date();
  const category = params?.category ?? 'todos';
  const offset = params?.offset ?? 0;
  const sourceTips = params?.tips ?? DAILY_SAFETY_TIPS;

  const scoped = filterSafetyTips(sourceTips, category);
  const pool = scoped.length > 0 ? scoped : sourceTips;

  const baseIndex = getDailyTipIndex(date, pool.length, params?.roleHint);
  const index =
    (((baseIndex + offset) % pool.length) + pool.length) % pool.length;

  return {
    tip: pool[index],
    index,
    totalInScope: pool.length,
    dateKey: getLocalDateKey(date),
    dateLabel: formatSafetyDatePtBr(date),
  };
}

export function loadAcknowledgedSafetyTips(dateKey: string): string[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(
      `${SAFETY_READ_STORAGE_PREFIX}${dateKey}`
    );
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    return [];
  }
}

export function toggleAcknowledgedSafetyTip(
  currentIds: string[],
  tipId: string,
  dateKey?: string
): string[] {
  const exists = currentIds.includes(tipId);
  const next = exists
    ? currentIds.filter((id) => id !== tipId)
    : [...currentIds, tipId];

  if (dateKey && typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(
        `${SAFETY_READ_STORAGE_PREFIX}${dateKey}`,
        JSON.stringify(next)
      );
    } catch {
      // Ignore storage quota restrictions
    }
  }

  return next;
}

export const SAFETY_QUIZ_QUESTIONS: SafetyQuizQuestion[] = [
  {
    id: 'quiz-capacete-jugular',
    tipId: 'epi-capacete-jugular',
    nrReference: 'NR-06 · Proteção da Cabeça',
    question:
      'Qual detalhe garante que o capacete classe B não saia da cabeça em uma queda ou movimento brusco no andaime?',
    options: [
      'Usar o capacete frouxo para ventilar melhor no calor',
      'Manter a fita jugular ajustada abaixo do queixo e casco sem trincas',
      'Colocar um boné comum por baixo do capacete sem regular a suspensão',
    ],
    correctIndex: 1,
    explanation:
      'A jugular presa abaixo do queixo impede o deslocamento do capacete e o casco íntegro garante absorção correta de impactos.',
  },
  {
    id: 'quiz-altura-cinto',
    tipId: 'altura-cinto-ancoragem',
    nrReference: 'NR-35 · Trabalho em Altura',
    question:
      'Ao trabalhar em altura acima de 2 metros, onde o talabarte do cinto paraquedista deve ser ancorado?',
    options: [
      'Em ponto de ancoragem estrutural independente ou linha de vida',
      'Na própria tábua ou guarda-corpo provisório do andaime',
      'No cabo de extensão elétrica próximo à parede',
    ],
    correctIndex: 0,
    explanation:
      'A NR-35 exige ancoragem em ponto estrutural independente e resistente para segurar o trabalhador mesmo se o andaime ceder.',
  },
  {
    id: 'quiz-serra-disco',
    tipId: 'prevencao-serra-disco',
    nrReference: 'NR-12 · Máquinas e Ferramentas',
    question:
      'Antes de trocar o disco de uma serra circular ou esmerilhadeira, qual procedimento é obrigatório?',
    options: [
      'Apenas soltar o gatilho mantendo o plugue ligado na tomada',
      'Retirar a coifa protetora para ter mais espaço de manobra',
      'Desligar o cabo da tomada, manter a coifa e conferir a rotação do disco',
    ],
    correctIndex: 2,
    explanation:
      'Desconectar da energia evita acionamento acidental, e a coifa protetora contém estilhaços caso o disco se rompa.',
  },
  {
    id: 'quiz-eletrica-bloqueio',
    tipId: 'eletrica-bloqueio-quadro',
    nrReference: 'NR-10 · Segurança em Eletricidade',
    question:
      'Qual conjunto de ações e EPIs protege o eletricista ao intervir em um quadro de distribuição (QDC)?',
    options: [
      'Desligar o disjuntor, bloquear/sinalizar, testar ausência de tensão e usar luva isolante e botina sem partes metálicas',
      'Usar apenas luva de pano seca e desligar somente o interruptor da parede',
      'Trabalhar descalço sobre papelão seco sem desligar o disjuntor geral',
    ],
    correctIndex: 0,
    explanation:
      'Desenergizar, travar, confirmar com detector e vestir EPIs dielétricos (luva isolante e botina sem metal) eliminam risco de choque e arco elétrico.',
  },
  {
    id: 'quiz-respiratorio-cimento',
    tipId: 'epi-respiratorio-cimento',
    nrReference: 'NR-06 · Vias Aéreas e Pele',
    question:
      'Quais EPIs são essenciais ao preparar argamassa, lixar massa corrida ou cortar piso cerâmico a seco?',
    options: [
      'Apenas protetor auricular e boné de algodão',
      'Respirador PFF2, óculos de vedação e luva impermeável (nitrílica ou látex)',
      'Luva de pano aberta e óculos escuros comuns',
    ],
    correctIndex: 1,
    explanation:
      'O PFF2 barra poeira de sílica, os óculos protegem contra partículas e a luva impermeável previne queimaduras químicas do cimento e cal.',
  },
  {
    id: 'quiz-canteiro-sol',
    tipId: 'canteiro-hidratacao-sol',
    nrReference: 'NR-21 · Trabalho a Céu Aberto',
    question:
      'Para prevenir insolação e queda de atenção sob sol forte em lajes abertas de Rondonópolis, o que é recomendado?',
    options: [
      'Esperar sentir muita sede para beber água no fim do expediente',
      'Trabalhar sem camisa para refrescar mais rápido',
      'Beber água a cada 30 minutos, usar uniforme manga longa UV, protetor solar e touca árabe',
    ],
    correctIndex: 2,
    explanation:
      'Hidratação frequente combinada com manga longa UV, filtro solar e proteção de nuca evita desidratação e insolação.',
  },
  {
    id: 'quiz-vergalhoes-pontas',
    tipId: 'prevencao-vergalhoes-pontas',
    nrReference: 'NR-18 · Armações e Arranques',
    question:
      'Como neutralizar o risco de perfuração perto de esperas de vergalhões expostas em pilares e sapatas?',
    options: [
      'Instalar ponteiras plásticas protetoras em todas as pontas e usar botina com palmilha antiperfurante',
      'Cobrir apenas com pedaços soltos de papelão fino',
      'Deixar as pontas descobertas e apenas avisar verbalmente a equipe',
    ],
    correctIndex: 0,
    explanation:
      'Ponteiras protetoras e botinas com palmilha antiperfurante evitam perfurações graves caso alguém tropece próximo às armaduras.',
  },
  {
    id: 'quiz-escavacao-valas',
    tipId: 'prevencao-escavacao-talude',
    nrReference: 'NR-18 · Escavações e Valas',
    question:
      'Ao trabalhar em valas com mais de 1,25 m de profundidade, quais medidas reduzem o risco de soterramento?',
    options: [
      'Empilhar a terra bem na beirada da vala para facilitar o reaterro',
      'Usar escoramento adequado, escada de saída próxima e manter terra a pelo menos 1 m da borda',
      'Entrar na vala imediatamente após chuva forte sem inspecionar rachaduras',
    ],
    correctIndex: 1,
    explanation:
      'Escoramento, afastamento da carga na borda e escada de escape garantem estabilidade do solo e saída rápida em emergências.',
  },
  {
    id: 'quiz-auditivo-martelete',
    tipId: 'epi-auditivo-martelete',
    nrReference: 'NR-06 / NR-15 · Proteção Auditiva',
    question:
      'Durante demolições com martelete ou cortes contínuos com serra mármore, qual cuidado protege a audição?',
    options: [
      'Colocar algodão comum no ouvido apenas nos últimos 10 minutos',
      'Usar protetor auricular (plugue ou concha) desde o início da tarefa e óculos contra impactos',
      'Abaixar o volume apenas nos intervalos sem usar EPI',
    ],
    correctIndex: 1,
    explanation:
      'Ruídos acima de 85 dB causam perda auditiva irreversível; o protetor auricular deve ser vestido antes de ligar o equipamento.',
  },
  {
    id: 'quiz-organizacao-fios',
    tipId: 'canteiro-organizacao-fios',
    nrReference: 'NR-18 · Ordem e Limpeza',
    question:
      'Qual combinação previne choques em poças d’água e perfurações nos pés ao circular pelo canteiro?',
    options: [
      'Suspender extensões em ganchos isolantes, retirar pregos de tábuas e usar botina com palmilha de aço/kevlar',
      'Passar fios desencapados pelo chão molhado usando tênis comum',
      'Empilhar madeiras com pregos virados para cima perto da passagem',
    ],
    correctIndex: 0,
    explanation:
      'Cabos suspensos evitam curto em piso úmido, a retirada de pregos limpa o trajeto e a palmilha antiperfurante protege a planta do pé.',
  },
  {
    id: 'quiz-escada-inclinacao',
    tipId: 'altura-escada-inclinacao',
    nrReference: 'NR-18 / NR-35 · Escadas Portáteis',
    question:
      'Ao posicionar uma escada portátil para subir a uma laje, qual prática garante estabilidade com segurança?',
    options: [
      'Subir carregando balde pesado numa das mãos sem amarrar a escada',
      'Apoiar em piso firme na proporção 1:4, ultrapassar 1 metro o topo, usar cinto de ferramentas e botina antiderrapante',
      'Apoiar a base sobre dois tijolos para ganhar mais altura',
    ],
    correctIndex: 1,
    explanation:
      'Proporção 1:4, prolongamento de 1 m acima do patamar e mãos livres (cinto de ferramentas) evitam deslizamentos e quedas.',
  },
  {
    id: 'quiz-postura-carga',
    tipId: 'canteiro-postura-carga',
    nrReference: 'NR-17 · Ergonomia na Obra',
    question:
      'Qual forma de movimentar sacos de cimento de 25 kg a 50 kg evita lesões na coluna e acidentes nas mãos?',
    options: [
      'Dobrar apenas as costas mantendo as pernas esticadas e levantar rápido',
      'Flexionar os joelhos com coluna reta, usar luva de vaqueta/pigmentada, botina e carrinho de mão para cargas pesadas',
      'Carregar dois sacos de uma vez nos ombros correndo pelo canteiro',
    ],
    correctIndex: 1,
    explanation:
      'Transferir o esforço para as pernas, usar carrinho ou ajuda em cargas acima de 25 kg e vestir luvas e botina previne lombalgias e esmagamentos.',
  },
  {
    id: 'quiz-industrial-icamento',
    tipId: 'industrial-icamento-premoldados',
    nrReference: 'NR-11 / NR-18 · Içamento de Pré-Moldados',
    question:
      'Ao içar pilares ou vigas pré-moldadas com guindaste (NR-11 e NR-18), qual procedimento garante a segurança da equipe de montagem?',
    options: [
      'Guiar a peça segurando diretamente por baixo com as mãos para acelerar o encaixe',
      'Isolar o raio de giro, conferir cintas e manilhas, conduzir com cordas-guia e usar capacete, botina antiperfurante, luva e colete refletivo',
      'Dispensar o isolamento da área se o operador do munck já tiver experiência',
    ],
    correctIndex: 1,
    explanation:
      'A NR-11 e a NR-18 proíbem permanecer sob carga suspensa: isolamento do raio de giro, inspeção de eslingas, cordas-guia e EPIs completos evitam esmagamentos fatais.',
  },
  {
    id: 'quiz-industrial-central-nr12',
    tipId: 'industrial-central-premoldados-nr12',
    nrReference: 'NR-12 / NR-06 · Máquinas e Centrais Industriais',
    question:
      'Em centrais de pré-moldados com pontes rolantes, mesas vibratórias e corte de aço (NR-12 e NR-15), o que é obrigatório?',
    options: [
      'Manter todas as proteções e paradas de emergência ativas e vestir protetor auricular concha, óculos ampla visão, PFF2 e luva antivibração',
      'Desativar o sensor da grade de proteção para facilitar a limpeza da mesa vibratória ligada',
      'Usar apenas protetor auditivo quando o engenheiro estiver visitando o pátio',
    ],
    correctIndex: 0,
    explanation:
      'A NR-12 exige proteções físicas íntegras nas máquinas industriais, enquanto os EPIs da NR-06 e NR-15 previnem perda auditiva, silicose e lesões por projeção ou vibração.',
  },
  {
    id: 'quiz-industrial-montagem-altura',
    tipId: 'industrial-montagem-altura-galpoes',
    nrReference: 'NR-35 / NR-18 · Montagem Industrial em Altura',
    question:
      'Na montagem em altura de coberturas e vigas pré-moldadas em galpões industriais (NR-35 e NR-18), o que deve ser feito?',
    options: [
      'Subir sem linha de vida para ganhar agilidade antes do fim do turno',
      'Emitir PT/APR, ancorar cinto paraquedista com trava-quedas em linha de vida certificada e respeitar os limites de vento',
      'Apoiar o corpo apenas na borda da viga recém-posicionada sem talabarte',
    ],
    correctIndex: 1,
    explanation:
      'A montagem industrial em altura exige Permissão de Trabalho (PT), linha de vida independente, cinto paraquedista com trava-quedas e suspensão imediata sob ventos fortes.',
  },
  {
    id: 'quiz-sustentavel-epis',
    tipId: 'sustentavel-epis-alternativas',
    nrReference: 'NR-06 / NR-18 · Construções Alternativas e Sustentáveis',
    question:
      'Ao cortar perfis metálicos de Steel Frame, placas cimentícias ou tijolo ecológico (solo-cimento), quais EPIs protegem o trabalhador?',
    options: [
      'Respirador PFF2/PFF3 vedado, óculos com vedação periférica, luva anticorte tátil e protetor auricular',
      'Apenas luva de algodão fina e máscara cirúrgica comum',
      'Nenhum EPI respiratório é necessário porque placas cimentícias não geram poeira',
    ],
    correctIndex: 0,
    explanation:
      'Cortes em placas cimentícias e solo-cimento liberam partículas respiráveis e os perfis galvanizados possuem bordas cortantes; PFF2, óculos vedados e luva anticorte são essenciais conforme NR-06.',
  },
];

export function getQuizQuestionForTip(
  tipId: string
): SafetyQuizQuestion | undefined {
  return SAFETY_QUIZ_QUESTIONS.find((q) => q.tipId === tipId);
}

export function buildDailySafetyQuiz(params?: {
  primaryTipId?: string;
  dateKey?: string;
  count?: number;
}): SafetyQuizQuestion[] {
  const count = Math.max(1, Math.min(params?.count ?? 3, SAFETY_QUIZ_QUESTIONS.length));
  const selected: SafetyQuizQuestion[] = [];

  if (params?.primaryTipId) {
    const primary = getQuizQuestionForTip(params.primaryTipId);
    if (primary) {
      selected.push(primary);
    }
  }

  const seed = (params?.dateKey ?? getLocalDateKey())
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

  const total = SAFETY_QUIZ_QUESTIONS.length;
  for (let i = 0; i < total && selected.length < count; i += 1) {
    const idx = (seed + i * 3) % total;
    const candidate = SAFETY_QUIZ_QUESTIONS[idx];
    if (!selected.some((q) => q.id === candidate.id)) {
      selected.push(candidate);
    }
  }

  return selected;
}

export function evaluateSafetyQuizAnswers(
  questions: SafetyQuizQuestion[],
  selectedIndices: Array<number | null>
): SafetyQuizSummary {
  const total = questions.length;
  const items: SafetyQuizAnswerFeedback[] = questions.map((q, idx) => {
    const selectedIndex =
      typeof selectedIndices[idx] === 'number' ? selectedIndices[idx] : null;
    const isCorrect = selectedIndex === q.correctIndex;
    return {
      questionId: q.id,
      selectedIndex,
      correctIndex: q.correctIndex,
      isCorrect,
    };
  });

  const correctCount = items.filter((item) => item.isCorrect).length;
  const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const passed = total > 0 && correctCount >= Math.ceil(total * 0.66);

  return {
    total,
    correctCount,
    percentage,
    passed,
    items,
  };
}

export function loadSafetyQuizResult(
  dateKey: string
): StoredSafetyQuizResult | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(
      `${SAFETY_QUIZ_STORAGE_PREFIX}${dateKey}`
    );
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredSafetyQuizResult>;
    if (
      typeof parsed.correctCount === 'number' &&
      typeof parsed.total === 'number' &&
      typeof parsed.percentage === 'number' &&
      parsed.dateKey === dateKey
    ) {
      return {
        dateKey: parsed.dateKey,
        correctCount: parsed.correctCount,
        total: parsed.total,
        percentage: parsed.percentage,
        completedAt:
          typeof parsed.completedAt === 'string'
            ? parsed.completedAt
            : new Date().toISOString(),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function saveSafetyQuizResult(
  dateKey: string,
  summary: SafetyQuizSummary
): StoredSafetyQuizResult {
  const record: StoredSafetyQuizResult = {
    dateKey,
    correctCount: summary.correctCount,
    total: summary.total,
    percentage: summary.percentage,
    completedAt: new Date().toISOString(),
  };

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(
        `${SAFETY_QUIZ_STORAGE_PREFIX}${dateKey}`,
        JSON.stringify(record)
      );
    } catch {
      // Ignore storage quota restrictions
    }
  }

  return record;
}

export const EMPTY_WORKER_SAFETY_STATS: WorkerSafetyQuizStats = {
  points: 0,
  quizzesCompleted: 0,
  totalCorrect: 0,
  totalAnswered: 0,
  lastUpdatedAt: null,
};

export const SEEDED_SAFETY_LEADERBOARD_PEERS: SafetyLeaderboardPeer[] = [
  {
    id: 'peer-carlos',
    name: 'Carlos Eduardo M.',
    role: 'Pedreiro',
    neighborhood: 'Vila Aurora',
    points: 70,
    quizzesCompleted: 2,
    totalCorrect: 6,
    totalAnswered: 6,
  },
  {
    id: 'peer-marcos',
    name: 'Marcos Vinícius R.',
    role: 'Eletricista Predial',
    neighborhood: 'Centro',
    points: 55,
    quizzesCompleted: 2,
    totalCorrect: 5,
    totalAnswered: 6,
  },
  {
    id: 'peer-antonio',
    name: 'Antônio Pereira S.',
    role: 'Armador de Ferragem',
    neighborhood: 'Distrito Industrial',
    points: 20,
    quizzesCompleted: 1,
    totalCorrect: 2,
    totalAnswered: 3,
  },
  {
    id: 'peer-lucas',
    name: 'Lucas Henrique F.',
    role: 'Carpinteiro',
    neighborhood: 'Jardim Atlântico',
    points: 10,
    quizzesCompleted: 1,
    totalCorrect: 1,
    totalAnswered: 3,
  },
];

export function calculateQuizPoints(summary: {
  correctCount: number;
  total: number;
}): number {
  const safeCorrect = Math.max(0, Math.floor(summary.correctCount));
  const safeTotal = Math.max(0, Math.floor(summary.total));
  const perfectBonus = safeTotal > 0 && safeCorrect === safeTotal ? 5 : 0;
  return safeCorrect * 10 + perfectBonus;
}

export function loadWorkerSafetyStats(): WorkerSafetyQuizStats {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { ...EMPTY_WORKER_SAFETY_STATS };
  }
  try {
    const raw = window.localStorage.getItem(SAFETY_STATS_STORAGE_KEY);
    if (!raw) return { ...EMPTY_WORKER_SAFETY_STATS };
    const parsed = JSON.parse(raw) as Partial<WorkerSafetyQuizStats>;
    if (
      typeof parsed.points === 'number' &&
      typeof parsed.quizzesCompleted === 'number' &&
      typeof parsed.totalCorrect === 'number' &&
      typeof parsed.totalAnswered === 'number'
    ) {
      return {
        points: Math.max(0, parsed.points),
        quizzesCompleted: Math.max(0, parsed.quizzesCompleted),
        totalCorrect: Math.max(0, parsed.totalCorrect),
        totalAnswered: Math.max(0, parsed.totalAnswered),
        lastUpdatedAt:
          typeof parsed.lastUpdatedAt === 'string' ? parsed.lastUpdatedAt : null,
      };
    }
    return { ...EMPTY_WORKER_SAFETY_STATS };
  } catch {
    return { ...EMPTY_WORKER_SAFETY_STATS };
  }
}

export function saveWorkerSafetyStats(
  stats: WorkerSafetyQuizStats
): WorkerSafetyQuizStats {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(
        SAFETY_STATS_STORAGE_KEY,
        JSON.stringify(stats)
      );
    } catch {
      // Ignore storage quota restrictions
    }
  }
  return stats;
}

export function recordWorkerQuizAttempt(
  current: WorkerSafetyQuizStats,
  summary: SafetyQuizSummary
): { nextStats: WorkerSafetyQuizStats; pointsEarned: number } {
  const pointsEarned = calculateQuizPoints(summary);
  const nextStats: WorkerSafetyQuizStats = {
    points: current.points + pointsEarned,
    quizzesCompleted: current.quizzesCompleted + 1,
    totalCorrect: current.totalCorrect + summary.correctCount,
    totalAnswered: current.totalAnswered + summary.total,
    lastUpdatedAt: new Date().toISOString(),
  };
  saveWorkerSafetyStats(nextStats);
  return { nextStats, pointsEarned };
}

export function buildSafetyLeaderboard(params: {
  workerName?: string;
  workerRole?: string;
  workerRegion?: string;
  stats: WorkerSafetyQuizStats;
  peers?: SafetyLeaderboardPeer[];
}): SafetyLeaderboardResult {
  const peers = params.peers ?? SEEDED_SAFETY_LEADERBOARD_PEERS;
  const cleanName = params.workerName?.trim();
  const cleanRole = params.workerRole?.trim();
  const cleanRegion = params.workerRegion?.trim();

  const currentAccuracy =
    params.stats.totalAnswered > 0
      ? Math.round((params.stats.totalCorrect / params.stats.totalAnswered) * 100)
      : 0;

  const combined: Array<Omit<SafetyLeaderboardEntry, 'rank'>> = [
    ...peers.map((peer) => ({
      id: peer.id,
      name: peer.name,
      role: peer.role,
      neighborhood: peer.neighborhood,
      points: peer.points,
      quizzesCompleted: peer.quizzesCompleted,
      accuracyPct:
        peer.totalAnswered > 0
          ? Math.round((peer.totalCorrect / peer.totalAnswered) * 100)
          : 0,
      isCurrentUser: false,
    })),
    {
      id: 'current-worker',
      name: cleanName || 'Você (Operário)',
      role: cleanRole || 'Profissional da Obra',
      neighborhood:
        cleanRegion && cleanRegion !== 'Toda Rondonópolis e Região'
          ? cleanRegion
          : 'Rondonópolis-MT',
      points: params.stats.points,
      quizzesCompleted: params.stats.quizzesCompleted,
      accuracyPct: currentAccuracy,
      isCurrentUser: true,
    },
  ];

  combined.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.accuracyPct !== a.accuracyPct) return b.accuracyPct - a.accuracyPct;
    if (b.quizzesCompleted !== a.quizzesCompleted) {
      return b.quizzesCompleted - a.quizzesCompleted;
    }
    if (a.isCurrentUser !== b.isCurrentUser) {
      return a.isCurrentUser ? -1 : 1;
    }
    return a.name.localeCompare(b.name, 'pt-BR');
  });

  const ranked: SafetyLeaderboardEntry[] = combined.map((entry, idx) => ({
    ...entry,
    rank: idx + 1,
  }));

  const topThree = ranked.slice(0, 3);
  const currentUserEntry =
    ranked.find((entry) => entry.isCurrentUser) ?? ranked[ranked.length - 1];

  const thirdPlacePoints = topThree[2]?.points ?? 0;
  const pointsToTopThree =
    currentUserEntry.rank <= 3
      ? 0
      : Math.max(1, thirdPlacePoints - currentUserEntry.points + 1);

  return {
    topThree,
    currentUserEntry,
    totalParticipants: ranked.length,
    pointsToTopThree,
  };
}


