/**
 * @file src/components/SkillTagFilterBar.tsx
 * @description Barra de filtragem rápida por especialidades e tags técnicas das vagas de obra.
 */

import React from 'react';
import { Check, Tag, X } from 'lucide-react';
import type { SkillTagSummary } from '../utils/skillTags';

interface SkillTagFilterBarProps {
  summaries: SkillTagSummary[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onClearTags: () => void;
}

export const SkillTagFilterBar: React.FC<SkillTagFilterBarProps> = ({
  summaries,
  selectedTags,
  onToggleTag,
  onClearTags,
}) => {
  const hasActiveTags = selectedTags.length > 0;

  return (
    <section
      aria-label="Filtrar vagas por tags de habilidade"
      data-testid="worker-skill-tags-bar"
      className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <Tag
            className="w-4 h-4 text-[#C93B1E] dark:text-[#F06449] shrink-0"
            aria-hidden="true"
          />
          <h2 className="text-xs sm:text-sm font-semibold text-[#111827] dark:text-[#F8FAFC]">
            Tags de habilidade
          </h2>
          <span className="hidden sm:inline text-xs text-[#4B5563] dark:text-[#94A3B8]">
            · Toque para filtrar por especialidade
          </span>
        </div>

        {hasActiveTags && (
          <button
            type="button"
            onClick={onClearTags}
            data-testid="skill-tags-clear-button"
            className="min-h-[44px] sm:min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-semibold text-[#C93B1E] dark:text-[#F06449] hover:underline inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <X className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Limpar tags ({selectedTags.length})</span>
          </button>
        )}
      </div>

      <div
        className="flex flex-wrap items-center gap-2"
        role="group"
        aria-label="Habilidades da construção civil"
      >
        <button
          type="button"
          onClick={onClearTags}
          aria-pressed={!hasActiveTags}
          data-testid="skill-tag-all"
          className={`min-h-[44px] sm:min-h-[40px] px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors active:scale-[0.98] cursor-pointer ${
            !hasActiveTags
              ? 'border-[#111827] bg-[#111827] text-white dark:border-[#F8FAFC] dark:bg-[#F8FAFC] dark:text-[#0F172A]'
              : 'border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#1E293B] hover:bg-[#F3F4F6] dark:hover:bg-[#334155] text-[#111827] dark:text-[#F8FAFC]'
          }`}
        >
          {!hasActiveTags && <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
          <span>Todas</span>
        </button>

        {summaries.map((item) => {
          const isSelected = selectedTags.includes(item.tag);
          return (
            <button
              key={item.tag}
              type="button"
              onClick={() => onToggleTag(item.tag)}
              aria-pressed={isSelected}
              data-testid={`skill-tag-${item.tag}`}
              className={`min-h-[44px] sm:min-h-[40px] px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors active:scale-[0.98] cursor-pointer ${
                isSelected
                  ? 'border-[#C93B1E] bg-[#C93B1E] text-white dark:border-[#F06449]'
                  : 'border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#1E293B] hover:bg-[#F3F4F6] dark:hover:bg-[#334155] text-[#111827] dark:text-[#F8FAFC]'
              }`}
            >
              {isSelected && <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
              <span>{item.label}</span>
              <span
                className={`font-mono text-[11px] tabular-nums ${
                  isSelected
                    ? 'text-white/90'
                    : 'text-[#4B5563] dark:text-[#94A3B8]'
                }`}
              >
                ({item.count})
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
