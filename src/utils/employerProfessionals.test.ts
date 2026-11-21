/**
 * @file src/utils/employerProfessionals.test.ts
 * @description Testes unitários para classificação de contratados registrados na empresa e profissionais disponíveis para serviço.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { buildEmployerProfessionalsDirectory } from './employerProfessionals';
import type { JobApplication, JobPosting, WorkerProfile } from '../types/brickjobs';

const baseWorkers: WorkerProfile[] = [
  {
    id: 'w-1',
    nomeCompleto: 'Marcos Antônio Pereira',
    telefone: '(66) 99641-2280',
    email: 'marcos@example.com',
    bairro: 'Vila Operária',
    cidade: 'Rondonópolis - MT',
    regiaoInteresse: 'Toda Rondonópolis e Região',
    funcaoPrincipal: 'Pedreiro',
    disponibilidade: 'Imediata',
    tipoHistorico: 'experiencias',
    pdfCurriculo: null,
    experiencias: [
      {
        id: 'exp-1',
        empresaLocal: 'Construtora A',
        funcao: 'Pedreiro',
        dataInicio: '2024-01',
        dataFim: '2025-01',
        atual: false,
      },
    ],
    resumoProfissional: 'Especialista em alvenaria.',
    updatedAt: '2026-11-10',
  },
  {
    id: 'w-2',
    nomeCompleto: 'Claudinei Rocha',
    telefone: '(66) 99918-5503',
    email: 'claudinei@example.com',
    bairro: 'Centro',
    cidade: 'Rondonópolis - MT',
    regiaoInteresse: 'Distrito Industrial',
    funcaoPrincipal: 'Armador de Ferragem',
    disponibilidade: 'Imediata',
    tipoHistorico: 'pdf',
    pdfCurriculo: {
      fileName: 'claudinei-cv.pdf',
      fileSizeBytes: 1024,
      uploadedAt: '2026-11-10',
      dataUrl: 'data:application/pdf;base64,AAA',
    },
    experiencias: [],
    resumoProfissional: 'Armador experiente.',
    updatedAt: '2026-11-11',
  },
  {
    id: 'w-blank',
    nomeCompleto: '   ',
    telefone: '',
    email: '',
    bairro: 'Centro',
    cidade: 'Rondonópolis - MT',
    regiaoInteresse: 'Centro',
    funcaoPrincipal: 'Servente',
    disponibilidade: 'Imediata',
    tipoHistorico: 'experiencias',
    pdfCurriculo: null,
    experiencias: [],
    resumoProfissional: '',
    updatedAt: '',
  },
];

const sampleJobs: JobPosting[] = [
  {
    id: 'job-1',
    companyId: 'my-company',
    companyName: 'Construtora Horizonte',
    funcao: 'Pedreiro',
    quantidadeVagas: 2,
    bairro: 'Vila Aurora',
    regiaoInteresse: 'Vila Aurora',
    salarioOuDiaria: 'R$ 200/dia',
    turno: 'Comercial',
    descricao: 'Alvenaria.',
    telefoneContato: '(66) 99999-0000',
    status: 'aberta',
    createdAt: '2026-11-10',
  },
];

test('classifies workers into available when there are no accepted or completed applications', () => {
  const dir = buildEmployerProfessionalsDirectory({
    workers: baseWorkers,
    applications: [],
    jobs: sampleJobs,
    companyName: 'Construtora Horizonte',
  });

  assert.equal(dir.registrados.length, 0);
  assert.equal(dir.disponiveis.length, 2);
  assert.deepEqual(
    dir.disponiveis.map((d) => d.worker.id),
    ['w-1', 'w-2']
  );
  assert.equal(dir.disponiveis[0].statusLabel, 'Disponível para serviço');
});

test('moves worker with active accepted application into registrados and excludes from disponiveis', () => {
  const apps: JobApplication[] = [
    {
      id: 'app-1',
      jobId: 'job-1',
      workerId: 'w-1',
      workerName: 'Marcos Antônio Pereira',
      appliedAt: '2026-11-14',
      status: 'aceita',
    },
    {
      id: 'app-pending',
      jobId: 'job-1',
      workerId: 'w-2',
      workerName: 'Claudinei Rocha',
      appliedAt: '2026-11-15',
      status: 'pendente',
    },
  ];

  const dir = buildEmployerProfessionalsDirectory({
    workers: baseWorkers,
    applications: apps,
    jobs: sampleJobs,
    companyName: 'Construtora Horizonte',
  });

  assert.equal(dir.registrados.length, 1);
  assert.equal(dir.registrados[0].workerId, 'w-1');
  assert.equal(dir.registrados[0].statusLabel, 'Registrado · Em serviço');
  assert.equal(dir.registrados[0].funcaoContratada, 'Pedreiro');
  assert.equal(dir.registrados[0].bairroObra, 'Vila Aurora');

  // Pending applicant w-2 remains available until accepted
  assert.equal(dir.disponiveis.length, 1);
  assert.equal(dir.disponiveis[0].worker.id, 'w-2');
});

test('includes completed engagements in registrados while keeping completed worker available for new service', () => {
  const apps: JobApplication[] = [
    {
      id: 'app-done',
      jobId: 'job-1',
      workerId: 'w-2',
      workerName: 'Claudinei Rocha',
      appliedAt: '2026-11-01',
      status: 'concluida',
      completedAt: '2026-11-12',
    },
  ];

  const dir = buildEmployerProfessionalsDirectory({
    workers: baseWorkers,
    applications: apps,
    jobs: sampleJobs,
  });

  assert.equal(dir.registrados.length, 1);
  assert.equal(dir.registrados[0].statusLabel, 'Registrado · Serviço concluído');
  assert.equal(dir.registrados[0].pdfFileName, 'claudinei-cv.pdf');
  assert.equal(dir.disponiveis.length, 2);
});
