/**
 * @file src/components/AppErrorScreen.tsx
 * @description Tela dedicada de erro de carregamento e falhas inesperadas do BrickJobs, com
 *   diagnóstico amigável, detecção de conexão offline, ações de recuperação e detalhes técnicos copiáveis.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  HardDrive,
  Home,
  RefreshCw,
  RotateCcw,
  WifiOff,
} from 'lucide-react';
import {
  classifyAppError,
  formatErrorReportText,
} from '../utils/appErrorHandling';
import { BrickLogo } from './BrickLogo';

export interface AppErrorScreenProps {
  error: unknown;
  scope?: 'app' | 'portal';
  onRetry?: () => void;
  onBackToCover?: () => void;
  onReload?: () => void;
}

export const AppErrorScreen: React.FC<AppErrorScreenProps> = ({
  error,
  scope = 'app',
  onRetry,
  onBackToCover,
  onReload,
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [occurredAt] = useState<string>(() => new Date().toISOString());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const descriptor = useMemo(
    () => classifyAppError(error, { isOnline, scope }),
    [error, isOnline, scope]
  );

  const reportText = useMemo(
    () => formatErrorReportText(descriptor, occurredAt),
    [descriptor, occurredAt]
  );

  const handleReloadPage = () => {
    if (onReload) {
      onReload();
      return;
    }
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const handleCopyReport = async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard indisponível no contexto atual
    }
  };

  const CategoryIcon =
    descriptor.category === 'network'
      ? WifiOff
      : descriptor.category === 'storage'
        ? HardDrive
        : AlertTriangle;

  const isPortalScope = scope === 'portal';

  return (
    <div
      role="alert"
      aria-live="assertive"
      data-testid="app-error-screen"
      className={
        isPortalScope
          ? 'max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16 w-full'
          : 'min-h-dvh w-full bg-[#F4F5F7] dark:bg-[#0B1120] text-[#111827] dark:text-[#F8FAFC] flex flex-col items-center justify-center px-4 sm:px-6 py-10'
      }
    >
      <div className="w-full max-w-xl mx-auto">
        {!isPortalScope && (
          <div className="flex items-center justify-center mb-6">
            <BrickLogo />
          </div>
        )}

        <section className="rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] shadow-sm p-6 sm:p-8">
          {/* Header & Status Badge */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#FEF2F2] dark:bg-[#7F1D1D]/30 border border-[#FECACA] dark:border-[#991B1B]/60 text-xs font-semibold text-[#B91C1C] dark:text-[#FCA5A5]">
              <CategoryIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{descriptor.badgeLabel}</span>
            </div>

            <span className="text-xs font-mono text-[#6B7280] dark:text-[#94A3B8]">
              {descriptor.code}
            </span>
          </div>

          {/* Main Error Message */}
          <div className="mt-5 flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#C93B1E]/10 dark:bg-[#C93B1E]/20 text-[#C93B1E] dark:text-[#F06449] flex items-center justify-center shrink-0">
              <CategoryIcon className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-xl sm:text-2xl font-bold text-[#111827] dark:text-[#F8FAFC] leading-snug">
                {descriptor.title}
              </h1>
              <p className="mt-2 text-sm text-[#4B5563] dark:text-[#CBD5E1] leading-relaxed">
                {descriptor.description}
              </p>
            </div>
          </div>

          {/* Practical Guidance */}
          {descriptor.guidance.length > 0 && (
            <div className="mt-5 rounded-xl bg-[#F9FAFB] dark:bg-[#1E293B]/60 border border-[#E5E7EB] dark:border-[#334155] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#4B5563] dark:text-[#94A3B8]">
                Como resolver
              </p>
              <ul className="mt-2 space-y-1.5 text-sm text-[#374151] dark:text-[#E2E8F0]">
                {descriptor.guidance.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#C93B1E] dark:bg-[#F06449] shrink-0"
                    />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row sm:flex-wrap gap-3">
            {descriptor.preferReload || !onRetry ? (
              <>
                <button
                  type="button"
                  onClick={handleReloadPage}
                  data-testid="error-screen-reload"
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#C93B1E] hover:bg-[#B23117] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Recarregar página</span>
                </button>
                {onRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    data-testid="error-screen-retry"
                    className="min-h-[44px] px-5 py-2.5 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#1E293B] hover:bg-[#F9FAFB] dark:hover:bg-[#334155] text-[#111827] dark:text-[#F8FAFC] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Tentar novamente</span>
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onRetry}
                  data-testid="error-screen-retry"
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#C93B1E] hover:bg-[#B23117] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Tentar novamente</span>
                </button>
                <button
                  type="button"
                  onClick={handleReloadPage}
                  data-testid="error-screen-reload"
                  className="min-h-[44px] px-5 py-2.5 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#1E293B] hover:bg-[#F9FAFB] dark:hover:bg-[#334155] text-[#111827] dark:text-[#F8FAFC] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Recarregar página</span>
                </button>
              </>
            )}

            {onBackToCover && (
              <button
                type="button"
                onClick={onBackToCover}
                data-testid="error-screen-home"
                className="min-h-[44px] px-4 py-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#0F172A] hover:bg-[#F3F4F6] dark:hover:bg-[#1E293B] text-[#374151] dark:text-[#CBD5E1] text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Home className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Voltar para a capa</span>
              </button>
            )}
          </div>

          {/* Technical Details Disclosure */}
          <div className="mt-6 pt-4 border-t border-[#E5E7EB] dark:border-[#1E293B]">
            <button
              type="button"
              onClick={() => setShowDetails((prev) => !prev)}
              aria-expanded={showDetails}
              data-testid="error-screen-details-toggle"
              className="min-h-[40px] inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B7280] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F8FAFC] transition-colors cursor-pointer"
            >
              {showDetails ? (
                <ChevronUp className="w-4 h-4" aria-hidden="true" />
              ) : (
                <ChevronDown className="w-4 h-4" aria-hidden="true" />
              )}
              <span>
                {showDetails ? 'Ocultar detalhes técnicos' : 'Ver detalhes técnicos'}
              </span>
            </button>

            {showDetails && (
              <div
                data-testid="error-screen-details-panel"
                className="mt-3 rounded-xl bg-[#F3F4F6] dark:bg-[#0B1120] border border-[#E5E7EB] dark:border-[#1E293B] p-3.5"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-mono text-[#6B7280] dark:text-[#94A3B8]">
                    Registro do erro
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyReport}
                    className="min-h-[32px] px-2.5 py-1 rounded-lg bg-white dark:bg-[#1E293B] border border-[#D1D5DB] dark:border-[#334155] text-[11px] font-semibold text-[#374151] dark:text-[#E2E8F0] inline-flex items-center gap-1.5 hover:bg-[#F9FAFB] dark:hover:bg-[#334155] transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Copiar detalhes</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="text-[11px] font-mono text-[#374151] dark:text-[#CBD5E1] whitespace-pre-wrap break-words overflow-x-auto max-h-40">
                  {reportText}
                </pre>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
