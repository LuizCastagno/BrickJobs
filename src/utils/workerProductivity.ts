/**
 * @file src/utils/workerProductivity.ts
 * @description Persistência e consolidação de apontamentos diários de horas e produtividade do trabalhador por canteiro.
 */

export interface ConstructionSiteOption {
  id: string;
  name: string;
  companyName: string;
  neighborhood: string;
}

export interface SiteWorkEntry {
  id: string;
  date: string; // YYYY-MM-DD
  siteId: string;
  siteName: string;
  neighborhood: string;
  hoursWorked: number;
  productivityPct: number; // 0 - 100
  taskSummary: string;
}

export interface DailyProductivityPoint {
  date: string;
  dayLabel: string;
  fullDateLabel: string;
  hoursWorked: number;
  productivityPct: number;
  primarySiteName: string;
  primaryNeighborhood: string;
  entriesCount: number;
  taskSummary: string;
}

export interface SiteProductivityBreakdown {
  siteId: string;
  siteName: string;
  shortSiteName: string;
  neighborhood: string;
  totalHours: number;
  avgProductivityPct: number;
  daysWorked: number;
  sharePct: number;
}

export interface ProductivityMonthOption {
  monthKey: string;
  label: string;
  shortLabel: string;
}

export interface WorkerProductivityDashboard {
  monthKey: string;
  monthLabel: string;
  siteId: string;
  totalHours: number;
  avgDailyHours: number;
  avgProductivityPct: number;
  activeDaysCount: number;
  sitesCount: number;
  topSite: SiteProductivityBreakdown | null;
  dailySeries: DailyProductivityPoint[];
  bySite: SiteProductivityBreakdown[];
}

export interface NewSiteWorkEntryInput {
  date: string;
  siteId: string;
  hoursWorked: number;
  productivityPct: number;
  taskSummary: string;
}

export const WORKER_PRODUCTIVITY_STORAGE_KEY =
  'brickjobs:worker_productivity_logs_v1';

export const RONDONOPOLIS_CONSTRUCTION_SITES: ConstructionSiteOption[] = [
  {
    id: 'site-vila-aurora',
    name: 'Residencial Vila Aurora',
    companyName: 'Construtora Cerrado Sul',
    neighborhood: 'Vila Aurora',
  },
  {
    id: 'site-distrito-ind',
    name: 'Galpão Logístico BR-163',
    companyName: 'Engenharia Mato Grosso',
    neighborhood: 'Distrito Industrial',
  },
  {
    id: 'site-jardim-primavera',
    name: 'Edifício Jardim Primavera',
    companyName: 'Pantanal Edificações',
    neighborhood: 'Jardim Primavera',
  },
  {
    id: 'site-cidade-salmen',
    name: 'Infraestrutura Cidade Salmen',
    companyName: 'Rondonópolis Obras & Infra',
    neighborhood: 'Cidade Salmen',
  },
];

