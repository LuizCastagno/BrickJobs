/**
 * @file src/components/LgpdPrivacyModal.tsx
 * @description Modal completo de transparência LGPD, gerenciamento granular de cookies e consulta aos direitos do titular e dados sensíveis.
 */

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Check,
  Cookie,
  Lock,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  COOKIE_CATEGORIES,
  LGPD_POLICY_VERSION,
  SENSITIVE_DATA_ITEMS,
  TITULAR_RIGHTS_ART18,
  formatConsentTimestampPtBr,
  formatLgpdStatusSummary,
  type LgpdConsentState,
  type LgpdModalTab,
} from '../utils/lgpdConsent';
import {
  CHAT_BACKDROP_TRANSITION,
  CHAT_MODAL_TRANSITION,
  CHAT_MODAL_VARIANTS,
  TAB_TRANSITION_CONFIG,
  TAB_TRANSITION_VARIANTS,
} from '../utils/motionPresets';

interface LgpdPrivacyModalProps {
  isOpen: boolean;
  initialTab: LgpdModalTab;
  consent: LgpdConsentState;
  onClose: () => void;
  onAcceptAllCookies: () => void;
  onRejectOptionalCookies: () => void;
  onSaveCookiePreferences: (prefs: {
    funcionais: boolean;
    analiticos: boolean;
  }) => void;
  onSetSensitiveConsent: (granted: boolean) => void;
  onResetAllLgpd: () => void;
}

