import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BellRing, CalendarClock, MessageSquare, Send, X } from 'lucide-react';
import type {
  ChatMessage,
  JobApplication,
  JobPosting,
  UserRole,
  WorkScheduleReminder,
} from '../types/brickjobs';
import {
  formatChatTimePtBr,
  getMessagesForApplication,
  getQuickChatPrompts,
} from '../utils/chat';
import {
  CHAT_BACKDROP_TRANSITION,
  CHAT_MESSAGE_TRANSITION,
  CHAT_MODAL_TRANSITION,
  CHAT_MODAL_VARIANTS,
  PANEL_REVEAL_TRANSITION,
  PANEL_REVEAL_VARIANTS,
} from '../utils/motionPresets';
import {
  computeReminderTriggerIso,
  formatReminderSchedulePtBr,
  formatReminderTimeOnlyPtBr,
  getSuggestedScheduleInputValue,
  isWithinPreStartLeadWindow,
  toLocalDateTimeInputValue,
} from '../utils/workReminders';

interface ApplicationChatModalProps {
  isOpen: boolean;
  viewerRole: UserRole;
  application: JobApplication | null;
  job: JobPosting | null;
  companyName: string;
  messages: ChatMessage[];
  activeReminder?: WorkScheduleReminder | null;
  onSendMessage: (
    applicationId: string,
    text: string
  ) => { ok: boolean; error?: string };
  onScheduleWorkStart: (params: {
    applicationId: string;
    scheduledStartInput: string;
    locationNote: string;
  }) => { ok: boolean; error?: string };
  onCancelReminder?: (reminderId: string) => void;
  onClose: () => void;
  onAfterClose?: () => void;
}

