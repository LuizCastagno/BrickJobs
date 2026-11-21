/**
 * @file src/utils/employerProfessionals.ts
 * @description Classificação e visualização somente leitura de profissionais registrados na empresa (contratados/concluídos) e profissionais disponíveis para serviço.
 */

import type {
  JobApplication,
  JobPosting,
  WorkerProfile,
} from '../types/brickjobs';
import { calculateTotalExperienceMonths } from './duration';

export type ProfessionalDirectoryFilter = 'todos' | 'registrados' | 'disponiveis';

export interface RegisteredEmployerProfessional {
  key: string;
  applicationId: string;
  workerId: string;
  nomeCompleto: string;
  fotoPerfilUrl?: string;
  funcaoContratada: string;
  empresaContratante: string;
  bairroObra: string;
  status: 'aceita' | 'concluida';
  statusLabel: string;
  appliedAt: string;
  completedAt?: string;
  telefone?: string;
  resumoProfissional?: string;
  totalExperienceMonths: number;
  experiencias: WorkerProfile['experiencias'];
  pdfFileName?: string;
}

export interface AvailableServiceProfessional {
  worker: WorkerProfile;
  totalExperienceMonths: number;
  statusLabel: string;
}

export interface EmployerProfessionalsDirectory {
  registrados: RegisteredEmployerProfessional[];
  disponiveis: AvailableServiceProfessional[];
}

export function buildEmployerProfessionalsDirectory(params: {
  workers: WorkerProfile[];
  applications: JobApplication[];
  jobs: JobPosting[];
  companyName?: string;
}): EmployerProfessionalsDirectory {
  const { workers, applications, jobs, companyName } = params;

  const jobsById = new Map<string, JobPosting>();
  for (const job of jobs) {
    jobsById.set(job.id, job);
  }

  const workersById = new Map<string, WorkerProfile>();
  for (const worker of workers) {
    if (worker.id) {
      workersById.set(worker.id, worker);
    }
  }

  const hiredApps = applications
    .filter(
      (app): app is JobApplication & { status: 'aceita' | 'concluida' } =>
        app.status === 'aceita' || app.status === 'concluida'
    )
    .sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === 'aceita' ? -1 : 1;
      }
      return b.appliedAt.localeCompare(a.appliedAt);
    });

  const activeHiredWorkerIds = new Set<string>();
  const registrados: RegisteredEmployerProfessional[] = [];

  for (const app of hiredApps) {
    if (app.status === 'aceita' && app.workerId) {
      activeHiredWorkerIds.add(app.workerId);
    }

    const matchedWorker = workersById.get(app.workerId);
    const matchedJob = jobsById.get(app.jobId);
    const totalMonths = matchedWorker
      ? calculateTotalExperienceMonths(matchedWorker.experiencias)
      : 0;

    registrados.push({
      key: `registered-${app.id}`,
      applicationId: app.id,
      workerId: app.workerId,
      nomeCompleto:
        matchedWorker?.nomeCompleto.trim() ||
        app.workerName.trim() ||
        'Colaborador registrado',
      fotoPerfilUrl: matchedWorker?.fotoPerfilUrl,
      funcaoContratada:
        matchedJob?.funcao ||
        matchedWorker?.funcaoPrincipal ||
        'Profissional da construção',
      empresaContratante:
        matchedJob?.companyName ||
        companyName?.trim() ||
        'Construtora contratante',
      bairroObra:
        matchedJob?.bairro || matchedWorker?.bairro || 'Rondonópolis-MT',
      status: app.status,
      statusLabel:
        app.status === 'aceita'
          ? 'Registrado · Em serviço'
          : 'Registrado · Serviço concluído',
      appliedAt: app.appliedAt,
      completedAt: app.completedAt,
      telefone: matchedWorker?.telefone,
      resumoProfissional: matchedWorker?.resumoProfissional,
      totalExperienceMonths: totalMonths,
      experiencias: matchedWorker?.experiencias ?? [],
      pdfFileName:
        matchedWorker?.tipoHistorico === 'pdf' && matchedWorker.pdfCurriculo
          ? matchedWorker.pdfCurriculo.fileName
          : undefined,
    });
  }

  const disponiveis: AvailableServiceProfessional[] = [];
  for (const worker of workers) {
    if (!worker.nomeCompleto.trim()) continue;
    if (activeHiredWorkerIds.has(worker.id)) continue;
    if (!worker.disponibilidade.trim()) continue;

    disponiveis.push({
      worker,
      totalExperienceMonths: calculateTotalExperienceMonths(worker.experiencias),
      statusLabel: 'Disponível para serviço',
    });
  }

  return {
    registrados,
    disponiveis,
  };
}
