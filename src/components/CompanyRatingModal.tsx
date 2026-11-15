import React, { useEffect, useState } from 'react';
import { Star, X } from 'lucide-react';
import type { JobApplication, JobPosting } from '../types/brickjobs';
import { getRatingStarLabel } from '../utils/ratings';

interface CompanyRatingModalProps {
  isOpen: boolean;
  application: JobApplication | null;
  job: JobPosting | null;
  onSubmitRating: (params: {
    applicationId: string;
    stars: number;
    comment: string;
  }) => { ok: boolean; error?: string };
  onClose: () => void;
}

export const CompanyRatingModal: React.FC<CompanyRatingModalProps> = ({
  isOpen,
  application,
  job,
  onSubmitRating,
  onClose,
}) => {
  const [stars, setStars] = useState<number>(5);
  const [hoverStars, setHoverStars] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setStars(5);
      setHoverStars(0);
      setComment('');
      setError('');
    }
  }, [isOpen, application?.id]);

  if (!isOpen || !application || !job) return null;

  const activeStars = hoverStars || stars;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = onSubmitRating({
      applicationId: application.id,
      stars,
      comment,
    });
    if (!result.ok) {
      setError(result.error || 'Não foi possível enviar a avaliação.');
      return;
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="company-rating-title"
      data-testid="company-rating-modal"
    >
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full sm:max-w-md max-h-[90dvh] overflow-y-auto bg-white dark:bg-[#111827] border-t sm:border border-[#E5E7EB] dark:border-[#1E293B] rounded-t-3xl sm:rounded-2xl shadow-xl p-5 sm:p-6 pb-safe">
        <div
          className="w-10 h-1 bg-[#D1D5DB] dark:bg-[#334155] rounded-full mx-auto mb-3 sm:hidden"
          aria-hidden="true"
        />

        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-[#C93B1E] dark:text-[#F06449]">
              Avaliação pós-obra · Rondonópolis-MT
            </p>
            <h2
              id="company-rating-title"
              className="font-display text-lg sm:text-xl font-bold text-[#111827] dark:text-[#F8FAFC] mt-0.5"
            >
              Avaliar {job.companyName}
            </h2>
            <p className="text-xs sm:text-sm text-[#4B5563] dark:text-[#94A3B8] mt-1">
              Trabalho concluído: <strong className="text-[#111827] dark:text-[#F8FAFC]">{job.funcao}</strong> ({job.bairro})
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar avaliação"
            className="min-w-[44px] min-h-[44px] rounded-xl border border-[#E5E7EB] dark:border-[#1E293B] flex items-center justify-center text-[#4B5563] dark:text-[#94A3B8] hover:bg-[#F3F4F6] dark:hover:bg-[#1E293B] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <span className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-2">
              Nota geral para a construtora *
            </span>
            <div
              role="radiogroup"
              aria-label="Nota de 1 a 5 estrelas"
              className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#F9FAFB] dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#334155]"
              onMouseLeave={() => setHoverStars(0)}
            >
              {[1, 2, 3, 4, 5].map((value) => {
                const isSelected = value <= activeStars;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={stars === value}
                    aria-label={`${value} ${value === 1 ? 'estrela' : 'estrelas'}`}
                    data-testid={`rating-star-${value}`}
                    onMouseEnter={() => setHoverStars(value)}
                    onClick={() => setStars(value)}
                    className={`min-w-[48px] min-h-[48px] flex-1 rounded-xl flex items-center justify-center transition-transform active:scale-95 cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-500 dark:text-amber-400'
                        : 'text-[#9CA3AF] dark:text-[#475569] hover:text-[#6B7280] dark:hover:text-[#94A3B8]'
                    }`}
                  >
                    <Star
                      className={`w-6 h-6 ${isSelected ? 'fill-current' : ''}`}
                      aria-hidden="true"
                    />
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-xs font-semibold text-[#111827] dark:text-[#F8FAFC] tabular-nums">
              {activeStars}/5 estrelas · {getRatingStarLabel(activeStars)}
            </p>
          </div>

          <div>
            <label
              htmlFor="rating-comment"
              className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
            >
              Comentário sobre a experiência na obra (opcional)
            </label>
            <textarea
              id="rating-comment"
              rows={3}
              maxLength={240}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ex: Pagamento em dia, fornecimento de EPI e boa comunicação com a equipe."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-base sm:text-sm text-[#111827] dark:text-[#F8FAFC] placeholder:text-[#6B7280] dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-[#C93B1E]"
            />
          </div>

          {error && (
            <p role="alert" className="text-xs font-semibold text-[#B91C1C] dark:text-[#F87171]">
              {error}
            </p>
          )}

          <div className="pt-1 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#D1D5DB] dark:border-[#334155] text-sm font-semibold text-[#111827] dark:text-[#F8FAFC] hover:bg-[#F9FAFB] dark:hover:bg-[#1E293B] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              data-testid="submit-company-rating-button"
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#C93B1E] hover:bg-[#B23319] text-white text-sm font-semibold active:scale-[0.98] transition-all cursor-pointer"
            >
              Enviar avaliação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