export const ApplicationChatModal: React.FC<ApplicationChatModalProps> = ({
  isOpen,
  viewerRole,
  application,
  job,
  companyName,
  messages,
  activeReminder = null,
  onSendMessage,
  onScheduleWorkStart,
  onCancelReminder,
  onClose,
  onAfterClose,
}) => {
  const [draft, setDraft] = useState<string>('');
  const [sendError, setSendError] = useState<string>('');
  const [showQuickPrompts, setShowQuickPrompts] = useState<boolean>(false);
  const [showSchedulePanel, setShowSchedulePanel] = useState<boolean>(false);
  const [scheduleDateTime, setScheduleDateTime] = useState<string>(() =>
    getSuggestedScheduleInputValue()
  );
  const [scheduleLocationNote, setScheduleLocationNote] = useState<string>('');
  const [scheduleError, setScheduleError] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const threadMessages = useMemo(() => {
    if (!application) return [];
    return getMessagesForApplication(messages, application.id);
  }, [messages, application]);

  const quickPrompts = useMemo(
    () => getQuickChatPrompts(viewerRole, job ?? undefined),
    [viewerRole, job]
  );

  useEffect(() => {
    if (!isOpen) return;
    setSendError('');
    setScheduleError('');
    setShowSchedulePanel(false);
    if (activeReminder) {
      const d = new Date(activeReminder.scheduledStartAt);
      if (!Number.isNaN(d.getTime())) {
        setScheduleDateTime(toLocalDateTimeInputValue(d));
      }
      setScheduleLocationNote(activeReminder.locationNote ?? '');
    } else {
      setScheduleDateTime(getSuggestedScheduleInputValue());
      setScheduleLocationNote('');
    }
  }, [isOpen, application?.id]);

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

  useEffect(() => {
    if (!isOpen) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
  }, [isOpen, threadMessages.length]);

  const previewInfo = useMemo(() => {
    if (!scheduleDateTime.trim()) return null;
    const parsed = new Date(scheduleDateTime);
    if (Number.isNaN(parsed.getTime())) return null;
    const startIso = parsed.toISOString();
    const triggerIso = computeReminderTriggerIso(startIso);
    const triggerTime = formatReminderTimeOnlyPtBr(triggerIso);
    const immediate = isWithinPreStartLeadWindow(startIso);
    return { triggerTime, immediate };
  }, [scheduleDateTime]);

  const canSchedule = application?.status === 'aceita';

  const counterpartName =
    viewerRole === 'contratante'
      ? application?.workerName || 'Candidato'
      : companyName || job?.companyName || '';

  const counterpartRoleLabel =
    viewerRole === 'contratante' ? 'Candidato aceito' : 'Construtora';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!application) return;
    setSendError('');
    const result = onSendMessage(application.id, draft);
    if (!result.ok) {
      setSendError(result.error ?? 'Não foi possível enviar a mensagem.');
      return;
    }
    setDraft('');
    setShowQuickPrompts(false);
    inputRef.current?.focus();
  };

  const handleQuickPromptClick = (promptText: string) => {
    if (!application) return;
    setSendError('');
    const result = onSendMessage(application.id, promptText);
    if (!result.ok) {
      setSendError(result.error ?? 'Não foi possível enviar a mensagem.');
      return;
    }
    setShowQuickPrompts(false);
  };

  const handleToggleSchedulePanel = () => {
    setScheduleError('');
    if (!showSchedulePanel) {
      if (activeReminder) {
        const d = new Date(activeReminder.scheduledStartAt);
        if (!Number.isNaN(d.getTime())) {
          setScheduleDateTime(toLocalDateTimeInputValue(d));
        }
        setScheduleLocationNote(activeReminder.locationNote ?? '');
      } else {
        setScheduleDateTime(getSuggestedScheduleInputValue());
      }
    }
    setShowSchedulePanel((prev) => !prev);
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!application) return;
    setScheduleError('');
    const result = onScheduleWorkStart({
      applicationId: application.id,
      scheduledStartInput: scheduleDateTime,
      locationNote: scheduleLocationNote,
    });
    if (!result.ok) {
      setScheduleError(
        result.error ?? 'Não foi possível agendar o início do trabalho.'
      );
      return;
    }
    setShowSchedulePanel(false);
    setShowQuickPrompts(false);
  };

  return (
    <AnimatePresence onExitComplete={onAfterClose}>
      {isOpen && application && job && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6">
          {/* Backdrop */}
          <motion.div
            aria-hidden="true"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={CHAT_BACKDROP_TRANSITION}
            className="fixed inset-0 bg-black/50 backdrop-blur-[1px]"
          />

          {/* Chat Sheet / Dialog */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="application-chat-title"
            data-testid="application-chat-modal"
            initial={CHAT_MODAL_VARIANTS.initial}
            animate={CHAT_MODAL_VARIANTS.animate}
            exit={CHAT_MODAL_VARIANTS.exit}
            transition={CHAT_MODAL_TRANSITION}
            className="relative z-10 w-full sm:max-w-xl h-[88dvh] sm:h-[660px] max-h-[92dvh] rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#334155] shadow-2xl flex flex-col overflow-hidden text-[#111827] dark:text-[#F8FAFC]"
          >
        {/* Mobile grab handle */}
        <div
          className="w-10 h-1.5 bg-[#D1D5DB] dark:bg-[#334155] rounded-full mx-auto mt-2.5 sm:hidden shrink-0"
          aria-hidden="true"
        />

        {/* Header */}
        <div className="px-4 sm:px-6 pt-3 sm:pt-5 pb-3.5 border-b border-[#E5E7EB] dark:border-[#1E293B] flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="flex items-center gap-1.5 min-w-0 text-xs font-semibold text-[#047857] dark:text-[#34D399]">
              <MessageSquare className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">Chat liberado · Candidatura aceita</span>
            </div>
            <h2
              id="application-chat-title"
              className="font-display text-lg font-bold text-[#111827] dark:text-[#F8FAFC] mt-0.5 truncate"
            >
              {counterpartName}
            </h2>
            <p className="text-xs text-[#4B5563] dark:text-[#94A3B8] truncate">
              {counterpartRoleLabel} · Vaga: {job.funcao} · {job.bairro}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {canSchedule && (
              <button
                type="button"
                onClick={handleToggleSchedulePanel}
                aria-expanded={showSchedulePanel}
                data-testid="chat-schedule-toggle"
                className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  showSchedulePanel || activeReminder
                    ? 'border-[#C93B1E] dark:border-[#F06449] bg-[#C93B1E]/10 dark:bg-[#C93B1E]/20 text-[#C93B1E] dark:text-[#F06449]'
                    : 'border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#1E293B] hover:bg-[#F3F4F6] dark:hover:bg-[#334155] text-[#111827] dark:text-[#F8FAFC]'
                }`}
              >
                <BellRing className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span className="sm:hidden">
                  {activeReminder ? 'Reagendar' : 'Agendar'}
                </span>
                <span className="hidden sm:inline">
                  {activeReminder ? 'Reagendar início' : 'Agendar início'}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar chat da candidatura"
              data-testid="chat-close-button"
              className="min-w-[44px] min-h-[44px] rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#1E293B] hover:bg-[#F3F4F6] dark:hover:bg-[#334155] text-[#4B5563] dark:text-[#CBD5E1] flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Active Schedule Reminder Summary */}
        {activeReminder && !showSchedulePanel && (
          <div
            data-testid="chat-active-schedule-banner"
            className="px-4 sm:px-6 py-2.5 bg-[#FFF7ED] dark:bg-[#1E293B] border-b border-[#FED7AA] dark:border-[#334155] flex flex-wrap items-center justify-between gap-2 shrink-0"
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[#111827] dark:text-[#F8FAFC] flex items-center gap-1.5 tabular-nums">
                <BellRing
                  className="w-3.5 h-3.5 text-[#C93B1E] dark:text-[#F06449] shrink-0"
                  aria-hidden="true"
                />
                <span>
                  Início agendado:{' '}
                  {formatReminderSchedulePtBr(activeReminder.scheduledStartAt)}
                </span>
              </p>
              <p className="text-[11px] text-[#4B5563] dark:text-[#94A3B8] mt-0.5 tabular-nums break-words">
                {activeReminder.status === 'notificado'
                  ? `Lembrete de 30 min antes já enviado (${formatReminderTimeOnlyPtBr(
                      activeReminder.reminderAt
                    )})`
                  : `Lembrete automático 30 min antes, às ${formatReminderTimeOnlyPtBr(
                      activeReminder.reminderAt
                    )}`}
                {activeReminder.locationNote
                  ? ` · ${activeReminder.locationNote}`
                  : ''}
              </p>
            </div>

            {canSchedule && onCancelReminder && (
              <button
                type="button"
                onClick={() => onCancelReminder(activeReminder.id)}
                data-testid="chat-schedule-cancel"
                className="min-h-[40px] px-2.5 py-1.5 rounded-lg border border-[#D1D5DB] dark:border-[#475569] bg-white dark:bg-[#0F172A] hover:bg-[#F9FAFB] dark:hover:bg-[#1E293B] text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] cursor-pointer whitespace-nowrap shrink-0"
              >
                Cancelar lembrete
              </button>
            )}
          </div>
        )}

        {/* Schedule Work Start Drawer */}
        <AnimatePresence initial={false}>
          {canSchedule && showSchedulePanel && (
            <motion.form
              key="chat-schedule-drawer"
              onSubmit={handleScheduleSubmit}
              data-testid="chat-schedule-panel"
              initial={PANEL_REVEAL_VARIANTS.initial}
              animate={PANEL_REVEAL_VARIANTS.animate}
              exit={PANEL_REVEAL_VARIANTS.exit}
              transition={PANEL_REVEAL_TRANSITION}
              className="px-4 sm:px-6 py-3.5 bg-[#F9FAFB] dark:bg-[#0F172A] border-b border-[#E5E7EB] dark:border-[#334155] space-y-3 shrink-0"
            >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-[#111827] dark:text-[#F8FAFC]">
                  Agendar início do trabalho e lembrete (30 min antes)
                </p>
                <p className="text-[11px] text-[#4B5563] dark:text-[#94A3B8] mt-0.5">
                  O contratado receberá uma notificação automática 30 minutos antes do horário marcado.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="chat-schedule-datetime"
                  className="block text-[11px] font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1"
                >
                  Data e horário de início *
                </label>
                <input
                  id="chat-schedule-datetime"
                  data-testid="chat-schedule-datetime"
                  type="datetime-local"
                  value={scheduleDateTime}
                  onChange={(e) => {
                    setScheduleDateTime(e.target.value);
                    if (scheduleError) setScheduleError('');
                  }}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#111827] text-base sm:text-xs text-[#111827] dark:text-[#F8FAFC] tabular-nums focus:outline-none focus:border-[#C93B1E]"
                />
              </div>

              <div>
                <label
                  htmlFor="chat-schedule-note"
                  className="block text-[11px] font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1"
                >
                  Local de encontro / observação (opcional)
                </label>
                <input
                  id="chat-schedule-note"
                  data-testid="chat-schedule-note"
                  type="text"
                  value={scheduleLocationNote}
                  onChange={(e) => setScheduleLocationNote(e.target.value)}
                  placeholder="Ex: Portão B da obra, procurar mestre João"
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#111827] text-base sm:text-xs text-[#111827] dark:text-[#F8FAFC] placeholder:text-[#6B7280] dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-[#C93B1E]"
                />
              </div>
            </div>

            {previewInfo && (
              <p
                data-testid="chat-schedule-preview"
                className="text-xs font-medium text-[#374151] dark:text-[#CBD5E1] tabular-nums"
              >
                {previewInfo.immediate
                  ? `Faltam menos de 30 minutos para o início: o lembrete será enviado imediatamente ao confirmar.`
                  : `Lembrete automático programado para as ${previewInfo.triggerTime} (30 min antes do início).`}
              </p>
            )}

            {scheduleError && (
              <p
                role="alert"
                data-testid="chat-schedule-error"
                className="text-xs font-medium text-[#B91C1C] dark:text-[#F87171]"
              >
                {scheduleError}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowSchedulePanel(false);
                  setScheduleError('');
                }}
                className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#111827] hover:bg-[#F3F4F6] dark:hover:bg-[#1E293B] text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] cursor-pointer"
              >
                Fechar
              </button>
              <button
                type="submit"
                data-testid="chat-schedule-submit"
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#C93B1E] hover:bg-[#B23319] text-white text-xs font-semibold inline-flex items-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer"
              >
                <BellRing className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Confirmar agendamento</span>
              </button>
            </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Message List */}
        <div
          data-testid="chat-messages-list"
          className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3 bg-[#F9FAFB] dark:bg-[#0B1120]"
        >
          {threadMessages.length === 0 ? (
            <div className="h-full flex flex-col justify-center py-4">
              <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <CalendarClock
                    className="w-5 h-5 text-[#C93B1E] dark:text-[#F06449] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-sm font-semibold text-[#111827] dark:text-[#F8FAFC]">
                      Combine os próximos passos por aqui
                    </p>
                    <p className="text-xs sm:text-sm text-[#4B5563] dark:text-[#94A3B8] mt-1">
                      Use o chat para agendar entrevista, informar o endereço do canteiro ou usar "Agendar início" para ativar o lembrete de 30 minutos antes.
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold text-[#374151] dark:text-[#CBD5E1]">
                    Mensagens rápidas para começar:
                  </p>
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => handleQuickPromptClick(prompt)}
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#1E293B] hover:border-[#C93B1E] dark:hover:border-[#F06449] text-left text-xs sm:text-sm text-[#111827] dark:text-[#F8FAFC] transition-colors cursor-pointer"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            threadMessages.map((msg) => {
              const isOwn = msg.senderRole === viewerRole;
              const timeLabel = formatChatTimePtBr(msg.createdAt);
              return (
                <motion.div
                  key={msg.id}
                  data-testid="chat-message-item"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={CHAT_MESSAGE_TRANSITION}
                  className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 text-[11px] text-[#4B5563] dark:text-[#94A3B8] mb-1 px-1">
                    <span className="font-semibold">
                      {isOwn ? 'Você' : msg.senderName}
                    </span>
                    {timeLabel && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{timeLabel}</span>
                      </>
                    )}
                  </div>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words ${
                      isOwn
                        ? 'bg-[#C93B1E] text-white rounded-br-sm'
                        : 'bg-white dark:bg-[#1E293B] text-[#111827] dark:text-[#F8FAFC] border border-[#E5E7EB] dark:border-[#334155] rounded-bl-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Optional quick prompt drawer when conversation already started */}
        <AnimatePresence initial={false}>
          {threadMessages.length > 0 && showQuickPrompts && (
            <motion.div
              key="chat-quick-prompts-drawer"
              initial={PANEL_REVEAL_VARIANTS.initial}
              animate={PANEL_REVEAL_VARIANTS.animate}
              exit={PANEL_REVEAL_VARIANTS.exit}
              transition={PANEL_REVEAL_TRANSITION}
              className="px-4 sm:px-6 py-2.5 bg-white dark:bg-[#111827] border-t border-[#E5E7EB] dark:border-[#1E293B] space-y-1.5 shrink-0"
            >
            <p className="text-[11px] font-semibold text-[#4B5563] dark:text-[#94A3B8]">
              Sugestões rápidas
            </p>
            <div className="flex flex-col gap-1.5">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleQuickPromptClick(prompt)}
                  className="w-full min-h-[40px] px-3 py-1.5 rounded-lg border border-[#E5E7EB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#1E293B] hover:border-[#C93B1E] dark:hover:border-[#F06449] text-left text-xs text-[#111827] dark:text-[#F8FAFC] transition-colors cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Composer */}
        <form
          onSubmit={handleSubmit}
          className="px-4 sm:px-6 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:pb-4 bg-white dark:bg-[#111827] border-t border-[#E5E7EB] dark:border-[#1E293B] shrink-0"
        >
          {sendError && (
            <p
              role="alert"
              className="text-xs font-medium text-[#B91C1C] dark:text-[#F87171] mb-2"
            >
              {sendError}
            </p>
          )}

          <div className="flex items-center gap-2">
            {threadMessages.length > 0 && (
              <button
                type="button"
                onClick={() => setShowQuickPrompts((prev) => !prev)}
                aria-expanded={showQuickPrompts}
                aria-label="Sugestões rápidas de agendamento"
                className="min-w-[44px] min-h-[44px] rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#1E293B] hover:bg-[#F3F4F6] dark:hover:bg-[#334155] text-[#4B5563] dark:text-[#CBD5E1] flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <CalendarClock className="w-4 h-4" aria-hidden="true" />
              </button>
            )}

            <label htmlFor="chat-message-input" className="sr-only">
              Escreva sua mensagem para agendar entrevista ou início do trabalho
            </label>
            <input
              ref={inputRef}
              id="chat-message-input"
              data-testid="chat-message-input"
              type="text"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                if (sendError) setSendError('');
              }}
              placeholder="Escreva sobre entrevista ou início da obra..."
              className="flex-1 min-w-0 min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-base sm:text-sm text-[#111827] dark:text-[#F8FAFC] placeholder:text-[#6B7280] dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-[#C93B1E]"
            />

            <button
              type="submit"
              data-testid="chat-send-button"
              aria-label="Enviar mensagem"
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#C93B1E] hover:bg-[#B23319] text-white text-sm font-semibold inline-flex items-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Enviar</span>
            </button>
          </div>
        </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