export const SEEDED_WORKER_PRODUCTIVITY_LOGS: SiteWorkEntry[] = [
  // Novembro de 2026 (mês atual) - 4 canteiros em Rondonópolis-MT
  {
    id: 'log-2026-11-02',
    date: '2026-11-02',
    siteId: 'site-vila-aurora',
    siteName: 'Residencial Vila Aurora',
    neighborhood: 'Vila Aurora',
    hoursWorked: 8.5,
    productivityPct: 88,
    taskSummary: 'Alvenaria estrutural · Bloco B',
  },
  {
    id: 'log-2026-11-04',
    date: '2026-11-04',
    siteId: 'site-vila-aurora',
    siteName: 'Residencial Vila Aurora',
    neighborhood: 'Vila Aurora',
    hoursWorked: 9,
    productivityPct: 92,
    taskSummary: 'Levantamento de paredes · 2º pavimento',
  },
  {
    id: 'log-2026-11-05',
    date: '2026-11-05',
    siteId: 'site-distrito-ind',
    siteName: 'Galpão Logístico BR-163',
    neighborhood: 'Distrito Industrial',
    hoursWorked: 8,
    productivityPct: 85,
    taskSummary: 'Base de pilares e cintamento',
  },
  {
    id: 'log-2026-11-06',
    date: '2026-11-06',
    siteId: 'site-distrito-ind',
    siteName: 'Galpão Logístico BR-163',
    neighborhood: 'Distrito Industrial',
    hoursWorked: 9.5,
    productivityPct: 91,
    taskSummary: 'Concretagem de piso industrial',
  },
  {
    id: 'log-2026-11-08',
    date: '2026-11-08',
    siteId: 'site-jardim-primavera',
    siteName: 'Edifício Jardim Primavera',
    neighborhood: 'Jardim Primavera',
    hoursWorked: 6,
    productivityPct: 89,
    taskSummary: 'Chapisco e reboco de fachada',
  },
  {
    id: 'log-2026-11-10',
    date: '2026-11-10',
    siteId: 'site-vila-aurora',
    siteName: 'Residencial Vila Aurora',
    neighborhood: 'Vila Aurora',
    hoursWorked: 8.5,
    productivityPct: 94,
    taskSummary: 'Assentamento de vergas e contra-vergas',
  },
  {
    id: 'log-2026-11-11',
    date: '2026-11-11',
    siteId: 'site-cidade-salmen',
    siteName: 'Infraestrutura Cidade Salmen',
    neighborhood: 'Cidade Salmen',
    hoursWorked: 8,
    productivityPct: 86,
    taskSummary: 'Muro de arrimo e drenagem',
  },
  {
    id: 'log-2026-11-12',
    date: '2026-11-12',
    siteId: 'site-jardim-primavera',
    siteName: 'Edifício Jardim Primavera',
    neighborhood: 'Jardim Primavera',
    hoursWorked: 9,
    productivityPct: 95,
    taskSummary: 'Revestimento interno e prumo',
  },
  {
    id: 'log-2026-11-14',
    date: '2026-11-14',
    siteId: 'site-distrito-ind',
    siteName: 'Galpão Logístico BR-163',
    neighborhood: 'Distrito Industrial',
    hoursWorked: 10,
    productivityPct: 93,
    taskSummary: 'Fechamento lateral de docas',
  },
  {
    id: 'log-2026-11-15',
    date: '2026-11-15',
    siteId: 'site-vila-aurora',
    siteName: 'Residencial Vila Aurora',
    neighborhood: 'Vila Aurora',
    hoursWorked: 7.5,
    productivityPct: 96,
    taskSummary: 'Acabamento e conferência de esquadro',
  },
  {
    id: 'log-2026-11-16',
    date: '2026-11-16',
    siteId: 'site-cidade-salmen',
    siteName: 'Infraestrutura Cidade Salmen',
    neighborhood: 'Cidade Salmen',
    hoursWorked: 8.5,
    productivityPct: 90,
    taskSummary: 'Calçamento e caixas de passagem',
  },
  {
    id: 'log-2026-11-17',
    date: '2026-11-17',
    siteId: 'site-jardim-primavera',
    siteName: 'Edifício Jardim Primavera',
    neighborhood: 'Jardim Primavera',
    hoursWorked: 8.5,
    productivityPct: 97,
    taskSummary: 'Regularização de contrapiso · Torre A',
  },

  // Outubro de 2026 (mês anterior para comparação histórica)
  {
    id: 'log-2026-10-05',
    date: '2026-10-05',
    siteId: 'site-vila-aurora',
    siteName: 'Residencial Vila Aurora',
    neighborhood: 'Vila Aurora',
    hoursWorked: 8,
    productivityPct: 82,
    taskSummary: 'Marcação de alvenaria térreo',
  },
  {
    id: 'log-2026-10-10',
    date: '2026-10-10',
    siteId: 'site-distrito-ind',
    siteName: 'Galpão Logístico BR-163',
    neighborhood: 'Distrito Industrial',
    hoursWorked: 9,
    productivityPct: 86,
    taskSummary: 'Blocos de fundação e radier',
  },
  {
    id: 'log-2026-10-16',
    date: '2026-10-16',
    siteId: 'site-cidade-salmen',
    siteName: 'Infraestrutura Cidade Salmen',
    neighborhood: 'Cidade Salmen',
    hoursWorked: 8.5,
    productivityPct: 88,
    taskSummary: 'Galeria pluvial e meio-fio',
  },
  {
    id: 'log-2026-10-22',
    date: '2026-10-22',
    siteId: 'site-vila-aurora',
    siteName: 'Residencial Vila Aurora',
    neighborhood: 'Vila Aurora',
    hoursWorked: 9.5,
    productivityPct: 90,
    taskSummary: 'Elevação de alvenaria · Bloco A',
  },
  {
    id: 'log-2026-10-28',
    date: '2026-10-28',
    siteId: 'site-distrito-ind',
    siteName: 'Galpão Logístico BR-163',
    neighborhood: 'Distrito Industrial',
    hoursWorked: 8,
    productivityPct: 89,
    taskSummary: 'Nivelamento de base metálica',
  },
];

