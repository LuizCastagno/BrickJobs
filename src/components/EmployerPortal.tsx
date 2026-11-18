import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Building2,
  Calculator,
  Check,
  CheckCircle2,
  FileText,
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
import { inferJobSkillTags } from '../utils/skillTags';
import {
  TAB_TRANSITION_CONFIG,
  TAB_TRANSITION_VARIANTS,
} from '../utils/motionPresets';
import {
  REGISTRANT_SEX_OPTIONS,
  isValidDocumentAttachment,
  validateRequiredRegistrationDocuments,
} from '../utils/requiredDocuments';
import { EmployerMonthlyDashboard } from './EmployerMonthlyDashboard';
import { EmployerStatisticsTab } from './EmployerStatisticsTab';
import { JobDescriptionSuggestions } from './JobDescriptionSuggestions';
import { LocationRegionBar } from './LocationRegionBar';
import { PerformanceSummaryCard } from './PerformanceSummaryCard';
import { ProfileAvatar } from './ProfileAvatar';
import { ProfilePhotoField } from './ProfilePhotoField';
import { RainAlertsPanel } from './RainAlertsPanel';
import { RequiredDocumentsSection } from './RequiredDocumentsSection';
import { SeveranceCalculatorPanel } from './SeveranceCalculatorPanel';

