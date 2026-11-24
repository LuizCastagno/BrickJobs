/**
 * @file src/components/EmployerStatisticsTab.tsx
 * @description Aba de estatísticas detalhadas da construtora (avaliações por ocupação, tempo médio de preenchimento, histórico mensal de contratações nos últimos 6 meses via Recharts, status de vagas e exportação em PDF).
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BarChart3, Clock, FileText, Star, TrendingUp } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type {
  CompanyProfile,
  CompanyRating,
  JobApplication,
  JobPosting,
} from '../types/brickjobs';
import {
  buildCategoryFillTimeStats,
  buildCategoryOpenVsClosedStats,
  buildCategoryRatingStats,
  buildMonthlyFinalizedHiringsHistory,
  type CategoryFillTimeStat,
  type CategoryOpenVsClosedStat,
  type CategoryRatingStat,
  type MonthlyFinalizedHiringDatum,
} from '../utils/employerStats';
import { exportEmployerReportPdf } from '../utils/employerReportPdf';

interface EmployerStatisticsTabProps {
  jobs: JobPosting[];
  applications?: JobApplication[];
  companyRatings: CompanyRating[];
  companyProfile: CompanyProfile;
  companyId: string;
  companyName: string;
  onGoToJobsTab: () => void;
}

type StatsScope = 'rede' | 'empresa';

interface RatingTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: CategoryRatingStat }>;
}

const RatingChartTooltip: React.FC<RatingTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div className="rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#0F172A] px-3.5 py-2.5 shadow-md text-xs space-y-1">
      <p className="font-display font-bold text-[#111827] dark:text-[#F8FAFC]">
        {item.category}
      </p>
      <p className="text-[#374151] dark:text-[#CBD5E1] tabular-nums">
        Média:{' '}
        <strong className="text-[#B45309] dark:text-[#FBBF24]">
          {item.formattedAverage} / 5,0 ★
        </strong>
      </p>
      <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8] tabular-nums">
        {item.count} {item.count === 1 ? 'avaliação' : 'avaliações'} · faixa{' '}
        {item.minRating}★–{item.maxRating}★
      </p>
    </div>
  );
};

interface FillTimeTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: CategoryFillTimeStat }>;
}

const FillTimeChartTooltip: React.FC<FillTimeTooltipProps> = ({
  active,
  payload,
}) => {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div className="rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#0F172A] px-3.5 py-2.5 shadow-md text-xs space-y-1">
      <p className="font-display font-bold text-[#111827] dark:text-[#F8FAFC]">
        {item.category}
      </p>
      <p className="text-[#374151] dark:text-[#CBD5E1] tabular-nums">
        Tempo médio:{' '}
        <strong className="text-[#C93B1E] dark:text-[#F06449]">
          {item.formattedAverageDays}
        </strong>
      </p>
      <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8] tabular-nums">
        {item.closedPostings}{' '}
        {item.closedPostings === 1 ? 'processo encerrado' : 'processos encerrados'} ·{' '}
        {item.closedVacancies}{' '}
        {item.closedVacancies === 1 ? 'vaga preenchida' : 'vagas preenchidas'}
      </p>
    </div>
  );
};

interface OpenVsClosedTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: CategoryOpenVsClosedStat }>;
}

const OpenVsClosedChartTooltip: React.FC<OpenVsClosedTooltipProps> = ({
  active,
  payload,
}) => {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div className="rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#0F172A] px-3.5 py-2.5 shadow-md text-xs space-y-1">
      <p className="font-display font-bold text-[#111827] dark:text-[#F8FAFC]">
        {item.category}
      </p>
      <p className="text-[#047857] dark:text-[#34D399] tabular-nums font-semibold">
        Vagas abertas: {item.abertas}
      </p>
      <p className="text-[#C93B1E] dark:text-[#F06449] tabular-nums font-semibold">
        Vagas encerradas: {item.encerradas}
      </p>
      <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8] tabular-nums pt-0.5 border-t border-[#E5E7EB] dark:border-[#334155]">
        Total de vagas: {item.total}
      </p>
    </div>
  );
};

interface FinalizedHiringsTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: MonthlyFinalizedHiringDatum }>;
}

const FinalizedHiringsTooltip: React.FC<FinalizedHiringsTooltipProps> = ({
  active,
  payload,
}) => {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div className="rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#0F172A] px-3.5 py-2.5 shadow-md text-xs space-y-1">
      <p className="font-display font-bold text-[#111827] dark:text-[#F8FAFC]">
        {item.fullMonthLabel}
      </p>
      <p className="text-[#047857] dark:text-[#34D399] tabular-nums font-semibold">
        Contratações finalizadas: {item.finalizadas}
      </p>
      <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8] tabular-nums">
        Vagas encerradas: {item.vagasEncerradas} · Contratos concluídos:{' '}
        {item.candidaturasConcluidas}
      </p>
    </div>
  );
};

export const EmployerStatisticsTab: React.FC<EmployerStatisticsTabProps> = ({
  jobs,
  applications = [],
  companyRatings,
  companyProfile,
  companyId,
  companyName,
  onGoToJobsTab,
}) => {
  const [scope, setScope] = useState<StatsScope>('rede');
  const [isDark, setIsDark] = useState<boolean>(() =>
    typeof document !== 'undefined'
      ? document.documentElement.classList.contains('dark')
      : false
  );
  const [pdfExportMsg, setPdfExportMsg] = useState<string>('');
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const exportTimerRef = useRef<number | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (exportTimerRef.current !== null) {
        window.clearTimeout(exportTimerRef.current);
      }
      if (feedbackTimerRef.current !== null) {
        window.clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  const handleExportReport = () => {
    if (isExportingPdf) return;
    setPdfExportMsg('');
    setIsExportingPdf(true);
    if (exportTimerRef.current !== null) {
      window.clearTimeout(exportTimerRef.current);
    }
    if (feedbackTimerRef.current !== null) {
      window.clearTimeout(feedbackTimerRef.current);
    }
    exportTimerRef.current = window.setTimeout(() => {
      exportTimerRef.current = null;
      const res = exportEmployerReportPdf(companyProfile, jobs, companyRatings);
      setIsExportingPdf(false);
      if (res.ok) {
        setPdfExportMsg(`Relatório ${res.fileName} gerado e baixado com sucesso!`);
      } else {
        setPdfExportMsg(res.error);
      }
      feedbackTimerRef.current = window.setTimeout(() => {
        feedbackTimerRef.current = null;
        setPdfExportMsg('');
      }, 5000);
    }, 250);
  };

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const sync = () => setIsDark(root.classList.contains('dark'));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const ratingStats = useMemo(
    () =>
      buildCategoryRatingStats({
        ratings: companyRatings,
        companyId: scope === 'empresa' ? companyId : undefined,
        companyName: scope === 'empresa' ? companyName : undefined,
      }),
    [companyRatings, scope, companyId, companyName]
  );

  const fillTimeStats = useMemo(
    () =>
      buildCategoryFillTimeStats({
        jobs,
        companyId: scope === 'empresa' ? companyId : undefined,
      }),
    [jobs, scope, companyId]
  );

  const openVsClosedStats = useMemo(
    () =>
      buildCategoryOpenVsClosedStats({
        jobs,
        companyId: scope === 'empresa' ? companyId : undefined,
      }),
    [jobs, scope, companyId]
  );

  const finalizedHiringsHistory = useMemo(
    () =>
      buildMonthlyFinalizedHiringsHistory({
        jobs,
        applications,
        companyId: scope === 'empresa' ? companyId : undefined,
        monthCount: 6,
      }),
    [jobs, applications, scope, companyId]
  );

  const combinedRows = useMemo(() => {
    const categories = new Set<string>();
    for (const item of ratingStats.byCategory) categories.add(item.category);
    for (const item of fillTimeStats.byCategory) categories.add(item.category);

    return Array.from(categories)
      .map((category) => ({
        category,
        rating: ratingStats.byCategory.find((r) => r.category === category) ?? null,
        fillTime:
          fillTimeStats.byCategory.find((f) => f.category === category) ?? null,
      }))
      .sort((a, b) => a.category.localeCompare(b.category, 'pt-BR'));
  }, [ratingStats.byCategory, fillTimeStats.byCategory]);

  const axisTickColor = isDark ? '#CBD5E1' : '#374151';
  const gridStrokeColor = isDark ? '#1E293B' : '#E5E7EB';
  const ratingBarColor = isDark ? '#FBBF24' : '#D97706';
  const fillTimeBarColor = isDark ? '#F06449' : '#C93B1E';
  const openBarColor = isDark ? '#34D399' : '#059669';
  const closedBarColor = isDark ? '#F06449' : '#C93B1E';

  const ratingChartHeight = Math.max(220, ratingStats.byCategory.length * 46 + 32);
  const fillTimeChartHeight = Math.max(
    220,
    fillTimeStats.byCategory.length * 46 + 32
  );
  const openVsClosedChartHeight = Math.max(
    240,
    openVsClosedStats.length * 56 + 48
  );

  return (
    <div
      className="mt-6 space-y-6"
      data-testid="employer-statistics-view"
    >
      {/* Header & Scope Control */}
      <section className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <BarChart3
                className="w-4 h-4 text-[#C93B1E] dark:text-[#F06449] shrink-0"
                aria-hidden="true"
              />
              <h2 className="font-display text-lg sm:text-xl font-bold text-[#111827] dark:text-[#F8FAFC]">
                Estatísticas de Avaliações e Preenchimento
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#4B5563] dark:text-[#94A3B8] mt-1">
              Média das avaliações recebidas pelos trabalhadores e tempo médio para
              preenchimento das vagas por categoria de serviço.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleExportReport}
              disabled={isExportingPdf}
              data-testid="download-employer-report-pdf"
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#C93B1E] hover:bg-[#B23319] text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
            >
              <FileText className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>
                {isExportingPdf ? 'Gerando PDF...' : 'Baixar Relatório em PDF'}
              </span>
            </button>

            <div
              role="group"
              aria-label="Escopo das estatísticas"
              className="inline-flex rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#0F172A] p-1 shrink-0"
            >
              <button
                type="button"
                onClick={() => setScope('rede')}
                aria-pressed={scope === 'rede'}
                data-testid="stats-scope-rede"
                className={`min-h-[44px] sm:min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  scope === 'rede'
                    ? 'bg-white dark:bg-[#1E293B] text-[#111827] dark:text-[#F8FAFC] shadow-xs'
                    : 'text-[#4B5563] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F8FAFC]'
                }`}
              >
                Rondonópolis
              </button>
              <button
                type="button"
                onClick={() => setScope('empresa')}
                aria-pressed={scope === 'empresa'}
                data-testid="stats-scope-empresa"
                className={`min-h-[44px] sm:min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  scope === 'empresa'
                    ? 'bg-white dark:bg-[#1E293B] text-[#111827] dark:text-[#F8FAFC] shadow-xs'
                    : 'text-[#4B5563] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F8FAFC]'
                }`}
              >
                Sua construtora
              </button>
            </div>
          </div>
        </div>

        {pdfExportMsg && (
          <p
            className="mt-3 text-xs font-semibold text-[#047857] dark:text-[#34D399]"
            role="status"
          >
            {pdfExportMsg}
          </p>
        )}

        {/* 4-column KPI strip */}
        <div className="mt-5 pt-5 border-t border-[#F3F4F6] dark:border-[#1E293B] grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div>
            <p className="text-xs text-[#4B5563] dark:text-[#94A3B8] inline-flex items-center gap-1.5">
              <Star
                className="w-3.5 h-3.5 text-amber-500 fill-amber-500 dark:text-amber-400 dark:fill-amber-400 shrink-0"
                aria-hidden="true"
              />
              <span>Média de avaliações</span>
            </p>
            <p
              data-testid="stats-kpi-rating-average"
              className="font-display text-2xl sm:text-3xl font-bold text-[#111827] dark:text-[#F8FAFC] mt-1 tabular-nums"
            >
              {ratingStats.totalRatings > 0
                ? `${ratingStats.formattedOverallAverage} ★`
                : '—'}
            </p>
            <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-0.5 tabular-nums">
              {ratingStats.totalRatings}{' '}
              {ratingStats.totalRatings === 1
                ? 'avaliação recebida'
                : 'avaliações recebidas'}
            </p>
          </div>

          <div>
            <p className="text-xs text-[#4B5563] dark:text-[#94A3B8] inline-flex items-center gap-1.5">
              <TrendingUp
                className="w-3.5 h-3.5 text-[#047857] dark:text-[#34D399] shrink-0"
                aria-hidden="true"
              />
              <span>Notas 4★ e 5★</span>
            </p>
            <p
              data-testid="stats-kpi-satisfaction"
              className="font-display text-2xl sm:text-3xl font-bold text-[#047857] dark:text-[#34D399] mt-1 tabular-nums"
            >
              {ratingStats.totalRatings > 0
                ? `${ratingStats.satisfiedSharePercent}%`
                : '—'}
            </p>
            <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-0.5">
              Índice de satisfação
            </p>
          </div>

          <div>
            <p className="text-xs text-[#4B5563] dark:text-[#94A3B8] inline-flex items-center gap-1.5">
              <Clock
                className="w-3.5 h-3.5 text-[#C93B1E] dark:text-[#F06449] shrink-0"
                aria-hidden="true"
              />
              <span>Tempo médio de preenchimento</span>
            </p>
            <p
              data-testid="stats-kpi-fill-time"
              className="font-display text-2xl sm:text-3xl font-bold text-[#C93B1E] dark:text-[#F06449] mt-1 tabular-nums"
            >
              {fillTimeStats.formattedOverallDays}
            </p>
            <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-0.5 tabular-nums">
              {fillTimeStats.totalClosedVacancies}{' '}
              {fillTimeStats.totalClosedVacancies === 1
                ? 'vaga preenchida'
                : 'vagas preenchidas'}
            </p>
          </div>

          <div>
            <p className="text-xs text-[#4B5563] dark:text-[#94A3B8]">
              Categoria mais ágil
            </p>
            <p
              data-testid="stats-kpi-fastest-category"
              className="font-display text-lg sm:text-xl font-bold text-[#111827] dark:text-[#F8FAFC] mt-1.5 truncate"
              title={fillTimeStats.fastestCategory?.category ?? undefined}
            >
              {fillTimeStats.fastestCategory?.category ?? '—'}
            </p>
            <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-0.5 tabular-nums">
              {fillTimeStats.fastestCategory
                ? `${fillTimeStats.fastestCategory.averageDays
                    .toFixed(1)
                    .replace('.', ',')} dias em média`
                : 'Sem encerramentos ainda'}
            </p>
          </div>
        </div>
      </section>

      {/* Recharts Dual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Chart 1: Worker Ratings by Service Category */}
        <section
          aria-labelledby="stats-ratings-chart-heading"
          data-testid="stats-ratings-chart-card"
          className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl p-5 sm:p-6 flex flex-col justify-between"
        >
          <div>
            <h3
              id="stats-ratings-chart-heading"
              className="font-display text-base sm:text-lg font-bold text-[#111827] dark:text-[#F8FAFC]"
            >
              Média de avaliações dos trabalhadores
            </h3>
            <p className="text-xs sm:text-sm text-[#4B5563] dark:text-[#94A3B8] mt-1">
              Nota média (1 a 5 estrelas) registrada pelos trabalhadores por
              categoria de serviço.
            </p>
          </div>

          <div className="mt-4 flex-1 flex flex-col justify-center">
            {ratingStats.byCategory.length === 0 ? (
              <div className="py-10 px-4 text-center rounded-xl border border-dashed border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#0F172A]">
                <p className="text-sm font-semibold text-[#111827] dark:text-[#F8FAFC]">
                  Nenhuma avaliação recebida pela sua construtora ainda
                </p>
                <p className="text-xs text-[#4B5563] dark:text-[#94A3B8] mt-1">
                  Conclua trabalhos aceitos para receber avaliações ou compare com a
                  média de Rondonópolis.
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  {scope === 'empresa' && (
                    <button
                      type="button"
                      onClick={() => setScope('rede')}
                      className="min-h-[44px] sm:min-h-[38px] px-4 py-1.5 rounded-lg bg-[#111827] dark:bg-[#F8FAFC] text-white dark:text-[#0F172A] text-xs font-semibold cursor-pointer"
                    >
                      Ver panorama da rede
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onGoToJobsTab}
                    className="min-h-[44px] sm:min-h-[38px] px-4 py-1.5 rounded-lg border border-[#D1D5DB] dark:border-[#334155] text-xs font-semibold text-[#111827] dark:text-[#F8FAFC] cursor-pointer"
                  >
                    Ir para Vagas e Busca
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="w-full min-w-0"
                style={{ height: ratingChartHeight }}
                role="img"
                aria-label="Gráfico de barras Recharts mostrando a média de avaliações dos trabalhadores por categoria de serviço"
                data-testid="recharts-worker-ratings-chart"
              >
                <ResponsiveContainer
                  width="100%"
                  height={ratingChartHeight}
                  minWidth={220}
                >
                  <BarChart
                    data={ratingStats.byCategory}
                    layout="vertical"
                    margin={{ top: 8, right: 20, left: 4, bottom: 8 }}
                    barSize={22}
                  >
                    <CartesianGrid
                      horizontal={false}
                      stroke={gridStrokeColor}
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      type="number"
                      domain={[0, 5]}
                      ticks={[0, 1, 2, 3, 4, 5]}
                      axisLine={{ stroke: gridStrokeColor }}
                      tickLine={false}
                      tick={{ fill: axisTickColor, fontSize: 11 }}
                    />
                    <YAxis
                      type="category"
                      dataKey="category"
                      width={136}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: axisTickColor, fontSize: 12, fontWeight: 500 }}
                    />
                    <Tooltip
                      cursor={{
                        fill: isDark
                          ? 'rgba(255,255,255,0.04)'
                          : 'rgba(17,24,39,0.04)',
                      }}
                      content={<RatingChartTooltip />}
                    />
                    <Bar
                      dataKey="averageRating"
                      name="Nota média"
                      fill={ratingBarColor}
                      radius={[0, 6, 6, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </section>

        {/* Chart 2: Average Fill Time by Service Category */}
        <section
          aria-labelledby="stats-filltime-chart-heading"
          data-testid="stats-filltime-chart-card"
          className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl p-5 sm:p-6 flex flex-col justify-between"
        >
          <div>
            <h3
              id="stats-filltime-chart-heading"
              className="font-display text-base sm:text-lg font-bold text-[#111827] dark:text-[#F8FAFC]"
            >
              Tempo médio de preenchimento por categoria
            </h3>
            <p className="text-xs sm:text-sm text-[#4B5563] dark:text-[#94A3B8] mt-1">
              Média de dias entre a publicação e o encerramento das vagas em cada
              área de serviço.
            </p>
          </div>

          <div className="mt-4 flex-1 flex flex-col justify-center">
            {fillTimeStats.byCategory.length === 0 ? (
              <div className="py-10 px-4 text-center rounded-xl border border-dashed border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#0F172A]">
                <p className="text-sm font-semibold text-[#111827] dark:text-[#F8FAFC]">
                  Nenhuma vaga encerrada pela sua construtora ainda
                </p>
                <p className="text-xs text-[#4B5563] dark:text-[#94A3B8] mt-1">
                  Ao encerrar uma vaga preenchida na aba Vagas e Busca, o tempo de
                  preenchimento será contabilizado automaticamente.
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  {scope === 'empresa' && (
                    <button
                      type="button"
                      onClick={() => setScope('rede')}
                      className="min-h-[44px] sm:min-h-[38px] px-4 py-1.5 rounded-lg bg-[#111827] dark:bg-[#F8FAFC] text-white dark:text-[#0F172A] text-xs font-semibold cursor-pointer"
                    >
                      Ver panorama da rede
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onGoToJobsTab}
                    className="min-h-[44px] sm:min-h-[38px] px-4 py-1.5 rounded-lg border border-[#D1D5DB] dark:border-[#334155] text-xs font-semibold text-[#111827] dark:text-[#F8FAFC] cursor-pointer"
                  >
                    Gerenciar vagas
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="w-full min-w-0"
                style={{ height: fillTimeChartHeight }}
                role="img"
                aria-label="Gráfico de barras Recharts mostrando o tempo médio de preenchimento de vagas em dias por categoria de serviço"
                data-testid="recharts-fill-time-chart"
              >
                <ResponsiveContainer
                  width="100%"
                  height={fillTimeChartHeight}
                  minWidth={220}
                >
                  <BarChart
                    data={fillTimeStats.byCategory}
                    layout="vertical"
                    margin={{ top: 8, right: 24, left: 4, bottom: 8 }}
                    barSize={22}
                  >
                    <CartesianGrid
                      horizontal={false}
                      stroke={gridStrokeColor}
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      unit=" d"
                      axisLine={{ stroke: gridStrokeColor }}
                      tickLine={false}
                      tick={{ fill: axisTickColor, fontSize: 11 }}
                    />
                    <YAxis
                      type="category"
                      dataKey="category"
                      width={136}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: axisTickColor, fontSize: 12, fontWeight: 500 }}
                    />
                    <Tooltip
                      cursor={{
                        fill: isDark
                          ? 'rgba(255,255,255,0.04)'
                          : 'rgba(17,24,39,0.04)',
                      }}
                      content={<FillTimeChartTooltip />}
                    />
                    <Bar
                      dataKey="averageDays"
                      name="Tempo médio (dias)"
                      fill={fillTimeBarColor}
                      radius={[0, 6, 6, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Chart 3: Open vs Closed Jobs by Category */}
      <section
        aria-labelledby="stats-open-vs-closed-heading"
        data-testid="stats-open-vs-closed-chart-card"
        className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl p-5 sm:p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3
              id="stats-open-vs-closed-heading"
              className="font-display text-base sm:text-lg font-bold text-[#111827] dark:text-[#F8FAFC]"
            >
              Comparativo de vagas abertas versus encerradas
            </h3>
            <p className="text-xs sm:text-sm text-[#4B5563] dark:text-[#94A3B8] mt-1">
              Volume de vagas ativas (abertas) em comparação com as concluídas (encerradas) agrupadas por categoria de cargo.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 text-[#047857] dark:text-[#34D399]">
              <span className="w-3 h-3 rounded-full bg-[#059669] dark:bg-[#34D399] inline-block" />
              Abertas
            </span>
            <span className="inline-flex items-center gap-1.5 text-[#C93B1E] dark:text-[#F06449]">
              <span className="w-3 h-3 rounded-full bg-[#C93B1E] dark:bg-[#F06449] inline-block" />
              Encerradas
            </span>
          </div>
        </div>

        <div className="mt-4">
          {openVsClosedStats.length === 0 ? (
            <div className="py-10 px-4 text-center rounded-xl border border-dashed border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#0F172A]">
              <p className="text-sm font-semibold text-[#111827] dark:text-[#F8FAFC]">
                Nenhuma vaga cadastrada neste escopo ainda
              </p>
            </div>
          ) : (
            <div
              className="w-full min-w-0"
              style={{ height: openVsClosedChartHeight }}
              role="img"
              aria-label="Gráfico de barras Recharts comparando vagas abertas versus encerradas por categoria de cargo"
              data-testid="recharts-open-vs-closed-chart"
            >
              <ResponsiveContainer
                width="100%"
                height={openVsClosedChartHeight}
                minWidth={220}
              >
                <BarChart
                  data={openVsClosedStats}
                  layout="vertical"
                  margin={{ top: 8, right: 24, left: 4, bottom: 8 }}
                  barSize={16}
                  barGap={4}
                >
                  <CartesianGrid
                    horizontal={false}
                    stroke={gridStrokeColor}
                    strokeDasharray="3 3"
                  />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    axisLine={{ stroke: gridStrokeColor }}
                    tickLine={false}
                    tick={{ fill: axisTickColor, fontSize: 11 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="category"
                    width={136}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: axisTickColor, fontSize: 12, fontWeight: 500 }}
                  />
                  <Tooltip
                    cursor={{
                      fill: isDark
                        ? 'rgba(255,255,255,0.04)'
                        : 'rgba(17,24,39,0.04)',
                    }}
                    content={<OpenVsClosedChartTooltip />}
                  />
                  <Bar
                    dataKey="abertas"
                    name="Vagas abertas"
                    fill={openBarColor}
                    radius={[0, 4, 4, 0]}
                  />
                  <Bar
                    dataKey="encerradas"
                    name="Vagas encerradas"
                    fill={closedBarColor}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      {/* Chart 4: Monthly Finalized Hirings History (Last 6 Months) */}
      <section
        aria-labelledby="stats-finalized-hirings-heading"
        data-testid="stats-finalized-hirings-chart-card"
        className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl p-5 sm:p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3
              id="stats-finalized-hirings-heading"
              className="font-display text-base sm:text-lg font-bold text-[#111827] dark:text-[#F8FAFC]"
            >
              Histórico mensal de contratações finalizadas (últimos 6 meses)
            </h3>
            <p className="text-xs sm:text-sm text-[#4B5563] dark:text-[#94A3B8] mt-1">
              Evolução mensal de vagas preenchidas/encerradas e serviços concluídos nos últimos 6 meses em{' '}
              {scope === 'empresa'
                ? companyName.trim() || 'sua construtora'
                : 'Rondonópolis-MT'}
              .
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ECFDF5] text-[#047857] dark:bg-[#064E3B]/40 dark:text-[#34D399] text-xs font-semibold tabular-nums">
              {finalizedHiringsHistory.totalFinalized}{' '}
              {finalizedHiringsHistory.totalFinalized === 1
                ? 'contratação finalizada'
                : 'contratações finalizadas'}
            </span>
            {finalizedHiringsHistory.peakMonth && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-[#F4F5F7] text-[#374151] dark:bg-[#1E293B] dark:text-[#CBD5E1] text-xs font-medium tabular-nums">
                Pico: {finalizedHiringsHistory.peakMonth.shortMonthLabel} (
                {finalizedHiringsHistory.peakMonth.finalizadas})
              </span>
            )}
          </div>
        </div>

        {finalizedHiringsHistory.totalFinalized === 0 && (
          <div className="mt-4 p-3.5 rounded-xl border border-dashed border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#0F172A] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <p className="text-xs text-[#4B5563] dark:text-[#94A3B8]">
              Nenhuma contratação finalizada registrada pela sua construtora nos últimos 6 meses.
            </p>
            {scope === 'empresa' && (
              <button
                type="button"
                onClick={() => setScope('rede')}
                className="min-h-[36px] px-3 py-1 rounded-lg bg-[#111827] dark:bg-[#F8FAFC] text-white dark:text-[#0F172A] text-xs font-semibold cursor-pointer shrink-0 self-start sm:self-auto"
              >
                Ver panorama da rede
              </button>
            )}
          </div>
        )}

        <div
          className="mt-4 w-full min-w-0"
          style={{ height: 272 }}
          role="img"
          aria-label="Gráfico de barras Recharts mostrando o histórico mensal de contratações finalizadas nos últimos 6 meses"
          data-testid="recharts-finalized-hirings-chart"
        >
          <ResponsiveContainer width="100%" height={272} minWidth={220}>
            <BarChart
              data={finalizedHiringsHistory.months}
              margin={{ top: 12, right: 16, left: -12, bottom: 4 }}
              barSize={34}
            >
              <CartesianGrid
                vertical={false}
                stroke={gridStrokeColor}
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="shortMonthLabel"
                interval={0}
                axisLine={{ stroke: gridStrokeColor }}
                tickLine={false}
                tick={{ fill: axisTickColor, fontSize: 11, fontWeight: 500 }}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fill: axisTickColor, fontSize: 11 }}
              />
              <Tooltip
                cursor={{
                  fill: isDark
                    ? 'rgba(255,255,255,0.04)'
                    : 'rgba(17,24,39,0.04)',
                }}
                content={<FinalizedHiringsTooltip />}
              />
              <Bar
                dataKey="finalizadas"
                name="Contratações finalizadas"
                fill={openBarColor}
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Category Breakdown Table */}
      <section
        aria-labelledby="stats-category-table-heading"
        className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#F3F4F6] dark:border-[#1E293B]">
          <div>
            <h3
              id="stats-category-table-heading"
              className="font-display text-base sm:text-lg font-bold text-[#111827] dark:text-[#F8FAFC]"
            >
              Detalhamento por categoria de serviço
            </h3>
            <p className="text-xs text-[#4B5563] dark:text-[#94A3B8] mt-0.5">
              Consolidado de notas recebidas e prazo médio de contratação em{' '}
              {scope === 'empresa'
                ? companyName.trim() || 'sua construtora'
                : 'Rondonópolis-MT'}
              .
            </p>
          </div>
          <span className="text-xs text-[#4B5563] dark:text-[#94A3B8] tabular-nums">
            {combinedRows.length}{' '}
            {combinedRows.length === 1 ? 'categoria' : 'categorias'}
          </span>
        </div>

        {combinedRows.length === 0 ? (
          <p className="pt-4 text-sm text-[#4B5563] dark:text-[#94A3B8]">
            Sem dados registrados neste escopo ainda. Alterne para{' '}
            <strong>Rondonópolis</strong> para explorar os indicadores da região.
          </p>
        ) : (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[#E5E7EB] dark:border-[#1E293B] text-xs font-semibold text-[#4B5563] dark:text-[#94A3B8]">
                  <th className="py-3 pr-4">Categoria de serviço</th>
                  <th className="py-3 px-3 text-right">Avaliações</th>
                  <th className="py-3 px-3 text-right">Nota média</th>
                  <th className="py-3 px-3 text-right">Vagas preenchidas</th>
                  <th className="py-3 pl-3 text-right">Tempo médio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6] dark:divide-[#1E293B]">
                {combinedRows.map((row) => (
                  <tr
                    key={row.category}
                    className="hover:bg-[#F9FAFB] dark:hover:bg-[#1E293B]/50 transition-colors"
                  >
                    <td className="py-3 pr-4 font-semibold text-[#111827] dark:text-[#F8FAFC] whitespace-nowrap">
                      {row.category}
                    </td>
                    <td className="py-3 px-3 text-right text-[#4B5563] dark:text-[#94A3B8] tabular-nums">
                      {row.rating ? row.rating.count : '—'}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-[#B45309] dark:text-[#FBBF24] tabular-nums whitespace-nowrap">
                      {row.rating ? `${row.rating.formattedAverage} ★` : '—'}
                    </td>
                    <td className="py-3 px-3 text-right text-[#4B5563] dark:text-[#94A3B8] tabular-nums">
                      {row.fillTime ? row.fillTime.closedVacancies : '—'}
                    </td>
                    <td className="py-3 pl-3 text-right font-semibold text-[#C93B1E] dark:text-[#F06449] tabular-nums whitespace-nowrap">
                      {row.fillTime ? row.fillTime.formattedAverageDays : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
