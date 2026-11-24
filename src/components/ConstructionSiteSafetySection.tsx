/**
 * @file src/components/ConstructionSiteSafetySection.tsx
 * @description Seção dedicada "Dicas de Segurança no Canteiro de Obras" na aba Segurança do
 *   Portal do Trabalhador, com guias práticos por NR, busca offline, favoritos e persistência local.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  HardHat,
  Search,
  ShieldCheck,
  Siren,
  WifiOff,
  X,
} from 'lucide-react';
import {
  filterSiteSafetyGuides,
  isSiteSafetyGuideRelevantToRole,
  loadOfflineSiteSafetySnapshot,
  loadSavedSiteSafetyGuideIds,
  saveOfflineSiteSafetySnapshot,
  SITE_SAFETY_CATEGORY_OPTIONS,
  SITE_SAFETY_GUIDES,
  toggleSavedSiteSafetyGuide,
  type SiteSafetyCategory,
} from '../utils/siteSafetyGuides';

interface ConstructionSiteSafetySectionProps {
  workerRole?: string;
  className?: string;
}

export const ConstructionSiteSafetySection: React.FC<
  ConstructionSiteSafetySectionProps
> = ({ workerRole = '', className = '' }) => {
  const [snapshot, setSnapshot] = useState(() =>
    loadOfflineSiteSafetySnapshot()
  );
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [category, setCategory] = useState<SiteSafetyCategory>('todas');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlySaved, setOnlySaved] = useState<boolean>(false);
  const [savedIds, setSavedIds] = useState<string[]>(() =>
    loadSavedSiteSafetyGuideIds()
  );
  const [expandedId, setExpandedId] = useState<string | null>(
    () => SITE_SAFETY_GUIDES[0]?.id ?? null
  );

  useEffect(() => {
    const synced = saveOfflineSiteSafetySnapshot(SITE_SAFETY_GUIDES);
    setSnapshot(synced);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const filteredGuides = useMemo(
    () =>
      filterSiteSafetyGuides(snapshot.guides, {
        category,
        query: searchQuery,
        onlySaved,
        savedIds,
      }),
    [snapshot.guides, category, searchQuery, onlySaved, savedIds]
  );

  const handleToggleSaved = (guideId: string) => {
    setSavedIds((prev) => toggleSavedSiteSafetyGuide(prev, guideId));
  };

  return (
    <section
      aria-labelledby="construction-site-safety-heading"
      data-testid="construction-site-safety-section"
      className={`rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] shadow-sm overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="p-5 sm:p-6 border-b border-[#F3F4F6] dark:border-[#1E293B]">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5 text-[#C93B1E] dark:text-[#F06449]">
                <HardHat className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Guia Prático de Campo · Acesso Offline</span>
              </span>

              <span
                data-testid="site-safety-offline-status"
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border text-[11px] font-semibold ${
                  isOnline
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300'
                    : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300'
                }`}
              >
                {isOnline ? (
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                ) : (
                  <WifiOff className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                )}
                <span>
                  {isOnline
                    ? 'Disponível offline · Salvo neste aparelho'
                    : 'Sem internet · Conteúdo carregado offline'}
                </span>
              </span>
            </div>

            <h2
              id="construction-site-safety-heading"
              className="font-display text-xl sm:text-2xl font-bold text-[#111827] dark:text-[#F8FAFC] mt-2"
            >
              Dicas de Segurança no Canteiro de Obras
            </h2>
            <p className="text-sm text-[#4B5563] dark:text-[#94A3B8] mt-1 max-w-3xl leading-relaxed">
              Procedimentos rápidos de campo para altura, andaimes, valas, energia elétrica, máquinas, içamento e calor em Rondonópolis-MT — sempre acessíveis mesmo sem sinal na obra.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start">
            <button
              type="button"
              onClick={() => setOnlySaved((prev) => !prev)}
              aria-pressed={onlySaved}
              data-testid="site-safety-saved-filter"
              className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                onlySaved
                  ? 'bg-[#C93B1E] border-[#C93B1E] text-white'
                  : 'bg-[#F9FAFB] dark:bg-[#1E293B] border-[#D1D5DB] dark:border-[#334155] text-[#111827] dark:text-[#F8FAFC] hover:bg-[#F3F4F6] dark:hover:bg-[#334155]'
              }`}
            >
              <Bookmark className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Salvas ({savedIds.length})</span>
            </button>
          </div>
        </div>

        {/* Search & Category Controls */}
        <div className="mt-5 flex flex-col gap-3">
          <div className="relative">
            <label htmlFor="site-safety-search" className="sr-only">
              Buscar dicas de segurança no canteiro
            </label>
            <Search
              className="w-4 h-4 text-[#6B7280] dark:text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="site-safety-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por norma ou risco (ex: NR-35, vala, choque, pré-moldado, poeira)"
              data-testid="site-safety-search-input"
              className="w-full min-h-[44px] pl-10 pr-10 py-2 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#0F172A] text-sm text-[#111827] dark:text-[#F8FAFC] placeholder:text-[#6B7280] dark:placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#C93B1E]/30 focus:border-[#C93B1E]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Limpar busca de segurança"
                className="min-w-[36px] min-h-[36px] absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg flex items-center justify-center text-[#6B7280] hover:text-[#111827] dark:text-[#94A3B8] dark:hover:text-[#F8FAFC] cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>

          <div
            role="group"
            aria-label="Filtrar dicas de segurança no canteiro"
            className="flex flex-wrap items-center gap-1.5"
          >
            {SITE_SAFETY_CATEGORY_OPTIONS.map((option) => {
              const active = category === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCategory(option.id)}
                  data-testid={`site-safety-cat-${option.id}`}
                  className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#111827] dark:bg-[#F8FAFC] border-[#111827] dark:border-[#F8FAFC] text-white dark:text-[#0F172A]'
                      : 'bg-[#F9FAFB] dark:bg-[#1E293B] border-[#E5E7EB] dark:border-[#334155] text-[#4B5563] dark:text-[#CBD5E1] hover:bg-[#F3F4F6] dark:hover:bg-[#334155]'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Guides List */}
      <div className="p-5 sm:p-6 space-y-4">
        {filteredGuides.length === 0 ? (
          <div
            data-testid="site-safety-empty"
            className="rounded-xl border border-dashed border-[#D1D5DB] dark:border-[#334155] p-6 text-center"
          >
            <p className="text-sm font-semibold text-[#111827] dark:text-[#F8FAFC]">
              Nenhuma dica encontrada para esse filtro.
            </p>
            <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-1">
              Limpe a busca ou troque de categoria para visualizar todos os guias salvos offline.
            </p>
            <button
              type="button"
              onClick={() => {
                setCategory('todas');
                setSearchQuery('');
                setOnlySaved(false);
              }}
              className="mt-4 min-h-[40px] px-4 py-2 rounded-xl bg-[#C93B1E] hover:bg-[#B23117] text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Mostrar todas as dicas
            </button>
          </div>
        ) : (
          filteredGuides.map((guide) => {
            const isExpanded = expandedId === guide.id;
            const isSaved = savedIds.includes(guide.id);
            const isRoleRelevant = isSiteSafetyGuideRelevantToRole(
              guide,
              workerRole
            );

            return (
              <article
                key={guide.id}
                data-testid={`site-safety-card-${guide.id}`}
                className="rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-[#F9FAFB]/60 dark:bg-[#0F172A]/50 p-4 sm:p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] text-[11px] font-bold text-[#111827] dark:text-[#F8FAFC]">
                        {guide.categoryLabel}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[#C93B1E]/10 dark:bg-[#C93B1E]/20 text-[11px] font-mono font-semibold text-[#C93B1E] dark:text-[#F06449]">
                        {guide.nrReference}
                      </span>
                      {isRoleRelevant && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                          Indicado para sua função
                        </span>
                      )}
                    </div>

                    <h3 className="font-display text-base sm:text-lg font-bold text-[#111827] dark:text-[#F8FAFC]">
                      {guide.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#4B5563] dark:text-[#CBD5E1] leading-relaxed">
                      {guide.summary}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-start">
                    <button
                      type="button"
                      onClick={() => handleToggleSaved(guide.id)}
                      aria-pressed={isSaved}
                      aria-label={
                        isSaved
                          ? `Remover "${guide.title}" das dicas salvas`
                          : `Salvar "${guide.title}" para consulta offline`
                      }
                      data-testid={`site-safety-bookmark-${guide.id}`}
                      className={`min-h-[40px] px-3 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isSaved
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300'
                          : 'bg-white dark:bg-[#1E293B] border-[#D1D5DB] dark:border-[#334155] text-[#374151] dark:text-[#CBD5E1] hover:bg-[#F3F4F6] dark:hover:bg-[#334155]'
                      }`}
                    >
                      {isSaved ? (
                        <BookmarkCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                      ) : (
                        <Bookmark className="w-4 h-4 shrink-0" aria-hidden="true" />
                      )}
                      <span>{isSaved ? 'Salva' : 'Salvar'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId((prev) =>
                          prev === guide.id ? null : guide.id
                        )
                      }
                      aria-expanded={isExpanded}
                      data-testid={`site-safety-toggle-${guide.id}`}
                      className="min-h-[40px] px-3 py-1.5 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#1E293B] hover:bg-[#F3F4F6] dark:hover:bg-[#334155] text-xs font-semibold text-[#111827] dark:text-[#F8FAFC] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>{isExpanded ? 'Recolher' : 'Ver checklist'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 shrink-0" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="w-4 h-4 shrink-0" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-[#E5E7EB] dark:border-[#334155] space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="rounded-xl bg-white dark:bg-[#111827] border border-emerald-200 dark:border-emerald-900/60 p-3.5">
                        <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                          <span>O que fazer no canteiro</span>
                        </p>
                        <ul className="mt-2 space-y-1.5 text-xs text-[#374151] dark:text-[#CBD5E1] leading-relaxed">
                          {guide.doList.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span
                                aria-hidden="true"
                                className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 shrink-0"
                              />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="rounded-xl bg-white dark:bg-[#111827] border border-amber-200 dark:border-amber-900/60 p-3.5">
                        <p className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                          <span>O que evitar</span>
                        </p>
                        <ul className="mt-2 space-y-1.5 text-xs text-[#374151] dark:text-[#CBD5E1] leading-relaxed">
                          {guide.avoidList.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span
                                aria-hidden="true"
                                className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400 shrink-0"
                              />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="rounded-xl bg-[#FEF2F2] dark:bg-[#7F1D1D]/25 border border-[#FECACA] dark:border-[#991B1B]/60 p-3.5 flex items-start gap-2.5 text-xs text-[#991B1B] dark:text-[#FCA5A5]">
                      <Siren className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                      <div>
                        <span className="font-bold">Ação rápida em risco: </span>
                        <span>{guide.emergencyAction}</span>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
};
