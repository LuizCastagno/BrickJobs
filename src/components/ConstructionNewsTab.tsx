import React, { useEffect, useMemo, useState } from 'react';
import {
  ExternalLink,
  Filter,
  Globe,
  HardHat,
  Newspaper,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  CONSTRUCTION_NEWS_CATEGORIES,
  filterConstructionNews,
  getCuratedConstructionNews,
  type ConstructionNewsCategory,
  type ConstructionNewsItem,
  type ConstructionNewsPayload,
} from '../utils/constructionNews';

interface ConstructionNewsTabProps {
  className?: string;
  onOpenJobFilter?: (keyword: string) => void;
}

export const ConstructionNewsTab: React.FC<ConstructionNewsTabProps> = ({
  className = '',
  onOpenJobFilter,
}) => {
  const [payload, setPayload] = useState<ConstructionNewsPayload>(() =>
    getCuratedConstructionNews()
  );
  const [activeCategory, setActiveCategory] =
    useState<ConstructionNewsCategory>('todas');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string>('');

  const fetchNews = async (forced = false) => {
    setIsLoading(true);
    setFeedback('');
    try {
      const res = await fetch('/api/construction-news');
      if (res.ok) {
        const data = (await res.json()) as ConstructionNewsPayload;
        setPayload(data);
        if (forced) {
          setFeedback('Manchetes e projetos de infraestrutura atualizados com sucesso.');
        }
      } else {
        setPayload(getCuratedConstructionNews());
        if (forced) {
          setFeedback('Feed local carregado com dados verificados de Mato Grosso.');
        }
      }
    } catch {
      setPayload(getCuratedConstructionNews());
      if (forced) {
        setFeedback('Feed local carregado com dados verificados de Mato Grosso.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchNews(false);
  }, []);

  const filteredItems = useMemo(
    () => filterConstructionNews(payload.items, activeCategory, searchQuery),
    [payload.items, activeCategory, searchQuery]
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#111827] via-[#1E293B] to-[#C93B1E]/80 text-white p-5 sm:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/10 text-white/90 text-xs font-semibold backdrop-blur-sm">
              <Newspaper className="w-3.5 h-3.5 text-[#F06449]" aria-hidden="true" />
              <span>Headlines de Mato Grosso</span>
              <span className="text-white/40">·</span>
              <span className="text-[#F06449]">Google Search Grounding</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-bold tracking-tight font-display">
              Notícias da Construção e Infraestrutura
            </h2>
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
              {payload.headlineBanner}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void fetchNews(true)}
            disabled={isLoading}
            className="self-start sm:self-center inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-xs sm:text-sm font-semibold text-white transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span>{isLoading ? 'Pesquisando na web...' : 'Atualizar Notícias'}</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 rounded-xl text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search
            className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por rodovia, ferrovia, bairro, empresa ou função..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-xs sm:text-sm text-[#0F172A] dark:text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#C93B1E]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {CONSTRUCTION_NEWS_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          const count =
            cat.id === 'todas'
              ? payload.items.length
              : payload.items.filter((i) => i.category === cat.id).length;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#C93B1E] text-white shadow-sm'
                  : 'bg-white dark:bg-[#1E293B] text-[#475569] dark:text-[#CBD5E1] border border-[#E2E8F0] dark:border-[#334155] hover:bg-[#F8FAFC]'
              }`}
            >
              {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {/* News Cards Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-[#CBD5E1] dark:border-[#334155] p-6 space-y-2">
          <Newspaper className="w-8 h-8 text-[#94A3B8] mx-auto" />
          <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
            Nenhuma notícia encontrada para esta busca
          </h3>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
            Tente outro termo de pesquisa ou selecione "Todas as Notícias".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => {
            const categoryBadgeStyle =
              item.category === 'ferrovias'
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                : item.category === 'rodovias'
                  ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                  : item.category === 'obras_urbanas'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : item.category === 'habitacao'
                      ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                      : 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200 dark:border-orange-800';

            return (
              <article
                key={item.id}
                className="flex flex-col justify-between rounded-2xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] p-5 shadow-sm hover:border-[#CBD5E1] dark:hover:border-[#475569] transition-all"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${categoryBadgeStyle}`}
                    >
                      {item.categoryLabel}
                    </span>
                    <span className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8]">
                      {item.relativeDate} · {item.location}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC] leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#475569] dark:text-[#94A3B8] leading-relaxed">
                    {item.summary}
                  </p>

                  {/* Impact on Job Opportunities */}
                  <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#0F172A]/50 border border-[#E2E8F0] dark:border-[#334155]/60 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#C93B1E] dark:text-[#F06449]">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Impacto em Vagas e Empregos na Obra:</span>
                    </div>
                    <p className="text-xs text-[#334155] dark:text-[#CBD5E1] leading-relaxed">
                      {item.jobImpact}
                    </p>
                  </div>
                </div>

                {/* Footer with Source & Read Action */}
                <div className="mt-4 pt-3.5 border-t border-[#F1F5F9] dark:border-[#334155]/60 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-[#64748B] dark:text-[#94A3B8]">
                    <Globe className="w-3.5 h-3.5 text-[#94A3B8]" />
                    <span className="truncate max-w-[150px] sm:max-w-[200px]">
                      {item.source}
                    </span>
                  </div>

                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#F1F5F9] dark:bg-[#334155] hover:bg-[#E2E8F0] dark:hover:bg-[#475569] font-semibold text-[#0F172A] dark:text-[#F8FAFC] transition-colors"
                  >
                    <span>Ler original</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
