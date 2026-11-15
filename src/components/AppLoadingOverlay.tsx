import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { HardHat } from 'lucide-react';
import {
  MOTION_EASE_SETTLE,
  ROUTE_OVERLAY_VARIANTS,
  SPLASH_OVERLAY_VARIANTS,
  getRouteTransitionLabel,
  type AppRouteScreen,
} from '../utils/motionPresets';
import { BrickLogo } from './BrickLogo';

interface AppLoadingOverlayProps {
  isInitialLoading: boolean;
  routeTransitionTarget: AppRouteScreen | null;
  onSkipInitial?: () => void;
}

const BRICK_STACK_BLOCKS = [
  { id: 'b1', delay: 0.02, color: 'bg-[#C93B1E] dark:bg-[#F06449]', width: 'w-9' },
  { id: 'b2', delay: 0.08, color: 'bg-[#111827] dark:bg-[#E2E8F0]', width: 'w-9' },
  { id: 'b3', delay: 0.14, color: 'bg-[#C93B1E] dark:bg-[#F06449]', width: 'w-9' },
];

export const AppLoadingOverlay: React.FC<AppLoadingOverlayProps> = ({
  isInitialLoading,
  routeTransitionTarget,
  onSkipInitial,
}) => {
  return (
    <>
      {/* 1. Initial Boot Splash Screen */}
      <AnimatePresence>
        {isInitialLoading && (
          <motion.div
            key="brickjobs-initial-loader"
            data-testid="app-initial-loader"
            role="status"
            aria-live="polite"
            aria-label="Carregando BrickJobs Rondonópolis"
            variants={SPLASH_OVERLAY_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6 bg-[#F4F5F7] dark:bg-[#0B1120] text-[#111827] dark:text-[#F8FAFC]"
          >
            <div className="w-full max-w-sm flex flex-col items-center text-center">
              {/* Animated Staggered Brick Assembly */}
              <div
                aria-hidden="true"
                className="mb-5 flex flex-col items-center gap-1.5"
              >
                <div className="flex items-center gap-1.5">
                  {BRICK_STACK_BLOCKS.slice(0, 2).map((block) => (
                    <motion.div
                      key={block.id}
                      initial={{ opacity: 0, y: -14, scale: 0.85 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{
                        duration: 0.34,
                        delay: block.delay,
                        ease: MOTION_EASE_SETTLE,
                      }}
                      className={`h-3.5 ${block.width} rounded-[4px] ${block.color}`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1.5 translate-x-2">
                  <motion.div
                    initial={{ opacity: 0, y: -12, scale: 0.85 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      duration: 0.34,
                      delay: 0.14,
                      ease: MOTION_EASE_SETTLE,
                    }}
                    className="h-3.5 w-9 rounded-[4px] bg-[#C93B1E] dark:bg-[#F06449]"
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -12, scale: 0.85 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      duration: 0.34,
                      delay: 0.2,
                      ease: MOTION_EASE_SETTLE,
                    }}
                    className="h-3.5 w-9 rounded-[4px] bg-[#1F2937] dark:bg-[#94A3B8]"
                  />
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.06, ease: MOTION_EASE_SETTLE }}
                className="flex flex-col items-center"
              >
                <BrickLogo />
                <p className="mt-3 text-sm font-medium text-[#4B5563] dark:text-[#94A3B8]">
                  Conectando obras e profissionais em Rondonópolis-MT
                </p>
              </motion.div>

              {/* Smooth Compositor Progress Bar */}
              <div
                aria-hidden="true"
                className="mt-6 w-56 h-1.5 rounded-full bg-[#E5E7EB] dark:bg-[#1E293B] overflow-hidden"
              >
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.62, ease: MOTION_EASE_SETTLE }}
                  className="h-full w-full origin-left rounded-full bg-[#C93B1E] dark:bg-[#F06449]"
                />
              </div>

              <p className="mt-2.5 text-xs font-mono text-[#6B7280] dark:text-[#94A3B8]">
                Preparando vagas e portais...
              </p>

              {onSkipInitial && (
                <button
                  type="button"
                  onClick={onSkipInitial}
                  data-testid="skip-initial-loader-button"
                  className="mt-5 min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold text-[#4B5563] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F8FAFC] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Pular abertura
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Fluid Page-to-Page Transition Indicator */}
      <AnimatePresence>
        {!isInitialLoading && routeTransitionTarget && (
          <motion.div
            key={`route-loader-${routeTransitionTarget}`}
            data-testid="app-route-loader"
            role="status"
            aria-live="polite"
            variants={ROUTE_OVERLAY_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.16, ease: MOTION_EASE_SETTLE }}
            className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center px-6 bg-[#F4F5F7]/85 dark:bg-[#0B1120]/85 backdrop-blur-xs"
          >
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.18, ease: MOTION_EASE_SETTLE }}
              className="rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] shadow-lg px-6 py-4 flex items-center gap-3.5"
            >
              <motion.div
                animate={{ rotate: [0, -8, 8, 0] }}
                transition={{ duration: 0.36, ease: 'easeInOut' }}
                className="w-10 h-10 rounded-xl bg-[#C93B1E]/10 dark:bg-[#C93B1E]/20 text-[#C93B1E] dark:text-[#F06449] flex items-center justify-center shrink-0"
              >
                <HardHat className="w-5 h-5" aria-hidden="true" />
              </motion.div>
              <div className="min-w-0">
                <p className="font-display text-sm font-bold text-[#111827] dark:text-[#F8FAFC]">
                  {getRouteTransitionLabel(routeTransitionTarget)}
                </p>
                <div className="mt-1.5 w-36 h-1 rounded-full bg-[#E5E7EB] dark:bg-[#1E293B] overflow-hidden">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.24, ease: MOTION_EASE_SETTLE }}
                    className="h-full w-full origin-left rounded-full bg-[#C93B1E] dark:bg-[#F06449]"
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
