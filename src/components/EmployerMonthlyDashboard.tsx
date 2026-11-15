import React, { useEffect, useMemo, useState } from 'react';
import { BarChart2 } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { JobPosting } from '../types/brickjobs';
import {
  buildMonthlyVacancyDashboard,
  type MonthlyVacancyStatusDatum,
} from '../utils/employerMonthlyDashboard';

interface EmployerMonthlyDashboardProps {
  jobs: JobPosting[];
  companyId: string;
  companyName: string;
}

type DashboardScope = 'rede' | 'empresa';

interface CustomTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{
    dataKey?: string;
    value?: number;
    payload?: MonthlyVacancyStatusDatum;
  }>;
}

const MonthlyDashboardTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
}) => {
  if (!active || !payload || payload.length === 0) return null;
  const datum = payload[0]?.payload;
  if (!datum) return null;

  return (
    <div className="rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#0F172A] px-3.5 py-2.5 shadow-md text-xs space-y-1">
      <p className="font-display font-bold text-[#111827] dark:text-[#F8FAFC]">
        {datum.fullMonthLabel}
      </p>
      <p className="text-[#374151] dark:text-[#CBD5E1] tabular-nums">
        <span className="font-semibold text-[#C93B1E] dark:text-[#F06449]">
          {datum.abertas}
        </span>{' '}
        {datum.abertas === 1 ? 'vaga aberta' : 'vagas abertas'}
      </p>
      <p className="text-[#374151] dark:text-[#CBD5E1] tabular-nums">
        <span className="font-semibold text-[#047857] dark:text-[#34D399]">
          {datum.encerradas}
        </span>{' '}
        {datum.encerradas === 1 ? 'vaga encerrada' : 'vagas encerradas'}
      </p>
      <p className="pt-1 border-t border-[#F3F4F6] dark:border-[#1E293B] text-[11px] text-[#6B7280] dark:text-[#94A3B8] tabular-nums">
        Total: {datum.totalVagas} vagas · {datum.taxaEncerramentoPercent}% encerradas
      </p>
    </div>
  );
};

export const EmployerMonthlyDashboard: React.FC<
  EmployerMonthlyDashboardProps
