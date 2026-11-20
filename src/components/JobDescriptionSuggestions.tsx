/**
 * @file src/components/JobDescriptionSuggestions.tsx
 * @description Painel auxiliar para construtoras aplicarem modelos e requisitos rápidos de descrição de vagas conforme a função escolhida.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Check, FileText, Plus } from 'lucide-react';
import type { ContractType, ExperienceLevel } from '../types/brickjobs';
import {
  appendRequirementSnippet,
  formatSuggestionForTextarea,
  getJobDescriptionSuggestions,
  getQuickRequirementsForRole,
} from '../utils/jobSuggestions';

interface JobDescriptionSuggestionsProps {
  roleName: string;
  experienceLevel: ExperienceLevel;
  contractType: ContractType;
  neighborhood: string;
  currentDescription: string;
  onApplyDescription: (nextDescription: string) => void;
  onApplyCompetencies?: (competencies: {
    required: string[];
    preferred: string[];
  }) => void;
}

export const JobDescriptionSuggestions: React.FC<JobDescriptionSuggestionsProps> = ({
  roleName,
  experienceLevel,
  contractType,
  neighborhood,
  currentDescription,
  onApplyDescription,
  onApplyCompetencies,
}) => {
  const displayRole = roleName.trim() || 'Nova função';

  const suggestions = useMemo(
    () =>
      getJobDescriptionSuggestions(displayRole, {
        experienceLevel,
        contractType,
        neighborhood,
      }),
    [displayRole, experienceLevel, contractType, neighborhood]
  );

  const quickRequirements = useMemo(
    () => getQuickRequirementsForRole(displayRole),
    [displayRole]
  );

  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [appliedBanner, setAppliedBanner] = useState<string>('');

  useEffect(() => {
    setSelectedIdx(0);
    setAppliedBanner('');
  }, [displayRole]);

  const activeSuggestion = suggestions[selectedIdx] || suggestions[0];

  const isCurrentEqualToActive = useMemo(() => {
    if (!activeSuggestion) return false;
    return (
      currentDescription.trim() ===
      formatSuggestionForTextarea(activeSuggestion).trim()
    );
  }, [activeSuggestion, currentDescription]);

  const handleApplyTemplate = () => {
    if (!activeSuggestion) return;
    const formatted = formatSuggestionForTextarea(activeSuggestion);
    onApplyDescription(formatted);
    onApplyCompetencies?.({
      required: activeSuggestion.requiredCompetencies,
      preferred: activeSuggestion.preferredCompetencies,
    });
    setAppliedBanner(`Modelo "${activeSuggestion.titulo}" aplicado abaixo.`);
  };

  const handleAddQuickRequirement = (req: string) => {
    const next = appendRequirementSnippet(currentDescription, req);
    if (next !== currentDescription) {
      onApplyDescription(next);
      setAppliedBanner(`Requisito "${req}" adicionado.`);
    }
  };

  return (
    <div
      data-testid="job-suggestions-panel"
      className="rounded-xl bg-[#F9FAFB] dark:bg-[#1E293B] p-3.5 sm:p-4 space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#111827] dark:text-[#F8FAFC]">
          <FileText className="w-3.5 h-3.5 text-[#C93B1E] dark:text-[#F06449] shrink-0" aria-hidden="true" />
          <span>Sugestões para {displayRole}</span>
        </div>

        {currentDescription.trim().length > 0 && (
          <button
            type="button"
            onClick={() => {
              onApplyDescription('');
              setAppliedBanner('');
            }}
            className="min-h-[44px] sm:min-h-[32px] px-2 text-xs font-semibold text-[#6B7280] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F8FAFC] underline-offset-2 hover:underline inline-flex items-center cursor-pointer"
          >
            Limpar campo
          </button>
        )}
      </div>

      {/* Template selector tabs */}
      <div
        role="tablist"
        aria-label={`Modelos sugeridos para ${displayRole}`}
        className="flex flex-wrap gap-1.5 p-1 rounded-lg bg-[#E5E7EB]/60 dark:bg-[#0F172A]/70"
      >
        {suggestions.map((item, idx) => {
          const isSelected = idx === selectedIdx;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => {
                setSelectedIdx(idx);
                setAppliedBanner('');
              }}
              className={`flex-1 min-w-[170px] min-h-[44px] sm:min-h-[40px] px-3 py-1.5 rounded-md text-xs font-semibold text-center whitespace-nowrap transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-white dark:bg-[#1E293B] text-[#111827] dark:text-[#F8FAFC] shadow-xs'
                  : 'text-[#4B5563] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F8FAFC]'
              }`}
            >
              {item.titulo}
            </button>
          );
        })}
      </div>

      {/* Active suggestion preview */}
      {activeSuggestion && (
        <div className="space-y-2.5 text-xs text-[#374151] dark:text-[#CBD5E1] leading-relaxed">
          <p>{activeSuggestion.descricao}</p>
          <ul className="space-y-1 text-[#4B5563] dark:text-[#94A3B8]">
            {activeSuggestion.requisitos.map((req) => (
              <li key={req} className="flex items-start gap-1.5">
                <span aria-hidden="true" className="text-[#C93B1E] dark:text-[#F06449] font-bold">
                  ·
                </span>
                <span>{req}</span>
              </li>
            ))}
          </ul>

          <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              data-testid="apply-job-suggestion-btn"
              onClick={handleApplyTemplate}
              className={`min-h-[44px] px-4 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer ${
                isCurrentEqualToActive
                  ? 'bg-[#ECFDF5] dark:bg-[#064E3B]/50 text-[#047857] dark:text-[#34D399] border border-[#A7F3D0] dark:border-[#065F46]'
                  : 'bg-[#111827] hover:bg-[#1F2937] dark:bg-[#F8FAFC] dark:hover:bg-[#E2E8F0] text-white dark:text-[#0F172A]'
              }`}
            >
              {isCurrentEqualToActive ? (
                <>
                  <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Sugestão aplicada</span>
                </>
              ) : (
                <span>Aplicar na descrição</span>
              )}
            </button>

            {appliedBanner && (
              <span
                role="status"
                className="text-xs font-medium text-[#047857] dark:text-[#34D399]"
              >
                {appliedBanner}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Quick-add requirement snippets */}
      <div className="pt-2.5 border-t border-[#E5E7EB] dark:border-[#334155]">
        <p className="text-xs font-medium text-[#4B5563] dark:text-[#94A3B8] mb-2">
          Adicionar requisito rápido:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {quickRequirements.map((req) => {
            const alreadyAdded = currentDescription
              .toLowerCase()
              .includes(req.toLowerCase());
            return (
              <button
                key={req}
                type="button"
                disabled={alreadyAdded}
                onClick={() => handleAddQuickRequirement(req)}
                className={`min-h-[44px] sm:min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 border transition-colors ${
                  alreadyAdded
                    ? 'bg-[#ECFDF5] dark:bg-[#064E3B]/50 border-[#A7F3D0] dark:border-[#065F46] text-[#047857] dark:text-[#34D399] cursor-default'
                    : 'bg-white dark:bg-[#0F172A] border-[#D1D5DB] dark:border-[#334155] text-[#374151] dark:text-[#CBD5E1] hover:border-[#C93B1E] dark:hover:border-[#F06449] hover:text-[#111827] dark:hover:text-[#F8FAFC] cursor-pointer'
                }`}
              >
                {alreadyAdded ? (
                  <Check className="w-3 h-3 shrink-0" aria-hidden="true" />
                ) : (
                  <Plus className="w-3 h-3 shrink-0 text-[#C93B1E] dark:text-[#F06449]" aria-hidden="true" />
                )}
                <span>{req}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
