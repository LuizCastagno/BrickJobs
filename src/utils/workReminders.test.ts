import test from 'node:test';
import assert from 'node:assert/strict';
import type { JobApplication, JobPosting } from '../types/brickjobs';
import {
  REMINDER_LEAD_MINUTES,
  cancelWorkReminder,
  collectDueReminders,
  computeReminderTriggerIso,
  createWorkReminderNotification,
  createWorkScheduleReminder,
  getActiveReminderForApplication,
  getNextScheduledReminderDelayMs,
  isReminderDue,
  markRemindersAsNotified,
  upsertApplicationReminder,
} from './workReminders';

const SAMPLE_JOB: JobPosting = {
  id: 'job-1',
  companyId: 'comp-1',
  companyName: 'Construtora Cerrado Sul',
  funcao: 'Pedreiro',
  quantidadeVagas: 2,
  bairro: 'Vila Aurora',
  regiaoInteresse: 'Vila Aurora',
  salarioOuDiaria: 'R$ 195/dia',
  turno: 'Comercial (07h–17h)',
  descricao: 'Alvenaria estrutural.',
  telefoneContato: '(66) 99612-4410',
  status: 'aberta',
  createdAt: '2026-11-15',
};

const ACCEPTED_APP: JobApplication = {
  id: 'app-1',
  jobId: 'job-1',
  workerId: 'worker-1',
  workerName: 'Marcos Pereira',
  appliedAt: '2026-11-15',
  status: 'aceita',
};

test('computeReminderTriggerIso subtracts exactly 30 minutes', () => {
  const start = '2026-11-16T12:00:00.000Z';
  const trigger = computeReminderTriggerIso(start);
  assert.equal(REMINDER_LEAD_MINUTES, 30);
  assert.equal(trigger, '2026-11-16T11:30:00.000Z');
});

test('createWorkScheduleReminder validates accepted status and future datetime', () => {
  const now = new Date('2026-11-16T10:00:00');
  const pendingResult = createWorkScheduleReminder({
    application: { ...ACCEPTED_APP, status: 'pendente' },
    job: SAMPLE_JOB,
    companyName: 'Construtora Cerrado Sul',
    scheduledStartInput: '2026-11-16T12:00',
    scheduledByRole: 'contratante',
    now,
  });
  assert.equal(pendingResult.ok, false);

  const pastResult = createWorkScheduleReminder({
    application: ACCEPTED_APP,
    job: SAMPLE_JOB,
    companyName: 'Construtora Cerrado Sul',
    scheduledStartInput: '2026-11-16T09:30',
    scheduledByRole: 'contratante',
    now,
  });
  assert.equal(pastResult.ok, false);
});

test('createWorkScheduleReminder builds reminder 30 min prior and chat announcement', () => {
  const now = new Date('2026-11-16T10:00:00');
  const result = createWorkScheduleReminder({
    application: ACCEPTED_APP,
    job: SAMPLE_JOB,
    companyName: 'Construtora Cerrado Sul',
    scheduledStartInput: '2026-11-16T12:00',
    locationNote: 'Portão B da obra',
    scheduledByRole: 'contratante',
    now,
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.reminder.status, 'agendado');
  assert.equal(result.reminder.locationNote, 'Portão B da obra');
  assert.equal(
    Date.parse(result.reminder.scheduledStartAt) -
      Date.parse(result.reminder.reminderAt),
    30 * 60 * 1000
  );
  assert.match(result.chatAnnouncement, /30 minutos antes/);
  assert.match(result.chatAnnouncement, /Portão B da obra/);
});

test('isReminderDue and collectDueReminders fire at T-30m and never duplicate after notified', () => {
  const now = new Date('2026-11-16T10:00:00');
  const created = createWorkScheduleReminder({
    application: ACCEPTED_APP,
    job: SAMPLE_JOB,
    companyName: 'Construtora Cerrado Sul',
    scheduledStartInput: '2026-11-16T12:00',
    scheduledByRole: 'contratante',
    now,
  });
  assert.equal(created.ok, true);
  if (!created.ok) return;

  const list = upsertApplicationReminder([], created.reminder);
  // 31 min before start -> NOT due yet
  assert.equal(
    isReminderDue(created.reminder, new Date('2026-11-16T11:29:00')),
    false
  );
  // Exactly 30 min before start -> DUE
  assert.equal(
    isReminderDue(created.reminder, new Date('2026-11-16T11:30:00')),
    true
  );
  assert.equal(
    collectDueReminders(list, new Date('2026-11-16T11:35:00')).length,
    1
  );

  // After marking notified, never triggers again
  const updated = markRemindersAsNotified(
    list,
    [created.reminder.id],
    new Date('2026-11-16T11:30:05')
  );
  assert.equal(updated[0].status, 'notificado');
  assert.equal(
    collectDueReminders(updated, new Date('2026-11-16T11:40:00')).length,
    0
  );
});

test('scheduling within <30 minutes is immediately due for notification', () => {
  const now = new Date('2026-11-16T10:00:00');
  const created = createWorkScheduleReminder({
    application: ACCEPTED_APP,
    job: SAMPLE_JOB,
    companyName: 'Construtora Cerrado Sul',
    scheduledStartInput: '2026-11-16T10:20',
    scheduledByRole: 'contratante',
    now,
  });
  assert.equal(created.ok, true);
  if (!created.ok) return;

  assert.equal(isReminderDue(created.reminder, now), true);
  const notif = createWorkReminderNotification(created.reminder, now);
  assert.equal(notif.type, 'lembrete_trabalho');
  assert.equal(notif.applicationId, ACCEPTED_APP.id);
  assert.match(notif.title, /Pedreiro/);
  assert.match(notif.message, /Construtora Cerrado Sul/);
});

test('upsert, cancel, and getNextScheduledReminderDelayMs behave deterministically', () => {
  const now = new Date('2026-11-16T10:00:00');
  const created = createWorkScheduleReminder({
    application: ACCEPTED_APP,
    job: SAMPLE_JOB,
    companyName: 'Construtora Cerrado Sul',
    scheduledStartInput: '2026-11-16T11:00',
    scheduledByRole: 'contratado',
    now,
  });
  assert.equal(created.ok, true);
  if (!created.ok) return;

  let list = upsertApplicationReminder([], created.reminder);
  assert.equal(getNextScheduledReminderDelayMs(list, now), 30 * 60 * 1000);
  assert.equal(
    getActiveReminderForApplication(list, ACCEPTED_APP.id)?.id,
    created.reminder.id
  );

  list = cancelWorkReminder(list, created.reminder.id);
  assert.equal(getActiveReminderForApplication(list, ACCEPTED_APP.id), null);
  assert.equal(getNextScheduledReminderDelayMs(list, now), null);
});
