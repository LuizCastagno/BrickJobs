import React, { useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Compass,
  X,
} from 'lucide-react';
import type { OnboardingStep } from '../utils/onboarding';

interface GuidedTourModalProps {
  isOpen: boolean;
  steps: OnboardingStep[];
  currentStepIndex: number;
  onSelectStep: (index: number) => void;
  onComplete: () => void;
  onSkip: () => void;
}

export const GuidedTourModal: React.FC<GuidedTourModalProps> = ({
  isOpen,
  steps,
  currentStepIndex,
  onSelectStep,
  onComplete,
  onSkip,
}) => {
  const safeIndex = Math.max(0, Math.min(currentStepIndex, steps.length - 1));
  const step = steps[safeIndex];
  const isFirst = safeIndex === 0;
  const isLast = safeIndex === steps.length - 1;

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onSkip();
      } else if (e.key === 'ArrowRight' && !isLast) {
        onSelectStep(safeIndex + 1);
      } else if (e.key === 'ArrowLeft' && !isFirst) {
        onSelectStep(safeIndex - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFirst, isLast, safeIndex, onSelectStep, onSkip]);

  if (!isOpen || !step) return null;

  return (
    <>
      {/* Backdrop stays below TopNavBar (z-30) and MobileBottomNav (z-40) so highlighted tabs remain visible */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-20 bg-black/50 backdrop-blur-[1px]"
      />

      {/* Tour Card Container */}
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] sm:inset-0 sm:flex sm:items-center sm:justify-center p-3 sm:p-6 z-50 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="guided-tour-title"
          data-testid="guided-tour-modal"
          className="pointer-events-auto w-full sm:max-w-lg rounded-2xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#334155] shadow-2xl p-5 sm:p-6 text-[#111827] dark:text-[#F8FAFC]"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C93B1E] dark:text-[#F06449]">
                <Compass className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>
                  Tour Guiado · Passo {safeIndex + 1} de {steps.length}
                </span>
              </div>
              <h2
                id="guided-tour-title"
                className="font-display text-lg sm:text-xl font-bold text-[#111827] dark:text-[#F8FAFC] mt-1"
              >
                {step.title}
              </h2>
            </div>

            <button
              type="button"
              onClick={onSkip}
              aria-label="Fechar tour guiado"
              data-testid="guided-tour-close"
              className="min-w-[44px] min-h-[44px] rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#1E293B] hover:bg-[#F3F4F6] dark:hover:bg-[#334155] text-[#4B5563] dark:text-[#CBD5E1] flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* Interactive Step Tabs ('Vagas', 'Cadastro', 'Perfil') */}
          <div
            role="tablist"
            aria-label="Etapas do Tour Guiado"
            className="mt-4 grid grid-cols-3 gap-2"
          >
            {steps.map((item, idx) => {
              const active = idx === safeIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onSelectStep(idx)}
                  data-testid={`tour-step-tab-${item.tabLabel.toLowerCase()}`}
                  className={`min-h-[44px] sm:min-h-[38px] px-2 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? 'border-[#C93B1E] dark:border-[#F06449] bg-[#C93B1E]/10 dark:bg-[#C93B1E]/20 text-[#C93B1E] dark:text-[#F06449]'
                      : 'border-[#E5E7EB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#0F172A] text-[#4B5563] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F8FAFC]'
                  }`}
                >
                  {idx + 1}. {item.tabLabel}
                </button>
              );
            })}
          </div>

          {/* Body */}
          <div className="mt-4">
            <p className="text-sm text-[#374151] dark:text-[#CBD5E1] leading-relaxed">
              {step.summary}
            </p>

            <ul className="mt-3 space-y-2">
              {step.highlights.map((highlight) => (
                <li
                  key={highlight}
                  className="flex items-start gap-2 text-xs sm:text-sm text-[#374151] dark:text-[#CBD5E1]"
                >
                  <CheckCircle2
                    className="w-4 h-4 text-[#047857] dark:text-[#34D399] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer Controls */}
          <div className="mt-5 pt-4 border-t border-[#E5E7EB] dark:border-[#1E293B] flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={onSkip}
              data-testid="guided-tour-skip"
              className="min-h-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-[#4B5563] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F8FAFC] cursor-pointer"
            >
              Pular tour
            </button>

            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  type="button"
                  onClick={() => onSelectStep(safeIndex - 1)}
                  data-testid="guided-tour-prev"
                  className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#1E293B] hover:bg-[#F9FAFB] dark:hover:bg-[#334155] text-xs sm:text-sm font-semibold text-[#111827] dark:text-[#F8FAFC] inline-flex items-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                  <span>Anterior</span>
                </button>
              )}

              {!isLast ? (
                <button
                  type="button"
                  onClick={() => onSelectStep(safeIndex + 1)}
                  data-testid="guided-tour-next"
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#C93B1E] hover:bg-[#B23319] text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <span>Próximo</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onComplete}
                  data-testid="guided-tour-finish"
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-[#C93B1E] hover:bg-[#B23319] text-white text-xs sm:text-sm font-semibold active:scale-[0.98] transition-all cursor-pointer"
                >
                  Concluir tour
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
