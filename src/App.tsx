import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { BarChart3, Building2, Calculator, ClipboardList, FileCheck, HardHat, Search, Users } from 'lucide-react';
import { AppLoadingOverlay } from './components/AppLoadingOverlay';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { CoverScreen } from './components/CoverScreen';
import { ApplicationChatModal } from './components/ApplicationChatModal';
import { CompanyRatingModal } from './components/CompanyRatingModal';
import { EmployerPortal, type EmployerTab } from './components/EmployerPortal';
import { GuidedTourModal } from './components/GuidedTourModal';
import { LgpdPrivacyModal } from './components/LgpdPrivacyModal';
import { MobileBottomNav, type MobileTabItem } from './components/MobileBottomNav';
import { TopNavBar, type NavTabItem } from './components/TopNavBar';
import { UserSettingsMenu } from './components/UserSettingsMenu';
import { WorkerPortal, type WorkerTab } from './components/WorkerPortal';
import { usePWAInstall } from './hooks/usePWAInstall';
import type { BrickJobsAppState } from './data/rondonopolisSeed';
import type {
  CompanyProfile,
  JobPosting,
  UserRole,
  WorkerProfile,
} from './types/brickjobs';
import {
  createAcceptedApplicationNotification,
  createNewJobNotification,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  shouldNotifyWorkerForNewJob,
} from './utils/notifications';
import { loadBrickJobsState, saveBrickJobsState } from './utils/storage';
import {
  applyThemeToDocument,
  loadThemePreference,
  saveThemePreference,
  type ThemeMode,
} from './utils/theme';
import type { ProximityFilterState } from './utils/geolocation';
import {
  getOnboardingStepsForRole,
  loadOnboardingSeenState,
  markRoleOnboardingSeen,
  type OnboardingSeenMap,
} from './utils/onboarding';
import {
  canOpenApplicationChat,
  createChatMessage,
  markConversationAsRead,
} from './utils/chat';
import {
  dispatchNativeBrowserNotification,
  formatNativeNotificationPayload,
  getBrowserNotificationPermission,
  loadNativePushPreference,
  registerNotificationServiceWorker,
  requestNativeNotificationPermission,
  saveNativePushPreference,
  type NativePushPermission,
  type NativePushPreference,
} from './utils/nativeNotifications';
import { canCompleteWork, createCompanyRating } from './utils/ratings';
import {
  cancelWorkReminder,
  collectDueReminders,
  createWorkReminderNotification,
  createWorkScheduleReminder,
  getActiveReminderForApplication,
  getNextScheduledReminderDelayMs,
  markRemindersAsNotified,
  upsertApplicationReminder,
} from './utils/workReminders';
import {
  acceptAllCookiesConsent,
  loadLgpdConsent,
  rejectOptionalCookiesConsent,
  resetAllLgpdData,
  saveCookiePreferences,
  saveLgpdConsent,
  setSensitiveDataConsent,
  shouldShowCookieBanner,
  type LgpdConsentState,
  type LgpdModalTab,
} from './utils/lgpdConsent';
import {
  INITIAL_SPLASH_DURATION_MS,
  PAGE_TRANSITION_CONFIG,
  PAGE_TRANSITION_VARIANTS,
  ROUTE_TRANSITION_DURATION_MS,
} from './utils/motionPresets';

type AppScreen = 'cover' | UserRole;

function getInitialScreen(): AppScreen {
  if (typeof window === 'undefined') return 'cover';
  const params = new URLSearchParams(window.location.search);
  const autostart = params.get('autostart');
  if (autostart === 'contratante') return 'contratante';
  if (autostart === 'contratado' || autostart === '1') return 'contratado';
  return 'cover';
}