export const LgpdPrivacyModal: React.FC<LgpdPrivacyModalProps> = ({
  isOpen,
  initialTab,
  consent,
  onClose,
  onAcceptAllCookies,
  onRejectOptionalCookies,
  onSaveCookiePreferences,
  onSetSensitiveConsent,
  onResetAllLgpd,
}) => {
  const [activeTab, setActiveTab] = useState<LgpdModalTab>(initialTab);
  const [draftFuncionais, setDraftFuncionais] = useState<boolean>(
    consent.cookies.funcionais
  );
  const [draftAnaliticos, setDraftAnaliticos] = useState<boolean>(
    consent.cookies.analiticos
  );
  const [draftSensitiveChecked, setDraftSensitiveChecked] = useState<boolean>(
    consent.sensitiveDataConsent
  );
  const [feedback, setFeedback] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab(initialTab);
    setFeedback('');
    setValidationError('');
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen) return;
    setDraftFuncionais(consent.cookies.funcionais);
    setDraftAnaliticos(consent.cookies.analiticos);
    setDraftSensitiveChecked(consent.sensitiveDataConsent);
  }, [
    isOpen,
    consent.cookies.funcionais,
    consent.cookies.analiticos,
    consent.sensitiveDataConsent,
  ]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const statusSummary = formatLgpdStatusSummary(consent);

  const handleSaveCustomCookies = () => {
    setValidationError('');
    onSaveCookiePreferences({
      funcionais: draftFuncionais,
      analiticos: draftAnaliticos,
    });
    setFeedback('Preferências de cookies salvas neste dispositivo.');
  };

  const handleAcceptAll = () => {
    setValidationError('');
    setDraftFuncionais(true);
    setDraftAnaliticos(true);
    onAcceptAllCookies();
    setFeedback('Todos os cookies foram habilitados.');
  };

  const handleRejectOptional = () => {
    setValidationError('');
    setDraftFuncionais(false);
    setDraftAnaliticos(false);
    onRejectOptionalCookies();
    setFeedback('Apenas cookies essenciais permaneceram ativos.');
  };

  const handleConfirmSensitive = () => {
    if (!draftSensitiveChecked) {
      setValidationError(
        'Marque a caixa de autorização expressa acima para confirmar o consentimento (Art. 11 da LGPD).'
      );
      return;
    }
    setValidationError('');
    onSetSensitiveConsent(true);
    setFeedback(
      'Consentimento para tratamento de dados pessoais sensíveis registrado conforme a LGPD.'
    );
  };

  const handleRevokeSensitive = () => {
    setValidationError('');
    setDraftSensitiveChecked(false);
    onSetSensitiveConsent(false);
    setFeedback(
      'Autorização para dados pessoais sensíveis revogada com sucesso (Art. 18, IX da LGPD).'
    );
  };

  const handleResetAll = () => {
    setValidationError('');
    setDraftFuncionais(false);
    setDraftAnaliticos(false);
    setDraftSensitiveChecked(false);
    onResetAllLgpd();
    setFeedback(
      'Preferências locais de cookies e consentimento LGPD redefinidas neste dispositivo.'
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="lgpd-privacy-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.16, delay: 0 } }}
          transition={CHAT_BACKDROP_TRANSITION}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/55 backdrop-blur-xs"
        >
          <motion.div
            key="lgpd-privacy-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="lgpd-modal-title"
            data-testid="lgpd-privacy-modal"
            variants={CHAT_MODAL_VARIANTS}
            initial="initial"
            animate="animate"
            exit={{
              ...CHAT_MODAL_VARIANTS.exit,
              transition: { duration: 0.16, delay: 0 },
            }}
            transition={CHAT_MODAL_TRANSITION}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-2xl max-h-[92dvh] flex flex-col rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#111827] border-t sm:border border-[#E5E7EB] dark:border-[#1E293B] shadow-2xl text-[#111827] dark:text-[#F8FAFC] overflow-hidden"
          >
            {/* Mobile bottom-sheet drag handle */}
            <div
              aria-hidden="true"
              className="w-10 h-1.5 rounded-full bg-[#D1D5DB] dark:bg-[#334155] mx-auto mt-3 sm:hidden shrink-0"
            />

            {/* Header */}
            <div className="px-5 pt-4 pb-3 sm:px-6 sm:pt-5 sm:pb-4 border-b border-[#E5E7EB] dark:border-[#1E293B] flex items-start justify-between gap-4 shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <ShieldCheck
                    className="w-5 h-5 text-[#C93B1E] dark:text-[#F06449] shrink-0"
                    aria-hidden="true"
                  />
                  <h2
                    id="lgpd-modal-title"
                    className="font-display text-lg sm:text-xl font-bold text-[#111827] dark:text-[#F8FAFC]"
                  >
                    Central de Privacidade e LGPD
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-[#4B5563] dark:text-[#94A3B8] mt-1">
                  Conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018) · Política v{LGPD_POLICY_VERSION}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar central de privacidade LGPD"
                className="min-w-[44px] min-h-[44px] rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#1E293B] hover:bg-[#F3F4F6] dark:hover:bg-[#334155] text-[#4B5563] dark:text-[#CBD5E1] flex items-center justify-center cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {/* Section Tabs */}
            <div
              role="tablist"
              aria-label="Seções de privacidade LGPD"
              className="px-4 sm:px-6 pt-2.5 pb-0 border-b border-[#E5E7EB] dark:border-[#1E293B] grid grid-cols-2 sm:flex sm:items-center gap-1 sm:gap-2 shrink-0"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'cookies'}
                data-testid="lgpd-tab-cookies"
                onClick={() => {
                  setActiveTab('cookies');
                  setFeedback('');
                  setValidationError('');
                }}
                className={`min-h-[44px] px-2 sm:px-3.5 py-2 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap inline-flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 cursor-pointer ${
                  activeTab === 'cookies'
                    ? 'border-[#C93B1E] dark:border-[#F06449] text-[#C93B1E] dark:text-[#F06449]'
                    : 'border-transparent text-[#4B5563] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F8FAFC]'
                }`}
              >
                <Cookie className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" aria-hidden="true" />
                <span className="sm:hidden">Cookies</span>
                <span className="hidden sm:inline">1. Permissões de Cookies</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'dados-sensiveis'}
                data-testid="lgpd-tab-sensitive"
                onClick={() => {
                  setActiveTab('dados-sensiveis');
                  setFeedback('');
                  setValidationError('');
                }}
                className={`min-h-[44px] px-2 sm:px-3.5 py-2 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap inline-flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 cursor-pointer ${
                  activeTab === 'dados-sensiveis'
                    ? 'border-[#C93B1E] dark:border-[#F06449] text-[#C93B1E] dark:text-[#F06449]'
                    : 'border-transparent text-[#4B5563] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F8FAFC]'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" aria-hidden="true" />
                <span className="sm:hidden">Dados Sensíveis (LGPD)</span>
                <span className="hidden sm:inline">2. Dados Sensíveis (LGPD)</span>
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5 space-y-4">
              {feedback && (
                <div
                  role="status"
                  data-testid="lgpd-modal-feedback"
                  className="p-3 rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B]/40 border border-[#A7F3D0] dark:border-[#065F46] text-xs sm:text-sm font-medium text-[#047857] dark:text-[#34D399] flex items-center gap-2"
                >
                  <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{feedback}</span>
                </div>
              )}

              {validationError && (
                <p
                  role="alert"
                  className="p-3 rounded-xl bg-[#FEF2F2] dark:bg-[#7F1D1D]/30 border border-[#FECACA] dark:border-[#991B1B] text-xs sm:text-sm font-medium text-[#B91C1C] dark:text-[#FCA5A5]"
                >
                  {validationError}
                </p>
              )}

              <AnimatePresence mode="wait" initial={false}>
                {activeTab === 'cookies' ? (
                  <motion.div
                    key="lgpd-panel-cookies"
                    variants={TAB_TRANSITION_VARIANTS}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={TAB_TRANSITION_CONFIG}
                    className="space-y-4"
                  >
                    <div className="rounded-xl bg-[#F9FAFB] dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#1E293B] p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-[#4B5563] dark:text-[#94A3B8]">
                        Status atual:{' '}
                        <strong className="text-[#111827] dark:text-[#F8FAFC]">
                          {statusSummary.cookiesLabel}
                        </strong>
                      </span>
                      <span className="text-[#6B7280] dark:text-[#94A3B8] tabular-nums">
                        Atualizado: {formatConsentTimestampPtBr(consent.cookiesAnsweredAt)}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {COOKIE_CATEGORIES.map((cat) => {
                        const isChecked =
                          cat.id === 'essenciais'
                            ? true
                            : cat.id === 'funcionais'
                              ? draftFuncionais
                              : draftAnaliticos;

                        const handleToggle = () => {
                          if (cat.required) return;
                          if (cat.id === 'funcionais') {
                            setDraftFuncionais((v) => !v);
                          } else {
                            setDraftAnaliticos((v) => !v);
                          }
                        };

                        return (
                          <div
                            key={cat.id}
                            className="rounded-xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] p-4 flex items-start justify-between gap-4"
                          >
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-sm font-bold text-[#111827] dark:text-[#F8FAFC]">
                                  {cat.title}
                                </h3>
                                {cat.required && (
                                  <span className="text-xs font-semibold text-[#047857] dark:text-[#34D399] inline-flex items-center gap-1">
                                    <Lock className="w-3 h-3" aria-hidden="true" />
                                    Sempre ativo
                                  </span>
                                )}
                              </div>
                              <p className="text-xs sm:text-sm text-[#4B5563] dark:text-[#94A3B8] mt-1 leading-relaxed">
                                {cat.description}
                              </p>
                              <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-1.5">
                                <strong className="text-[#374151] dark:text-[#CBD5E1]">
                                  Exemplos:
                                </strong>{' '}
                                {cat.examples}
                              </p>
                            </div>

                            {cat.required ? (
                              <span
                                aria-label="Cookies essenciais sempre ativos"
                                className="min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0 text-[#047857] dark:text-[#34D399]"
                              >
                                <Check className="w-5 h-5" aria-hidden="true" />
                              </span>
                            ) : (
                              <button
                                type="button"
                                role="switch"
                                aria-checked={isChecked}
                                aria-label={`Alternar ${cat.title}`}
                                data-testid={`cookie-switch-${cat.id}`}
                                onClick={handleToggle}
                                className={`relative min-w-[48px] h-7 rounded-full transition-colors p-0.5 cursor-pointer shrink-0 mt-0.5 ${
                                  isChecked
                                    ? 'bg-[#C93B1E] dark:bg-[#F06449]'
                                    : 'bg-[#D1D5DB] dark:bg-[#334155]'
                                }`}
                              >
                                <span
                                  className={`block w-6 h-6 rounded-full bg-white shadow-xs transition-transform ${
                                    isChecked ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                                />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <button
                        type="button"
                        onClick={handleRejectOptional}
                        data-testid="lgpd-reject-optional-cookies"
                        className="min-h-[44px] px-4 py-2 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] hover:bg-[#F9FAFB] dark:hover:bg-[#1E293B] text-xs sm:text-sm font-semibold text-[#111827] dark:text-[#F8FAFC] cursor-pointer"
                      >
                        Apenas essenciais
                      </button>

                      <div className="flex flex-col sm:flex-row gap-2.5">
                        <button
                          type="button"
                          onClick={handleSaveCustomCookies}
                          data-testid="lgpd-save-cookie-preferences"
                          className="min-h-[44px] px-4 py-2 rounded-xl border border-[#111827] dark:border-[#F8FAFC] text-xs sm:text-sm font-semibold text-[#111827] dark:text-[#F8FAFC] hover:bg-[#F3F4F6] dark:hover:bg-[#1E293B] cursor-pointer"
                        >
                          Salvar preferências
                        </button>
                        <button
                          type="button"
                          onClick={handleAcceptAll}
                          data-testid="lgpd-accept-all-cookies"
                          className="min-h-[44px] px-4 py-2 rounded-xl bg-[#C93B1E] hover:bg-[#B23319] text-white text-xs sm:text-sm font-semibold cursor-pointer"
                        >
                          Aceitar todos
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="lgpd-panel-sensitive"
                    variants={TAB_TRANSITION_VARIANTS}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={TAB_TRANSITION_CONFIG}
                    className="space-y-4"
                  >
                    <div className="rounded-xl bg-[#F9FAFB] dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#1E293B] p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-[#4B5563] dark:text-[#94A3B8]">
                        Tratamento de dados sensíveis:{' '}
                        <strong
                          className={
                            consent.sensitiveDataConsent
                              ? 'text-[#047857] dark:text-[#34D399]'
                              : 'text-[#C93B1E] dark:text-[#F06449]'
                          }
                        >
                          {statusSummary.sensitiveLabel}
                        </strong>
                      </span>
                      <span className="text-[#6B7280] dark:text-[#94A3B8] tabular-nums">
                        Registro: {formatConsentTimestampPtBr(consent.sensitiveDataAnsweredAt)}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-[#374151] dark:text-[#CBD5E1] leading-relaxed">
                      Nos termos do <strong>Art. 5º, II e Art. 11 da LGPD (Lei nº 13.709/2018)</strong>, o tratamento de dados pessoais sensíveis e informações de geolocalização ou saúde ocupacional (NRs) exige{' '}
                      <strong>consentimento específico e destacado</strong> para finalidade determinada.
                    </p>

                    <div className="space-y-3">
                      {SENSITIVE_DATA_ITEMS.map((item) => (
                        <article
                          key={item.id}
                          className="rounded-xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] p-4 space-y-1.5"
                        >
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <h3 className="text-sm font-bold text-[#111827] dark:text-[#F8FAFC]">
                              {item.title}
                            </h3>
                            <span className="text-xs font-medium text-[#C93B1E] dark:text-[#F06449]">
                              {item.legalNote}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-[#4B5563] dark:text-[#94A3B8]">
                            <strong className="text-[#111827] dark:text-[#F8FAFC]">
                              Finalidade:
                            </strong>{' '}
                            {item.purpose}
                          </p>
                          <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">
                            <strong className="text-[#374151] dark:text-[#CBD5E1]">
                              Armazenamento e segurança:
                            </strong>{' '}
                            {item.retention}
                          </p>
                        </article>
                      ))}
                    </div>

                    {/* Art. 18 Titular Rights */}
                    <div className="rounded-xl border border-[#E5E7EB] dark:border-[#1E293B] bg-[#F9FAFB] dark:bg-[#0F172A] p-4">
                      <h3 className="text-xs font-bold uppercase tracking-wide text-[#374151] dark:text-[#CBD5E1]">
                        Seus direitos como titular (Art. 18 da LGPD)
                      </h3>
                      <ul className="mt-2 space-y-1.5 text-xs sm:text-sm text-[#4B5563] dark:text-[#94A3B8] list-disc pl-5">
                        {TITULAR_RIGHTS_ART18.map((right) => (
                          <li key={right}>{right}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Specific & Highlighted Consent Checkbox (Art. 11, I) */}
                    <label
                      data-testid="lgpd-sensitive-checkbox-label"
                      className={`p-4 rounded-xl border-2 flex items-start gap-3 cursor-pointer transition-colors ${
                        draftSensitiveChecked
                          ? 'border-[#047857] dark:border-[#34D399] bg-[#ECFDF5]/60 dark:bg-[#064E3B]/25'
                          : 'border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={draftSensitiveChecked}
                        onChange={(e) => {
                          setDraftSensitiveChecked(e.target.checked);
                          if (validationError) setValidationError('');
                        }}
                        data-testid="lgpd-sensitive-checkbox"
                        className="w-5 h-5 mt-0.5 accent-[#047857] rounded shrink-0 cursor-pointer"
                      />
                      <span className="text-xs sm:text-sm font-medium text-[#111827] dark:text-[#F8FAFC] leading-relaxed">
                        Autorizo, de forma livre, informada e inequívoca (Art. 11, I da LGPD), o tratamento dos dados pessoais sensíveis, documentos de currículo em PDF e informações de proximidade geográfica fornecidos por mim no BrickJobs exclusivamente para recrutamento e segurança em obras em Rondonópolis-MT.
                      </span>
                    </label>

                    <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <button
                        type="button"
                        onClick={handleResetAll}
                        data-testid="lgpd-reset-all-button"
                        className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#E5E7EB] dark:border-[#334155] hover:bg-[#F9FAFB] dark:hover:bg-[#1E293B] text-xs font-semibold text-[#4B5563] dark:text-[#CBD5E1] inline-flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>Redefinir preferências locais</span>
                      </button>

                      <div className="flex flex-col sm:flex-row gap-2.5">
                        {consent.sensitiveDataConsent && (
                          <button
                            type="button"
                            onClick={handleRevokeSensitive}
                            data-testid="lgpd-revoke-sensitive-button"
                            className="min-h-[44px] px-4 py-2 rounded-xl border border-[#FECACA] dark:border-[#991B1B] bg-white dark:bg-[#0F172A] hover:bg-[#FEF2F2] dark:hover:bg-[#7F1D1D]/30 text-xs sm:text-sm font-semibold text-[#B91C1C] dark:text-[#FCA5A5] cursor-pointer"
                          >
                            Revogar autorização
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleConfirmSensitive}
                          data-testid="lgpd-confirm-sensitive-button"
                          className="min-h-[44px] px-5 py-2 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white text-xs sm:text-sm font-semibold cursor-pointer"
                        >
                          Confirmar consentimento LGPD
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
