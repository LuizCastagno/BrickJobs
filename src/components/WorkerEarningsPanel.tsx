import React, { useEffect, useMemo, useState } from 'react';
import { Banknote, Briefcase, CalendarDays } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { JobApplication, JobPosting } from '../types/brickjobs';
import {
  buildAccumulatedMonthlyEarnings,
  formatBrlCurrency,
  formatCompactBrlAxis,
  STANDARD_WORK_DAYS_PER_MONTH,
  type EarningsScope,
  type MonthlyAccumulatedEarningsPoint,
} from '../utils/workerEarnings';

interface WorkerEarningsPanelProps {
  jobs: JobPosting[];
  applications: JobApplication[];
}

interface EarningsTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{
    payload?: MonthlyAccumulatedEarningsPoint;
  }>;
}

const WorkerEarningsTooltip: React.FC<EarningsTooltipProps> = ({
  active,
  payload,
}) => {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  const previewRoles = point.items.slice(0, 3);
  const remainingCount = Math.max(0, point.items.length - previewRoles.length);

  return (
    <div className="rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#0F172A] px-3.5 py-2.5 shadow-md text-xs space-y-1.5 max-w-[260px]">
      <div className="flex items-center justify-between gap-3">
        <p className="font-display font-bold text-[#111827] dark:text-[#F8FAFC]">
          {point.fullMonthLabel}
        </p>
        <span className="text-[11px] font-medium text-[#6B7280] dark:text-[#94A3B8] tabular-nums">
          {point.completedJobsCount}{' '}
          {point.completedJobsCount === 1 ? 'vaga' : 'vagas'}
        </span>
      </div>

      <div className="space-y-0.5 tabular-nums">
        <p className="text-[#374151] dark:text-[#CBD5E1]">
          Acumulado até o mês:{' '}
          <strong className="text-[#047857] dark:text-[#34D399]">
            {formatBrlCurrency(point.cumulativeEarnings)}
          </strong>
        </p>
        <p className="text-[#374151] dark:text-[#CBD5E1]">
          Ganho no mês:{' '}
          <strong className="text-[#C93B1E] dark:text-[#F06449]">
            {formatBrlCurrency(point.monthlyEarnings)}
          </strong>
        </p>
      </div>

      {previewRoles.length > 0 && (
        <div className="pt-1.5 border-t border-[#F3F4F6] dark:border-[#1E293B] space-y-0.5">
          {previewRoles.map((item) => (
            <p
              key={item.id}
              className="text-[11px] text-[#4B5563] dark:text-[#94A3B8] truncate tabular-nums"
            >
              {item.funcao} · {formatBrlCurrency(item.estimatedMonthlyBrl)}
            </p>
          ))}
          {remainingCount > 0 && (
            <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8]">
              +{remainingCount}{' '}
              {remainingCount === 1 ? 'outra vaga concluída' : 'outras vagas concluídas'}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export const WorkerEarningsPanel: React.FC<WorkerEarningsPanelProps> = ({
  jobs,
  applications,
}) => {
  const [scope, setScope] = useState<EarningsScope>('todas');
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
      buildAccumulatedMonthlyEarnings({
        jobs,
        applications,
        scope,
      }),
    [jobs, applications, scope]
  );

  const activeMonth = useMemo(() => {
    if (summary.months.length === 0) return null;
    if (selectedMonthKey) {
      const matched = summary.months.find(
        (m) => m.monthKey === selectedMonthKey
      );
      if (matched) return matched;
    }
    return summary.months[summary.months.length - 1];
  }, [summary.months, selectedMonthKey]);

  const personalCompletedCount = useMemo(
    () => applications.filter((a) => a.status === 'concluida').length,
    [applications]
  );

  const monthlyBarColor = isDark ? '#F06449' : '#C93B1E';
  const cumulativeBarColor = isDark ? '#10B981' : '#047857';
  const axisTickColor = isDark ? '#94A3B8' : '#4B5563';
  const gridStrokeColor = isDark ? '#1E293B' : '#E5E7EB';

  return (
    <section
      aria-labelledby="worker-earnings-heading"
      data-testid="worker-earnings-panel"
      className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl p-5 sm:p-6 space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Banknote
              className="w-4 h-4 text-[#047857] dark:text-[#34D399] shrink-0"
              aria-hidden="true"
            />
            <h3
              id="worker-earnings-heading"
              className="font-display text-lg font-bold text-[#111827] dark:text-[#F8FAFC]"
            >
              Estimativa de ganhos mensais acumulados
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-[#4B5563] dark:text-[#94A3B8] mt-1">
            Evolução mensal e saldo acumulado calculados a partir das vagas concluídas.
          </p>
        </div>

        <div
          role="group"
          aria-label="Origem das vagas concluídas"
          className="inline-flex self-start sm:self-auto rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#0F172A] p-1 shrink-0"
        >
          <button
            type="button"
            onClick={() => {
              setScope('todas');
              setSelectedMonthKey('');
            }}
            aria-pressed={scope === 'todas'}
            data-testid="worker-earnings-scope-todas"
            className={`min-h-[44px] sm:min-h-[34px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              scope === 'todas'
                ? 'bg-white dark:bg-[#1E293B] text-[#111827] dark:text-[#F8FAFC] shadow-xs'
                : 'text-[#4B5563] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F8FAFC]'
            }`}
          >
            Todas concluídas
          </button>
          <button
            type="button"
            onClick={() => {
              setScope('minhas');
              setSelectedMonthKey('');
            }}
            aria-pressed={scope === 'minhas'}
            data-testid="worker-earnings-scope-minhas"
            className={`min-h-[44px] sm:min-h-[34px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
              scope === 'minhas'
                ? 'bg-white dark:bg-[#1E293B] text-[#111827] dark:text-[#F8FAFC] shadow-xs'
                : 'text-[#4B5563] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F8FAFC]'
            }`}
          >
            Minhas obras ({personalCompletedCount})
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-[#E5E7EB] dark:border-[#1E293B] bg-[#F9FAFB] dark:bg-[#0F172A] p-3.5">
          <p className="text-[11px] font-medium text-[#6B7280] dark:text-[#94A3B8]">
            Acumulado estimado
          </p>
          <p
            data-testid="worker-earnings-total-accumulated"
            className="font-display text-lg sm:text-xl font-bold text-[#047857] dark:text-[#34D399] mt-1 tabular-nums"
          >
            {formatBrlCurrency(summary.totalAccumulatedBrl)}
          </p>
        </div>

        <div className="rounded-xl border border-[#E5E7EB] dark:border-[#1E293B] bg-[#F9FAFB] dark:bg-[#0F172A] p-3.5">
          <p className="text-[11px] font-medium text-[#6B7280] dark:text-[#94A3B8]">
            Vagas concluídas
          </p>
          <p
            data-testid="worker-earnings-completed-count"
            className="font-display text-lg sm:text-xl font-bold text-[#111827] dark:text-[#F8FAFC] mt-1 tabular-nums"
          >
            {summary.totalCompletedJobs}
          </p>
        </div>

        <div className="rounded-xl border border-[#E5E7EB] dark:border-[#1E293B] bg-[#F9FAFB] dark:bg-[#0F172A] p-3.5">
          <p className="text-[11px] font-medium text-[#6B7280] dark:text-[#94A3B8]">
            Média por vaga
          </p>
          <p
            data-testid="worker-earnings-average"
            className="font-display text-lg sm:text-xl font-bold text-[#C93B1E] dark:text-[#F06449] mt-1 tabular-nums"
          >
            {formatBrlCurrency(summary.averagePerJobBrl)}
          </p>
        </div>

        <div className="rounded-xl border border-[#E5E7EB] dark:border-[#1E293B] bg-[#F9FAFB] dark:bg-[#0F172A] p-3.5">
          <p className="text-[11px] font-medium text-[#6B7280] dark:text-[#94A3B8]">
            Último mês ({summary.latestMonthLabel})
          </p>
          <p
            data-testid="worker-earnings-latest-month"
            className="font-display text-lg sm:text-xl font-bold text-[#111827] dark:text-[#F8FAFC] mt-1 tabular-nums"
          >
            {formatBrlCurrency(summary.latestMonthEarningsBrl)}
          </p>
        </div>
      </div>

      {/* Chart Area */}
      {summary.months.length === 0 ? (
        <div
          data-testid="worker-earnings-empty"
          className="rounded-xl border border-dashed border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#0F172A] p-6 sm:p-8 text-center space-y-2"
        >
          <Briefcase
            className="w-7 h-7 text-[#6B7280] dark:text-[#94A3B8] mx-auto"
            aria-hidden="true"
          />
          <p className="text-sm font-semibold text-[#111827] dark:text-[#F8FAFC]">
            {scope === 'minhas'
              ? 'Você ainda não marcou nenhuma candidatura como concluída'
              : 'Nenhuma vaga concluída registrada até o momento'}
          </p>
          <p className="text-xs text-[#4B5563] dark:text-[#94A3B8] max-w-md mx-auto">
            {scope === 'minhas'
              ? 'Assim que uma candidatura aceita for finalizada com "Concluir trabalho", seus ganhos acumulados aparecerão aqui.'
              : 'Quando vagas forem concluídas, os valores mensais e o acumulado aparecerão neste gráfico.'}
          </p>
          {scope === 'minhas' && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setScope('todas')}
                className="min-h-[44px] sm:min-h-[38px] px-4 py-1.5 rounded-lg bg-[#111827] dark:bg-[#F8FAFC] text-white dark:text-[#0F172A] text-xs font-semibold cursor-pointer"
              >
                Ver todas as vagas concluídas
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-[#E5E7EB] dark:border-[#1E293B] bg-[#F9FAFB]/60 dark:bg-[#0F172A]/60 p-4 space-y-3">
          {/* Legend */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-1.5 font-medium text-[#374151] dark:text-[#CBD5E1]">
                <span
                  aria-hidden="true"
                  className="w-2.5 h-2.5 rounded-xs bg-[#C93B1E] dark:bg-[#F06449]"
                />
                Ganho no mês (R$)
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium text-[#374151] dark:text-[#CBD5E1]">
                <span
                  aria-hidden="true"
                  className="w-2.5 h-2.5 rounded-xs bg-[#047857] dark:bg-[#10B981]"
                />
                Ganho acumulado (R$)
              </span>
            </div>

            <span className="text-[11px] text-[#6B7280] dark:text-[#94A3B8] tabular-nums">
              {summary.months.length}{' '}
              {summary.months.length === 1 ? 'mês apurado' : 'meses apurados'}
            </span>
          </div>

          <div
            className="h-[256px] w-full min-w-0"
            role="img"
            aria-label="Gráfico de barras Recharts exibindo estimativa de ganhos mensais e acumulados por mês"
            data-testid="recharts-worker-earnings-chart"
          >
            <ResponsiveContainer width="100%" height={256} minWidth={220}>
              <BarChart
                data={summary.months}
                margin={{ top: 12, right: 12, left: 4, bottom: 4 }}
                barGap={6}
                barCategoryGap="24%"
                onClick={(chartState) => {
                  const label = chartState?.activeLabel;
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
                  width={74}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatCompactBrlAxis}
                  tick={{ fill: axisTickColor, fontSize: 11 }}
                />
                <Tooltip
                  cursor={{
                    fill: isDark
                      ? 'rgba(255,255,255,0.04)'
                      : 'rgba(17,24,39,0.04)',
                  }}
                  content={<WorkerEarningsTooltip />}
                />
                <Bar
                  dataKey="monthlyEarnings"
                  name="Ganho no mês"
                  fill={monthlyBarColor}
                  radius={[5, 5, 0, 0]}
                  maxBarSize={34}
                  isAnimationActive={false}
                />
                <Bar
                  dataKey="cumulativeEarnings"
                  name="Ganho acumulado"
                  fill={cumulativeBarColor}
                  radius={[5, 5, 0, 0]}
                  maxBarSize={34}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {activeMonth && (
            <div
              data-testid="worker-earnings-month-detail"
              className="pt-3 border-t border-[#E5E7EB] dark:border-[#1E293B] space-y-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-[#111827] dark:text-[#F8FAFC] inline-flex items-center gap-1.5">
                  <CalendarDays
                    className="w-3.5 h-3.5 text-[#6B7280] dark:text-[#94A3B8]"
                    aria-hidden="true"
                  />
                  {activeMonth.fullMonthLabel}
                </span>
                <span className="text-[#4B5563] dark:text-[#94A3B8] tabular-nums">
                  {activeMonth.completedJobsCount}{' '}
                  {activeMonth.completedJobsCount === 1
                    ? 'vaga concluída'
                    : 'vagas concluídas'}{' '}
                  ·{' '}
                  <strong className="text-[#C93B1E] dark:text-[#F06449]">
                    {formatBrlCurrency(activeMonth.monthlyEarnings)}
                  </strong>{' '}
                  no mês ·{' '}
                  <strong className="text-[#047857] dark:text-[#34D399]">
                    {formatBrlCurrency(activeMonth.cumulativeEarnings)}
                  </strong>{' '}
                  acumulado
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeMonth.items.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] px-3 py-2 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-[#111827] dark:text-[#F8FAFC] truncate">
                        {item.funcao}
                      </p>
                      <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8] truncate">
                        {item.companyName} · {item.salarioOuDiaria}
                      </p>
                    </div>
                    <span className="font-semibold text-[#047857] dark:text-[#34D399] tabular-nums shrink-0">
                      {formatBrlCurrency(item.estimatedMonthlyBrl)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8] leading-relaxed">
        Base de cálculo: salários mensais pelo valor informado (média em faixas) e diárias convertidas pela referência de {STANDARD_WORK_DAYS_PER_MONTH} dias úteis/mês.
      </p>
    </section>
  );
};
