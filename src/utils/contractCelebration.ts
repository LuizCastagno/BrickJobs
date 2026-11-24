/**
 * @file src/utils/contractCelebration.ts
 * @description Regras puras para o fluxo de celebração de contrato aceito (`status === 'aceita'`).
 *   Garante que a animação de confetes e o aviso comemorativo disparem apenas uma vez por
 *   candidatura aceita no lado do trabalhador (persistido em localStorage) e imediatamente
 *   ao confirmar no lado da construtora.
 */
import type { JobApplication, JobPosting, UserRole } from '../types/brickjobs';

/** Payload estruturado exibido no card comemorativo de contrato aceito. */
export interface ContractCelebrationEvent {
  id: string;
  applicationId: string;
  role: UserRole;
  jobRole: string;
  companyName: string;
  workerName: string;
  neighborhood: string;
  title: string;
  subtitle: string;
  createdAt: string;
}

const WORKER_SEEN_ACCEPTED_KEY = 'brickjobs_worker_seen_accepted_v1';

/** Carrega os IDs de candidaturas aceitas já celebradas no portal do trabalhador. */
export function loadSeenAcceptedApplicationIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(WORKER_SEEN_ACCEPTED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
  } catch {
    return [];
  }
}

/** Salva de forma deduplicada os IDs de contratos aceitos já exibidos ao trabalhador. */
export function saveSeenAcceptedApplicationIds(ids: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    const unique = Array.from(new Set(ids));
    window.localStorage.setItem(WORKER_SEEN_ACCEPTED_KEY, JSON.stringify(unique));
  } catch {
    // Ignora erros de cota de armazenamento do navegador
  }
}

/** Adiciona novos IDs ao conjunto de candidaturas aceitas já visualizadas, ignorando strings vazias. */
export function markAcceptedApplicationsSeen(
  seenIds: string[],
  appIds: string[]
): string[] {
  const next = new Set(seenIds);
  for (const id of appIds) {
    if (typeof id === 'string' && id.trim().length > 0) {
      next.add(id);
    }
  }
  return Array.from(next);
}

/**
 * Localiza a candidatura aceita (`status === 'aceita'`) mais recente que ainda não foi
 * celebrada no lado do trabalhador. Candidaturas pendentes ou concluídas são ignoradas para que
 * o confete dispare exclusivamente na aceitação do contrato.
 */
export function findUnseenAcceptedApplication(
  applications: JobApplication[],
  seenIds: string[]
): JobApplication | null {
  const seenSet = new Set(seenIds);
  for (const app of applications) {
    if (app.status === 'aceita' && !seenSet.has(app.id)) {
      return app;
    }
  }
  return null;
}

/** Constrói o evento comemorativo customizado para o perfil Contratante ou Contratado. */
export function buildContractCelebrationEvent(params: {
  application: JobApplication;
  job?: JobPosting | null;
  role: UserRole;
  companyNameOverride?: string;
  now?: Date;
}): ContractCelebrationEvent {
  const { application, job, role, companyNameOverride, now = new Date() } = params;
  const workerName = application.workerName.trim() || 'Colaborador';
  const companyName =
    companyNameOverride?.trim() || job?.companyName?.trim() || 'Construtora parceira';
  const jobRole = job?.funcao?.trim() || 'Obra contratada';
  const neighborhood = job?.bairro?.trim() || 'Rondonópolis-MT';

  const title =
    role === 'contratante'
      ? 'Contrato aceito com sucesso!'
      : 'Parabéns! Contrato aceito!';

  const subtitle =
    role === 'contratante'
      ? `${workerName} foi aprovado(a) para ${jobRole} em ${neighborhood}. O chat da obra já está liberado.`
      : `${companyName} aceitou sua candidatura para ${jobRole} em ${neighborhood}. Combine os detalhes pelo chat.`;

  return {
    id: `celebration-${role}-${application.id}`,
    applicationId: application.id,
    role,
    jobRole,
    companyName,
    workerName,
    neighborhood,
    title,
    subtitle,
    createdAt: now.toISOString(),
  };
}
