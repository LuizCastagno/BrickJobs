/**
 * @file src/components/NativePushPermissionCard.tsx
 * @description Cartão e banner de gerenciamento de permissão e preferência de notificações nativas do navegador.
 */

import React from 'react';
import { BellOff, BellRing, CheckCircle2, Send } from 'lucide-react';
import {
  getEffectivePushState,
  type NativePushPermission,
  type NativePushPreference,
} from '../utils/nativeNotifications';

interface NativePushPermissionCardProps {
  permission: NativePushPermission;
  preference: NativePushPreference;
  isRequesting?: boolean;
  statusFeedback?: string;
  onRequestPermission: () => void;
  onToggleEnabled: () => void;
  onDismissBanner?: () => void;
  onSendTestNotification: () => void;
  variant?: 'banner' | 'settings';
}

export const NativePushPermissionCard: React.FC<NativePushPermissionCardProps> = ({
  permission,
  preference,
  isRequesting = false,
  statusFeedback = '',
  onRequestPermission,
  onToggleEnabled,
  onDismissBanner,
  onSendTestNotification,
  variant = 'banner',
}) => {
  const effectiveState = getEffectivePushState(permission, preference);
  const isSettings = variant === 'settings';

  return (
    <section
      aria-label="Permissão de notificações push do navegador"
      data-testid={
        isSettings ? 'native-push-settings-card' : 'native-push-permission-card'
      }
      className={
        isSettings
          ? 'rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#0F172A] p-4 space-y-3'
          : 'rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] p-4 sm:p-5'
      }
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#C93B1E]/10 dark:bg-[#C93B1E]/20 text-[#C93B1E] dark:text-[#F06449] flex items-center justify-center shrink-0">
            {effectiveState === 'denied' || effectiveState === 'paused' ? (
              <BellOff className="w-5 h-5" aria-hidden="true" />
            ) : (
              <BellRing className="w-5 h-5" aria-hidden="true" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-sm sm:text-base font-bold text-[#111827] dark:text-[#F8FAFC]">
                {effectiveState === 'enabled'
                  ? 'Notificações em segundo plano ativas'
                  : effectiveState === 'paused'
                    ? 'Notificações em segundo plano pausadas'
                    : effectiveState === 'denied'
                      ? 'Notificações bloqueadas no navegador'
                      : effectiveState === 'unsupported'
                        ? 'Notificações nativas indisponíveis'
                        : 'Receba alertas mesmo com o app em segundo plano'}
              </h3>
              {effectiveState === 'enabled' && (
                <span className="text-xs font-semibold text-[#047857] dark:text-[#34D399] inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Permitido</span>
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-[#4B5563] dark:text-[#94A3B8] mt-1 leading-relaxed">
              {effectiveState === 'enabled'
                ? 'Você receberá alertas nativos do navegador quando uma candidatura for aceita ou surgirem novas vagas na sua região.'
                : effectiveState === 'paused'
                  ? 'A permissão do navegador está concedida, mas os alertas nativos estão pausados neste dispositivo.'
                  : effectiveState === 'denied'
                    ? 'O navegador bloqueou notificações para este site. Libere a permissão nas configurações do site na barra de endereço para receber alertas em segundo plano.'
                    : effectiveState === 'unsupported'
                      ? 'Este navegador ou modo de visualização não oferece suporte à API nativa de notificações.'
                      : 'Autorize as notificações nativas do navegador para ser avisado instantaneamente sobre candidaturas aceitas e novas vagas na região.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {effectiveState === 'default' && (
            <>
              {onDismissBanner && (
                <button
                  type="button"
                  onClick={onDismissBanner}
                  data-testid="dismiss-native-push-button"
                  className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#1E293B] hover:bg-[#F9FAFB] dark:hover:bg-[#334155] text-xs font-semibold text-[#4B5563] dark:text-[#CBD5E1] cursor-pointer whitespace-nowrap"
                >
                  Agora não
                </button>
              )}
              <button
                type="button"
                onClick={onRequestPermission}
                disabled={isRequesting}
                data-testid="enable-native-push-button"
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#C93B1E] hover:bg-[#B23319] disabled:opacity-60 text-white text-xs sm:text-sm font-semibold active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
              >
                {isRequesting ? 'Solicitando...' : 'Ativar notificações push'}
              </button>
            </>
          )}

          {effectiveState === 'enabled' && (
            <>
              <button
                type="button"
                onClick={onSendTestNotification}
                data-testid="test-native-push-button"
                className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#1E293B] hover:bg-[#F9FAFB] dark:hover:bg-[#334155] text-xs font-semibold text-[#111827] dark:text-[#F8FAFC] inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Send className="w-3.5 h-3.5 text-[#C93B1E] dark:text-[#F06449]" aria-hidden="true" />
                <span>Testar alerta</span>
              </button>
              <button
                type="button"
                onClick={onToggleEnabled}
                data-testid="toggle-native-push-button"
                className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#1E293B] hover:bg-[#F9FAFB] dark:hover:bg-[#334155] text-xs font-semibold text-[#4B5563] dark:text-[#CBD5E1] cursor-pointer whitespace-nowrap"
              >
                Pausar alertas
              </button>
            </>
          )}

          {effectiveState === 'paused' && (
            <button
              type="button"
              onClick={onToggleEnabled}
              data-testid="toggle-native-push-button"
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#111827] hover:bg-[#1F2937] dark:bg-[#F8FAFC] dark:hover:bg-[#E2E8F0] text-white dark:text-[#0F172A] text-xs sm:text-sm font-semibold cursor-pointer whitespace-nowrap"
            >
              Reativar alertas
            </button>
          )}
        </div>
      </div>

      {statusFeedback && (
        <p
          role="status"
          data-testid="native-push-status-feedback"
          className="mt-3 text-xs font-medium text-[#047857] dark:text-[#34D399]"
        >
          {statusFeedback}
        </p>
      )}
    </section>
  );
};
