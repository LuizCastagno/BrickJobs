import assert from 'node:assert/strict';
import test from 'node:test';
import type { JobApplication, JobPosting } from '../types/brickjobs';
import {
  buildContractCelebrationEvent,
  findUnseenAcceptedApplication,
  markAcceptedApplicationsSeen,
} from './contractCelebration';

const sampleJob: JobPosting = {
  id: 'job-1',
  companyId: 'comp-1',
  companyName: 'Construtora Araguaia',
  funcao: 'Pedreiro',
  quantidadeVagas: 2,
  bairro: 'Vila Aurora',
  regiaoInteresse: 'Vila Aurora',
  salarioOuDiaria: 'R$ 220/dia',
  turno: 'Diurno',
  descricao: 'Alvenaria estrutural',
  telefoneContato: '(66) 99999-1111',
  status: 'aberta',
  createdAt: '2026-11-18',
};

const sampleApplications: JobApplication[] = [
  {
    id: 'app-pending',
    jobId: 'job-1',
    workerId: 'w-1',
    workerName: 'Carlos Souza',
    appliedAt: '2026-11-18',
    status: 'pendente',
  },
  {
    id: 'app-accepted-1',
    jobId: 'job-1',
    workerId: 'w-2',
    workerName: 'João Pereira',
    appliedAt: '2026-11-18',
    status: 'aceita',
  },
  {
    id: 'app-completed',
    jobId: 'job-1',
    workerId: 'w-3',
    workerName: 'Marcos Lima',
    appliedAt: '2026-11-17',
    status: 'concluida',
    completedAt: '2026-11-18',
  },
];

test('findUnseenAcceptedApplication returns only unseen accepted applications', () => {
  const first = findUnseenAcceptedApplication(sampleApplications, []);
  assert.equal(first?.id, 'app-accepted-1');

  const afterSeen = findUnseenAcceptedApplication(sampleApplications, ['app-accepted-1']);
  assert.equal(afterSeen, null);

  const onlyPendingOrCompleted = findUnseenAcceptedApplication(
    [sampleApplications[0], sampleApplications[2]],
    []
  );
  assert.equal(onlyPendingOrCompleted, null);
});

test('markAcceptedApplicationsSeen deduplicates and ignores blank IDs', () => {
  const next = markAcceptedApplicationsSeen(['app-1'], ['app-1', 'app-2', '  ', 'app-3']);
  assert.deepEqual(next, ['app-1', 'app-2', 'app-3']);
});

test('buildContractCelebrationEvent formats distinct messages for company and worker', () => {
  const app = sampleApplications[1];
  const companyEvent = buildContractCelebrationEvent({
    application: app,
    job: sampleJob,
    role: 'contratante',
    now: new Date('2026-11-20T12:00:00.000Z'),
  });
  assert.equal(companyEvent.id, 'celebration-contratante-app-accepted-1');
  assert.equal(companyEvent.title, 'Contrato aceito com sucesso!');
  assert.match(companyEvent.subtitle, /João Pereira/);
  assert.match(companyEvent.subtitle, /Pedreiro/);
  assert.match(companyEvent.subtitle, /Vila Aurora/);

  const workerEvent = buildContractCelebrationEvent({
    application: app,
    job: sampleJob,
    role: 'contratado',
    now: new Date('2026-11-20T12:00:00.000Z'),
  });
  assert.equal(workerEvent.id, 'celebration-contratado-app-accepted-1');
  assert.equal(workerEvent.title, 'Parabéns! Contrato aceito!');
  assert.match(workerEvent.subtitle, /Construtora Araguaia/);
  assert.match(workerEvent.subtitle, /Pedreiro/);
});
