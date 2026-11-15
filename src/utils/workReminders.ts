import type {
  JobApplication,
  JobPosting,
  UserRole,
  WorkerNotification,
  WorkScheduleReminder,
} from '../types/brickjobs';

export const REMINDER_LEAD_MINUTES = 30;
const LEAD_MS = REMINDER_LEAD_MINUTES * 60 * 1000;

export function toLocalDateTimeInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function getSuggestedScheduleInputValue(now: Date = new Date()): string {
  const suggested = new Date(now.getTime() + 60 * 60 * 1000);
  suggested.setSeconds(0, 0);
  return toLocalDateTimeInputValue(suggested);
}

export function computeReminderTriggerIso(
  scheduledStartIso: string,
  leadMinutes: number = REMINDER_LEAD_MINUTES
): string {
  const startMs = Date.parse(scheduledStartIso);
  if (Number.isNaN(startMs)) return '';
  return new Date(startMs - leadMinutes * 60 * 1000).toISOString();
}

export function formatReminderSchedulePtBr(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatReminderTimeOnlyPtBr(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getActiveReminderForApplication(
  reminders: WorkScheduleReminder[],
  applicationId: string
): WorkScheduleReminder | null {
  const matches = reminders
    .filter(
      (item) =>
        item.applicationId === applicationId && item.status !== 'cancelado'
    )
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return matches[0] ?? null;
}

export function createWorkScheduleReminder(params: {
  application: JobApplication;
  job: JobPosting;
  companyName: string;
  scheduledStartInput: string;
  locationNote?: string;
  scheduledByRole: UserRole;
  now?: Date;
}):
  | { ok: true; reminder: WorkScheduleReminder; chatAnnouncement: string }
  | { ok: false; error: string } {
  const now = params.now ?? new Date();
  if (params.application.status !== 'aceita') {
    return {
      ok: false,
      error:
        'Só é possível agendar início de trabalho para candidaturas aceitas e em andamento.',
    };
  }

  const trimmedInput = params.scheduledStartInput.trim();
  if (!trimmedInput) {
    return {
      ok: false,
      error: 'Informe a data e o horário de início do trabalho.',
    };
  }

  const parsedStart = new Date(trimmedInput);
  if (Number.isNaN(parsedStart.getTime())) {
    return {
      ok: false,
      error: 'Data ou horário inválido. Verifique o preenchimento.',
    };
  }

  if (parsedStart.getTime() <= now.getTime() + 30 * 1000) {
    return {
      ok: false,
      error: 'Escolha uma data e horário futuros para agendar o início.',
    };
  }

  const scheduledStartAt = parsedStart.toISOString();
  const reminderAt = computeReminderTriggerIso(
    scheduledStartAt,
    REMINDER_LEAD_MINUTES
  );
  const cleanNote = params.locationNote?.trim() || undefined;
  const resolvedCompany = params.companyName.trim() || params.job.companyName;

  const reminder: WorkScheduleReminder = {
    id: `rem-${params.application.id}-${now.getTime()}`,
    applicationId: params.application.id,
    jobId: params.job.id,
    companyName: resolvedCompany,
    jobRole: params.job.funcao,
    neighborhood: params.job.bairro,
    scheduledStartAt,
    reminderAt,
    locationNote: cleanNote,
    scheduledByRole: params.scheduledByRole,
    status: 'agendado',
    createdAt: now.toISOString(),
  };

  const formattedStart = formatReminderSchedulePtBr(scheduledStartAt);
  const formattedTrigger = formatReminderTimeOnlyPtBr(reminderAt);
  const noteSuffix = cleanNote ? ` Local/Obs.: ${cleanNote}.` : '';
  const chatAnnouncement = `Início do trabalho agendado para ${formattedStart} (${params.job.funcao} · ${params.job.bairro}).${noteSuffix} Lembrete automático configurado para 30 minutos antes (às ${formattedTrigger}).`;

  return {
    ok: true,
    reminder,
    chatAnnouncement,
  };
}

export function upsertApplicationReminder(
  reminders: WorkScheduleReminder[],
  nextReminder: WorkScheduleReminder
): WorkScheduleReminder[] {
  const remaining = reminders.filter(
    (item) => item.applicationId !== nextReminder.applicationId
  );
  return [nextReminder, ...remaining];
}

export function isReminderDue(
  reminder: WorkScheduleReminder,
  now: Date = new Date()
): boolean {
  if (reminder.status !== 'agendado') return false;
  const triggerMs = Date.parse(reminder.reminderAt);
  const startMs = Date.parse(reminder.scheduledStartAt);
  if (Number.isNaN(triggerMs) || Number.isNaN(startMs)) return false;
  const nowMs = now.getTime();
  // Fire once we enter the 30-min pre-start window (and within 12h after start in case app was reopened slightly late)
  return nowMs >= triggerMs && nowMs <= startMs + 12 * 60 * 60 * 1000;
}

export function collectDueReminders(
  reminders: WorkScheduleReminder[],
  now: Date = new Date()
): WorkScheduleReminder[] {
  return reminders.filter((item) => isReminderDue(item, now));
}

export function markRemindersAsNotified(
  reminders: WorkScheduleReminder[],
  notifiedIds: string[],
  now: Date = new Date()
): WorkScheduleReminder[] {
  if (notifiedIds.length === 0) return reminders;
  const idSet = new Set(notifiedIds);
  const notifiedAt = now.toISOString();
  return reminders.map((item) =>
    idSet.has(item.id)
      ? { ...item, status: 'notificado', notifiedAt }
      : item
  );
}

export function cancelWorkReminder(
  reminders: WorkScheduleReminder[],
  reminderId: string
): WorkScheduleReminder[] {
  return reminders.map((item) =>
    item.id === reminderId ? { ...item, status: 'cancelado' } : item
  );
}

export function createWorkReminderNotification(
  reminder: WorkScheduleReminder,
  now: Date = new Date()
): WorkerNotification {
  const startMs = Date.parse(reminder.scheduledStartAt);
  const diffMin = Math.max(1, Math.round((startMs - now.getTime()) / 60000));
  const startTime = formatReminderTimeOnlyPtBr(reminder.scheduledStartAt);
  const startDateTime = formatReminderSchedulePtBr(reminder.scheduledStartAt);

  const urgencyLead =
    diffMin <= REMINDER_LEAD_MINUTES + 1 && startMs > now.getTime()
      ? `em ${diffMin} min`
      : 'em breve';
  const notePart = reminder.locationNote
    ? ` · Ponto de encontro: ${reminder.locationNote}`
    : '';

  return {
    id: `notif-rem-${reminder.id}`,
    type: 'lembrete_trabalho',
    title: `Lembrete de trabalho (${urgencyLead}): ${reminder.jobRole}`,
    message: `Seu início na ${reminder.companyName} (${reminder.neighborhood}) está marcado para ${startTime} (${startDateTime})${notePart}.`,
    jobId: reminder.jobId,
    applicationId: reminder.applicationId,
    region: reminder.neighborhood,
    createdAt: now.toISOString(),
    read: false,
  };
}

export function getNextScheduledReminderDelayMs(
  reminders: WorkScheduleReminder[],
  now: Date = new Date()
): number | null {
  let earliestDelay: number | null = null;
  const nowMs = now.getTime();
  for (const item of reminders) {
    if (item.status !== 'agendado') continue;
    const triggerMs = Date.parse(item.reminderAt);
    if (Number.isNaN(triggerMs)) continue;
    const delay = Math.max(0, triggerMs - nowMs);
    if (earliestDelay === null || delay < earliestDelay) {
      earliestDelay = delay;
    }
  }
  return earliestDelay;
}

export function getVisibleWorkerReminders(
  reminders: WorkScheduleReminder[]
): WorkScheduleReminder[] {
  return reminders
    .filter((item) => item.status !== 'cancelado')
    .slice()
    .sort((a, b) => a.scheduledStartAt.localeCompare(b.scheduledStartAt));
}

export function isWithinPreStartLeadWindow(
  scheduledStartIso: string,
  now: Date = new Date()
): boolean {
  const startMs = Date.parse(scheduledStartIso);
  if (Number.isNaN(startMs)) return false;
  const diff = startMs - now.getTime();
  return diff > 0 && diff <= LEAD_MS;
}
