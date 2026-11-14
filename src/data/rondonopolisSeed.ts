import type {
  CompanyProfile,
  JobApplication,
  JobPosting,
  WorkerProfile,
} from '../types/brickjobs';

export const RONDONOPOLIS_REGIONS: string[] = [
  'Toda Rondonópolis e Região',
  'Centro',
  'Vila Aurora',
  'Jardim Primavera',
  'Cidade Salmen',
  'Vila Operária',
  'Parque Sagrada Família',
  'Distrito Industrial',
  'Jardim Atlântico',
  'Jardim Tropical',
  'Coophalis / Residencial',
  'Região Sul / Pedra Preta',
];

export const RONDONOPOLIS_NEIGHBORHOODS: string[] = RONDONOPOLIS_REGIONS.filter(
  (r) => r !== 'Toda Rondonópolis e Região'
);

export const CONSTRUCTION_ROLES: string[] = [
  'Pedreiro',
  'Servente de Obras',
  'Mestre de Obras',
  'Armador de Ferragem',
  'Carpinteiro',
  'Eletricista Predial',
  'Encanador / Hidráulico',
  'Pintor Predial',
  'Azulejista / Revestidor',
  'Operador de Máquinas',
  'Soldador / Serralheiro',
  'Técnico em Segurança do Trabalho',
  'Engenheiro Civil',
];

export const SHIFT_OPTIONS: string[] = [
  'Comercial (07h–17h)',
  'Meio período',
  'Escala 6x1',
  'Empreitada / Por produção',
];

export const AVAILABILITY_OPTIONS: string[] = [
  'Imediata',
  'Em até 7 dias',
  'Em até 15 dias',
  'Finais de semana / Diárias',
];

export const SEED_JOBS: JobPosting[] = [
  {
    id: 'job-roo-1',
    companyId: 'seed-comp-1',
    companyName: 'Construtora Cerrado Sul',
    funcao: 'Pedreiro',
    quantidadeVagas: 5,
    bairro: 'Vila Aurora',
    regiaoInteresse: 'Vila Aurora',
    salarioOuDiaria: 'R$ 195/dia',
    turno: 'Comercial (07h às 17h)',
    descricao: 'Execução de alvenaria estrutural, reboco interno e assentamento de blocos em obra residencial multifamiliar.',
    telefoneContato: '(66) 99612-4410',
    status: 'aberta',
    createdAt: '2026-11-12',
  },
  {
    id: 'job-roo-2',
    companyId: 'seed-comp-2',
    companyName: 'Engenharia Mato Grosso Ltda',
    funcao: 'Armador de Ferragem',
    quantidadeVagas: 3,
    bairro: 'Distrito Industrial',
    regiaoInteresse: 'Distrito Industrial',
    salarioOuDiaria: 'R$ 3.600/mês + benefícios',
    turno: 'Comercial (07h às 17h)',
    descricao: 'Montagem de armaduras para pilares, vigas e sapatas de galpão logístico próximo à BR-163.',
    telefoneContato: '(66) 99934-8120',
    status: 'aberta',
    createdAt: '2026-11-11',
  },
  {
    id: 'job-roo-3',
    companyId: 'seed-comp-3',
    companyName: 'Rondonópolis Obras & Infra',
    funcao: 'Servente de Obras',
    quantidadeVagas: 8,
    bairro: 'Cidade Salmen',
    regiaoInteresse: 'Cidade Salmen',
    salarioOuDiaria: 'R$ 135/dia',
    turno: 'Comercial (07h às 17h)',
    descricao: 'Apoio geral no canteiro, preparo de massa, movimentação de materiais e organização de frentes de trabalho.',
    telefoneContato: '(66) 99205-7740',
    status: 'aberta',
    createdAt: '2026-11-10',
  },
  {
    id: 'job-roo-4',
    companyId: 'seed-comp-4',
    companyName: 'Pantanal Edificações',
    funcao: 'Eletricista Predial',
    quantidadeVagas: 2,
    bairro: 'Jardim Primavera',
    regiaoInteresse: 'Jardim Primavera',
    salarioOuDiaria: 'R$ 3.900/mês',
    turno: 'Comercial (07h às 17h)',
    descricao: 'Passagem de cabeamento, montagem de quadros de distribuição e infraestrutura elétrica de baixa tensão.',
    telefoneContato: '(66) 99981-3095',
    status: 'aberta',
    createdAt: '2026-11-09',
  },
  {
    id: 'job-roo-5',
    companyId: 'seed-comp-1',
    companyName: 'Construtora Cerrado Sul',
    funcao: 'Mestre de Obras',
    quantidadeVagas: 1,
    bairro: 'Centro',
    regiaoInteresse: 'Centro',
    salarioOuDiaria: 'R$ 5.800/mês',
    turno: 'Comercial (07h às 17h)',
    descricao: 'Coordenação de equipes de alvenaria e acabamento, leitura de projetos estruturais e controle de cronograma.',
    telefoneContato: '(66) 99612-4410',
    status: 'aberta',
    createdAt: '2026-11-08',
  },
];