export default function App() {
  const [state, setState] = useState<BrickJobsAppState>(() => loadBrickJobsState());
  const [screen, setScreen] = useState<AppScreen>(() => getInitialScreen());
  const [employerTab, setEmployerTab] = useState<EmployerTab>('vagas');
  const [workerTab, setWorkerTab] = useState<WorkerTab>('vagas');
  const [coverSearchQuery, setCoverSearchQuery] = useState<string>('');
  const [coverProximityFilter, setCoverProximityFilter] =
    useState<ProximityFilterState | null>(null);
  const [storageWarning, setStorageWarning] = useState<string>('');
  const [theme, setTheme] = useState<ThemeMode>(() => loadThemePreference());
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [onboardingSeen, setOnboardingSeen] = useState<OnboardingSeenMap>(() =>
    loadOnboardingSeenState()
  );
  const [isTourOpen, setIsTourOpen] = useState<boolean>(() => {
    const initial = getInitialScreen();
    if (initial === 'cover') return false;
    const seen = loadOnboardingSeenState();
    return !seen[initial];
  });
  const [tourStepIndex, setTourStepIndex] = useState<number>(0);
  const [activeChatApplicationId, setActiveChatApplicationId] = useState<string | null>(
    null
  );
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [activeRatingApplicationId, setActiveRatingApplicationId] = useState<string | null>(
    null
  );
  const [pushPermission, setPushPermission] = useState<NativePushPermission>(() =>
    getBrowserNotificationPermission()
  );
  const [pushPreference, setPushPreference] = useState<NativePushPreference>(() =>
    loadNativePushPreference()
  );
  const [isRequestingPush, setIsRequestingPush] = useState<boolean>(false);
  const [pushFeedback, setPushFeedback] = useState<string>('');
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [routeTransitionTarget, setRouteTransitionTarget] =
    useState<AppScreen | null>(null);
  const routeTransitionTimerRef = useRef<number | null>(null);
  const [lgpdConsent, setLgpdConsent] = useState<LgpdConsentState>(() =>
    loadLgpdConsent()
  );
  const [isLgpdModalOpen, setIsLgpdModalOpen] = useState<boolean>(false);
  const [lgpdModalTab, setLgpdModalTab] = useState<LgpdModalTab>('cookies');
  const pwaInstall = usePWAInstall();

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsInitialLoading(false);
      return;
    }
    const timerId = window.setTimeout(() => {
      setIsInitialLoading(false);
    }, INITIAL_SPLASH_DURATION_MS);
    return () => window.clearTimeout(timerId);
  }, []);

  useEffect(() => {
    return () => {
      if (routeTransitionTimerRef.current !== null && typeof window !== 'undefined') {
        window.clearTimeout(routeTransitionTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    applyThemeToDocument(theme);
    saveThemePreference(theme);
  }, [theme]);

  useEffect(() => {
    saveNativePushPreference(pushPreference);
  }, [pushPreference]);

  useEffect(() => {
    if (pushPermission === 'granted') {
      void registerNotificationServiceWorker();
    }
  }, [pushPermission]);

  useEffect(() => {
    const res = saveBrickJobsState(state);
    if (!res.ok && res.error) {
      setStorageWarning(res.error);
    } else {
      setStorageWarning('');
    }
  }, [state]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [screen, employerTab, workerTab]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleCrossTabStorage = (e: StorageEvent) => {
      if (e.key !== 'brickjobs_rondonopolis_state_v1' || !e.newValue) return;
      const nextState = loadBrickJobsState();
      setState((prev) => {
        const prevNotifIds = new Set(prev.notifications.map((n) => n.id));
        const incomingNotifs = nextState.notifications.filter(
          (n) => !prevNotifIds.has(n.id)
        );
        for (const notif of incomingNotifs) {
          void dispatchNativeBrowserNotification(
            formatNativeNotificationPayload(notif),
            pushPreference
          );
        }

        const prevChatIds = new Set(prev.chatMessages.map((m) => m.id));
        const incomingChats = nextState.chatMessages.filter(
          (m) => !prevChatIds.has(m.id)
        );
        for (const msg of incomingChats) {
          if (screen !== 'cover' && msg.senderRole !== screen) {
            void dispatchNativeBrowserNotification(
              {
                title: `BrickJobs · Nova mensagem de ${msg.senderName}`,
                body: msg.text,
                tag: `brickjobs-chat-${msg.applicationId}`,
                url: `/?autostart=${screen}`,
              },
              pushPreference
            );
          }
        }
        return nextState;
      });
    };
    window.addEventListener('storage', handleCrossTabStorage);
    return () => window.removeEventListener('storage', handleCrossTabStorage);
  }, [pushPreference, screen]);

  useEffect(() => {
    const processDueReminders = () => {
      const now = new Date();
      const due = collectDueReminders(state.workReminders, now);
      if (due.length === 0) return;

      const dueIds = due.map((item) => item.id);
      const createdNotifications = due.map((item) =>
        createWorkReminderNotification(item, now)
      );

      for (const notif of createdNotifications) {
        void dispatchNativeBrowserNotification(
          formatNativeNotificationPayload(notif),
          pushPreference
        );
      }

      setState((prev) => {
        const existingNotifIds = new Set(prev.notifications.map((n) => n.id));
        const freshNotifs = createdNotifications.filter(
          (n) => !existingNotifIds.has(n.id)
        );
        return {
          ...prev,
          workReminders: markRemindersAsNotified(prev.workReminders, dueIds, now),
          notifications:
            freshNotifs.length > 0
              ? [...freshNotifs, ...prev.notifications]
              : prev.notifications,
        };
      });
    };

    processDueReminders();

    if (typeof window === 'undefined') return;

    const nextDelay = getNextScheduledReminderDelayMs(state.workReminders);
    const timeoutId =
      nextDelay !== null
        ? window.setTimeout(
            processDueReminders,
            Math.min(nextDelay + 150, 2147483647)
          )
        : null;
    const intervalId = window.setInterval(processDueReminders, 5000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        processDueReminders();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [state.workReminders, pushPreference]);

  const openVacanciesCount = useMemo(
    () =>
      state.jobs
        .filter((j) => j.status === 'aberta')
        .reduce((acc, j) => acc + j.quantidadeVagas, 0),
    [state.jobs]
  );

  const companiesCount = useMemo(() => {
    const names = new Set(state.jobs.map((j) => j.companyName));
    if (state.companyProfile.nomeFantasia.trim()) {
      names.add(state.companyProfile.nomeFantasia.trim());
    }
    return names.size;
  }, [state.jobs, state.companyProfile.nomeFantasia]);

  const allWorkers = useMemo(() => {
    const list = [...state.seedWorkers];
    if (state.workerProfile.nomeCompleto.trim()) {
      return [state.workerProfile, ...list];
    }
    return list;
  }, [state.seedWorkers, state.workerProfile]);

  const handleSaveCompanyProfile = (profile: CompanyProfile) => {
    setState((prev) => ({
      ...prev,
      companyProfile: profile,
      jobs: prev.jobs.map((j) =>
        j.companyId === profile.id
          ? {
              ...j,
              companyName: profile.nomeFantasia,
              companyPhotoUrl: profile.fotoPerfilUrl ?? '',
              telefoneContato: profile.telefone,
            }
          : j
      ),
    }));
  };

  const handleCreateJob = (
    jobInput: Omit<JobPosting, 'id' | 'createdAt' | 'status'>
  ) => {
    const newJob: JobPosting = {
      ...jobInput,
      id: `job-${Date.now()}`,
      status: 'aberta',
      createdAt: new Date().toISOString().slice(0, 10),
    };
    const targetRegion =
      state.workerProfile.nomeCompleto.trim() && state.workerProfile.regiaoInteresse
        ? state.workerProfile.regiaoInteresse
        : state.selectedRegion;
    const shouldNotify = shouldNotifyWorkerForNewJob(
      newJob,
      targetRegion,
      state.workerProfile.categoriasNotificacao
    );
    const createdNotif = shouldNotify ? createNewJobNotification(newJob) : null;

    if (createdNotif) {
      void dispatchNativeBrowserNotification(
        formatNativeNotificationPayload(createdNotif),
        pushPreference
      );
    }

    setState((prev) => ({
      ...prev,
      jobs: [newJob, ...prev.jobs],
      notifications: createdNotif
        ? [createdNotif, ...prev.notifications]
        : prev.notifications,
    }));
  };

  const handleUpdateJobVacancies = (jobId: string, delta: number) => {
    setState((prev) => ({
      ...prev,
      jobs: prev.jobs.map((j) =>
        j.id === jobId
          ? { ...j, quantidadeVagas: Math.max(1, j.quantidadeVagas + delta) }
          : j
      ),
    }));
  };

  const handleToggleJobStatus = (jobId: string) => {
    const todayIso = new Date().toISOString().slice(0, 10);
    setState((prev) => ({
      ...prev,
      jobs: prev.jobs.map((j) =>
        j.id === jobId
          ? j.status === 'aberta'
            ? { ...j, status: 'encerrada', closedAt: todayIso }
            : { ...j, status: 'aberta', closedAt: undefined }
          : j
      ),
    }));
  };

  const handleSaveWorkerProfile = (profile: WorkerProfile) => {
    setState((prev) => ({
      ...prev,
      workerProfile: profile,
    }));
  };

  const handleApplyJob = (job: JobPosting) => {
    setState((prev) => {
      if (prev.applications.some((a) => a.jobId === job.id)) {
        return prev;
      }
      return {
        ...prev,
        applications: [
          {
            id: `app-${Date.now()}`,
            jobId: job.id,
            workerId: prev.workerProfile.id,
            workerName: prev.workerProfile.nomeCompleto,
            appliedAt: new Date().toISOString().slice(0, 10),
            status: 'pendente',
          },
          ...prev.applications,
        ],
      };
    });
  };

  const handleAcceptApplication = (applicationId: string) => {
    const targetApp = state.applications.find((a) => a.id === applicationId);
    if (!targetApp || targetApp.status === 'aceita') {
      return;
    }
    const targetJob = state.jobs.find((j) => j.id === targetApp.jobId);
    const createdNotif = targetJob
      ? createAcceptedApplicationNotification(targetJob)
      : null;

    if (createdNotif) {
      void dispatchNativeBrowserNotification(
        formatNativeNotificationPayload(createdNotif),
        pushPreference
      );
    }

    setState((prev) => ({
      ...prev,
      applications: prev.applications.map((app) =>
        app.id === applicationId ? { ...app, status: 'aceita' } : app
      ),
      notifications: createdNotif
        ? [createdNotif, ...prev.notifications]
        : prev.notifications,
    }));
  };

  const handleCompleteApplication = (applicationId: string) => {
    const targetApp = state.applications.find((a) => a.id === applicationId);
    if (!canCompleteWork(targetApp)) {
      return;
    }
    const todayIso = new Date().toISOString().slice(0, 10);
    setState((prev) => ({
      ...prev,
      applications: prev.applications.map((app) =>
        app.id === applicationId
          ? {
              ...app,
              status: 'concluida',
              completedAt: app.completedAt ?? todayIso,
            }
          : app
      ),
    }));
    if (screen === 'contratado') {
      setActiveRatingApplicationId(applicationId);
    }
  };

  const handleSubmitCompanyRating = (params: {
    applicationId: string;
    stars: number;
    comment: string;
  }): { ok: boolean; error?: string } => {
    const targetApp = state.applications.find((a) => a.id === params.applicationId);
    if (!targetApp) {
      return { ok: false, error: 'Candidatura não encontrada.' };
    }
    const relatedJob = state.jobs.find((j) => j.id === targetApp.jobId);
    if (!relatedJob) {
      return { ok: false, error: 'Vaga associada não encontrada.' };
    }

    const result = createCompanyRating({
      application: targetApp,
      job: relatedJob,
      stars: params.stars,
      comment: params.comment,
      workerName: state.workerProfile.nomeCompleto || targetApp.workerName,
      existingRatings: state.companyRatings,
    });

    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    setState((prev) => ({
      ...prev,
      companyRatings: [result.rating, ...prev.companyRatings],
    }));
    return { ok: true };
  };

  const handleMarkNotificationRead = (notificationId: string) => {
    setState((prev) => ({
      ...prev,
      notifications: markNotificationAsRead(prev.notifications, notificationId),
    }));
  };

  const handleMarkAllNotificationsRead = () => {
    setState((prev) => ({
      ...prev,
      notifications: markAllNotificationsAsRead(prev.notifications),
    }));
  };

  const handleChangeRegion = (region: string) => {
    setState((prev) => ({
      ...prev,
      selectedRegion: region,
    }));
  };

  const handleRequestPushPermission = async () => {
    setIsRequestingPush(true);
    setPushFeedback('');
    try {
      const result = await requestNativeNotificationPermission();
      setPushPermission(result);
      if (result === 'granted') {
        setPushPreference({ enabled: true, dismissedBanner: false });
        setPushFeedback('Notificações push nativas ativadas com sucesso.');
        void dispatchNativeBrowserNotification(
          {
            title: 'BrickJobs · Alertas ativados',
            body: 'Você será avisado quando houver candidatura aceita ou nova vaga em Rondonópolis-MT.',
            tag: 'brickjobs-permission-granted',
            url: '/',
          },
          { enabled: true, dismissedBanner: false }
        );
      } else if (result === 'denied') {
        setPushFeedback(
          'Permissão bloqueada pelo navegador. Você pode liberar nas configurações do site.'
        );
      } else {
        setPushFeedback('Solicitação adiada. Você pode ativar quando quiser.');
      }
    } finally {
      setIsRequestingPush(false);
    }
  };

  const handleTogglePushEnabled = () => {
    setPushPreference((prev) => {
      const nextEnabled = !prev.enabled;
      setPushFeedback(
        nextEnabled
          ? 'Alertas em segundo plano reativados.'
          : 'Alertas nativos pausados neste navegador.'
      );
      return { ...prev, enabled: nextEnabled };
    });
  };

  const handleDismissPushBanner = () => {
    setPushPreference((prev) => ({ ...prev, dismissedBanner: true }));
  };

  const handleTestNativePush = async () => {
    const sent = await dispatchNativeBrowserNotification(
      {
        title: 'BrickJobs · Teste de notificação',
        body: 'Tudo pronto! Seus alertas de candidatura aceita e novas vagas funcionarão mesmo em segundo plano.',
        tag: `brickjobs-test-${Date.now()}`,
        url: '/',
      },
      pushPreference
    );
    setPushFeedback(
      sent
        ? 'Alerta de teste enviado para o navegador.'
        : 'Não foi possível disparar o alerta de teste. Verifique a permissão do navegador.'
    );
  };

  const handleOpenChat = (applicationId: string) => {
    if (screen === 'cover') return;
    const targetApp = state.applications.find((a) => a.id === applicationId);
    if (!canOpenApplicationChat(targetApp)) return;
    setActiveChatApplicationId(applicationId);
    setIsChatOpen(true);
    setState((prev) => ({
      ...prev,
      chatMessages: markConversationAsRead(
        prev.chatMessages,
        applicationId,
        screen
      ),
    }));
  };

  const handleSendChatMessage = (
    applicationId: string,
    text: string
  ): { ok: boolean; error?: string } => {
    if (screen === 'cover') {
      return { ok: false, error: 'Selecione um perfil para enviar mensagens.' };
    }
    const targetApp = state.applications.find((a) => a.id === applicationId);
    if (!targetApp) {
      return { ok: false, error: 'Candidatura não encontrada.' };
    }
    const relatedJob = state.jobs.find((j) => j.id === targetApp.jobId);
    const senderName =
      screen === 'contratante'
        ? state.companyProfile.nomeFantasia.trim() ||
          relatedJob?.companyName ||
          'Construtora'
        : state.workerProfile.nomeCompleto.trim() ||
          targetApp.workerName ||
          'Candidato';

    const result = createChatMessage({
      application: targetApp,
      senderRole: screen,
      senderName,
      text,
    });
    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    setState((prev) => ({
      ...prev,
      chatMessages: [...prev.chatMessages, result.message],
    }));
    return { ok: true };
  };

  const handleScheduleWorkStart = (params: {
    applicationId: string;
    scheduledStartInput: string;
    locationNote: string;
  }): { ok: boolean; error?: string } => {
    if (screen === 'cover') {
      return { ok: false, error: 'Selecione um perfil para agendar o início.' };
    }
    const targetApp = state.applications.find((a) => a.id === params.applicationId);
    if (!targetApp) {
      return { ok: false, error: 'Candidatura não encontrada.' };
    }
    const relatedJob = state.jobs.find((j) => j.id === targetApp.jobId);
    if (!relatedJob) {
      return { ok: false, error: 'Vaga associada não encontrada.' };
    }

    const resolvedCompanyName =
      state.companyProfile.nomeFantasia.trim() || relatedJob.companyName;

    const now = new Date();
    const reminderResult = createWorkScheduleReminder({
      application: targetApp,
      job: relatedJob,
      companyName: resolvedCompanyName,
      scheduledStartInput: params.scheduledStartInput,
      locationNote: params.locationNote,
      scheduledByRole: screen,
      now,
    });
    if (!reminderResult.ok) {
      return { ok: false, error: reminderResult.error };
    }

    const senderName =
      screen === 'contratante'
        ? resolvedCompanyName
        : state.workerProfile.nomeCompleto.trim() ||
          targetApp.workerName ||
          'Candidato';

    const chatResult = createChatMessage({
      application: targetApp,
      senderRole: screen,
      senderName,
      text: reminderResult.chatAnnouncement,
      now,
    });

    setState((prev) => ({
      ...prev,
      workReminders: upsertApplicationReminder(
        prev.workReminders,
        reminderResult.reminder
      ),
      chatMessages: chatResult.ok
        ? [...prev.chatMessages, chatResult.message]
        : prev.chatMessages,
    }));
    return { ok: true };
  };

  const handleCancelWorkReminder = (reminderId: string) => {
    setState((prev) => ({
      ...prev,
      workReminders: cancelWorkReminder(prev.workReminders, reminderId),
    }));
  };

  const activeChatApplication = useMemo(
    () =>
      activeChatApplicationId
        ? state.applications.find((a) => a.id === activeChatApplicationId) ?? null
        : null,
    [activeChatApplicationId, state.applications]
  );

  const activeChatJob = useMemo(
    () =>
      activeChatApplication
        ? state.jobs.find((j) => j.id === activeChatApplication.jobId) ?? null
        : null,
    [activeChatApplication, state.jobs]
  );

  const activeChatReminder = useMemo(
    () =>
      activeChatApplication
        ? getActiveReminderForApplication(
            state.workReminders,
            activeChatApplication.id
          )
        : null,
    [activeChatApplication, state.workReminders]
  );

  const activeRatingApplication = useMemo(
    () =>
      activeRatingApplicationId
        ? state.applications.find((a) => a.id === activeRatingApplicationId) ?? null
        : null,
    [activeRatingApplicationId, state.applications]
  );

  const activeRatingJob = useMemo(
    () =>
      activeRatingApplication
        ? state.jobs.find((j) => j.id === activeRatingApplication.jobId) ?? null
        : null,
    [activeRatingApplication, state.jobs]
  );

  const activeTourSteps = useMemo(
    () => (screen === 'cover' ? [] : getOnboardingStepsForRole(screen)),
    [screen]
  );

  const highlightedTourTabId =
    isTourOpen && activeTourSteps[tourStepIndex]
      ? activeTourSteps[tourStepIndex].tabId
      : null;

  const navigateWithTransition = (
    targetScreen: AppScreen,
    beforeSwitch?: () => void
  ) => {
    if (typeof window !== 'undefined' && routeTransitionTimerRef.current !== null) {
      window.clearTimeout(routeTransitionTimerRef.current);
    }
    setRouteTransitionTarget(targetScreen);
    beforeSwitch?.();
    setScreen(targetScreen);
    if (typeof window !== 'undefined') {
      routeTransitionTimerRef.current = window.setTimeout(() => {
        setRouteTransitionTarget(null);
        routeTransitionTimerRef.current = null;
      }, ROUTE_TRANSITION_DURATION_MS);
    } else {
      setRouteTransitionTarget(null);
    }
  };

  const enterRoleScreen = (role: UserRole) => {
    navigateWithTransition(role, () => {
      if (!onboardingSeen[role]) {
        setTourStepIndex(0);
        setIsTourOpen(true);
        if (role === 'contratante') setEmployerTab('vagas');
        else setWorkerTab('vagas');
      } else {
        setIsTourOpen(false);
      }
    });
  };

  const handleOpenLgpdModal = (tab: LgpdModalTab = 'cookies') => {
    setLgpdModalTab(tab);
    setIsLgpdModalOpen(true);
  };

  const handleAcceptAllCookies = () => {
    setLgpdConsent((prev) => {
      const next = acceptAllCookiesConsent(prev);
      saveLgpdConsent(next);
      return next;
    });
  };

  const handleRejectOptionalCookies = () => {
    setLgpdConsent((prev) => {
      const next = rejectOptionalCookiesConsent(prev);
      saveLgpdConsent(next);
      return next;
    });
  };

  const handleSaveCustomCookies = (prefs: {
    funcionais: boolean;
    analiticos: boolean;
  }) => {
    setLgpdConsent((prev) => {
      const next = saveCookiePreferences(prev, prefs);
      saveLgpdConsent(next);
      return next;
    });
  };

  const handleSetSensitiveConsent = (granted: boolean) => {
    setLgpdConsent((prev) => {
      const next = setSensitiveDataConsent(prev, granted);
      saveLgpdConsent(next);
      return next;
    });
  };

  const handleResetAllLgpd = () => {
    const next = resetAllLgpdData();
    setLgpdConsent(next);
  };

  const handleSelectTourStep = (nextIndex: number) => {
    if (screen === 'cover') return;
    const steps = getOnboardingStepsForRole(screen);
    const clamped = Math.max(0, Math.min(nextIndex, steps.length - 1));
    setTourStepIndex(clamped);
    const targetTab = steps[clamped]?.tabId;
    if (targetTab) {
      if (screen === 'contratante') setEmployerTab(targetTab as EmployerTab);
      else setWorkerTab(targetTab as WorkerTab);
    }
  };

  const handleDismissTour = () => {
    if (screen !== 'cover') {
      setOnboardingSeen((prev) => markRoleOnboardingSeen(prev, screen));
      if (screen === 'contratante') setEmployerTab('vagas');
      else setWorkerTab('vagas');
    }
    setIsTourOpen(false);
    setTourStepIndex(0);
  };

  const handleRestartTour = () => {
    if (screen === 'cover') return;
    setTourStepIndex(0);
    if (screen === 'contratante') setEmployerTab('vagas');
    else setWorkerTab('vagas');
    setIsTourOpen(true);
  };

  const employerDesktopTabs: NavTabItem[] = [
    { id: 'vagas', label: 'Vagas e Busca' },
    { id: 'estatisticas', label: 'Estatísticas' },
    { id: 'cadastro', label: 'Dados da Empresa' },
    { id: 'profissionais', label: 'Profissionais' },
  ];

  const employerMobileTabs: MobileTabItem[] = [
    { id: 'vagas', label: 'Vagas', icon: ClipboardList },
    { id: 'estatisticas', label: 'Estatísticas', icon: BarChart3 },
    { id: 'cadastro', label: 'Empresa', icon: Building2 },
    { id: 'profissionais', label: 'Profissionais', icon: Users },
  ];

  const workerDesktopTabs: NavTabItem[] = [
    { id: 'vagas', label: 'Vagas Disponíveis' },
    { id: 'cadastro', label: 'Meu Cadastro' },
    { id: 'perfil', label: 'Perfil Gerado' },
    { id: 'utilidades', label: 'Rescisão e Clima' },
  ];

  const workerMobileTabs: MobileTabItem[] = [
    { id: 'vagas', label: 'Vagas', icon: Search },
    { id: 'cadastro', label: 'Cadastro', icon: HardHat },
    { id: 'perfil', label: 'Perfil', icon: FileCheck },
    { id: 'utilidades', label: 'Clima e CLT', icon: Calculator },
  ];

  const activePortalRole: UserRole =
    screen === 'contratante' ? 'contratante' : 'contratado';

  return (
    <MotionConfig reducedMotion="user">
      <AppLoadingOverlay
        isInitialLoading={isInitialLoading}
        routeTransitionTarget={routeTransitionTarget}
        onSkipInitial={() => setIsInitialLoading(false)}
      />

      <AnimatePresence mode="wait">
        {screen === 'cover' ? (
          <motion.div
            key="screen-cover"
            variants={PAGE_TRANSITION_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={PAGE_TRANSITION_CONFIG}
          >
            <CoverScreen
              onSelectRole={(role) => {
                setCoverSearchQuery('');
                setCoverProximityFilter(null);
                enterRoleScreen(role);
              }}
              onOpenJobSearchInPortal={(query, proximity) => {
                setCoverSearchQuery(query);
                setCoverProximityFilter(proximity ?? null);
                setWorkerTab('vagas');
                enterRoleScreen('contratado');
              }}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenLgpdModal={handleOpenLgpdModal}
              jobs={state.jobs}
              openVacanciesCount={openVacanciesCount}
              companiesCount={companiesCount}
              workersCount={allWorkers.length}
            />
          </motion.div>
        ) : (
          <motion.div
            key={`screen-${activePortalRole}`}
            variants={PAGE_TRANSITION_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={PAGE_TRANSITION_CONFIG}
            className="min-h-dvh bg-[#F4F5F7] dark:bg-[#0B1120] text-[#111827] dark:text-[#F8FAFC] flex flex-col"
          >
            <TopNavBar
              role={activePortalRole}
              tabs={
                activePortalRole === 'contratante'
                  ? employerDesktopTabs
                  : workerDesktopTabs
              }
              activeTab={
                activePortalRole === 'contratante' ? employerTab : workerTab
              }
              highlightedTabId={highlightedTourTabId}
              onSelectTab={(tabId) => {
                if (activePortalRole === 'contratante') {
                  setEmployerTab(tabId as EmployerTab);
                } else {
                  setWorkerTab(tabId as WorkerTab);
                }
              }}
              onBackToCover={() => {
                navigateWithTransition('cover', () => {
                  setIsTourOpen(false);
                  setIsChatOpen(false);
                  setActiveChatApplicationId(null);
                });
              }}
              onSwitchRole={() => {
                setIsChatOpen(false);
                setActiveChatApplicationId(null);
                enterRoleScreen(
                  activePortalRole === 'contratante' ? 'contratado' : 'contratante'
                );
              }}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />

            {storageWarning && (
              <div
                role="alert"
                className="max-w-6xl mx-auto px-4 sm:px-6 pt-3 w-full"
              >
                <p className="p-3 rounded-xl bg-[#FEF2F2] dark:bg-[#7F1D1D]/30 border border-[#FECACA] dark:border-[#991B1B] text-xs font-medium text-[#B91C1C] dark:text-[#FCA5A5]">
                  {storageWarning}
                </p>
              </div>
            )}

            <main className="flex-1">
              {activePortalRole === 'contratante' ? (
                <EmployerPortal
                  activeTab={employerTab}
                  onChangeTab={setEmployerTab}
                  companyProfile={state.companyProfile}
                  onSaveCompanyProfile={handleSaveCompanyProfile}
                  jobs={state.jobs}
                  onCreateJob={handleCreateJob}
                  onUpdateJobVacancies={handleUpdateJobVacancies}
                  onToggleJobStatus={handleToggleJobStatus}
                  workers={allWorkers}
                  applications={state.applications}
                  companyRatings={state.companyRatings}
                  onAcceptApplication={handleAcceptApplication}
                  onCompleteApplication={handleCompleteApplication}
                  chatMessages={state.chatMessages}
                  onOpenChat={handleOpenChat}
                  selectedRegion={state.selectedRegion}
                  onChangeRegion={handleChangeRegion}
                />
              ) : (
                <WorkerPortal
                  activeTab={workerTab}
                  onChangeTab={setWorkerTab}
                  workerProfile={state.workerProfile}
                  onSaveWorkerProfile={handleSaveWorkerProfile}
                  jobs={state.jobs}
                  applications={state.applications}
                  companyRatings={state.companyRatings}
                  onApplyJob={handleApplyJob}
                  onCompleteApplication={handleCompleteApplication}
                  onOpenRatingModal={(appId) => setActiveRatingApplicationId(appId)}
                  chatMessages={state.chatMessages}
                  onOpenChat={handleOpenChat}
                  notifications={state.notifications}
                  onMarkNotificationRead={handleMarkNotificationRead}
                  onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
                  selectedRegion={state.selectedRegion}
                  onChangeRegion={handleChangeRegion}
                  initialSearchQuery={coverSearchQuery}
                  initialProximityFilter={coverProximityFilter}
                  pushPermission={pushPermission}
                  pushPreference={pushPreference}
                  isRequestingPush={isRequestingPush}
                  pushFeedback={pushFeedback}
                  onRequestPushPermission={handleRequestPushPermission}
                  onTogglePushEnabled={handleTogglePushEnabled}
                  onDismissPushBanner={handleDismissPushBanner}
                  onTestNativePush={handleTestNativePush}
                  workReminders={state.workReminders}
                  onCancelWorkReminder={handleCancelWorkReminder}
                />
              )}
            </main>

            <MobileBottomNav
              items={
                activePortalRole === 'contratante'
                  ? employerMobileTabs
                  : workerMobileTabs
              }
              activeTab={
                activePortalRole === 'contratante' ? employerTab : workerTab
              }
              highlightedTabId={highlightedTourTabId}
              onSelectTab={(tabId) => {
                if (activePortalRole === 'contratante') {
                  setEmployerTab(tabId as EmployerTab);
                } else {
                  setWorkerTab(tabId as WorkerTab);
                }
              }}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <CookieConsentBanner
        visible={
          !isInitialLoading &&
          !routeTransitionTarget &&
          !isLgpdModalOpen &&
          shouldShowCookieBanner(lgpdConsent)
        }
        hasMobileBottomNav={screen !== 'cover'}
        onAcceptAll={handleAcceptAllCookies}
        onAcceptEssentialOnly={handleRejectOptionalCookies}
        onOpenLgpdModal={handleOpenLgpdModal}
      />

      <LgpdPrivacyModal
        isOpen={isLgpdModalOpen}
        initialTab={lgpdModalTab}
        consent={lgpdConsent}
        onClose={() => setIsLgpdModalOpen(false)}
        onAcceptAllCookies={handleAcceptAllCookies}
        onRejectOptionalCookies={handleRejectOptionalCookies}
        onSaveCookiePreferences={handleSaveCustomCookies}
        onSetSensitiveConsent={handleSetSensitiveConsent}
        onResetAllLgpd={handleResetAllLgpd}
      />

      <UserSettingsMenu
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        onChangeTheme={setTheme}
        onRestartTour={screen !== 'cover' ? handleRestartTour : undefined}
        pushPermission={pushPermission}
        pushPreference={pushPreference}
        isRequestingPush={isRequestingPush}
        pushFeedback={pushFeedback}
        onRequestPushPermission={handleRequestPushPermission}
        onTogglePushEnabled={handleTogglePushEnabled}
        onTestNativePush={handleTestNativePush}
        lgpdConsent={lgpdConsent}
        onOpenLgpdModal={handleOpenLgpdModal}
        pwaInstall={pwaInstall}
      />

      <GuidedTourModal
        isOpen={isTourOpen && !isInitialLoading && !routeTransitionTarget}
        steps={activeTourSteps}
        currentStepIndex={tourStepIndex}
        onSelectStep={handleSelectTourStep}
        onComplete={handleDismissTour}
        onSkip={handleDismissTour}
      />

      <ApplicationChatModal
        isOpen={isChatOpen && Boolean(activeChatApplication && activeChatJob)}
        viewerRole={activePortalRole}
        application={activeChatApplication}
        job={activeChatJob}
        companyName={
          state.companyProfile.nomeFantasia.trim() ||
          activeChatJob?.companyName ||
          ''
        }
        counterpartPhotoUrl={
          activePortalRole === 'contratante'
            ? allWorkers.find((w) => w.id === activeChatApplication?.workerId)
                ?.fotoPerfilUrl
            : activeChatJob?.companyId === state.companyProfile.id
              ? state.companyProfile.fotoPerfilUrl
              : activeChatJob?.companyPhotoUrl
        }
        messages={state.chatMessages}
        activeReminder={activeChatReminder}
        onSendMessage={handleSendChatMessage}
        onScheduleWorkStart={handleScheduleWorkStart}
        onCancelReminder={handleCancelWorkReminder}
        onClose={() => setIsChatOpen(false)}
        onAfterClose={() => {
          if (!isChatOpen) setActiveChatApplicationId(null);
        }}
      />

      <CompanyRatingModal
        isOpen={Boolean(activeRatingApplication && activeRatingJob)}
        application={activeRatingApplication}
        job={activeRatingJob}
        onSubmitRating={handleSubmitCompanyRating}
        onClose={() => setActiveRatingApplicationId(null)}
      />
    </MotionConfig>
  );
}
