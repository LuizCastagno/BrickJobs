import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canDispatchNativeNotification,
  formatNativeNotificationPayload,
  getEffectivePushState,
  shouldShowPushPromptBanner,
} from './nativeNotifications';

test('getEffectivePushState maps permission and preference cleanly', () => {
  assert.equal(
    getEffectivePushState('unsupported', { enabled: true, dismissedBanner: false }),
    'unsupported'
  );
  assert.equal(
    getEffectivePushState('denied', { enabled: true, dismissedBanner: false }),
    'denied'
  );
  assert.equal(
    getEffectivePushState('default', { enabled: true, dismissedBanner: false }),
    'default'
  );
  assert.equal(
    getEffectivePushState('granted', { enabled: true, dismissedBanner: false }),
    'enabled'
  );
  assert.equal(
    getEffectivePushState('granted', { enabled: false, dismissedBanner: false }),
    'paused'
  );
});

test('canDispatchNativeNotification only returns true when granted and enabled', () => {
  assert.equal(
    canDispatchNativeNotification('default', { enabled: true, dismissedBanner: false }),
    false
  );
  assert.equal(
    canDispatchNativeNotification('denied', { enabled: true, dismissedBanner: false }),
    false
  );
  assert.equal(
    canDispatchNativeNotification('granted', { enabled: false, dismissedBanner: false }),
    false
  );
  assert.equal(
    canDispatchNativeNotification('granted', { enabled: true, dismissedBanner: false }),
    true
  );
});

test('shouldShowPushPromptBanner hides when dismissed, denied, unsupported, or already active', () => {
  assert.equal(
    shouldShowPushPromptBanner('default', { enabled: true, dismissedBanner: false }),
    true
  );
  assert.equal(
    shouldShowPushPromptBanner('default', { enabled: true, dismissedBanner: true }),
    false
  );
  assert.equal(
    shouldShowPushPromptBanner('denied', { enabled: true, dismissedBanner: false }),
    false
  );
  assert.equal(
    shouldShowPushPromptBanner('unsupported', { enabled: true, dismissedBanner: false }),
    false
  );
  assert.equal(
    shouldShowPushPromptBanner('granted', { enabled: true, dismissedBanner: false }),
    false
  );
  assert.equal(
    shouldShowPushPromptBanner('granted', { enabled: false, dismissedBanner: false }),
    true
  );
});

test('formatNativeNotificationPayload formats acceptance and region job alerts cleanly', () => {
  const accepted = formatNativeNotificationPayload({
    id: 'n1',
    type: 'candidatura_aceita',
    title: 'Candidatura aceita: Pedreiro',
    message: 'Construtora Cerrado Sul aceitou sua candidatura.',
  });
  assert.match(accepted.title, /Candidatura aceita/);
  assert.equal(accepted.body, 'Construtora Cerrado Sul aceitou sua candidatura.');
  assert.equal(accepted.tag, 'brickjobs-n1');

  const newJob = formatNativeNotificationPayload({
    id: 'n2',
    type: 'nova_vaga_regiao',
    title: 'Nova vaga na sua região: Armador',
    message: '3 vagas no Distrito Industrial.',
  });
  assert.match(newJob.title, /Nova vaga na região/);

  const workReminder = formatNativeNotificationPayload({
    id: 'n3',
    type: 'lembrete_trabalho',
    title: 'Início em 30 min: Pedreiro',
    message: 'Obra na Vila Aurora às 08:00.',
  });
  assert.match(workReminder.title, /Lembrete de trabalho \(30 min\)/);
  assert.equal(workReminder.tag, 'brickjobs-n3');
});
