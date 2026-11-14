import React, { useMemo, useRef, useState } from 'react';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  FileText,
  HardHat,
  MapPin,
  Phone,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  AVAILABILITY_OPTIONS,
  CONSTRUCTION_ROLES,
  RONDONOPOLIS_NEIGHBORHOODS,
  RONDONOPOLIS_REGIONS,
} from '../data/rondonopolisSeed';
import type {
  JobApplication,
  JobPosting,
  WorkExperience,
  WorkerProfile,
} from '../types/brickjobs';
import {
  calculateExperienceMonths,
  calculateTotalExperienceMonths,
  filterJobsByLocationAndQuery,
  formatDurationPtBr,
  formatFileSizePtBr,
  formatMonthYearPtBr,
} from '../utils/duration';
import { LocationRegionBar } from './LocationRegionBar';

export type WorkerTab = 'vagas' | 'cadastro' | 'perfil';

interface WorkerPortalProps {
  activeTab: WorkerTab;
  onChangeTab: (tab: WorkerTab) => void;
  workerProfile: WorkerProfile;
  onSaveWorkerProfile: (profile: WorkerProfile) => void;
  jobs: JobPosting[];
  applications: JobApplication[];
  onApplyJob: (job: JobPosting) => void;
  selectedRegion: string;
  onChangeRegion: (region: string) => void;
}

const WORKER_CRAFT_IMG = '/src/assets/images/brickjobs_worker_craft_1794693694923.jpg';

function createBlankExperience(): WorkExperience {
  return {
    id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    empresaLocal: '',
    funcao: '',
    dataInicio: '2024-01',
    dataFim: '2025-12',
    atual: false,
    atividades: '',
  };
}

