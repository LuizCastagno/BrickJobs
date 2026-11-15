import test from 'node:test';
import assert from 'node:assert/strict';
import type { JobApplication } from '../types/brickjobs';
import {
  canOpenApplicationChat,
  countUnreadMessagesForApplication,
  createChatMessage,
  getMessagesForApplication,
  getQuickChatPrompts,
  markConversationAsRead,
} from './chat';

const pendingApp: JobApplication = {
  id: 'app-1',
  jobId: 'job-roo-1',
  workerId: 'worker-1',
  workerName: 'João Carlos',
  appliedAt: '2026-11-14',
  status: 'pendente',
};

const acceptedApp: JobApplication = {
  ...pendingApp,
  id: 'app-2',
  status: 'aceita',
};

test('canOpenApplicationChat only permits accepted applications', () => {
  assert.equal(canOpenApplicationChat(null), false);
  assert.equal(canOpenApplicationChat(pendingApp), false);
  assert.equal(canOpenApplicationChat(acceptedApp), true);
});

test('createChatMessage rejects pending applications and blank messages', () => {
  const rejectedPending = createChatMessage({
    application: pendingApp,
    senderRole: 'contratante',
    senderName: 'Construtora Cerrado Sul',
    text: 'Olá',
  });
  assert.equal(rejectedPending.ok, false);

  const rejectedBlank = createChatMessage({
    application: acceptedApp,
    senderRole: 'contratante',
    senderName: 'Construtora Cerrado Sul',
    text: '   ',
  });
  assert.equal(rejectedBlank.ok, false);
});

test('createChatMessage creates valid message with role-specific read flags', () => {
  const res = createChatMessage({
    application: acceptedApp,
    senderRole: 'contratante',
    senderName: 'Construtora Cerrado Sul',
    text: '  Entrevista amanhã às 08h  ',
    now: new Date('2026-11-14T10:30:00.000Z'),
  });
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.equal(res.message.text, 'Entrevista amanhã às 08h');
    assert.equal(res.message.readByEmployer, true);
    assert.equal(res.message.readByWorker, false);
  }
});

test('unread counts and markConversationAsRead work symmetrically for both roles', () => {
  const msg1Res = createChatMessage({
    application: acceptedApp,
    senderRole: 'contratante',
    senderName: 'Construtora Cerrado Sul',
    text: 'Bom dia, pode vir às 08h?',
    now: new Date('2026-11-14T10:00:00.000Z'),
  });
  const msg2Res = createChatMessage({
    application: acceptedApp,
    senderRole: 'contratado',
    senderName: 'João Carlos',
    text: 'Sim, estarei lá!',
    now: new Date('2026-11-14T10:05:00.000Z'),
  });
  assert.equal(msg1Res.ok && msg2Res.ok, true);
  if (!msg1Res.ok || !msg2Res.ok) return;

  const list = [msg2Res.message, msg1Res.message];
  const sorted = getMessagesForApplication(list, acceptedApp.id);
  assert.equal(sorted[0].id, msg1Res.message.id);
  assert.equal(sorted[1].id, msg2Res.message.id);

  assert.equal(
    countUnreadMessagesForApplication(list, acceptedApp.id, 'contratado'),
    1
  );
  assert.equal(
    countUnreadMessagesForApplication(list, acceptedApp.id, 'contratante'),
    1
  );

  const afterWorkerRead = markConversationAsRead(list, acceptedApp.id, 'contratado');
  assert.equal(
    countUnreadMessagesForApplication(afterWorkerRead, acceptedApp.id, 'contratado'),
    0
  );
  assert.equal(
    countUnreadMessagesForApplication(afterWorkerRead, acceptedApp.id, 'contratante'),
    1
  );
});

test('getQuickChatPrompts tailors interview and start prompts per role', () => {
  const empPrompts = getQuickChatPrompts('contratante', {
    funcao: 'Pedreiro',
    bairro: 'Vila Aurora',
  });
  const workerPrompts = getQuickChatPrompts('contratado', {
    funcao: 'Pedreiro',
    bairro: 'Vila Aurora',
  });
  assert.equal(empPrompts.length, 3);
  assert.equal(workerPrompts.length, 3);
  assert.ok(empPrompts[0].includes('entrevista'));
  assert.ok(workerPrompts[0].includes('disponibilidade'));
});