const PT_MONTHS_FULL = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const PT_MONTHS_SHORT = [
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

export function formatMonthKeyLabelPtBr(monthKey: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(monthKey.trim());
  if (!match) return monthKey;
  const year = Number(match[1]);
  const monthIdx = Number(match[2]) - 1;
  const monthName = PT_MONTHS_FULL[monthIdx];
  if (!monthName) return monthKey;
  return `${monthName} de ${year}`;
}

export function formatShortMonthKeyPtBr(monthKey: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(monthKey.trim());
  if (!match) return monthKey;
  const yearShort = match[1].slice(2);
  const monthIdx = Number(match[2]) - 1;
  const monthName = PT_MONTHS_SHORT[monthIdx];
  if (!monthName) return monthKey;
  return `${monthName}/${yearShort}`;
}

export function formatDayLabelPtBr(dateIso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateIso.trim());
  if (!match) return dateIso;
  return `${match[3]}/${match[2]}`;
}

export function formatFullDatePtBr(dateIso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateIso.trim());
  if (!match) return dateIso;
  const monthIdx = Number(match[2]) - 1;
  const monthShort = PT_MONTHS_SHORT[monthIdx] ?? match[2];
  return `${match[3]} de ${monthShort} de ${match[1]}`;
}

export function shortenSiteName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length <= 18) return trimmed;
  return `${trimmed.slice(0, 17).trimEnd()}…`;
}

export function formatHoursPtBr(hours: number): string {
  const rounded = Math.round(hours * 10) / 10;
  return `${rounded.toLocaleString('pt-BR', {
    minimumFractionDigits: Number.isInteger(rounded) ? 0 : 1,
    maximumFractionDigits: 1,
  })} h`;
}

function isValidEntry(value: unknown): value is SiteWorkEntry {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<SiteWorkEntry>;
  return (
    typeof v.id === 'string' &&
    typeof v.date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(v.date) &&
    typeof v.siteId === 'string' &&
    typeof v.siteName === 'string' &&
    typeof v.neighborhood === 'string' &&
    typeof v.hoursWorked === 'number' &&
    Number.isFinite(v.hoursWorked) &&
    v.hoursWorked > 0 &&
    typeof v.productivityPct === 'number' &&
    Number.isFinite(v.productivityPct) &&
    v.productivityPct >= 0 &&
    v.productivityPct <= 100 &&
    typeof v.taskSummary === 'string'
  );
}

export function loadWorkerProductivityLogs(): SiteWorkEntry[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [...SEEDED_WORKER_PRODUCTIVITY_LOGS];
  }
  try {
    const raw = window.localStorage.getItem(WORKER_PRODUCTIVITY_STORAGE_KEY);
    if (!raw) return [...SEEDED_WORKER_PRODUCTIVITY_LOGS];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...SEEDED_WORKER_PRODUCTIVITY_LOGS];
    const valid = parsed.filter(isValidEntry);
    return valid.length > 0 ? valid : [...SEEDED_WORKER_PRODUCTIVITY_LOGS];
  } catch {
    return [...SEEDED_WORKER_PRODUCTIVITY_LOGS];
  }
}

export function saveWorkerProductivityLogs(entries: SiteWorkEntry[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(
      WORKER_PRODUCTIVITY_STORAGE_KEY,
      JSON.stringify(entries)
    );
  } catch {
    // Ignore storage write failures cleanly
  }
}

