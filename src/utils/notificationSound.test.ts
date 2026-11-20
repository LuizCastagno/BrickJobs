import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getSoundNotesForProfile,
  playNotificationSound,
  resolveSoundProfileForNotification,
} from './notificationSound';

test('resolveSoundProfileForNotification maps every notification type cleanly', () => {
  assert.equal(resolveSoundProfileForNotification('candidatura_aceita'), 'contract_accepted');
  assert.equal(resolveSoundProfileForNotification('lembrete_trabalho'), 'reminder');
  assert.equal(resolveSoundProfileForNotification('nova_vaga_regiao'), 'job_alert');
});

test('getSoundNotesForProfile returns ascending positive frequencies and gains', () => {
  const contractNotes = getSoundNotesForProfile('contract_accepted');
  assert.ok(contractNotes.length >= 4);
  for (let i = 0; i < contractNotes.length; i += 1) {
    assert.ok(contractNotes[i].freq > 0);
    assert.ok(contractNotes[i].gain > 0 && contractNotes[i].gain <= 0.25);
    assert.ok(contractNotes[i].durationSec > 0);
    if (i > 0) {
      assert.ok(contractNotes[i].freq > contractNotes[i - 1].freq);
      assert.ok(contractNotes[i].startSec >= contractNotes[i - 1].startSec);
    }
  }

  assert.ok(getSoundNotesForProfile('job_alert').length >= 2);
  assert.ok(getSoundNotesForProfile('reminder').length >= 2);
});

test('playNotificationSound safely returns false when disabled or without window', () => {
  assert.equal(playNotificationSound('contract_accepted', false), false);
  assert.equal(playNotificationSound('job_alert', true), false);
});
