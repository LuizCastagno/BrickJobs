/**
 * @file src/components/CookieConsentBanner.tsx
 * @description Banner inferior de consentimento de cookies e preferências de privacidade conforme a LGPD.
 */

import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Cookie, ShieldCheck } from 'lucide-react';
import type { LgpdModalTab } from '../utils/lgpdConsent';
import { MOTION_EASE_SETTLE } from '../utils/motionPresets';

interface CookieConsentBannerProps {
  visible: boolean;
  hasMobileBottomNav?: boolean;
  onAcceptAll: () => void;
  onAcceptEssentialOnly: () => void;
  onOpenLgpdModal: (tab: LgpdModalTab) => void;
}

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({
  visible,
  hasMobileBottomNav = false,
  onAcceptAll,
  onAcceptEssentialOnly,
  onOpenLgpdModal,
}) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          key="brickjobs-cookie-banner"
          data-testid="cookie-consent-banner"
          role="region"
          aria-label="Aviso de cookies e privacidade LGPD"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16, transition: { duration: 0.16, delay: 0 } }}
          transition={{ duration: 0.22, ease: MOTION_EASE_SETTLE }}
          className={`fixed inset-x-0 z-30 px-3 sm:px-6 pointer-events-none ${
            hasMobileBottomNav
              ? 'bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] md:bottom-4'
              : 'bottom-3 md:bottom-4'
          }`}
        >
          <div className="max-w-4xl mx-auto pointer-events-auto rounded-2xl border border-[#D1D5DB] dark:border-[#334155] bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md shadow-xl px-3.5 py-2.5 sm:px-5 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-start gap-2 min-w-0">
              <Cookie
                className="w-4 h-4 text-[#C93B1E] dark:text-[#F06449] shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <p className="text-xs text-[#374151] dark:text-[#CBD5E1] leading-snug">
                <strong className="text-[#111827] dark:text-[#F8FAFC]">
                  Cookies e LGPD:
                </strong>{' '}
                Usamos cookies essenciais e preferências locais.{' '}
                <button
                  type="button"
                  onClick={() => onOpenLgpdModal('dados-sensiveis')}
                  data-testid="cookie-banner-sensitive-link"
                  className="font-semibold text-[#C93B1E] dark:text-[#F06449] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Dados sensíveis</span>
                </button>
              </p>
            </div>

            <div className="grid grid-cols-3 sm:flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onOpenLgpdModal('cookies')}
                data-testid="cookie-banner-configure"
                className="min-h-[44px] sm:min-h-[40px] px-2.5 sm:px-3 py-1.5 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#1E293B] hover:bg-[#F3F4F6] dark:hover:bg-[#334155] text-xs font-semibold text-[#111827] dark:text-[#F8FAFC] whitespace-nowrap cursor-pointer"
              >
                Configurar
              </button>
              <button
                type="button"
                onClick={onAcceptEssentialOnly}
                data-testid="cookie-banner-essential"
                className="min-h-[44px] sm:min-h-[40px] px-2.5 sm:px-3 py-1.5 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] hover:bg-[#F9FAFB] dark:hover:bg-[#1E293B] text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] whitespace-nowrap cursor-pointer"
              >
                Essenciais
              </button>
              <button
                type="button"
                onClick={onAcceptAll}
                data-testid="cookie-banner-accept-all"
                className="min-h-[44px] sm:min-h-[40px] px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-[#C93B1E] hover:bg-[#B23319] text-white text-xs font-semibold whitespace-nowrap active:scale-[0.98] transition-all cursor-pointer"
              >
                Aceitar todos
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
