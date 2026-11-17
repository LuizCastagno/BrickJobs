import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  Plus,
  TrendingUp,
  X,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PANEL_REVEAL_TRANSITION, PANEL_REVEAL_VARIANTS } from '../utils/motionPresets';
import {
  addSiteWorkEntry,
  buildWorkerProductivityDashboard,
  formatHoursPtBr,
  getAvailableProductivityMonths,
  getProductivitySites,
  loadWorkerProductivityLogs,
  RONDONOPOLIS_CONSTRUCTION_SITES,
  type DailyProductivityPoint,
  type SiteProductivityBreakdown,
  type SiteWorkEntry,
} from '../utils/workerProductivity';

interface WorkerProductivityPanelProps {
  workerRole?: string;
}

interface DailyTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: DailyProductivityPoint }>;
}

const DailyProductivityTooltip: React.FC<DailyTooltipProps> = ({
  active,
  payload,
}) => {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div className="rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#0F172A] px-3.5 py-2.5 shadow-md text-xs space-y-1 max-w-[240px]">
      <p className="font-display font-bold text-[#111827] dark:text-[#F8FAFC]">
        {item.fullDateLabel}
      </p>
      <p className="text-[11px] font-medium text-[#4B5563] dark:text-[#94A3B8]">
        {item.primarySiteName} · {item.primaryNeighborhood}
      </p>
      <div className="pt-1 space-y-0.5 tabular-nums">
        <p className="text-[#374151] dark:text-[#CBD5E1]">
          Horas trabalhadas:{' '}
          <strong className="text-[#C93B1E] dark:text-[#F06449]">
            {formatHoursPtBr(item.hoursWorked)}
          </strong>
        </p>
        <p className="text-[#374151] dark:text-[#CBD5E1]">
          Produtividade:{' '}
          <strong className="text-[#047857] dark:text-[#34D399]">
            {item.productivityPct}%
          </strong>
        </p>
      </div>
      {item.taskSummary && (
        <p className="pt-1 border-t border-[#F3F4F6] dark:border-[#1E293B] text-[11px] text-[#6B7280] dark:text-[#94A3B8] leading-snug">
          {item.taskSummary}
        </p>
      )}
    </div>
  );
};

interface SiteTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: SiteProductivityBreakdown }>;
}

const SiteBreakdownTooltip: React.FC<SiteTooltipProps> = ({
  active,
  payload,
}) => {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div className="rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#0F172A] px-3.5 py-2.5 shadow-md text-xs space-y-1 max-w-[230px]">
      <p className="font-display font-bold text-[#111827] dark:text-[#F8FAFC]">
        {item.siteName}
      </p>
      <p className="text-[11px] text-[#4B5563] dark:text-[#94A3B8]">
        {item.neighborhood} · {item.daysWorked}{' '}
        {item.daysWorked === 1 ? 'turno' : 'turnos'}
      </p>
      <div className="pt-1 space-y-0.5 tabular-nums">
        <p className="text-[#374151] dark:text-[#CBD5E1]">
          Total no canteiro:{' '}
          <strong className="text-[#C93B1E] dark:text-[#F06449]">
            {formatHoursPtBr(item.totalHours)}
          </strong>{' '}
          ({item.sharePct}%)
        </p>
        <p className="text-[#374151] dark:text-[#CBD5E1]">
          Produtividade média:{' '}
          <strong className="text-[#047857] dark:text-[#34D399]">
            {item.avgProductivityPct}%
          </strong>
        </p>
      </div>
    </div>
  );
};