export function getAvailableProductivityMonths(
  entries: SiteWorkEntry[]
): ProductivityMonthOption[] {
  const keys = Array.from(
    new Set(
      entries
        .map((e) => e.date.slice(0, 7))
        .filter((k) => /^\d{4}-\d{2}$/.test(k))
    )
  ).sort((a, b) => b.localeCompare(a));

  return keys.map((monthKey) => ({
    monthKey,
    label: formatMonthKeyLabelPtBr(monthKey),
    shortLabel: formatShortMonthKeyPtBr(monthKey),
  }));
}

export function getProductivitySites(
  entries: SiteWorkEntry[],
  monthKey?: string
): ConstructionSiteOption[] {
  const siteMap = new Map<string, ConstructionSiteOption>();
  for (const preset of RONDONOPOLIS_CONSTRUCTION_SITES) {
    siteMap.set(preset.id, preset);
  }
  for (const entry of entries) {
    if (monthKey && !entry.date.startsWith(monthKey)) continue;
    if (!siteMap.has(entry.siteId)) {
      siteMap.set(entry.siteId, {
        id: entry.siteId,
        name: entry.siteName,
        companyName: entry.siteName,
        neighborhood: entry.neighborhood,
      });
    }
  }
  return Array.from(siteMap.values());
}

export function addSiteWorkEntry(
  currentEntries: SiteWorkEntry[],
  input: NewSiteWorkEntryInput,
  availableSites: ConstructionSiteOption[] = RONDONOPOLIS_CONSTRUCTION_SITES
): { ok: true; entries: SiteWorkEntry[]; created: SiteWorkEntry } | { ok: false; error: string } {
  const dateTrimmed = input.date.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateTrimmed)) {
    return { ok: false, error: 'Informe uma data válida no formato AAAA-MM-DD.' };
  }

  const matchedSite = availableSites.find((s) => s.id === input.siteId);
  if (!matchedSite) {
    return { ok: false, error: 'Selecione um canteiro de obra válido.' };
  }

  if (
    !Number.isFinite(input.hoursWorked) ||
    input.hoursWorked < 0.5 ||
    input.hoursWorked > 16
  ) {
    return {
      ok: false,
      error: 'As horas trabalhadas no turno devem ficar entre 0,5 h e 16 h.',
    };
  }

  if (
    !Number.isFinite(input.productivityPct) ||
    input.productivityPct < 10 ||
    input.productivityPct > 100
  ) {
    return {
      ok: false,
      error: 'A produtividade da entrega deve ficar entre 10% e 100%.',
    };
  }

  const summary = input.taskSummary.trim();
  if (summary.length < 3) {
    return {
      ok: false,
      error: 'Descreva resumidamente a atividade executada (mínimo 3 caracteres).',
    };
  }

  const created: SiteWorkEntry = {
    id: `log-${dateTrimmed}-${Date.now()}`,
    date: dateTrimmed,
    siteId: matchedSite.id,
    siteName: matchedSite.name,
    neighborhood: matchedSite.neighborhood,
    hoursWorked: Math.round(input.hoursWorked * 10) / 10,
    productivityPct: Math.round(input.productivityPct),
    taskSummary: summary,
  };

  const next = [...currentEntries, created].sort((a, b) =>
    a.date.localeCompare(b.date)
  );
  saveWorkerProductivityLogs(next);
  return { ok: true, entries: next, created };
}

