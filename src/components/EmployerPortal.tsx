import React, { useMemo, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  FileText,
  MapPin,
  Minus,
  Phone,
  Plus,
  Users,
} from 'lucide-react';
import {
  CONSTRUCTION_ROLES,
  RONDONOPOLIS_NEIGHBORHOODS,
  SHIFT_OPTIONS,
} from '../data/rondonopolisSeed';
import type {
  CompanyProfile,
  JobPosting,
  WorkerProfile,
} from '../types/brickjobs';
import {
  calculateExperienceMonths,
  calculateTotalExperienceMonths,
  formatDurationPtBr,
  formatMonthYearPtBr,
} from '../utils/duration';
import { LocationRegionBar } from './LocationRegionBar';

export type EmployerTab = 'vagas' | 'cadastro' | 'profissionais';

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
  selectedRegion,
  onChangeRegion,
}) => {
  // Company registration state
  const [companyForm, setCompanyForm] = useState<CompanyProfile>(companyProfile);
  const [companyError, setCompanyError] = useState('');
  const [companySavedMsg, setCompanySavedMsg] = useState('');

  // Job posting form state
  const [selectedRoleOption, setSelectedRoleOption] = useState<string>('Pedreiro');
  const [customRole, setCustomRole] = useState<string>('');
  const [quantidadeVagas, setQuantidadeVagas] = useState<number>(2);
  const [jobBairro, setJobBairro] = useState<string>(
    companyProfile.bairro || 'Vila Aurora'
  );
  const [jobTurno, setJobTurno] = useState<string>(SHIFT_OPTIONS[0]);
  const [jobSalario, setJobSalario] = useState<string>('');
  const [jobDescricao, setJobDescricao] = useState<string>('');
  const [jobError, setJobError] = useState<string>('');
  const [jobSavedMsg, setJobSavedMsg] = useState<string>('');

  // Workers search state
  const [workerSearch, setWorkerSearch] = useState<string>('');

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

  const handleCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCompanyError('');
    setCompanySavedMsg('');

    if (!companyForm.nomeFantasia.trim()) {
      setCompanyError('Informe o nome fantasia ou nome da construtora.');
      return;
    }
    if (!companyForm.responsavel.trim()) {
      setCompanyError('Informe o nome do responsável pelo contato.');
      return;
    }
    if (!companyForm.telefone.trim()) {
      setCompanyError('Informe um telefone ou WhatsApp para contato.');
      return;
    }

    const updated: CompanyProfile = {
      ...companyForm,
      nomeFantasia: companyForm.nomeFantasia.trim(),
      razaoSocial: companyForm.razaoSocial.trim(),
      cnpj: companyForm.cnpj.trim(),
      responsavel: companyForm.responsavel.trim(),
      telefone: companyForm.telefone.trim(),
      email: companyForm.email.trim(),
      endereco: companyForm.endereco.trim(),
      especialidade: companyForm.especialidade.trim() || 'Construção Civil',
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    onSaveCompanyProfile(updated);
    setJobBairro(updated.bairro || 'Centro');
    setCompanySavedMsg('Dados da construtora salvos com sucesso.');
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

    onCreateJob({
      companyId: companyProfile.id,
      companyName: companyProfile.nomeFantasia,
      funcao: finalFuncao,
      quantidadeVagas: Math.floor(quantidadeVagas),
      bairro: jobBairro,
      regiaoInteresse: jobBairro,
      salarioOuDiaria: jobSalario.trim() || 'A combinar',
      turno: jobTurno,
      descricao:
        jobDescricao.trim() ||
        `Vaga para ${finalFuncao} em obra no bairro ${jobBairro}, Rondonópolis-MT.`,
      telefoneContato: companyProfile.telefone,
    });

    setCustomRole('');
    setQuantidadeVagas(2);
    setJobSalario('');
    setJobDescricao('');
    setJobSavedMsg(`Busca registrada: ${finalFuncao} (${Math.floor(quantidadeVagas)} vagas).`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-12">
      {/* Header Context */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E5E7EB] pb-5">
        <div>
          <p className="text-xs font-semibold text-[#C93B1E]">
            Área do Contratante · Rondonópolis-MT
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#111827] mt-1">
            {isCompanyRegistered ? companyProfile.nomeFantasia : 'Painel da Construtora'}
          </h1>
          <p className="text-sm text-[#4B5563] mt-1">
            {isCompanyRegistered
              ? `${companyProfile.bairro} · Resp.: ${companyProfile.responsavel} · ${companyProfile.telefone}`
              : 'Cadastre os dados gerais da empresa e publique buscas por função e número de vagas.'}
          </p>
        </div>

        <div className="flex items-center gap-6 shrink-0">
          <div>
            <p className="font-display text-2xl font-bold text-[#111827] tabular-nums">
              {totalOpenVacanciesByCompany}
            </p>
            <p className="text-xs text-[#4B5563]">Suas vagas abertas</p>
          </div>
          <div className="h-8 w-px bg-[#E5E7EB]" aria-hidden="true" />
          <div>
            <p className="font-display text-2xl font-bold text-[#111827] tabular-nums">
              {filteredWorkers.length}
            </p>
            <p className="text-xs text-[#4B5563]">Profissionais na região</p>
          </div>
        </div>
      </div>

      {/* TAB 1: Vagas e Busca de Profissionais */}
      {activeTab === 'vagas' && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Form Column */}
          <section className="lg:col-span-5 bg-white border border-[#E5E7EB] rounded-2xl p-5 sm:p-6">
            <h2 className="font-display text-lg font-bold text-[#111827]">
              Registrar busca de profissionais
            </h2>
            <p className="text-sm text-[#4B5563] mt-1">
              Informe a função necessária e a quantidade de vagas para sua obra.
            </p>

            {!isCompanyRegistered && (
              <div className="mt-4 p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
                <p className="text-sm font-medium text-[#111827]">
                  Cadastro da empresa pendente
                </p>
                <p className="text-xs text-[#4B5563] mt-1">
                  Salve os dados gerais da sua construtora antes de publicar novas vagas.
                </p>
                <button
                  type="button"
                  onClick={() => onChangeTab('cadastro')}
                  className="mt-3 min-h-[44px] px-4 py-2 rounded-lg bg-[#111827] text-white text-sm font-medium hover:bg-[#1F2937] transition-colors cursor-pointer"
                >
                  Cadastrar empresa agora
                </button>
              </div>
            )}

            <form onSubmit={handleJobSubmit} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="job-role-select"
                  className="block text-xs font-semibold text-[#374151] mb-1.5"
                >
                  Função / Ocupação *
                </label>
                <select
                  id="job-role-select"
                  value={selectedRoleOption}
                  onChange={(e) => setSelectedRoleOption(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D1D5DB] bg-white text-sm text-[#111827] focus:outline-none focus:border-[#C93B1E]"
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
                    className="block text-xs font-semibold text-[#374151] mb-1.5"
                  >
                    Especifique a função *
                  </label>
                  <input
                    id="job-custom-role"
                    type="text"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    placeholder="Ex: Gesseiro, Vidraceiro, Topógrafo"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D1D5DB] text-sm text-[#111827] focus:outline-none focus:border-[#C93B1E]"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="job-quantity"
                    className="block text-xs font-semibold text-[#374151] mb-1.5"
                  >
                    Quantidade de vagas *
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuantidadeVagas((v) => Math.max(1, v - 1))}
                      aria-label="Diminuir quantidade de vagas"
                      className="min-w-[44px] min-h-[44px] rounded-xl border border-[#D1D5DB] bg-[#F9FAFB] hover:bg-[#F3F4F6] flex items-center justify-center text-[#111827] cursor-pointer"
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
                      className="w-full min-h-[44px] px-3 py-2 text-center rounded-xl border border-[#D1D5DB] text-sm font-semibold text-[#111827] tabular-nums focus:outline-none focus:border-[#C93B1E]"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantidadeVagas((v) => Math.min(200, v + 1))}
                      aria-label="Aumentar quantidade de vagas"
                      className="min-w-[44px] min-h-[44px] rounded-xl border border-[#D1D5DB] bg-[#F9FAFB] hover:bg-[#F3F4F6] flex items-center justify-center text-[#111827] cursor-pointer"
                    >
                      <Plus className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="job-bairro"
                    className="block text-xs font-semibold text-[#374151] mb-1.5"
                  >
                    Bairro da obra *
                  </label>
                  <select
                    id="job-bairro"
                    value={jobBairro}
                    onChange={(e) => setJobBairro(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D1D5DB] bg-white text-sm text-[#111827] focus:outline-none focus:border-[#C93B1E]"
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
                    className="block text-xs font-semibold text-[#374151] mb-1.5"
                  >
                    Turno / Regime
                  </label>
                  <select
                    id="job-shift"
                    value={jobTurno}
                    onChange={(e) => setJobTurno(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D1D5DB] bg-white text-sm text-[#111827] focus:outline-none focus:border-[#C93B1E]"
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
                    className="block text-xs font-semibold text-[#374151] mb-1.5"
                  >
                    Diária ou salário
                  </label>
                  <input
                    id="job-salary"
                    type="text"
                    value={jobSalario}
                    onChange={(e) => setJobSalario(e.target.value)}
                    placeholder="Ex: R$ 190/dia"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D1D5DB] text-sm text-[#111827] focus:outline-none focus:border-[#C93B1E]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="job-desc"
                  className="block text-xs font-semibold text-[#374151] mb-1.5"
                >
                  Detalhes e requisitos da obra
                </label>
                <textarea
                  id="job-desc"
                  rows={3}
                  value={jobDescricao}
                  onChange={(e) => setJobDescricao(e.target.value)}
                  placeholder="Ex: Experiência com alvenaria estrutural, disponibilidade imediata."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] text-sm text-[#111827] focus:outline-none focus:border-[#C93B1E]"
                />
              </div>

              {jobError && (
                <p role="alert" className="text-sm font-medium text-[#B91C1C]">
                  {jobError}
                </p>
              )}

              {jobSavedMsg && (
                <p role="status" className="text-sm font-medium text-[#047857] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{jobSavedMsg}</span>
                </p>
              )}

              <button
                type="submit"
                className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-[#C93B1E] hover:bg-[#B23319] text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                Publicar busca de profissionais
              </button>
            </form>
          </section>

          {/* Company Job List Column */}
          <section className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-lg font-bold text-[#111827]">
                Vagas publicadas pela sua construtora ({companyJobs.length})
              </h2>
            </div>

            {companyJobs.length === 0 ? (
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 text-center">
                <Building2 className="w-8 h-8 text-[#6B7280] mx-auto mb-2" aria-hidden="true" />
                <p className="text-sm font-semibold text-[#111827]">
                  Nenhuma busca registrada ainda
                </p>
                <p className="text-sm text-[#4B5563] mt-1">
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
                    className="bg-white border border-[#E5E7EB] rounded-2xl p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-lg font-bold text-[#111827]">
                          {job.funcao}
                        </h3>
                        <p className="text-xs text-[#4B5563] mt-1">
                          {job.bairro} · {job.turno} · {job.salarioOuDiaria} ·{' '}
                          <span
                            className={
                              job.status === 'aberta'
                                ? 'font-semibold text-[#047857]'
                                : 'font-semibold text-[#6B7280]'
                            }
                          >
                            {job.status === 'aberta' ? 'Vaga aberta' : 'Encerrada'}
                          </span>
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-display text-xl font-bold text-[#111827] tabular-nums">
                          {job.quantidadeVagas}
                        </span>
                        <span className="text-xs text-[#4B5563] ml-1">
                          {job.quantidadeVagas === 1 ? 'vaga' : 'vagas'}
                        </span>
                      </div>
                    </div>

                    <p className="mt-3 text-sm text-[#374151] leading-relaxed">
                      {job.descricao}
                    </p>

                    <div className="mt-4 pt-3 border-t border-[#F3F4F6] flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onUpdateJobVacancies(job.id, -1)}
                          aria-label={`Reduzir vagas de ${job.funcao}`}
                          className="min-w-[44px] min-h-[44px] rounded-lg border border-[#D1D5DB] hover:bg-[#F3F4F6] flex items-center justify-center text-[#111827] cursor-pointer"
                        >
                          <Minus className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateJobVacancies(job.id, 1)}
                          aria-label={`Aumentar vagas de ${job.funcao}`}
                          className="min-w-[44px] min-h-[44px] rounded-lg border border-[#D1D5DB] hover:bg-[#F3F4F6] flex items-center justify-center text-[#111827] cursor-pointer"
                        >
                          <Plus className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onToggleJobStatus(job.id)}
                        className="min-h-[44px] px-4 py-2 rounded-lg border border-[#D1D5DB] hover:bg-[#F9FAFB] text-xs font-semibold text-[#111827] cursor-pointer"
                      >
                        {job.status === 'aberta' ? 'Encerrar vaga' : 'Reabrir vaga'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* TAB 2: Cadastro da Empresa */}
      {activeTab === 'cadastro' && (
        <section className="mt-6 max-w-3xl bg-white border border-[#E5E7EB] rounded-2xl p-5 sm:p-7">
          <h2 className="font-display text-xl font-bold text-[#111827]">
            Cadastro geral da construtora
          </h2>
          <p className="text-sm text-[#4B5563] mt-1">
            Preencha os dados gerais da empresa para identificar suas vagas em Rondonópolis-MT.
          </p>

          <form onSubmit={handleCompanySubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="comp-nome-fantasia"
                  className="block text-xs font-semibold text-[#374151] mb-1.5"
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
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D1D5DB] text-sm text-[#111827] focus:outline-none focus:border-[#C93B1E]"
                />
              </div>

              <div>
                <label
                  htmlFor="comp-razao-social"
                  className="block text-xs font-semibold text-[#374151] mb-1.5"
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
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D1D5DB] text-sm text-[#111827] focus:outline-none focus:border-[#C93B1E]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="comp-cnpj"
                  className="block text-xs font-semibold text-[#374151] mb-1.5"
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
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D1D5DB] text-sm font-mono text-[#111827] focus:outline-none focus:border-[#C93B1E]"
                />
              </div>

              <div>
                <label
                  htmlFor="comp-responsavel"
                  className="block text-xs font-semibold text-[#374151] mb-1.5"
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
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D1D5DB] text-sm text-[#111827] focus:outline-none focus:border-[#C93B1E]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="comp-telefone"
                  className="block text-xs font-semibold text-[#374151] mb-1.5"
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
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D1D5DB] text-sm text-[#111827] focus:outline-none focus:border-[#C93B1E]"
                />
              </div>

              <div>
                <label
                  htmlFor="comp-email"
                  className="block text-xs font-semibold text-[#374151] mb-1.5"
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
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D1D5DB] text-sm text-[#111827] focus:outline-none focus:border-[#C93B1E]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="comp-bairro"
                  className="block text-xs font-semibold text-[#374151] mb-1.5"
                >
                  Bairro principal em Rondonópolis-MT
                </label>
                <select
                  id="comp-bairro"
                  value={companyForm.bairro}
                  onChange={(e) =>
                    setCompanyForm({ ...companyForm, bairro: e.target.value })
                  }
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D1D5DB] bg-white text-sm text-[#111827] focus:outline-none focus:border-[#C93B1E]"
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
                  htmlFor="comp-especialidade"
                  className="block text-xs font-semibold text-[#374151] mb-1.5"
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
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D1D5DB] text-sm text-[#111827] focus:outline-none focus:border-[#C93B1E]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="comp-endereco"
                className="block text-xs font-semibold text-[#374151] mb-1.5"
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
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D1D5DB] text-sm text-[#111827] focus:outline-none focus:border-[#C93B1E]"
              />
            </div>

            {companyError && (
              <p role="alert" className="text-sm font-medium text-[#B91C1C]">
                {companyError}
              </p>
            )}

            {companySavedMsg && (
              <div className="p-3.5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] flex flex-wrap items-center justify-between gap-3">
                <p role="status" className="text-sm font-medium text-[#047857] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{companySavedMsg}</span>
                </p>
                <button
                  type="button"
                  onClick={() => onChangeTab('vagas')}
                  className="min-h-[40px] px-3.5 py-1.5 rounded-lg bg-[#047857] text-white text-xs font-semibold hover:bg-[#065F46] cursor-pointer"
                >
                  Registrar busca de profissionais
                </button>
              </div>
            )}

            <div className="pt-2 flex flex-wrap gap-3">
              <button
                type="submit"
                className="min-h-[48px] px-6 py-2.5 rounded-xl bg-[#111827] hover:bg-[#1F2937] text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                Salvar dados da empresa
              </button>
            </div>
          </form>
        </section>
      )}

      {/* TAB 3: Profissionais disponíveis na região */}
      {activeTab === 'profissionais' && (
        <div className="mt-6 space-y-5">
          <LocationRegionBar
            selectedRegion={selectedRegion}
            onChangeRegion={onChangeRegion}
            searchQuery={workerSearch}
            onChangeSearchQuery={setWorkerSearch}
            searchPlaceholder="Buscar profissional por função ou nome (ex: Armador)"
            regionLabel="Filtrar profissionais por região de interesse"
          />

          {filteredWorkers.length === 0 ? (
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 text-center">
              <Users className="w-8 h-8 text-[#6B7280] mx-auto mb-2" aria-hidden="true" />
              <p className="text-sm font-semibold text-[#111827]">
                Nenhum profissional encontrado nessa região
              </p>
              <p className="text-sm text-[#4B5563] mt-1">
                Amplie o filtro para visualizar trabalhadores de toda Rondonópolis-MT.
              </p>
              <button
                type="button"
                onClick={() => {
                  onChangeRegion('Toda Rondonópolis e Região');
                  setWorkerSearch('');
                }}
                className="mt-4 min-h-[44px] px-4 py-2 rounded-xl bg-[#111827] text-white text-sm font-medium cursor-pointer"
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
                    className="bg-white border border-[#E5E7EB] rounded-2xl p-5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-display text-lg font-bold text-[#111827]">
                            {worker.nomeCompleto}
                          </h3>
                          <p className="text-sm font-medium text-[#C93B1E]">
                            {worker.funcaoPrincipal}
                          </p>
                        </div>
                        <span className="text-xs font-medium text-[#4B5563] whitespace-nowrap">
                          {worker.disponibilidade}
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-[#4B5563] flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#6B7280] shrink-0" aria-hidden="true" />
                        <span>
                          Mora em {worker.bairro} · Interesse: {worker.regiaoInteresse}
                        </span>
                      </p>

                      {worker.resumoProfissional && (
                        <p className="mt-3 text-sm text-[#374151] leading-relaxed">
                          {worker.resumoProfissional}
                        </p>
                      )}

                      {worker.tipoHistorico === 'pdf' && worker.pdfCurriculo ? (
                        <div className="mt-4 p-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 text-[#C93B1E] shrink-0" aria-hidden="true" />
                            <span className="text-xs font-medium text-[#111827] truncate">
                              {worker.pdfCurriculo.fileName}
                            </span>
                          </div>
                          <a
                            href={worker.pdfCurriculo.dataUrl}
                            download={worker.pdfCurriculo.fileName}
                            className="text-xs font-semibold text-[#C93B1E] hover:underline whitespace-nowrap"
                          >
                            Baixar PDF
                          </a>
                        </div>
                      ) : (
                        <div className="mt-4 pt-3 border-t border-[#F3F4F6] space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-[#374151]">
                              Experiências ({worker.experiencias.length})
                            </span>
                            <span className="font-semibold text-[#111827] tabular-nums">
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
                              <div key={exp.id} className="text-xs text-[#4B5563]">
                                <span className="font-medium text-[#111827]">{exp.funcao}</span>{' '}
                                — {exp.empresaLocal} ({formatMonthYearPtBr(exp.dataInicio)} –{' '}
                                {exp.atual ? 'Atual' : formatMonthYearPtBr(exp.dataFim)} ·{' '}
                                {dur.valid ? formatDurationPtBr(dur.months) : '—'})
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#F3F4F6] flex items-center justify-between gap-3">
                      <span className="text-xs font-medium text-[#374151] inline-flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#6B7280]" aria-hidden="true" />
                        <span>{worker.telefone}</span>
                      </span>

                      <a
                        href={`tel:${worker.telefone.replace(/\D/g, '')}`}
                        className="min-h-[40px] px-3.5 py-1.5 rounded-lg bg-[#111827] hover:bg-[#1F2937] text-white text-xs font-semibold inline-flex items-center"
                      >
                        Entrar em contato
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
