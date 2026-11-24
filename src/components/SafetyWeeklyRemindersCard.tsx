/**
 * @file SafetyWeeklyRemindersCard.tsx
 * @description Seção educacional dinâmica "Dicas de Segurança no Canteiro" com lembretes
 *   semanais sobre EPIs (NR-06, NR-18, NR-35), geração via Gemini com fallback local e checklist.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  HardHat,
  HelpCircle,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  formatCategoryBadgeStyle,
  getCuratedSafetyWeeklyReminders,
  getIsoWeekString,
  loadWeeklyEpiChecklist,
  toggleWeeklyEpiChecklistItem,
  type EpiCategory,
  type SafetyWeeklyPayload,
  type SafetyWeeklyReminder,
} from '../utils/safetyWeeklyTips';

interface SafetyWeeklyRemindersCardProps {
  workerRole?: string;
  onOpenQuiz?: () => void;
  className?: string;
}

export const SafetyWeeklyRemindersCard: React.FC<SafetyWeeklyRemindersCardProps> = ({
  workerRole = 'Operário da Construção Civil',
  onOpenQuiz,
  className = '',
}) => {
  const [payload, setPayload] = useState<SafetyWeeklyPayload>(() =>
    getCuratedSafetyWeeklyReminders()
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<EpiCategory | 'todos'>('todos');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<Record<string, boolean>>(() =>
    loadWeeklyEpiChecklist()
  );

  const weekInfo = getIsoWeekString(new Date());
  const isMountedRef = useRef<boolean>(true);
  const requestControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      requestControllerRef.current?.abort();
    };
  }, []);

  const fetchAiReminders = async (forced = false) => {
    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;
    setIsLoading(true);
    setFeedback('');
    try {
      const res = await fetch('/api/safety-weekly-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          role: workerRole,
          weekKey: weekInfo.weekKey,
        }),
      });
      if (!isMountedRef.current || controller.signal.aborted) return;
      if (res.ok) {
        const data = (await res.json()) as SafetyWeeklyPayload;
        if (!isMountedRef.current || controller.signal.aborted) return;
        setPayload(data);
        setFeedback(
          forced
            ? data.source === 'gemini'
              ? 'Lembretes atualizados via IA com base nas normas vigentes do canteiro.'
              : 'Diretrizes de segurança e EPIs carregadas com ciclo verificado da semana.'
            : ''
        );
      } else {
        setPayload(getCuratedSafetyWeeklyReminders(weekInfo.weekNumber));
        if (forced) {
          setFeedback('Modo offline: exibindo diretrizes de segurança verificadas.');
        }
      }
    } catch {
      if (!isMountedRef.current || controller.signal.aborted) return;
      setPayload(getCuratedSafetyWeeklyReminders(weekInfo.weekNumber));
      if (forced) {
        setFeedback('Modo offline: diretrizes de EPIs carregadas localmente.');
      }
    } finally {
      if (isMountedRef.current && !controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    void fetchAiReminders(false);
  }, [workerRole]);

  const handleToggleCheck = (checkId: string) => {
    setChecklist((prev) => toggleWeeklyEpiChecklistItem(prev, checkId));
  };

  const filteredReminders =
    selectedFilter === 'todos'
      ? payload.weeklyHighlights
      : payload.weeklyHighlights.filter((h) => h.category === selectedFilter);

  const totalChecks = payload.weeklyHighlights.reduce(
    (acc, h) => acc + h.inspectionChecklist.length,
    0
  );
  const completedChecks = Object.entries(checklist).filter(
    ([key, checked]) =>
      Boolean(checked) &&
      payload.weeklyHighlights.some((h) =>
        h.inspectionChecklist.some((_, idx) => `${h.id}-check-${idx}` === key)
      )
  ).length;

  return (
    <div
      className={`rounded-2xl border border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#1E293B] shadow-sm overflow-hidden ${className}`}
    >
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#1E293B] via-[#0F172A] to-[#C93B1E]/90 text-white p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-lg bg-white/15 text-white text-xs font-semibold backdrop-blur-sm">
              <ShieldAlert className="w-3.5 h-3.5 text-[#FDE68A] shrink-0" aria-hidden="true" />
              <span>{payload.weekLabel || weekInfo.weekLabel}</span>
              <span className="text-white/50">·</span>
              <span className="text-[#FDE68A]">Normas NR-06, NR-11, NR-12, NR-18 & NR-35</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight font-display [text-wrap:balance]">
              {payload.themeTitle}
            </h2>
            <p className="text-xs sm:text-sm text-white/80 max-w-2xl leading-relaxed">
              {payload.themeDescription}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <button
              type="button"
              onClick={() => void fetchAiReminders(true)}
              disabled={isLoading}
              title="Gerar novos lembretes dinâmicos via IA"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-xs font-semibold text-white transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 shrink-0 ${isLoading ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>{isLoading ? 'Consultando IA...' : 'Atualizar IA'}</span>
            </button>

            {onOpenQuiz && (
              <button
                type="button"
                onClick={onOpenQuiz}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#C93B1E] hover:bg-[#B3341A] text-xs font-semibold text-white shadow-sm transition-all cursor-pointer"
              >
                <Award className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Mini-Quiz</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Indicator for Daily Checklist */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#F06449] shrink-0" aria-hidden="true" />
            <span className="font-medium text-white/90">
              Checklist de Inspeção de EPIs da Obra:
            </span>
            <span className="font-bold text-white tabular-nums">
              {completedChecks} de {totalChecks} checagens
            </span>
          </div>

          <div className="w-full sm:w-48 h-2 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full bg-[#F06449] rounded-full transition-all duration-300"
              style={{
                width: `${totalChecks > 0 ? (completedChecks / totalChecks) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      {feedback && (
        <div className="px-5 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-900/40 text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Category Filter Pills */}
      <div className="p-4 sm:p-5 border-b border-[#E5E7EB] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A]/40 flex items-center gap-2 overflow-x-auto">
        <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] whitespace-nowrap mr-1">
          Filtrar por área:
        </span>
        <button
          type="button"
          onClick={() => setSelectedFilter('todos')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            selectedFilter === 'todos'
              ? 'bg-[#C93B1E] text-white shadow-sm'
              : 'bg-white dark:bg-[#1E293B] text-[#475569] dark:text-[#CBD5E1] border border-[#E2E8F0] dark:border-[#334155] hover:bg-[#F1F5F9]'
          }`}
        >
          Todos os EPIs ({payload.weeklyHighlights.length})
        </button>
        {(['cabeca', 'altura', 'pes', 'respiratoria', 'olhos', 'ouvidos', 'maos'] as EpiCategory[]).map(
          (cat) => {
            const count = payload.weeklyHighlights.filter((h) => h.category === cat).length;
            if (count === 0) return null;
            const labels: Record<EpiCategory, string> = {
              cabeca: 'Cabeça',
              altura: 'NR-35 Altura',
              pes: 'Pés',
              respiratoria: 'Respiração',
              olhos: 'Olhos',
              ouvidos: 'Audição',
              maos: 'Mãos',
            };
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedFilter === cat
                    ? 'bg-[#C93B1E] text-white shadow-sm'
                    : 'bg-white dark:bg-[#1E293B] text-[#475569] dark:text-[#CBD5E1] border border-[#E2E8F0] dark:border-[#334155] hover:bg-[#F1F5F9]'
                }`}
              >
                {labels[cat]} ({count})
              </button>
            );
          }
        )}
      </div>

      {/* Highlights List */}
      <div className="p-4 sm:p-6 space-y-4">
        {filteredReminders.map((reminder) => {
          const badgeStyle = formatCategoryBadgeStyle(reminder.category);
          const isExpanded = expandedId === reminder.id;

          return (
            <div
              key={reminder.id}
              className="rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] p-4 sm:p-5 transition-all hover:border-[#CBD5E1] dark:hover:border-[#475569] shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${badgeStyle.bgClass} ${badgeStyle.textClass} ${badgeStyle.borderClass}`}
                    >
                      {reminder.categoryLabel}
                    </span>
                    <span className="text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8]">
                      {reminder.nrReference}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                    {reminder.epiName}
                  </h3>
                  <p className="text-xs sm:text-sm font-semibold text-[#C93B1E] dark:text-[#F06449]">
                    {reminder.title}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setExpandedId(isExpanded ? null : reminder.id)
                  }
                  className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#334155] text-xs font-semibold text-[#475569] dark:text-[#CBD5E1] hover:bg-[#F8FAFC] dark:hover:bg-[#334155] cursor-pointer"
                >
                  <span>{isExpanded ? 'Menos detalhes' : 'Checklist e Riscos'}</span>
                  {isExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  )}
                </button>
              </div>

              <p className="mt-2.5 text-xs sm:text-sm text-[#475569] dark:text-[#94A3B8] leading-relaxed">
                {reminder.whyItMatters}
              </p>

              {/* Checklist pre-uso */}
              <div className="mt-4 pt-4 border-t border-[#F1F5F9] dark:border-[#334155]/60 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                    Inspeção Rápida de Campo (3 passos):
                  </span>
                  <span className="text-[11px] font-normal text-[#64748B] dark:text-[#94A3B8]">
                    Toque para marcar
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {reminder.inspectionChecklist.map((checkText, idx) => {
                    const checkKey = `${reminder.id}-check-${idx}`;
                    const isChecked = Boolean(checklist[checkKey]);
                    return (
                      <button
                        key={checkKey}
                        type="button"
                        onClick={() => handleToggleCheck(checkKey)}
                        className={`text-left p-2.5 rounded-lg border text-xs flex items-start gap-2.5 transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                            : 'bg-[#F8FAFC] dark:bg-[#0F172A]/50 border-[#E2E8F0] dark:border-[#334155] text-[#334155] dark:text-[#CBD5E1] hover:bg-[#F1F5F9]'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded mt-0.5 shrink-0 flex items-center justify-center border transition-all ${
                            isChecked
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-[#94A3B8] bg-white dark:bg-[#1E293B]'
                          }`}
                        >
                          {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </span>
                        <span className={isChecked ? 'line-through opacity-85' : ''}>
                          {checkText}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Expanded details: Common mistakes, Penalty/Risk & Competencies */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-[#F1F5F9] dark:border-[#334155]/60 space-y-3 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 space-y-1.5">
                      <span className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden="true" />
                        Erros frequentes no canteiro:
                      </span>
                      <ul className="list-disc list-inside space-y-1 text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed">
                        {reminder.commonMistakes.map((mistake, mIdx) => (
                          <li key={mIdx}>{mistake}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 space-y-1.5">
                      <span className="font-bold text-red-900 dark:text-red-200 flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-red-600 shrink-0" aria-hidden="true" />
                        Risco direto do não uso:
                      </span>
                      <p className="text-red-800 dark:text-red-300 text-[11px] leading-relaxed">
                        {reminder.penaltyOrRisk}
                      </p>
                    </div>
                  </div>

                  {((reminder.requiredCompetencies?.length ?? 0) > 0 ||
                    (reminder.preferredCompetencies?.length ?? 0) > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(reminder.requiredCompetencies?.length ?? 0) > 0 && (
                        <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#0F172A]/60 border border-[#E2E8F0] dark:border-[#334155] space-y-1.5">
                          <span className="font-bold text-[#0F172A] dark:text-[#F8FAFC] block">
                            Competências requeridas:
                          </span>
                          <ul className="space-y-1 text-[#334155] dark:text-[#CBD5E1] text-[11px] leading-relaxed">
                            {reminder.requiredCompetencies?.map((comp, cIdx) => (
                              <li key={cIdx}>· {comp}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {(reminder.preferredCompetencies?.length ?? 0) > 0 && (
                        <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#0F172A]/60 border border-[#E2E8F0] dark:border-[#334155] space-y-1.5">
                          <span className="font-bold text-[#475569] dark:text-[#94A3B8] block">
                            Competências preferenciais:
                          </span>
                          <ul className="space-y-1 text-[#475569] dark:text-[#94A3B8] text-[11px] leading-relaxed">
                            {reminder.preferredCompetencies?.map((comp, cIdx) => (
                              <li key={cIdx}>· {comp}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* General Daily Safety Talk Notice */}
      {payload.generalNotice && (
        <div className="p-4 bg-[#F8FAFC] dark:bg-[#0F172A]/60 border-t border-[#E5E7EB] dark:border-[#334155] flex items-center gap-3 text-xs text-[#475569] dark:text-[#94A3B8]">
          <Clock className="w-4 h-4 text-[#C93B1E] shrink-0" aria-hidden="true" />
          <span>{payload.generalNotice}</span>
        </div>
      )}
    </div>
  );
};
