/**
 * @file src/components/ContractAcceptedConfetti.tsx
 * @description Componente visual comemorativo usando `canvas-confetti`, acionado exclusivamente
 *   quando um contrato é aceito (`status === 'aceita'`) tanto para a construtora quanto para o
 *   trabalhador, respeitando `prefers-reduced-motion` e oferecendo atalho direto ao chat da obra.
 */
import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, MessageSquare, PartyPopper, X } from 'lucide-react';
import type { ContractCelebrationEvent } from '../utils/contractCelebration';

interface ContractAcceptedConfettiProps {
  event: ContractCelebrationEvent | null;
  onDismiss: () => void;
  onOpenChat?: (applicationId: string) => void;
}

const CELEBRATION_COLORS = [
  '#C93B1E',
  '#F06449',
  '#F59E0B',
  '#10B981',
  '#FFFFFF',
];

export const ContractAcceptedConfetti: React.FC<ContractAcceptedConfettiProps> = ({
  event,
  onDismiss,
  onOpenChat,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastTriggeredEventIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!event) {
      lastTriggeredEventIdRef.current = null;
      return;
    }

    if (lastTriggeredEventIdRef.current === event.id) {
      return;
    }
    lastTriggeredEventIdRef.current = event.id;

    const canvas = canvasRef.current;
    let instance: ReturnType<typeof confetti.create> | null = null;
    const timers: number[] = [];

    if (canvas && typeof window !== 'undefined') {
      try {
        instance = confetti.create(canvas, {
          resize: true,
          useWorker: false,
        });

        const fireBurst = (opts: confetti.Options) => {
          try {
            void instance?.({
              colors: CELEBRATION_COLORS,
              disableForReducedMotion: true,
              ...opts,
            });
          } catch {
            // Ignore canvas rendering errors in restricted headless environments
          }
        };

        // Central celebratory launch
        fireBurst({
          particleCount: 70,
          spread: 75,
          startVelocity: 42,
          origin: { x: 0.5, y: 0.62 },
        });

        // Side cannons for balanced desktop & mobile celebration
        timers.push(
          window.setTimeout(() => {
            fireBurst({
              particleCount: 45,
              angle: 60,
              spread: 58,
              origin: { x: 0.14, y: 0.68 },
            });
            fireBurst({
              particleCount: 45,
              angle: 120,
              spread: 58,
              origin: { x: 0.86, y: 0.68 },
            });
          }, 180)
        );

        timers.push(
          window.setTimeout(() => {
            fireBurst({
              particleCount: 36,
              spread: 95,
              scalar: 0.9,
              origin: { x: 0.5, y: 0.45 },
            });
          }, 420)
        );
      } catch {
        // Gracefully fall back to visual banner if canvas-confetti cannot initialize
      }
    }

    const dismissTimer =
      typeof window !== 'undefined'
        ? window.setTimeout(() => {
            onDismiss();
          }, 7000)
        : null;

    return () => {
      for (const timer of timers) {
        window.clearTimeout(timer);
      }
      if (dismissTimer !== null && typeof window !== 'undefined') {
        window.clearTimeout(dismissTimer);
      }
      try {
        instance?.reset();
      } catch {
        // Ignore reset errors on unmount
      }
    };
  }, [event, onDismiss]);

  return (
    <>
      <canvas
        ref={canvasRef}
        data-testid="contract-confetti-canvas"
        aria-hidden="true"
        className={`fixed inset-0 w-full h-full pointer-events-none z-[90] transition-opacity duration-300 ${
          event ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <AnimatePresence>
        {event && (
          <motion.aside
            key={event.id}
            role="status"
            aria-live="polite"
            data-testid="contract-accepted-celebration"
            data-celebration-role={event.role}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-20 md:bottom-6 right-4 left-4 sm:left-auto sm:w-[420px] z-[95] rounded-2xl border border-[#A7F3D0] dark:border-[#047857] bg-white dark:bg-[#111827] shadow-2xl p-4 sm:p-5"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B]/60 border border-[#A7F3D0] dark:border-[#047857] text-[#047857] dark:text-[#34D399] flex items-center justify-center shrink-0">
                <PartyPopper className="w-5 h-5 shrink-0" aria-hidden="true" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#047857] dark:text-[#34D399]">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>
                    {event.role === 'contratante'
                      ? 'Contratação confirmada'
                      : 'Vaga confirmada'}
                  </span>
                </div>
                <h3 className="font-display text-base font-bold text-[#111827] dark:text-[#F8FAFC] mt-0.5 leading-snug">
                  {event.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#374151] dark:text-[#CBD5E1] mt-1 leading-relaxed">
                  {event.subtitle}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {onOpenChat && (
                    <button
                      type="button"
                      onClick={() => {
                        const targetAppId = event.applicationId;
                        onDismiss();
                        onOpenChat(targetAppId);
                      }}
                      data-testid="celebration-open-chat-button"
                      className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#C93B1E] hover:bg-[#B23319] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>Abrir chat da obra</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={onDismiss}
                    className="min-h-[38px] px-3 py-1.5 rounded-xl border border-[#D1D5DB] dark:border-[#334155] text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] hover:bg-[#F3F4F6] dark:hover:bg-[#1E293B] cursor-pointer transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={onDismiss}
                aria-label="Fechar aviso de contrato aceito"
                data-testid="dismiss-celebration-button"
                className="min-w-[36px] min-h-[36px] rounded-lg text-[#6B7280] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F8FAFC] hover:bg-[#F3F4F6] dark:hover:bg-[#1E293B] flex items-center justify-center shrink-0 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4 shrink-0" aria-hidden="true" />
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};
