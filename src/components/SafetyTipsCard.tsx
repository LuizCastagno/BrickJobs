import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  HardHat,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import type { WorkerProfile } from '../types/brickjobs';
import { PANEL_REVEAL_TRANSITION, PANEL_REVEAL_VARIANTS } from '../utils/motionPresets';
import {
  buildDailySafetyQuiz,
  calculateQuizPoints,
  evaluateSafetyQuizAnswers,
  getDailySafetyTip,
  getLocalDateKey,
  isTipRelevantToRole,
  loadAcknowledgedSafetyTips,
  loadSafetyQuizResult,
  SAFETY_CATEGORY_OPTIONS,
  saveSafetyQuizResult,
  toggleAcknowledgedSafetyTip,
  type SafetyQuizQuestion,
  type SafetyQuizSummary,
  type SafetyTipCategory,
  type StoredSafetyQuizResult,
} from '../utils/safetyTips';

interface SafetyTipsCardProps {
  workerProfile: WorkerProfile;
  onQuizComplete?: (summary: SafetyQuizSummary) => void;
}

type SafetyCardViewMode = 'reading' | 'quiz' | 'result';

export const SafetyTipsCard: React.FC<SafetyTipsCardProps> = ({
  workerProfile,
  onQuizComplete,
}) => {
  const roleLabel = workerProfile.funcaoPrincipal?.trim() || '';
  const [category, setCategory] = useState<SafetyTipCategory>('todos');
  const [offset, setOffset] = useState<number>(0);

  const todayKey = useMemo(() => getLocalDateKey(), []);
  const [acknowledgedIds, setAcknowledgedIds] = useState<string[]>(() =>
    loadAcknowledgedSafetyTips(todayKey)
  );
  const [storedQuizResult, setStoredQuizResult] =
    useState<StoredSafetyQuizResult | null>(() => loadSafetyQuizResult(todayKey));

  const [viewMode, setViewMode] = useState<SafetyCardViewMode>('reading');
  const [quizQuestions, setQuizQuestions] = useState<SafetyQuizQuestion[]>([]);
  const [quizStep, setQuizStep] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Array<number | null>>(
    []
  );

  const { tip, index, totalInScope, dateLabel } = useMemo(
    () =>
      getDailySafetyTip({
        roleHint: roleLabel,
        category,
        offset,
      }),
    [roleLabel, category, offset]
  );

  const isRelevantToUserRole = useMemo(
    () => isTipRelevantToRole(tip, roleLabel),
    [tip, roleLabel]
  );

  const isReadToday = acknowledgedIds.includes(tip.id);
  const hasConfirmedAnyTipToday = acknowledgedIds.length > 0;

  const currentQuestion = quizQuestions[quizStep] ?? null;
  const currentSelectedIndex = selectedAnswers[quizStep] ?? null;
  const hasAnsweredCurrent = currentSelectedIndex !== null;

  const quizSummary = useMemo(
    () => evaluateSafetyQuizAnswers(quizQuestions, selectedAnswers),
    [quizQuestions, selectedAnswers]
  );

  const handleSelectCategory = (nextCategory: SafetyTipCategory) => {
    setCategory(nextCategory);
    setOffset(0);
    setViewMode('reading');
  };

  const handleToggleAcknowledge = () => {
    setAcknowledgedIds((prev) =>
      toggleAcknowledgedSafetyTip(prev, tip.id, todayKey)
    );
  };

  const handleStartQuiz = () => {
    if (!hasConfirmedAnyTipToday) return;
    const primaryTipId = isReadToday
      ? tip.id
      : acknowledgedIds[acknowledgedIds.length - 1] || tip.id;
    const questions = buildDailySafetyQuiz({
      primaryTipId,
      dateKey: todayKey,
      count: 3,
    });
    setQuizQuestions(questions);
    setQuizStep(0);
    setSelectedAnswers(new Array(questions.length).fill(null));
    setViewMode('quiz');
  };

  const handleSelectQuizOption = (optionIndex: number) => {
    if (hasAnsweredCurrent) return;
    setSelectedAnswers((prev) => {
      const next = [...prev];
      next[quizStep] = optionIndex;
      return next;
    });
  };

  const handleAdvanceQuiz = () => {
    if (!hasAnsweredCurrent) return;
    if (quizStep + 1 < quizQuestions.length) {
      setQuizStep((prev) => prev + 1);
      return;
    }

    const summary = evaluateSafetyQuizAnswers(quizQuestions, selectedAnswers);
    const saved = saveSafetyQuizResult(todayKey, summary);
    setStoredQuizResult(saved);
    onQuizComplete?.(summary);
    setViewMode('result');
  };

  return (
    <section
      aria-labelledby="safety-tips-heading"
      data-testid="safety-tips-card"
      className="scroll-mt-20 bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl p-5 sm:p-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[#F3F4F6] dark:border-[#1E293B]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 text-[#B45309] dark:text-[#FBBF24]">
              <HardHat className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Segurança do Trabalho · Dica diária ({dateLabel})</span>
            </span>
            <span className="px-2 py-0.5 rounded-md border border-[#E5E7EB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#0F172A] text-[#374151] dark:text-[#CBD5E1] font-mono text-[11px]">
              {viewMode === 'quiz' && currentQuestion
                ? currentQuestion.nrReference
                : tip.nrReference}
            </span>
            {storedQuizResult && (
              <span
                data-testid="safety-quiz-daily-badge"
                className="px-2 py-0.5 rounded-md border border-[#A7F3D0] dark:border-[#065F46] bg-[#ECFDF5] dark:bg-[#064E3B]/30 text-[#047857] dark:text-[#34D399] text-[11px] tabular-nums"
              >
                Quiz hoje: {storedQuizResult.correctCount}/{storedQuizResult.total}
              </span>
            )}
          </div>
          <h2
            id="safety-tips-heading"
            className="font-display text-lg sm:text-xl font-bold text-[#111827] dark:text-[#F8FAFC] mt-1.5"
          >
            {viewMode === 'reading'
              ? 'Boas práticas de segurança e uso de EPIs na obra'
              : 'Mini-quiz de segurança e uso de EPIs'}
          </h2>
          <p className="text-sm text-[#4B5563] dark:text-[#94A3B8] mt-1">
            {viewMode === 'reading'
              ? 'Orientações diárias baseadas nas Normas Regulamentadoras (NR-06, NR-10, NR-18 e NR-35) para proteger você no canteiro.'
              : 'Teste seus conhecimentos práticos sobre equipamentos de proteção e prevenção no canteiro de obras.'}
          </p>
        </div>

        {viewMode === 'reading' ? (
          <div className="flex items-center gap-2 shrink-0 self-start">
            <button
              type="button"
              onClick={() => setOffset((prev) => prev - 1)}
              aria-label="Dica anterior de segurança"
              data-testid="safety-tip-prev-button"
              className="min-w-[44px] min-h-[44px] px-2.5 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#1E293B] hover:bg-[#F3F4F6] dark:hover:bg-[#334155] text-[#111827] dark:text-[#F8FAFC] inline-flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </button>

            <span
              data-testid="safety-tip-counter"
              className="px-2 text-xs font-semibold text-[#4B5563] dark:text-[#94A3B8] tabular-nums whitespace-nowrap"
            >
              {index + 1} de {totalInScope}
            </span>

            <button
              type="button"
              onClick={() => setOffset((prev) => prev + 1)}
              aria-label="Próxima dica de segurança"
              data-testid="safety-tip-next-button"
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#1E293B] hover:bg-[#F3F4F6] dark:hover:bg-[#334155] text-xs sm:text-sm font-semibold text-[#111827] dark:text-[#F8FAFC] inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>Próxima dica</span>
              <ChevronRight className="w-4 h-4 text-[#C93B1E] dark:text-[#F06449]" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setViewMode('reading')}
            data-testid="safety-quiz-return-tips-top"
            className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#1E293B] hover:bg-[#F3F4F6] dark:hover:bg-[#334155] text-xs sm:text-sm font-semibold text-[#111827] dark:text-[#F8FAFC] inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 self-start whitespace-nowrap"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            <span>Voltar às dicas</span>
          </button>
        )}
      </div>

      {/* Category Filter (only in reading mode) */}
      {viewMode === 'reading' && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div
            role="group"
            aria-label="Filtrar dicas de segurança por tema"
            className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#F3F4F6] dark:bg-[#1E293B]"
          >
            {SAFETY_CATEGORY_OPTIONS.map((item) => {
              const active = category === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => handleSelectCategory(item.id)}
                  data-testid={`safety-category-${item.id}`}
                  className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] shadow-sm'
                      : 'text-[#4B5563] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F8FAFC]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <span className="text-xs font-medium text-[#4B5563] dark:text-[#94A3B8]">
            {isRelevantToUserRole ? (
              <>
                Destaque para{' '}
                <strong className="text-[#111827] dark:text-[#F8FAFC]">
                  {roleLabel}
                </strong>
              </>
            ) : (
              tip.categoryLabel
            )}
          </span>
        </div>
      )}

      {/* Body Transitions */}
      <AnimatePresence mode="wait" initial={false}>
        {viewMode === 'reading' && (
          <motion.div
            key={`tip-${tip.id}`}
            initial={PANEL_REVEAL_VARIANTS.initial}
            animate={PANEL_REVEAL_VARIANTS.animate}
            exit={PANEL_REVEAL_VARIANTS.exit}
            transition={PANEL_REVEAL_TRANSITION}
            data-testid="safety-tip-body"
            className="mt-4 space-y-4"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
              <div className="lg:col-span-7 rounded-xl border border-[#E5E7EB] dark:border-[#1E293B] bg-[#F9FAFB] dark:bg-[#0F172A] p-4 sm:p-5 flex flex-col justify-between gap-3.5">
                <div>
                  <h3
                    data-testid="safety-tip-title"
                    className="font-display text-base sm:text-lg font-bold text-[#111827] dark:text-[#F8FAFC]"
                  >
                    {tip.title}
                  </h3>
                  <p className="text-sm text-[#374151] dark:text-[#CBD5E1] mt-2 leading-relaxed">
                    {tip.recommendedPractice}
                  </p>
                </div>

                <div className="rounded-xl border border-[#FDE68A] dark:border-[#92400E] bg-[#FFFBEB] dark:bg-[#78350F]/20 p-3 flex items-start gap-2.5">
                  <AlertTriangle
                    className="w-4 h-4 text-[#B45309] dark:text-[#FCD34D] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <p className="text-xs sm:text-sm text-[#78350F] dark:text-[#FDE68A] leading-relaxed">
                    <strong className="font-semibold">Prevenção de acidentes:</strong>{' '}
                    {tip.whyItMatters}
                  </p>
                </div>
              </div>

              <div className="lg:col-span-5 rounded-xl border border-[#E5E7EB] dark:border-[#1E293B] bg-[#F9FAFB] dark:bg-[#0F172A] p-4 sm:p-5 flex flex-col justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#4B5563] dark:text-[#94A3B8]">
                    EPIs recomendados
                  </p>
                  <ul
                    data-testid="safety-tip-ppe-list"
                    className="mt-2.5 space-y-2"
                  >
                    {tip.requiredPpe.map((ppe) => (
                      <li
                        key={ppe}
                        className="flex items-start gap-2 text-xs sm:text-sm font-medium text-[#111827] dark:text-[#F8FAFC]"
                      >
                        <ShieldCheck
                          className="w-4 h-4 text-[#047857] dark:text-[#34D399] shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <span>{ppe}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-3 border-t border-[#E5E7EB] dark:border-[#1E293B] flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-[#4B5563] dark:text-[#94A3B8]">
                    Checklist de início de turno
                  </span>

                  <button
                    type="button"
                    aria-pressed={isReadToday}
                    onClick={handleToggleAcknowledge}
                    data-testid="safety-tip-ack-button"
                    className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                      isReadToday
                        ? 'bg-[#ECFDF5] dark:bg-[#064E3B]/40 text-[#047857] dark:text-[#34D399] border border-[#A7F3D0] dark:border-[#065F46]'
                        : 'bg-[#111827] hover:bg-[#1F2937] dark:bg-[#F8FAFC] dark:hover:bg-[#E2E8F0] text-white dark:text-[#0F172A]'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>
                      {isReadToday
                        ? 'Leitura confirmada hoje'
                        : 'Confirmar leitura de hoje'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Mini-Quiz Unlock & Launch Bar */}
            <div className="rounded-xl border border-[#E5E7EB] dark:border-[#1E293B] bg-[#F9FAFB] dark:bg-[#0F172A] px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <ClipboardCheck
                  className={`w-4 h-4 shrink-0 mt-0.5 ${
                    hasConfirmedAnyTipToday
                      ? 'text-[#C93B1E] dark:text-[#F06449]'
                      : 'text-[#6B7280] dark:text-[#94A3B8]'
                  }`}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-[#111827] dark:text-[#F8FAFC]">
                    Mini-quiz rápido sobre EPIs (3 perguntas)
                  </p>
                  <p className="text-xs text-[#4B5563] dark:text-[#94A3B8] mt-0.5">
                    {hasConfirmedAnyTipToday
                      ? storedQuizResult
                        ? `Último resultado hoje: ${storedQuizResult.correctCount}/${storedQuizResult.total} acertos (${storedQuizResult.percentage}%).`
                        : 'Leitura concluída! Teste agora seus conhecimentos sobre uso correto dos EPIs.'
                      : 'Confirme a leitura de pelo menos uma dica diária acima para liberar o mini-quiz.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={!hasConfirmedAnyTipToday}
                onClick={handleStartQuiz}
                data-testid="safety-quiz-start-button"
                className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all shrink-0 whitespace-nowrap ${
                  hasConfirmedAnyTipToday
                    ? 'bg-[#C93B1E] hover:bg-[#B23319] text-white active:scale-[0.98] cursor-pointer'
                    : 'bg-[#E5E7EB] dark:bg-[#1E293B] text-[#6B7280] dark:text-[#64748B] cursor-not-allowed'
                }`}
              >
                <ClipboardCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>
                  {storedQuizResult ? 'Refazer mini-quiz' : 'Fazer mini-quiz de EPIs'}
                </span>
              </button>
            </div>
          </motion.div>
        )}

        {viewMode === 'quiz' && currentQuestion && (
          <motion.div
            key={`quiz-step-${currentQuestion.id}`}
            initial={PANEL_REVEAL_VARIANTS.initial}
            animate={PANEL_REVEAL_VARIANTS.animate}
            exit={PANEL_REVEAL_VARIANTS.exit}
            transition={PANEL_REVEAL_TRANSITION}
            data-testid="safety-quiz-container"
            className="mt-4 rounded-xl border border-[#E5E7EB] dark:border-[#1E293B] bg-[#F9FAFB] dark:bg-[#0F172A] p-4 sm:p-5 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span
                data-testid="safety-quiz-progress"
                className="text-xs font-bold text-[#C93B1E] dark:text-[#F06449] tabular-nums"
              >
                Pergunta {quizStep + 1} de {quizQuestions.length}
              </span>
              <div className="flex items-center gap-1.5" aria-hidden="true">
                {quizQuestions.map((q, idx) => (
                  <span
                    key={q.id}
                    className={`h-1.5 w-7 rounded-full transition-colors ${
                      idx < quizStep
                        ? 'bg-[#047857] dark:bg-[#34D399]'
                        : idx === quizStep
                          ? 'bg-[#C93B1E] dark:bg-[#F06449]'
                          : 'bg-[#D1D5DB] dark:bg-[#334155]'
                    }`}
                  />
                ))}
              </div>
            </div>

            <h3
              data-testid="safety-quiz-question"
              className="font-display text-base sm:text-lg font-bold text-[#111827] dark:text-[#F8FAFC]"
            >
              {currentQuestion.question}
            </h3>

            <div className="space-y-2.5" role="group" aria-label="Alternativas da pergunta">
              {currentQuestion.options.map((option, optIdx) => {
                const isSelected = currentSelectedIndex === optIdx;
                const isCorrectOption = optIdx === currentQuestion.correctIndex;

                let stateClass =
                  'border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] hover:border-[#C93B1E] dark:hover:border-[#F06449] cursor-pointer';

                if (hasAnsweredCurrent) {
                  if (isCorrectOption) {
                    stateClass =
                      'border-[#059669] bg-[#ECFDF5] dark:bg-[#064E3B]/40 text-[#065F46] dark:text-[#34D399] cursor-default';
                  } else if (isSelected) {
                    stateClass =
                      'border-[#DC2626] bg-[#FEF2F2] dark:bg-[#7F1D1D]/40 text-[#991B1B] dark:text-[#FCA5A5] cursor-default';
                  } else {
                    stateClass =
                      'border-[#E5E7EB] dark:border-[#1E293B] bg-white/60 dark:bg-[#111827]/50 text-[#6B7280] dark:text-[#64748B] cursor-default';
                  }
                }

                return (
                  <button
                    key={optIdx}
                    type="button"
                    disabled={hasAnsweredCurrent}
                    onClick={() => handleSelectQuizOption(optIdx)}
                    data-testid={`safety-quiz-option-${optIdx}`}
                    className={`w-full min-h-[44px] px-4 py-3 rounded-xl border text-left text-xs sm:text-sm font-medium flex items-start justify-between gap-3 transition-colors ${stateClass}`}
                  >
                    <span className="leading-relaxed">{option}</span>
                    {hasAnsweredCurrent && isCorrectOption && (
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                    )}
                    {hasAnsweredCurrent && isSelected && !isCorrectOption && (
                      <XCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>

            {hasAnsweredCurrent && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                className="pt-2 space-y-3"
              >
                <div
                  role="status"
                  data-testid="safety-quiz-explanation"
                  className={`rounded-xl border p-3.5 text-xs sm:text-sm leading-relaxed ${
                    currentSelectedIndex === currentQuestion.correctIndex
                      ? 'border-[#A7F3D0] dark:border-[#065F46] bg-[#ECFDF5] dark:bg-[#064E3B]/25 text-[#065F46] dark:text-[#A7F3D0]'
                      : 'border-[#FDE68A] dark:border-[#92400E] bg-[#FFFBEB] dark:bg-[#78350F]/25 text-[#78350F] dark:text-[#FDE68A]'
                  }`}
                >
                  <strong className="font-semibold">
                    {currentSelectedIndex === currentQuestion.correctIndex
                      ? 'Resposta correta! '
                      : 'Atenção à norma: '}
                  </strong>
                  {currentQuestion.explanation}
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAdvanceQuiz}
                    data-testid="safety-quiz-next-button"
                    className="min-h-[44px] px-5 py-2 rounded-xl bg-[#111827] hover:bg-[#1F2937] dark:bg-[#F8FAFC] dark:hover:bg-[#E2E8F0] text-white dark:text-[#0F172A] text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>
                      {quizStep + 1 < quizQuestions.length
                        ? 'Próxima pergunta'
                        : 'Ver resultado'}
                    </span>
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {viewMode === 'result' && (
          <motion.div
            key="quiz-result-summary"
            initial={PANEL_REVEAL_VARIANTS.initial}
            animate={PANEL_REVEAL_VARIANTS.animate}
            exit={PANEL_REVEAL_VARIANTS.exit}
            transition={PANEL_REVEAL_TRANSITION}
            data-testid="safety-quiz-result"
            className="mt-4 rounded-xl border border-[#E5E7EB] dark:border-[#1E293B] bg-[#F9FAFB] dark:bg-[#0F172A] p-5 text-center space-y-4"
          >
            <div
              className={`mx-auto w-14 h-14 rounded-2xl border flex items-center justify-center ${
                quizSummary.passed
                  ? 'bg-[#ECFDF5] dark:bg-[#064E3B]/30 border-[#A7F3D0] dark:border-[#065F46] text-[#047857] dark:text-[#34D399]'
                  : 'bg-[#FFFBEB] dark:bg-[#78350F]/30 border-[#FDE68A] dark:border-[#92400E] text-[#B45309] dark:text-[#FBBF24]'
              }`}
            >
              <Award className="w-7 h-7" aria-hidden="true" />
            </div>

            <div>
              <p
                data-testid="safety-quiz-score"
                className="font-display text-xl sm:text-2xl font-bold text-[#111827] dark:text-[#F8FAFC] tabular-nums"
              >
                {quizSummary.correctCount} de {quizSummary.total} acertos ({quizSummary.percentage}%)
              </p>
              <p
                data-testid="safety-quiz-points-earned"
                className="text-xs sm:text-sm font-semibold text-[#C93B1E] dark:text-[#F06449] mt-1 tabular-nums"
              >
                +{calculateQuizPoints(quizSummary)} pts somados ao ranking de segurança
              </p>
              <p className="text-sm text-[#4B5563] dark:text-[#94A3B8] mt-1 max-w-md mx-auto">
                {quizSummary.passed
                  ? 'Excelente preparo! Você aplicou corretamente os cuidados com EPIs recomendados para a construção civil.'
                  : 'Bom começo! Revise os pontos de atenção das dicas diárias e refaça o mini-quiz para fixar cada EPI.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              {quizSummary.items.map((item, idx) => (
                <span
                  key={item.questionId}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold tabular-nums ${
                    item.isCorrect
                      ? 'border-[#A7F3D0] dark:border-[#065F46] bg-[#ECFDF5] dark:bg-[#064E3B]/25 text-[#047857] dark:text-[#34D399]'
                      : 'border-[#FECACA] dark:border-[#991B1B] bg-[#FEF2F2] dark:bg-[#7F1D1D]/25 text-[#B91C1C] dark:text-[#FCA5A5]'
                  }`}
                >
                  {item.isCorrect ? (
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  <span>Pergunta {idx + 1}</span>
                </span>
              ))}
            </div>

            <div className="pt-1 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleStartQuiz}
                data-testid="safety-quiz-retry-button"
                className="min-h-[44px] px-4 py-2 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#111827] hover:bg-[#F3F4F6] dark:hover:bg-[#1E293B] text-xs sm:text-sm font-semibold text-[#111827] dark:text-[#F8FAFC] inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                <span>Refazer mini-quiz</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('reading')}
                data-testid="safety-quiz-back-button"
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[#C93B1E] hover:bg-[#B23319] text-white text-xs sm:text-sm font-semibold cursor-pointer"
              >
                Voltar às dicas
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
