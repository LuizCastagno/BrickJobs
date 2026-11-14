import { useEffect, useMemo, useState } from 'react';
import { Building2, ClipboardList, FileCheck, HardHat, Search, Users } from 'lucide-react';
import { CoverScreen } from './components/CoverScreen';
import { EmployerPortal, type EmployerTab } from './components/EmployerPortal';
import { MobileBottomNav, type MobileTabItem } from './components/MobileBottomNav';
import { TopNavBar, type NavTabItem } from './components/TopNavBar';
import { WorkerPortal, type WorkerTab } from './components/WorkerPortal';
import type { BrickJobsAppState } from './data/rondonopolisSeed';
import type {
  CompanyProfile,
  JobPosting,
  UserRole,
  WorkerProfile,
} from './types/brickjobs';
import { loadBrickJobsState, saveBrickJobsState } from './utils/storage';

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
  const [storageWarning, setStorageWarning] = useState<string>('');

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
    setState((prev) => ({
      ...prev,
      jobs: [newJob, ...prev.jobs],
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
    setState((prev) => ({
      ...prev,
      jobs: prev.jobs.map((j) =>
        j.id === jobId
          ? { ...j, status: j.status === 'aberta' ? 'encerrada' : 'aberta' }
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
          },
          ...prev.applications,
        ],
      };
    });
  };

  const handleChangeRegion = (region: string) => {
    setState((prev) => ({
      ...prev,
      selectedRegion: region,
    }));
  };

  if (screen === 'cover') {
    return (
      <CoverScreen
        onSelectRole={(role) => setScreen(role)}
        openVacanciesCount={openVacanciesCount}
        companiesCount={companiesCount}
        workersCount={allWorkers.length}
      />
    );
  }

  const employerDesktopTabs: NavTabItem[] = [
    { id: 'vagas', label: 'Vagas e Busca' },
    { id: 'cadastro', label: 'Dados da Empresa' },
    { id: 'profissionais', label: 'Profissionais' },
  ];

  const employerMobileTabs: MobileTabItem[] = [
    { id: 'vagas', label: 'Vagas', icon: ClipboardList },
    { id: 'cadastro', label: 'Empresa', icon: Building2 },
    { id: 'profissionais', label: 'Profissionais', icon: Users },
  ];

  const workerDesktopTabs: NavTabItem[] = [
    { id: 'vagas', label: 'Vagas Disponíveis' },
    { id: 'cadastro', label: 'Meu Cadastro' },
    { id: 'perfil', label: 'Perfil Gerado' },
  ];

  const workerMobileTabs: MobileTabItem[] = [
    { id: 'vagas', label: 'Vagas', icon: Search },
    { id: 'cadastro', label: 'Cadastro', icon: HardHat },
    { id: 'perfil', label: 'Perfil', icon: FileCheck },
  ];

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-[#111827] flex flex-col">
      <TopNavBar
        role={screen}
        tabs={screen === 'contratante' ? employerDesktopTabs : workerDesktopTabs}
        activeTab={screen === 'contratante' ? employerTab : workerTab}
        onSelectTab={(tabId) => {
          if (screen === 'contratante') setEmployerTab(tabId as EmployerTab);
          else setWorkerTab(tabId as WorkerTab);
        }}
        onBackToCover={() => setScreen('cover')}
        onSwitchRole={() =>
          setScreen(screen === 'contratante' ? 'contratado' : 'contratante')
        }
      />

      {storageWarning && (
        <div
          role="alert"
          className="max-w-6xl mx-auto px-4 sm:px-6 pt-3 w-full"
        >
          <p className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs font-medium text-[#B91C1C]">
            {storageWarning}
          </p>
        </div>
      )}

      <main className="flex-1">
        {screen === 'contratante' ? (
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
            onApplyJob={handleApplyJob}
            selectedRegion={state.selectedRegion}
            onChangeRegion={handleChangeRegion}
          />
        )}
      </main>

      <MobileBottomNav
        items={screen === 'contratante' ? employerMobileTabs : workerMobileTabs}
        activeTab={screen === 'contratante' ? employerTab : workerTab}
        onSelectTab={(tabId) => {
          if (screen === 'contratante') setEmployerTab(tabId as EmployerTab);
          else setWorkerTab(tabId as WorkerTab);
        }}
      />
    </div>
  );
}
