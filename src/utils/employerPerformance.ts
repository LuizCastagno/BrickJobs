/**
 * @file src/utils/employerPerformance.ts
 * @description Cálculos mensais de taxa de preenchimento de vagas por ocupação para os gráficos da construtora.
 */

import type { JobApplication, JobPosting } from '../types/brickjobs';

export interface PerformanceCategoryDatum {
  category: string;
  shortLabel: string;
  abertas: number;
  preenchidas: number;
  total: number;
  fillRate: number;
}

export interface MonthlyPerformanceSummary {
  monthKey: string;
  monthLabel: string;
  totalAbertas: number;
  totalPreenchidas: number;
  fillRatePercent: number;
  categories: PerformanceCategoryDatum[];
}

const MONTH_NAMES_PT_BR = [
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

const SHORT_ROLE_LABELS: Record<string, string> = {
  'Servente de Obras': 'Servente',
  'Armador de Ferragem': 'Armador',
  'Eletricista Predial': 'Eletricista',
  'Instalações Elétricas': 'Inst. Elét.',
  'Manutenção de Redes Elétricas': 'Redes Elét.',
  'Mestre de Obras': 'Mestre',
  'Encanador / Hidráulico': 'Encanador',
  'Pintor Predial': 'Pintor',
  'Azulejista / Revestidor': 'Azulejista',
  'Operador de Máquinas': 'Op. Máq.',
  'Soldador / Serralheiro': 'Soldador',
  'Técnico em Segurança do Trabalho': 'Téc. Seg.',
  'Engenheiro Civil': 'Engenheiro',
};

export function formatMonthKeyLabelPtBr(monthKey: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(monthKey.trim());
  if (!match) return monthKey;
  const year = match[1];
  const monthIdx = Number(match[2]) - 1;
  const monthName = MONTH_NAMES_PT_BR[monthIdx];
  if (!monthName) return monthKey;
  return `${monthName} de ${year}`;
}

export function shortenCategoryLabel(role: string): string {
  const trimmed = role.trim();
  if (!trimmed) return 'Outra';
  if (SHORT_ROLE_LABELS[trimmed]) return SHORT_ROLE_LABELS[trimmed];
  if (trimmed.length <= 12) return trimmed;
  const firstWord = trimmed.split(/[\s/]+/)[0];
  return firstWord.length <= 12 ? firstWord : `${firstWord.slice(0, 11)}.`;
}

export function getAvailablePerformanceMonths(
  jobs: JobPosting[],
  fallbackMonthKey?: string
): { key: string; label: string }[] {
  const keys = new Set<string>();
  for (const job of jobs) {
    if (/^\d{4}-\d{2}/.test(job.createdAt)) {
      keys.add(job.createdAt.slice(0, 7));
    }
  }
  if (keys.size === 0) {
    const fallback = fallbackMonthKey || new Date().toISOString().slice(0, 7);
    keys.add(fallback);
  }
  return Array.from(keys)
    .sort((a, b) => b.localeCompare(a))
    .map((key) => ({ key, label: formatMonthKeyLabelPtBr(key) }));
}

export function buildMonthlyPerformanceSummary(params: {
  jobs: JobPosting[];
  applications: JobApplication[];
  monthKey: string;
  companyId?: string;
}): MonthlyPerformanceSummary {
  const { jobs, applications, monthKey, companyId } = params;

  const acceptedCountByJobId = new Map<string, number>();
  for (const app of applications) {
    if (app.status === 'aceita' || app.status === 'concluida') {
      acceptedCountByJobId.set(
        app.jobId,
        (acceptedCountByJobId.get(app.jobId) ?? 0) + 1
      );
    }
  }

  const byCategory = new Map<string, { abertas: number; preenchidas: number }>();

  for (const job of jobs) {
    if (!job.createdAt.startsWith(monthKey)) continue;
    if (companyId && job.companyId !== companyId) continue;

    const category = job.funcao.trim() || 'Outra função';
    const current = byCategory.get(category) ?? { abertas: 0, preenchidas: 0 };

    if (job.status === 'encerrada') {
      current.preenchidas += job.quantidadeVagas;
    } else {
      const accepted = acceptedCountByJobId.get(job.id) ?? 0;
      const filled = Math.min(job.quantidadeVagas, accepted);
      const open = Math.max(0, job.quantidadeVagas - filled);
      current.preenchidas += filled;
      current.abertas += open;
    }

    byCategory.set(category, current);
  }

  const categories: PerformanceCategoryDatum[] = Array.from(byCategory.entries())
    .map(([category, counts]) => {
      const total = counts.abertas + counts.preenchidas;
      return {
        category,
        shortLabel: shortenCategoryLabel(category),
        abertas: counts.abertas,
        preenchidas: counts.preenchidas,
        total,
        fillRate: total > 0 ? Math.round((counts.preenchidas / total) * 100) : 0,
      };
    })
    .sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return a.category.localeCompare(b.category, 'pt-BR');
    })
    .slice(0, 8);

  const totalAbertas = categories.reduce((sum, item) => sum + item.abertas, 0);
  const totalPreenchidas = categories.reduce(
    (sum, item) => sum + item.preenchidas,
    0
  );
  const grandTotal = totalAbertas + totalPreenchidas;
  const fillRatePercent =
    grandTotal > 0 ? Math.round((totalPreenchidas / grandTotal) * 100) : 0;

  return {
    monthKey,
    monthLabel: formatMonthKeyLabelPtBr(monthKey),
    totalAbertas,
    totalPreenchidas,
    fillRatePercent,
    categories,
  };
}
