import React, { useMemo, useState } from 'react';
import { Calculator, Info, RotateCcw } from 'lucide-react';
import {
  calculateSeverance,
  CONSTRUCTION_SEVERANCE_PRESETS,
  formatCurrencyBrl,
  getDefaultWorkedDaysFromDate,
  TERMINATION_REASON_OPTIONS,
  type NoticeType,
  type SeverancePreset,
  type TerminationReason,
} from '../utils/severanceCalculator';

const inputClass =
  'w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-base sm:text-sm text-[#111827] dark:text-[#F8FAFC] placeholder:text-[#6B7280] dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-[#C93B1E] tabular-nums';

function subtractMonthsIso(monthsAgo: number, baseDate = '2026-11-15'): string {
  const [y, m, d] = baseDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1 - monthsAgo, d));
  return dt.toISOString().slice(0, 10);
}

export const SeveranceCalculatorPanel: React.FC = () => {
  const [salaryText, setSalaryText] = useState<string>('2800');
  const [admissionDate, setAdmissionDate] = useState<string>('2024-03-01');
  const [terminationDate, setTerminationDate] = useState<string>('2026-11-15');
  const [reason, setReason] = useState<TerminationReason>('sem_justa_causa');
  const [noticeType, setNoticeType] = useState<NoticeType>('indenizado');
  const [workedDays, setWorkedDays] = useState<string>('15');
  const [overduePeriods, setOverduePeriods] = useState<string>('0');
  const [dependents, setDependents] = useState<string>('0');
  const [fgtsBalanceText, setFgtsBalanceText] = useState<string>('');

  const parsedSalary = Number(salaryText.replace(',', '.'));
  const parsedFgtsOverride =
    fgtsBalanceText.trim() === ''
      ? null
      : Number(fgtsBalanceText.replace(',', '.'));

  const result = useMemo(
    () =>
      calculateSeverance({
        monthlySalary: Number.isFinite(parsedSalary) ? parsedSalary : 0,
        admissionDate,
        terminationDate,
        reason,
        noticeType,
        workedDaysInLastMonth: Number(workedDays) || 0,
        overdueVacationPeriods: Number(overduePeriods) || 0,
        dependents: Number(dependents) || 0,
        fgtsBalanceOverride:
          parsedFgtsOverride !== null && Number.isFinite(parsedFgtsOverride)
            ? parsedFgtsOverride
            : null,
      }),
    [
      parsedSalary,
      admissionDate,
      terminationDate,
      reason,
      noticeType,
      workedDays,
      overduePeriods,
      dependents,
      parsedFgtsOverride,
    ]
  );

  const activeReasonMeta = TERMINATION_REASON_OPTIONS.find(
    (opt) => opt.value === reason
  );

  const applyPreset = (preset: SeverancePreset) => {
    const exitIso = '2026-11-15';
    setSalaryText(String(preset.monthlySalary));
    setAdmissionDate(subtractMonthsIso(preset.monthsAgo, exitIso));
    setTerminationDate(exitIso);
    setReason(preset.reason);
    setNoticeType(preset.noticeType);
    setWorkedDays(String(getDefaultWorkedDaysFromDate(exitIso)));
    setOverduePeriods('0');
    setDependents('0');
    setFgtsBalanceText('');
  };

  const handleReset = () => {
    setSalaryText('2800');
    setAdmissionDate('2024-03-01');
    setTerminationDate('2026-11-15');
    setReason('sem_justa_causa');
    setNoticeType('indenizado');
    setWorkedDays('15');
    setOverduePeriods('0');
    setDependents('0');
    setFgtsBalanceText('');
  };

  return (
    <section
      aria-labelledby="severance-calculator-heading"
      data-testid="severance-calculator-panel"
      className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl p-4 sm:p-6 space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-[#F3F4F6] dark:border-[#1E293B]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#C93B1E] dark:text-[#F06449]">
            <Calculator className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Simulação trabalhista · Regras da CLT e Lei 12.506/2011</span>
          </div>
          <h2
            id="severance-calculator-heading"
            className="font-display text-lg sm:text-xl font-bold text-[#111827] dark:text-[#F8FAFC] mt-0.5"
          >
            Calculadora de Rescisão Trabalhista
          </h2>
          <p className="text-xs sm:text-sm text-[#4B5563] dark:text-[#94A3B8] mt-1">
            Calcule saldo de salário, aviso prévio proporcional, 13º, férias + 1/3, INSS, IRRF e multa do FGTS.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          data-testid="severance-reset-button"
          className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#1E293B] hover:bg-[#F3F4F6] dark:hover:bg-[#334155] text-xs sm:text-sm font-semibold text-[#111827] dark:text-[#F8FAFC] inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
        >
          <RotateCcw className="w-4 h-4 text-[#C93B1E] dark:text-[#F06449]" aria-hidden="true" />
          <span>Restaurar exemplo</span>
        </button>
      </div>

      {/* Quick Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-[#4B5563] dark:text-[#94A3B8] mr-1">
          Exemplos rápidos:
        </span>
        {CONSTRUCTION_SEVERANCE_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => applyPreset(preset)}
            data-testid={`severance-preset-${preset.id}`}
            className="min-h-[40px] px-3 py-1.5 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#1E293B] hover:bg-[#F3F4F6] dark:hover:bg-[#334155] text-xs font-medium text-[#111827] dark:text-[#F8FAFC] cursor-pointer"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Contract Inputs */}
        <div className="lg:col-span-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3.5">
            <div>
              <label
                htmlFor="sev-salary"
                className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
              >
                Salário bruto mensal (R$) *
              </label>
              <input
                id="sev-salary"
                data-testid="severance-salary-input"
                type="number"
                min="0"
                step="50"
                inputMode="decimal"
                value={salaryText}
                onChange={(e) => setSalaryText(e.target.value)}
                placeholder="Ex: 2800"
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="sev-admission"
                  className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
                >
                  Data de admissão *
                </label>
                <input
                  id="sev-admission"
                  data-testid="severance-admission-input"
                  type="date"
                  value={admissionDate}
                  onChange={(e) => setAdmissionDate(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="sev-termination"
                  className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
                >
                  Data de saída *
                </label>
                <input
                  id="sev-termination"
                  data-testid="severance-termination-input"
                  type="date"
                  value={terminationDate}
                  onChange={(e) => {
                    const nextDate = e.target.value;
                    setTerminationDate(nextDate);
                    setWorkedDays(String(getDefaultWorkedDaysFromDate(nextDate)));
                  }}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="sev-reason"
                className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
              >
                Motivo do desligamento
              </label>
              <select
                id="sev-reason"
                data-testid="severance-reason-select"
                value={reason}
                onChange={(e) => setReason(e.target.value as TerminationReason)}
                className={inputClass}
              >
                {TERMINATION_REASON_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {activeReasonMeta && (
                <p className="text-xs text-[#4B5563] dark:text-[#94A3B8] mt-1">
                  {activeReasonMeta.summary}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="sev-notice"
                  className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
                >
                  Aviso prévio
                </label>
                <select
                  id="sev-notice"
                  data-testid="severance-notice-select"
                  value={noticeType}
                  onChange={(e) => setNoticeType(e.target.value as NoticeType)}
                  className={inputClass}
                >
                  <option value="indenizado">Indenizado (ou não cumprido)</option>
                  <option value="trabalhado">Trabalhado</option>
                  <option value="dispensado">Dispensado / Não se aplica</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="sev-worked-days"
                  className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
                >
                  Dias trabalhados no último mês
                </label>
                <input
                  id="sev-worked-days"
                  data-testid="severance-worked-days-input"
                  type="number"
                  min="0"
                  max="31"
                  value={workedDays}
                  onChange={(e) => setWorkedDays(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="sev-overdue-vacations"
                  className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
                >
                  Férias vencidas não gozadas
                </label>
                <select
                  id="sev-overdue-vacations"
                  data-testid="severance-overdue-select"
                  value={overduePeriods}
                  onChange={(e) => setOverduePeriods(e.target.value)}
                  className={inputClass}
                >
                  <option value="0">Nenhuma (0 períodos)</option>
                  <option value="1">1 período vencido</option>
                  <option value="2">2 períodos vencidos</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="sev-dependents"
                  className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
                >
                  Dependentes (IRRF)
                </label>
                <input
                  id="sev-dependents"
                  data-testid="severance-dependents-input"
                  type="number"
                  min="0"
                  max="10"
                  value={dependents}
                  onChange={(e) => setDependents(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="sev-fgts-balance"
                className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
              >
                Saldo anterior de FGTS (opcional, em R$)
              </label>
              <input
                id="sev-fgts-balance"
                data-testid="severance-fgts-input"
                type="number"
                min="0"
                step="100"
                inputMode="decimal"
                value={fgtsBalanceText}
                onChange={(e) => setFgtsBalanceText(e.target.value)}
                placeholder="Vazio = estimativa automática de 8%/mês"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Right: Calculation Result */}
        <div className="lg:col-span-7 space-y-4">
          {!result.valid ? (
            <div
              role="alert"
              data-testid="severance-error"
              className="p-4 rounded-xl bg-[#FEF2F2] dark:bg-[#7F1D1D]/30 border border-[#FECACA] dark:border-[#991B1B] text-sm font-medium text-[#B91C1C] dark:text-[#FCA5A5]"
            >
              {result.error}
            </div>
          ) : (
            <>
              {/* Top 3 KPI Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-[#E5E7EB] dark:border-[#1E293B] bg-[#F9FAFB] dark:bg-[#0F172A] p-4">
                  <p className="text-xs font-semibold text-[#4B5563] dark:text-[#94A3B8]">
                    Valor líquido estimado
                  </p>
                  <p
                    data-testid="severance-net-total"
                    className="font-display text-xl sm:text-2xl font-bold text-[#047857] dark:text-[#34D399] mt-1 tabular-nums"
                  >
                    {formatCurrencyBrl(result.netTotal)}
                  </p>
                </div>

                <div className="rounded-xl border border-[#E5E7EB] dark:border-[#1E293B] bg-[#F9FAFB] dark:bg-[#0F172A] p-4">
                  <p className="text-xs font-semibold text-[#4B5563] dark:text-[#94A3B8]">
                    Bruto / Descontos
                  </p>
                  <p
                    data-testid="severance-gross-total"
                    className="font-display text-base sm:text-lg font-bold text-[#111827] dark:text-[#F8FAFC] mt-1 tabular-nums"
                  >
                    {formatCurrencyBrl(result.grossTotal)}
                  </p>
                  <p className="text-xs text-[#B91C1C] dark:text-[#FCA5A5] tabular-nums">
                    - {formatCurrencyBrl(result.totalDeductions)} em descontos
                  </p>
                </div>

                <div className="rounded-xl border border-[#E5E7EB] dark:border-[#1E293B] bg-[#F9FAFB] dark:bg-[#0F172A] p-4">
                  <p className="text-xs font-semibold text-[#4B5563] dark:text-[#94A3B8]">
                    Multa FGTS (conta vinculada)
                  </p>
                  <p
                    data-testid="severance-fgts-fine"
                    className="font-display text-base sm:text-lg font-bold text-[#C93B1E] dark:text-[#F06449] mt-1 tabular-nums"
                  >
                    {formatCurrencyBrl(result.fgtsFineAmount)}
                  </p>
                  <p className="text-xs text-[#4B5563] dark:text-[#94A3B8] tabular-nums">
                    Total geral: {formatCurrencyBrl(result.totalWithFgtsFine)}
                  </p>
                </div>
              </div>

              {/* Service Period Metadata (unboxed with typographic separators) */}
              <p className="text-xs text-[#4B5563] dark:text-[#94A3B8] tabular-nums">
                Tempo de serviço: <strong className="text-[#111827] dark:text-[#F8FAFC]">{result.serviceYears} ano(s)</strong> ({result.serviceMonthsTotal} meses) · Aviso prévio legal: <strong className="text-[#111827] dark:text-[#F8FAFC]">{result.proportionalNoticeDays} dias</strong> · 13º: {result.thirteenthMonths}/12 · Férias prop.: {result.proportionalVacationMonths}/12
              </p>

              {/* Breakdown List */}
              <div
                data-testid="severance-breakdown"
                className="rounded-xl border border-[#E5E7EB] dark:border-[#1E293B] divide-y divide-[#F3F4F6] dark:divide-[#1E293B] overflow-hidden"
              >
                {result.items.map((item) => (
                  <div
                    key={item.id}
                    className="px-4 py-3 flex items-start justify-between gap-3 bg-white dark:bg-[#111827]"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#111827] dark:text-[#F8FAFC]">
                        {item.label}
                      </p>
                      <p className="text-xs text-[#4B5563] dark:text-[#94A3B8] mt-0.5">
                        {item.reference}
                        {item.note ? ` · ${item.note}` : ''}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-bold tabular-nums whitespace-nowrap shrink-0 ${
                        item.kind === 'desconto'
                          ? 'text-[#B91C1C] dark:text-[#FCA5A5]'
                          : item.kind === 'fgts'
                            ? 'text-[#C93B1E] dark:text-[#F06449]'
                            : 'text-[#047857] dark:text-[#34D399]'
                      }`}
                    >
                      {item.kind === 'desconto' ? '- ' : '+ '}
                      {formatCurrencyBrl(item.amount)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Legal Notes */}
              <div className="rounded-xl bg-[#F9FAFB] dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#1E293B] p-3.5 space-y-1.5">
                <p className="text-xs font-semibold text-[#111827] dark:text-[#F8FAFC] flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[#C93B1E] dark:text-[#F06449]" aria-hidden="true" />
                  <span>Observações legais e prazos</span>
                </p>
                <ul className="space-y-1 text-xs text-[#4B5563] dark:text-[#94A3B8] list-disc pl-4">
                  {result.legalNotes.map((note, idx) => (
                    <li key={idx}>{note}</li>
                  ))}
                  <li>
                    Simulação estimativa baseada na CLT para referência rápida em obras. Convenções coletivas da construção civil podem prever adicionais específicos.
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};