> = ({ jobs, companyId, companyName }) => {
  const companyHasJobs = useMemo(
    () => jobs.some((job) => job.companyId === companyId),
    [jobs, companyId]
  );

  const [scope, setScope] = useState<DashboardScope>('rede');
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>('');
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
      buildMonthlyVacancyDashboard({
        jobs,
        companyId: scope === 'empresa' ? companyId : undefined,
      }),
    [jobs, scope, companyId]
  );

  const activeDatum = useMemo(() => {
    if (summary.months.length === 0) return null;
    if (selectedMonthKey) {
      const matched = summary.months.find(
        (m) => m.monthKey === selectedMonthKey
      );
      if (matched) return matched;
    }
    return summary.months[summary.months.length - 1];
  }, [summary.months, selectedMonthKey]);

  const openBarColor = isDark ? '#F06449' : '#C93B1E';
  const closedBarColor = isDark ? '#10B981' : '#047857';
  const axisTickColor = isDark ? '#94A3B8' : '#4B5563';
  const gridStrokeColor = isDark ? '#1E293B' : '#E5E7EB';

  return (
    <section
      aria-labelledby="monthly-dashboard-heading"
      data-testid="employer-monthly-dashboard"
      className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl p-5 sm:p-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <BarChart2
              className="w-4 h-4 text-[#C93B1E] dark:text-[#F06449] shrink-0"
              aria-hidden="true"
            />
            <h2
              id="monthly-dashboard-heading"
              className="font-display text-lg font-bold text-[#111827] dark:text-[#F8FAFC]"
            >
              Dashboard Mensal de Vagas
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#4B5563] dark:text-[#94A3B8] mt-1">
            Evolução de vagas abertas versus encerradas por mês.
          </p>
        </div>

        <div
          role="group"
          aria-label="Escopo do dashboard mensal"
          className="inline-flex self-start sm:self-auto rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#0F172A] p-1 shrink-0"
        >
          <button
            type="button"
            onClick={() => setScope('rede')}
            aria-pressed={scope === 'rede'}
            data-testid="monthly-dashboard-scope-rede"
            className={`min-h-[44px] sm:min-h-[34px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
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
            data-testid="monthly-dashboard-scope-empresa"
            className={`min-h-[44px] sm:min-h-[34px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              scope === 'empresa'
                ? 'bg-white dark:bg-[#1E293B] text-[#111827] dark:text-[#F8FAFC] shadow-xs'
                : 'text-[#4B5563] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F8FAFC]'
            }`}
          >
            Sua construtora
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="mt-4 grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#F9FAFB] dark:bg-[#1E293B]/60 border border-[#E5E7EB] dark:border-[#334155]">
        <div>
          <p className="text-[11px] sm:text-xs text-[#4B5563] dark:text-[#94A3B8]">
            Vagas abertas
          </p>
          <p
            data-testid="monthly-dashboard-total-open"
            className="font-display text-xl sm:text-2xl font-bold text-[#C93B1E] dark:text-[#F06449] tabular-nums"
          >
            {summary.totalAbertas}
          </p>
        </div>
        <div>
          <p className="text-[11px] sm:text-xs text-[#4B5563] dark:text-[#94A3B8]">
            Vagas encerradas
          </p>
          <p
            data-testid="monthly-dashboard-total-closed"
            className="font-display text-xl sm:text-2xl font-bold text-[#047857] dark:text-[#34D399] tabular-nums"
          >
            {summary.totalEncerradas}
          </p>
        </div>
        <div>
          <p className="text-[11px] sm:text-xs text-[#4B5563] dark:text-[#94A3B8]">
            Encerramento
          </p>
          <p
            data-testid="monthly-dashboard-close-rate"
            className="font-display text-xl sm:text-2xl font-bold text-[#111827] dark:text-[#F8FAFC] tabular-nums"
          >
            {summary.taxaEncerramentoPercent}%
          </p>
        </div>
      </div>

      {/* Legend */}
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
            Vagas encerradas
          </span>
        </div>

        <span className="text-[11px] text-[#6B7280] dark:text-[#94A3B8]">
          {scope === 'empresa'
            ? companyName.trim() || 'Sua construtora'
            : `${summary.months.length} ${
                summary.months.length === 1 ? 'mês registrado' : 'meses registrados'
              }`}
        </span>
      </div>

      {/* Recharts BarChart Area */}
      <div className="mt-3 w-full">
        {summary.months.length === 0 ? (
          <div className="py-8 px-4 text-center rounded-xl border border-dashed border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#0F172A]">
            <p className="text-sm font-semibold text-[#111827] dark:text-[#F8FAFC]">
              {scope === 'empresa' && !companyHasJobs
                ? 'Sua construtora ainda não publicou vagas para o comparativo mensal'
                : 'Nenhuma vaga registrada para exibir por mês'}
            </p>
            <p className="text-xs text-[#4B5563] dark:text-[#94A3B8] mt-1">
              {scope === 'empresa'
                ? 'Publique uma oportunidade ao lado ou acompanhe o histórico de Rondonópolis.'
                : 'Novas publicações e encerramentos de vagas aparecerão agrupados por mês.'}
            </p>
            {scope === 'empresa' && (
              <button
                type="button"
                onClick={() => setScope('rede')}
                className="mt-3 min-h-[44px] sm:min-h-[38px] px-4 py-1.5 rounded-lg bg-[#111827] dark:bg-[#F8FAFC] text-white dark:text-[#0F172A] text-xs font-semibold cursor-pointer"
              >
                Ver panorama da rede
              </button>
            )}
          </div>
        ) : (
          <>
            <div
              className="h-[248px] w-full min-w-0"
              role="img"
              aria-label="Gráfico de barras Recharts comparando vagas abertas e vagas encerradas por mês"
              data-testid="recharts-monthly-bar-chart"
            >
              <ResponsiveContainer width="100%" height={248} minWidth={220}>
                <BarChart
                  data={summary.months}
                  margin={{ top: 14, right: 12, left: -12, bottom: 4 }}
                  barGap={6}
                  barCategoryGap="24%"
                  onClick={(state) => {
                    const label = state?.activeLabel;
                    if (typeof label === 'string') {
                      const found = summary.months.find(
                        (m) => m.shortMonthLabel === label
                      );
                      if (found) setSelectedMonthKey(found.monthKey);
                    }
                  }}
                >
                  <CartesianGrid
                    vertical={false}
                    stroke={gridStrokeColor}
                    strokeDasharray="3 3"
                  />
                  <XAxis
                    dataKey="shortMonthLabel"
                    axisLine={{ stroke: gridStrokeColor }}
                    tickLine={false}
                    tick={{ fill: axisTickColor, fontSize: 12, fontWeight: 500 }}
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
                    content={<MonthlyDashboardTooltip />}
                  />
                  <Bar
                    dataKey="abertas"
                    name="Vagas abertas"
                    fill={openBarColor}
                    radius={[5, 5, 0, 0]}
                    maxBarSize={36}
                  />
                  <Bar
                    dataKey="encerradas"
                    name="Vagas encerradas"
                    fill={closedBarColor}
                    radius={[5, 5, 0, 0]}
                    maxBarSize={36}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {activeDatum && (
              <div
                data-testid="monthly-dashboard-detail"
                className="mt-2 pt-2.5 border-t border-[#F3F4F6] dark:border-[#1E293B] flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <span className="font-semibold text-[#111827] dark:text-[#F8FAFC]">
                  {activeDatum.fullMonthLabel}
                </span>
                <span className="text-[#4B5563] dark:text-[#94A3B8] tabular-nums">
                  <strong className="text-[#C93B1E] dark:text-[#F06449]">
                    {activeDatum.abertas}
                  </strong>{' '}
                  {activeDatum.abertas === 1 ? 'aberta' : 'abertas'} ·{' '}
                  <strong className="text-[#047857] dark:text-[#34D399]">
                    {activeDatum.encerradas}
                  </strong>{' '}
                  {activeDatum.encerradas === 1 ? 'encerrada' : 'encerradas'} (
                  {activeDatum.taxaEncerramentoPercent}% encerradas)
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};
