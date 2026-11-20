/**
 * @file src/utils/notifications.ts
 * @description Filtragem de vagas compatíveis por região/categorias preferidas e criação de notificações internas do trabalhador.
 */

import type { JobPosting, WorkerNotification } from '../types/brickjobs';

const ALL_REGIONS = 'Toda Rondonópolis e Região';

export function isJobMatchingWorkerCategories(
  job: JobPosting,
  preferredCategories?: string[]
): boolean {
  if (!preferredCategories || preferredCategories.length === 0) {
    return true;
  }

  const cleanCategories = preferredCategories
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);

  if (cleanCategories.length === 0) {
    return true;
  }

  const jobFuncaoNorm = job.funcao.trim().toLowerCase();
  const jobTagsNorm = (job.skillTags ?? []).map((t) => t.trim().toLowerCase());
  const jobDescNorm = job.descricao.trim().toLowerCase();

  return cleanCategories.some((cat) => {
    if (
      jobFuncaoNorm === cat ||
      jobFuncaoNorm.includes(cat) ||
      cat.includes(jobFuncaoNorm)
    ) {
      return true;
    }

    if (jobTagsNorm.some((tag) => tag.includes(cat) || cat.includes(tag))) {
      return true;
    }

    const root = cat.replace(/ (predial|de obras|civil|\/.*)$/i, '').trim();
    if (root.length >= 4 && (jobFuncaoNorm.includes(root) || jobDescNorm.includes(root))) {
      return true;
    }

    return false;
  });
}

export function shouldNotifyWorkerForNewJob(
  job: JobPosting,
  workerRegion: string,
  preferredCategories?: string[]
): boolean {
  if (job.status !== 'aberta') return false;

  if (!isJobMatchingWorkerCategories(job, preferredCategories)) {
    return false;
  }

  const normalizedWorkerRegion = workerRegion.trim().toLowerCase();
  if (!normalizedWorkerRegion || normalizedWorkerRegion === ALL_REGIONS.toLowerCase()) {
    return true;
  }

  return (
    job.bairro.trim().toLowerCase() === normalizedWorkerRegion ||
    job.regiaoInteresse.trim().toLowerCase() === normalizedWorkerRegion ||
    job.regiaoInteresse.trim().toLowerCase() === ALL_REGIONS.toLowerCase()
  );
}

export function createNewJobNotification(
  job: JobPosting,
  createdAt: string = new Date().toISOString()
): WorkerNotification {
  const vagasLabel = job.quantidadeVagas === 1 ? '1 vaga' : `${job.quantidadeVagas} vagas`;
  const urgentPrefix =
    job.prioridade === 'urgente' ? 'Vaga urgente na sua região' : 'Nova vaga na sua região';
  return {
    id: `notif-job-${job.id}-${Date.now()}`,
    type: 'nova_vaga_regiao',
    title: `${urgentPrefix}: ${job.funcao}`,
    message: `${job.companyName} abriu ${vagasLabel} em ${job.bairro} (${job.salarioOuDiaria}).`,
    jobId: job.id,
    region: job.bairro,
    createdAt,
    read: false,
  };
}

export function createAcceptedApplicationNotification(
  job: JobPosting,
  createdAt: string = new Date().toISOString()
): WorkerNotification {
  return {
    id: `notif-acc-${job.id}-${Date.now()}`,
    type: 'candidatura_aceita',
    title: `Candidatura aceita: ${job.funcao}`,
    message: `${job.companyName} aceitou sua candidatura para a obra em ${job.bairro}. Contato: ${job.telefoneContato}.`,
    jobId: job.id,
    region: job.bairro,
    createdAt,
    read: false,
  };
}

export function countUnreadNotifications(
  notifications: WorkerNotification[]
): number {
  return notifications.reduce((acc, n) => (n.read ? acc : acc + 1), 0);
}

export function markNotificationAsRead(
  notifications: WorkerNotification[],
  notificationId: string
): WorkerNotification[] {
  return notifications.map((n) =>
    n.id === notificationId ? { ...n, read: true } : n
  );
}

export function markAllNotificationsAsRead(
  notifications: WorkerNotification[]
): WorkerNotification[] {
  return notifications.map((n) => (n.read ? n : { ...n, read: true }));
}