export const SEED_WORKERS: WorkerProfile[] = [
  {
    id: 'worker-roo-1',
    nomeCompleto: 'Marcos Antônio Pereira',
    telefone: '(66) 99641-2280',
    email: 'marcos.pedreiro@exemplo.com.br',
    bairro: 'Vila Operária',
    cidade: 'Rondonópolis - MT',
    regiaoInteresse: 'Toda Rondonópolis e Região',
    funcaoPrincipal: 'Pedreiro',
    disponibilidade: 'Imediata',
    tipoHistorico: 'experiencias',
    pdfCurriculo: null,
    experiencias: [
      {
        id: 'exp-seed-1',
        empresaLocal: 'Construtora Vale Verde · Rondonópolis-MT',
        funcao: 'Pedreiro de Alvenaria',
        dataInicio: '2021-03',
        dataFim: '2024-08',
        atual: false,
        atividades: 'Alvenaria estrutural, reboco e contrapiso em edifícios residenciais.',
      },
      {
        id: 'exp-seed-2',
        empresaLocal: 'Obras Alto Araguaia · Jaciara-MT',
        funcao: 'Azulejista e Acabamento',
        dataInicio: '2024-09',
        dataFim: '2026-06',
        atual: false,
        atividades: 'Assentamento de porcelanato e revestimentos cerâmicos.',
      },
    ],
    resumoProfissional: 'Mais de 5 anos em obras residenciais e comerciais na região sul de Mato Grosso.',
    updatedAt: '2026-11-10',
  },
  {
    id: 'worker-roo-2',
    nomeCompleto: 'Claudinei Rocha dos Santos',
    telefone: '(66) 99918-5503',
    email: 'claudinei.armador@exemplo.com.br',
    bairro: 'Parque Sagrada Família',
    cidade: 'Rondonópolis - MT',
    regiaoInteresse: 'Distrito Industrial',
    funcaoPrincipal: 'Armador de Ferragem',
    disponibilidade: 'Imediata',
    tipoHistorico: 'experiencias',
    pdfCurriculo: null,
    experiencias: [
      {
        id: 'exp-seed-3',
        empresaLocal: 'AgroEstrutura Engenharia · Distrito Industrial',
        funcao: 'Armador de Ferragem',
        dataInicio: '2023-01',
        dataFim: '',
        atual: true,
        atividades: 'Corte, dobra e montagem de ferragem armada para silos e galpões.',
      },
    ],
    resumoProfissional: 'Especialista em leitura de projetos estruturais e ferragem pesada.',
    updatedAt: '2026-11-11',
  },
  {
    id: 'worker-roo-3',
    nomeCompleto: 'Fernanda Oliveira Mendes',
    telefone: '(66) 99712-9014',
    email: 'fernanda.tst@exemplo.com.br',
    bairro: 'Vila Aurora',
    cidade: 'Rondonópolis - MT',
    regiaoInteresse: 'Vila Aurora',
    funcaoPrincipal: 'Técnico em Segurança do Trabalho',
    disponibilidade: 'Em até 7 dias',
    tipoHistorico: 'experiencias',
    pdfCurriculo: null,
    experiencias: [
      {
        id: 'exp-seed-4',
        empresaLocal: 'MT Construtora & Pré-Moldados · Rondonópolis-MT',
        funcao: 'Técnico em Segurança do Trabalho',
        dataInicio: '2022-04',
        dataFim: '2026-09',
        atual: false,
        atividades: 'DDS diário, fiscalização de NR-18 e NR-35, controle de EPIs.',
      },
    ],
    resumoProfissional: 'Atuação completa em canteiros de grande porte com foco em NR-18 e NR-35.',
    updatedAt: '2026-11-12',
  },
];

export const EMPTY_COMPANY_PROFILE: CompanyProfile = {
  id: 'my-company',
  nomeFantasia: '',
  razaoSocial: '',
  cnpj: '',
  responsavel: '',
  telefone: '',
  email: '',
  bairro: 'Centro',
  endereco: '',
  especialidade: 'Obras Residenciais e Comerciais',
  updatedAt: '',
};

export const EMPTY_WORKER_PROFILE: WorkerProfile = {
  id: 'my-worker',
  nomeCompleto: '',
  telefone: '',
  email: '',
  bairro: 'Centro',
  cidade: 'Rondonópolis - MT',
  regiaoInteresse: 'Toda Rondonópolis e Região',
  funcaoPrincipal: 'Pedreiro',
  disponibilidade: 'Imediata',
  tipoHistorico: 'experiencias',
  pdfCurriculo: null,
  experiencias: [],
  resumoProfissional: '',
  updatedAt: '',
};

export interface BrickJobsAppState {
  companyProfile: CompanyProfile;
  workerProfile: WorkerProfile;
  jobs: JobPosting[];
  seedWorkers: WorkerProfile[];
  applications: JobApplication[];
  selectedRegion: string;
}

export const DEFAULT_APP_STATE: BrickJobsAppState = {
  companyProfile: EMPTY_COMPANY_PROFILE,
  workerProfile: EMPTY_WORKER_PROFILE,
  jobs: SEED_JOBS,
  seedWorkers: SEED_WORKERS,
  applications: [],
  selectedRegion: 'Toda Rondonópolis e Região',
};
