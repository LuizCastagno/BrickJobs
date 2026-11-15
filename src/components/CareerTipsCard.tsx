import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  BookOpenCheck,
  Briefcase,
  FileText,
  RefreshCw,
} from 'lucide-react';
import type { WorkerProfile } from '../types/brickjobs';
import {
  filterCareerTipsByFocus,
  getIsoWeekInfo,
  loadCachedWeeklyCareerTips,
  saveCachedWeeklyCareerTips,
  type CareerTipFocus,
  type WeeklyCareerTipsBundle,
} from '../utils/careerTips';

interface CareerTipsCardProps {
  workerProfile: WorkerProfile;
}

export const CareerTipsCard: React.FC<CareerTipsCardProps> = ({
  workerProfile,
}) => {
  const roleLabel = workerProfile.funcaoPrincipal?.trim() || 'Pedreiro';
  const weekInfo = useMemo(() => getIsoWeekInfo(), []);

  const [focus, setFocus] = useState<CareerTipFocus>('todos');
  const [bundle, setBundle] = useState<WeeklyCareerTipsBundle | null>(() =>
    loadCachedWeeklyCareerTips(weekInfo.weekKey, roleLabel)
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const autoFetchedKeyRef = useRef<string>('');

  const fetchWeeklyTips = useCallback(
    async (selectedFocus: CareerTipFocus = 'todos') => {
      setIsLoading(true);
      setErrorMsg('');

      try {
        const res = await fetch('/api/career-tips', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: roleLabel,
            focus: selectedFocus,
            experienceCount: workerProfile.experiencias.length,
            hasPdfResume: Boolean(workerProfile.pdfCurriculo),
          }),
        });

        const payload = (await res.json().catch(() => ({}))) as Partial<
          WeeklyCareerTipsBundle & { error?: string }
        >;

        if (!res.ok) {
          throw new Error(
            payload.error ||
              'Não foi possível carregar as dicas de carreira nesta tentativa.'
          );
        }

        if (!payload.tips || !Array.isArray(payload.tips) || payload.tips.length === 0) {
          throw new Error('Nenhuma sugestão foi retornada pelo servidor.');
        }

        const nextBundle: WeeklyCareerTipsBundle = {
          weekKey: payload.weekKey || weekInfo.weekKey,
          weekLabel: payload.weekLabel || weekInfo.weekLabel,
          role: payload.role || roleLabel,
          headline:
            payload.headline ||
            `Dicas da semana para ${roleLabel}`,
          summary:
            payload.summary ||
            'Orientações práticas para currículo e entrevista em obras.',
          tips: payload.tips,
          generatedAt: payload.generatedAt || new Date().toISOString(),
        };

        setBundle(nextBundle);
        if (selectedFocus === 'todos') {
          saveCachedWeeklyCareerTips(nextBundle);
        }
      } catch (err) {
        const msg =
          err instanceof Error && err.message
            ? err.message
            : 'Falha ao gerar dicas semanais de carreira.';
        setErrorMsg(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [
      roleLabel,
      weekInfo.weekKey,
      weekInfo.weekLabel,
      workerProfile.experiencias.length,
      workerProfile.pdfCurriculo,
    ]
  );

  useEffect(() => {
    const cached = loadCachedWeeklyCareerTips(weekInfo.weekKey, roleLabel);
    if (cached) {
      setBundle(cached);
      return;
    }

    const requestSignature = `${weekInfo.weekKey}:${roleLabel}`;
    if (autoFetchedKeyRef.current === requestSignature) return;
    autoFetchedKeyRef.current = requestSignature;
    void fetchWeeklyTips('todos');
  }, [fetchWeeklyTips, roleLabel, weekInfo.weekKey]);

  const visibleTips = useMemo(() => {
    if (!bundle) return [];
    const filtered = filterCareerTipsByFocus(bundle.tips, focus);
    return filtered.length > 0 ? filtered : bundle.tips;
  }, [bundle, focus]);

  return (
    <section
      aria-labelledby="career-tips-heading"
      data-testid="career-tips-card"
      className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl p-5 sm:p-6"
    >
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[#F3F4F6] dark:border-[#1E293B]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#C93B1E] dark:text-[#F06449]">
            <BookOpenCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Dicas de Carreira · {bundle?.weekLabel ?? weekInfo.weekLabel}</span>
          </div>
          <h2
            id="career-tips-heading"
            className="font-display text-lg sm:text-xl font-bold text-[#111827] dark:text-[#F8FAFC] mt-1"
          >
            {bundle?.headline ?? `Como se destacar como ${roleLabel}`}
          </h2>
          <p className="text-sm text-[#4B5563] dark:text-[#94A3B8] mt-1">
            {bundle?.summary ??
              `Sugestões semanais personalizadas para melhorar seu currículo e entrevistas na construção civil (${roleLabel}).`}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void fetchWeeklyTips(focus)}
          disabled={isLoading}
          data-testid="refresh-career-tips-button"
          className="min-h-[44px] px-4 py-2 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#1E293B] hover:bg-[#F3F4F6] dark:hover:bg-[#334155] disabled:opacity-60 text-xs sm:text-sm font-semibold text-[#111827] dark:text-[#F8FAFC] inline-flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
        >
          <RefreshCw
            className={`w-4 h-4 text-[#C93B1E] dark:text-[#F06449] ${
              isLoading ? 'animate-spin' : ''
            }`}
            aria-hidden="true"
          />
          <span>{isLoading ? 'Gerando dicas...' : 'Atualizar dicas'}</span>
        </button>
      </div>

      {/* Focus Filter Controls */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Filtrar dicas por tema"
          className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#F3F4F6] dark:bg-[#1E293B]"
        >
          {(
            [
              { id: 'todos', label: 'Todas' },
              { id: 'curriculo', label: 'Currículo' },
              { id: 'entrevista', label: 'Entrevista' },
            ] as const
          ).map((item) => {
            const active = focus === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                onClick={() => setFocus(item.id)}
                data-testid={`career-tips-focus-${item.id}`}
                className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
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

        <span className="text-xs text-[#4B5563] dark:text-[#94A3B8]">
          Perfil: <strong className="text-[#111827] dark:text-[#F8FAFC]">{roleLabel}</strong>
        </span>
      </div>

      {/* States: Loading / Error / Tips Grid */}
      {isLoading && !bundle && (
        <div
          role="status"
          data-testid="career-tips-loading"
          className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3.5"
        >
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="rounded-xl border border-[#E5E7EB] dark:border-[#1E293B] bg-[#F9FAFB] dark:bg-[#0F172A] p-4 animate-pulse space-y-2"
            >
              <div className="h-3 w-20 rounded bg-[#E5E7EB] dark:bg-[#334155]" />
              <div className="h-4 w-3/4 rounded bg-[#E5E7EB] dark:bg-[#334155]" />
              <div className="h-3 w-full rounded bg-[#E5E7EB] dark:bg-[#334155]" />
            </div>
          ))}
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          data-testid="career-tips-error"
          className="mt-4 p-4 rounded-xl bg-[#FEF2F2] dark:bg-[#7F1D1D]/30 border border-[#FECACA] dark:border-[#991B1B] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <AlertCircle
              className="w-4 h-4 text-[#B91C1C] dark:text-[#FCA5A5] shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <p className="text-xs sm:text-sm font-medium text-[#B91C1C] dark:text-[#FCA5A5] min-w-0 [overflow-wrap:anywhere]">
              {errorMsg}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void fetchWeeklyTips(focus)}
            className="min-h-[44px] sm:min-h-[40px] px-3.5 py-2 rounded-lg bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs font-semibold cursor-pointer shrink-0 whitespace-nowrap"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {visibleTips.length > 0 && (
        <div
          data-testid="career-tips-list"
          className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3.5"
        >
          {visibleTips.map((tip, index) => {
            const isInterview = tip.category === 'Entrevista';
            return (
              <article
                key={`${tip.category}-${tip.title}-${index}`}
                className="rounded-xl border border-[#E5E7EB] dark:border-[#1E293B] bg-[#F9FAFB] dark:bg-[#0F172A] p-4 flex flex-col justify-between gap-2.5"
              >
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    {isInterview ? (
                      <Briefcase
                        className="w-3.5 h-3.5 text-[#047857] dark:text-[#34D399] shrink-0"
                        aria-hidden="true"
                      />
                    ) : (
                      <FileText
                        className="w-3.5 h-3.5 text-[#C93B1E] dark:text-[#F06449] shrink-0"
                        aria-hidden="true"
                      />
                    )}
                    <span
                      className={
                        isInterview
                          ? 'text-[#047857] dark:text-[#34D399]'
                          : 'text-[#C93B1E] dark:text-[#F06449]'
                      }
                    >
                      {tip.category}
                    </span>
                  </div>

                  <h3 className="font-display text-sm sm:text-base font-bold text-[#111827] dark:text-[#F8FAFC] mt-1">
                    {tip.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#374151] dark:text-[#CBD5E1] mt-1 leading-relaxed">
                    {tip.action}
                  </p>
                </div>

                {tip.impact && (
                  <p className="text-xs text-[#4B5563] dark:text-[#94A3B8] pt-2 border-t border-[#E5E7EB] dark:border-[#1E293B]">
                    <span className="font-semibold text-[#111827] dark:text-[#F8FAFC]">
                      Por que importa:
                    </span>{' '}
                    {tip.impact}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