export type EmployerTab = 'vagas' | 'estatisticas' | 'cadastro' | 'profissionais';

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
  const [companyError, setCompanyError] = useState('');
  const [companySavedMsg, setCompanySavedMsg] = useState('');
  const [companyMissingDocKeys, setCompanyMissingDocKeys] = useState<
    RequiredDocumentKey[]
  >([]);
  const [companySexError, setCompanySexError] = useState(false);

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
  const [jobDescricao, setJobDescricao] = useState<string>('');
  const [jobError, setJobError] = useState<string>('');
  const [jobSavedMsg, setJobSavedMsg] = useState<string>('');

  // Workers search state
  const [workerSearch, setWorkerSearch] = useState<string>('');
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

  const filteredWorkers = useMemo(() => {
    const q = workerSearch.trim().toLowerCase();
    return workers.filter((w) => {
      if (!w.nomeCompleto.trim()) return false;
      if (
        selectedRegion !== 'Toda Rondonópolis e Região' &&
        w.regiaoInteresse !== 'Toda Rondonópolis e Região' &&
        w.bairro.toLowerCase() !== selectedRegion.toLowerCase() &&
        w.regiaoInteresse.toLowerCase() !== selectedRegion.toLowerCase()
      ) {
        return false;
      }
      if (q) {
        const hay = [
          w.nomeCompleto,
          w.funcaoPrincipal,
          w.bairro,
          w.resumoProfissional,
          ...w.experiencias.map((e) => `${e.funcao} ${e.empresaLocal}`),
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [workers, selectedRegion, workerSearch]);

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
      turno: jobTurno,
      descricao: finalDescricao,
      skillTags: inferJobSkillTags({ funcao: finalFuncao, descricao: finalDescricao }),
      telefoneContato: companyProfile.telefone,
    });

    setCustomRole('');
    setQuantidadeVagas(2);
    setJobSalario('');
    setJobBeneficios('');
    setJobContrato('CLT');
    setJobExperiencia('Intermediário (1 a 3 anos)');
    setJobDescricao('');
    setJobSavedMsg(`Busca registrada: ${finalFuncao} (${Math.floor(quantidadeVagas)} vagas).`);
  };

  const inputClass =
    'w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-base sm:text-sm text-[#111827] dark:text-[#F8FAFC] placeholder:text-[#6B7280] dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-[#C93B1E]';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-nav-safe md:pb-12">
      {/* Header Context */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E5E7EB] dark:border-[#1E293B] pb-5">
        <div className="flex items-center gap-3.5 min-w-0">
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
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#C93B1E] dark:text-[#F06449]">
              Área do Contratante · Rondonópolis-MT
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#111827] dark:text-[#F8FAFC] mt-1 break-words">
              {isCompanyRegistered ? companyProfile.nomeFantasia : 'Painel da Construtora'}
            </h1>
            <p className="text-sm text-[#4B5563] dark:text-[#94A3B8] mt-1 break-words">
              {isCompanyRegistered
                ? `${companyProfile.bairro} · Resp.: ${companyProfile.responsavel} · ${companyProfile.telefone}`
                : 'Cadastre os dados gerais da empresa e publique buscas por função e número de vagas.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6 shrink-0">
          <div>
            <p className="font-display text-2xl font-bold text-[#111827] dark:text-[#F8FAFC] tabular-nums">
              {totalOpenVacanciesByCompany}
            </p>
            <p className="text-xs text-[#4B5563] dark:text-[#94A3B8]">Suas vagas abertas</p>
          </div>
          <div className="h-8 w-px bg-[#E5E7EB] dark:bg-[#1E293B]" aria-hidden="true" />
          <div>
            <p className="font-display text-2xl font-bold text-[#111827] dark:text-[#F8FAFC] tabular-nums">
              {filteredWorkers.length}
            </p>
            <p className="text-xs text-[#4B5563] dark:text-[#94A3B8]">Profissionais na região</p>
          </div>
          <div className="h-8 w-px bg-[#E5E7EB] dark:bg-[#1E293B]" aria-hidden="true" />
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

          <button
            type="button"
            onClick={() => setEmployerModalMode('severance')}
            data-testid="employer-open-severance-button"
            className="min-h-[44px] px-4 py-2 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#1E293B] hover:bg-[#F9FAFB] dark:hover:bg-[#334155] text-xs sm:text-sm font-semibold text-[#111827] dark:text-[#F8FAFC] inline-flex items-center gap-2 transition-colors cursor-pointer shrink-0"
          >
            <Calculator className="w-4 h-4 text-[#C93B1E] dark:text-[#F06449]" aria-hidden="true" />
            <span>Calculadora de rescisão</span>
          </button>
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
                <select
                  id="job-role-select"
                  value={selectedRoleOption}
                  onChange={(e) => setSelectedRoleOption(e.target.value)}
                  className={inputClass}
                >
                  {CONSTRUCTION_ROLES.map((roleName) => (
                    <option key={roleName} value={roleName}>
                      {roleName}
                    </option>
                  ))}
                  <option value="Outra">Outra função...</option>
                </select>
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
                  <select
                    id="job-bairro"
                    value={jobBairro}
                    onChange={(e) => setJobBairro(e.target.value)}
                    className={inputClass}
                  >
                    {RONDONOPOLIS_NEIGHBORHOODS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
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
                  <select
                    id="job-shift"
                    value={jobTurno}
                    onChange={(e) => setJobTurno(e.target.value)}
                    className={inputClass}
                  >
                    {SHIFT_OPTIONS.map((shift) => (
                      <option key={shift} value={shift}>
                        {shift}
                      </option>
                    ))}
                  </select>
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
                  <select
                    id="job-contract"
                    value={jobContrato}
                    onChange={(e) => setJobContrato(e.target.value as ContractType)}
                    className={inputClass}
                  >
                    {CONTRACT_TYPE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="job-experience"
                    className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
                  >
                    Nível de experiência
                  </label>
                  <select
                    id="job-experience"
                    value={jobExperiencia}
                    onChange={(e) =>
                      setJobExperiencia(e.target.value as ExperienceLevel)
                    }
                    className={inputClass}
                  >
                    {EXPERIENCE_LEVEL_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
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
                {companyJobs.map((job) => (
                  <article
                    key={job.id}
                    className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-lg font-bold text-[#111827] dark:text-[#F8FAFC]">
                          {job.funcao}
                        </h3>
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
                        </span>
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
                ))}
              </div>
            )}

            {/* Received Worker Applications */}
            <div className="pt-4 border-t border-[#E5E7EB] dark:border-[#1E293B] space-y-3" data-testid="employer-applications-list">
              <h2 className="font-display text-lg font-bold text-[#111827] dark:text-[#F8FAFC]">
                Candidaturas recebidas ({applications.length})
              </h2>

              {applications.length === 0 ? (
                <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl p-5">
                  <p className="text-sm text-[#4B5563] dark:text-[#94A3B8]">
                    Nenhuma candidatura recebida ainda. Quando um colaborador se candidatar a uma vaga, ela aparecerá aqui para aprovação.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.map((app) => {
                    const relatedJob = jobs.find((j) => j.id === app.jobId);
                    if (!relatedJob) return null;
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
            className="mt-6 max-w-3xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl p-5 sm:p-7"
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
                  className={`${inputClass} ${
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
                  placeholder="Ex: Obras residenciais, galpões, pavimentação"
                  className={inputClass}
                />
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
                <select
                  id="comp-bairro"
                  value={companyForm.bairro}
                  onChange={(e) =>
                    setCompanyForm({ ...companyForm, bairro: e.target.value })
                  }
                  className={inputClass}
                >
                  {RONDONOPOLIS_NEIGHBORHOODS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
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

        {/* TAB 3: Profissionais disponíveis na região */}
        {activeTab === 'profissionais' && (
          <motion.div
            key="employer-tab-profissionais"
            variants={TAB_TRANSITION_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={TAB_TRANSITION_CONFIG}
            className="mt-6 space-y-5"
          >
          <LocationRegionBar
            selectedRegion={selectedRegion}
            onChangeRegion={onChangeRegion}
            searchQuery={workerSearch}
            onChangeSearchQuery={setWorkerSearch}
            searchPlaceholder="Buscar profissional por função ou nome (ex: Armador)"
            regionLabel="Filtrar profissionais por região de interesse"
          />

          {filteredWorkers.length === 0 ? (
            <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl p-8 text-center">
              <Users className="w-8 h-8 text-[#6B7280] dark:text-[#94A3B8] mx-auto mb-2" aria-hidden="true" />
              <p className="text-sm font-semibold text-[#111827] dark:text-[#F8FAFC]">
                Nenhum profissional encontrado nessa região
              </p>
              <p className="text-sm text-[#4B5563] dark:text-[#94A3B8] mt-1">
                Amplie o filtro para visualizar trabalhadores de toda Rondonópolis-MT.
              </p>
              <button
                type="button"
                onClick={() => {
                  onChangeRegion('Toda Rondonópolis e Região');
                  setWorkerSearch('');
                }}
                className="mt-4 min-h-[44px] px-4 py-2 rounded-xl bg-[#111827] dark:bg-[#F8FAFC] text-white dark:text-[#0F172A] text-sm font-medium cursor-pointer"
              >
                Ver toda Rondonópolis
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredWorkers.map((worker) => {
                const totalMonths = calculateTotalExperienceMonths(worker.experiencias);
                return (
                  <article
                    key={worker.id}
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
                        <span className="text-xs font-medium text-[#4B5563] dark:text-[#94A3B8] whitespace-nowrap shrink-0">
                          {worker.disponibilidade}
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-[#4B5563] dark:text-[#94A3B8] flex items-center gap-1.5">
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
                        <div className="mt-4 p-3 rounded-xl bg-[#F9FAFB] dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 text-[#C93B1E] dark:text-[#F06449] shrink-0" aria-hidden="true" />
                            <span className="text-xs font-medium text-[#111827] dark:text-[#F8FAFC] truncate">
                              {worker.pdfCurriculo.fileName}
                            </span>
                          </div>
                          <a
                            href={worker.pdfCurriculo.dataUrl}
                            download={worker.pdfCurriculo.fileName}
                            className="min-h-[44px] sm:min-h-0 inline-flex items-center text-xs font-semibold text-[#C93B1E] dark:text-[#F06449] hover:underline whitespace-nowrap shrink-0"
                          >
                            Baixar PDF
                          </a>
                        </div>
                      ) : (
                        <div className="mt-4 pt-3 border-t border-[#F3F4F6] dark:border-[#1E293B] space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-[#374151] dark:text-[#CBD5E1]">
                              Experiências ({worker.experiencias.length})
                            </span>
                            <span className="font-semibold text-[#111827] dark:text-[#F8FAFC] tabular-nums">
                              Total: {formatDurationPtBr(totalMonths)}
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

                    <div className="mt-4 pt-3 border-t border-[#F3F4F6] dark:border-[#1E293B] flex items-center justify-between gap-3">
                      <span className="text-xs font-medium text-[#374151] dark:text-[#CBD5E1] inline-flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#6B7280] dark:text-[#94A3B8]" aria-hidden="true" />
                        <span>{worker.telefone}</span>
                      </span>

                      <a
                        href={`tel:${worker.telefone.replace(/\D/g, '')}`}
                        className="min-h-[44px] sm:min-h-[40px] px-3.5 py-1.5 rounded-lg bg-[#111827] hover:bg-[#1F2937] dark:bg-[#F8FAFC] dark:hover:bg-[#E2E8F0] text-white dark:text-[#0F172A] text-xs font-semibold inline-flex items-center active:scale-[0.98] transition-all"
                      >
                        Entrar em contato
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
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
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/55 backdrop-blur-sm"
        >
          <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#F4F5F7] dark:bg-[#0B1120] border border-[#E5E7EB] dark:border-[#1E293B] p-4 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div
                role="group"
                aria-label="Ferramentas da construtora"
                className="inline-flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B]"
              >
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
