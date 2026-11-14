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

export interface JobPosting {
  id: string;
  companyId: string;
  companyName: string;
  funcao: string;
  quantidadeVagas: number;
  bairro: string;
  regiaoInteresse: string;
  salarioOuDiaria: string;
  turno: string;
  descricao: string;
  telefoneContato: string;
  status: 'aberta' | 'encerrada';
  createdAt: string;
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

export interface JobApplication {
  id: string;
  jobId: string;
  workerId: string;
  workerName: string;
  appliedAt: string;
}
