/**
 * @file src/components/CompanyRatingModal.tsx
 * @description Modal interativo para o trabalhador avaliar a construtora (estrelas e comentário) após a conclusão de um contrato.
 */

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, Sparkles, Star, X } from 'lucide-react';
import type { JobApplication, JobPosting } from '../types/brickjobs';
import {
  CHAT_BACKDROP_TRANSITION,
  CHAT_MODAL_TRANSITION,
  CHAT_MODAL_VARIANTS,
  MOTION_EASE_SETTLE,
} from '../utils/motionPresets';
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

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotate: number;
  scale: number;
  delay: number;
  color: string;
  shape: 'rect' | 'circle';
}

const CONFETTI_PIECES: ConfettiPiece[] = [
  { id: 0, x: -120, y: -95, rotate: -140, scale: 1.05, delay: 0.0, color: '#C93B1E', shape: 'rect' },
  { id: 1, x: -95, y: -128, rotate: 110, scale: 0.9, delay: 0.03, color: '#E8A640', shape: 'circle' },
  { id: 2, x: -68, y: -115, rotate: -75, scale: 1.1, delay: 0.05, color: '#16A34A', shape: 'rect' },
  { id: 3, x: -42, y: -142, rotate: 165, scale: 0.85, delay: 0.02, color: '#2563EB', shape: 'rect' },
  { id: 4, x: -18, y: -130, rotate: -195, scale: 1.0, delay: 0.04, color: '#F59E0B', shape: 'circle' },
  { id: 5, x: 18, y: -136, rotate: 145, scale: 1.0, delay: 0.01, color: '#F06449', shape: 'rect' },
  { id: 6, x: 46, y: -124, rotate: -110, scale: 0.95, delay: 0.06, color: '#16A34A', shape: 'circle' },
  { id: 7, x: 74, y: -138, rotate: 180, scale: 1.1, delay: 0.03, color: '#C93B1E', shape: 'rect' },
  { id: 8, x: 102, y: -108, rotate: -155, scale: 0.9, delay: 0.05, color: '#E8A640', shape: 'rect' },
  { id: 9, x: 126, y: -88, rotate: 125, scale: 1.05, delay: 0.02, color: '#2563EB', shape: 'circle' },
  { id: 10, x: -134, y: -46, rotate: 95, scale: 0.85, delay: 0.07, color: '#F59E0B', shape: 'rect' },
  { id: 11, x: -86, y: -58, rotate: -130, scale: 1.0, delay: 0.04, color: '#2563EB', shape: 'circle' },
  { id: 12, x: 88, y: -54, rotate: 160, scale: 0.95, delay: 0.06, color: '#F06449', shape: 'rect' },
  { id: 13, x: 134, y: -42, rotate: -90, scale: 0.9, delay: 0.08, color: '#16A34A', shape: 'rect' },
  { id: 14, x: -58, y: -24, rotate: 135, scale: 0.85, delay: 0.05, color: '#C93B1E', shape: 'circle' },
  { id: 15, x: 60, y: -22, rotate: -150, scale: 0.85, delay: 0.07, color: '#E8A640', shape: 'circle' },
];

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
  const [submittedStars, setSubmittedStars] = useState<number | null>(null);
  const [isExiting, setIsExiting] = useState<boolean>(false);
  const autoCloseTimerRef = useRef<number | null>(null);
  const exitTimerRef = useRef<number | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const clearTimers = () => {
    if (autoCloseTimerRef.current !== null) {
      window.clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
    if (exitTimerRef.current !== null) {
      window.clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
  };

  const triggerSmoothClose = () => {
    if (autoCloseTimerRef.current !== null) {
      window.clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
    if (exitTimerRef.current !== null) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      onCloseRef.current();
      return;
    }

    setIsExiting(true);
    exitTimerRef.current = window.setTimeout(() => {
      exitTimerRef.current = null;
      onCloseRef.current();
    }, 180);
  };

  useEffect(() => {
    if (isOpen) {
      clearTimers();
      setIsExiting(false);
      setStars(5);
      setHoverStars(0);
      setComment('');
      setError('');
      setSubmittedStars(null);
    }
    return () => clearTimers();
  }, [isOpen, application?.id]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        triggerSmoothClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const activeStars = hoverStars || stars;
  const visible = Boolean(isOpen && application && job);

  const handleClose = () => {
    triggerSmoothClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!application || isExiting) return;
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

    setSubmittedStars(stars);
    if (autoCloseTimerRef.current !== null) {
      window.clearTimeout(autoCloseTimerRef.current);
    }
    autoCloseTimerRef.current = window.setTimeout(() => {
      autoCloseTimerRef.current = null;
      triggerSmoothClose();
    }, 2200);
  };

  if (!visible || !application || !job) {
    return null;
  }

  return (
    <motion.div
      key={`company-rating-overlay-${application.id}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: isExiting ? 0 : 1 }}
      transition={CHAT_BACKDROP_TRANSITION}
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 ${
        isExiting ? 'pointer-events-none' : ''
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="company-rating-title"
      data-testid="company-rating-modal"
    >
      <div
        className="fixed inset-0 bg-black/55"
        onClick={handleClose}
        aria-hidden="true"
      />

      <motion.div
        initial={CHAT_MODAL_VARIANTS.initial}
        animate={isExiting ? CHAT_MODAL_VARIANTS.exit : CHAT_MODAL_VARIANTS.animate}
        transition={CHAT_MODAL_TRANSITION}
        className="relative z-10 w-full sm:max-w-md max-h-[90dvh] overflow-y-auto overflow-x-hidden bg-white dark:bg-[#111827] border-t sm:border border-[#E5E7EB] dark:border-[#1E293B] rounded-t-3xl sm:rounded-2xl shadow-xl p-5 sm:p-6 pb-safe"
      >
        <div
          className="w-10 h-1 bg-[#D1D5DB] dark:bg-[#334155] rounded-full mx-auto mb-3 sm:hidden"
          aria-hidden="true"
        />

        <AnimatePresence mode="wait" initial={false}>
          {submittedStars !== null ? (
            <motion.div
              key="rating-success"
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.28, ease: MOTION_EASE_SETTLE }}
              className="relative py-5 text-center"
              role="status"
              aria-live="polite"
              data-testid="company-rating-success"
            >
              {/* Celebratory confetti burst layer */}
              <div
                className="pointer-events-none absolute left-1/2 top-16 -translate-x-1/2 w-0 h-0 overflow-visible"
                aria-hidden="true"
              >
                {CONFETTI_PIECES.map((piece) => (
                  <motion.span
                    key={piece.id}
                    data-testid="rating-confetti-piece"
                    initial={{ x: 0, y: 0, rotate: 0, scale: 0.2, opacity: 1 }}
                    animate={{
                      x: piece.x,
                      y: piece.y,
                      rotate: piece.rotate,
                      scale: [0.3, piece.scale, piece.scale * 0.85],
                      opacity: [1, 1, 0],
                    }}
                    transition={{
                      duration: 0.95,
                      delay: piece.delay * 0.7,
                      ease: [0.12, 0.8, 0.32, 1],
                    }}
                    style={{ backgroundColor: piece.color }}
                    className={`absolute block ${
                      piece.shape === 'circle'
                        ? 'w-2.5 h-2.5 rounded-full'
                        : 'w-2.5 h-1.5 rounded-[2px]'
                    }`}
                  />
                ))}
              </div>

                  <motion.div
                    initial={{ scale: 0.5, rotate: -14, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    transition={{ duration: 0.36, ease: MOTION_EASE_SETTLE }}
                    className="relative mx-auto w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs"
                  >
                    <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.14, duration: 0.25 }}
                      className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#C93B1E] text-white flex items-center justify-center shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                    </motion.span>
                  </motion.div>

                  <h2
                    id="company-rating-title"
                    className="font-display text-xl font-bold text-[#111827] dark:text-[#F8FAFC] mt-4"
                  >
                    Avaliação registrada!
                  </h2>

                  <p className="text-sm text-[#4B5563] dark:text-[#94A3B8] mt-1.5 max-w-xs mx-auto leading-relaxed">
                    Sua nota para <strong className="text-[#111827] dark:text-[#F8FAFC]">{job.companyName}</strong> foi salva com sucesso.
                  </p>

                  <div className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <motion.span
                        key={value}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.08 + value * 0.04, duration: 0.2 }}
                      >
                        <Star
                          className={`w-4 h-4 ${
                            value <= submittedStars
                              ? 'text-amber-500 dark:text-amber-400 fill-current'
                              : 'text-[#D1D5DB] dark:text-[#475569]'
                          }`}
                          aria-hidden="true"
                        />
                      </motion.span>
                    ))}
                    <span className="ml-1 text-xs font-bold text-[#111827] dark:text-[#F8FAFC] tabular-nums">
                      {submittedStars}/5
                    </span>
                  </div>

                  <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-3">
                    Obrigado por fortalecer a transparência nas obras de Rondonópolis-MT.
                  </p>

                  <div className="mt-5">
                    <button
                      type="button"
                      onClick={handleClose}
                      data-testid="company-rating-done-button"
                      className="w-full sm:w-auto min-h-[44px] px-6 py-2 rounded-xl bg-[#111827] hover:bg-[#1F2937] dark:bg-[#F8FAFC] dark:hover:bg-[#E2E8F0] text-white dark:text-[#0F172A] text-sm font-semibold active:scale-[0.98] transition-all cursor-pointer"
                    >
                      Concluir
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="rating-form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.12 } }}
                  transition={{ duration: 0.16, ease: MOTION_EASE_SETTLE }}
                >
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
                      onClick={handleClose}
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
                        onClick={handleClose}
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
                </motion.div>
              )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
