/**
 * @file EmployerPortal.tsx
 * @description Portal da Construtora (Contratante): cadastro da empresa, publicação de vagas,
 *   monitoramento meteorológico, calculadora de rescisão CLT,
 *   dashboards mensais, gestão de candidaturas e busca de profissionais.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Building2,
  Calculator,
  Check,
  CheckCircle2,
  Download,
  FileText,
  Flame,
  MapPin,
  MessageSquare,
  Minus,
  Phone,
  Plus,
  Star,
  Users,
  X,
} from 'lucide-react';
import {
  COMPANY_SPECIALTY_OPTIONS,
  CONSTRUCTION_ROLES,
  CONTRACT_TYPE_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
  RONDONOPOLIS_NEIGHBORHOODS,
  SHIFT_OPTIONS,
} from '../data/rondonopolisSeed';
import type {
  ChatMessage,
  CompanyProfile,
  CompanyRating,
  ContractType,
  ExperienceLevel,
  JobApplication,
  JobPosting,
  JobPriority,
  RequiredDocumentKey,
  WorkerProfile,
} from '../types/brickjobs';
import { countUnreadMessagesForApplication } from '../utils/chat';
import {
  calculateExperienceMonths,
  calculateTotalExperienceMonths,
  formatDurationPtBr,
  formatMonthYearPtBr,
} from '../utils/duration';
import {
  canCompleteWork,
  computeCompanyRatingSummary,
  filterRatingsForCompany,
  formatRatingSummaryLabel,
  getRatingForApplication,
} from '../utils/ratings';
import {
  CONSTRUCTION_SKILL_TAGS,
  formatCompetencyList,
  formatSkillTagLabel,
  getJobSkillTags,
  inferJobSkillTags,
  parseCompetencyList,
  toggleSkillTagSelection,
} from '../utils/skillTags';
import {
  getJobPriorityMeta,
  JOB_PRIORITY_OPTIONS,
  normalizeJobPriority,
} from '../utils/jobPriority';
import {
  TAB_TRANSITION_CONFIG,
  TAB_TRANSITION_VARIANTS,
} from '../utils/motionPresets';
import {
  REGISTRANT_SEX_OPTIONS,
  isValidDocumentAttachment,
  validateRequiredRegistrationDocuments,
} from '../utils/requiredDocuments';
import {
  buildEmployerProfessionalsDirectory,
  type ProfessionalDirectoryFilter,
} from '../utils/employerProfessionals';
import {
  exportRegisteredProfessionalsCsv,
  exportRegisteredProfessionalsPdf,
} from '../utils/employerProfessionalsExport';
import { EmployerMonthlyDashboard } from './EmployerMonthlyDashboard';
import { EmployerStatisticsTab } from './EmployerStatisticsTab';
import { JobDescriptionSuggestions } from './JobDescriptionSuggestions';
import { PerformanceSummaryCard } from './PerformanceSummaryCard';
import { ProfileAvatar } from './ProfileAvatar';
import { ProfilePhotoField } from './ProfilePhotoField';
import { RainAlertsPanel } from './RainAlertsPanel';
import { RequiredDocumentsSection } from './RequiredDocumentsSection';
import { SelectWrapper } from './SelectWrapper';
import { SeveranceCalculatorPanel } from './SeveranceCalculatorPanel';

export type EmployerTab =
  | 'vagas'
  | 'estatisticas'
  | 'cadastro'
  | 'profissionais';

interface EmployerPortalProps {
  activeTab: EmployerTab;
  onChangeTab: (tab: EmployerTab) => void;
  companyProfile: CompanyProfile;
  onSaveCompanyProfile: (profile: CompanyProfile) => void;
  jobs: JobPosting[];
  onCreateJob: (job: Omit<JobPosting, 'id' | 'createdAt' | 'status'>) => void;
  onUpdateJobVacancies: (jobId: string, delta: number) => void;
  onToggleJobStatus: (jobId: string) => void;
  workers: WorkerProfile[];
  applications: JobApplication[];
  companyRatings: CompanyRating[];
  onAcceptApplication: (applicationId: string) => void;
  onCompleteApplication: (applicationId: string) => void;
  chatMessages: ChatMessage[];
  onOpenChat: (applicationId: string) => void;
  selectedRegion: string;
  onChangeRegion: (region: string) => void;
}

export const EmployerPortal: React.FC<EmployerPortalProps> = ({
  activeTab,
  onChangeTab,
  companyProfile,
  onSaveCompanyProfile,
  jobs,
  onCreateJob,
  onUpdateJobVacancies,
  onToggleJobStatus,
  workers,
  applications,
  companyRatings,
  onAcceptApplication,
  onCompleteApplication,
  chatMessages,
  onOpenChat,
  selectedRegion,
  onChangeRegion,
}) => {
  // Company registration state
  const [companyForm, setCompanyForm] = useState<CompanyProfile>(companyProfile);
  const lastSyncedCompanyProfileRef = useRef<string>(JSON.stringify(companyProfile));
  const [companyError, setCompanyError] = useState('');
  const [companySavedMsg, setCompanySavedMsg] = useState('');
  const [companyMissingDocKeys, setCompanyMissingDocKeys] = useState<
    RequiredDocumentKey[]
  >([]);
  const [companySexError, setCompanySexError] = useState(false);

  useEffect(() => {
    const serialized = JSON.stringify(companyProfile);
    if (serialized !== lastSyncedCompanyProfileRef.current) {
      lastSyncedCompanyProfileRef.current = serialized;
      setCompanyForm(companyProfile);
    }
  }, [companyProfile]);

  // Job posting form state
  const [selectedRoleOption, setSelectedRoleOption] = useState<string>('Pedreiro');
  const [customRole, setCustomRole] = useState<string>('');
  const [quantidadeVagas, setQuantidadeVagas] = useState<number>(2);
  const [jobBairro, setJobBairro] = useState<string>(
    companyProfile.bairro || 'Vila Aurora'
  );
  const [jobTurno, setJobTurno] = useState<string>(SHIFT_OPTIONS[0]);
  const [jobSalario, setJobSalario] = useState<string>('');
  const [jobBeneficios, setJobBeneficios] = useState<string>('');
  const [jobContrato, setJobContrato] = useState<ContractType>('CLT');
  const [jobExperiencia, setJobExperiencia] = useState<ExperienceLevel>(
    'Intermediário (1 a 3 anos)'
  );
  const [jobPrioridade, setJobPrioridade] = useState<JobPriority>('normal');
  const [jobSkillTags, setJobSkillTags] = useState<string[]>([]);
  const [jobReqCompetencies, setJobReqCompetencies] = useState<string>('');
  const [jobPrefCompetencies, setJobPrefCompetencies] = useState<string>('');
  const [jobDescricao, setJobDescricao] = useState<string>('');
  const [jobError, setJobError] = useState<string>('');
  const [jobSavedMsg, setJobSavedMsg] = useState<string>('');

  // Read-only professionals directory filter ('todos' | 'registrados' | 'disponiveis')
  const [professionalView, setProfessionalView] =
    useState<ProfessionalDirectoryFilter>('todos');
  const [isExportingRegistered, setIsExportingRegistered] = useState<boolean>(false);
  const [registeredExportFeedback, setRegisteredExportFeedback] = useState<{
    kind: 'success' | 'error';
    message: string;
  } | null>(null);
  const [employerModalMode, setEmployerModalMode] = useState<'severance' | 'rain' | null>(null);

  const isCompanyRegistered = Boolean(
    companyProfile.nomeFantasia.trim() && companyProfile.telefone.trim()
  );

  const companyJobs = useMemo(
    () => jobs.filter((job) => job.companyId === companyProfile.id),
    [jobs, companyProfile.id]
  );

  const totalOpenVacanciesByCompany = useMemo(
    () =>
      companyJobs
        .filter((j) => j.status === 'aberta')
        .reduce((sum, j) => sum + j.quantidadeVagas, 0),
    [companyJobs]
  );

  const companyRatingSummary = useMemo(
    () =>
      computeCompanyRatingSummary(
        companyRatings,
        companyProfile.id,
        companyProfile.nomeFantasia
      ),
    [companyRatings, companyProfile.id, companyProfile.nomeFantasia]
  );

  const companyReviews = useMemo(
    () =>
      filterRatingsForCompany(
        companyRatings,
        companyProfile.id,
        companyProfile.nomeFantasia
      ),
    [companyRatings, companyProfile.id, companyProfile.nomeFantasia]
  );

  const professionalsDirectory = useMemo(
    () =>
      buildEmployerProfessionalsDirectory({
        workers,
        applications,
        jobs,
        companyName: companyProfile.nomeFantasia,
      }),
    [workers, applications, jobs, companyProfile.nomeFantasia]
  );

  const visibleApplications = useMemo(
    () =>
      applications
        .map((app) => {
          const relatedJob = jobs.find((j) => j.id === app.jobId);
          return relatedJob ? { app, relatedJob } : null;
        })
        .filter((item): item is { app: JobApplication; relatedJob: JobPosting } =>
          Boolean(item)
        ),
    [applications, jobs]
  );

  const exportRegisteredTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (exportRegisteredTimerRef.current !== null) {
        window.clearTimeout(exportRegisteredTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!employerModalMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEmployerModalMode(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [employerModalMode]);

  const handleExportRegisteredPdf = () => {
    if (isExportingRegistered) return;
    setRegisteredExportFeedback(null);
    setIsExportingRegistered(true);
    if (exportRegisteredTimerRef.current !== null) {
      window.clearTimeout(exportRegisteredTimerRef.current);
    }
    exportRegisteredTimerRef.current = window.setTimeout(() => {
      exportRegisteredTimerRef.current = null;
      const res = exportRegisteredProfessionalsPdf(
        companyProfile,
        professionalsDirectory.registrados
      );
      setIsExportingRegistered(false);
      if (res.ok) {
        setRegisteredExportFeedback({
          kind: 'success',
          message: `PDF ${res.fileName} exportado com ${res.exportedCount} ${
            res.exportedCount === 1
              ? 'profissional registrado'
              : 'profissionais registrados'
          }.`,
        });
      } else {
        setRegisteredExportFeedback({
          kind: 'error',
          message: res.error,
        });
      }
    }, 150);
  };

  const handleExportRegisteredCsv = () => {
    setRegisteredExportFeedback(null);
    const res = exportRegisteredProfessionalsCsv(
      companyProfile,
      professionalsDirectory.registrados
    );
    if (res.ok) {
      setRegisteredExportFeedback({
        kind: 'success',
        message: `CSV ${res.fileName} exportado com ${res.exportedCount} ${
          res.exportedCount === 1
            ? 'profissional registrado'
            : 'profissionais registrados'
        }.`,
      });
    } else {
      setRegisteredExportFeedback({
        kind: 'error',
        message: res.error,
      });
    }
  };

  const focusControlBySelector = (selector: string) => {
    if (typeof document === 'undefined') return;
    const el = document.querySelector<HTMLElement>(selector);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus({ preventScroll: true });
    }
  };

  const handleCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCompanyError('');
    setCompanySavedMsg('');
    setCompanyMissingDocKeys([]);
    setCompanySexError(false);

    if (!companyForm.nomeFantasia.trim()) {
      setCompanyError('Informe o nome fantasia ou nome da construtora.');
      focusControlBySelector('#comp-nome-fantasia');
      return;
    }
    if (!companyForm.responsavel.trim()) {
      setCompanyError('Informe o nome do responsável pelo contato.');
      focusControlBySelector('#comp-responsavel');
      return;
    }
    if (!companyForm.telefone.trim()) {
      setCompanyError('Informe um telefone ou WhatsApp para contato.');
      focusControlBySelector('#comp-telefone');
      return;
    }

    const docsValidation = validateRequiredRegistrationDocuments(
      companyForm.sexoResponsavel,
      companyForm.documentosAnexos,
      'contratante'
    );
    if (!docsValidation.valid) {
      setCompanySexError(docsValidation.missingSex);
      setCompanyMissingDocKeys(docsValidation.missingKeys);
      setCompanyError(docsValidation.errorMessage);
      if (docsValidation.missingSex) {
        focusControlBySelector('#comp-sexo-responsavel');
      } else if (docsValidation.missingKeys[0]) {
        focusControlBySelector(
          `[data-testid="doc-trigger-contratante-${docsValidation.missingKeys[0]}"]`
        );
      }
      return;
    }

    const updated: CompanyProfile = {
      ...companyForm,
      nomeFantasia: companyForm.nomeFantasia.trim(),
      razaoSocial: companyForm.razaoSocial.trim(),
      cnpj: companyForm.cnpj.trim(),
      responsavel: companyForm.responsavel.trim(),
      sexoResponsavel: companyForm.sexoResponsavel || '',
      telefone: companyForm.telefone.trim(),
      email: companyForm.email.trim(),
      endereco: companyForm.endereco.trim(),
      especialidade: companyForm.especialidade.trim() || 'Construção Civil',
      documentosAnexos: companyForm.documentosAnexos ?? {},
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    onSaveCompanyProfile(updated);
    setJobBairro(updated.bairro || 'Centro');
    setCompanySavedMsg('Dados da construtora e documentos salvos com sucesso.');
  };

  const handleJobSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setJobError('');
    setJobSavedMsg('');

    if (!isCompanyRegistered) {
      setJobError(
        'Cadastre primeiro os dados gerais da sua construtora na aba "Dados da Empresa".'
      );
      return;
    }

    const finalFuncao =
      selectedRoleOption === 'Outra' ? customRole.trim() : selectedRoleOption;

    if (!finalFuncao) {
      setJobError('Informe a função ou ocupação necessária.');
      return;
    }

    if (!Number.isFinite(quantidadeVagas) || quantidadeVagas < 1) {
      setJobError('A quantidade de vagas deve ser de pelo menos 1.');
      return;
    }

    const finalDescricao =
      jobDescricao.trim() ||
      `Vaga para ${finalFuncao} em obra no bairro ${jobBairro}, Rondonópolis-MT.`;

    const competenciasRequeridas = parseCompetencyList(jobReqCompetencies);
    const competenciasPreferenciais = parseCompetencyList(jobPrefCompetencies);
    const inferredTags = inferJobSkillTags({
      funcao: finalFuncao,
      descricao: finalDescricao,
      competenciasRequeridas,
      competenciasPreferenciais,
    });
    const combinedSkillTags = Array.from(
      new Set([...jobSkillTags, ...inferredTags])
    );

    onCreateJob({
      companyId: companyProfile.id,
      companyName: companyProfile.nomeFantasia,
      companyPhotoUrl: companyProfile.fotoPerfilUrl ?? '',
      funcao: finalFuncao,
      quantidadeVagas: Math.floor(quantidadeVagas),
      bairro: jobBairro,
      regiaoInteresse: jobBairro,
      salarioOuDiaria: jobSalario.trim() || 'A combinar',
      beneficios: jobBeneficios.trim() || undefined,
      tipoContrato: jobContrato,
      nivelExperiencia: jobExperiencia,
      prioridade: normalizeJobPriority(jobPrioridade),
      turno: jobTurno,
      descricao: finalDescricao,
      skillTags: combinedSkillTags,
      competenciasRequeridas:
        competenciasRequeridas.length > 0 ? competenciasRequeridas : undefined,
      competenciasPreferenciais:
        competenciasPreferenciais.length > 0 ? competenciasPreferenciais : undefined,
      telefoneContato: companyProfile.telefone,
    });

    const submittedPriority = normalizeJobPriority(jobPrioridade);
    setCustomRole('');
    setQuantidadeVagas(2);
    setJobSalario('');
    setJobBeneficios('');
    setJobContrato('CLT');
    setJobExperiencia('Intermediário (1 a 3 anos)');
    setJobPrioridade('normal');
    setJobSkillTags([]);
    setJobReqCompetencies('');
    setJobPrefCompetencies('');
    setJobDescricao('');
    setJobSavedMsg(
      submittedPriority === 'urgente'
        ? `Busca urgente registrada: ${finalFuncao} (${Math.floor(quantidadeVagas)} vagas).`
        : `Busca registrada: ${finalFuncao} (${Math.floor(quantidadeVagas)} vagas).`
    );
  };

  const inputClass =
    'w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-base sm:text-sm text-[#111827] dark:text-[#F8FAFC] placeholder:text-[#6B7280] dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-[#C93B1E]';

  const selectClass = `${inputClass} appearance-none pr-10 cursor-pointer`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-nav-safe md:pb-12">
      {/* Header Context */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 lg:gap-8 border-b border-[#E5E7EB] dark:border-[#1E293B] pb-5">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <ProfileAvatar
            name={
              isCompanyRegistered
                ? companyProfile.nomeFantasia
                : 'BrickJobs Construtora'
            }
            photoUrl={companyProfile.fotoPerfilUrl}
            entityType="company"
            size="lg"
            testId="employer-header-avatar"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-[#C93B1E] dark:text-[#F06449]">
              Área do Contratante · Rondonópolis-MT
            </p>
            <h1 className="font-display text-2xl sm:text-3xl lg:text-[2rem] font-bold tracking-tight leading-tight [text-wrap:balance] text-[#111827] dark:text-[#F8FAFC] mt-1 break-words">
              {activeTab === 'vagas'
                ? 'Painel da Construtora - Criar Vagas'
                : activeTab === 'estatisticas'
                  ? 'Estatísticas de Avaliações e Preenchimento'
                  : activeTab === 'cadastro'
                    ? 'Cadastro da Empresa'
                    : activeTab === 'profissionais'
                      ? 'Profissionais Registrados/Disponíveis'
                      : isCompanyRegistered
                        ? companyProfile.nomeFantasia
                        : 'Painel da Construtora'}
            </h1>
            <p className="text-sm text-[#4B5563] dark:text-[#94A3B8] mt-1 break-words">
              {activeTab === 'vagas'
                ? 'Publique vagas na região por função, número de vagas e salário ofertado e tipo de modalidade de contrato'
                : activeTab === 'estatisticas'
                  ? 'Registros e Avaliações de funcionários, tempo de preenchimento das vagas, recursos estatísticos e calculadora de rescisão'
                  : activeTab === 'cadastro'
                    ? 'Cadastro geral da empresa'
                    : activeTab === 'profissionais'
                      ? 'Profissionais disponíveis e registrados na Empresa'
                      : isCompanyRegistered
                        ? `${companyProfile.bairro} · Resp.: ${companyProfile.responsavel} · ${companyProfile.telefone}`
                        : 'Cadastre os dados gerais da empresa e publique buscas por função e número de vagas.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-5 lg:gap-6 lg:justify-end shrink-0">
          <div>
            <p className="font-display text-2xl font-bold text-[#111827] dark:text-[#F8FAFC] tabular-nums">
              {totalOpenVacanciesByCompany}
            </p>
            <p className="text-xs text-[#4B5563] dark:text-[#94A3B8]">Suas vagas abertas</p>
          </div>
          <div className="hidden sm:block h-8 w-px bg-[#E5E7EB] dark:bg-[#1E293B]" aria-hidden="true" />
          <div>
            <p className="font-display text-2xl font-bold text-[#111827] dark:text-[#F8FAFC] tabular-nums">
              {professionalsDirectory.disponiveis.length}
            </p>
            <p className="text-xs text-[#4B5563] dark:text-[#94A3B8]">Profissionais disponíveis</p>
          </div>
          <div className="hidden sm:block h-8 w-px bg-[#E5E7EB] dark:bg-[#1E293B]" aria-hidden="true" />
          <div data-testid="employer-header-rating">
            <p className="font-display text-2xl font-bold text-[#111827] dark:text-[#F8FAFC] tabular-nums inline-flex items-center gap-1.5">
              <Star
                className={`w-5 h-5 shrink-0 ${
                  companyRatingSummary.count > 0
                    ? 'text-amber-500 fill-amber-500 dark:text-amber-400 dark:fill-amber-400'
                    : 'text-[#9CA3AF] dark:text-[#64748B]'
                }`}
                aria-hidden="true"
              />
              <span>{companyRatingSummary.formattedAverage}</span>
            </p>
            <p className="text-xs text-[#4B5563] dark:text-[#94A3B8]">
              {companyRatingSummary.count > 0
                ? `${companyRatingSummary.count} ${
                    companyRatingSummary.count === 1 ? 'avaliação' : 'avaliações'
                  }`
                : 'Nota da empresa'}
            </p>
          </div>

          {activeTab === 'estatisticas' && (
            <button
              type="button"
              onClick={() => setEmployerModalMode('severance')}
              data-testid="employer-open-severance-button"
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#1E293B] hover:bg-[#F9FAFB] dark:hover:bg-[#334155] text-xs sm:text-sm font-semibold text-[#111827] dark:text-[#F8FAFC] inline-flex items-center gap-2 transition-colors cursor-pointer shrink-0"
            >
              <Calculator className="w-4 h-4 text-[#C93B1E] dark:text-[#F06449] shrink-0" aria-hidden="true" />
              <span>Calculadora de rescisão</span>
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {/* TAB 1: Vagas e Busca de Profissionais */}
        {activeTab === 'vagas' && (
          <motion.div
            key="employer-tab-vagas"
            variants={TAB_TRANSITION_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={TAB_TRANSITION_CONFIG}
            className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
          >
          {/* Form Column */}
          <section className="lg:col-span-5 bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl p-5 sm:p-6">
            <h2 className="font-display text-lg font-bold text-[#111827] dark:text-[#F8FAFC]">
              Registrar busca de profissionais
            </h2>
            <p className="text-sm text-[#4B5563] dark:text-[#94A3B8] mt-1">
              Informe a função necessária e a quantidade de vagas para sua obra.
            </p>

            {!isCompanyRegistered && (
              <div className="mt-4 p-4 rounded-xl bg-[#F9FAFB] dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155]">
                <p className="text-sm font-medium text-[#111827] dark:text-[#F8FAFC]">
                  Cadastro da empresa pendente
                </p>
                <p className="text-xs text-[#4B5563] dark:text-[#94A3B8] mt-1">
                  Salve os dados gerais da sua construtora antes de publicar novas vagas.
                </p>
                <button
                  type="button"
                  onClick={() => onChangeTab('cadastro')}
                  className="mt-3 min-h-[44px] px-4 py-2 rounded-lg bg-[#111827] hover:bg-[#1F2937] dark:bg-[#F8FAFC] dark:hover:bg-[#E2E8F0] text-white dark:text-[#0F172A] text-sm font-medium transition-colors cursor-pointer"
                >
                  Cadastrar empresa agora
                </button>
              </div>
            )}

            <form onSubmit={handleJobSubmit} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="job-role-select"
                  className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
                >
                  Função / Ocupação *
                </label>
                <SelectWrapper>
                  <select
                    id="job-role-select"
                    value={selectedRoleOption}
                    onChange={(e) => setSelectedRoleOption(e.target.value)}
                    className={selectClass}
                  >
                    {CONSTRUCTION_ROLES.map((roleName) => (
                      <option key={roleName} value={roleName}>
                        {roleName}
                      </option>
                    ))}
                    <option value="Outra">Outra função...</option>
                  </select>
                </SelectWrapper>
              </div>

              {selectedRoleOption === 'Outra' && (
                <div>
                  <label
                    htmlFor="job-custom-role"
                    className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
                  >
                    Especifique a função *
                  </label>
                  <input
                    id="job-custom-role"
                    type="text"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    placeholder="Ex: Gesseiro, Vidraceiro, Topógrafo"
                    className={inputClass}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="job-quantity"
                    className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
                  >
                    Quantidade de vagas *
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuantidadeVagas((v) => Math.max(1, v - 1))}
                      aria-label="Diminuir quantidade de vagas"
                      className="min-w-[44px] min-h-[44px] rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#1E293B] hover:bg-[#F3F4F6] dark:hover:bg-[#334155] flex items-center justify-center text-[#111827] dark:text-[#F8FAFC] cursor-pointer"
                    >
                      <Minus className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <input
                      id="job-quantity"
                      type="number"
                      min={1}
                      max={200}
                      value={quantidadeVagas}
                      onChange={(e) =>
                        setQuantidadeVagas(Math.max(1, Number(e.target.value) || 1))
                      }
                      className="w-full min-h-[44px] px-3 py-2 text-center rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-base sm:text-sm font-semibold text-[#111827] dark:text-[#F8FAFC] tabular-nums focus:outline-none focus:border-[#C93B1E]"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantidadeVagas((v) => Math.min(200, v + 1))}
                      aria-label="Aumentar quantidade de vagas"
                      className="min-w-[44px] min-h-[44px] rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#1E293B] hover:bg-[#F3F4F6] dark:hover:bg-[#334155] flex items-center justify-center text-[#111827] dark:text-[#F8FAFC] cursor-pointer"
                    >
                      <Plus className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="job-bairro"
                    className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
                  >
                    Bairro da obra *
                  </label>
                  <SelectWrapper>
                    <select
                      id="job-bairro"
                      value={jobBairro}
                      onChange={(e) => setJobBairro(e.target.value)}
                      className={selectClass}
                    >
                      {RONDONOPOLIS_NEIGHBORHOODS.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </SelectWrapper>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="job-shift"
                    className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
                  >
                    Turno / Regime
                  </label>
                  <SelectWrapper>
                    <select
                      id="job-shift"
                      value={jobTurno}
                      onChange={(e) => setJobTurno(e.target.value)}
                      className={selectClass}
                    >
                      {SHIFT_OPTIONS.map((shift) => (
                        <option key={shift} value={shift}>
                          {shift}
                        </option>
                      ))}
                    </select>
                  </SelectWrapper>
                </div>

                <div>
                  <label
                    htmlFor="job-salary"
                    className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
                  >
                    Faixa salarial / Diária (opcional)
                  </label>
                  <input
                    id="job-salary"
                    type="text"
                    value={jobSalario}
                    onChange={(e) => setJobSalario(e.target.value)}
                    placeholder="Ex: R$ 190/dia ou R$ 2.800–3.400"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="job-contract"
                    className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
                  >
                    Tipo de contrato
                  </label>
                  <SelectWrapper>
                    <select
                      id="job-contract"
                      value={jobContrato}
                      onChange={(e) => setJobContrato(e.target.value as ContractType)}
                      className={selectClass}
                    >
                      {CONTRACT_TYPE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </SelectWrapper>
                </div>

                <div>
                  <label
                    htmlFor="job-experience"
                    className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
                  >
                    Nível de experiência
                  </label>
                  <SelectWrapper>
                    <select
                      id="job-experience"
                      value={jobExperiencia}
                      onChange={(e) =>
                        setJobExperiencia(e.target.value as ExperienceLevel)
                      }
                      className={selectClass}
                    >
                      {EXPERIENCE_LEVEL_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </SelectWrapper>
                </div>
              </div>

              <div>
                <label
                  htmlFor="job-priority"
                  className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
                >
                  Prioridade / Urgência da contratação
                </label>
                <SelectWrapper>
                  <select
                    id="job-priority"
                    data-testid="job-priority-select"
                    value={jobPrioridade}
                    onChange={(e) =>
                      setJobPrioridade(normalizeJobPriority(e.target.value))
                    }
                    className={selectClass}
                  >
                    {JOB_PRIORITY_OPTIONS.map((opt) => {
                      const meta = getJobPriorityMeta(opt);
                      return (
                        <option key={opt} value={opt}>
                          {meta.selectLabel}
                        </option>
                      );
                    })}
                  </select>
                </SelectWrapper>
                {jobPrioridade !== 'normal' && (
                  <p
                    className={`mt-1.5 text-xs font-medium inline-flex items-center gap-1.5 ${
                      jobPrioridade === 'urgente'
                        ? 'text-[#C93B1E] dark:text-[#FB923C]'
                        : 'text-[#B45309] dark:text-[#FBBF24]'
                    }`}
                  >
                    <Flame
                      className={`w-3.5 h-3.5 shrink-0 ${
                        jobPrioridade === 'urgente' ? 'fill-current' : ''
                      }`}
                      aria-hidden="true"
                    />
                    <span>
                      {jobPrioridade === 'urgente'
                        ? 'Destaque com ícone de fogo e prioridade no topo da listagem para trabalhadores.'
                        : 'Vaga destacada acima das oportunidades de prazo padrão.'}
                    </span>
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="job-benefits"
                  className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
                >
                  Benefícios (opcional)
                </label>
                <input
                  id="job-benefits"
                  type="text"
                  value={jobBeneficios}
                  onChange={(e) => setJobBeneficios(e.target.value)}
                  placeholder="Ex: Vale-transporte, almoço na obra, cesta básica"
                  className={inputClass}
                />
              </div>

              <div className="space-y-3">
                <JobDescriptionSuggestions
                  roleName={
                    selectedRoleOption === 'Outra' ? customRole : selectedRoleOption
                  }
                  experienceLevel={jobExperiencia}
                  contractType={jobContrato}
                  neighborhood={jobBairro}
                  currentDescription={jobDescricao}
                  onApplyDescription={setJobDescricao}
                  onApplyCompetencies={({ required, preferred }) => {
                    if (required.length > 0) {
                      setJobReqCompetencies(required.join(', '));
                    }
                    if (preferred.length > 0) {
                      setJobPrefCompetencies(preferred.join(', '));
                    }
                  }}
                />

                <div>
                  <label
                    htmlFor="job-desc"
                    className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
                  >
                    Detalhes e requisitos da obra
                  </label>
                  <textarea
                    id="job-desc"
                    rows={5}
                    value={jobDescricao}
                    onChange={(e) => setJobDescricao(e.target.value)}
                    placeholder="Ex: Experiência com alvenaria estrutural, disponibilidade imediata."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-base sm:text-sm text-[#111827] dark:text-[#F8FAFC] placeholder:text-[#6B7280] dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-[#C93B1E]"
                  />
                </div>

                <div>
                  <p className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5">
                    Tags de habilidades e especialidades da vaga
                  </p>
                  <div
                    role="group"
                    aria-label="Selecionar tags de especialidade da vaga"
                    data-testid="employer-job-skill-tags"
                    className="flex flex-wrap gap-1.5"
                  >
                    {CONSTRUCTION_SKILL_TAGS.map((tag) => {
                      const isSelected = jobSkillTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          aria-pressed={isSelected}
                          data-testid={`employer-job-tag-${tag}`}
                          onClick={() =>
                            setJobSkillTags((prev) => toggleSkillTagSelection(prev, tag))
                          }
                          className={`min-h-[36px] px-2.5 py-1 rounded-lg border text-xs font-semibold inline-flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                            isSelected
                              ? 'border-[#C93B1E] bg-[#C93B1E] text-white dark:border-[#F06449]'
                              : 'border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#1E293B] text-[#374151] dark:text-[#CBD5E1] hover:border-[#C93B1E] dark:hover:border-[#F06449]'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 shrink-0" aria-hidden="true" />}
                          <span>{formatSkillTagLabel(tag)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label
                      htmlFor="job-required-competencies"
                      className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
                    >
                      Competências requeridas / obrigatórias (separadas por vírgula)
                    </label>
                    <input
                      id="job-required-competencies"
                      data-testid="job-required-competencies-input"
                      type="text"
                      value={jobReqCompetencies}
                      onChange={(e) => setJobReqCompetencies(e.target.value)}
                      placeholder="Ex: NR-11 (Cargas), NR-35 válida, leitura de projeto de montagem"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="job-preferred-competencies"
                      className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
                    >
                      Competências preferenciais / diferenciais (opcional)
                    </label>
                    <input
                      id="job-preferred-competencies"
                      data-testid="job-preferred-competencies-input"
                      type="text"
                      value={jobPrefCompetencies}
                      onChange={(e) => setJobPrefCompetencies(e.target.value)}
                      placeholder="Ex: Experiência com pré-moldados protendidos, PTA/PEMT, Light Steel Frame"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              {jobError && (
                <p role="alert" className="text-sm font-medium text-[#B91C1C] dark:text-[#F87171]">
                  {jobError}
                </p>
              )}

              {jobSavedMsg && (
                <p role="status" className="text-sm font-medium text-[#047857] dark:text-[#34D399] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{jobSavedMsg}</span>
                </p>
              )}

              <button
                type="submit"
                className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-[#C93B1E] hover:bg-[#B23319] text-white text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer"
              >
                Publicar busca de profissionais
              </button>
            </form>
          </section>

          {/* Company Job List & Performance Summary Column */}
          <section className="lg:col-span-7 space-y-5 min-w-0">
            <RainAlertsPanel
              variant="compact"
              siteRegion={jobBairro || selectedRegion}
              onChangeSiteRegion={(region) => {
                setJobBairro(region);
                onChangeRegion(region);
              }}
              onOpenFullPanel={() => setEmployerModalMode('rain')}
            />

            <EmployerMonthlyDashboard
              jobs={jobs}
              companyId={companyProfile.id}
              companyName={companyProfile.nomeFantasia}
            />

            <PerformanceSummaryCard
              jobs={jobs}
              applications={applications}
              companyId={companyProfile.id}
              companyName={companyProfile.nomeFantasia}
            />

            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-lg font-bold text-[#111827] dark:text-[#F8FAFC]">
                Vagas publicadas pela sua construtora ({companyJobs.length})
              </h2>
            </div>

            {companyJobs.length === 0 ? (
              <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl p-6 text-center">
                <Building2 className="w-8 h-8 text-[#6B7280] dark:text-[#94A3B8] mx-auto mb-2" aria-hidden="true" />
                <p className="text-sm font-semibold text-[#111827] dark:text-[#F8FAFC]">
                  Nenhuma busca registrada ainda
                </p>
                <p className="text-sm text-[#4B5563] dark:text-[#94A3B8] mt-1">
                  {isCompanyRegistered
                    ? 'Use o formulário ao lado para informar a função e quantidade de vagas.'
                    : 'Cadastre os dados da sua empresa e publique sua primeira vaga em Rondonópolis-MT.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3" data-testid="company-jobs-list">
                {companyJobs.map((job) => {
                  const priorityMeta = getJobPriorityMeta(job.prioridade);
                  const isUrgent = priorityMeta.value === 'urgente';
                  const isHigh = priorityMeta.value === 'alta';
                  const cardSurfaceClass = isUrgent
                    ? 'bg-[#FFF7ED] dark:bg-[#1F1510] border-[#FDBA74] dark:border-[#9A3412]'
                    : isHigh
                      ? 'bg-[#FFFBEB] dark:bg-[#1C1912] border-[#FCD34D] dark:border-[#854D0E]'
                      : 'bg-white dark:bg-[#111827] border-[#E5E7EB] dark:border-[#1E293B]';
                  return (
                  <article
                    key={job.id}
                    className={`${cardSurfaceClass} border rounded-2xl p-5`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display text-lg font-bold text-[#111827] dark:text-[#F8FAFC]">
                            {job.funcao}
                          </h3>
                          {priorityMeta.isHighlighted && (
                            <span
                              data-testid={`company-job-priority-${job.id}`}
                              className={`inline-flex items-center gap-1 text-xs font-bold ${
                                isUrgent
                                  ? 'text-[#C93B1E] dark:text-[#FB923C]'
                                  : 'text-[#B45309] dark:text-[#FBBF24]'
                              }`}
                            >
                              <Flame
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  isUrgent ? 'fill-current' : ''
                                }`}
                                aria-hidden="true"
                              />
                              <span>{priorityMeta.shortLabel}</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#4B5563] dark:text-[#94A3B8] mt-1">
                          {job.bairro} · {job.tipoContrato ?? 'CLT'} ·{' '}
                          {job.nivelExperiencia ?? 'Intermediário (1 a 3 anos)'} · {job.turno} ·{' '}
                          {job.salarioOuDiaria} ·{' '}
                          <span
                            className={
                              job.status === 'aberta'
                                ? 'font-semibold text-[#047857] dark:text-[#34D399]'
                                : 'font-semibold text-[#6B7280] dark:text-[#94A3B8]'
                            }
                          >
                            {job.status === 'aberta' ? 'Vaga aberta' : 'Encerrada'}
                          </span>
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-display text-xl font-bold text-[#111827] dark:text-[#F8FAFC] tabular-nums">
                          {job.quantidadeVagas}
                        </span>{' '}
                        <span className="text-xs text-[#4B5563] dark:text-[#94A3B8] ml-1">
                          {job.quantidadeVagas === 1 ? 'vaga' : 'vagas'}
                        </span>
                      </div>
                    </div>

                    <p className="mt-3 text-sm text-[#374151] dark:text-[#CBD5E1] leading-relaxed whitespace-pre-line">
                      {job.descricao}
                    </p>

                    {job.beneficios && (
                      <p className="mt-2 text-xs text-[#4B5563] dark:text-[#94A3B8]">
                        <span className="font-semibold text-[#111827] dark:text-[#F8FAFC]">Benefícios:</span>{' '}
                        {job.beneficios}
                      </p>
                    )}

                    <p className="mt-2 text-xs text-[#4B5563] dark:text-[#94A3B8]">
                      <span className="font-semibold text-[#111827] dark:text-[#F8FAFC]">
                        Especialidades:
                      </span>{' '}
                      {getJobSkillTags(job).map(formatSkillTagLabel).join(' · ')}
                    </p>

                    {job.competenciasRequeridas && job.competenciasRequeridas.length > 0 && (
                      <p className="mt-1.5 text-xs text-[#4B5563] dark:text-[#94A3B8]">
                        <span className="font-semibold text-[#C93B1E] dark:text-[#F06449]">
                          Competências requeridas:
                        </span>{' '}
                        {formatCompetencyList(job.competenciasRequeridas)}
                      </p>
                    )}

                    {job.competenciasPreferenciais && job.competenciasPreferenciais.length > 0 && (
                      <p className="mt-1 text-xs text-[#4B5563] dark:text-[#94A3B8]">
                        <span className="font-semibold text-[#111827] dark:text-[#F8FAFC]">
                          Competências preferenciais:
                        </span>{' '}
                        {formatCompetencyList(job.competenciasPreferenciais)}
                      </p>
                    )}

                    <div className="mt-4 pt-3 border-t border-[#F3F4F6] dark:border-[#1E293B] flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onUpdateJobVacancies(job.id, -1)}
                          aria-label={`Reduzir vagas de ${job.funcao}`}
                          className="min-w-[44px] min-h-[44px] rounded-lg border border-[#D1D5DB] dark:border-[#334155] hover:bg-[#F3F4F6] dark:hover:bg-[#1E293B] flex items-center justify-center text-[#111827] dark:text-[#F8FAFC] cursor-pointer"
                        >
                          <Minus className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateJobVacancies(job.id, 1)}
                          aria-label={`Aumentar vagas de ${job.funcao}`}
                          className="min-w-[44px] min-h-[44px] rounded-lg border border-[#D1D5DB] dark:border-[#334155] hover:bg-[#F3F4F6] dark:hover:bg-[#1E293B] flex items-center justify-center text-[#111827] dark:text-[#F8FAFC] cursor-pointer"
                        >
                          <Plus className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onToggleJobStatus(job.id)}
                        className="min-h-[44px] px-4 py-2 rounded-lg border border-[#D1D5DB] dark:border-[#334155] hover:bg-[#F9FAFB] dark:hover:bg-[#1E293B] text-xs font-semibold text-[#111827] dark:text-[#F8FAFC] cursor-pointer"
                      >
                        {job.status === 'aberta' ? 'Encerrar vaga' : 'Reabrir vaga'}
                      </button>
                    </div>
                  </article>
                  );
                })}
              </div>
            )}

            {/* Received Worker Applications */}
            <div className="pt-4 border-t border-[#E5E7EB] dark:border-[#1E293B] space-y-3" data-testid="employer-applications-list">
              <h2 className="font-display text-lg font-bold text-[#111827] dark:text-[#F8FAFC]">
                Candidaturas recebidas ({visibleApplications.length})
              </h2>

              {visibleApplications.length === 0 ? (
                <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl p-5">
                  <p className="text-sm text-[#4B5563] dark:text-[#94A3B8]">
                    Nenhuma candidatura recebida ainda. Quando um colaborador se candidatar a uma vaga, ela aparecerá aqui para aprovação.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {visibleApplications.map(({ app, relatedJob }) => {
                    const isAccepted = app.status === 'aceita';
                    const isCompleted = app.status === 'concluida';
                    const canOpenChat = isAccepted || isCompleted;
                    const appRating = getRatingForApplication(companyRatings, app.id);
                    const unreadCount = canOpenChat
                      ? countUnreadMessagesForApplication(
                          chatMessages,
                          app.id,
                          'contratante'
                        )
                      : 0;
                    return (
                      <article
                        key={app.id}
                        className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <ProfileAvatar
                            name={app.workerName || 'Colaborador'}
                            photoUrl={
                              workers.find((w) => w.id === app.workerId)?.fotoPerfilUrl
                            }
                            entityType="worker"
                            size="md"
                            testId={`employer-application-avatar-${app.id}`}
                          />
                          <div className="min-w-0">
                            <h3 className="font-display text-base font-bold text-[#111827] dark:text-[#F8FAFC]">
                              {app.workerName || 'Colaborador interessado'}
                            </h3>
                            <p className="text-xs text-[#4B5563] dark:text-[#94A3B8] mt-0.5">
                              Vaga: <strong className="text-[#111827] dark:text-[#F8FAFC]">{relatedJob.funcao}</strong> ·{' '}
                              {relatedJob.companyName} · {relatedJob.bairro} · Enviada em {app.appliedAt}
                            </p>
                          </div>
                        </div>

                        {canOpenChat ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold text-[#047857] dark:text-[#34D399] inline-flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                              <span>
                                {isCompleted ? 'Trabalho concluído' : 'Candidatura aceita'}
                              </span>
                            </span>

                            {canCompleteWork(app) && (
                              <button
                                type="button"
                                onClick={() => onCompleteApplication(app.id)}
                                data-testid={`employer-complete-work-${app.id}`}
                                className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] hover:bg-[#F9FAFB] dark:hover:bg-[#1E293B] text-[#111827] dark:text-[#F8FAFC] text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
                                <span>Concluir trabalho</span>
                              </button>
                            )}

                            {appRating && (
                              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 inline-flex items-center gap-1 tabular-nums">
                                <Star className="w-3.5 h-3.5 fill-current shrink-0" aria-hidden="true" />
                                <span>Avaliada: {appRating.stars}/5</span>
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => onOpenChat(app.id)}
                              data-testid={`employer-open-chat-${app.id}`}
                              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#C93B1E] hover:bg-[#B23319] text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer"
                            >
                              <MessageSquare className="w-4 h-4 shrink-0" aria-hidden="true" />
                              <span>
                                Abrir chat{unreadCount > 0 ? ` (${unreadCount})` : ''}
                              </span>
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onAcceptApplication(app.id)}
                            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#111827] hover:bg-[#1F2937] dark:bg-[#F8FAFC] dark:hover:bg-[#E2E8F0] text-white dark:text-[#0F172A] text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                          >
                            Aceitar candidatura
                          </button>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
          </motion.div>
        )}

        {/* TAB 2: Estatísticas */}
        {activeTab === 'estatisticas' && (
          <motion.div
            key="employer-tab-estatisticas"
            variants={TAB_TRANSITION_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={TAB_TRANSITION_CONFIG}
          >
            <EmployerStatisticsTab
              jobs={jobs}
              applications={applications}
              companyRatings={companyRatings}
              companyProfile={companyProfile}
              companyId={companyProfile.id}
              companyName={companyProfile.nomeFantasia}
              onGoToJobsTab={() => onChangeTab('vagas')}
            />
          </motion.div>
        )}

        {/* TAB 3: Cadastro da Empresa */}
        {activeTab === 'cadastro' && (
          <motion.section
            key="employer-tab-cadastro"
            variants={TAB_TRANSITION_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={TAB_TRANSITION_CONFIG}
            className="mt-6 max-w-4xl mx-auto bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl p-5 sm:p-7"
          >
          <h2 className="font-display text-xl font-bold text-[#111827] dark:text-[#F8FAFC]">
            Cadastro geral da construtora
          </h2>
          <p className="text-sm text-[#4B5563] dark:text-[#94A3B8] mt-1">
            Preencha os dados gerais da empresa para identificar suas vagas em Rondonópolis-MT.
          </p>

          <form onSubmit={handleCompanySubmit} className="mt-6 space-y-4">
            <ProfilePhotoField
              name={companyForm.nomeFantasia || 'Construtora'}
              photoUrl={companyForm.fotoPerfilUrl}
              entityType="company"
              testIdPrefix="company"
              onChangePhotoUrl={(nextUrl) =>
                setCompanyForm({ ...companyForm, fotoPerfilUrl: nextUrl })
              }
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="comp-nome-fantasia"
                  className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
                >
                  Nome da Construtora / Fantasia *
                </label>
                <input
                  id="comp-nome-fantasia"
                  type="text"
                  value={companyForm.nomeFantasia}
                  onChange={(e) =>
                    setCompanyForm({ ...companyForm, nomeFantasia: e.target.value })
                  }
                  placeholder="Ex: Construtora Araguaia Sul"
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="comp-razao-social"
                  className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
                >
                  Razão Social
                </label>
                <input
                  id="comp-razao-social"
                  type="text"
                  value={companyForm.razaoSocial}
                  onChange={(e) =>
                    setCompanyForm({ ...companyForm, razaoSocial: e.target.value })
                  }
                  placeholder="Ex: Araguaia Engenharia Ltda"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="comp-cnpj"
                  className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
                >
                  CNPJ
                </label>
                <input
                  id="comp-cnpj"
                  type="text"
                  value={companyForm.cnpj}
                  onChange={(e) =>
                    setCompanyForm({ ...companyForm, cnpj: e.target.value })
                  }
                  placeholder="00.000.000/0001-00"
                  className={`${inputClass} font-mono`}
                />
              </div>

              <div>
                <label
                  htmlFor="comp-responsavel"
                  className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
                >
                  Responsável pela contratação *
                </label>
                <input
                  id="comp-responsavel"
                  type="text"
                  value={companyForm.responsavel}
                  onChange={(e) =>
                    setCompanyForm({ ...companyForm, responsavel: e.target.value })
                  }
                  placeholder="Nome do engenheiro, mestre ou RH"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="comp-sexo-responsavel"
                  className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
                >
                  Sexo do responsável *
                </label>
                <SelectWrapper>
                  <select
                    id="comp-sexo-responsavel"
                    data-testid="company-sex-select"
                    aria-invalid={companySexError || undefined}
                    value={companyForm.sexoResponsavel ?? ''}
                    onChange={(e) => {
                      const nextSex = e.target.value as CompanyProfile['sexoResponsavel'];
                      setCompanyError('');
                      setCompanySexError(false);
                      if (nextSex !== 'masculino') {
                        setCompanyMissingDocKeys((prev) =>
                          prev.filter((k) => k !== 'reservistaOuCdi')
                        );
                      }
                      setCompanyForm({
                        ...companyForm,
                        sexoResponsavel: nextSex,
                      });
                    }}
                    className={`${selectClass} ${
                      companySexError
                        ? '!border-[#DC2626] dark:!border-[#F87171]'
                        : ''
                    }`}
                  >
                    <option value="">Selecione...</option>
                    {REGISTRANT_SEX_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </SelectWrapper>
                {companySexError && (
                  <p
                    role="alert"
                    data-testid="company-sex-error"
                    className="mt-1 text-xs font-semibold text-[#B91C1C] dark:text-[#F87171]"
                  >
                    Selecione o sexo do responsável antes de enviar.
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="comp-telefone"
                  className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
                >
                  Telefone / WhatsApp *
                </label>
                <input
                  id="comp-telefone"
                  type="tel"
                  value={companyForm.telefone}
                  onChange={(e) =>
                    setCompanyForm({ ...companyForm, telefone: e.target.value })
                  }
                  placeholder="(66) 99999-0000"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="comp-email"
                  className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
                >
                  E-mail comercial
                </label>
                <input
                  id="comp-email"
                  type="email"
                  value={companyForm.email}
                  onChange={(e) =>
                    setCompanyForm({ ...companyForm, email: e.target.value })
                  }
                  placeholder="contato@construtora.com.br"
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="comp-especialidade"
                  className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
                >
                  Ramo / Especialidade
                </label>
                <input
                  id="comp-especialidade"
                  type="text"
                  value={companyForm.especialidade}
                  onChange={(e) =>
                    setCompanyForm({ ...companyForm, especialidade: e.target.value })
                  }
                  placeholder="Ex: Construções industriais, pré-moldados, construções sustentáveis"
                  className={inputClass}
                />
                <div
                  className="mt-2 flex flex-wrap gap-1.5"
                  role="group"
                  aria-label="Sugestões de especialidade da construtora"
                >
                  {COMPANY_SPECIALTY_OPTIONS.map((spec) => {
                    const isActive =
                      companyForm.especialidade.toLowerCase() === spec.toLowerCase();
                    return (
                      <button
                        key={spec}
                        type="button"
                        data-testid={`company-specialty-option-${spec}`}
                        onClick={() =>
                          setCompanyForm({ ...companyForm, especialidade: spec })
                        }
                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                          isActive
                            ? 'border-[#C93B1E] bg-[#C93B1E] text-white dark:border-[#F06449]'
                            : 'border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#1E293B] text-[#374151] dark:text-[#CBD5E1] hover:border-[#C93B1E]'
                        }`}
                      >
                        {spec}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="comp-bairro"
                  className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
                >
                  Bairro principal em Rondonópolis-MT
                </label>
                <SelectWrapper>
                  <select
                    id="comp-bairro"
                    value={companyForm.bairro}
                    onChange={(e) =>
                      setCompanyForm({ ...companyForm, bairro: e.target.value })
                    }
                    className={selectClass}
                  >
                    {RONDONOPOLIS_NEIGHBORHOODS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </SelectWrapper>
              </div>

              <div>
                <label
                  htmlFor="comp-endereco"
                  className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
                >
                  Endereço da sede ou canteiro principal
                </label>
                <input
                  id="comp-endereco"
                  type="text"
                  value={companyForm.endereco}
                  onChange={(e) =>
                    setCompanyForm({ ...companyForm, endereco: e.target.value })
                  }
                  placeholder="Ex: Av. Lions Internacional, 1450"
                  className={inputClass}
                />
              </div>
            </div>

            <RequiredDocumentsSection
              category="contratante"
              sex={companyForm.sexoResponsavel ?? ''}
              documents={companyForm.documentosAnexos ?? {}}
              missingKeys={companyMissingDocKeys}
              missingSex={companySexError}
              onChangeDocuments={(next) => {
                setCompanyError('');
                setCompanyMissingDocKeys((prev) =>
                  prev.filter((key) => !isValidDocumentAttachment(next[key]))
                );
                setCompanyForm({ ...companyForm, documentosAnexos: next });
              }}
            />

            {companyError && (
              <p role="alert" data-testid="company-form-error" className="text-sm font-semibold text-[#B91C1C] dark:text-[#F87171]">
                {companyError}
              </p>
            )}

            {companySavedMsg && (
              <div className="p-3.5 rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B]/40 border border-[#A7F3D0] dark:border-[#065F46] flex flex-wrap items-center justify-between gap-3">
                <p role="status" className="text-sm font-medium text-[#047857] dark:text-[#34D399] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{companySavedMsg}</span>
                </p>
                <button
                  type="button"
                  onClick={() => onChangeTab('vagas')}
                  className="min-h-[44px] sm:min-h-[40px] px-3.5 py-1.5 rounded-lg bg-[#047857] text-white text-xs font-semibold hover:bg-[#065F46] active:scale-[0.98] transition-all cursor-pointer"
                >
                  Registrar busca de profissionais
                </button>
              </div>
            )}

            <div className="pt-2 flex flex-wrap gap-3">
              <button
                type="submit"
                className="w-full sm:w-auto min-h-[48px] px-6 py-2.5 rounded-xl bg-[#111827] hover:bg-[#1F2937] dark:bg-[#F8FAFC] dark:hover:bg-[#E2E8F0] text-white dark:text-[#0F172A] text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer"
              >
                Salvar dados da empresa
              </button>
            </div>
          </form>

          {/* Company Reputation & Worker Ratings */}
          <div
            className="mt-8 pt-6 border-t border-[#E5E7EB] dark:border-[#1E293B]"
            data-testid="company-profile-ratings-section"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-display text-lg font-bold text-[#111827] dark:text-[#F8FAFC]">
                  Avaliações no perfil da construtora
                </h3>
                <p className="text-xs sm:text-sm text-[#4B5563] dark:text-[#94A3B8] mt-0.5">
                  Média exibida aos trabalhadores após trabalhos concluídos com a sua equipe.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0" data-testid="company-profile-rating-average">
                <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400" aria-hidden="true">
                  {[1, 2, 3, 4, 5].map((starIndex) => (
                    <Star
                      key={starIndex}
                      className={`w-4 h-4 ${
                        starIndex <= Math.round(companyRatingSummary.average)
                          ? 'fill-current'
                          : 'text-[#D1D5DB] dark:text-[#334155]'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-display text-lg font-bold text-[#111827] dark:text-[#F8FAFC] tabular-nums">
                  {formatRatingSummaryLabel(companyRatingSummary)}
                </span>
              </div>
            </div>

            {companyReviews.length === 0 ? (
              <p className="mt-4 text-sm text-[#4B5563] dark:text-[#94A3B8]">
                Sua construtora ainda não recebeu avaliações. Quando uma candidatura aceita tiver o trabalho concluído, o profissional poderá avaliar a experiência de 1 a 5 estrelas.
              </p>
            ) : (
              <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                <div className="md:col-span-4 space-y-2">
                  {[5, 4, 3, 2, 1].map((starValue) => {
                    const qty =
                      companyRatingSummary.distribution[
                        starValue as 1 | 2 | 3 | 4 | 5
                      ];
                    const pct =
                      companyRatingSummary.count > 0
                        ? Math.round((qty / companyRatingSummary.count) * 100)
                        : 0;
                    return (
                      <div
                        key={starValue}
                        className="flex items-center gap-2 text-xs text-[#4B5563] dark:text-[#94A3B8] tabular-nums"
                      >
                        <span className="w-8 font-semibold text-[#111827] dark:text-[#F8FAFC]">
                          {starValue}★
                        </span>
                        <div className="flex-1 h-2 rounded-full bg-[#F3F4F6] dark:bg-[#1E293B] overflow-hidden">
                          <div
                            className="h-full bg-amber-500 dark:bg-amber-400 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-6 text-right">{qty}</span>
                      </div>
                    );
                  })}
                </div>

                <ul className="md:col-span-8 divide-y divide-[#F3F4F6] dark:divide-[#1E293B]">
                  {companyReviews.map((review) => (
                    <li key={review.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-[#111827] dark:text-[#F8FAFC]">
                          {review.workerName} ·{' '}
                          <span className="font-normal text-[#4B5563] dark:text-[#94A3B8]">
                            {review.jobRole}
                          </span>
                        </span>
                        <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 inline-flex items-center gap-1 tabular-nums">
                          <Star className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                          <span>{review.stars}/5</span>
                          <span className="text-[#6B7280] dark:text-[#94A3B8] font-normal">
                            · {review.createdAt}
                          </span>
                        </span>
                      </div>
                      {review.comment && (
                        <p className="mt-1 text-xs sm:text-sm text-[#374151] dark:text-[#CBD5E1]">
                          “{review.comment}”
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          </motion.section>
        )}

        {/* TAB 3: Visualização de Profissionais Registrados e Disponíveis */}
        {activeTab === 'profissionais' && (
          <motion.div
            key="employer-tab-profissionais"
            variants={TAB_TRANSITION_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={TAB_TRANSITION_CONFIG}
            className="mt-6 space-y-6"
          >
            {/* Read-only directory filter & counters */}
            <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-[#C93B1E] dark:text-[#F06449]">
                  Painel de consulta somente leitura
                </p>
                <p className="text-sm text-[#4B5563] dark:text-[#94A3B8] mt-0.5 tabular-nums">
                  {professionalsDirectory.registrados.length}{' '}
                  {professionalsDirectory.registrados.length === 1
                    ? 'contratado registrado na empresa'
                    : 'contratados registrados na empresa'}{' '}
                  · {professionalsDirectory.disponiveis.length}{' '}
                  {professionalsDirectory.disponiveis.length === 1
                    ? 'profissional disponível para serviço'
                    : 'profissionais disponíveis para serviço'}
                </p>
              </div>

              <div
                role="group"
                aria-label="Filtrar visualização de profissionais"
                className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#F4F5F7] dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#1E293B]"
              >
                {(
                  [
                    {
                      id: 'todos',
                      label: `Todos (${
                        professionalsDirectory.registrados.length +
                        professionalsDirectory.disponiveis.length
                      })`,
                    },
                    {
                      id: 'registrados',
                      label: `Registrados na Empresa (${professionalsDirectory.registrados.length})`,
                    },
                    {
                      id: 'disponiveis',
                      label: `Disponíveis para Serviço (${professionalsDirectory.disponiveis.length})`,
                    },
                  ] as const
                ).map((option) => {
                  const isActive = professionalView === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setProfessionalView(option.id)}
                      aria-pressed={isActive}
                      data-testid={`profissionais-filter-${option.id}`}
                      className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#C93B1E] text-white'
                          : 'text-[#374151] dark:text-[#CBD5E1] hover:text-[#111827] dark:hover:text-[#F8FAFC]'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 1: Contratados registrados na empresa */}
            {(professionalView === 'todos' || professionalView === 'registrados') && (
              <section
                aria-labelledby="heading-profissionais-registrados"
                data-testid="employer-registered-workers-section"
                className="space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2
                      id="heading-profissionais-registrados"
                      className="font-display text-lg font-bold text-[#111827] dark:text-[#F8FAFC]"
                    >
                      Contratados registrados na empresa ({professionalsDirectory.registrados.length})
                    </h2>
                    {professionalsDirectory.registrados.length === 0 && (
                      <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-0.5">
                        Aprove ou conclua ao menos uma candidatura para habilitar a exportação da lista.
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleExportRegisteredPdf}
                      disabled={
                        professionalsDirectory.registrados.length === 0 ||
                        isExportingRegistered
                      }
                      data-testid="export-registered-professionals-pdf"
                      aria-label="Exportar profissionais registrados em PDF"
                      className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#C93B1E] hover:bg-[#B23319] text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                    >
                      <FileText className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>{isExportingRegistered ? 'Gerando PDF...' : 'Exportar PDF'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleExportRegisteredCsv}
                      disabled={
                        professionalsDirectory.registrados.length === 0 ||
                        isExportingRegistered
                      }
                      data-testid="export-registered-professionals-csv"
                      aria-label="Exportar profissionais registrados em CSV"
                      className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#1E293B] hover:bg-[#F9FAFB] dark:hover:bg-[#334155] text-[#111827] dark:text-[#F8FAFC] text-xs sm:text-sm font-semibold inline-flex items-center gap-2 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                    >
                      <Download className="w-4 h-4 text-[#C93B1E] dark:text-[#F06449] shrink-0" aria-hidden="true" />
                      <span>Exportar CSV</span>
                    </button>
                  </div>
                </div>

                {registeredExportFeedback && (
                  <p
                    role="status"
                    data-testid="registered-professionals-export-feedback"
                    className={`text-xs font-semibold px-3.5 py-2.5 rounded-xl border ${
                      registeredExportFeedback.kind === 'success'
                        ? 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0] dark:bg-[#064E3B]/40 dark:text-[#34D399] dark:border-[#065F46]'
                        : 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA] dark:bg-[#7F1D1D]/30 dark:text-[#FCA5A5] dark:border-[#991B1B]'
                    }`}
                  >
                    {registeredExportFeedback.message}
                  </p>
                )}

                {professionalsDirectory.registrados.length === 0 ? (
                  <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl p-6 text-center">
                    <Users className="w-7 h-7 text-[#6B7280] dark:text-[#94A3B8] mx-auto mb-2" aria-hidden="true" />
                    <p className="text-sm font-semibold text-[#111827] dark:text-[#F8FAFC]">
                      Nenhum contratado registrado na empresa ainda
                    </p>
                    <p className="text-xs sm:text-sm text-[#4B5563] dark:text-[#94A3B8] mt-1">
                      Os colaboradores vinculados ou com serviços concluídos pela construtora aparecem automaticamente aqui para consulta.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
                    {professionalsDirectory.registrados.map((item) => (
                      <article
                        key={item.key}
                        data-testid={`registered-worker-card-${item.applicationId}`}
                        className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl p-5 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <ProfileAvatar
                                name={item.nomeCompleto}
                                photoUrl={item.fotoPerfilUrl}
                                entityType="worker"
                                size="md"
                                testId={`registered-worker-avatar-${item.applicationId}`}
                              />
                              <div className="min-w-0">
                                <h3 className="font-display text-lg font-bold text-[#111827] dark:text-[#F8FAFC] break-words">
                                  {item.nomeCompleto}
                                </h3>
                                <p className="text-sm font-medium text-[#C93B1E] dark:text-[#F06449]">
                                  {item.funcaoContratada}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`text-xs font-semibold px-2.5 py-1 rounded-md whitespace-nowrap shrink-0 ${
                                item.status === 'aceita'
                                  ? 'bg-[#ECFDF5] text-[#047857] dark:bg-[#064E3B]/50 dark:text-[#34D399]'
                                  : 'bg-[#F3F4F6] text-[#374151] dark:bg-[#1E293B] dark:text-[#CBD5E1]'
                              }`}
                            >
                              {item.statusLabel}
                            </span>
                          </div>

                          <p className="mt-2.5 text-xs text-[#4B5563] dark:text-[#94A3B8] flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-[#6B7280] dark:text-[#94A3B8] shrink-0" aria-hidden="true" />
                            <span>
                              {item.empresaContratante} · Obra em {item.bairroObra} · Registrado em{' '}
                              {item.appliedAt}
                              {item.completedAt ? ` · Concluído em ${item.completedAt}` : ''}
                            </span>
                          </p>

                          {item.resumoProfissional && (
                            <p className="mt-3 text-sm text-[#374151] dark:text-[#CBD5E1] leading-relaxed">
                              {item.resumoProfissional}
                            </p>
                          )}

                          {item.pdfFileName ? (
                            <div className="mt-4 p-3 rounded-xl bg-[#F9FAFB] dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] flex items-center gap-2 min-w-0">
                              <FileText className="w-4 h-4 text-[#C93B1E] dark:text-[#F06449] shrink-0" aria-hidden="true" />
                              <span className="text-xs font-medium text-[#111827] dark:text-[#F8FAFC] truncate">
                                Currículo anexado: {item.pdfFileName}
                              </span>
                            </div>
                          ) : item.experiencias.length > 0 ? (
                            <div className="mt-4 pt-3 border-t border-[#F3F4F6] dark:border-[#1E293B] space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-[#374151] dark:text-[#CBD5E1]">
                                  Experiências ({item.experiencias.length})
                                </span>
                                <span className="font-semibold text-[#111827] dark:text-[#F8FAFC] tabular-nums">
                                  Total: {formatDurationPtBr(item.totalExperienceMonths)}
                                </span>
                              </div>
                              {item.experiencias.slice(0, 2).map((exp) => {
                                const dur = calculateExperienceMonths(
                                  exp.dataInicio,
                                  exp.dataFim,
                                  exp.atual
                                );
                                return (
                                  <div key={exp.id} className="text-xs text-[#4B5563] dark:text-[#94A3B8]">
                                    <span className="font-medium text-[#111827] dark:text-[#F8FAFC]">{exp.funcao}</span>{' '}
                                    — {exp.empresaLocal} ({formatMonthYearPtBr(exp.dataInicio)} –{' '}
                                    {exp.atual ? 'Atual' : formatMonthYearPtBr(exp.dataFim)} ·{' '}
                                    {dur.valid ? formatDurationPtBr(dur.months) : '—'})
                                  </div>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>

                        {item.telefone && (
                          <div className="mt-4 pt-3 border-t border-[#F3F4F6] dark:border-[#1E293B] flex items-center gap-1.5 text-xs font-medium text-[#374151] dark:text-[#CBD5E1]">
                            <Phone className="w-3.5 h-3.5 text-[#6B7280] dark:text-[#94A3B8] shrink-0" aria-hidden="true" />
                            <span>Registro de contato: {item.telefone}</span>
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Section 2: Disponíveis para serviço */}
            {(professionalView === 'todos' || professionalView === 'disponiveis') && (
              <section
                aria-labelledby="heading-profissionais-disponiveis"
                data-testid="employer-available-workers-section"
                className="space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <h2
                    id="heading-profissionais-disponiveis"
                    className="font-display text-lg font-bold text-[#111827] dark:text-[#F8FAFC]"
                  >
                    Disponíveis para serviço ({professionalsDirectory.disponiveis.length})
                  </h2>
                </div>

                {professionalsDirectory.disponiveis.length === 0 ? (
                  <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl p-6 text-center">
                    <Users className="w-7 h-7 text-[#6B7280] dark:text-[#94A3B8] mx-auto mb-2" aria-hidden="true" />
                    <p className="text-sm font-semibold text-[#111827] dark:text-[#F8FAFC]">
                      Nenhum profissional disponível para serviço no momento
                    </p>
                    <p className="text-xs sm:text-sm text-[#4B5563] dark:text-[#94A3B8] mt-1">
                      Novos trabalhadores cadastrados na plataforma serão exibidos aqui com sua disponibilidade.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
                    {professionalsDirectory.disponiveis.map(({ worker, totalExperienceMonths, statusLabel }) => (
                      <article
                        key={worker.id}
                        data-testid={`available-worker-card-${worker.id}`}
                        className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl p-5 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <ProfileAvatar
                                name={worker.nomeCompleto}
                                photoUrl={worker.fotoPerfilUrl}
                                entityType="worker"
                                size="md"
                                testId={`worker-directory-avatar-${worker.id}`}
                              />
                              <div className="min-w-0">
                                <h3 className="font-display text-lg font-bold text-[#111827] dark:text-[#F8FAFC] break-words">
                                  {worker.nomeCompleto}
                                </h3>
                                <p className="text-sm font-medium text-[#C93B1E] dark:text-[#F06449]">
                                  {worker.funcaoPrincipal}
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-md bg-[#FFF7ED] text-[#9A3412] dark:bg-[#431407]/50 dark:text-[#FDBA74] whitespace-nowrap">
                                {statusLabel}
                              </span>
                              <p className="text-[11px] font-medium text-[#4B5563] dark:text-[#94A3B8] mt-1 whitespace-nowrap">
                                Início: {worker.disponibilidade}
                              </p>
                            </div>
                          </div>

                          <p className="mt-2.5 text-xs text-[#4B5563] dark:text-[#94A3B8] flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-[#6B7280] dark:text-[#94A3B8] shrink-0" aria-hidden="true" />
                            <span>
                              Mora em {worker.bairro} · Interesse: {worker.regiaoInteresse}
                            </span>
                          </p>

                          {worker.resumoProfissional && (
                            <p className="mt-3 text-sm text-[#374151] dark:text-[#CBD5E1] leading-relaxed">
                              {worker.resumoProfissional}
                            </p>
                          )}

                          {worker.tipoHistorico === 'pdf' && worker.pdfCurriculo ? (
                            <div className="mt-4 p-3 rounded-xl bg-[#F9FAFB] dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] flex items-center gap-2 min-w-0">
                              <FileText className="w-4 h-4 text-[#C93B1E] dark:text-[#F06449] shrink-0" aria-hidden="true" />
                              <span className="text-xs font-medium text-[#111827] dark:text-[#F8FAFC] truncate">
                                Currículo anexado: {worker.pdfCurriculo.fileName}
                              </span>
                            </div>
                          ) : (
                            <div className="mt-4 pt-3 border-t border-[#F3F4F6] dark:border-[#1E293B] space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-[#374151] dark:text-[#CBD5E1]">
                                  Experiências ({worker.experiencias.length})
                                </span>
                                <span className="font-semibold text-[#111827] dark:text-[#F8FAFC] tabular-nums">
                                  Total: {formatDurationPtBr(totalExperienceMonths)}
                                </span>
                              </div>
                              {worker.experiencias.slice(0, 2).map((exp) => {
                                const dur = calculateExperienceMonths(
                                  exp.dataInicio,
                                  exp.dataFim,
                                  exp.atual
                                );
                                return (
                                  <div key={exp.id} className="text-xs text-[#4B5563] dark:text-[#94A3B8]">
                                    <span className="font-medium text-[#111827] dark:text-[#F8FAFC]">{exp.funcao}</span>{' '}
                                    — {exp.empresaLocal} ({formatMonthYearPtBr(exp.dataInicio)} –{' '}
                                    {exp.atual ? 'Atual' : formatMonthYearPtBr(exp.dataFim)} ·{' '}
                                    {dur.valid ? formatDurationPtBr(dur.months) : '—'})
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {worker.telefone && (
                          <div className="mt-4 pt-3 border-t border-[#F3F4F6] dark:border-[#1E293B] flex items-center gap-1.5 text-xs font-medium text-[#374151] dark:text-[#CBD5E1]">
                            <Phone className="w-3.5 h-3.5 text-[#6B7280] dark:text-[#94A3B8] shrink-0" aria-hidden="true" />
                            <span>Registro de contato: {worker.telefone}</span>
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}
          </motion.div>
        )}

      </AnimatePresence>

      {/* Employer Tools Modal (Calculadora de Rescisão / Avisos de Chuva Completos) */}
      {employerModalMode && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={
            employerModalMode === 'severance'
              ? 'Calculadora de Rescisão Trabalhista'
              : 'Avisos de Chuva no Canteiro e na Cidade'
          }
          data-testid="employer-tools-modal"
          onClick={() => setEmployerModalMode(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/55 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#F4F5F7] dark:bg-[#0B1120] border border-[#E5E7EB] dark:border-[#1E293B] p-4 sm:p-6 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div
                role="group"
                aria-label="Ferramentas da construtora"
                className="inline-flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B]"
              >
                {(activeTab === 'estatisticas' || employerModalMode === 'severance') && (
                  <button
                    type="button"
                    onClick={() => setEmployerModalMode('severance')}
                    aria-pressed={employerModalMode === 'severance'}
                    className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      employerModalMode === 'severance'
                        ? 'bg-[#C93B1E] text-white'
                        : 'text-[#374151] dark:text-[#CBD5E1] hover:text-[#111827] dark:hover:text-[#F8FAFC]'
                    }`}
                  >
                    Calculadora de Rescisão
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setEmployerModalMode('rain')}
                  aria-pressed={employerModalMode === 'rain'}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    employerModalMode === 'rain'
                      ? 'bg-[#C93B1E] text-white'
                      : 'text-[#374151] dark:text-[#CBD5E1] hover:text-[#111827] dark:hover:text-[#F8FAFC]'
                  }`}
                >
                  Avisos de Chuva
                </button>
              </div>

              <button
                type="button"
                onClick={() => setEmployerModalMode(null)}
                aria-label="Fechar ferramenta"
                data-testid="employer-tools-modal-close"
                className="min-w-[44px] min-h-[44px] rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {employerModalMode === 'severance' ? (
              <SeveranceCalculatorPanel />
            ) : (
              <RainAlertsPanel
                variant="full"
                siteRegion={jobBairro || selectedRegion}
                onChangeSiteRegion={(region) => {
                  setJobBairro(region);
                  onChangeRegion(region);
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
