import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Bell,
  BellRing,
  Briefcase,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  FileText,
  HardHat,
  LocateFixed,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  SlidersHorizontal,
  Star,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  AVAILABILITY_OPTIONS,
  CONSTRUCTION_ROLES,
  CONTRACT_TYPE_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
  RONDONOPOLIS_NEIGHBORHOODS,
  RONDONOPOLIS_REGIONS,
} from '../data/rondonopolisSeed';
import type {
  ChatMessage,
  CompanyRating,
  JobApplication,
  JobPosting,
  RequiredDocumentKey,
  WorkExperience,
  WorkerNotification,
  WorkerProfile,
  WorkScheduleReminder,
} from '../types/brickjobs';
import { countUnreadMessagesForApplication } from '../utils/chat';
import {
  calculateExperienceMonths,
  calculateTotalExperienceMonths,
  countActiveAdvancedFilters,
  filterJobsByLocationAndQuery,
  formatDurationPtBr,
  formatFileSizePtBr,
  formatMonthYearPtBr,
  resolveNearestRondonopolisRegion,
} from '../utils/duration';
import { countUnreadNotifications } from '../utils/notifications';
import {
  filterAndSortJobsByProximity,
  formatDistanceKmPtBr,
  queryGeolocationPermission,
  resolveAutoFilledRegionAndNeighborhood,
  resolveGeolocationErrorMessage,
  reverseGeocodeCity,
  updateProximityRadius,
  type ProximityFilterState,
} from '../utils/geolocation';
import {
  shouldShowPushPromptBanner,
  type NativePushPermission,
  type NativePushPreference,
} from '../utils/nativeNotifications';
import {
  canCompleteWork,
  canRateCompanyForApplication,
  computeCompanyRatingSummary,
  getRatingForApplication,
} from '../utils/ratings';
import { exportWorkerResumePdf } from '../utils/resumePdf';
import {
  formatReminderSchedulePtBr,
  formatReminderTimeOnlyPtBr,
  getVisibleWorkerReminders,
} from '../utils/workReminders';
import {
  JOB_CARD_TRANSITION,
  JOB_CARD_VARIANTS,
  PANEL_REVEAL_TRANSITION,
  PANEL_REVEAL_VARIANTS,
  TAB_TRANSITION_CONFIG,
  TAB_TRANSITION_VARIANTS,
} from '../utils/motionPresets';
import {
  buildSkillTagSummaries,
  filterJobsBySkillTags,
  formatSkillTagLabel,
  getJobSkillTags,
  toggleSkillTagSelection,
} from '../utils/skillTags';
import {
  loadWorkerSafetyStats,
  recordWorkerQuizAttempt,
  type SafetyQuizSummary,
  type WorkerSafetyQuizStats,
} from '../utils/safetyTips';
import { CareerTipsCard } from './CareerTipsCard';
import { LocationRegionBar } from './LocationRegionBar';
import { NativePushPermissionCard } from './NativePushPermissionCard';
import { ProfileAvatar } from './ProfileAvatar';
import { ProfilePhotoField } from './ProfilePhotoField';
import { RainAlertsPanel } from './RainAlertsPanel';
import { RequiredDocumentsSection } from './RequiredDocumentsSection';
import { SafetyLeaderboardCard } from './SafetyLeaderboardCard';
import { SafetyTipsCard } from './SafetyTipsCard';
import { SafetyWeeklyRemindersCard } from './SafetyWeeklyRemindersCard';
import { ConstructionNewsTab } from './ConstructionNewsTab';
import { SeveranceCalculatorPanel } from './SeveranceCalculatorPanel';
import { SkillTagFilterBar } from './SkillTagFilterBar';
import { WorkerEarningsPanel } from './WorkerEarningsPanel';
import { WorkerProductivityPanel } from './WorkerProductivityPanel';
import {
  formatRegistrantSexLabel,
  getResolvedDocumentRequirements,
  isValidDocumentAttachment,
  REGISTRANT_SEX_OPTIONS,
  validateRequiredRegistrationDocuments,
} from '../utils/requiredDocuments';
import workerCraftImg from '../assets/images/brickjobs_worker_craft_1794693694923.jpg';

export type WorkerTab =
  | 'vagas'
  | 'seguranca'
  | 'noticias'
  | 'cadastro'
  | 'perfil'
  | 'utilidades';

