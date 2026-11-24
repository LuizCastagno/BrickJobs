/**
 * @file src/components/FeaturedCompaniesSection.tsx
 * @description Seção "Construtoras em Destaque" no Portal do Trabalhador, com ranking e
 *   gráfico Recharts exibindo a nota média das empresas com base nas avaliações dos usuários.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Award, Briefcase, MapPin, MessageSquareQuote, Star } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CompanyRating, JobPosting } from '../types/brickjobs';
import {
  buildFeaturedCompaniesSummary,
  formatRatingDecimalPtBr,
  type FeaturedCompaniesSortMode,
  type FeaturedCompanyItem,
} from '../utils/featuredCompanies';

interface FeaturedCompaniesSectionProps {
  companyRatings: CompanyRating[];
  jobs: JobPosting[];
  onFilterByCompany?: (companyName: string) => void;
  className?: string;
}

interface RatingTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{
    payload?: FeaturedCompanyItem;
  }>;
}

const FeaturedCompanyTooltip: React.FC<RatingTooltipProps> = ({
  active,
  payload,
}) => {
  if (!active || !payload || payload.length === 0) return null;
  const company = payload[0]?.payload;
  if (!company) return null;

  return (
    <div className="rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#0F172A] px-3.5 py-2.5 shadow-md text-xs space-y-1 max-w-[260px]">
      <p className="font-display font-bold text-[#111827] dark:text-[#F8FAFC]">
        {company.companyName}
      </p>
      <p className="text-[#374151] dark:text-[#CBD5E1] tabular-nums">
        Nota média:{' '}
        <strong className="text-[#C93B1E] dark:text-[#F06449]">
          {company.formattedAverage} / 5,0
        </strong>{' '}
        · {company.ratingsCount}{' '}
        {company.ratingsCount === 1 ? 'avaliação' : 'avaliações'}
      </p>
      <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8] tabular-nums">
        {company.openJobsCount}{' '}
        {company.openJobsCount === 1
          ? 'vaga aberta na região'
          : 'vagas abertas na região'}
      </p>
    </div>
  );
};

export const FeaturedCompaniesSection: React.FC<FeaturedCompaniesSectionProps> = ({
  companyRatings,
  jobs,
  onFilterByCompany,
  className = '',
}) => {
  const [sortBy, setSortBy] = useState<FeaturedCompaniesSortMode>('nota');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [isDark, setIsDark] = useState<boolean>(() =>
    typeof document !== 'undefined'
      ? document.documentElement.classList.contains('dark')
      : false
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const sync = () => setIsDark(root.classList.contains('dark'));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const summary = useMemo(
    () =>
      buildFeaturedCompaniesSummary({
        ratings: companyRatings,
        jobs,
        sortBy,
        limit: 8,
      }),
    [companyRatings, jobs, sortBy]
  );

  const selectedCompany = useMemo(() => {
    if (summary.companies.length === 0) return null;
    return (
      summary.companies.find((c) => c.companyId === selectedCompanyId) ??
      summary.companies[0]
    );
  }, [summary.companies, selectedCompanyId]);

  const primaryBarColor = isDark ? '#F06449' : '#C93B1E';
  const topBarColor = isDark ? '#F59E0B' : '#D97706';
  const mutedBarColor = isDark ? '#334155' : '#D1D5DB';
  const gridStrokeColor = isDark ? '#1E293B' : '#E5E7EB';
  const axisTickColor = isDark ? '#94A3B8' : '#4B5563';
  const labelTextColor = isDark ? '#F8FAFC' : '#111827';

  const chartHeight = Math.max(210, summary.companies.length * 48 + 36);

  return (
    <section
      aria-labelledby="featured-companies-heading"
      data-testid="featured-companies-section"
      className={`rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] p-5 sm:p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-medium text-[#6B7280] dark:text-[#94A3B8]">
            <span>Reputação verificada pelos trabalhadores</span>
            <span aria-hidden="true">·</span>
            <span>Rondonópolis-MT</span>
          </div>
          <h2
            id="featured-companies-heading"
            className="font-display text-xl sm:text-2xl font-bold text-[#111827] dark:text-[#F8FAFC] mt-1 [text-wrap:balance]"
          >
            Construtoras em Destaque
          </h2>
          <p className="text-xs sm:text-sm text-[#4B5563] dark:text-[#94A3B8] mt-1 max-w-2xl leading-relaxed">
            Ranking baseado na média das avaliações reais enviadas após a conclusão de cada serviço na plataforma.
          </p>
        </div>

        {/* Sort Control */}
        <div
          role="group"
          aria-label="Ordenar construtoras em destaque"
          className="inline-flex self-start rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#0F172A] p-1 shrink-0"
        >
          <button
            type="button"
            onClick={() => setSortBy('nota')}
            aria-pressed={sortBy === 'nota'}
            data-testid="featured-companies-sort-nota"
            className={`min-h-[40px] sm:min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              sortBy === 'nota'
                ? 'bg-white dark:bg-[#1E293B] text-[#111827] dark:text-[#F8FAFC] shadow-xs'
                : 'text-[#4B5563] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F8FAFC]'
            }`}
          >
            Maior nota média
          </button>
          <button
            type="button"
            onClick={() => setSortBy('avaliacoes')}
            aria-pressed={sortBy === 'avaliacoes'}
            data-testid="featured-companies-sort-avaliacoes"
            className={`min-h-[40px] sm:min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              sortBy === 'avaliacoes'
                ? 'bg-white dark:bg-[#1E293B] text-[#111827] dark:text-[#F8FAFC] shadow-xs'
                : 'text-[#4B5563] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F8FAFC]'
            }`}
          >
            Mais avaliadas
          </button>
        </div>
      </div>

      {/* KPI Summary Strip */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-[#F9FAFB] dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#1E293B]">
        <div>
          <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">
            Média geral da rede
          </p>
          <p
            data-testid="featured-companies-overall-avg"
            className="font-display text-xl sm:text-2xl font-bold text-[#111827] dark:text-[#F8FAFC] mt-0.5 tabular-nums"
          >
            {summary.formattedOverallAverage}
            <span className="text-xs font-medium text-[#6B7280] dark:text-[#94A3B8] ml-1">
              / 5,0
            </span>
          </p>
        </div>

        <div>
          <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">
            Avaliações computadas
          </p>
          <p
            data-testid="featured-companies-total-count"
            className="font-display text-xl sm:text-2xl font-bold text-[#C93B1E] dark:text-[#F06449] mt-0.5 tabular-nums"
          >
            {summary.totalRatings}{' '}
            <span className="text-xs font-medium text-[#6B7280] dark:text-[#94A3B8]">
              {summary.totalRatings === 1 ? 'avaliação' : 'avaliações'}
            </span>
          </p>
        </div>

        <div className="min-w-0">
          <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">
            Melhor avaliada
          </p>
          <p
            data-testid="featured-companies-leader"
            className="font-display text-sm sm:text-base font-bold text-[#047857] dark:text-[#34D399] mt-1 truncate tabular-nums"
          >
            {summary.topRatedCompany
              ? `${summary.topRatedCompany.companyName} (${summary.topRatedCompany.formattedAverage})`
              : 'Aguardando avaliações'}
          </p>
        </div>
      </div>

      {summary.companies.length === 0 ? (
        <div
          data-testid="featured-companies-empty"
          className="mt-5 rounded-xl border border-dashed border-[#D1D5DB] dark:border-[#334155] p-8 text-center"
        >
          <p className="text-sm font-semibold text-[#111827] dark:text-[#F8FAFC]">
            Ainda não há avaliações registradas para construtoras.
          </p>
          <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-1">
            Assim que os trabalhadores concluírem obras e enviarem suas notas de 1 a 5 estrelas, o comparativo aparecerá aqui.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Recharts Horizontal Bar Visualization */}
          <div className="lg:col-span-7 min-w-0 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-[#111827] dark:text-[#F8FAFC]">
                Nota média por empresa (escala 0 a 5 estrelas)
              </span>
              <div className="flex items-center gap-4 text-[#4B5563] dark:text-[#94A3B8]">
                <span className="inline-flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className="w-2.5 h-2.5 rounded-xs bg-[#D97706] dark:bg-[#F59E0B]"
                  />
                  1º lugar
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className="w-2.5 h-2.5 rounded-xs bg-[#C93B1E] dark:bg-[#F06449]"
                  />
                  Demais destaques
                </span>
              </div>
            </div>

            <div
              className="w-full min-w-0"
              style={{ height: `${chartHeight}px` }}
              role="img"
              aria-label="Gráfico de barras Recharts exibindo a nota média de avaliação das construtoras em destaque"
              data-testid="recharts-featured-companies-chart"
            >
              <ResponsiveContainer width="100%" height={chartHeight} minWidth={220}>
                <BarChart
                  data={summary.companies}
                  layout="vertical"
                  margin={{ top: 8, right: 42, left: 4, bottom: 8 }}
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
                    tickFormatter={(v) => formatRatingDecimalPtBr(Number(v))}
                    tick={{ fill: axisTickColor, fontSize: 11 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="shortName"
                    width={138}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: axisTickColor, fontSize: 11, fontWeight: 500 }}
                  />
                  <Tooltip
                    cursor={{
                      fill: isDark
                        ? 'rgba(255,255,255,0.04)'
                        : 'rgba(17,24,39,0.04)',
                    }}
                    content={<FeaturedCompanyTooltip />}
                  />
                  <Bar
                    dataKey="averageRating"
                    name="Nota média"
                    radius={[0, 6, 6, 0]}
                    maxBarSize={26}
                    isAnimationActive={false}
                    className="cursor-pointer"
                    onClick={(_barData, idx) => {
                      const clicked = summary.companies[idx];
                      if (clicked) setSelectedCompanyId(clicked.companyId);
                    }}
                  >
                    {summary.companies.map((company, index) => {
                      const isSelected =
                        selectedCompany?.companyId === company.companyId;
                      const isLeader = index === 0;
                      const baseColor = isLeader ? topBarColor : primaryBarColor;
                      const barFill =
                        !selectedCompanyId || isSelected
                          ? baseColor
                          : mutedBarColor;
                      return (
                        <Cell key={company.companyId} fill={barFill} />
                      );
                    })}
                    <LabelList
                      dataKey="formattedAverage"
                      position="right"
                      fill={labelTextColor}
                      fontSize={12}
                      fontWeight={700}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Ranking list with hairline dividers */}
            <div className="pt-2 border-t border-[#E5E7EB] dark:border-[#1E293B] divide-y divide-[#F3F4F6] dark:divide-[#1E293B]">
              {summary.companies.map((company, idx) => {
                const isSelected =
                  selectedCompany?.companyId === company.companyId;
                return (
                  <button
                    key={company.companyId}
                    type="button"
                    onClick={() => setSelectedCompanyId(company.companyId)}
                    aria-pressed={isSelected}
                    data-testid={`featured-company-row-${company.companyId}`}
                    className={`w-full min-h-[44px] py-2.5 px-3 text-left flex items-center justify-between gap-3 transition-colors rounded-lg cursor-pointer ${
                      isSelected
                        ? 'bg-[#FFF7ED] dark:bg-[#1E293B]'
                        : 'hover:bg-[#F9FAFB] dark:hover:bg-[#0F172A]/60'
                    }`}
                  >
                    <div className="min-w-0 flex items-center gap-2.5">
                      <span className="text-xs font-mono font-bold text-[#6B7280] dark:text-[#94A3B8] w-5 shrink-0 tabular-nums">
                        {String(idx + 1).padStart(2, '0')}.
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#111827] dark:text-[#F8FAFC] truncate">
                          {company.companyName}
                        </p>
                        <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] truncate tabular-nums">
                          {company.ratingsCount}{' '}
                          {company.ratingsCount === 1
                            ? 'avaliação'
                            : 'avaliações'}
                          {' · '}
                          {company.openJobsCount}{' '}
                          {company.openJobsCount === 1
                            ? 'vaga aberta'
                            : 'vagas abertas'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 text-sm font-bold text-[#111827] dark:text-[#F8FAFC] tabular-nums">
                      <Star
                        className="w-4 h-4 text-[#D97706] dark:text-[#F59E0B] fill-current shrink-0"
                        aria-hidden="true"
                      />
                      <span>{company.formattedAverage}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Selected Company Rating Breakdown & Latest Worker Review */}
          {selectedCompany && (
            <div
              data-testid="featured-company-detail"
              className="lg:col-span-5 rounded-xl border border-[#E5E7EB] dark:border-[#1E293B] bg-[#F9FAFB]/70 dark:bg-[#0F172A]/60 p-4 sm:p-5 space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[#C93B1E] dark:text-[#F06449] flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Ficha da Construtora</span>
                  </p>
                  <h3 className="font-display text-lg font-bold text-[#111827] dark:text-[#F8FAFC] mt-0.5">
                    {selectedCompany.companyName}
                  </h3>
                </div>

                <div className="text-right shrink-0 tabular-nums">
                  <p className="font-display text-2xl font-bold text-[#111827] dark:text-[#F8FAFC] leading-none">
                    {selectedCompany.formattedAverage}
                  </p>
                  <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8] mt-1">
                    {selectedCompany.ratingsCount}{' '}
                    {selectedCompany.ratingsCount === 1
                      ? 'avaliação'
                      : 'avaliações'}
                  </p>
                </div>
              </div>

              {/* 5-to-1 Star Distribution */}
              <div className="space-y-1.5 pt-2 border-t border-[#E5E7EB] dark:border-[#1E293B]">
                <p className="text-xs font-semibold text-[#374151] dark:text-[#CBD5E1]">
                  Distribuição das notas
                </p>
                {([5, 4, 3, 2, 1] as const).map((star) => {
                  const count = selectedCompany.distribution[star];
                  const pct =
                    selectedCompany.ratingsCount > 0
                      ? Math.round((count / selectedCompany.ratingsCount) * 100)
                      : 0;
                  return (
                    <div
                      key={star}
                      className="flex items-center gap-2 text-xs tabular-nums"
                    >
                      <span className="w-10 text-[#4B5563] dark:text-[#94A3B8] font-medium shrink-0">
                        {star} ★
                      </span>
                      <div className="flex-1 h-2 rounded-full bg-[#E5E7EB] dark:bg-[#1E293B] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#D97706] dark:bg-[#F59E0B]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-6 text-right text-[#4B5563] dark:text-[#94A3B8] shrink-0">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Neighborhoods & Open Vacancies */}
              {selectedCompany.neighborhoods.length > 0 && (
                <div className="pt-2 border-t border-[#E5E7EB] dark:border-[#1E293B] flex items-start gap-2 text-xs text-[#4B5563] dark:text-[#94A3B8]">
                  <MapPin className="w-4 h-4 text-[#C93B1E] dark:text-[#F06449] shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    Frentes abertas em:{' '}
                    <strong className="text-[#111827] dark:text-[#F8FAFC]">
                      {selectedCompany.neighborhoods.join(', ')}
                    </strong>
                  </span>
                </div>
              )}

              {/* Latest Worker Quote */}
              {selectedCompany.latestComment && (
                <blockquote className="pt-3 border-t border-[#E5E7EB] dark:border-[#1E293B] space-y-1.5">
                  <p className="text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] flex items-center gap-1.5">
                    <MessageSquareQuote className="w-3.5 h-3.5 text-[#6B7280] dark:text-[#94A3B8] shrink-0" aria-hidden="true" />
                    <span>Depoimento recente de trabalhador</span>
                  </p>
                  <p className="text-xs text-[#374151] dark:text-[#CBD5E1] italic leading-relaxed">
                    “{selectedCompany.latestComment}”
                  </p>
                  <footer className="text-[11px] text-[#6B7280] dark:text-[#94A3B8]">
                    {selectedCompany.latestCommentAuthor || 'Profissional'}
                    {selectedCompany.latestJobRole
                      ? ` · ${selectedCompany.latestJobRole}`
                      : ''}
                    {selectedCompany.latestCreatedAt
                      ? ` · ${selectedCompany.latestCreatedAt}`
                      : ''}
                  </footer>
                </blockquote>
              )}

              {onFilterByCompany && (
                <button
                  type="button"
                  onClick={() => onFilterByCompany(selectedCompany.companyName)}
                  data-testid="featured-company-filter-jobs-btn"
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#111827] hover:bg-[#1F2937] dark:bg-[#F8FAFC] dark:hover:bg-[#E2E8F0] text-white dark:text-[#0F172A] text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Briefcase className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>
                    {selectedCompany.openJobsCount > 0
                      ? `Ver ${selectedCompany.openJobsCount} ${
                          selectedCompany.openJobsCount === 1
                            ? 'vaga aberta'
                            : 'vagas abertas'
                        } da empresa`
                      : 'Buscar vagas desta construtora'}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
