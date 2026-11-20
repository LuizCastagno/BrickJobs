/**
 * @file src/components/PerformanceSummaryCard.tsx
 * @description Cartão analítico com gráfico D3 de taxa de preenchimento de vagas por ocupação e mês.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { BarChart3 } from 'lucide-react';
import type { JobApplication, JobPosting } from '../types/brickjobs';
import {
  buildMonthlyPerformanceSummary,
  getAvailablePerformanceMonths,
  type PerformanceCategoryDatum,
} from '../utils/employerPerformance';
import { SelectWrapper } from './SelectWrapper';

interface PerformanceSummaryCardProps {
  jobs: JobPosting[];
  applications: JobApplication[];
  companyId: string;
  companyName: string;
}

type PerformanceScope = 'rede' | 'empresa';

export const PerformanceSummaryCard: React.FC<PerformanceSummaryCardProps> = ({
  jobs,
  applications,
  companyId,
  companyName,
}) => {
  const companyHasJobs = useMemo(
    () => jobs.some((job) => job.companyId === companyId),
    [jobs, companyId]
  );

  const [scope, setScope] = useState<PerformanceScope>('rede');
  const availableMonths = useMemo(
    () => getAvailablePerformanceMonths(jobs, '2026-11'),
    [jobs]
  );
  const [selectedMonth, setSelectedMonth] = useState<string>(
    () => availableMonths[0]?.key || '2026-11'
  );
  const [activeCategory, setActiveCategory] =
    useState<PerformanceCategoryDatum | null>(null);
  const [isDark, setIsDark] = useState<boolean>(() =>
    typeof document !== 'undefined'
      ? document.documentElement.classList.contains('dark')
      : false
  );

  const chartWrapperRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [chartWidth, setChartWidth] = useState<number>(560);

  // Keep selectedMonth synchronized if jobs change
  useEffect(() => {
    if (!availableMonths.some((m) => m.key === selectedMonth)) {
      setSelectedMonth(availableMonths[0]?.key || '2026-11');
    }
  }, [availableMonths, selectedMonth]);

  // Observe root dark-mode class changes so D3 SVG axes & bars adapt live
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const sync = () => setIsDark(root.classList.contains('dark'));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Measure chart container width responsively across iOS/Android mobile & desktop
  useEffect(() => {
    const el = chartWrapperRef.current;
    if (!el) return;

    const updateWidth = () => {
      const nextWidth = Math.floor(el.getBoundingClientRect().width);
      if (nextWidth > 0) {
        setChartWidth(nextWidth);
      }
    };

    updateWidth();

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(updateWidth);
      ro.observe(el);
      return () => ro.disconnect();
    }

    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const summary = useMemo(
    () =>
      buildMonthlyPerformanceSummary({
        jobs,
        applications,
        monthKey: selectedMonth,
        companyId: scope === 'empresa' ? companyId : undefined,
      }),
    [jobs, applications, selectedMonth, scope, companyId]
  );

  // Sync highlighted category when dataset updates
  useEffect(() => {
    if (summary.categories.length === 0) {
      setActiveCategory(null);
      return;
    }
    setActiveCategory((prev) => {
      if (!prev) return summary.categories[0];
      return (
        summary.categories.find((c) => c.category === prev.category) ??
        summary.categories[0]
      );
    });
  }, [summary.categories]);

  // Render D3 grouped bar chart
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const data = summary.categories;
    if (data.length === 0) return;

    const isCompact = chartWidth < 460;
    const needAngledLabels = isCompact && data.length > 4;
    const chartHeight = needAngledLabels ? 256 : 236;
    const margin = {
      top: 22,
      right: isCompact ? 10 : 18,
      bottom: needAngledLabels ? 56 : 38,
      left: isCompact ? 34 : 40,
    };

    const innerWidth = Math.max(200, chartWidth - margin.left - margin.right);
    const innerHeight = chartHeight - margin.top - margin.bottom;

    svg
      .attr('width', chartWidth)
      .attr('height', chartHeight)
      .attr('viewBox', `0 0 ${chartWidth} ${chartHeight}`);

    const openColor = isDark ? '#F06449' : '#C93B1E';
    const filledColor = isDark ? '#10B981' : '#047857';
    const axisTextColor = isDark ? '#94A3B8' : '#4B5563';
    const gridColor = isDark ? '#1E293B' : '#E5E7EB';
    const valueTextColor = isDark ? '#E2E8F0' : '#111827';
    const highlightBg = isDark
      ? 'rgba(255,255,255,0.04)'
      : 'rgba(17,24,39,0.03)';

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x0 = d3
      .scaleBand<string>()
      .domain(data.map((d) => d.category))
      .range([0, innerWidth])
      .paddingInner(isCompact ? 0.24 : 0.3)
      .paddingOuter(0.22);

    const x1 = d3
      .scaleBand<'abertas' | 'preenchidas'>()
      .domain(['abertas', 'preenchidas'])
      .range([0, x0.bandwidth()])
      .padding(0.14);

    const maxVal =
      d3.max(data, (d) => Math.max(d.abertas, d.preenchidas)) ?? 1;
    const yMax = Math.max(2, Math.ceil(maxVal * 1.18));

    const y = d3.scaleLinear().domain([0, yMax]).nice().range([innerHeight, 0]);

    // Horizontal Y gridlines
    const yTicks = y.ticks(Math.min(5, yMax));
    g.append('g')
      .attr('class', 'd3-grid')
      .call(
        d3
          .axisLeft(y)
          .tickValues(yTicks.filter((t) => Number.isInteger(t)))
          .tickSize(-innerWidth)
          .tickFormat(() => '')
      )
      .call((grid) => grid.select('.domain').remove())
      .call((grid) =>
        grid
          .selectAll('line')
          .attr('stroke', gridColor)
          .attr('stroke-dasharray', '3,3')
      );

    // Y Axis
    g.append('g')
      .attr('class', 'd3-y-axis')
      .call(
        d3
          .axisLeft(y)
          .tickValues(yTicks.filter((t) => Number.isInteger(t)))
          .tickFormat((d) => String(d))
      )
      .call((axis) => axis.select('.domain').remove())
      .call((axis) => axis.selectAll('line').remove())
      .call((axis) =>
        axis
          .selectAll('text')
          .attr('fill', axisTextColor)
          .attr('font-size', '11px')
          .style('font-variant-numeric', 'tabular-nums')
      );

    // X Axis
    const labelMap = new Map(
      data.map((d) => [d.category, isCompact ? d.shortLabel : d.shortLabel])
    );

    const xAxisGroup = g
      .append('g')
      .attr('class', 'd3-x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(
        d3
          .axisBottom(x0)
          .tickSizeOuter(0)
          .tickFormat((cat) => labelMap.get(cat) ?? cat)
      );

    xAxisGroup.select('.domain').attr('stroke', gridColor);
    xAxisGroup.selectAll('line').attr('stroke', gridColor);

    const xTickTexts = xAxisGroup
      .selectAll('text')
      .attr('fill', axisTextColor)
      .attr('font-size', isCompact ? '10.5px' : '11.5px')
      .attr('font-weight', '500');

    if (needAngledLabels) {
      xTickTexts
        .attr('text-anchor', 'end')
        .attr('dx', '-0.4em')
        .attr('dy', '0.45em')
        .attr('transform', 'rotate(-24)');
    }

    // Category groups
    const categoryGroups = g
      .selectAll<SVGGElement, PerformanceCategoryDatum>('g.d3-category-group')
      .data(data, (d) => d.category)
      .join('g')
      .attr('class', 'd3-category-group')
      .attr('transform', (d) => `translate(${x0(d.category) ?? 0},0)`)
      .style('cursor', 'pointer')
      .on('mouseenter', (_event, d) => setActiveCategory(d))
      .on('click', (_event, d) => setActiveCategory(d));

    // Subtle full-band hover/focus background
    categoryGroups
      .append('rect')
      .attr('x', -2)
      .attr('y', 0)
      .attr('width', x0.bandwidth() + 4)
      .attr('height', innerHeight)
      .attr('rx', 6)
      .attr('fill', (d) =>
        activeCategory?.category === d.category ? highlightBg : 'transparent'
      );

    const seriesMeta: {
      key: 'abertas' | 'preenchidas';
      color: string;
      label: string;
    }[] = [
      { key: 'abertas', color: openColor, label: 'Vagas abertas' },
      { key: 'preenchidas', color: filledColor, label: 'Vagas preenchidas' },
    ];

    seriesMeta.forEach((serie) => {
      categoryGroups
        .append('rect')
        .attr('class', `d3-bar-${serie.key}`)
        .attr('data-category', (d) => d.category)
        .attr('x', x1(serie.key) ?? 0)
        .attr('y', (d) => y(d[serie.key]))
        .attr('width', Math.max(6, x1.bandwidth()))
        .attr('height', (d) => Math.max(0, innerHeight - y(d[serie.key])))
        .attr('rx', 4)
        .attr('fill', serie.color);

      categoryGroups
        .append('text')
        .attr('x', (x1(serie.key) ?? 0) + x1.bandwidth() / 2)
        .attr('y', (d) => Math.max(11, y(d[serie.key]) - 5))
        .attr('text-anchor', 'middle')
        .attr('fill', valueTextColor)
        .attr('font-size', isCompact ? '10px' : '11px')
        .attr('font-weight', '600')
        .style('font-variant-numeric', 'tabular-nums')
        .text((d) => (d[serie.key] > 0 ? String(d[serie.key]) : ''));
    });
  }, [summary.categories, chartWidth, isDark, activeCategory?.category]);

  return (
    <section
      aria-labelledby="performance-summary-heading"
      data-testid="employer-performance-card"
      className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl p-5 sm:p-6"
    >
      {/* Card Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <BarChart3
              className="w-4 h-4 text-[#C93B1E] dark:text-[#F06449] shrink-0"
              aria-hidden="true"
            />
            <h2
              id="performance-summary-heading"
              className="font-display text-lg font-bold text-[#111827] dark:text-[#F8FAFC]"
            >
              Resumo de Desempenho
            </h2>
          </div>

          <div>
            <label htmlFor="performance-month-select" className="sr-only">
              Selecionar mês de referência
            </label>
            <SelectWrapper chevronClassName="right-3">
              <select
                id="performance-month-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="min-h-[44px] sm:min-h-[38px] appearance-none pl-3.5 pr-9 py-1.5 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-base sm:text-xs font-semibold text-[#111827] dark:text-[#F8FAFC] focus:outline-none focus:border-[#C93B1E] cursor-pointer"
              >
                {availableMonths.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>
            </SelectWrapper>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs sm:text-sm text-[#4B5563] dark:text-[#94A3B8]">
            Vagas abertas versus preenchidas por categoria profissional em{' '}
            {summary.monthLabel}.
          </p>

          <div
            role="group"
            aria-label="Escopo do gráfico de desempenho"
            className="inline-flex self-start sm:self-auto rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#0F172A] p-1 shrink-0"
          >
            <button
              type="button"
              onClick={() => setScope('rede')}
              aria-pressed={scope === 'rede'}
              data-testid="performance-scope-rede"
              className={`min-h-[44px] sm:min-h-[34px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
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
              data-testid="performance-scope-empresa"
              className={`min-h-[44px] sm:min-h-[34px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
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

      {/* KPI Strip */}
      <div className="mt-4 grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#F9FAFB] dark:bg-[#1E293B]/60 border border-[#E5E7EB] dark:border-[#334155]">
        <div>
          <p className="text-[11px] sm:text-xs text-[#4B5563] dark:text-[#94A3B8]">
            Em aberto
          </p>
          <p
            data-testid="performance-total-open"
            className="font-display text-xl sm:text-2xl font-bold text-[#C93B1E] dark:text-[#F06449] tabular-nums"
          >
            {summary.totalAbertas}
          </p>
        </div>
        <div>
          <p className="text-[11px] sm:text-xs text-[#4B5563] dark:text-[#94A3B8]">
            Preenchidas
          </p>
          <p
            data-testid="performance-total-filled"
            className="font-display text-xl sm:text-2xl font-bold text-[#047857] dark:text-[#34D399] tabular-nums"
          >
            {summary.totalPreenchidas}
          </p>
        </div>
        <div>
          <p className="text-[11px] sm:text-xs text-[#4B5563] dark:text-[#94A3B8]">
            Preenchimento
          </p>
          <p
            data-testid="performance-fill-rate"
            className="font-display text-xl sm:text-2xl font-bold text-[#111827] dark:text-[#F8FAFC] tabular-nums"
          >
            {summary.fillRatePercent}%
          </p>
        </div>
      </div>

      {/* Legend + Context Note */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5 font-medium text-[#374151] dark:text-[#CBD5E1]">
            <span
              aria-hidden="true"
              className="w-2.5 h-2.5 rounded-xs bg-[#C93B1E] dark:bg-[#F06449]"
            />
            Vagas abertas
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium text-[#374151] dark:text-[#CBD5E1]">
            <span
              aria-hidden="true"
              className="w-2.5 h-2.5 rounded-xs bg-[#047857] dark:bg-[#10B981]"
            />
            Vagas preenchidas
          </span>
        </div>

        <span className="text-[11px] text-[#6B7280] dark:text-[#94A3B8]">
          {scope === 'empresa'
            ? companyName.trim() || 'Sua construtora'
            : 'Panorama regional de Rondonópolis-MT'}
        </span>
      </div>

      {/* D3 Chart Area */}
      <div ref={chartWrapperRef} className="mt-2 w-full">
        {summary.categories.length === 0 ? (
          <div className="py-8 px-4 text-center rounded-xl border border-dashed border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#0F172A] mt-2">
            <p className="text-sm font-semibold text-[#111827] dark:text-[#F8FAFC]">
              {scope === 'empresa' && !companyHasJobs
                ? 'Sua construtora ainda não publicou vagas neste mês'
                : 'Sem movimentação registrada para este período'}
            </p>
            <p className="text-xs text-[#4B5563] dark:text-[#94A3B8] mt-1">
              {scope === 'empresa'
                ? 'Publique uma busca ao lado ou veja o panorama da rede em Rondonópolis.'
                : 'Novas vagas e aprovações aparecerão aqui automaticamente.'}
            </p>
            {scope === 'empresa' && (
              <button
                type="button"
                onClick={() => setScope('rede')}
                className="mt-3 min-h-[44px] sm:min-h-[38px] px-4 py-1.5 rounded-lg bg-[#111827] dark:bg-[#F8FAFC] text-white dark:text-[#0F172A] text-xs font-semibold cursor-pointer"
              >
                Ver panorama de Rondonópolis
              </button>
            )}
          </div>
        ) : (
          <>
            <svg
              ref={svgRef}
              role="img"
              aria-label={`Gráfico de barras D3 comparando vagas abertas e preenchidas por categoria profissional em ${summary.monthLabel}`}
              data-testid="d3-performance-chart"
              className="block w-full overflow-hidden select-none"
            />

            {activeCategory && (
              <div
                data-testid="performance-category-detail"
                className="mt-2 pt-2.5 border-t border-[#F3F4F6] dark:border-[#1E293B] flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <span className="font-semibold text-[#111827] dark:text-[#F8FAFC]">
                  {activeCategory.category}
                </span>
                <span className="text-[#4B5563] dark:text-[#94A3B8] tabular-nums">
                  <strong className="text-[#C93B1E] dark:text-[#F06449]">
                    {activeCategory.abertas}
                  </strong>{' '}
                  {activeCategory.abertas === 1 ? 'aberta' : 'abertas'} ·{' '}
                  <strong className="text-[#047857] dark:text-[#34D399]">
                    {activeCategory.preenchidas}
                  </strong>{' '}
                  {activeCategory.preenchidas === 1
                    ? 'preenchida'
                    : 'preenchidas'}{' '}
                  ({activeCategory.fillRate}% preenchimento)
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};
