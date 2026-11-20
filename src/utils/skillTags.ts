/**
 * @file src/utils/skillTags.ts
 * @description Extração, normalização e contagem de tags técnicas de especialidade a partir das vagas publicadas.
 */

import type { JobPosting } from '../types/brickjobs';

export interface SkillTagSummary {
  tag: string;
  label: string;
  count: number;
}

export const CORE_PRIORITY_SKILL_TAGS: string[] = [
  'alvenaria',
  'elétrica',
  'pintura',
];

export const CONSTRUCTION_SKILL_TAGS: string[] = [
  'alvenaria',
  'elétrica',
  'pintura',
  'acabamento',
  'ferragem',
  'carpintaria',
  'hidráulica',
  'segurança',
  'obra e apoio',
  'soldagem',
  'máquinas',
  'projetos',
];

const SKILL_TAG_LABELS: Record<string, string> = {
  alvenaria: 'Alvenaria',
  'elétrica': 'Elétrica',
  pintura: 'Pintura',
  acabamento: 'Acabamento',
  ferragem: 'Ferragem',
  carpintaria: 'Carpintaria',
  'hidráulica': 'Hidráulica',
  'segurança': 'Segurança',
  'obra e apoio': 'Obra e apoio',
  soldagem: 'Soldagem',
  'máquinas': 'Máquinas',
  projetos: 'Projetos',
};

const SKILL_KEYWORDS: Array<{ tag: string; patterns: RegExp[] }> = [
  {
    tag: 'alvenaria',
    patterns: [
      /\bpedreir\w*/,
      /\balvenaria\b/,
      /\breboc\w*/,
      /\bcontrapis\w*/,
      /\bbloco[s]?\b/,
      /\btijolo[s]?\b/,
      /\bconcret\w*/,
      /\bmestre de obras\b/,
    ],
  },
  {
    tag: 'elétrica',
    patterns: [
      /\beletric\w*/,
      /\brede[s]? eletrica[s]?\b/,
      /\binstalac(?:ao|oes) eletrica[s]?\b/,
      /\bquadro[s]? de distribuicao\b/,
      /\bqdc\b/,
      /\bqgbt\b/,
      /\bnbr\s*5410\b/,
      /\bcabeament\w*/,
      /\bbaixa tensao\b/,
      /\bmedia tensao\b/,
      /\baterrament\w*/,
    ],
  },
  {
    tag: 'pintura',
    patterns: [
      /\bpintor\w*/,
      /\bpintura\b/,
      /\btinta[s]?\b/,
      /\bselador\b/,
      /\bacrilic\w*/,
      /\btextura\b/,
      /\bmassa corrida\b/,
      /\bfachada\b/,
    ],
  },
  {
    tag: 'acabamento',
    patterns: [
      /\bazulej\w*/,
      /\brevest\w*/,
      /\bporcelanat\w*/,
      /\bceramic\w*/,
      /\bacabament\w*/,
      /\bgesseir\w*/,
      /\bgesso\b/,
      /\breboco interno\b/,
    ],
  },
  {
    tag: 'ferragem',
    patterns: [
      /\barmador\w*/,
      /\bferragem\b/,
      /\barmadura[s]?\b/,
      /\bvergalha\w*/,
      /\baco\b/,
      /\bferro\b/,
      /\bsapata[s]?\b/,
      /\bpilar(?:es)?\b/,
    ],
  },
  {
    tag: 'carpintaria',
    patterns: [
      /\bcarpint\w*/,
      /\bmadeira\b/,
      /\bforma[s]? de madeira\b/,
      /\bescorament\w*/,
      /\btelhado[s]?\b/,
    ],
  },
  {
    tag: 'hidráulica',
    patterns: [
      /\bencanador\w*/,
      /\bhidraul\w*/,
      /\btubulac\w*/,
      /\besgoto\b/,
      /\bagua fria\b/,
      /\bdrenagem\b/,
      /\bbombeiro hidraulico\b/,
    ],
  },
  {
    tag: 'segurança',
    patterns: [
      /\bseguranca\b/,
      /\bnr[-\s]?18\b/,
      /\bnr[-\s]?35\b/,
      /\bnr[-\s]?10\b/,
      /\bepi[s]?\b/,
      /\bdds\b/,
    ],
  },
  {
    tag: 'obra e apoio',
    patterns: [
      /\bservente\b/,
      /\bauxiliar\b/,
      /\bapoio geral\b/,
      /\bcanteiro\b/,
      /\bpreparo de massa\b/,
      /\bmovimentacao de materiais\b/,
      /\bterraplenagem\b/,
    ],
  },
  {
    tag: 'soldagem',
    patterns: [/\bsoldador\w*/, /\bsolda\b/, /\bserralh\w*/, /\bestrutura metalica\b/],
  },
  {
    tag: 'máquinas',
    patterns: [
      /\boperador de maquinas\b/,
      /\bescavadeira\b/,
      /\bretroescavadeira\b/,
      /\bmunck\b/,
      /\bbetoneira\b/,
    ],
  },
  {
    tag: 'projetos',
    patterns: [
      /\bengenheir\w*/,
      /\bmestre de obras\b/,
      /\bleitura de projetos\b/,
      /\bcronograma\b/,
      /\bcoordenacao\b/,
    ],
  },
];

