import test from 'node:test';
import assert from 'node:assert/strict';
import {
  countUnreadNotifications,
  createAcceptedApplicationNotification,
  createNewJobNotification,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  shouldNotifyWorkerForNewJob,
} from './notifications';
import type { JobPosting } from '../types/brickjobs';

const baseJob: JobPosting = {
  id: 'job-10',
  companyId: 'c1',
  companyName: 'Construtora Cerrado Sul',
  funcao: 'Pedreiro',
  quantidadeVagas: 3,
  bairro: 'Vila Aurora',
  regiaoInteresse: 'Vila Aurora',
  salarioOuDiaria: 'R$ 200/dia',
  turno: 'Comercial (07h–17h)',
  descricao: 'Alvenaria estrutural',
  telefoneContato: '(66) 99988-1122',
  status: 'aberta',
  createdAt: '2026-11-14',
};

test('shouldNotifyWorkerForNewJob matches exact region or all regions for open jobs', () => {
  assert.equal(shouldNotifyWorkerForNewJob(baseJob, 'Vila Aurora'), true);
  assert.equal(shouldNotifyWorkerForNewJob(baseJob, 'Toda Rondonópolis e Região'), true);
  assert.equal(shouldNotifyWorkerForNewJob(baseJob, 'Cidade Salmen'), false);
  assert.equal(
    shouldNotifyWorkerForNewJob({ ...baseJob, status: 'encerrada' }, 'Vila Aurora'),
    false
  );
});

test('shouldNotifyWorkerForNewJob filters notifications by worker preferred categories', () => {
  // Base job is "Pedreiro" in "Vila Aurora"
  // When worker has selected 'Pedreiro'
  assert.equal(
    shouldNotifyWorkerForNewJob(baseJob, 'Vila Aurora', ['Pedreiro', 'Servente de Obras']),
    true
  );

  // When worker selected only 'Eletricista Predial'
  assert.equal(
    shouldNotifyWorkerForNewJob(baseJob, 'Vila Aurora', ['Eletricista Predial']),
    false
  );

  // When worker has empty or undefined preferences (receives all for their region)
  assert.equal(shouldNotifyWorkerForNewJob(baseJob, 'Vila Aurora', []), true);
  assert.equal(shouldNotifyWorkerForNewJob(baseJob, 'Vila Aurora', undefined), true);

  // When category matches but region is outside
  assert.equal(
    shouldNotifyWorkerForNewJob(baseJob, 'Cidade Salmen', ['Pedreiro']),
    false
  );

  // Case-insensitive / partial match
  assert.equal(
    shouldNotifyWorkerForNewJob(baseJob, 'Vila Aurora', ['pedreiro']),
    true
  );
});

test('notification creation and read-state transitions work cleanly', () => {
  const jobNotif = createNewJobNotification(baseJob, '2026-11-14T14:00:00Z');
  const acceptedNotif = createAcceptedApplicationNotification(baseJob, '2026-11-14T14:05:00Z');

  assert.equal(jobNotif.type, 'nova_vaga_regiao');
  assert.match(jobNotif.message, /3 vagas/);
  assert.equal(acceptedNotif.type, 'candidatura_aceita');
  assert.match(acceptedNotif.message, /aceitou sua candidatura/);

  let list = [acceptedNotif, jobNotif];
  assert.equal(countUnreadNotifications(list), 2);

  list = markNotificationAsRead(list, acceptedNotif.id);
  assert.equal(countUnreadNotifications(list), 1);

  list = markAllNotificationsAsRead(list);
  assert.equal(countUnreadNotifications(list), 0);
});