export const WorkerPortal: React.FC<WorkerPortalProps> = ({
  activeTab,
  onChangeTab,
  workerProfile,
  onSaveWorkerProfile,
  jobs,
  applications,
  onApplyJob,
  selectedRegion,
  onChangeRegion,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [applyFeedback, setApplyFeedback] = useState<string>('');

  // Editable worker registration state
  const [form, setForm] = useState<WorkerProfile>(() => ({
    ...workerProfile,
    experiencias:
      workerProfile.experiencias.length > 0
        ? workerProfile.experiencias
        : [createBlankExperience()],
  }));
  const [activeExpIndex, setActiveExpIndex] = useState<number>(0);
  const [formError, setFormError] = useState<string>('');
  const [imgFailed, setImgFailed] = useState<boolean>(false);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);

  const isWorkerRegistered = Boolean(
    workerProfile.nomeCompleto.trim() && workerProfile.telefone.trim()
  );

  const filteredJobs = useMemo(
    () =>
      filterJobsByLocationAndQuery(jobs, {
        region: selectedRegion,
        query: searchQuery,
        onlyOpen: true,
      }),
    [jobs, selectedRegion, searchQuery]
  );

  const appliedJobIds = useMemo(
    () => new Set(applications.map((a) => a.jobId)),
    [applications]
  );

  const currentExp = form.experiencias[activeExpIndex] || form.experiencias[0];

  const updateExperienceAt = (index: number, patch: Partial<WorkExperience>) => {
    setForm((prev) => {
      const next = [...prev.experiencias];
      next[index] = { ...next[index], ...patch };
      return { ...prev, experiencias: next };
    });
  };

  const handleAddExperienceTab = () => {
    setForm((prev) => {
      const next = [...prev.experiencias, createBlankExperience()];
      setActiveExpIndex(next.length - 1);
      return { ...prev, experiencias: next };
    });
  };

  const handleRemoveExperienceTab = (index: number) => {
    setForm((prev) => {
      if (prev.experiencias.length <= 1) {
        return { ...prev, experiencias: [createBlankExperience()] };
      }
      const next = prev.experiencias.filter((_, idx) => idx !== index);
      setActiveExpIndex((curr) => Math.min(curr, next.length - 1));
      return { ...prev, experiencias: next };
    });
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormError('');
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf =
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setFormError('Selecione um arquivo válido no formato PDF (.pdf).');
      return;
    }

    if (file.size > 1.5 * 1024 * 1024) {
      setFormError('O arquivo PDF deve ter no máximo 1,5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setForm((prev) => ({
        ...prev,
        tipoHistorico: 'pdf',
        pdfCurriculo: {
          fileName: file.name,
          fileSizeBytes: file.size,
          uploadedAt: new Date().toISOString().slice(0, 10),
          dataUrl: result,
        },
      }));
    };
    reader.onerror = () => {
      setFormError('Não foi possível ler o arquivo PDF. Tente novamente.');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveWorker = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!form.nomeCompleto.trim()) {
      setFormError('Informe seu nome completo.');
      return;
    }
    if (!form.telefone.trim()) {
      setFormError('Informe seu telefone ou WhatsApp para contato das construtoras.');
      return;
    }

    if (form.tipoHistorico === 'pdf') {
      if (!form.pdfCurriculo) {
        setFormError(
          'Anexe seu currículo em PDF ou mude para a opção de preencher experiências.'
        );
        return;
      }
    } else {
      if (form.experiencias.length === 0) {
        setFormError('Adicione pelo menos uma experiência profissional.');
        return;
      }
      for (let i = 0; i < form.experiencias.length; i += 1) {
        const exp = form.experiencias[i];
        if (!exp.empresaLocal.trim() || !exp.funcao.trim()) {
          setActiveExpIndex(i);
          setFormError(
            `Na Experiência ${i + 1}, preencha a empresa/local e a função exercida.`
          );
          return;
        }
        const dur = calculateExperienceMonths(exp.dataInicio, exp.dataFim, exp.atual);
        if (!dur.valid) {
          setActiveExpIndex(i);
          setFormError(`Na Experiência ${i + 1}: ${dur.error}`);
          return;
        }
      }
    }

    const sanitizedExperiences =
      form.tipoHistorico === 'experiencias'
        ? form.experiencias.map((exp) => ({
            ...exp,
            empresaLocal: exp.empresaLocal.trim(),
            funcao: exp.funcao.trim(),
            atividades: exp.atividades?.trim() || '',
          }))
        : [];

    const savedProfile: WorkerProfile = {
      ...form,
      nomeCompleto: form.nomeCompleto.trim(),
      telefone: form.telefone.trim(),
      email: form.email.trim(),
      resumoProfissional: form.resumoProfissional.trim(),
      experiencias: sanitizedExperiences,
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    onSaveWorkerProfile(savedProfile);
    onChangeRegion(savedProfile.regiaoInteresse);
    onChangeTab('perfil');
  };

  const handleApplyClick = (job: JobPosting) => {
    setApplyFeedback('');
    if (!isWorkerRegistered) {
      setApplyFeedback(
        'Preencha primeiro seu cadastro na aba "Meu Cadastro" para enviar seu perfil às construtoras.'
      );
      return;
    }
    onApplyJob(job);
    setApplyFeedback(
      `Candidatura enviada para ${job.funcao} na ${job.companyName}.`
    );
  };

  const profileTotalMonths = useMemo(
    () => calculateTotalExperienceMonths(workerProfile.experiencias),
    [workerProfile.experiencias]
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-12">
      {/* Header Context */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E5E7EB] pb-5">
        <div>
          <p className="text-xs font-semibold text-[#C93B1E]">
            Área do Contratado · Rondonópolis-MT
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#111827] mt-1">
            {isWorkerRegistered
              ? `Olá, ${workerProfile.nomeCompleto.split(' ')[0]}`
              : 'Vagas e Perfil Profissional'}
          </h1>
          <p className="text-sm text-[#4B5563] mt-1">
            {isWorkerRegistered
              ? `${workerProfile.funcaoPrincipal} · Região de interesse: ${workerProfile.regiaoInteresse}`
              : 'Busque vagas por região em Rondonópolis-MT ou monte seu perfil com PDF ou experiências.'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {!isWorkerRegistered && activeTab !== 'cadastro' && (
            <button
              type="button"
              onClick={() => onChangeTab('cadastro')}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#C93B1E] hover:bg-[#B23319] text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              Criar meu perfil
            </button>
          )}
          {isWorkerRegistered && activeTab !== 'perfil' && (
            <button
              type="button"
              onClick={() => onChangeTab('perfil')}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#D1D5DB] bg-white hover:bg-[#F9FAFB] text-sm font-semibold text-[#111827] transition-colors cursor-pointer"
            >
              Ver perfil gerado
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: Vagas Disponíveis */}
      {activeTab === 'vagas' && (
        <div className="mt-6 space-y-5">
          <LocationRegionBar
            selectedRegion={selectedRegion}
            onChangeRegion={onChangeRegion}
            searchQuery={searchQuery}
            onChangeSearchQuery={setSearchQuery}
            searchPlaceholder="Buscar por função ou construtora (ex: Pedreiro)"
            regionLabel="Onde você deseja ver vagas disponíveis?"
          />

          {applyFeedback && (
            <div
              role="status"
              className="p-4 rounded-xl bg-white border border-[#E5E7EB] flex flex-wrap items-center justify-between gap-3"
            >
              <p className="text-sm font-medium text-[#111827]">{applyFeedback}</p>
              {!isWorkerRegistered && (
                <button
                  type="button"
                  onClick={() => onChangeTab('cadastro')}
                  className="min-h-[40px] px-4 py-1.5 rounded-lg bg-[#C93B1E] text-white text-xs font-semibold cursor-pointer"
                >
                  Ir para Meu Cadastro
                </button>
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-lg font-bold text-[#111827]">
              Vagas disponíveis ({filteredJobs.length})
            </h2>
            <span className="text-xs text-[#4B5563]">
              Região: {selectedRegion}
            </span>
          </div>

          {filteredJobs.length === 0 ? (
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 text-center">
              <Briefcase className="w-8 h-8 text-[#6B7280] mx-auto mb-2" aria-hidden="true" />
              <p className="text-sm font-semibold text-[#111827]">
                Nenhuma vaga aberta para esse filtro
              </p>
              <p className="text-sm text-[#4B5563] mt-1">
                Tente limpar a busca ou selecionar todas as regiões de Rondonópolis-MT.
              </p>
              <button
                type="button"
                onClick={() => {
                  onChangeRegion('Toda Rondonópolis e Região');
                  setSearchQuery('');
                }}
                className="mt-4 min-h-[44px] px-4 py-2 rounded-xl bg-[#111827] text-white text-sm font-medium cursor-pointer"
              >
                Ver todas as regiões
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="available-jobs-list">
              {filteredJobs.map((job) => {
                const alreadyApplied = appliedJobIds.has(job.id);
                return (
                  <article
                    key={job.id}
                    className="bg-white border border-[#E5E7EB] rounded-2xl p-5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-display text-lg font-bold text-[#111827]">
                            {job.funcao}
                          </h3>
                          <p className="text-sm font-medium text-[#4B5563]">
                            {job.companyName}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-display text-lg font-bold text-[#C93B1E] tabular-nums">
                            {job.quantidadeVagas}
                          </span>
                          <span className="text-xs text-[#4B5563] ml-1">
                            {job.quantidadeVagas === 1 ? 'vaga' : 'vagas'}
                          </span>
                        </div>
                      </div>

                      <p className="mt-2.5 text-xs text-[#4B5563]">
                        {job.bairro} · {job.turno} · {job.salarioOuDiaria}
                      </p>

                      <p className="mt-3 text-sm text-[#374151] leading-relaxed">
                        {job.descricao}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#F3F4F6] flex flex-wrap items-center justify-between gap-3">
                      <span className="text-xs text-[#4B5563] inline-flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#6B7280]" aria-hidden="true" />
                        <span>{job.telefoneContato}</span>
                      </span>

                      {alreadyApplied ? (
                        <span className="min-h-[44px] px-4 py-2 rounded-xl bg-[#ECFDF5] text-[#047857] text-xs font-semibold inline-flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                          <span>Candidatura enviada</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleApplyClick(job)}
                          className="min-h-[44px] px-4 py-2 rounded-xl bg-[#111827] hover:bg-[#1F2937] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                        >
                          Candidatar-se
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Meu Cadastro (Dados Gerais + Opção PDF ou Sub-abas de Experiências) */}
      {activeTab === 'cadastro' && (
        <form onSubmit={handleSaveWorker} className="mt-6 space-y-6 max-w-4xl">
          {/* General Personal Information */}
          <section className="bg-white border border-[#E5E7EB] rounded-2xl p-5 sm:p-6">
            <h2 className="font-display text-xl font-bold text-[#111827]">
              1. Dados gerais do colaborador
            </h2>
            <p className="text-sm text-[#4B5563] mt-1">
              Esses dados formam a identificação do seu perfil profissional para as construtoras.
            </p>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="worker-nome"
                  className="block text-xs font-semibold text-[#374151] mb-1.5"
                >
                  Nome completo *
                </label>
                <input
                  id="worker-nome"
                  type="text"
                  value={form.nomeCompleto}
                  onChange={(e) => setForm({ ...form, nomeCompleto: e.target.value })}
                  placeholder="Ex: João Carlos Silva"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D1D5DB] text-sm text-[#111827] focus:outline-none focus:border-[#C93B1E]"
                />
              </div>

              <div>
                <label
                  htmlFor="worker-telefone"
                  className="block text-xs font-semibold text-[#374151] mb-1.5"
                >
                  Telefone / WhatsApp *
                </label>
                <input
                  id="worker-telefone"
                  type="tel"
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                  placeholder="(66) 99999-0000"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D1D5DB] text-sm text-[#111827] focus:outline-none focus:border-[#C93B1E]"
                />
              </div>

              <div>
                <label
                  htmlFor="worker-email"
                  className="block text-xs font-semibold text-[#374151] mb-1.5"
                >
                  E-mail (opcional)
                </label>
                <input
                  id="worker-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="seuemail@exemplo.com"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D1D5DB] text-sm text-[#111827] focus:outline-none focus:border-[#C93B1E]"
                />
              </div>

              <div>
                <label
                  htmlFor="worker-funcao"
                  className="block text-xs font-semibold text-[#374151] mb-1.5"
                >
                  Ocupação principal *
                </label>
                <select
                  id="worker-funcao"
                  value={form.funcaoPrincipal}
                  onChange={(e) => setForm({ ...form, funcaoPrincipal: e.target.value })}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D1D5DB] bg-white text-sm text-[#111827] focus:outline-none focus:border-[#C93B1E]"
                >
                  {CONSTRUCTION_ROLES.map((roleName) => (
                    <option key={roleName} value={roleName}>
                      {roleName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="worker-bairro"
                  className="block text-xs font-semibold text-[#374151] mb-1.5"
                >
                  Bairro onde mora em Rondonópolis-MT
                </label>
                <select
                  id="worker-bairro"
                  value={form.bairro}
                  onChange={(e) => setForm({ ...form, bairro: e.target.value })}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D1D5DB] bg-white text-sm text-[#111827] focus:outline-none focus:border-[#C93B1E]"
                >
                  {RONDONOPOLIS_NEIGHBORHOODS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="worker-regiao"
                  className="block text-xs font-semibold text-[#374151] mb-1.5"
                >
                  Região de interesse para trabalhar
                </label>
                <select
                  id="worker-regiao"
                  value={form.regiaoInteresse}
                  onChange={(e) => setForm({ ...form, regiaoInteresse: e.target.value })}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D1D5DB] bg-white text-sm text-[#111827] focus:outline-none focus:border-[#C93B1E]"
                >
                  {RONDONOPOLIS_REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="worker-disponibilidade"
                  className="block text-xs font-semibold text-[#374151] mb-1.5"
                >
                  Disponibilidade de início
                </label>
                <select
                  id="worker-disponibilidade"
                  value={form.disponibilidade}
                  onChange={(e) => setForm({ ...form, disponibilidade: e.target.value })}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D1D5DB] bg-white text-sm text-[#111827] focus:outline-none focus:border-[#C93B1E]"
                >
                  {AVAILABILITY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="worker-resumo"
                  className="block text-xs font-semibold text-[#374151] mb-1.5"
                >
                  Observação profissional (opcional)
                </label>
                <input
                  id="worker-resumo"
                  type="text"
                  value={form.resumoProfissional}
                  onChange={(e) =>
                    setForm({ ...form, resumoProfissional: e.target.value })
                  }
                  placeholder="Ex: Possuo ferramentas próprias e CNH B"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D1D5DB] text-sm text-[#111827] focus:outline-none focus:border-[#C93B1E]"
                />
              </div>
            </div>
          </section>

          {/* Option Selector: PDF vs Experiences Sub-tabs */}
          <section className="bg-white border border-[#E5E7EB] rounded-2xl p-5 sm:p-6">
            <h2 className="font-display text-xl font-bold text-[#111827]">
              2. Currículo em PDF ou Experiências Profissionais
            </h2>
            <p className="text-sm text-[#4B5563] mt-1">
              Escolha anexar seu currículo pronto em PDF ou preencher suas experiências nas sub-abas abaixo.
            </p>

            {/* Segmented Mode Buttons */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3" role="tablist" aria-label="Forma de cadastro profissional">
              <button
                type="button"
                role="tab"
                aria-selected={form.tipoHistorico === 'pdf'}
                onClick={() => setForm({ ...form, tipoHistorico: 'pdf' })}
                className={`min-h-[52px] px-4 py-3 rounded-xl border text-left transition-colors cursor-pointer flex items-center gap-3 ${
                  form.tipoHistorico === 'pdf'
                    ? 'border-[#C93B1E] bg-[#C93B1E]/5 text-[#111827]'
                    : 'border-[#E5E7EB] bg-white text-[#4B5563] hover:border-[#111827]'
                }`}
              >
                <FileText
                  className={`w-5 h-5 shrink-0 ${
                    form.tipoHistorico === 'pdf' ? 'text-[#C93B1E]' : 'text-[#6B7280]'
                  }`}
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-semibold text-[#111827]">
                    Anexar currículo em PDF
                  </p>
                  <p className="text-xs text-[#4B5563]">
                    Envie seu arquivo .pdf diretamente
                  </p>
                </div>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={form.tipoHistorico === 'experiencias'}
                onClick={() => setForm({ ...form, tipoHistorico: 'experiencias' })}
                className={`min-h-[52px] px-4 py-3 rounded-xl border text-left transition-colors cursor-pointer flex items-center gap-3 ${
                  form.tipoHistorico === 'experiencias'
                    ? 'border-[#C93B1E] bg-[#C93B1E]/5 text-[#111827]'
                    : 'border-[#E5E7EB] bg-white text-[#4B5563] hover:border-[#111827]'
                }`}
              >
                <Briefcase
                  className={`w-5 h-5 shrink-0 ${
                    form.tipoHistorico === 'experiencias'
                      ? 'text-[#C93B1E]'
                      : 'text-[#6B7280]'
                  }`}
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-semibold text-[#111827]">
                    Preencher experiências (sem PDF)
                  </p>
                  <p className="text-xs text-[#4B5563]">
                    Sub-abas com local, função, datas e duração
                  </p>
                </div>
              </button>
            </div>

            {/* Option (i): PDF Upload */}
            {form.tipoHistorico === 'pdf' && (
              <div className="mt-5 p-5 rounded-xl border border-dashed border-[#D1D5DB] bg-[#F9FAFB]">
                <input
                  ref={pdfInputRef}
                  id="worker-pdf-input"
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handlePdfUpload}
                  className="sr-only"
                />

                {!form.pdfCurriculo ? (
                  <div className="text-center py-4">
                    <Upload className="w-8 h-8 text-[#C93B1E] mx-auto mb-2" aria-hidden="true" />
                    <p className="text-sm font-semibold text-[#111827]">
                      Selecione seu currículo em PDF
                    </p>
                    <p className="text-xs text-[#4B5563] mt-1">
                      Formato .pdf até 1,5 MB. O arquivo ficará anexado ao seu perfil gerado.
                    </p>
                    <button
                      type="button"
                      onClick={() => pdfInputRef.current?.click()}
                      className="mt-4 min-h-[44px] px-5 py-2 rounded-xl bg-[#111827] hover:bg-[#1F2937] text-white text-sm font-medium cursor-pointer"
                    >
                      Escolher arquivo PDF
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-10 h-10 rounded-xl bg-[#C93B1E]/10 text-[#C93B1E] flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#111827] truncate">
                          {form.pdfCurriculo.fileName}
                        </p>
                        <p className="text-xs text-[#4B5563]">
                          {formatFileSizePtBr(form.pdfCurriculo.fileSizeBytes)} · Anexado em{' '}
                          {form.pdfCurriculo.uploadedAt}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => pdfInputRef.current?.click()}
                        className="min-h-[44px] px-3.5 py-2 rounded-lg border border-[#D1D5DB] bg-white text-xs font-semibold text-[#111827] cursor-pointer"
                      >
                        Trocar PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, pdfCurriculo: null })}
                        aria-label="Remover currículo PDF"
                        className="min-h-[44px] px-3.5 py-2 rounded-lg border border-[#FECACA] bg-white text-xs font-semibold text-[#B91C1C] cursor-pointer"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Option (ii): Experience Sub-tabs */}
            {form.tipoHistorico === 'experiencias' && (
              <div className="mt-5">
                {/* Sub-tabs header */}
                <div className="flex flex-wrap items-center gap-2 border-b border-[#E5E7EB] pb-3">
                  {form.experiencias.map((exp, idx) => {
                    const active = idx === activeExpIndex;
                    return (
                      <button
                        key={exp.id}
                        type="button"
                        onClick={() => setActiveExpIndex(idx)}
                        className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                          active
                            ? 'bg-[#111827] text-white'
                            : 'bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]'
                        }`}
                      >
                        Experiência {idx + 1}
                        {exp.funcao.trim() ? ` · ${exp.funcao.trim()}` : ''}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={handleAddExperienceTab}
                    className="min-h-[44px] px-3.5 py-2 rounded-lg border border-dashed border-[#9CA3AF] hover:border-[#111827] text-xs sm:text-sm font-semibold text-[#111827] inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                    <span>Adicionar experiência</span>
                  </button>
                </div>

                {/* Active Sub-tab Form */}
                {currentExp && (
                  <div className="mt-4 space-y-4" data-testid="experience-subtab-panel">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="exp-empresa"
                          className="block text-xs font-semibold text-[#374151] mb-1.5"
                        >
                          Empresa / Local da obra *
                        </label>
                        <input
                          id="exp-empresa"
                          type="text"
                          value={currentExp.empresaLocal}
                          onChange={(e) =>
                            updateExperienceAt(activeExpIndex, {
                              empresaLocal: e.target.value,
                            })
                          }
                          placeholder="Ex: Construtora Norte Sul · Rondonópolis"
                          className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D1D5DB] text-sm text-[#111827] focus:outline-none focus:border-[#C93B1E]"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="exp-funcao"
                          className="block text-xs font-semibold text-[#374151] mb-1.5"
                        >
                          Função exercida *
                        </label>
                        <input
                          id="exp-funcao"
                          type="text"
                          value={currentExp.funcao}
                          onChange={(e) =>
                            updateExperienceAt(activeExpIndex, {
                              funcao: e.target.value,
                            })
                          }
                          placeholder="Ex: Pedreiro, Armador, Servente"
                          className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D1D5DB] text-sm text-[#111827] focus:outline-none focus:border-[#C93B1E]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                      <div>
                        <label
                          htmlFor="exp-inicio"
                          className="block text-xs font-semibold text-[#374151] mb-1.5"
                        >
                          Data de início (mês/ano) *
                        </label>
                        <input
                          id="exp-inicio"
                          type="month"
                          value={currentExp.dataInicio}
                          onChange={(e) =>
                            updateExperienceAt(activeExpIndex, {
                              dataInicio: e.target.value,
                            })
                          }
                          className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D1D5DB] text-sm font-mono text-[#111827] focus:outline-none focus:border-[#C93B1E]"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="exp-fim"
                          className="block text-xs font-semibold text-[#374151] mb-1.5"
                        >
                          Data de término
                        </label>
                        <input
                          id="exp-fim"
                          type="month"
                          disabled={currentExp.atual}
                          value={currentExp.atual ? '' : currentExp.dataFim}
                          onChange={(e) =>
                            updateExperienceAt(activeExpIndex, {
                              dataFim: e.target.value,
                            })
                          }
                          className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D1D5DB] text-sm font-mono text-[#111827] disabled:bg-[#F3F4F6] disabled:text-[#6B7280] focus:outline-none focus:border-[#C93B1E]"
                        />
                      </div>

                      <div className="flex items-center min-h-[44px]">
                        <label className="inline-flex items-center gap-2.5 text-sm text-[#111827] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={currentExp.atual}
                            onChange={(e) =>
                              updateExperienceAt(activeExpIndex, {
                                atual: e.target.checked,
                              })
                            }
                            className="w-5 h-5 accent-[#C93B1E] rounded"
                          />
                          <span>Trabalho atualmente aqui</span>
                        </label>
                      </div>
                    </div>

                    {/* Automatic duration calculation display */}
                    {(() => {
                      const calc = calculateExperienceMonths(
                        currentExp.dataInicio,
                        currentExp.dataFim,
                        currentExp.atual
                      );
                      return (
                        <div className="p-3.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-[#374151] inline-flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-[#C93B1E]" aria-hidden="true" />
                            <span>Tempo de atuação calculado:</span>
                          </span>
                          <span
                            className={`text-sm font-bold tabular-nums ${
                              calc.valid ? 'text-[#111827]' : 'text-[#B91C1C]'
                            }`}
                          >
                            {calc.valid ? formatDurationPtBr(calc.months) : calc.error}
                          </span>
                        </div>
                      );
                    })()}

                    <div>
                      <label
                        htmlFor="exp-atividades"
                        className="block text-xs font-semibold text-[#374151] mb-1.5"
                      >
                        Atividades realizadas (opcional)
                      </label>
                      <input
                        id="exp-atividades"
                        type="text"
                        value={currentExp.atividades ?? ''}
                        onChange={(e) =>
                          updateExperienceAt(activeExpIndex, {
                            atividades: e.target.value,
                          })
                        }
                        placeholder="Ex: Reboco, assentamento de tijolos, concretagem de lajes"
                        className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D1D5DB] text-sm text-[#111827] focus:outline-none focus:border-[#C93B1E]"
                      />
                    </div>

                    {form.experiencias.length > 1 && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveExperienceTab(activeExpIndex)}
                          className="min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold text-[#B91C1C] hover:bg-[#FEF2F2] inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                          <span>Remover Experiência {activeExpIndex + 1}</span>
                        </button>
                      </div>
                    )}

                    {form.experiencias.length > 1 && (
                      <div className="pt-3 border-t border-[#E5E7EB]">
                        <p className="text-xs font-semibold text-[#374151] mb-2">
                          Resumo das experiências preenchidas ({form.experiencias.length})
                        </p>
                        <ul className="space-y-1.5">
                          {form.experiencias.map((exp, idx) => {
                            const dur = calculateExperienceMonths(
                              exp.dataInicio,
                              exp.dataFim,
                              exp.atual
                            );
                            return (
                              <li
                                key={exp.id}
                                className="text-xs text-[#4B5563] flex items-center justify-between gap-2"
                              >
                                <span className="truncate">
                                  {idx + 1}.{' '}
                                  <strong className="text-[#111827]">
                                    {exp.funcao.trim() || 'Função não informada'}
                                  </strong>{' '}
                                  — {exp.empresaLocal.trim() || 'Local pendente'}
                                </span>
                                <span className="font-semibold text-[#111827] tabular-nums shrink-0">
                                  {dur.valid ? formatDurationPtBr(dur.months) : 'Datas pendentes'}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>

          {formError && (
            <p role="alert" className="text-sm font-semibold text-[#B91C1C]">
              {formError}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-[#4B5563]">
              Ao salvar, o BrickJobs gera automaticamente seu perfil para as construtoras.
            </p>
            <button
              type="submit"
              data-testid="save-worker-profile"
              className="w-full sm:w-auto min-h-[48px] px-7 py-3 rounded-xl bg-[#C93B1E] hover:bg-[#B23319] text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              Salvar e gerar perfil
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: Perfil Gerado automaticamente */}
      {activeTab === 'perfil' && (
        <div className="mt-6 space-y-6">
          {!isWorkerRegistered ? (
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 text-center max-w-2xl mx-auto">
              <HardHat className="w-9 h-9 text-[#C93B1E] mx-auto mb-3" aria-hidden="true" />
              <h2 className="font-display text-xl font-bold text-[#111827]">
                Seu perfil ainda não foi gerado
              </h2>
              <p className="text-sm text-[#4B5563] mt-1.5">
                Preencha seus dados gerais e anexe um currículo em PDF ou informe suas experiências profissionais para gerar o perfil.
              </p>
              <button
                type="button"
                onClick={() => onChangeTab('cadastro')}
                className="mt-5 min-h-[48px] px-6 py-2.5 rounded-xl bg-[#C93B1E] hover:bg-[#B23319] text-white text-sm font-semibold cursor-pointer"
              >
                Preencher Meu Cadastro
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" data-testid="generated-worker-profile">
              {/* Main Profile Card */}
              <section className="lg:col-span-8 bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden">
                {/* Profile Header */}
                <div className="p-5 sm:p-6 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-[#C93B1E]">
                      Perfil Profissional Gerado · {workerProfile.disponibilidade}
                    </p>
                    <h2 className="font-display text-2xl font-bold text-[#111827] mt-1">
                      {workerProfile.nomeCompleto}
                    </h2>
                    <p className="text-base font-medium text-[#374151]">
                      {workerProfile.funcaoPrincipal}
                    </p>
                    <div className="mt-2 text-xs sm:text-sm text-[#4B5563] flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-y-0.5 sm:gap-x-3">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#C93B1E] shrink-0" aria-hidden="true" />
                        Bairro {workerProfile.bairro}, {workerProfile.cidade}
                      </span>
                      <span className="hidden sm:inline" aria-hidden="true">·</span>
                      <span>Região de interesse: {workerProfile.regiaoInteresse}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onChangeTab('cadastro')}
                    className="min-h-[44px] px-4 py-2 rounded-xl border border-[#D1D5DB] hover:bg-[#F9FAFB] text-sm font-semibold text-[#111827] whitespace-nowrap self-start cursor-pointer"
                  >
                    Editar cadastro
                  </button>
                </div>

                {/* General Data & Contact */}
                <div className="p-5 sm:p-6 border-b border-[#E5E7EB] grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F9FAFB]">
                  <div>
                    <p className="text-xs font-semibold text-[#6B7280]">Telefone / WhatsApp</p>
                    <p className="text-sm font-semibold text-[#111827] mt-0.5">
                      {workerProfile.telefone}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#6B7280]">E-mail</p>
                    <p className="text-sm font-medium text-[#111827] mt-0.5">
                      {workerProfile.email || 'Não informado'}
                    </p>
                  </div>
                  {workerProfile.resumoProfissional && (
                    <div className="sm:col-span-2">
                      <p className="text-xs font-semibold text-[#6B7280]">Observações</p>
                      <p className="text-sm text-[#374151] mt-0.5">
                        {workerProfile.resumoProfissional}
                      </p>
                    </div>
                  )}
                </div>

                {/* Resume Mode Output: PDF or Generated Experiences */}
                <div className="p-5 sm:p-6">
                  {workerProfile.tipoHistorico === 'pdf' && workerProfile.pdfCurriculo ? (
                    <div>
                      <h3 className="font-display text-lg font-bold text-[#111827]">
                        Currículo anexado em PDF
                      </h3>
                      <div className="mt-3 p-4 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="w-6 h-6 text-[#C93B1E] shrink-0" aria-hidden="true" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#111827] truncate">
                              {workerProfile.pdfCurriculo.fileName}
                            </p>
                            <p className="text-xs text-[#4B5563]">
                              {formatFileSizePtBr(workerProfile.pdfCurriculo.fileSizeBytes)} · Enviado em{' '}
                              {workerProfile.pdfCurriculo.uploadedAt}
                            </p>
                          </div>
                        </div>

                        <a
                          href={workerProfile.pdfCurriculo.dataUrl}
                          download={workerProfile.pdfCurriculo.fileName}
                          className="min-h-[44px] px-4 py-2 rounded-xl bg-[#111827] hover:bg-[#1F2937] text-white text-xs sm:text-sm font-semibold inline-flex items-center"
                        >
                          Baixar currículo PDF
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="font-display text-lg font-bold text-[#111827]">
                          Experiências profissionais ({workerProfile.experiencias.length})
                        </h3>
                        <p className="text-sm font-bold text-[#C93B1E] tabular-nums">
                          Tempo total de atuação: {formatDurationPtBr(profileTotalMonths)}
                        </p>
                      </div>

                      <div className="mt-4 divide-y divide-[#E5E7EB]">
                        {workerProfile.experiencias.map((exp) => {
                          const dur = calculateExperienceMonths(
                            exp.dataInicio,
                            exp.dataFim,
                            exp.atual
                          );
                          return (
                            <div key={exp.id} className="py-4 first:pt-1 last:pb-1">
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                  <h4 className="text-base font-bold text-[#111827]">
                                    {exp.funcao}
                                  </h4>
                                  <p className="text-sm text-[#4B5563] break-words">
                                    {exp.empresaLocal}
                                  </p>
                                </div>
                                <div className="shrink-0 text-right">
                                  <p className="text-sm font-bold text-[#111827] tabular-nums whitespace-nowrap">
                                    {dur.valid ? formatDurationPtBr(dur.months) : '—'}
                                  </p>
                                  <p className="text-xs text-[#6B7280] font-mono whitespace-nowrap">
                                    {formatMonthYearPtBr(exp.dataInicio)} –{' '}
                                    {exp.atual ? 'Atual' : formatMonthYearPtBr(exp.dataFim)}
                                  </p>
                                </div>
                              </div>
                              {exp.atividades && (
                                <p className="mt-2 text-sm text-[#374151]">{exp.atividades}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Right Column: Visual Craft Card + Applications */}
              <aside className="lg:col-span-4 space-y-5">
                <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden">
                  <div className="h-44 bg-[#1F2937] relative">
                    {!imgFailed ? (
                      <img
                        src={WORKER_CRAFT_IMG}
                        alt="Profissional da construção civil alinhando alvenaria em obra"
                        referrerPolicy="no-referrer"
                        onError={() => setImgFailed(true)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white">
                        <HardHat className="w-8 h-8 text-[#C93B1E]" aria-hidden="true" />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-4">
                      <p className="text-xs font-semibold text-white">
                        Visível para construtoras de Rondonópolis-MT
                      </p>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-semibold text-[#111827]">
                      Candidaturas enviadas ({applications.length})
                    </p>
                    {applications.length === 0 ? (
                      <p className="text-xs text-[#4B5563] mt-1">
                        Você ainda não se candidatou a nenhuma vaga. Veja as oportunidades na sua região.
                      </p>
                    ) : (
                      <ul className="mt-2.5 space-y-2">
                        {applications.map((app) => {
                          const job = jobs.find((j) => j.id === app.jobId);
                          if (!job) return null;
                          return (
                            <li
                              key={app.id}
                              className="text-xs text-[#374151] border-t border-[#F3F4F6] pt-2"
                            >
                              <span className="font-semibold text-[#111827]">{job.funcao}</span> ·{' '}
                              {job.companyName} ({job.bairro})
                            </li>
                          );
                        })}
                      </ul>
                    )}

                    <button
                      type="button"
                      onClick={() => onChangeTab('vagas')}
                      className="mt-4 w-full min-h-[44px] px-4 py-2 rounded-xl bg-[#111827] hover:bg-[#1F2937] text-white text-xs sm:text-sm font-semibold cursor-pointer"
                    >
                      Explorar vagas na região
                    </button>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
