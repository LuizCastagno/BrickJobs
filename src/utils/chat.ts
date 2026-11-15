import type {
  ChatMessage,
  JobApplication,
  JobPosting,
  UserRole,
} from '../types/brickjobs';

export function canOpenApplicationChat(
  application: Pick<JobApplication, 'status'> | null | undefined
): boolean {
  return Boolean(
    application &&
      (application.status === 'aceita' || application.status === 'concluida')
  );
}

export function getMessagesForApplication(
  messages: ChatMessage[],
  applicationId: string
): ChatMessage[] {
  return messages
    .filter((msg) => msg.applicationId === applicationId)
    .slice()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function createChatMessage(params: {
  application: JobApplication;
  senderRole: UserRole;
  senderName: string;
  text: string;
  now?: Date;
}): { ok: true; message: ChatMessage } | { ok: false; error: string } {
  if (!canOpenApplicationChat(params.application)) {
    return {
      ok: false,
      error: 'O chat só é liberado após a aceitação da candidatura.',
    };
  }

  const trimmedText = params.text.trim();
  if (!trimmedText) {
    return {
      ok: false,
      error: 'Digite uma mensagem antes de enviar.',
    };
  }

  const timestamp = (params.now ?? new Date()).toISOString();
  const safeName =
    params.senderName.trim() ||
    (params.senderRole === 'contratante' ? 'Construtora' : 'Candidato');

  return {
    ok: true,
    message: {
      id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      applicationId: params.application.id,
      senderRole: params.senderRole,
      senderName: safeName,
      text: trimmedText,
      createdAt: timestamp,
      readByEmployer: params.senderRole === 'contratante',
      readByWorker: params.senderRole === 'contratado',
    },
  };
}

export function markConversationAsRead(
  messages: ChatMessage[],
  applicationId: string,
  viewerRole: UserRole
): ChatMessage[] {
  let changed = false;
  const next = messages.map((msg) => {
    if (msg.applicationId !== applicationId) return msg;
    if (viewerRole === 'contratante' && !msg.readByEmployer) {
      changed = true;
      return { ...msg, readByEmployer: true };
    }
    if (viewerRole === 'contratado' && !msg.readByWorker) {
      changed = true;
      return { ...msg, readByWorker: true };
    }
    return msg;
  });
  return changed ? next : messages;
}

export function countUnreadMessagesForApplication(
  messages: ChatMessage[],
  applicationId: string,
  viewerRole: UserRole
): number {
  return messages.reduce((count, msg) => {
    if (msg.applicationId !== applicationId) return count;
    if (viewerRole === 'contratante' && !msg.readByEmployer) {
      return count + 1;
    }
    if (viewerRole === 'contratado' && !msg.readByWorker) {
      return count + 1;
    }
    return count;
  }, 0);
}

export function getQuickChatPrompts(
  role: UserRole,
  job?: Pick<JobPosting, 'funcao' | 'bairro'>
): string[] {
  const roleLabel = job?.funcao ? `para ${job.funcao}` : 'para a vaga';
  const bairroLabel = job?.bairro ? `no bairro ${job.bairro}` : 'no canteiro';

  if (role === 'contratante') {
    return [
      `Olá! Podemos agendar uma entrevista ${roleLabel} amanhã às 08h?`,
      `Sua contratação ${roleLabel} está confirmada. Quando pode iniciar ${bairroLabel}?`,
      `Por favor, traga RG, CPF e carteira de trabalho no endereço ${bairroLabel}.`,
    ];
  }

  return [
    `Olá! Tenho disponibilidade imediata para entrevista ${roleLabel}.`,
    `Qual o endereço completo e o responsável que devo procurar ${bairroLabel}?`,
    `Confirmado! Estarei no local no horário combinado com meus documentos.`,
  ];
}

export function formatChatTimePtBr(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
