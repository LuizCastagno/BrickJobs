export type UserRole = 'contratante' | 'contratado';

export interface CompanyProfile {
  id: string;
  nomeFantasia: string;
  razaoSocial: string;
  cnpj: string;
  responsavel: string;
  telefone: string;
  email: string;
  bairro: string;
  endereco: string;
  especialidade: string;
  updatedAt: string;
}

export type ContractType = 'CLT' | 'Autônomo' | 'Temporário';

export type ExperienceLevel =
  | 'Sem experiência / Auxiliar'
  | 'Intermediário (1 a 3 anos)'
  | 'Experiente (3+ anos)';

export interface JobPosting {
  id: string;
  companyId: string;
  companyName: string;
  funcao: string;
  quantidadeVagas: number;
  bairro: string;
  regiaoInteresse: string;
  salarioOuDiaria: string;
  beneficios?: string;
  tipoContrato?: ContractType;
  nivelExperiencia?: ExperienceLevel;
  turno: string;
  descricao: string;
  skillTags?: string[];
  telefoneContato: string;
  status: 'aberta' | 'encerrada';
  createdAt: string;
  closedAt?: string;
}

export interface WorkExperience {
  id: string;
  empresaLocal: string;
  funcao: string;
  dataInicio: string; // YYYY-MM or YYYY-MM-DD
  dataFim: string; // YYYY-MM or YYYY-MM-DD, empty if atual
  atual: boolean;
  atividades?: string;
}

export interface PdfResume {
  fileName: string;
  fileSizeBytes: number;
  uploadedAt: string;
  dataUrl: string;
}

export type ResumeMode = 'pdf' | 'experiencias';

export interface WorkerProfile {
  id: string;
  nomeCompleto: string;
  telefone: string;
  email: string;
  bairro: string;
  cidade: string;
  regiaoInteresse: string;
  funcaoPrincipal: string;
  disponibilidade: string;
  tipoHistorico: ResumeMode;
  pdfCurriculo: PdfResume | null;
  experiencias: WorkExperience[];
  resumoProfissional: string;
  updatedAt: string;
}

export type ApplicationStatus = 'pendente' | 'aceita' | 'concluida';

export interface JobApplication {
  id: string;
  jobId: string;
  workerId: string;
  workerName: string;
  appliedAt: string;
  status: ApplicationStatus;
}

export interface CompanyRating {
  id: string;
  applicationId: string;
  companyId: string;
  companyName: string;
  jobId: string;
  jobRole: string;
  workerId: string;
  workerName: string;
  stars: number;
  comment?: string;
  createdAt: string;
}

export type NotificationType =
  | 'candidatura_aceita'
  | 'nova_vaga_regiao'
  | 'lembrete_trabalho';

export interface WorkerNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  jobId?: string;
  applicationId?: string;
  region?: string;
  createdAt: string;
  read: boolean;
}

export type WorkReminderStatus = 'agendado' | 'notificado' | 'cancelado';

export interface WorkScheduleReminder {
  id: string;
  applicationId: string;
  jobId: string;
  companyName: string;
  jobRole: string;
  neighborhood: string;
  scheduledStartAt: string;
  reminderAt: string;
  locationNote?: string;
  scheduledByRole: UserRole;
  status: WorkReminderStatus;
  createdAt: string;
  notifiedAt?: string;
}

export interface ChatMessage {
  id: string;
  applicationId: string;
  senderRole: UserRole;
  senderName: string;
  text: string;
  createdAt: string;
  readByEmployer: boolean;
  readByWorker: boolean;
}
