import type { JobPosting, WorkerNotification } from '../types/brickjobs';

const ALL_REGIONS = 'Toda Rondonópolis e Região';

export function shouldNotifyWorkerForNewJob(
  job: JobPosting,
  workerRegion: string
): boolean {
  if (job.status !== 'aberta') return false;

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
  return {
    id: `notif-job-${job.id}-${Date.now()}`,
    type: 'nova_vaga_regiao',
    title: `Nova vaga na sua região: ${job.funcao}`,
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
