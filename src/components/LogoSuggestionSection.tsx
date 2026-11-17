import React, { useEffect, useState } from 'react';
import { Download, Maximize2, X } from 'lucide-react';
import brickJobsLogoConceptImg from '../assets/images/brickjobs_logo_concept_1794958149126.jpg';

const BRAND_PALETTE = [
  {
    hex: '#C93B1E',
    name: 'Terracota Tijolo',
    role: 'Cor principal',
  },
  {
    hex: '#111827',
    name: 'Grafite Estrutural',
    role: 'Tipografia e contraste',
  },
  {
    hex: '#F8FAFC',
    name: 'Concreto Claro',
    role: 'Base neutra',
  },
] as const;

export const LogoSuggestionSection: React.FC = () => {
  const [imgFailed, setImgFailed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  return (
    <section
      aria-labelledby="logo-suggestion-heading"
      data-testid="logo-suggestion-section"
      className="bg-[#F4F5F7] dark:bg-[#0B1120] border-t border-[#E5E7EB] dark:border-[#1E293B]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] p-5 sm:p-7 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-center">
            {/* Logo Image Card */}
            <div className="md:col-span-5 lg:col-span-4 flex justify-center">
              <div className="w-full max-w-[280px] aspect-square rounded-2xl border border-[#E5E7EB] dark:border-[#334155] bg-[#F8FAFC] overflow-hidden relative shadow-xs">
                {!imgFailed ? (
                  <img
                    src={brickJobsLogoConceptImg}
                    alt="Sugestão de logotipo profissional do BrickJobs para construção civil em Rondonópolis-MT no tom #C93B1E"
                    referrerPolicy="no-referrer"
                    onError={() => setImgFailed(true)}
                    data-testid="logo-suggestion-image"
                    className="w-full h-full object-contain block"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#F8FAFC]">
                    <span className="font-display text-2xl font-bold text-[#111827]">
                      Brick<span className="text-[#C93B1E]">Jobs</span>
                    </span>
                    <span className="mt-1 text-xs font-semibold tracking-wider text-[#4B5563]">
                      CONSTRUÇÃO CIVIL · RONDONÓPOLIS-MT
                    </span>
                  </div>
                )}

                {!imgFailed && (
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    aria-label="Ampliar sugestão de logotipo do BrickJobs"
                    data-testid="logo-suggestion-zoom-icon"
                    className="absolute bottom-2.5 right-2.5 min-w-[44px] min-h-[44px] rounded-xl bg-white/95 hover:bg-white border border-[#E5E7EB] text-[#111827] flex items-center justify-center shadow-xs cursor-pointer transition-colors"
                  >
                    <Maximize2 className="w-4 h-4 text-[#C93B1E]" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            {/* Concept Explanation & Palette */}
            <div className="md:col-span-7 lg:col-span-8 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#C93B1E] dark:text-[#F06449]">
                  Identidade Visual · Sugestão de Logotipo
                </p>
                <h2
                  id="logo-suggestion-heading"
                  className="mt-1 font-display text-xl sm:text-2xl font-bold text-[#111827] dark:text-[#F8FAFC]"
                >
                  Logotipo BrickJobs — Construção Civil & Rondonópolis-MT
                </h2>
                <p className="mt-2 text-sm text-[#4B5563] dark:text-[#94A3B8] leading-relaxed">
                  Proposta de marca que une blocos de alvenaria estrutural em ascensão, uma seta de evolução profissional e linhas de horizonte inspiradas em Rondonópolis-MT, destacando o tom terracota oficial{' '}
                  <strong className="font-semibold text-[#111827] dark:text-[#F8FAFC] tabular-nums">
                    #C93B1E
                  </strong>{' '}
                  com alto contraste em grafite estrutural.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {BRAND_PALETTE.map((swatch) => (
                  <div
                    key={swatch.hex}
                    className="rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#0F172A] p-3 flex items-center gap-3"
                  >
                    <span
                      aria-hidden="true"
                      className="w-8 h-8 rounded-lg border border-black/15 dark:border-white/15 shrink-0"
                      style={{ backgroundColor: swatch.hex }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#111827] dark:text-[#F8FAFC] tabular-nums">
                        {swatch.hex}
                      </p>
                      <p className="text-xs text-[#4B5563] dark:text-[#94A3B8] truncate">
                        {swatch.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {!imgFailed && (
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    data-testid="logo-suggestion-enlarge-button"
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-[#C93B1E] hover:bg-[#B23319] text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Maximize2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Visualizar em tamanho maior</span>
                  </button>

                  <a
                    href={brickJobsLogoConceptImg}
                    download="brickjobs-logotipo-rondonopolis.jpg"
                    data-testid="logo-suggestion-download-link"
                    className="min-h-[44px] px-4 py-2 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#1E293B] hover:bg-[#F9FAFB] dark:hover:bg-[#334155] text-sm font-semibold text-[#111827] dark:text-[#F8FAFC] inline-flex items-center gap-2 transition-colors"
                  >
                    <Download className="w-4 h-4 text-[#C93B1E] dark:text-[#F06449] shrink-0" aria-hidden="true" />
                    <span>Baixar sugestão (.jpg)</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && !imgFailed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logo-modal-title"
            data-testid="logo-suggestion-modal"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#334155] shadow-xl p-5 sm:p-6 space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3
                  id="logo-modal-title"
                  className="font-display text-lg font-bold text-[#111827] dark:text-[#F8FAFC]"
                >
                  Logotipo BrickJobs · Rondonópolis-MT
                </h3>
                <p className="text-xs text-[#4B5563] dark:text-[#94A3B8] mt-0.5">
                  Aplicação em #C93B1E e grafite estrutural #111827
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Fechar visualização ampliada do logotipo"
                data-testid="logo-suggestion-modal-close"
                className="min-w-[44px] min-h-[44px] rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#1E293B] hover:bg-[#F3F4F6] dark:hover:bg-[#334155] text-[#4B5563] dark:text-[#CBD5E1] flex items-center justify-center cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="aspect-square w-full rounded-2xl border border-[#E5E7EB] dark:border-[#334155] bg-[#F8FAFC] overflow-hidden">
              <img
                src={brickJobsLogoConceptImg}
                alt="Visualização ampliada do logotipo BrickJobs para construção civil em Rondonópolis-MT"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain block"
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2.5">
              <a
                href={brickJobsLogoConceptImg}
                download="brickjobs-logotipo-rondonopolis.jpg"
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#C93B1E] hover:bg-[#B23319] text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Baixar imagem</span>
              </a>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-sm font-semibold text-[#111827] dark:text-[#F8FAFC] cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