interface WorkerPortalProps {
  activeTab: WorkerTab;
  onChangeTab: (tab: WorkerTab) => void;
  workerProfile: WorkerProfile;
  onSaveWorkerProfile: (profile: WorkerProfile) => void;
  jobs: JobPosting[];
  applications: JobApplication[];
  companyRatings: CompanyRating[];
  onApplyJob: (job: JobPosting) => void;
  onCompleteApplication: (applicationId: string) => void;
  onOpenRatingModal: (applicationId: string) => void;
  chatMessages: ChatMessage[];
  onOpenChat: (applicationId: string) => void;
  notifications: WorkerNotification[];
  onMarkNotificationRead: (notificationId: string) => void;
  onMarkAllNotificationsRead: () => void;
  selectedRegion: string;
  onChangeRegion: (region: string) => void;
  initialSearchQuery?: string;
  initialProximityFilter?: ProximityFilterState | null;
  pushPermission: NativePushPermission;
  pushPreference: NativePushPreference;
  isRequestingPush: boolean;
  pushFeedback: string;
  onRequestPushPermission: () => void;
  onTogglePushEnabled: () => void;
  onDismissPushBanner: () => void;
  onTestNativePush: () => void;
  workReminders: WorkScheduleReminder[];
  onCancelWorkReminder: (reminderId: string) => void;
}

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
  companyRatings,
  onApplyJob,
  onCompleteApplication,
  onOpenRatingModal,
  chatMessages,
  onOpenChat,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  selectedRegion,
  onChangeRegion,
  initialSearchQuery = '',
  initialProximityFilter = null,
  pushPermission,
  pushPreference,
  isRequestingPush,
  pushFeedback,
  onRequestPushPermission,
  onTogglePushEnabled,
  onDismissPushBanner,
  onTestNativePush,
  workReminders,
  onCancelWorkReminder,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [proximityFilter, setProximityFilter] =
    useState<ProximityFilterState | null>(initialProximityFilter);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [filterOccupation, setFilterOccupation] = useState<string>('Todas');
  const [filterContract, setFilterContract] = useState<string>('Todos');
  const [filterExperience, setFilterExperience] = useState<string>('Todos');
  const [selectedSkillTags, setSelectedSkillTags] = useState<string[]>([]);
  const [applyFeedback, setApplyFeedback] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [pdfExportFeedback, setPdfExportFeedback] = useState<string>('');
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [safetyStats, setSafetyStats] = useState<WorkerSafetyQuizStats>(() =>
    loadWorkerSafetyStats()
  );
  const [lastPointsEarned, setLastPointsEarned] = useState<number | null>(null);

  const handleSafetyQuizComplete = (summary: SafetyQuizSummary) => {
    setSafetyStats((prev) => {
      const { nextStats, pointsEarned } = recordWorkerQuizAttempt(prev, summary);
      setLastPointsEarned(pointsEarned);
      return nextStats;
    });
  };

  const unreadCount = useMemo(
    () => countUnreadNotifications(notifications),
    [notifications]
  );

  const visibleReminders = useMemo(
    () => getVisibleWorkerReminders(workReminders),
    [workReminders]
  );

  // Editable worker registration state
  const [form, setForm] = useState<WorkerProfile>(() => ({
    ...workerProfile,
    experiencias:
      workerProfile.experiencias.length > 0
        ? workerProfile.experiencias
        : [createBlankExperience()],
    categoriasNotificacao: Array.isArray(workerProfile.categoriasNotificacao)
      ? workerProfile.categoriasNotificacao
      : [],
  }));
  const [activeExpIndex, setActiveExpIndex] = useState<number>(0);
  const [formError, setFormError] = useState<string>('');
  const [missingDocKeys, setMissingDocKeys] = useState<RequiredDocumentKey[]>([]);
  const [sexMissingError, setSexMissingError] = useState<boolean>(false);
  const [imgFailed, setImgFailed] = useState<boolean>(false);
  const [registrationGeoLocating, setRegistrationGeoLocating] = useState<boolean>(false);
  const [registrationGeoInfo, setRegistrationGeoInfo] = useState<string>('');
  const [registrationGeoError, setRegistrationGeoError] = useState<string>('');
  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const hasEditedRegionFieldsRef = useRef<boolean>(false);
  const autoFilledRegistrationRef = useRef<boolean>(false);

  const isWorkerRegistered = Boolean(
    workerProfile.nomeCompleto.trim() && workerProfile.telefone.trim()
  );

  const applyDetectedRegionToForm = (
    nearestRegion: string,
    detectedCity: string
  ) => {
    setForm((prev) => {
      const resolved = resolveAutoFilledRegionAndNeighborhood({
        nearestRegion,
        availableNeighborhoods: RONDONOPOLIS_NEIGHBORHOODS,
        availableRegions: RONDONOPOLIS_REGIONS,
        currentNeighborhood: prev.bairro,
        currentRegion: prev.regiaoInteresse,
      });
      return {
        ...prev,
        bairro: resolved.bairro,
        regiaoInteresse: resolved.regiaoInteresse,
      };
    });
    setRegistrationGeoError('');
    setRegistrationGeoInfo(
      `Região preenchida automaticamente com «${nearestRegion}» (${detectedCity}).`
    );
  };

  useEffect(() => {
    if (activeTab !== 'cadastro') return;
    if (isWorkerRegistered) return;
    if (autoFilledRegistrationRef.current || hasEditedRegionFieldsRef.current) return;

    if (proximityFilter?.active && proximityFilter.nearestRegion) {
      autoFilledRegistrationRef.current = true;
      applyDetectedRegionToForm(
        proximityFilter.nearestRegion,
        proximityFilter.detectedCity
      );
      return;
    }

    let cancelled = false;
    const tryAutoFillIfGranted = async () => {
      const perm = await queryGeolocationPermission();
      if (cancelled || perm !== 'granted') return;
      if (typeof navigator === 'undefined' || !navigator.geolocation) return;

      autoFilledRegistrationRef.current = true;
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          if (cancelled || hasEditedRegionFieldsRef.current) return;
          const { latitude, longitude } = position.coords;
          const nearestRegion = resolveNearestRondonopolisRegion(latitude, longitude);
          const detectedCity = await reverseGeocodeCity(latitude, longitude);
          if (cancelled || hasEditedRegionFieldsRef.current) return;
          applyDetectedRegionToForm(nearestRegion, detectedCity);
        },
        () => {
          // Silent skip when automatic detection fails
        },
        { enableHighAccuracy: false, timeout: 6000 }
      );
    };

    void tryAutoFillIfGranted();

    return () => {
      cancelled = true;
    };
  }, [activeTab, proximityFilter, isWorkerRegistered]);

  const handleDetectRegistrationRegion = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setRegistrationGeoInfo('');
      setRegistrationGeoError(
        'Geolocalização indisponível neste dispositivo. Selecione bairro e região manualmente.'
      );
      return;
    }

    setRegistrationGeoLocating(true);
    setRegistrationGeoError('');
    setRegistrationGeoInfo('');
    hasEditedRegionFieldsRef.current = false;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const nearestRegion = resolveNearestRondonopolisRegion(latitude, longitude);
        const detectedCity = await reverseGeocodeCity(latitude, longitude);
        autoFilledRegistrationRef.current = true;
        applyDetectedRegionToForm(nearestRegion, detectedCity);
        setRegistrationGeoLocating(false);
      },
      (err) => {
        setRegistrationGeoError(resolveGeolocationErrorMessage(err?.code));
        setRegistrationGeoLocating(false);
      },
      { enableHighAccuracy: false, timeout: 6000 }
    );
  };

  const occupationFilterOptions = useMemo(() => {
    const set = new Set<string>(CONSTRUCTION_ROLES);
    for (const j of jobs) {
      if (j.funcao.trim()) set.add(j.funcao.trim());
    }
    return Array.from(set);
  }, [jobs]);

  const activeAdvancedCount = useMemo(
    () =>
      countActiveAdvancedFilters({
        occupation: filterOccupation,
        contractType: filterContract,
        experienceLevel: filterExperience,
      }),
    [filterOccupation, filterContract, filterExperience]
  );

  const openJobs = useMemo(
    () => jobs.filter((job) => job.status === 'aberta'),
    [jobs]
  );

  const { scopedJobsBeforeTags, distanceByJobId } = useMemo(() => {
    const baseFiltered = filterJobsByLocationAndQuery(jobs, {
      region: selectedRegion,
      query: searchQuery,
      onlyOpen: true,
      occupation: filterOccupation,
      contractType: filterContract,
      experienceLevel: filterExperience,
    });

    if (!proximityFilter?.active) {
      return {
        scopedJobsBeforeTags: baseFiltered,
        distanceByJobId: new Map<string, number>(),
      };
    }

    const nearby = filterAndSortJobsByProximity(
      baseFiltered,
      { lat: proximityFilter.userLat, lng: proximityFilter.userLng },
      proximityFilter.radiusKm
    );
    const map = new Map<string, number>();
    for (const item of nearby) {
      map.set(item.job.id, item.distanceKm);
    }
    return {
      scopedJobsBeforeTags: nearby.map((item) => item.job),
      distanceByJobId: map,
    };
  }, [
    jobs,
    selectedRegion,
    searchQuery,
    filterOccupation,
    filterContract,
    filterExperience,
    proximityFilter,
  ]);

  const skillTagSummaries = useMemo(
    () => buildSkillTagSummaries(openJobs, scopedJobsBeforeTags),
    [openJobs, scopedJobsBeforeTags]
  );

  const filteredJobs = useMemo(
    () => filterJobsBySkillTags(scopedJobsBeforeTags, selectedSkillTags),
    [scopedJobsBeforeTags, selectedSkillTags]
  );

  const clearAdvancedFilters = () => {
    setFilterOccupation('Todas');
    setFilterContract('Todos');
    setFilterExperience('Todos');
  };

  const applicationsByJobId = useMemo(() => {
    const map = new Map<string, JobApplication>();
    for (const app of applications) {
      map.set(app.jobId, app);
    }
    return map;
  }, [applications]);

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

  const focusWorkerControl = (selector: string) => {
    if (typeof document === 'undefined') return;
    const el = document.querySelector<HTMLElement>(selector);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus({ preventScroll: true });
    }
  };

  const handleSaveWorker = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setMissingDocKeys([]);
    setSexMissingError(false);

    if (!form.nomeCompleto.trim()) {
      setFormError('Informe seu nome completo.');
      focusWorkerControl('#worker-nome');
      return;
    }
    if (!form.telefone.trim()) {
      setFormError('Informe seu telefone ou WhatsApp para contato das construtoras.');
      focusWorkerControl('#worker-telefone');
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

    const docsValidation = validateRequiredRegistrationDocuments(
      form.sexo,
      form.documentosAnexos,
      'contratado'
    );
    if (!docsValidation.valid) {
      setSexMissingError(docsValidation.missingSex);
      setMissingDocKeys(docsValidation.missingKeys);
      setFormError(docsValidation.errorMessage);
      if (docsValidation.missingSex) {
        focusWorkerControl('#worker-sexo');
      } else if (docsValidation.missingKeys[0]) {
        focusWorkerControl(
          `[data-testid="doc-trigger-contratado-${docsValidation.missingKeys[0]}"]`
        );
      }
      return;
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
      sexo: form.sexo || '',
      telefone: form.telefone.trim(),
      email: form.email.trim(),
      resumoProfissional: form.resumoProfissional.trim(),
      experiencias: sanitizedExperiences,
      documentosAnexos: form.documentosAnexos ?? {},
      categoriasNotificacao: form.categoriasNotificacao ?? [],
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

  const handleExportResumePdf = () => {
    setPdfExportFeedback('');
    setIsExportingPdf(true);
    try {
      const result = exportWorkerResumePdf(workerProfile);
      if (result.ok) {
        setPdfExportFeedback(`Currículo exportado: ${result.fileName}`);
      } else {
        setPdfExportFeedback(result.error);
      }
    } finally {
      setIsExportingPdf(false);
    }
  };

  const inputClass =
    'w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-base sm:text-sm text-[#111827] dark:text-[#F8FAFC] placeholder:text-[#6B7280] dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-[#C93B1E]';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-nav-safe md:pb-12">
      {/* Header Context */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E5E7EB] dark:border-[#1E293B] pb-5">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#C93B1E] dark:text-[#F06449]">
            Área do Contratado · Rondonópolis-MT
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#111827] dark:text-[#F8FAFC] mt-1 break-words">
            {isWorkerRegistered
              ? `Olá, ${workerProfile.nomeCompleto.split(' ')[0]}`
              : 'Vagas e Perfil Profissional'}
          </h1>
          <p className="text-sm text-[#4B5563] dark:text-[#94A3B8] mt-1 break-words">
            {isWorkerRegistered
              ? `${workerProfile.funcaoPrincipal} · Região de interesse: ${workerProfile.regiaoInteresse}`
              : 'Busque vagas por região em Rondonópolis-MT ou monte seu perfil com PDF ou experiências.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setShowNotifications((prev) => !prev)}
            aria-expanded={showNotifications}
            data-testid="worker-notifications-toggle"
            className={`min-h-[44px] px-4 py-2 rounded-xl border text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer ${
              unreadCount > 0
                ? 'border-[#C93B1E] dark:border-[#F06449] bg-[#C93B1E]/10 dark:bg-[#C93B1E]/20 text-[#111827] dark:text-[#F8FAFC]'
                : 'border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#111827] hover:bg-[#F9FAFB] dark:hover:bg-[#1E293B] text-[#111827] dark:text-[#F8FAFC]'
            }`}
          >
            <Bell
              className={`w-4 h-4 ${
                unreadCount > 0
                  ? 'text-[#C93B1E] dark:text-[#F06449]'
                  : 'text-[#4B5563] dark:text-[#94A3B8]'
              }`}
              aria-hidden="true"
            />
            <span>Notificações</span>
            <span className="font-mono text-xs tabular-nums">({unreadCount})</span>
          </button>

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
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#111827] hover:bg-[#F9FAFB] dark:hover:bg-[#1E293B] text-sm font-semibold text-[#111827] dark:text-[#F8FAFC] transition-colors cursor-pointer"
            >
              Ver perfil gerado
            </button>
          )}
        </div>
      </div>

      {/* Inline Native Push Prompt Banner when notifications panel is closed */}
      {!(showNotifications || unreadCount > 0) &&
        shouldShowPushPromptBanner(pushPermission, pushPreference) && (
          <div className="mt-5">
            <NativePushPermissionCard
              permission={pushPermission}
              preference={pushPreference}
              isRequesting={isRequestingPush}
              statusFeedback={pushFeedback}
              onRequestPermission={onRequestPushPermission}
              onToggleEnabled={onTogglePushEnabled}
              onDismissBanner={onDismissPushBanner}
              onSendTestNotification={onTestNativePush}
            />
          </div>
        )}

      {/* Worker Notifications Center */}
      {(showNotifications || unreadCount > 0) && (
        <section
          aria-label="Notificações do trabalhador"
          data-testid="worker-notifications-panel"
          className="mt-5 bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl p-4 sm:p-5 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#F3F4F6] dark:border-[#1E293B]">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#C93B1E] dark:text-[#F06449]" aria-hidden="true" />
              <h2 className="font-display text-base font-bold text-[#111827] dark:text-[#F8FAFC]">
                Avisos recentes ({notifications.length})
              </h2>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllNotificationsRead}
                className="min-h-[44px] sm:min-h-[40px] px-3 py-1.5 rounded-lg border border-[#D1D5DB] dark:border-[#334155] hover:bg-[#F9FAFB] dark:hover:bg-[#1E293B] text-xs font-semibold text-[#111827] dark:text-[#F8FAFC] inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Marcar todas como lidas</span>
              </button>
            )}
          </div>

          <NativePushPermissionCard
            variant="settings"
            permission={pushPermission}
            preference={pushPreference}
            isRequesting={isRequestingPush}
            statusFeedback={pushFeedback}
            onRequestPermission={onRequestPushPermission}
            onToggleEnabled={onTogglePushEnabled}
            onSendTestNotification={onTestNativePush}
          />

          {notifications.length === 0 ? (
            <p className="text-sm text-[#4B5563] dark:text-[#94A3B8]">
              Você não tem notificações no momento. Avisaremos aqui quando uma candidatura for aceita ou quando surgirem novas vagas na sua região.
            </p>
          ) : (
            <ul className="divide-y divide-[#F3F4F6] dark:divide-[#1E293B]">
              {notifications.map((notif) => {
                const matchedApp =
                  (notif.applicationId
                    ? applications.find((a) => a.id === notif.applicationId)
                    : undefined) ??
                  (notif.jobId ? applicationsByJobId.get(notif.jobId) : undefined);
                const canChatFromNotif =
                  Boolean(matchedApp) &&
                  (matchedApp!.status === 'aceita' || matchedApp!.status === 'concluida') &&
                  (notif.type === 'candidatura_aceita' ||
                    notif.type === 'lembrete_trabalho');
                return (
                  <li
                    key={notif.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"
                  >
                    <div className="min-w-0 w-full sm:flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-semibold ${
                            notif.type === 'candidatura_aceita'
                              ? 'text-[#047857] dark:text-[#34D399]'
                              : notif.type === 'lembrete_trabalho'
                                ? 'text-[#B45309] dark:text-[#FBBF24]'
                                : 'text-[#C93B1E] dark:text-[#F06449]'
                          }`}
                        >
                          {notif.type === 'candidatura_aceita'
                            ? 'Candidatura aceita'
                            : notif.type === 'lembrete_trabalho'
                              ? 'Lembrete 30 min antes'
                              : 'Nova vaga na região'}
                        </span>
                        {!notif.read && (
                          <span className="text-xs font-semibold text-[#111827] dark:text-[#F8FAFC]">
                            · Nova
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-[#111827] dark:text-[#F8FAFC] mt-0.5">
                        {notif.title}
                      </p>
                      <p className="text-xs sm:text-sm text-[#4B5563] dark:text-[#94A3B8] mt-0.5">
                        {notif.message}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {canChatFromNotif && matchedApp && (
                        <button
                          type="button"
                          data-testid={`notification-open-chat-${notif.id}`}
                          onClick={() => {
                            if (!notif.read) onMarkNotificationRead(notif.id);
                            onOpenChat(matchedApp.id);
                          }}
                          className="min-h-[44px] sm:min-h-[40px] px-3 py-1.5 rounded-lg bg-[#C93B1E] hover:bg-[#B23319] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span>Abrir chat</span>
                        </button>
                      )}
                      {notif.type === 'nova_vaga_regiao' && activeTab !== 'vagas' && (
                        <button
                          type="button"
                          onClick={() => onChangeTab('vagas')}
                          className="min-h-[44px] sm:min-h-[40px] px-3 py-1.5 rounded-lg bg-[#111827] dark:bg-[#F8FAFC] text-white dark:text-[#0F172A] text-xs font-semibold cursor-pointer"
                        >
                          Ver vaga
                        </button>
                      )}
                      {!notif.read && (
                        <button
                          type="button"
                          onClick={() => onMarkNotificationRead(notif.id)}
                          className="min-h-[44px] sm:min-h-[40px] px-3 py-1.5 rounded-lg border border-[#D1D5DB] dark:border-[#334155] hover:bg-[#F9FAFB] dark:hover:bg-[#1E293B] text-xs font-semibold text-[#111827] dark:text-[#F8FAFC] cursor-pointer"
                        >
                          Marcar como lida
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {/* Scheduled Work Reminders (30 min before start) */}
      {visibleReminders.length > 0 && (
        <section
          aria-label="Lembretes de início de trabalho"
          data-testid="worker-reminders-section"
          className="mt-5 bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl p-4 sm:p-5 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#F3F4F6] dark:border-[#1E293B]">
            <div className="flex items-center gap-2">
              <BellRing
                className="w-4 h-4 text-[#C93B1E] dark:text-[#F06449] shrink-0"
                aria-hidden="true"
              />
              <h2 className="font-display text-base font-bold text-[#111827] dark:text-[#F8FAFC]">
                Lembretes de início agendados ({visibleReminders.length})
              </h2>
            </div>
            <span className="text-xs text-[#4B5563] dark:text-[#94A3B8]">
              Aviso automático 30 min antes
            </span>
          </div>

          <ul className="divide-y divide-[#F3F4F6] dark:divide-[#1E293B]">
            {visibleReminders.map((rem) => {
              const startText = formatReminderSchedulePtBr(rem.scheduledStartAt);
              const triggerTime = formatReminderTimeOnlyPtBr(rem.reminderAt);
              const relatedApp = applications.find((a) => a.id === rem.applicationId);
              const isNotified = rem.status === 'notificado';
              return (
                <li
                  key={rem.id}
                  data-testid={`worker-reminder-item-${rem.applicationId}`}
                  className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div className="min-w-0 w-full sm:flex-1">
                    <p className="text-sm font-bold text-[#111827] dark:text-[#F8FAFC] break-words">
                      {rem.jobRole} · {rem.companyName}
                    </p>
                    <p className="text-xs text-[#4B5563] dark:text-[#94A3B8] mt-0.5 tabular-nums break-words">
                      Início em {startText} · {rem.neighborhood}
                      {rem.locationNote ? ` · ${rem.locationNote}` : ''}
                    </p>
                    <p
                      className={`text-xs font-semibold mt-1 tabular-nums ${
                        isNotified
                          ? 'text-[#047857] dark:text-[#34D399]'
                          : 'text-[#B45309] dark:text-[#FBBF24]'
                      }`}
                    >
                      {isNotified
                        ? `Lembrete de 30 min antes enviado (às ${triggerTime})`
                        : `Alerta programado para as ${triggerTime} (30 min antes)`}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {relatedApp &&
                      (relatedApp.status === 'aceita' ||
                        relatedApp.status === 'concluida') && (
                        <button
                          type="button"
                          onClick={() => onOpenChat(relatedApp.id)}
                          data-testid={`worker-reminder-chat-${rem.applicationId}`}
                          className="min-h-[44px] sm:min-h-[40px] px-3 py-1.5 rounded-lg bg-[#C93B1E] hover:bg-[#B23319] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span>Abrir chat</span>
                        </button>
                      )}
                    <button
                      type="button"
                      onClick={() => onCancelWorkReminder(rem.id)}
                      data-testid={`worker-reminder-cancel-${rem.id}`}
                      className="min-h-[44px] sm:min-h-[40px] px-3 py-1.5 rounded-lg border border-[#D1D5DB] dark:border-[#334155] hover:bg-[#F9FAFB] dark:hover:bg-[#1E293B] text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <AnimatePresence mode="wait" initial={false}>
        {/* TAB 1: Vagas Disponíveis */}
        {activeTab === 'vagas' && (
          <motion.div
            key="worker-tab-vagas"
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
            searchQuery={searchQuery}
            onChangeSearchQuery={setSearchQuery}
            searchPlaceholder="Buscar por função ou construtora (ex: Pedreiro)"
            regionLabel="Onde você deseja ver vagas disponíveis?"
            proximityFilter={proximityFilter}
            onApplyProximity={(next) => setProximityFilter(next)}
            onClearProximity={() => setProximityFilter(null)}
            onRegionDetected={(nearestRegion, detectedCity) => {
              if (!hasEditedRegionFieldsRef.current && !isWorkerRegistered) {
                autoFilledRegistrationRef.current = true;
                applyDetectedRegionToForm(nearestRegion, detectedCity);
              }
            }}
            autoDetectWhenGranted={true}
            enableVoiceSearch={true}
          />

          <RainAlertsPanel
            variant="compact"
            siteRegion={selectedRegion}
            onChangeSiteRegion={onChangeRegion}
            gpsCoordinates={
              proximityFilter?.active
                ? { lat: proximityFilter.userLat, lng: proximityFilter.userLng }
                : null
            }
            onOpenFullPanel={() => onChangeTab('utilidades')}
          />

          <SkillTagFilterBar
            summaries={skillTagSummaries}
            selectedTags={selectedSkillTags}
            onToggleTag={(tag) =>
              setSelectedSkillTags((prev) => toggleSkillTagSelection(prev, tag))
            }
            onClearTags={() => setSelectedSkillTags([])}
          />

          {/* Advanced Filters Menu */}
          <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowAdvancedFilters((prev) => !prev)}
                aria-expanded={showAdvancedFilters}
                data-testid="worker-advanced-filters-toggle"
                className="min-h-[44px] px-4 py-2 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#1E293B] hover:bg-[#F3F4F6] dark:hover:bg-[#334155] text-sm font-semibold text-[#111827] dark:text-[#F8FAFC] inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4 text-[#C93B1E] dark:text-[#F06449]" aria-hidden="true" />
                <span>
                  Filtros avançados
                  {activeAdvancedCount > 0 ? ` (${activeAdvancedCount})` : ''}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-[#4B5563] dark:text-[#94A3B8] transition-transform ${
                    showAdvancedFilters ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>

              {activeAdvancedCount > 0 && (
                <button
                  type="button"
                  onClick={clearAdvancedFilters}
                  className="min-h-[44px] sm:min-h-[40px] px-3 py-1.5 text-xs font-semibold text-[#C93B1E] dark:text-[#F06449] hover:underline cursor-pointer"
                >
                  Limpar filtros avançados
                </button>
              )}
            </div>

            <AnimatePresence initial={false}>
              {showAdvancedFilters && (
                <motion.div
                  key="worker-advanced-filters"
                  data-testid="worker-advanced-filters-menu"
                  initial={PANEL_REVEAL_VARIANTS.initial}
                  animate={PANEL_REVEAL_VARIANTS.animate}
                  exit={PANEL_REVEAL_VARIANTS.exit}
                  transition={PANEL_REVEAL_TRANSITION}
                  className="mt-4 pt-4 border-t border-[#E5E7EB] dark:border-[#1E293B] grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                <div>
                  <label
                    htmlFor="filter-occupation"
                    className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
                  >
                    Ocupação específica
                  </label>
                  <select
                    id="filter-occupation"
                    value={filterOccupation}
                    onChange={(e) => setFilterOccupation(e.target.value)}
                    className={inputClass}
                  >
                    <option value="Todas">Todas as ocupações</option>
                    {occupationFilterOptions.map((occ) => (
                      <option key={occ} value={occ}>
                        {occ}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="filter-contract"
                    className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
                  >
                    Tipo de contrato
                  </label>
                  <select
                    id="filter-contract"
                    value={filterContract}
                    onChange={(e) => setFilterContract(e.target.value)}
                    className={inputClass}
                  >
                    <option value="Todos">Todos os contratos</option>
                    {CONTRACT_TYPE_OPTIONS.map((ct) => (
                      <option key={ct} value={ct}>
                        {ct}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="filter-experience"
                    className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
                  >
                    Nível de experiência
                  </label>
                  <select
                    id="filter-experience"
                    value={filterExperience}
                    onChange={(e) => setFilterExperience(e.target.value)}
                    className={inputClass}
                  >
                    <option value="Todos">Todos os níveis</option>
                    {EXPERIENCE_LEVEL_OPTIONS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {applyFeedback && (
            <div
              role="status"
              className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] flex flex-wrap items-center justify-between gap-3"
            >
              <p className="text-sm font-medium text-[#111827] dark:text-[#F8FAFC]">{applyFeedback}</p>
              {!isWorkerRegistered && (
                <button
                  type="button"
                  onClick={() => onChangeTab('cadastro')}
                  className="min-h-[44px] sm:min-h-[40px] px-4 py-1.5 rounded-lg bg-[#C93B1E] text-white text-xs font-semibold cursor-pointer"
                >
                  Ir para Meu Cadastro
                </button>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg font-bold text-[#111827] dark:text-[#F8FAFC]">
              Vagas disponíveis ({filteredJobs.length})
            </h2>
            <span className="text-xs text-[#4B5563] dark:text-[#94A3B8] tabular-nums">
              {proximityFilter?.active
                ? `Proximidade: ${proximityFilter.detectedCity} (até ${proximityFilter.radiusKm} km)`
                : `Região: ${selectedRegion}`}
            </span>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {filteredJobs.length === 0 ? (
              <motion.div
                key="jobs-empty"
                initial={PANEL_REVEAL_VARIANTS.initial}
                animate={PANEL_REVEAL_VARIANTS.animate}
                exit={PANEL_REVEAL_VARIANTS.exit}
                transition={PANEL_REVEAL_TRANSITION}
                className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl p-8 text-center"
              >
                <Briefcase className="w-8 h-8 text-[#6B7280] dark:text-[#94A3B8] mx-auto mb-2" aria-hidden="true" />
                <p className="text-sm font-semibold text-[#111827] dark:text-[#F8FAFC]">
                  {proximityFilter?.active
                    ? `Nenhuma vaga encontrada num raio de ${proximityFilter.radiusKm} km da sua localização`
                    : 'Nenhuma vaga aberta para esse filtro'}
                </p>
                <p className="text-sm text-[#4B5563] dark:text-[#94A3B8] mt-1">
                  {proximityFilter?.active
                    ? `Sua cidade foi detectada como ${proximityFilter.detectedCity}. Amplie a distância máxima ou limpe o filtro de distância para visualizar todas as vagas.`
                    : 'Tente limpar os filtros avançados, a busca ou selecionar todas as regiões de Rondonópolis-MT.'}
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                  {proximityFilter?.active && proximityFilter.radiusKm < 50 && (
                    <button
                      type="button"
                      data-testid="expand-proximity-50km-button"
                      onClick={() =>
                        setProximityFilter(updateProximityRadius(proximityFilter, 50))
                      }
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-[#C93B1E] hover:bg-[#B23319] text-white text-sm font-medium cursor-pointer"
                    >
                      Ampliar para 50 km
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      onChangeRegion('Toda Rondonópolis e Região');
                      setSearchQuery('');
                      setProximityFilter(null);
                      setSelectedSkillTags([]);
                      clearAdvancedFilters();
                    }}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-[#111827] dark:bg-[#F8FAFC] text-white dark:text-[#0F172A] text-sm font-medium cursor-pointer"
                  >
                    Ver todas as vagas
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="jobs-grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.16 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                data-testid="available-jobs-list"
              >
                <AnimatePresence mode="popLayout" initial={true}>
                  {filteredJobs.map((job, index) => {
                    const existingApplication = applicationsByJobId.get(job.id);
                    const isAccepted = existingApplication?.status === 'aceita';
                    const isCompleted = existingApplication?.status === 'concluida';
                    const canOpenChat = isAccepted || isCompleted;
                    const existingRating = existingApplication
                      ? getRatingForApplication(companyRatings, existingApplication.id)
                      : undefined;
                    const companyRatingSummary = computeCompanyRatingSummary(
                      companyRatings,
                      job.companyId,
                      job.companyName
                    );
                    const distKm = distanceByJobId.get(job.id);
                    const unreadChatCount =
                      existingApplication && canOpenChat
                        ? countUnreadMessagesForApplication(
                            chatMessages,
                            existingApplication.id,
                            'contratado'
                          )
                        : 0;
                    return (
                      <motion.article
                        key={job.id}
                        layout="position"
                        initial={JOB_CARD_VARIANTS.initial}
                        animate={JOB_CARD_VARIANTS.animate}
                        exit={JOB_CARD_VARIANTS.exit}
                        transition={JOB_CARD_TRANSITION(index)}
                        className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl p-5 flex flex-col justify-between"
                      >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <ProfileAvatar
                            name={job.companyName}
                            photoUrl={job.companyPhotoUrl}
                            entityType="company"
                            size="md"
                            className="mt-0.5"
                            testId={`job-company-avatar-${job.id}`}
                          />
                          <div className="min-w-0">
                            <h3 className="font-display text-lg font-bold text-[#111827] dark:text-[#F8FAFC] break-words">
                              {job.funcao}
                            </h3>
                            <p className="text-sm font-medium text-[#4B5563] dark:text-[#94A3B8] break-words">
                              {job.companyName}
                            </p>
                          <p
                            className="mt-1 text-xs text-[#4B5563] dark:text-[#94A3B8] inline-flex items-center gap-1.5 tabular-nums"
                            data-testid={`job-company-rating-${job.id}`}
                          >
                            <Star
                              className={`w-3.5 h-3.5 shrink-0 ${
                                companyRatingSummary.count > 0
                                  ? 'text-amber-500 fill-amber-500 dark:text-amber-400 dark:fill-amber-400'
                                  : 'text-[#9CA3AF] dark:text-[#64748B]'
                              }`}
                              aria-hidden="true"
                            />
                            <span className="font-semibold text-[#111827] dark:text-[#F8FAFC]">
                              {companyRatingSummary.count > 0
                                ? companyRatingSummary.formattedAverage
                                : 'Nova'}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>
                              {companyRatingSummary.count > 0
                                ? `${companyRatingSummary.count} ${
                                    companyRatingSummary.count === 1
                                      ? 'avaliação'
                                      : 'avaliações'
                                  }`
                                : 'Sem avaliações ainda'}
                            </span>
                          </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-display text-lg font-bold text-[#C93B1E] dark:text-[#F06449] tabular-nums">
                            {job.quantidadeVagas}
                          </span>
                          <span className="text-xs text-[#4B5563] dark:text-[#94A3B8] ml-1">
                            {job.quantidadeVagas === 1 ? 'vaga' : 'vagas'}
                          </span>
                        </div>
                      </div>

                      <p className="mt-2.5 text-xs text-[#4B5563] dark:text-[#94A3B8] tabular-nums">
                        {job.bairro}
                        {distKm !== undefined ? ` · a ~${formatDistanceKmPtBr(distKm)}` : ''} ·{' '}
                        {job.tipoContrato ?? 'CLT'} ·{' '}
                        {job.nivelExperiencia ?? 'Intermediário (1 a 3 anos)'} · {job.turno} ·{' '}
                        {job.salarioOuDiaria}
                      </p>

                      <p className="mt-3 text-sm text-[#374151] dark:text-[#CBD5E1] leading-relaxed whitespace-pre-line">
                        {job.descricao}
                      </p>

                      {job.beneficios && (
                        <p className="mt-2 text-xs text-[#4B5563] dark:text-[#94A3B8]">
                          <span className="font-semibold text-[#111827] dark:text-[#F8FAFC]">Benefícios:</span>{' '}
                          {job.beneficios}
                        </p>
                      )}

                      <p
                        className="mt-2 text-xs text-[#4B5563] dark:text-[#94A3B8]"
                        data-testid={`job-skill-tags-${job.id}`}
                      >
                        <span className="font-semibold text-[#111827] dark:text-[#F8FAFC]">
                          Habilidades:
                        </span>{' '}
                        {getJobSkillTags(job).map(formatSkillTagLabel).join(' · ')}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#F3F4F6] dark:border-[#1E293B] flex flex-wrap items-center justify-between gap-3">
                      <span className="text-xs text-[#4B5563] dark:text-[#94A3B8] inline-flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#6B7280] dark:text-[#94A3B8]" aria-hidden="true" />
                        <span>{job.telefoneContato}</span>
                      </span>

                      {existingApplication ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-[#047857] dark:text-[#34D399] inline-flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>
                              {isCompleted
                                ? 'Trabalho concluído'
                                : isAccepted
                                  ? 'Candidatura aceita'
                                  : 'Candidatura enviada'}
                            </span>
                          </span>

                          {canOpenChat && (
                            <button
                              type="button"
                              onClick={() => onOpenChat(existingApplication.id)}
                              data-testid={`worker-open-chat-${job.id}`}
                              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] hover:bg-[#F9FAFB] dark:hover:bg-[#1E293B] text-[#111827] dark:text-[#F8FAFC] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5 shrink-0 text-[#C93B1E] dark:text-[#F06449]" aria-hidden="true" />
                              <span>
                                Chat{unreadChatCount > 0 ? ` (${unreadChatCount})` : ''}
                              </span>
                            </button>
                          )}

                          {canCompleteWork(existingApplication) && (
                            <button
                              type="button"
                              onClick={() => onCompleteApplication(existingApplication.id)}
                              data-testid={`worker-complete-work-${job.id}`}
                              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#111827] hover:bg-[#1F2937] dark:bg-[#F8FAFC] dark:hover:bg-[#E2E8F0] text-white dark:text-[#0F172A] text-xs font-semibold inline-flex items-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                              <span>Concluir trabalho</span>
                            </button>
                          )}

                          {canRateCompanyForApplication(existingApplication, companyRatings) && (
                            <button
                              type="button"
                              onClick={() => onOpenRatingModal(existingApplication.id)}
                              data-testid={`worker-rate-company-${job.id}`}
                              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#C93B1E] hover:bg-[#B23319] text-white text-xs font-semibold inline-flex items-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer"
                            >
                              <Star className="w-3.5 h-3.5 shrink-0 fill-current" aria-hidden="true" />
                              <span>Avaliar empresa</span>
                            </button>
                          )}

                          {existingRating && (
                            <span
                              className="text-xs font-semibold text-amber-700 dark:text-amber-400 inline-flex items-center gap-1 tabular-nums"
                              data-testid={`worker-rated-badge-${job.id}`}
                            >
                              <Star className="w-3.5 h-3.5 fill-current shrink-0" aria-hidden="true" />
                              <span>Sua nota: {existingRating.stars}/5</span>
                            </span>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleApplyClick(job)}
                          className="min-h-[44px] px-4 py-2 rounded-xl bg-[#111827] hover:bg-[#1F2937] dark:bg-[#F8FAFC] dark:hover:bg-[#E2E8F0] text-white dark:text-[#0F172A] text-xs sm:text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer"
                        >
                          Candidatar-se
                        </button>
                      )}
                    </div>
                      </motion.article>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

            <SafetyTipsCard
              workerProfile={workerProfile}
              onQuizComplete={handleSafetyQuizComplete}
            />

            <SafetyLeaderboardCard
              workerProfile={workerProfile}
              selectedRegion={selectedRegion}
              safetyStats={safetyStats}
              lastPointsEarned={lastPointsEarned}
            />

            <WorkerProductivityPanel workerRole={workerProfile.funcaoPrincipal} />

            <WorkerEarningsPanel jobs={jobs} applications={applications} />

            <CareerTipsCard workerProfile={workerProfile} />
          </motion.div>
        )}

        {/* TAB 2: Meu Cadastro */}
        {activeTab === 'cadastro' && (
          <motion.form
            key="worker-tab-cadastro"
            variants={TAB_TRANSITION_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={TAB_TRANSITION_CONFIG}
            onSubmit={handleSaveWorker}
            className="mt-6 space-y-6 max-w-4xl"
          >
          {/* General Personal Information */}
          <section className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl p-5 sm:p-6">
            <h2 className="font-display text-xl font-bold text-[#111827] dark:text-[#F8FAFC]">
              1. Dados gerais do colaborador
            </h2>
            <p className="text-sm text-[#4B5563] dark:text-[#94A3B8] mt-1">
              Esses dados formam a identificação do seu perfil profissional para as construtoras.
            </p>

            <div className="mt-5">
              <ProfilePhotoField
                name={form.nomeCompleto || 'Trabalhador BrickJobs'}
                photoUrl={form.fotoPerfilUrl}
                entityType="worker"
                testIdPrefix="worker"
                onChangePhotoUrl={(nextUrl) =>
                  setForm({ ...form, fotoPerfilUrl: nextUrl })
                }
              />
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="worker-nome"
                  className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
                >
                  Nome completo *
                </label>
                <input
                  id="worker-nome"
                  type="text"
                  value={form.nomeCompleto}
                  onChange={(e) => setForm({ ...form, nomeCompleto: e.target.value })}
                  placeholder="Ex: João Carlos Silva"
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="worker-sexo"
                  className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
                >
                  Sexo *
                </label>
                <select
                  id="worker-sexo"
                  data-testid="worker-sex-select"
                  aria-invalid={sexMissingError || undefined}
                  value={form.sexo ?? ''}
                  onChange={(e) => {
                    const nextSex = e.target.value as WorkerProfile['sexo'];
                    setFormError('');
                    setSexMissingError(false);
                    if (nextSex !== 'masculino') {
                      setMissingDocKeys((prev) =>
                        prev.filter((k) => k !== 'reservistaOuCdi')
                      );
                    }
                    setForm({
                      ...form,
                      sexo: nextSex,
                    });
                  }}
                  className={`${inputClass} ${
                    sexMissingError
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
                {sexMissingError && (
                  <p
                    role="alert"
                    data-testid="worker-sex-error"
                    className="mt-1 text-xs font-semibold text-[#B91C1C] dark:text-[#F87171]"
                  >
                    Selecione seu sexo antes de enviar.
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="worker-telefone"
                  className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
                >
                  Telefone / WhatsApp *
                </label>
                <input
                  id="worker-telefone"
                  type="tel"
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                  placeholder="(66) 99999-0000"
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="worker-email"
                  className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
                >
                  E-mail (opcional)
                </label>
                <input
                  id="worker-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="seuemail@exemplo.com"
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="worker-funcao"
                  className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
                >
                  Ocupação principal *
                </label>
                <select
                  id="worker-funcao"
                  value={form.funcaoPrincipal}
                  onChange={(e) => setForm({ ...form, funcaoPrincipal: e.target.value })}
                  className={inputClass}
                >
                  {CONSTRUCTION_ROLES.map((roleName) => (
                    <option key={roleName} value={roleName}>
                      {roleName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 rounded-xl border border-[#E5E7EB] dark:border-[#1E293B] bg-[#F9FAFB] dark:bg-[#0F172A] p-3.5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-[#111827] dark:text-[#F8FAFC]">
                      Localização no cadastro
                    </p>
                    <p className="text-[11px] text-[#4B5563] dark:text-[#94A3B8]">
                      Preencha bairro e região de interesse automaticamente usando sua localização (a permissão só será solicitada se você ainda não tiver autorizado).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDetectRegistrationRegion}
                    disabled={registrationGeoLocating}
                    data-testid="worker-registration-geolocate-button"
                    className="min-h-[44px] sm:min-h-[38px] px-3.5 py-2 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#1E293B] hover:bg-[#F3F4F6] dark:hover:bg-[#334155] text-xs font-semibold text-[#111827] dark:text-[#F8FAFC] inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    <LocateFixed
                      className="w-4 h-4 text-[#C93B1E] dark:text-[#F06449] shrink-0"
                      aria-hidden="true"
                    />
                    <span>
                      {registrationGeoLocating
                        ? 'Detectando região...'
                        : 'Preencher região pela localização'}
                    </span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="worker-bairro"
                      className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
                    >
                      Bairro onde mora em Rondonópolis-MT
                    </label>
                    <select
                      id="worker-bairro"
                      value={form.bairro}
                      onChange={(e) => {
                        hasEditedRegionFieldsRef.current = true;
                        setRegistrationGeoInfo('');
                        setForm({ ...form, bairro: e.target.value });
                      }}
                      className={inputClass}
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
                      className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
                    >
                      Região de interesse para trabalhar
                    </label>
                    <select
                      id="worker-regiao"
                      value={form.regiaoInteresse}
                      onChange={(e) => {
                        hasEditedRegionFieldsRef.current = true;
                        setRegistrationGeoInfo('');
                        setForm({ ...form, regiaoInteresse: e.target.value });
                      }}
                      className={inputClass}
                    >
                      {RONDONOPOLIS_REGIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {registrationGeoInfo && (
                  <p
                    role="status"
                    data-testid="worker-registration-geo-status"
                    className="text-xs font-medium text-[#047857] dark:text-[#34D399]"
                  >
                    {registrationGeoInfo}
                  </p>
                )}

                {registrationGeoError && (
                  <p
                    role="alert"
                    data-testid="worker-registration-geo-error"
                    className="text-xs font-medium text-[#B91C1C] dark:text-[#F87171]"
                  >
                    {registrationGeoError}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="worker-disponibilidade"
                  className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
                >
                  Disponibilidade de início
                </label>
                <select
                  id="worker-disponibilidade"
                  value={form.disponibilidade}
                  onChange={(e) => setForm({ ...form, disponibilidade: e.target.value })}
                  className={inputClass}
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
                  className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
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
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {/* Option Selector: PDF vs Experiences Sub-tabs */}
          <section className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl p-5 sm:p-6">
            <h2 className="font-display text-xl font-bold text-[#111827] dark:text-[#F8FAFC]">
              2. Currículo em PDF ou Experiências Profissionais
            </h2>
            <p className="text-sm text-[#4B5563] dark:text-[#94A3B8] mt-1">
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
                    ? 'border-[#C93B1E] dark:border-[#F06449] bg-[#C93B1E]/5 dark:bg-[#C93B1E]/15 text-[#111827] dark:text-[#F8FAFC]'
                    : 'border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-[#4B5563] dark:text-[#94A3B8] hover:border-[#111827] dark:hover:border-[#64748B]'
                }`}
              >
                <FileText
                  className={`w-5 h-5 shrink-0 ${
                    form.tipoHistorico === 'pdf'
                      ? 'text-[#C93B1E] dark:text-[#F06449]'
                      : 'text-[#6B7280] dark:text-[#94A3B8]'
                  }`}
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-semibold text-[#111827] dark:text-[#F8FAFC]">
                    Anexar currículo em PDF
                  </p>
                  <p className="text-xs text-[#4B5563] dark:text-[#94A3B8]">
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
                    ? 'border-[#C93B1E] dark:border-[#F06449] bg-[#C93B1E]/5 dark:bg-[#C93B1E]/15 text-[#111827] dark:text-[#F8FAFC]'
                    : 'border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-[#4B5563] dark:text-[#94A3B8] hover:border-[#111827] dark:hover:border-[#64748B]'
                }`}
              >
                <Briefcase
                  className={`w-5 h-5 shrink-0 ${
                    form.tipoHistorico === 'experiencias'
                      ? 'text-[#C93B1E] dark:text-[#F06449]'
                      : 'text-[#6B7280] dark:text-[#94A3B8]'
                  }`}
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-semibold text-[#111827] dark:text-[#F8FAFC]">
                    Preencher experiências (sem PDF)
                  </p>
                  <p className="text-xs text-[#4B5563] dark:text-[#94A3B8]">
                    Sub-abas com local, função, datas e duração
                  </p>
                </div>
              </button>
            </div>

            {/* Option (i): PDF Upload */}
            {form.tipoHistorico === 'pdf' && (
              <div className="mt-5 p-5 rounded-xl border border-dashed border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#1E293B]">
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
                    <Upload className="w-8 h-8 text-[#C93B1E] dark:text-[#F06449] mx-auto mb-2" aria-hidden="true" />
                    <p className="text-sm font-semibold text-[#111827] dark:text-[#F8FAFC]">
                      Selecione seu currículo em PDF
                    </p>
                    <p className="text-xs text-[#4B5563] dark:text-[#94A3B8] mt-1">
                      Formato .pdf até 1,5 MB. O arquivo ficará anexado ao seu perfil gerado.
                    </p>
                    <button
                      type="button"
                      onClick={() => pdfInputRef.current?.click()}
                      className="mt-4 min-h-[44px] px-5 py-2 rounded-xl bg-[#111827] hover:bg-[#1F2937] dark:bg-[#F8FAFC] dark:hover:bg-[#E2E8F0] text-white dark:text-[#0F172A] text-sm font-medium cursor-pointer"
                    >
                      Escolher arquivo PDF
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-10 h-10 rounded-xl bg-[#C93B1E]/10 dark:bg-[#C93B1E]/20 text-[#C93B1E] dark:text-[#F06449] flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#111827] dark:text-[#F8FAFC] truncate">
                          {form.pdfCurriculo.fileName}
                        </p>
                        <p className="text-xs text-[#4B5563] dark:text-[#94A3B8]">
                          {formatFileSizePtBr(form.pdfCurriculo.fileSizeBytes)} · Anexado em{' '}
                          {form.pdfCurriculo.uploadedAt}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => pdfInputRef.current?.click()}
                        className="min-h-[44px] px-3.5 py-2 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs font-semibold text-[#111827] dark:text-[#F8FAFC] cursor-pointer"
                      >
                        Trocar PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, pdfCurriculo: null })}
                        aria-label="Remover currículo PDF"
                        className="min-h-[44px] px-3.5 py-2 rounded-lg border border-[#FECACA] dark:border-[#991B1B] bg-white dark:bg-[#0F172A] text-xs font-semibold text-[#B91C1C] dark:text-[#F87171] cursor-pointer"
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
                <div className="flex flex-wrap items-center gap-2 border-b border-[#E5E7EB] dark:border-[#1E293B] pb-3">
                  {form.experiencias.map((exp, idx) => {
                    const active = idx === activeExpIndex;
                    return (
                      <button
                        key={exp.id}
                        type="button"
                        onClick={() => setActiveExpIndex(idx)}
                        className={`min-h-[44px] max-w-full truncate px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                          active
                            ? 'bg-[#111827] dark:bg-[#F8FAFC] text-white dark:text-[#0F172A]'
                            : 'bg-[#F3F4F6] dark:bg-[#1E293B] text-[#374151] dark:text-[#CBD5E1] hover:bg-[#E5E7EB] dark:hover:bg-[#334155]'
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
                    className="min-h-[44px] px-3.5 py-2 rounded-lg border border-dashed border-[#9CA3AF] dark:border-[#475569] hover:border-[#111827] dark:hover:border-[#94A3B8] text-xs sm:text-sm font-semibold text-[#111827] dark:text-[#F8FAFC] inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
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
                          className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
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
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="exp-funcao"
                          className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
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
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                      <div>
                        <label
                          htmlFor="exp-inicio"
                          className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
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
                          className={`${inputClass} font-mono`}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="exp-fim"
                          className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
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
                          className={`${inputClass} font-mono disabled:bg-[#F3F4F6] dark:disabled:bg-[#1E293B] disabled:text-[#6B7280] dark:disabled:text-[#64748B]`}
                        />
                      </div>

                      <div className="flex items-center min-h-[44px]">
                        <label className="inline-flex items-center gap-2.5 text-sm text-[#111827] dark:text-[#F8FAFC] cursor-pointer">
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
                        <div className="p-3.5 rounded-xl bg-[#F9FAFB] dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] inline-flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-[#C93B1E] dark:text-[#F06449]" aria-hidden="true" />
                            <span>Tempo de atuação calculado:</span>
                          </span>
                          <span
                            className={`text-sm font-bold tabular-nums ${
                              calc.valid
                                ? 'text-[#111827] dark:text-[#F8FAFC]'
                                : 'text-[#B91C1C] dark:text-[#F87171]'
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
                        className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
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
                        className={inputClass}
                      />
                    </div>

                    {form.experiencias.length > 1 && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveExperienceTab(activeExpIndex)}
                          className="min-h-[44px] sm:min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold text-[#B91C1C] dark:text-[#F87171] hover:bg-[#FEF2F2] dark:hover:bg-[#7F1D1D]/30 inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                          <span>Remover Experiência {activeExpIndex + 1}</span>
                        </button>
                      </div>
                    )}

                    {form.experiencias.length > 1 && (
                      <div className="pt-3 border-t border-[#E5E7EB] dark:border-[#1E293B]">
                        <p className="text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-2">
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
                                className="text-xs text-[#4B5563] dark:text-[#94A3B8] flex items-center justify-between gap-2"
                              >
                                <span className="truncate">
                                  {idx + 1}.{' '}
                                  <strong className="text-[#111827] dark:text-[#F8FAFC]">
                                    {exp.funcao.trim() || 'Função não informada'}
                                  </strong>{' '}
                                  — {exp.empresaLocal.trim() || 'Local pendente'}
                                </span>
                                <span className="font-semibold text-[#111827] dark:text-[#F8FAFC] tabular-nums shrink-0">
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

          <RequiredDocumentsSection
            category="contratado"
            sectionTitle="3. Documentos necessários para anexo"
            sex={form.sexo ?? ''}
            documents={form.documentosAnexos ?? {}}
            missingKeys={missingDocKeys}
            missingSex={sexMissingError}
            onChangeDocuments={(next) => {
              setFormError('');
              setMissingDocKeys((prev) =>
                prev.filter((key) => !isValidDocumentAttachment(next[key]))
              );
              setForm((prev) => ({ ...prev, documentosAnexos: next }));
            }}
          />

          {/* 4. Categorias de interesse para notificações de vagas */}
          <section
            aria-labelledby="worker-notifications-categories-title"
            data-testid="worker-notification-categories-section"
            className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl p-5 sm:p-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-[#E5E7EB] dark:border-[#1E293B]">
              <div>
                <div className="flex items-center gap-2">
                  <BellRing className="w-5 h-5 text-[#C93B1E] dark:text-[#F06449] shrink-0" aria-hidden="true" />
                  <h2
                    id="worker-notifications-categories-title"
                    className="font-display text-xl font-bold text-[#111827] dark:text-[#F8FAFC]"
                  >
                    4. Preferências de notificações de vagas
                  </h2>
                </div>
                <p className="text-sm text-[#4B5563] dark:text-[#94A3B8] mt-1 leading-relaxed">
                  Selecione as funções da construção civil sobre as quais deseja ser avisado quando surgirem novas oportunidades em Rondonópolis.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  data-testid="worker-notif-categories-count"
                  className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F3F4F6] dark:bg-[#1E293B] text-[#374151] dark:text-[#CBD5E1]"
                >
                  {(form.categoriasNotificacao ?? []).length === 0
                    ? 'Todas ativas (sem filtro)'
                    : `${form.categoriasNotificacao?.length} selecionada${
                        form.categoriasNotificacao?.length === 1 ? '' : 's'
                      }`}
                </span>
              </div>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F9FAFB] dark:bg-[#0F172A] p-3.5 rounded-xl border border-[#E5E7EB] dark:border-[#1E293B]">
              <p className="text-xs text-[#4B5563] dark:text-[#94A3B8] leading-relaxed">
                {(form.categoriasNotificacao ?? []).length === 0
                  ? 'Nenhuma categoria restrita: você receberá alertas de todas as vagas abertas na sua região.'
                  : 'Filtro ativo: apenas vagas nas categorias marcadas abaixo dispararão alertas para você.'}
              </p>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      categoriasNotificacao: [...CONSTRUCTION_ROLES],
                    }))
                  }
                  data-testid="worker-notif-select-all"
                  className="min-h-[36px] px-3 py-1.5 rounded-lg border border-[#D1D5DB] dark:border-[#334155] text-xs font-semibold text-[#111827] dark:text-[#F8FAFC] hover:bg-white dark:hover:bg-[#1E293B] cursor-pointer"
                >
                  Selecionar todas
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      categoriasNotificacao: [],
                    }))
                  }
                  data-testid="worker-notif-clear-all"
                  className="min-h-[36px] px-3 py-1.5 rounded-lg border border-[#FECACA] dark:border-[#7F1D1D] text-xs font-semibold text-[#B91C1C] dark:text-[#FCA5A5] hover:bg-[#FEF2F2] dark:hover:bg-[#7F1D1D]/30 cursor-pointer"
                >
                  Limpar (todas ativas)
                </button>
              </div>
            </div>

            <div
              role="group"
              aria-label="Categorias de construção para receber notificações"
              className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5"
            >
              {CONSTRUCTION_ROLES.map((roleName) => {
                const isSelected = (form.categoriasNotificacao ?? []).includes(roleName);
                const roleSlug = roleName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                return (
                  <button
                    key={roleName}
                    type="button"
                    role="checkbox"
                    aria-checked={isSelected}
                    data-testid={`worker-notif-category-${roleSlug}`}
                    onClick={() => {
                      setForm((prev) => {
                        const current = prev.categoriasNotificacao ?? [];
                        const next = current.includes(roleName)
                          ? current.filter((r) => r !== roleName)
                          : [...current, roleName];
                        return { ...prev, categoriasNotificacao: next };
                      });
                    }}
                    className={`min-h-[46px] p-3 rounded-xl border text-left flex items-center justify-between gap-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#C93B1E] dark:border-[#F06449] bg-[#C93B1E]/10 dark:bg-[#C93B1E]/20 text-[#111827] dark:text-[#F8FAFC] font-semibold'
                        : 'border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-[#374151] dark:text-[#CBD5E1] hover:border-[#9CA3AF] dark:hover:border-[#64748B]'
                    }`}
                  >
                    <span className="text-xs sm:text-sm truncate">{roleName}</span>
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                        isSelected
                          ? 'bg-[#C93B1E] border-[#C93B1E] text-white'
                          : 'border-[#D1D5DB] dark:border-[#475569] bg-white dark:bg-[#1E293B]'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" aria-hidden="true" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {formError && (
            <p role="alert" data-testid="worker-form-error" className="text-sm font-semibold text-[#B91C1C] dark:text-[#F87171]">
              {formError}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-[#4B5563] dark:text-[#94A3B8]">
              Ao salvar, o BrickJobs gera automaticamente seu perfil para as construtoras.
            </p>
            <button
              type="submit"
              data-testid="save-worker-profile"
              className="w-full sm:w-auto min-h-[48px] px-7 py-3 rounded-xl bg-[#C93B1E] hover:bg-[#B23319] text-white text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer"
            >
              Salvar e gerar perfil
            </button>
          </div>
          </motion.form>
        )}

        {/* TAB 3: Perfil Gerado automaticamente */}
        {activeTab === 'perfil' && (
          <motion.div
            key="worker-tab-perfil"
            variants={TAB_TRANSITION_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={TAB_TRANSITION_CONFIG}
            className="mt-6 space-y-6"
          >
          {!isWorkerRegistered ? (
            <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl p-8 text-center max-w-2xl mx-auto">
              <HardHat className="w-9 h-9 text-[#C93B1E] dark:text-[#F06449] mx-auto mb-3" aria-hidden="true" />
              <h2 className="font-display text-xl font-bold text-[#111827] dark:text-[#F8FAFC]">
                Seu perfil ainda não foi gerado
              </h2>
              <p className="text-sm text-[#4B5563] dark:text-[#94A3B8] mt-1.5">
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
              <section className="lg:col-span-8 bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl overflow-hidden">
                {/* Profile Header */}
                <div className="p-5 sm:p-6 border-b border-[#E5E7EB] dark:border-[#1E293B]">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                      <ProfileAvatar
                        name={workerProfile.nomeCompleto}
                        photoUrl={workerProfile.fotoPerfilUrl}
                        entityType="worker"
                        size="xl"
                        testId="worker-profile-avatar"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#C93B1E] dark:text-[#F06449]">
                          Perfil Profissional Gerado · {workerProfile.disponibilidade}
                        </p>
                        <h2 className="font-display text-2xl font-bold text-[#111827] dark:text-[#F8FAFC] mt-1 break-words">
                          {workerProfile.nomeCompleto}
                        </h2>
                        <p className="text-base font-medium text-[#374151] dark:text-[#CBD5E1]">
                          {workerProfile.funcaoPrincipal}
                        </p>
                        <div className="mt-2 text-xs sm:text-sm text-[#4B5563] dark:text-[#94A3B8] flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-y-0.5 sm:gap-x-3">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#C93B1E] dark:text-[#F06449] shrink-0" aria-hidden="true" />
                            Bairro {workerProfile.bairro}, {workerProfile.cidade}
                          </span>
                          <span className="hidden sm:inline" aria-hidden="true">·</span>
                          <span>Região de interesse: {workerProfile.regiaoInteresse}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                      <button
                        type="button"
                        onClick={handleExportResumePdf}
                        disabled={isExportingPdf}
                        data-testid="export-resume-pdf-button"
                        className="min-h-[44px] px-4 py-2 rounded-xl bg-[#C93B1E] hover:bg-[#B23319] disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap active:scale-[0.98] transition-all cursor-pointer"
                      >
                        <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>
                          {isExportingPdf ? 'Gerando PDF...' : 'Exportar Currículo em PDF'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onChangeTab('cadastro')}
                        className="min-h-[44px] px-4 py-2 rounded-xl border border-[#D1D5DB] dark:border-[#334155] hover:bg-[#F9FAFB] dark:hover:bg-[#1E293B] text-sm font-semibold text-[#111827] dark:text-[#F8FAFC] whitespace-nowrap cursor-pointer"
                      >
                        Editar cadastro
                      </button>
                    </div>
                  </div>

                  {pdfExportFeedback && (
                    <p
                      role="status"
                      data-testid="export-resume-pdf-feedback"
                      className="mt-3 text-xs sm:text-sm font-medium text-[#047857] dark:text-[#34D399] inline-flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>{pdfExportFeedback}</span>
                    </p>
                  )}
                </div>

                {/* General Data & Contact */}
                <div className="p-5 sm:p-6 border-b border-[#E5E7EB] dark:border-[#1E293B] grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#F9FAFB] dark:bg-[#1E293B]">
                  <div>
                    <p className="text-xs font-semibold text-[#6B7280] dark:text-[#94A3B8]">Telefone / WhatsApp</p>
                    <p className="text-sm font-semibold text-[#111827] dark:text-[#F8FAFC] mt-0.5">
                      {workerProfile.telefone}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#6B7280] dark:text-[#94A3B8]">E-mail</p>
                    <p className="text-sm font-medium text-[#111827] dark:text-[#F8FAFC] mt-0.5">
                      {workerProfile.email || 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#6B7280] dark:text-[#94A3B8]">Sexo</p>
                    <p className="text-sm font-medium text-[#111827] dark:text-[#F8FAFC] mt-0.5">
                      {formatRegistrantSexLabel(workerProfile.sexo)}
                    </p>
                  </div>
                  {workerProfile.resumoProfissional && (
                    <div className="sm:col-span-3">
                      <p className="text-xs font-semibold text-[#6B7280] dark:text-[#94A3B8]">Observações</p>
                      <p className="text-sm text-[#374151] dark:text-[#CBD5E1] mt-0.5">
                        {workerProfile.resumoProfissional}
                      </p>
                    </div>
                  )}
                </div>

                {/* Attached Required Documents Summary */}
                <div
                  className="p-5 sm:p-6 border-b border-[#E5E7EB] dark:border-[#1E293B]"
                  data-testid="worker-profile-documents-summary"
                >
                  <h3 className="font-display text-base font-bold text-[#111827] dark:text-[#F8FAFC]">
                    Documentos obrigatórios anexados
                  </h3>
                  <ul className="mt-3 divide-y divide-[#F3F4F6] dark:divide-[#1E293B]">
                    {getResolvedDocumentRequirements(
                      workerProfile.sexo,
                      workerProfile.documentosAnexos
                    )
                      .filter((req) => req.required || req.attachment)
                      .map((req) => (
                        <li
                          key={req.key}
                          className="py-2.5 first:pt-0 last:pb-0 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm"
                        >
                          <div className="min-w-0">
                            <span className="font-semibold text-[#111827] dark:text-[#F8FAFC]">
                              {req.label}
                            </span>
                            {req.attachment ? (
                              <span className="block text-xs text-[#047857] dark:text-[#34D399]">
                                Anexado: {req.attachment.fileName} (
                                {formatFileSizePtBr(req.attachment.fileSizeBytes)})
                              </span>
                            ) : (
                              <span className="block text-xs text-[#6B7280] dark:text-[#94A3B8]">
                                Pendente de anexo
                              </span>
                            )}
                          </div>
                          {req.attachment && (
                            <a
                              href={req.attachment.dataUrl}
                              download={req.attachment.fileName}
                              className="min-h-[36px] px-3 py-1.5 rounded-lg border border-[#D1D5DB] dark:border-[#334155] text-xs font-semibold text-[#111827] dark:text-[#F8FAFC] hover:bg-[#F9FAFB] dark:hover:bg-[#1E293B] inline-flex items-center"
                            >
                              Baixar
                            </a>
                          )}
                        </li>
                      ))}
                  </ul>
                </div>

                {/* Notification Preferences Summary */}
                <div
                  className="p-5 sm:p-6 border-b border-[#E5E7EB] dark:border-[#1E293B]"
                  data-testid="worker-profile-notification-preferences-summary"
                >
                  <div className="flex items-center gap-2">
                    <BellRing className="w-4 h-4 text-[#C93B1E] dark:text-[#F06449]" aria-hidden="true" />
                    <h3 className="font-display text-base font-bold text-[#111827] dark:text-[#F8FAFC]">
                      Alertas de vagas configurados
                    </h3>
                  </div>
                  {workerProfile.categoriasNotificacao &&
                  workerProfile.categoriasNotificacao.length > 0 ? (
                    <div className="mt-3">
                      <p className="text-xs text-[#4B5563] dark:text-[#94A3B8] mb-2">
                        Recebendo notificações filtradas para {workerProfile.categoriasNotificacao.length}{' '}
                        {workerProfile.categoriasNotificacao.length === 1
                          ? 'categoria selecionada'
                          : 'categorias selecionadas'}:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {workerProfile.categoriasNotificacao.map((cat) => (
                          <span
                            key={cat}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#F3F4F6] dark:bg-[#1E293B] text-[#111827] dark:text-[#F8FAFC] border border-[#E5E7EB] dark:border-[#334155]"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs sm:text-sm text-[#4B5563] dark:text-[#94A3B8]">
                      Recebendo notificações para todas as categorias na região ({workerProfile.regiaoInteresse}).
                    </p>
                  )}
                </div>

                {/* Resume Mode Output: PDF or Generated Experiences */}
                <div className="p-5 sm:p-6">
                  {workerProfile.tipoHistorico === 'pdf' && workerProfile.pdfCurriculo ? (
                    <div>
                      <h3 className="font-display text-lg font-bold text-[#111827] dark:text-[#F8FAFC]">
                        Currículo anexado em PDF
                      </h3>
                      <div className="mt-3 p-4 rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#1E293B] flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="w-6 h-6 text-[#C93B1E] dark:text-[#F06449] shrink-0" aria-hidden="true" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#111827] dark:text-[#F8FAFC] truncate">
                              {workerProfile.pdfCurriculo.fileName}
                            </p>
                            <p className="text-xs text-[#4B5563] dark:text-[#94A3B8]">
                              {formatFileSizePtBr(workerProfile.pdfCurriculo.fileSizeBytes)} · Enviado em{' '}
                              {workerProfile.pdfCurriculo.uploadedAt}
                            </p>
                          </div>
                        </div>

                        <a
                          href={workerProfile.pdfCurriculo.dataUrl}
                          download={workerProfile.pdfCurriculo.fileName}
                          className="min-h-[44px] px-4 py-2 rounded-xl bg-[#111827] hover:bg-[#1F2937] dark:bg-[#F8FAFC] dark:hover:bg-[#E2E8F0] text-white dark:text-[#0F172A] text-xs sm:text-sm font-semibold inline-flex items-center"
                        >
                          Baixar currículo PDF
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="font-display text-lg font-bold text-[#111827] dark:text-[#F8FAFC]">
                          Experiências profissionais ({workerProfile.experiencias.length})
                        </h3>
                        <p className="text-sm font-bold text-[#C93B1E] dark:text-[#F06449] tabular-nums">
                          Tempo total de atuação: {formatDurationPtBr(profileTotalMonths)}
                        </p>
                      </div>

                      <div className="mt-4 divide-y divide-[#E5E7EB] dark:divide-[#1E293B]">
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
                                  <h4 className="text-base font-bold text-[#111827] dark:text-[#F8FAFC]">
                                    {exp.funcao}
                                  </h4>
                                  <p className="text-sm text-[#4B5563] dark:text-[#94A3B8] break-words">
                                    {exp.empresaLocal}
                                  </p>
                                </div>
                                <div className="shrink-0 text-right">
                                  <p className="text-sm font-bold text-[#111827] dark:text-[#F8FAFC] tabular-nums whitespace-nowrap">
                                    {dur.valid ? formatDurationPtBr(dur.months) : '—'}
                                  </p>
                                  <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] font-mono whitespace-nowrap">
                                    {formatMonthYearPtBr(exp.dataInicio)} –{' '}
                                    {exp.atual ? 'Atual' : formatMonthYearPtBr(exp.dataFim)}
                                  </p>
                                </div>
                              </div>
                              {exp.atividades && (
                                <p className="mt-2 text-sm text-[#374151] dark:text-[#CBD5E1]">{exp.atividades}</p>
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
                <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl overflow-hidden">
                  <div className="h-44 bg-[#1F2937] relative">
                    {!imgFailed ? (
                      <img
                        src={workerCraftImg}
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
                    <p className="text-sm font-semibold text-[#111827] dark:text-[#F8FAFC]">
                      Candidaturas enviadas ({applications.length})
                    </p>
                    {applications.length === 0 ? (
                      <p className="text-xs text-[#4B5563] dark:text-[#94A3B8] mt-1">
                        Você ainda não se candidatou a nenhuma vaga. Veja as oportunidades na sua região.
                      </p>
                    ) : (
                      <ul className="mt-2.5 space-y-2.5">
                        {applications.map((app) => {
                          const job = jobs.find((j) => j.id === app.jobId);
                          if (!job) return null;
                          const appRating = getRatingForApplication(companyRatings, app.id);
                          return (
                            <li
                              key={app.id}
                              className="text-xs text-[#374151] dark:text-[#CBD5E1] border-t border-[#F3F4F6] dark:border-[#1E293B] pt-2.5 space-y-2"
                            >
                              <div>
                                <span className="font-semibold text-[#111827] dark:text-[#F8FAFC]">{job.funcao}</span> ·{' '}
                                {job.companyName} ({job.bairro}) ·{' '}
                                <span
                                  className={
                                    app.status === 'aceita' || app.status === 'concluida'
                                      ? 'font-semibold text-[#047857] dark:text-[#34D399]'
                                      : 'font-medium text-[#6B7280] dark:text-[#94A3B8]'
                                  }
                                >
                                  {app.status === 'concluida'
                                    ? 'Concluída'
                                    : app.status === 'aceita'
                                      ? 'Aceita'
                                      : 'Aguardando'}
                                </span>
                              </div>

                              {(app.status === 'aceita' || app.status === 'concluida') && (
                                <div className="flex flex-wrap items-center gap-2">
                                  {canCompleteWork(app) && (
                                    <button
                                      type="button"
                                      onClick={() => onCompleteApplication(app.id)}
                                      className="min-h-[40px] px-3 py-1.5 rounded-lg border border-[#D1D5DB] dark:border-[#334155] hover:bg-[#F9FAFB] dark:hover:bg-[#1E293B] text-xs font-semibold text-[#111827] dark:text-[#F8FAFC] inline-flex items-center gap-1 cursor-pointer"
                                    >
                                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                                      <span>Concluir trabalho</span>
                                    </button>
                                  )}
                                  {canRateCompanyForApplication(app, companyRatings) && (
                                    <button
                                      type="button"
                                      onClick={() => onOpenRatingModal(app.id)}
                                      className="min-h-[40px] px-3 py-1.5 rounded-lg bg-[#C93B1E] hover:bg-[#B23319] text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                                    >
                                      <Star className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                                      <span>Avaliar empresa</span>
                                    </button>
                                  )}
                                  {appRating && (
                                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 inline-flex items-center gap-1 tabular-nums">
                                      <Star className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                                      <span>Avaliado: {appRating.stars}/5</span>
                                    </span>
                                  )}
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}

                    <button
                      type="button"
                      onClick={() => onChangeTab('vagas')}
                      className="mt-4 w-full min-h-[44px] px-4 py-2 rounded-xl bg-[#111827] hover:bg-[#1F2937] dark:bg-[#F8FAFC] dark:hover:bg-[#E2E8F0] text-white dark:text-[#0F172A] text-xs sm:text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer"
                    >
                      Explorar vagas na região
                    </button>
                  </div>
                </div>
              </aside>
            </div>
          )}
          </motion.div>
        )}

        {/* TAB 4: Rescisão CLT e Avisos de Chuva */}
        {activeTab === 'utilidades' && (
          <motion.div
            key="worker-tab-utilidades"
            variants={TAB_TRANSITION_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={TAB_TRANSITION_CONFIG}
            className="mt-6 space-y-6"
          >
            <SeveranceCalculatorPanel />

            <RainAlertsPanel
              variant="full"
              siteRegion={selectedRegion}
              onChangeSiteRegion={onChangeRegion}
              gpsCoordinates={
                proximityFilter?.active
                  ? { lat: proximityFilter.userLat, lng: proximityFilter.userLng }
                  : null
              }
            />
          </motion.div>
        )}

        {/* TAB: Dicas de Segurança no Canteiro */}
        {activeTab === 'seguranca' && (
          <motion.div
            key="worker-tab-seguranca"
            variants={TAB_TRANSITION_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={TAB_TRANSITION_CONFIG}
            className="mt-6 space-y-6"
          >
            <SafetyWeeklyRemindersCard
              workerRole={workerProfile.funcaoPrincipal || 'Operário da Construção Civil'}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="lg:col-span-2">
                <SafetyTipsCard
                  workerProfile={workerProfile}
                  onQuizComplete={handleSafetyQuizComplete}
                />
              </div>
              <div className="lg:col-span-1">
                <SafetyLeaderboardCard
                  workerProfile={workerProfile}
                  selectedRegion={selectedRegion}
                  safetyStats={safetyStats}
                  lastPointsEarned={lastPointsEarned}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB: Notícias da Construção */}
        {activeTab === 'noticias' && (
          <motion.div
            key="worker-tab-noticias"
            variants={TAB_TRANSITION_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={TAB_TRANSITION_CONFIG}
            className="mt-6"
          >
            <ConstructionNewsTab
              onOpenJobFilter={(keyword) => {
                setSearchQuery(keyword);
                onChangeTab('vagas');
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