export function buildWorkerProductivityDashboard(params: {
  entries: SiteWorkEntry[];
  monthKey: string;
  siteId?: string;
}): WorkerProductivityDashboard {
  const targetMonth = params.monthKey.trim();
  const selectedSiteId = params.siteId?.trim() || 'todos';

  const monthEntries = params.entries.filter((entry) =>
    entry.date.startsWith(targetMonth)
  );

  // Per-site breakdown always reflects all active sites in the selected month
  const siteGroups = new Map<
    string,
    {
      siteId: string;
      siteName: string;
      neighborhood: string;
      totalHours: number;
      weightedProductivitySum: number;
      days: Set<string>;
    }
  >();

  let monthAllSitesHours = 0;
  for (const entry of monthEntries) {
    monthAllSitesHours += entry.hoursWorked;
    const current = siteGroups.get(entry.siteId) ?? {
      siteId: entry.siteId,
      siteName: entry.siteName,
      neighborhood: entry.neighborhood,
      totalHours: 0,
      weightedProductivitySum: 0,
      days: new Set<string>(),
    };
    current.totalHours += entry.hoursWorked;
    current.weightedProductivitySum += entry.hoursWorked * entry.productivityPct;
    current.days.add(entry.date);
    siteGroups.set(entry.siteId, current);
  }

  const bySite: SiteProductivityBreakdown[] = Array.from(siteGroups.values())
    .map((group) => {
      const roundedHours = Math.round(group.totalHours * 10) / 10;
      const avgProd =
        group.totalHours > 0
          ? Math.round(group.weightedProductivitySum / group.totalHours)
          : 0;
      const sharePct =
        monthAllSitesHours > 0
          ? Math.round((group.totalHours / monthAllSitesHours) * 100)
          : 0;
      return {
        siteId: group.siteId,
        siteName: group.siteName,
        shortSiteName: shortenSiteName(group.siteName),
        neighborhood: group.neighborhood,
        totalHours: roundedHours,
        avgProductivityPct: avgProd,
        daysWorked: group.days.size,
        sharePct,
      };
    })
    .sort((a, b) => b.totalHours - a.totalHours || a.siteName.localeCompare(b.siteName, 'pt-BR'));

  // Scoped entries for daily timeline & KPIs
  const scopedEntries =
    selectedSiteId === 'todos'
      ? monthEntries
      : monthEntries.filter((e) => e.siteId === selectedSiteId);

  const dayGroups = new Map<string, SiteWorkEntry[]>();
  for (const entry of scopedEntries) {
    const list = dayGroups.get(entry.date) ?? [];
    list.push(entry);
    dayGroups.set(entry.date, list);
  }

  const dailySeries: DailyProductivityPoint[] = Array.from(dayGroups.entries())
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, list]) => {
      const totalHours = list.reduce((sum, item) => sum + item.hoursWorked, 0);
      const weightedProd = list.reduce(
        (sum, item) => sum + item.hoursWorked * item.productivityPct,
        0
      );
      const avgProd = totalHours > 0 ? Math.round(weightedProd / totalHours) : 0;
      const primary = [...list].sort((a, b) => b.hoursWorked - a.hoursWorked)[0];
      return {
        date,
        dayLabel: formatDayLabelPtBr(date),
        fullDateLabel: formatFullDatePtBr(date),
        hoursWorked: Math.round(totalHours * 10) / 10,
        productivityPct: avgProd,
        primarySiteName:
          list.length > 1
            ? `${primary.siteName} (+${list.length - 1})`
            : primary.siteName,
        primaryNeighborhood: primary.neighborhood,
        entriesCount: list.length,
        taskSummary: list.map((item) => item.taskSummary).join(' · '),
      };
    });

  const totalHoursRaw = scopedEntries.reduce((sum, item) => sum + item.hoursWorked, 0);
  const totalHours = Math.round(totalHoursRaw * 10) / 10;
  const activeDaysCount = dailySeries.length;
  const avgDailyHours =
    activeDaysCount > 0
      ? Math.round((totalHoursRaw / activeDaysCount) * 10) / 10
      : 0;

  const weightedProdTotal = scopedEntries.reduce(
    (sum, item) => sum + item.hoursWorked * item.productivityPct,
    0
  );
  const avgProductivityPct =
    totalHoursRaw > 0 ? Math.round(weightedProdTotal / totalHoursRaw) : 0;

  const distinctScopedSites = new Set(scopedEntries.map((e) => e.siteId));
  const topSite =
    selectedSiteId === 'todos'
      ? bySite[0] ?? null
      : bySite.find((s) => s.siteId === selectedSiteId) ?? null;

  return {
    monthKey: targetMonth,
    monthLabel: formatMonthKeyLabelPtBr(targetMonth),
    siteId: selectedSiteId,
    totalHours,
    avgDailyHours,
    avgProductivityPct,
    activeDaysCount,
    sitesCount: distinctScopedSites.size,
    topSite,
    dailySeries,
    bySite,
  };
}
