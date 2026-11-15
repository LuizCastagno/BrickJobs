import React, { useEffect } from 'react';
import { Check, Compass, Cookie, Moon, ShieldCheck, Sun, X } from 'lucide-react';
import {
  formatLgpdStatusSummary,
  type LgpdConsentState,
  type LgpdModalTab,
} from '../utils/lgpdConsent';
import type {
  NativePushPermission,
  NativePushPreference,
} from '../utils/nativeNotifications';
import type { ThemeMode } from '../utils/theme';
import { NativePushPermissionCard } from './NativePushPermissionCard';

interface UserSettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeMode;
  onChangeTheme: (theme: ThemeMode) => void;
  onRestartTour?: () => void;
  pushPermission: NativePushPermission;
  pushPreference: NativePushPreference;
  isRequestingPush: boolean;
  pushFeedback: string;
  onRequestPushPermission: () => void;
  onTogglePushEnabled: () => void;
  onTestNativePush: () => void;
  lgpdConsent: LgpdConsentState;
  onOpenLgpdModal: (tab: LgpdModalTab) => void;
}

export const UserSettingsMenu: React.FC<UserSettingsMenuProps> = ({
  isOpen,
  onClose,
  theme,
  onChangeTheme,
  onRestartTour,
  pushPermission,
  pushPreference,
  isRequestingPush,
  pushFeedback,
  onRequestPushPermission,
  onTogglePushEnabled,
  onTestNativePush,
  lgpdConsent,
  onOpenLgpdModal,
}) => {
  const lgpdSummary = formatLgpdStatusSummary(lgpdConsent);
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-settings-title"
        data-testid="user-settings-menu"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md max-h-[90dvh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#111827] border-t sm:border border-[#E5E7EB] dark:border-[#1E293B] shadow-xl px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:p-6 text-[#111827] dark:text-[#F8FAFC]"
      >
        {/* Native-style drag affordance on mobile bottom sheet */}
        <div
          aria-hidden="true"
          className="w-10 h-1.5 rounded-full bg-[#D1D5DB] dark:bg-[#334155] mx-auto mb-3 sm:hidden"
        />

        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E5E7EB] dark:border-[#1E293B]">
          <div>
            <h2
              id="user-settings-title"
              className="font-display text-lg font-bold text-[#111827] dark:text-[#F8FAFC]"
            >
              Configurações do usuário
            </h2>
            <p className="text-xs sm:text-sm text-[#4B5563] dark:text-[#94A3B8] mt-0.5">
              Personalize a aparência do BrickJobs para melhor conforto visual.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar configurações"
            className="min-w-[44px] min-h-[44px] rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#1E293B] hover:bg-[#F3F4F6] dark:hover:bg-[#334155] text-[#4B5563] dark:text-[#CBD5E1] flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#374151] dark:text-[#CBD5E1]">
              Tema de exibição
            </span>
            <span
              role="status"
              className="text-xs font-medium text-[#C93B1E] dark:text-[#F06449]"
            >
              {theme === 'dark' ? 'Modo escuro ativo' : 'Modo claro ativo'}
            </span>
          </div>

          <div
            role="radiogroup"
            aria-label="Seletor de tema claro ou escuro"
            data-testid="theme-selector-group"
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            <button
              type="button"
              role="radio"
              aria-checked={theme === 'light'}
              data-testid="theme-option-light"
              onClick={() => onChangeTheme('light')}
              className={`min-h-[68px] p-3.5 rounded-xl border text-left transition-all active:scale-[0.99] cursor-pointer flex items-start justify-between gap-2 ${
                theme === 'light'
                  ? 'border-[#C93B1E] bg-[#C93B1E]/5 dark:bg-[#C93B1E]/15 text-[#111827] dark:text-[#F8FAFC]'
                  : 'border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-[#374151] dark:text-[#CBD5E1] hover:border-[#111827] dark:hover:border-[#64748B]'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <Sun
                  className={`w-4 h-4 mt-0.5 shrink-0 ${
                    theme === 'light'
                      ? 'text-[#C93B1E] dark:text-[#F06449]'
                      : 'text-[#6B7280] dark:text-[#94A3B8]'
                  }`}
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-semibold text-[#111827] dark:text-[#F8FAFC]">
                    Tema Claro
                  </p>
                  <p className="text-xs text-[#4B5563] dark:text-[#94A3B8] mt-0.5">
                    Alto contraste diurno
                  </p>
                </div>
              </div>
              {theme === 'light' && (
                <Check
                  className="w-4 h-4 text-[#C93B1E] dark:text-[#F06449] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
              )}
            </button>

            <button
              type="button"
              role="radio"
              aria-checked={theme === 'dark'}
              data-testid="theme-option-dark"
              onClick={() => onChangeTheme('dark')}
              className={`min-h-[68px] p-3.5 rounded-xl border text-left transition-all active:scale-[0.99] cursor-pointer flex items-start justify-between gap-2 ${
                theme === 'dark'
                  ? 'border-[#C93B1E] dark:border-[#F06449] bg-[#C93B1E]/5 dark:bg-[#C93B1E]/15 text-[#111827] dark:text-[#F8FAFC]'
                  : 'border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-[#374151] dark:text-[#CBD5E1] hover:border-[#111827] dark:hover:border-[#64748B]'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <Moon
                  className={`w-4 h-4 mt-0.5 shrink-0 ${
                    theme === 'dark'
                      ? 'text-[#C93B1E] dark:text-[#F06449]'
                      : 'text-[#6B7280] dark:text-[#94A3B8]'
                  }`}
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-semibold text-[#111827] dark:text-[#F8FAFC]">
                    Tema Escuro
                  </p>
                  <p className="text-xs text-[#4B5563] dark:text-[#94A3B8] mt-0.5">
                    Conforto visual noturno
                  </p>
                </div>
              </div>
              {theme === 'dark' && (
                <Check
                  className="w-4 h-4 text-[#C93B1E] dark:text-[#F06449] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
              )}
            </button>
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <span className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1]">
            Notificações push nativas
          </span>
          <NativePushPermissionCard
            variant="settings"
            permission={pushPermission}
            preference={pushPreference}
            isRequesting={isRequestingPush}
            statusFeedback={pushFeedback}
            onRequestPermission={onRequestPushPermission}
            onToggleEnabled={onTogglePushEnabled}
            onSendTestNotification={onTestNativePush}
          />
        </div>

        <div className="mt-5 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#374151] dark:text-[#CBD5E1]">
              Privacidade, Cookies e LGPD
            </span>
            <span className="text-xs font-medium text-[#4B5563] dark:text-[#94A3B8]">
              {lgpdSummary.cookiesLabel}
            </span>
          </div>

          <div className="rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#0F172A] p-3.5 space-y-2.5">
            <p className="text-xs text-[#4B5563] dark:text-[#94A3B8]">
              Dados sensíveis (Art. 11 LGPD):{' '}
              <strong className="text-[#111827] dark:text-[#F8FAFC]">
                {lgpdSummary.sensitiveLabel}
              </strong>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenLgpdModal('cookies');
                }}
                data-testid="settings-open-cookies-lgpd"
                className="min-h-[44px] px-3 py-2 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#111827] hover:bg-[#F3F4F6] dark:hover:bg-[#1E293B] text-xs font-semibold text-[#111827] dark:text-[#F8FAFC] inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Cookie className="w-3.5 h-3.5 text-[#C93B1E] dark:text-[#F06449]" aria-hidden="true" />
                <span>Gerenciar Cookies</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenLgpdModal('dados-sensiveis');
                }}
                data-testid="settings-open-sensitive-lgpd"
                className="min-h-[44px] px-3 py-2 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#111827] hover:bg-[#F3F4F6] dark:hover:bg-[#1E293B] text-xs font-semibold text-[#111827] dark:text-[#F8FAFC] inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#047857] dark:text-[#34D399]" aria-hidden="true" />
                <span>Dados Sensíveis (LGPD)</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[#E5E7EB] dark:border-[#1E293B] flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5">
          {onRestartTour ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onRestartTour();
              }}
              data-testid="restart-guided-tour-button"
              className="w-full sm:w-auto min-h-[48px] sm:min-h-[44px] px-4 py-2.5 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#1E293B] hover:bg-[#F3F4F6] dark:hover:bg-[#334155] text-[#111827] dark:text-[#F8FAFC] text-sm font-semibold inline-flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Compass className="w-4 h-4 text-[#C93B1E] dark:text-[#F06449]" aria-hidden="true" />
              <span>Rever Tour Guiado</span>
            </button>
          ) : (
            <span />
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto min-h-[48px] sm:min-h-[44px] px-5 py-2.5 rounded-xl bg-[#111827] hover:bg-[#1F2937] dark:bg-[#F8FAFC] dark:hover:bg-[#E2E8F0] text-white dark:text-[#0F172A] text-sm font-semibold active:scale-[0.98] transition-all cursor-pointer"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
