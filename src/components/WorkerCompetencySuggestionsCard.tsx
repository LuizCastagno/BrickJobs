/**
 * @file src/components/WorkerCompetencySuggestionsCard.tsx
 * @description Painel no cadastro do trabalhador que analisa automaticamente as experiências
 *   cadastradas usando a Gemini API (/api/worker-competencies) e sugere 3 competências técnicas
 *   aplicáveis diretamente ao perfil profissional.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Plus,
  RefreshCw,
  Sparkles,
  X,
} from 'lucide-react';
import type { ResumeMode, WorkExperience } from '../types/brickjobs';
import {
  buildCompetencyAnalysisRequestPayload,
  hasAnalyzableExperiences,
  hasCompleteExperienceForAutoSuggest,
  isCompetencyApplied,
  loadCachedWorkerCompetencies,
  mergeAppliedCompetencies,
  normalizeAppliedCompetencies,
  REQUIRED_COMPETENCY_COUNT,
  saveCachedWorkerCompetencies,
  toggleAppliedCompetency,
  type WorkerCompetencyAnalysisResult,
} from '../utils/workerCompetencySuggestions';

interface WorkerCompetencySuggestionsCardProps {
  funcaoPrincipal: string;
  resumoProfissional: string;
  experiencias: WorkExperience[];
  tipoHistorico: ResumeMode;
  appliedCompetencies: string[];
  onChangeAppliedCompetencies: (next: string[]) => void;
}

export const WorkerCompetencySuggestionsCard: React.FC<
  WorkerCompetencySuggestionsCardProps
> = ({
  funcaoPrincipal,
  resumoProfissional,
  experiencias,
  tipoHistorico,
  appliedCompetencies,
  onChangeAppliedCompetencies,
}) => {
  const normalizedApplied = useMemo(
    () => normalizeAppliedCompetencies(appliedCompetencies),
    [appliedCompetencies]
  );

  const requestPayload = useMemo(
    () =>
      buildCompetencyAnalysisRequestPayload({
        funcaoPrincipal,
        resumoProfissional,
        experiencias,
      }),
    [experiencias, funcaoPrincipal, resumoProfissional]
  );

  const canAnalyze = useMemo(
    () => hasAnalyzableExperiences(experiencias),
    [experiencias]
  );
  const canAutoAnalyze = useMemo(
    () =>
      tipoHistorico === 'experiencias' &&
      hasCompleteExperienceForAutoSuggest(experiencias),
    [experiencias, tipoHistorico]
  );

  const [analysis, setAnalysis] =
    useState<WorkerCompetencyAnalysisResult | null>(() =>
      canAnalyze
        ? loadCachedWorkerCompetencies(requestPayload.fingerprint)
        : null
    );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const lastTriggeredFingerprintRef = useRef<string>('');
  const activeControllerRef = useRef<AbortController | null>(null);

  const runAnalysis = useCallback(
    async (forceRefresh = false) => {
      if (!canAnalyze) {
        setErrorMessage(
          'Preencha ao menos uma experiência com função, obra ou atividades para analisar competências.'
        );
        return;
      }

      if (!forceRefresh) {
        const cached = loadCachedWorkerCompetencies(requestPayload.fingerprint);
        if (cached) {
          setAnalysis(cached);
          setErrorMessage('');
          lastTriggeredFingerprintRef.current = requestPayload.fingerprint;
          return;
        }
      }

      if (activeControllerRef.current) {
        activeControllerRef.current.abort();
      }
      const controller = new AbortController();
      activeControllerRef.current = controller;

      lastTriggeredFingerprintRef.current = requestPayload.fingerprint;
      setIsLoading(true);
      setErrorMessage('');

      try {
        const response = await fetch('/api/worker-competencies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            role: requestPayload.role,
            summary: requestPayload.summary,
            experiences: requestPayload.experiences,
            forceRefresh,
          }),
        });

        const data = (await response.json().catch(() => ({}))) as Partial<
          WorkerCompetencyAnalysisResult & { error?: string }
        >;

        if (!response.ok) {
          throw new Error(
            data.error ||
              'Não foi possível gerar sugestões de competências com a Gemini API.'
          );
        }

        if (
          !Array.isArray(data.competencies) ||
          data.competencies.length !== REQUIRED_COMPETENCY_COUNT
        ) {
          throw new Error(
            'A análise não retornou exatamente 3 competências válidas.'
          );
        }

        const result: WorkerCompetencyAnalysisResult = {
          summary:
            typeof data.summary === 'string' && data.summary.trim()
              ? data.summary.trim()
              : 'Competências sugeridas com base nas experiências cadastradas.',
          competencies: data.competencies,
          generatedAt:
            typeof data.generatedAt === 'string'
              ? data.generatedAt
              : new Date().toISOString(),
          fingerprint:
            typeof data.fingerprint === 'string' && data.fingerprint
              ? data.fingerprint
              : requestPayload.fingerprint,
        };

        setAnalysis(result);
        saveCachedWorkerCompetencies(result);
      } catch (err) {
        if (controller.signal.aborted) return;
        const message =
          err instanceof Error && err.message
            ? err.message
            : 'Falha ao consultar a Gemini API para analisar competências.';
        setErrorMessage(message);
      } finally {
        if (activeControllerRef.current === controller) {
          activeControllerRef.current = null;
          setIsLoading(false);
        }
      }
    },
    [canAnalyze, requestPayload]
  );

  // Cleanup any in-flight request on unmount
  useEffect(() => {
    return () => {
      activeControllerRef.current?.abort();
    };
  }, []);

  // Automatically trigger Gemini competency analysis once valid experiences are registered (debounced)
  useEffect(() => {
    if (!canAutoAnalyze) return;
    const fp = requestPayload.fingerprint;
    if (lastTriggeredFingerprintRef.current === fp) return;

    const cached = loadCachedWorkerCompetencies(fp);
    if (cached) {
      lastTriggeredFingerprintRef.current = fp;
      setAnalysis(cached);
      setErrorMessage('');
      return;
    }

    const timer = setTimeout(() => {
      void runAnalysis(false);
    }, 900);

    return () => clearTimeout(timer);
  }, [canAutoAnalyze, requestPayload.fingerprint, runAnalysis]);

  const allSuggestionsApplied = Boolean(
    analysis &&
      analysis.competencies.every((item) =>
        isCompetencyApplied(normalizedApplied, item.name)
      )
  );

  const handleApplyAll = () => {
    if (!analysis) return;
    onChangeAppliedCompetencies(
      mergeAppliedCompetencies(
        normalizedApplied,
        analysis.competencies.map((item) => item.name)
      )
    );
  };

  return (
    <div
      data-testid="worker-competency-suggestions-card"
      className="mt-5 pt-5 border-t border-[#E5E7EB] dark:border-[#1E293B]"
    >
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Sparkles
              className="w-4 h-4 text-[#C93B1E] dark:text-[#F06449] shrink-0"
              aria-hidden="true"
            />
            <h3 className="font-display text-base font-bold text-[#111827] dark:text-[#F8FAFC]">
              Sugestão automática de 3 competências (Gemini AI)
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-[#4B5563] dark:text-[#94A3B8] mt-1">
            Analisa as funções e atividades das suas experiências cadastradas para
            recomendar 3 competências técnicas que valorizam seu perfil.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void runAnalysis(Boolean(analysis))}
          disabled={isLoading || !canAnalyze}
          data-testid="suggest-competencies-button"
          className="min-h-[44px] px-4 py-2 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#1E293B] hover:bg-[#F3F4F6] dark:hover:bg-[#334155] disabled:opacity-50 text-xs sm:text-sm font-semibold text-[#111827] dark:text-[#F8FAFC] inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:cursor-not-allowed shrink-0 whitespace-nowrap"
        >
          <RefreshCw
            className={`w-4 h-4 text-[#C93B1E] dark:text-[#F06449] ${
              isLoading ? 'animate-spin' : ''
            }`}
            aria-hidden="true"
          />
          <span>
            {isLoading
              ? 'Analisando perfil...'
              : analysis
                ? 'Reanalisar experiências'
                : 'Sugerir 3 competências'}
          </span>
        </button>
      </div>

      {/* Empty / Guidance State when no experiences entered yet */}
      {!canAnalyze && !isLoading && (
        <div
          data-testid="worker-competency-empty-guidance"
          className="mt-4 rounded-xl border border-dashed border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#0F172A] p-4 text-xs sm:text-sm text-[#4B5563] dark:text-[#94A3B8]"
        >
          {tipoHistorico === 'pdf'
            ? 'Você escolheu anexar PDF. Caso também queira receber sugestões automáticas de competências por IA, mude acima para "Preencher experiências" e informe ao menos uma obra.'
            : 'Preencha ao menos uma experiência acima (empresa/local, função exercida e atividades) para receber automaticamente 3 competências sugeridas pela Gemini API.'}
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div
          role="status"
          data-testid="worker-competency-loading"
          className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3"
        >
          {[0, 1, 2].map((idx) => (
            <div
              key={idx}
              className="rounded-xl border border-[#E5E7EB] dark:border-[#1E293B] bg-[#F9FAFB] dark:bg-[#0F172A] p-4 animate-pulse space-y-2"
            >
              <div className="h-3 w-20 rounded bg-[#E5E7EB] dark:bg-[#334155]" />
              <div className="h-4 w-4/5 rounded bg-[#E5E7EB] dark:bg-[#334155]" />
              <div className="h-3 w-full rounded bg-[#E5E7EB] dark:bg-[#334155]" />
            </div>
          ))}
        </div>
      )}

      {/* API Error Alert (never silently masked) */}
      {errorMessage && !isLoading && (
        <div
          role="alert"
          data-testid="worker-competency-error"
          className="mt-4 p-4 rounded-xl bg-[#FEF2F2] dark:bg-[#7F1D1D]/30 border border-[#FECACA] dark:border-[#991B1B] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <AlertCircle
              className="w-4 h-4 text-[#B91C1C] dark:text-[#FCA5A5] shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <p className="text-xs sm:text-sm font-medium text-[#B91C1C] dark:text-[#FCA5A5] min-w-0 [overflow-wrap:anywhere]">
              {errorMessage}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void runAnalysis(true)}
            data-testid="retry-competencies-button"
            className="min-h-[44px] sm:min-h-[40px] px-3.5 py-2 rounded-lg bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs font-semibold cursor-pointer shrink-0 whitespace-nowrap"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* 3 Suggested Competencies */}
      {analysis && !isLoading && (
        <div
          data-testid="worker-competency-results"
          className="mt-4 space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl bg-[#F9FAFB] dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#1E293B] px-4 py-3">
            <p className="text-xs sm:text-sm text-[#374151] dark:text-[#CBD5E1] min-w-0">
              <span className="font-semibold text-[#111827] dark:text-[#F8FAFC]">
                Diagnóstico do perfil:
              </span>{' '}
              {analysis.summary}
            </p>

            <button
              type="button"
              onClick={handleApplyAll}
              disabled={allSuggestionsApplied}
              data-testid="apply-all-competencies-button"
              className="min-h-[40px] px-3.5 py-1.5 rounded-lg bg-[#C93B1E] hover:bg-[#B03116] disabled:bg-[#047857] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:cursor-default shrink-0 whitespace-nowrap"
            >
              {allSuggestionsApplied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>3 competências aplicadas</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Aplicar todas (3)</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {analysis.competencies.map((item, idx) => {
              const applied = isCompetencyApplied(normalizedApplied, item.name);
              return (
                <article
                  key={`${item.name}-${idx}`}
                  data-testid={`suggested-competency-item-${idx + 1}`}
                  className={`rounded-xl border p-4 flex flex-col justify-between gap-3 transition-colors ${
                    applied
                      ? 'border-[#047857] dark:border-[#34D399] bg-[#ECFDF5]/60 dark:bg-[#064E3B]/20'
                      : 'border-[#E5E7EB] dark:border-[#1E293B] bg-[#F9FAFB] dark:bg-[#0F172A]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-mono font-bold text-[#C93B1E] dark:text-[#F06449] tabular-nums">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="text-[#4B5563] dark:text-[#94A3B8] font-medium truncate">
                        {item.category}
                      </span>
                    </div>

                    <h4 className="font-display text-sm sm:text-base font-bold text-[#111827] dark:text-[#F8FAFC] mt-1.5">
                      {item.name}
                    </h4>

                    <p className="text-xs text-[#4B5563] dark:text-[#94A3B8] mt-1 leading-relaxed">
                      {item.rationale}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onChangeAppliedCompetencies(
                        toggleAppliedCompetency(normalizedApplied, item.name)
                      )
                    }
                    data-testid={`toggle-competency-${idx + 1}`}
                    aria-pressed={applied}
                    className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      applied
                        ? 'bg-[#047857] text-white hover:bg-[#065F46]'
                        : 'border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] hover:bg-[#F3F4F6] dark:hover:bg-[#1E293B]'
                    }`}
                  >
                    {applied ? (
                      <>
                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Aplicada ao perfil</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Aplicar competência</span>
                      </>
                    )}
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected competencies saved onto profile */}
      {normalizedApplied.length > 0 && (
        <div
          data-testid="worker-applied-competencies-list"
          className="mt-4 pt-3 border-t border-[#F3F4F6] dark:border-[#1E293B]"
        >
          <p className="text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-2">
            Competências selecionadas para o seu perfil ({normalizedApplied.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {normalizedApplied.map((comp) => (
              <span
                key={comp}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#111827] dark:bg-[#F8FAFC] text-white dark:text-[#0F172A]"
              >
                <span>{comp}</span>
                <button
                  type="button"
                  onClick={() =>
                    onChangeAppliedCompetencies(
                      toggleAppliedCompetency(normalizedApplied, comp)
                    )
                  }
                  aria-label={`Remover competência ${comp}`}
                  className="p-0.5 rounded hover:bg-white/20 dark:hover:bg-black/10 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
