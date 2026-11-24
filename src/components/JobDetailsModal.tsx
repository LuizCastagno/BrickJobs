/**
 * @file src/components/JobDetailsModal.tsx
 * @description Modal de visualização completa de detalhes da vaga no Portal do Trabalhador,
 *   com compartilhamento nativo via Web Share API, fallback para WhatsApp/área de transferência
 *   e ações de candidatura, chat e avaliação.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Briefcase,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Flame,
  MapPin,
  MessageSquare,
  Phone,
  Share2,
  Star,
  Wallet,
  X,
} from 'lucide-react';
import type {
  CompanyRating,
  JobApplication,
  JobPosting,
} from '../types/brickjobs';
import { formatDistanceKmPtBr } from '../utils/geolocation';
import { getJobPriorityMeta } from '../utils/jobPriority';
import {
  buildJobSharePayload,
  copyJobShareText,
  shareJobPosting,
  type JobShareResult,
} from '../utils/jobShare';
import {
  CHAT_BACKDROP_TRANSITION,
  CHAT_MODAL_TRANSITION,
  CHAT_MODAL_VARIANTS,
} from '../utils/motionPresets';
import {
  canCompleteWork,
  canRateCompanyForApplication,
  computeCompanyRatingSummary,
  getRatingForApplication,
} from '../utils/ratings';
import { formatCompetencyList, formatSkillTagLabel, getJobSkillTags } from '../utils/skillTags';
import { ProfileAvatar } from './ProfileAvatar';

interface JobDetailsModalProps {
  job: JobPosting | null;
  distanceKm?: number;
  existingApplication?: JobApplication;
  companyRatings: CompanyRating[];
  unreadChatCount?: number;
  onClose: () => void;
  onApply: (job: JobPosting) => void;
  onOpenChat: (applicationId: string) => void;
  onCompleteApplication: (applicationId: string) => void;
  onOpenRatingModal: (applicationId: string) => void;
}

export const JobDetailsModal: React.FC<JobDetailsModalProps> = ({
  job,
  distanceKm,
  existingApplication,
  companyRatings,
  unreadChatCount = 0,
  onClose,
  onApply,
  onOpenChat,
  onCompleteApplication,
  onOpenRatingModal,
}) => {
  const [shareFeedback, setShareFeedback] = useState<JobShareResult | null>(null);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [copiedManual, setCopiedManual] = useState<boolean>(false);

  useEffect(() => {
    setShareFeedback(null);
    setCopiedManual(false);
    setIsSharing(false);
  }, [job?.id]);

  useEffect(() => {
    if (!job || typeof window === 'undefined') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [job, onClose]);

  const sharePayload = useMemo(
    () => (job ? buildJobSharePayload(job) : null),
    [job]
  );

  const companyRatingSummary = useMemo(
    () =>
      job
        ? computeCompanyRatingSummary(
            companyRatings,
            job.companyId,
            job.companyName
          )
        : null,
    [companyRatings, job]
  );

  const handleShareClick = async () => {
    if (!job || isSharing) return;
    setIsSharing(true);
    setCopiedManual(false);
    try {
      const result = await shareJobPosting(job);
      setShareFeedback(result);
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyManual = async () => {
    if (!sharePayload) return;
    const ok = await copyJobShareText(sharePayload.clipboardText);
    if (ok) {
      setCopiedManual(true);
    }
  };

  const isAccepted = existingApplication?.status === 'aceita';
  const isCompleted = existingApplication?.status === 'concluida';
  const canOpenChat = isAccepted || isCompleted;
  const existingRating = existingApplication
    ? getRatingForApplication(companyRatings, existingApplication.id)
    : undefined;
  const priorityMeta = job ? getJobPriorityMeta(job.prioridade) : null;
  const isUrgent = priorityMeta?.value === 'urgente';

  return (
    <AnimatePresence>
      {job && sharePayload && companyRatingSummary && (
        <motion.div
          key="job-details-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={CHAT_BACKDROP_TRANSITION}
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={onClose}
        >
          <motion.div
            key={`job-details-dialog-${job.id}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="job-details-modal-title"
            data-testid="job-details-modal"
            variants={CHAT_MODAL_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={CHAT_MODAL_TRANSITION}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] shadow-xl flex flex-col"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-xs border-b border-[#E5E7EB] dark:border-[#1E293B] px-5 py-4 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <ProfileAvatar
                  name={job.companyName}
                  photoUrl={job.companyPhotoUrl}
                  entityType="company"
                  size="md"
                  className="mt-0.5"
                />
                <div className="min-w-0">
                  {priorityMeta?.isHighlighted && (
                    <p
                      className={`mb-1 inline-flex items-center gap-1 text-xs font-bold ${
                        isUrgent
                          ? 'text-[#C93B1E] dark:text-[#FB923C]'
                          : 'text-[#B45309] dark:text-[#FBBF24]'
                      }`}
                    >
                      <Flame
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isUrgent ? 'fill-current' : ''
                        }`}
                        aria-hidden="true"
                      />
                      <span>
                        {isUrgent
                          ? 'Urgente · Contratação imediata'
                          : 'Prioridade alta'}
                      </span>
                    </p>
                  )}

                  <h2
                    id="job-details-modal-title"
                    className="font-display text-lg sm:text-xl font-bold text-[#111827] dark:text-[#F8FAFC] break-words"
                  >
                    {job.funcao}
                  </h2>

                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs sm:text-sm text-[#4B5563] dark:text-[#94A3B8]">
                    <span className="font-semibold text-[#111827] dark:text-[#F8FAFC]">
                      {job.companyName}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Star
                        className={`w-3.5 h-3.5 shrink-0 ${
                          companyRatingSummary.count > 0
                            ? 'text-amber-500 fill-amber-500 dark:text-amber-400 dark:fill-amber-400'
                            : 'text-[#9CA3AF] dark:text-[#64748B]'
                        }`}
                        aria-hidden="true"
                      />
                      <span>
                        {companyRatingSummary.count > 0
                          ? `${companyRatingSummary.formattedAverage} (${companyRatingSummary.count} ${
                              companyRatingSummary.count === 1
                                ? 'avaliação'
                                : 'avaliações'
                            })`
                          : 'Nova na plataforma'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar detalhes da vaga"
                data-testid="job-details-close-btn"
                className="min-w-[40px] min-h-[40px] rounded-xl border border-[#E5E7EB] dark:border-[#334155] flex items-center justify-center text-[#4B5563] hover:text-[#111827] dark:text-[#94A3B8] dark:hover:text-[#F8FAFC] hover:bg-[#F9FAFB] dark:hover:bg-[#1E293B] transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 space-y-5">
              {/* Key Job Facts Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-[#F9FAFB] dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#1E293B] text-xs sm:text-sm">
                <div className="flex items-start gap-2.5">
                  <MapPin
                    className="w-4 h-4 text-[#C93B1E] dark:text-[#F06449] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8]">
                      Local da obra
                    </p>
                    <p className="font-semibold text-[#111827] dark:text-[#F8FAFC] tabular-nums">
                      {job.bairro}, Rondonópolis-MT
                      {distanceKm !== undefined
                        ? ` · ~${formatDistanceKmPtBr(distanceKm)}`
                        : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Wallet
                    className="w-4 h-4 text-[#047857] dark:text-[#34D399] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8]">
                      Remuneração e vagas
                    </p>
                    <p className="font-semibold text-[#111827] dark:text-[#F8FAFC] tabular-nums">
                      {job.salarioOuDiaria} · {job.quantidadeVagas}{' '}
                      {job.quantidadeVagas === 1 ? 'vaga' : 'vagas'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Briefcase
                    className="w-4 h-4 text-[#4B5563] dark:text-[#94A3B8] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8]">
                      Contrato e experiência
                    </p>
                    <p className="font-semibold text-[#111827] dark:text-[#F8FAFC]">
                      {job.tipoContrato ?? 'CLT'} ·{' '}
                      {job.nivelExperiencia ?? 'Intermediário (1 a 3 anos)'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Clock
                    className="w-4 h-4 text-[#4B5563] dark:text-[#94A3B8] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8]">
                      Turno e contato
                    </p>
                    <p className="font-semibold text-[#111827] dark:text-[#F8FAFC] tabular-nums">
                      {job.turno} · {job.telefoneContato}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description & Competencies */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-xs font-bold text-[#6B7280] dark:text-[#94A3B8]">
                    Descrição das atividades
                  </h3>
                  <p className="mt-1 text-sm text-[#111827] dark:text-[#E2E8F0] leading-relaxed whitespace-pre-line">
                    {job.descricao}
                  </p>
                </div>

                {job.beneficios && (
                  <p className="text-xs sm:text-sm text-[#374151] dark:text-[#CBD5E1]">
                    <span className="font-semibold text-[#111827] dark:text-[#F8FAFC]">
                      Benefícios:{' '}
                    </span>
                    {job.beneficios}
                  </p>
                )}

                <p className="text-xs sm:text-sm text-[#374151] dark:text-[#CBD5E1]">
                  <span className="font-semibold text-[#111827] dark:text-[#F8FAFC]">
                    Habilidades relacionadas:{' '}
                  </span>
                  {getJobSkillTags(job).map(formatSkillTagLabel).join(' · ')}
                </p>

                {job.competenciasRequeridas &&
                  job.competenciasRequeridas.length > 0 && (
                    <p className="text-xs sm:text-sm text-[#374151] dark:text-[#CBD5E1]">
                      <span className="font-semibold text-[#C93B1E] dark:text-[#F06449]">
                        Competências requeridas:{' '}
                      </span>
                      {formatCompetencyList(job.competenciasRequeridas)}
                    </p>
                  )}

                {job.competenciasPreferenciais &&
                  job.competenciasPreferenciais.length > 0 && (
                    <p className="text-xs sm:text-sm text-[#374151] dark:text-[#CBD5E1]">
                      <span className="font-semibold text-[#111827] dark:text-[#F8FAFC]">
                        Competências preferenciais:{' '}
                      </span>
                      {formatCompetencyList(job.competenciasPreferenciais)}
                    </p>
                  )}
              </div>

              {/* Share Section inside Job Details */}
              <div className="rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-[#F9FAFB]/70 dark:bg-[#0F172A]/60 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-[#111827] dark:text-[#F8FAFC]">
                      Conhece alguém para esta obra?
                    </p>
                    <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">
                      Envie os detalhes e o link direto da vaga pelo WhatsApp ou redes sociais.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleShareClick()}
                    disabled={isSharing}
                    data-testid="job-details-share-btn"
                    className="min-h-[44px] px-4 py-2 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#1E293B] hover:bg-[#F3F4F6] dark:hover:bg-[#334155] text-[#111827] dark:text-[#F8FAFC] text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
                  >
                    <Share2
                      className="w-4 h-4 text-[#C93B1E] dark:text-[#F06449] shrink-0"
                      aria-hidden="true"
                    />
                    <span>
                      {isSharing ? 'Compartilhando...' : 'Compartilhar Vaga'}
                    </span>
                  </button>
                </div>

                {shareFeedback && (
                  <div
                    role="status"
                    data-testid="job-details-share-feedback"
                    className="pt-3 border-t border-[#E5E7EB] dark:border-[#334155] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                  >
                    <span className="text-[#047857] dark:text-[#34D399] font-medium">
                      {shareFeedback.message}
                    </span>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <a
                        href={sharePayload.whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid="job-details-whatsapp-link"
                        className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                      >
                        <MessageSquare className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>Enviar no WhatsApp</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => void handleCopyManual()}
                        data-testid="job-details-copy-btn"
                        className="min-h-[38px] px-3 py-1.5 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-[#111827] dark:text-[#F8FAFC] font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>
                          {copiedManual ? 'Copiado!' : 'Copiar texto e link'}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer CTA */}
            <div className="sticky bottom-0 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-xs border-t border-[#E5E7EB] dark:border-[#1E293B] px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-[#4B5563] dark:text-[#94A3B8] inline-flex items-center gap-1.5 tabular-nums">
                <Phone className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{job.telefoneContato}</span>
              </span>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-[#D1D5DB] dark:border-[#334155] text-xs sm:text-sm font-semibold text-[#374151] dark:text-[#CBD5E1] hover:bg-[#F9FAFB] dark:hover:bg-[#1E293B] transition-colors cursor-pointer"
                >
                  Fechar
                </button>

                {existingApplication ? (
                  <>
                    <span className="text-xs font-semibold text-[#047857] dark:text-[#34D399] inline-flex items-center gap-1.5 px-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>
                        {isCompleted
                          ? 'Trabalho concluído'
                          : isAccepted
                            ? 'Candidatura aceita'
                            : 'Candidatura enviada'}
                      </span>
                    </span>

                    {canOpenChat && (
                      <button
                        type="button"
                        onClick={() => onOpenChat(existingApplication.id)}
                        className="min-h-[44px] px-4 py-2 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4 text-[#C93B1E] dark:text-[#F06449]" aria-hidden="true" />
                        <span>
                          Chat{unreadChatCount > 0 ? ` (${unreadChatCount})` : ''}
                        </span>
                      </button>
                    )}

                    {canCompleteWork(existingApplication) && (
                      <button
                        type="button"
                        onClick={() => onCompleteApplication(existingApplication.id)}
                        className="min-h-[44px] px-4 py-2 rounded-xl bg-[#111827] dark:bg-[#F8FAFC] text-white dark:text-[#0F172A] text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>Concluir trabalho</span>
                      </button>
                    )}

                    {canRateCompanyForApplication(existingApplication, companyRatings) && (
                      <button
                        type="button"
                        onClick={() => onOpenRatingModal(existingApplication.id)}
                        className="min-h-[44px] px-4 py-2 rounded-xl bg-[#C93B1E] hover:bg-[#B23319] text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Star className="w-4 h-4 shrink-0 fill-current" aria-hidden="true" />
                        <span>Avaliar empresa</span>
                      </button>
                    )}

                    {existingRating && (
                      <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 inline-flex items-center gap-1 tabular-nums">
                        <Star className="w-3.5 h-3.5 fill-current shrink-0" aria-hidden="true" />
                        <span>Sua nota: {existingRating.stars}/5</span>
                      </span>
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => onApply(job)}
                    data-testid="job-details-apply-btn"
                    className="min-h-[44px] px-5 py-2 rounded-xl bg-[#C93B1E] hover:bg-[#B23319] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Candidatar-se
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