export const WorkerProductivityPanel: React.FC<WorkerProductivityPanelProps> = ({
  workerRole,
}) => {
  const [entries, setEntries] = useState<SiteWorkEntry[]>(() =>
    loadWorkerProductivityLogs()
  );
  const availableMonths = useMemo(
    () => getAvailableProductivityMonths(entries),
    [entries]
  );

  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(
    () => availableMonths[0]?.monthKey ?? '2026-11'
  );
  const [selectedSiteId, setSelectedSiteId] = useState<string>('todos');
  const [showLogForm, setShowLogForm] = useState<boolean>(false);

  // New shift entry form state
  const [logDate, setLogDate] = useState<string>('2026-11-17');
  const [logSiteId, setLogSiteId] = useState<string>(
    RONDONOPOLIS_CONSTRUCTION_SITES[0].id
  );
  const [logHours, setLogHours] = useState<string>('8.5');
  const [logProductivity, setLogProductivity] = useState<string>('94');
  const [logTask, setLogTask] = useState<string>('');
  const [logError, setLogError] = useState<string>('');
  const [logFeedback, setLogFeedback] = useState<string>('');

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

  const activeMonthKey = useMemo(() => {
    if (availableMonths.some((m) => m.monthKey === selectedMonthKey)) {
      return selectedMonthKey;
    }
    return availableMonths[0]?.monthKey ?? '2026-11';
  }, [availableMonths, selectedMonthKey]);

  const siteOptions = useMemo(
    () => getProductivitySites(entries, activeMonthKey),
    [entries, activeMonthKey]
  );

  const dashboard = useMemo(
    () =>
      buildWorkerProductivityDashboard({
        entries,
        monthKey: activeMonthKey,
        siteId: selectedSiteId,
      }),
    [entries, activeMonthKey, selectedSiteId]
  );

  const handleMonthChange = (nextMonthKey: string) => {
    setSelectedMonthKey(nextMonthKey);
    setSelectedSiteId('todos');
  };

  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLogError('');
    setLogFeedback('');

    const parsedHours = Number(logHours.replace(',', '.'));
    const parsedProductivity = Number(logProductivity.replace(',', '.'));

    const result = addSiteWorkEntry(
      entries,
      {
        date: logDate,
        siteId: logSiteId,
        hoursWorked: parsedHours,
        productivityPct: parsedProductivity,
        taskSummary: logTask,
      },
      RONDONOPOLIS_CONSTRUCTION_SITES
    );

    if (!result.ok) {
      setLogError(result.error);
      return;
    }

    setEntries(result.entries);
    const createdMonthKey = result.created.date.slice(0, 7);
    setSelectedMonthKey(createdMonthKey);
    setSelectedSiteId('todos');
    setLogTask('');
    setShowLogForm(false);
    setLogFeedback(
      `Turno registrado: ${formatHoursPtBr(result.created.hoursWorked)} em ${result.created.siteName} (${result.created.productivityPct}% de produtividade).`
    );
  };

  const hoursBarColor = isDark ? '#F06449' : '#C93B1E';
  const mutedSiteBarColor = isDark ? '#475569' : '#CBD5E1';
  const productivityLineColor = isDark ? '#34D399' : '#047857';
  const axisTickColor = isDark ? '#94A3B8' : '#4B5563';
  const gridStrokeColor = isDark ? '#1E293B' : '#E5E7EB';

  const inputClass =
    'w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-sm text-[#111827] dark:text-[#F8FAFC] placeholder:text-[#6B7280] dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-[#C93B1E]';

  return (
    <section
      aria-labelledby="worker-productivity-heading"
      data-testid="worker-productivity-panel"
      className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl p-5 sm:p-6"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-4 border-b border-[#F3F4F6] dark:border-[#1E293B]">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#C93B1E] dark:text-[#F06449]">
            <TrendingUp className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>
              Desempenho mensal ·{' '}
              {workerRole?.trim() || 'Operário em Rondonópolis-MT'}
            </span>
          </div>
          <h2
            id="worker-productivity-heading"
            className="font-display text-lg sm:text-xl font-bold text-[#111827] dark:text-[#F8FAFC] mt-1"
          >
            Produtividade e horas trabalhadas por canteiro
          </h2>
          <p className="text-sm text-[#4B5563] dark:text-[#94A3B8] mt-1">
            Histórico ao longo do mês com total de horas por turno, meta entregue e distribuição entre obras.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div
            role="group"
            aria-label="Selecionar mês de referência"
            className="inline-flex items-center gap-1 p-1 rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#0F172A]"
          >
            {availableMonths.map((month) => {
              const active = month.monthKey === activeMonthKey;
              return (
                <button
                  key={month.monthKey}
                  type="button"
                  aria-pressed={active}
                  onClick={() => handleMonthChange(month.monthKey)}
                  data-testid={`productivity-month-${month.monthKey}`}
                  className={`min-h-[40px] sm:min-h-[34px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-white dark:bg-[#1E293B] text-[#111827] dark:text-[#F8FAFC] shadow-xs'
                      : 'text-[#4B5563] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F8FAFC]'
                  }`}
                >
                  {month.shortLabel}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            aria-expanded={showLogForm}
            onClick={() => {
              setLogError('');
              setShowLogForm((prev) => !prev);
            }}
            data-testid="productivity-toggle-log-form"
            className="min-h-[44px] sm:min-h-[40px] px-3.5 py-2 rounded-xl bg-[#111827] hover:bg-[#1F2937] dark:bg-[#F8FAFC] dark:hover:bg-[#E2E8F0] text-white dark:text-[#0F172A] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {showLogForm ? (
              <>
                <X className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Fechar registro</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Registrar turno</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Inline Shift Logging Form */}
      <AnimatePresence initial={false}>
        {showLogForm && (
          <motion.form
            key="productivity-log-form"
            initial={PANEL_REVEAL_VARIANTS.initial}
            animate={PANEL_REVEAL_VARIANTS.animate}
            exit={PANEL_REVEAL_VARIANTS.exit}
            transition={PANEL_REVEAL_TRANSITION}
            onSubmit={handleLogSubmit}
            data-testid="productivity-log-form"
            className="mt-4 rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#0F172A] p-4 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs sm:text-sm font-bold text-[#111827] dark:text-[#F8FAFC]">
                Novo apontamento de horas na obra
              </p>
              <span className="text-xs text-[#4B5563] dark:text-[#94A3B8]">
                Atualiza os gráficos na hora
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label
                  htmlFor="prod-log-date"
                  className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1"
                >
                  Data do turno
                </label>
                <input
                  id="prod-log-date"
                  type="date"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="lg:col-span-2">
                <label
                  htmlFor="prod-log-site"
                  className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1"
                >
                  Canteiro de obra
                </label>
                <select
                  id="prod-log-site"
                  value={logSiteId}
                  onChange={(e) => setLogSiteId(e.target.value)}
                  className={inputClass}
                >
                  {RONDONOPOLIS_CONSTRUCTION_SITES.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name} ({site.neighborhood})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="prod-log-hours"
                  className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1"
                >
                  Horas trabalhadas
                </label>
                <input
                  id="prod-log-hours"
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="16"
                  value={logHours}
                  onChange={(e) => setLogHours(e.target.value)}
                  className={`${inputClass} tabular-nums`}
                />
              </div>

              <div>
                <label
                  htmlFor="prod-log-productivity"
                  className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1"
                >
                  Produtividade (%)
                </label>
                <input
                  id="prod-log-productivity"
                  type="number"
                  min="10"
                  max="100"
                  value={logProductivity}
                  onChange={(e) => setLogProductivity(e.target.value)}
                  className={`${inputClass} tabular-nums`}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="flex-1 min-w-0">
                <label
                  htmlFor="prod-log-task"
                  className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1"
                >
                  Frente / atividade executada
                </label>
                <input
                  id="prod-log-task"
                  type="text"
                  value={logTask}
                  onChange={(e) => setLogTask(e.target.value)}
                  placeholder="Ex: Reboco interno · 3º pavimento"
                  className={inputClass}
                />
              </div>

              <button
                type="submit"
                data-testid="productivity-submit-log"
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[#C93B1E] hover:bg-[#B23319] text-white text-xs sm:text-sm font-semibold cursor-pointer whitespace-nowrap shrink-0"
              >
                Salvar apontamento
              </button>
            </div>

            {logError && (
              <p
                role="alert"
                className="text-xs font-medium text-[#B91C1C] dark:text-[#FCA5A5]"
              >
                {logError}
              </p>
            )}
          </motion.form>
        )}
      </AnimatePresence>

      {logFeedback && (
        <div
          role="status"
          data-testid="productivity-log-feedback"
          className="mt-4 rounded-xl border border-[#A7F3D0] dark:border-[#065F46] bg-[#ECFDF5] dark:bg-[#064E3B]/30 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#047857] dark:text-[#34D399] flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{logFeedback}</span>
        </div>
      )}

      {/* Construction Site Filter Bar */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div
          role="group"
          aria-label="Filtrar histórico por canteiro de obra"
          className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#F3F4F6] dark:bg-[#1E293B]"
        >
          <button
            type="button"
            aria-pressed={selectedSiteId === 'todos'}
            onClick={() => setSelectedSiteId('todos')}
            data-testid="productivity-site-filter-todos"
            className={`min-h-[40px] sm:min-h-[34px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              selectedSiteId === 'todos'
                ? 'bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] shadow-xs'
                : 'text-[#4B5563] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F8FAFC]'
            }`}
          >
            Todos os canteiros
          </button>

          {siteOptions.map((site) => {
            const active = selectedSiteId === site.id;
            return (
              <button
                key={site.id}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedSiteId(site.id)}
                data-testid={`productivity-site-filter-${site.id}`}
                className={`min-h-[40px] sm:min-h-[34px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] shadow-xs'
                    : 'text-[#4B5563] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F8FAFC]'
                }`}
              >
                {site.neighborhood}
              </button>
            );
          })}
        </div>

        <span className="text-xs text-[#4B5563] dark:text-[#94A3B8] tabular-nums">
          {dashboard.monthLabel} · {dashboard.activeDaysCount}{' '}
          {dashboard.activeDaysCount === 1 ? 'dia registrado' : 'dias registrados'}
        </span>
      </div>

      {/* 4-Column Tabular KPI Strip */}
      <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3 p-3.5 rounded-xl bg-[#F9FAFB] dark:bg-[#1E293B]/60 border border-[#E5E7EB] dark:border-[#334155]">
        <div>
          <p className="text-[11px] sm:text-xs text-[#4B5563] dark:text-[#94A3B8] inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#C93B1E] dark:text-[#F06449]" aria-hidden="true" />
            <span>Horas trabalhadas</span>
          </p>
          <p
            data-testid="productivity-kpi-total-hours"
            className="font-display text-xl sm:text-2xl font-bold text-[#111827] dark:text-[#F8FAFC] tabular-nums mt-0.5"
          >
            {formatHoursPtBr(dashboard.totalHours)}
          </p>
        </div>

        <div>
          <p className="text-[11px] sm:text-xs text-[#4B5563] dark:text-[#94A3B8] inline-flex items-center gap-1">
            <CalendarDays className="w-3.5 h-3.5 text-[#4B5563] dark:text-[#94A3B8]" aria-hidden="true" />
            <span>Média por turno</span>
          </p>
          <p
            data-testid="productivity-kpi-avg-hours"
            className="font-display text-xl sm:text-2xl font-bold text-[#111827] dark:text-[#F8FAFC] tabular-nums mt-0.5"
          >
            {formatHoursPtBr(dashboard.avgDailyHours)}
          </p>
        </div>

        <div>
          <p className="text-[11px] sm:text-xs text-[#4B5563] dark:text-[#94A3B8] inline-flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-[#047857] dark:text-[#34D399]" aria-hidden="true" />
            <span>Produtividade média</span>
          </p>
          <p
            data-testid="productivity-kpi-avg-prod"
            className="font-display text-xl sm:text-2xl font-bold text-[#047857] dark:text-[#34D399] tabular-nums mt-0.5"
          >
            {dashboard.avgProductivityPct}%
          </p>
        </div>

        <div>
          <p className="text-[11px] sm:text-xs text-[#4B5563] dark:text-[#94A3B8] inline-flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-[#C93B1E] dark:text-[#F06449]" aria-hidden="true" />
            <span>Canteiros no recorte</span>
          </p>
          <p
            data-testid="productivity-kpi-sites-count"
            className="font-display text-xl sm:text-2xl font-bold text-[#111827] dark:text-[#F8FAFC] tabular-nums mt-0.5"
          >
            {dashboard.sitesCount}{' '}
            <span className="text-xs font-medium text-[#4B5563] dark:text-[#94A3B8]">
              {dashboard.sitesCount === 1 ? 'obra' : 'obras'}
            </span>
          </p>
        </div>
      </div>

      {/* Charts Grid: Daily ComposedChart + Per-Site Breakdown BarChart */}
      {dashboard.dailySeries.length === 0 ? (
        <div
          data-testid="productivity-empty-state"
          className="mt-4 py-8 px-4 text-center rounded-xl border border-dashed border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#0F172A]"
        >
          <p className="text-sm font-semibold text-[#111827] dark:text-[#F8FAFC]">
            Nenhum turno registrado neste canteiro em {dashboard.monthLabel}
          </p>
          <p className="text-xs text-[#4B5563] dark:text-[#94A3B8] mt-1">
            Selecione todos os canteiros ou registre um novo apontamento de horas acima.
          </p>
          <button
            type="button"
            onClick={() => setSelectedSiteId('todos')}
            className="mt-3 min-h-[44px] sm:min-h-[38px] px-4 py-1.5 rounded-xl bg-[#111827] dark:bg-[#F8FAFC] text-white dark:text-[#0F172A] text-xs font-semibold cursor-pointer"
          >
            Ver todos os canteiros
          </button>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left Chart: Daily Hours + Productivity Line over the Month */}
          <div className="lg:col-span-7 flex flex-col justify-between rounded-xl border border-[#E5E7EB] dark:border-[#1E293B] bg-[#F9FAFB]/70 dark:bg-[#0F172A]/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="font-display text-sm sm:text-base font-bold text-[#111827] dark:text-[#F8FAFC]">
                  Evolução diária no mês
                </h3>
                <p className="text-xs text-[#4B5563] dark:text-[#94A3B8]">
                  Horas trabalhadas (barras) e produtividade da meta (linha)
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1.5 font-medium text-[#374151] dark:text-[#CBD5E1]">
                  <span
                    aria-hidden="true"
                    className="w-2.5 h-2.5 rounded-xs bg-[#C93B1E] dark:bg-[#F06449]"
                  />
                  Horas (h)
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium text-[#374151] dark:text-[#CBD5E1]">
                  <span
                    aria-hidden="true"
                    className="w-3 h-0.5 bg-[#047857] dark:bg-[#34D399]"
                  />
                  Produtividade (%)
                </span>
              </div>
            </div>

            <div
              className="h-[252px] w-full min-w-0"
              role="img"
              aria-label="Gráfico Recharts combinado mostrando horas trabalhadas e produtividade ao longo do mês"
              data-testid="recharts-worker-monthly-chart"
            >
              <ResponsiveContainer width="100%" height={252} minWidth={220}>
                <ComposedChart
                  data={dashboard.dailySeries}
                  margin={{ top: 10, right: 4, left: -16, bottom: 2 }}
                >
                  <CartesianGrid
                    vertical={false}
                    stroke={gridStrokeColor}
                    strokeDasharray="3 3"
                  />
                  <XAxis
                    dataKey="dayLabel"
                    axisLine={{ stroke: gridStrokeColor }}
                    tickLine={false}
                    minTickGap={14}
                    tick={{ fill: axisTickColor, fontSize: 11, fontWeight: 500 }}
                  />
                  <YAxis
                    yAxisId="hours"
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 12]}
                    tickFormatter={(v) => `${v}h`}
                    tick={{ fill: axisTickColor, fontSize: 11 }}
                  />
                  <YAxis
                    yAxisId="prod"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    domain={[60, 100]}
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fill: axisTickColor, fontSize: 11 }}
                  />
                  <Tooltip
                    cursor={{
                      fill: isDark
                        ? 'rgba(255,255,255,0.04)'
                        : 'rgba(17,24,39,0.04)',
                    }}
                    content={<DailyProductivityTooltip />}
                  />
                  <Bar
                    yAxisId="hours"
                    dataKey="hoursWorked"
                    name="Horas trabalhadas"
                    fill={hoursBarColor}
                    radius={[5, 5, 0, 0]}
                    maxBarSize={26}
                    isAnimationActive={false}
                  />
                  <Line
                    yAxisId="prod"
                    type="monotone"
                    dataKey="productivityPct"
                    name="Produtividade"
                    stroke={productivityLineColor}
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: productivityLineColor, strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                    isAnimationActive={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right Chart: Total Hours & Productivity by Construction Site */}
          <div className="lg:col-span-5 flex flex-col justify-between rounded-xl border border-[#E5E7EB] dark:border-[#1E293B] bg-[#F9FAFB]/70 dark:bg-[#0F172A]/60 p-4">
            <div className="mb-3">
              <h3 className="font-display text-sm sm:text-base font-bold text-[#111827] dark:text-[#F8FAFC]">
                Horas por canteiro de obra
              </h3>
              <p className="text-xs text-[#4B5563] dark:text-[#94A3B8]">
                Clique em uma barra para filtrar o histórico daquela obra
              </p>
            </div>

            <div
              className="h-[190px] w-full min-w-0"
              role="img"
              aria-label="Gráfico de barras horizontais Recharts comparando horas trabalhadas por canteiro de obra"
              data-testid="recharts-worker-sites-chart"
            >
              <ResponsiveContainer width="100%" height={190} minWidth={200}>
                <BarChart
                  data={dashboard.bySite}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
                >
                  <CartesianGrid
                    horizontal={false}
                    stroke={gridStrokeColor}
                    strokeDasharray="3 3"
                  />
                  <XAxis
                    type="number"
                    axisLine={{ stroke: gridStrokeColor }}
                    tickLine={false}
                    tickFormatter={(v) => `${v}h`}
                    tick={{ fill: axisTickColor, fontSize: 11 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="neighborhood"
                    width={124}
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
                    content={<SiteBreakdownTooltip />}
                  />
                  <Bar
                    dataKey="totalHours"
                    name="Horas no canteiro"
                    radius={[0, 5, 5, 0]}
                    maxBarSize={22}
                    isAnimationActive={false}
                    className="cursor-pointer"
                    onClick={(_barData, idx) => {
                      const clickedId = dashboard.bySite[idx]?.siteId;
                      if (typeof clickedId === 'string') {
                        setSelectedSiteId((prev) =>
                          prev === clickedId ? 'todos' : clickedId
                        );
                      }
                    }}
                  >
                    {dashboard.bySite.map((site) => {
                      const isHighlighted =
                        selectedSiteId === 'todos' ||
                        selectedSiteId === site.siteId;
                      return (
                        <Cell
                          key={site.siteId}
                          fill={isHighlighted ? hoursBarColor : mutedSiteBarColor}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Compact Tabular Site Breakdown Footer */}
            <ul
              data-testid="productivity-sites-summary"
              className="mt-3 pt-2.5 border-t border-[#E5E7EB] dark:border-[#1E293B] space-y-1.5 text-xs tabular-nums"
            >
              {dashboard.bySite.map((site) => {
                const isSelected = selectedSiteId === site.siteId;
                return (
                  <li
                    key={site.siteId}
                    className={`flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'font-bold text-[#C93B1E] dark:text-[#F06449]'
                        : 'text-[#374151] dark:text-[#CBD5E1]'
                    }`}
                  >
                    <span className="truncate">{site.siteName}</span>
                    <span className="whitespace-nowrap shrink-0">
                      {formatHoursPtBr(site.totalHours)} ·{' '}
                      <strong className="text-[#047857] dark:text-[#34D399]">
                        {site.avgProductivityPct}%
                      </strong>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
};