function stripDiacritics(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function normalizeSkillTag(tag: string): string {
  return tag.trim().toLowerCase();
}

export function formatSkillTagLabel(tag: string): string {
  const normalized = normalizeSkillTag(tag);
  if (!normalized) return '';
  if (SKILL_TAG_LABELS[normalized]) {
    return SKILL_TAG_LABELS[normalized];
  }
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function inferJobSkillTags(
  job: Pick<JobPosting, 'funcao' | 'descricao' | 'skillTags'>
): string[] {
  const tags: string[] = [];
  const seen = new Set<string>();

  const pushTag = (raw: string) => {
    const normalized = normalizeSkillTag(raw);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    tags.push(normalized);
  };

  if (Array.isArray(job.skillTags)) {
    for (const explicit of job.skillTags) {
      pushTag(explicit);
    }
  }

  if (tags.length > 0) {
    return tags;
  }

  const searchable = stripDiacritics(`${job.funcao} ${job.descricao}`);
  for (const rule of SKILL_KEYWORDS) {
    if (rule.patterns.some((pattern) => pattern.test(searchable))) {
      pushTag(rule.tag);
    }
  }

  if (tags.length === 0 && job.funcao.trim()) {
    pushTag(job.funcao);
  }

  return tags;
}

export function getJobSkillTags(
  job: Pick<JobPosting, 'funcao' | 'descricao' | 'skillTags'>
): string[] {
  return inferJobSkillTags(job);
}

export function toggleSkillTagSelection(
  currentTags: string[],
  tagToToggle: string
): string[] {
  const normalizedTarget = normalizeSkillTag(tagToToggle);
  if (!normalizedTarget) return currentTags;

  const normalizedCurrent = currentTags.map(normalizeSkillTag).filter(Boolean);
  if (normalizedCurrent.includes(normalizedTarget)) {
    return normalizedCurrent.filter((t) => t !== normalizedTarget);
  }
  return [...normalizedCurrent, normalizedTarget];
}

export function filterJobsBySkillTags(
  jobs: JobPosting[],
  selectedTags: string[]
): JobPosting[] {
  const activeSet = new Set(
    selectedTags.map(normalizeSkillTag).filter(Boolean)
  );
  if (activeSet.size === 0) {
    return jobs;
  }

  return jobs.filter((job) => {
    const jobTags = getJobSkillTags(job);
    return jobTags.some((tag) => activeSet.has(tag));
  });
}

export function buildSkillTagSummaries(
  allOpenJobs: JobPosting[],
  scopedJobs: JobPosting[] = allOpenJobs
): SkillTagSummary[] {
  const availableSet = new Set<string>(CORE_PRIORITY_SKILL_TAGS);
  for (const job of allOpenJobs) {
    for (const tag of getJobSkillTags(job)) {
      availableSet.add(tag);
    }
  }

  const counts = new Map<string, number>();
  for (const tag of availableSet) {
    counts.set(tag, 0);
  }

  for (const job of scopedJobs) {
    for (const tag of getJobSkillTags(job)) {
      if (availableSet.has(tag)) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
  }

  const orderedTags = Array.from(availableSet).sort((a, b) => {
    const aPriority = CORE_PRIORITY_SKILL_TAGS.indexOf(a);
    const bPriority = CORE_PRIORITY_SKILL_TAGS.indexOf(b);
    if (aPriority !== -1 && bPriority !== -1) return aPriority - bPriority;
    if (aPriority !== -1) return -1;
    if (bPriority !== -1) return 1;

    const countDiff = (counts.get(b) ?? 0) - (counts.get(a) ?? 0);
    if (countDiff !== 0) return countDiff;

    const aKnown = CONSTRUCTION_SKILL_TAGS.indexOf(a);
    const bKnown = CONSTRUCTION_SKILL_TAGS.indexOf(b);
    if (aKnown !== -1 && bKnown !== -1) return aKnown - bKnown;
    if (aKnown !== -1) return -1;
    if (bKnown !== -1) return 1;

    return a.localeCompare(b, 'pt-BR');
  });

  return orderedTags.map((tag) => ({
    tag,
    label: formatSkillTagLabel(tag),
    count: counts.get(tag) ?? 0,
  }));
}
