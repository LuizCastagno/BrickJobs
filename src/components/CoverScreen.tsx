/**
 * @file CoverScreen.tsx
 * @description Tela inicial (landing) do BrickJobs em Rondonópolis-MT com seleção de perfil
 *   (Contratante/Contratado), busca rápida por proximidade GPS e vitrine de vagas abertas.
 */
/**
 * @file CoverScreen.tsx
 * @description Tela inicial (landing) do BrickJobs em Rondonópolis-MT com seleção de perfil
 *   (Contratante/Contratado), busca rápida por proximidade GPS e vitrine de vagas abertas.
 */
import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Building2,
  HardHat,
  LocateFixed,
  MapPin,
  Search,
  Settings,
  X,
} from 'lucide-react';
import type { JobPosting, UserRole } from '../types/brickjobs';
import {
  filterJobsByTitleOrDescription,
  resolveNearestRondonopolisRegion,
} from '../utils/duration';
import {
  calculateDistanceKm,
  filterAndSortJobsByProximity,
  formatDistanceKmPtBr,
  MAX_DISTANCE_OPTIONS_KM,
  PROXIMITY_RADIUS_KM,
  reverseGeocodeCity,
  RONDONOPOLIS_CENTER,
  updateProximityRadius,
  type ProximityFilterState,
} from '../utils/geolocation';
import type { LgpdModalTab } from '../utils/lgpdConsent';
import coverHeroImg from '../assets/images/brickjobs_cover_hero_1794693694488.jpg';
import { BrickLogo } from './BrickLogo';
import { SelectWrapper } from './SelectWrapper';

interface CoverScreenProps {
  onSelectRole: (role: UserRole) => void;
  onOpenJobSearchInPortal: (
    query: string,
    proximity?: ProximityFilterState | null
  ) => void;
  onOpenSettings: () => void;
  onOpenLgpdModal?: (tab: LgpdModalTab) => void;
  jobs: JobPosting[];
  openVacanciesCount: number;
  companiesCount: number;
  workersCount: number;
}

export const CoverScreen: React.FC<CoverScreenProps> = ({
  onSelectRole,
  onOpenJobSearchInPortal,
  onOpenSettings,
  onOpenLgpdModal,
  jobs,
  openVacanciesCount,
  companiesCount,
  workersCount,
}) => {
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [proximityFilter, setProximityFilter] =
    useState<ProximityFilterState | null>(null);

  const { filteredJobs, distanceByJobId } = useMemo(() => {
    const queryFiltered = filterJobsByTitleOrDescription(jobs, searchQuery);
    if (!proximityFilter?.active) {
      return {
        filteredJobs: queryFiltered,
        distanceByJobId: new Map<string, number>(),
      };
    }

    const nearby = filterAndSortJobsByProximity(
      queryFiltered,
      { lat: proximityFilter.userLat, lng: proximityFilter.userLng },
      proximityFilter.radiusKm
    );
    const map = new Map<string, number>();
    for (const item of nearby) {
      map.set(item.job.id, item.distanceKm);
    }
    return {
      filteredJobs: nearby.map((item) => item.job),
      distanceByJobId: map,
    };
  }, [jobs, searchQuery, proximityFilter]);

  const triggerProximitySearch = (targetRadiusKm: number) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoError('Geolocalização indisponível neste dispositivo.');
      return;
    }

    setLocating(true);
    setGeoError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const distanceToRoo = calculateDistanceKm(
          latitude,
          longitude,
          RONDONOPOLIS_CENTER.lat,
          RONDONOPOLIS_CENTER.lng
        );
        const safeRadius = Math.max(1, Math.min(200, Math.round(targetRadiusKm)));
        const nearestRegion = resolveNearestRondonopolisRegion(latitude, longitude);
        const detectedCity = await reverseGeocodeCity(latitude, longitude);

        setProximityFilter({
          active: true,
          detectedCity,
          nearestRegion,
          userLat: latitude,
          userLng: longitude,
          distanceToRondonopolisKm: distanceToRoo,
          withinRadius:
            distanceToRoo <= Math.max(safeRadius, PROXIMITY_RADIUS_KM),
          radiusKm: safeRadius,
        });
        setLocating(false);
      },
      () => {
        setGeoError(
          'Não foi possível acessar sua localização. Verifique a permissão do navegador.'
        );
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 6000 }
    );
  };

  const handleDetectCityProximity = () => {
    const targetRadius = proximityFilter?.active
      ? proximityFilter.radiusKm
      : PROXIMITY_RADIUS_KM;
    triggerProximitySearch(targetRadius);
  };

  const handleCoverMaxDistanceChange = (rawValue: string) => {
    setGeoError('');
    if (!rawValue) {
      setProximityFilter(null);
      return;
    }
    const nextKm = Number(rawValue);
    if (!Number.isFinite(nextKm) || nextKm <= 0) return;

    if (proximityFilter?.active) {
      setProximityFilter(updateProximityRadius(proximityFilter, nextKm));
    } else {
      triggerProximitySearch(nextKm);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="min-h-dvh bg-[#F4F5F7] dark:bg-[#0B1120] text-[#111827] dark:text-[#F8FAFC] flex flex-col">
      {/* Top Bar Contract: 3 zones */}
      <header className="pt-safe bg-white dark:bg-[#111827] border-b border-[#E5E7EB] dark:border-[#1E293B]">
        <div className="bg-[#ffffff] dark:bg-[#111827] max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4 sm:gap-8">
          <a href="#inicio" className="min-h-[44px] inline-flex items-center shrink-0 focus-visible:outline-2 focus-visible:outline-[#C93B1E] rounded-md">
            <BrickLogo />
          </a>

          <nav aria-label="Navegação inicial" className="hidden md:flex items-center gap-6 text-sm font-medium text-[#4B5563] dark:text-[#94A3B8]">
            <button
              type="button"
              onClick={() => onSelectRole('contratante')}
              className="hover:text-[#111827] dark:hover:text-[#F8FAFC] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Para Construtoras
            </button>
            <button
              type="button"
              onClick={() => onSelectRole('contratado')}
              className="hover:text-[#111827] dark:hover:text-[#F8FAFC] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Para Trabalhadores
            </button>
            <a
              href="#como-funciona"
              className="hover:text-[#111827] dark:hover:text-[#F8FAFC] transition-colors whitespace-nowrap shrink-0"
            >
              Como funciona
            </a>
            <button
              type="button"
              onClick={onOpenSettings}
              data-testid="open-settings-cover-desktop"
              className="hover:text-[#111827] dark:hover:text-[#F8FAFC] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Configurações
            </button>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => onSelectRole('contratado')}
              className="min-h-[44px] px-4 py-2 rounded-lg bg-[#111827] hover:bg-[#1F2937] dark:bg-[#F8FAFC] dark:hover:bg-[#E2E8F0] text-white dark:text-[#0F172A] text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Ver vagas
            </button>
          </div>
        </div>
      </header>

      {/* Main Cover Content */}
      <main id="inicio" className="flex-1">
        <section className="bg-[#e8a640] dark:bg-[#172033] max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-8 sm:pt-10 sm:pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-stretch">
            {/* Left Column: Brand pitch + Two Entry Tabs */}
            <div className="lg:col-span-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <p className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1F2937] dark:text-[#CBD5E1]">
                    <MapPin className="w-4 h-4 text-[#C93B1E] dark:text-[#F06449] shrink-0" aria-hidden="true" />
                    <span>Rondonópolis e região, Mato Grosso</span>
                  </p>

                  <button
                    type="button"
                    onClick={onOpenSettings}
                    data-testid="open-settings-cover-mobile"
                    aria-label="Abrir configurações de tema"
                    className="md:hidden min-h-[44px] px-3.5 py-2 rounded-xl bg-white/90 dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#334155] text-xs font-semibold text-[#111827] dark:text-[#F8FAFC] inline-flex items-center gap-1.5 shrink-0 active:scale-[0.98] transition-transform cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-[#C93B1E] dark:text-[#F06449] shrink-0" aria-hidden="true" />
                    <span>Tema</span>
                  </button>
                </div>

                <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#111827] dark:text-[#F8FAFC] leading-[1.12] [text-wrap:balance]">
                  Obra certa encontra profissional pronto, no bairro certo.
                </h1>

                <p className="mt-4 text-base sm:text-lg text-[#1F2937] dark:text-[#CBD5E1] max-w-2xl leading-relaxed">
                  O BrickJobs conecta construtoras que precisam contratar e trabalhadores da construção civil em Rondonópolis-MT, sem complicação.
                </p>
              </div>

              {/* Two Primary Entry Tabs */}
              <div className="mt-7 sm:mt-8">
                <p className="text-sm font-semibold text-[#111827] dark:text-[#F8FAFC] mb-3">
                  Escolha seu perfil de entrada
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Tab 1: Contratante */}
                  <button
                    type="button"
                    onClick={() => onSelectRole('contratante')}
                    data-testid="enter-contratante"
                    className="group text-left bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#334155] hover:border-[#111827] dark:hover:border-[#94A3B8] rounded-2xl p-5 transition-all shadow-xs hover:shadow-md focus-visible:outline-2 focus-visible:outline-[#C93B1E] min-h-[140px] flex flex-col justify-between cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="w-11 h-11 rounded-xl bg-[#111827] dark:bg-[#1E293B] text-white flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5" aria-hidden="true" />
                      </span>
                      <span className="text-xs font-medium text-[#4B5563] dark:text-[#94A3B8]">
                        Empresa
                      </span>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between gap-2">
                        <h2 className="font-display text-lg font-bold text-[#111827] dark:text-[#F8FAFC]">
                          Contratante
                        </h2>
                        <ArrowRight
                          className="w-5 h-5 text-[#4B5563] dark:text-[#94A3B8] group-hover:text-[#111827] dark:group-hover:text-[#F8FAFC] group-hover:translate-x-0.5 transition-transform"
                          aria-hidden="true"
                        />
                      </div>
                      <p className="mt-1 text-sm text-[#4B5563] dark:text-[#94A3B8] leading-snug">
                        Sou construtora: cadastrar empresa, informar funções e quantidade de vagas.
                      </p>
                    </div>
                  </button>

                  {/* Tab 2: Contratado */}
                  <button
                    type="button"
                    onClick={() => onSelectRole('contratado')}
                    data-testid="enter-contratado"
                    className="group text-left bg-[#C93B1E] border border-[#C93B1E] hover:bg-[#B23319] text-white rounded-2xl p-5 transition-all shadow-xs hover:shadow-md focus-visible:outline-2 focus-visible:outline-[#111827] min-h-[140px] flex flex-col justify-between cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="w-11 h-11 rounded-xl bg-white/15 text-white flex items-center justify-center shrink-0">
                        <HardHat className="w-5 h-5" aria-hidden="true" />
                      </span>
                      <span className="text-xs font-medium text-white/90">
                        Colaborador
                      </span>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between gap-2">
                        <h2 className="font-display text-lg font-bold text-white">
                          Contratado
                        </h2>
                        <ArrowRight
                          className="w-5 h-5 text-white group-hover:translate-x-0.5 transition-transform"
                          aria-hidden="true"
                        />
                      </div>
                      <p className="mt-1 text-sm text-white/90 leading-snug">
                        Busco emprego: anexar PDF ou montar experiências, gerar perfil e ver vagas.
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Editorial Construction Image */}
            <div className="lg:col-span-5">
              <div className="h-52 sm:h-64 lg:h-full min-h-[220px] rounded-2xl overflow-hidden border border-[#E5E7EB] dark:border-[#334155] bg-[#1F2937] relative">
                {!heroImgFailed ? (
                  <img
                    src={coverHeroImg}
                    alt="Equipe de construção civil analisando projeto arquitetônico em obra de alvenaria estrutural"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgFailed(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#1F2937] to-[#111827] flex flex-col items-center justify-center p-6 text-center text-white">
                    <Building2 className="w-10 h-10 text-[#C93B1E] mb-2" aria-hidden="true" />
                    <p className="font-display text-lg font-semibold">Canteiro BrickJobs</p>
                    <p className="text-sm text-white/75 mt-1">Rondonópolis - MT</p>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent p-4 sm:p-5">
                  <p className="text-xs sm:text-sm font-medium text-white">
                    Alvenaria · Estrutura · Instalações · Acabamento
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Search bar inside the main section to filter available jobs by title or description */}
          <div className="mt-8 bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl p-4 sm:p-5">
            <form onSubmit={handleSearchSubmit} role="search" aria-label="Pesquisar vagas disponíveis" className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <label htmlFor="cover-job-search" className="sr-only">
                  Pesquisar vagas por título ou descrição
                </label>
                <Search
                  className="w-4 h-4 text-[#6B7280] dark:text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="cover-job-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pesquisar vagas por título ou descrição (ex: Pedreiro, alvenaria, galpão)"
                  className="w-full min-h-[44px] pl-10 pr-11 py-2 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-base sm:text-sm text-[#111827] dark:text-[#F8FAFC] placeholder:text-[#6B7280] dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-[#111827] dark:focus:border-[#F06449]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Limpar pesquisa de vagas"
                    className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-[#6B7280] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F8FAFC] cursor-pointer"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
                <div className="shrink-0">
                  <label htmlFor="cover-max-distance-select" className="sr-only">
                    Distância máxima em quilômetros
                  </label>
                  <SelectWrapper>
                    <select
                      id="cover-max-distance-select"
                      data-testid="cover-max-distance-select"
                      value={proximityFilter?.active ? String(proximityFilter.radiusKm) : ''}
                      disabled={locating}
                      onChange={(e) => handleCoverMaxDistanceChange(e.target.value)}
                      className="w-full sm:w-auto min-h-[48px] sm:min-h-[44px] appearance-none pl-3.5 pr-10 py-2 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-base sm:text-sm text-[#111827] dark:text-[#F8FAFC] focus:outline-none focus:border-[#C93B1E] disabled:opacity-60 cursor-pointer"
                    >
                      <option value="">Qualquer distância</option>
                      {MAX_DISTANCE_OPTIONS_KM.map((km) => (
                        <option key={km} value={String(km)}>
                          Até {km} km
                        </option>
                      ))}
                      {proximityFilter?.active &&
                        !MAX_DISTANCE_OPTIONS_KM.includes(proximityFilter.radiusKm) && (
                          <option value={String(proximityFilter.radiusKm)}>
                            Até {proximityFilter.radiusKm} km
                          </option>
                        )}
                    </select>
                  </SelectWrapper>
                </div>

                <button
                  type="button"
                  onClick={handleDetectCityProximity}
                  disabled={locating}
                  data-testid="cover-geolocate-button"
                  className={`min-h-[48px] sm:min-h-[44px] px-4 py-2 rounded-xl border text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60 ${
                    proximityFilter?.active
                      ? 'border-[#C93B1E] dark:border-[#F06449] bg-[#C93B1E]/10 dark:bg-[#C93B1E]/20 text-[#111827] dark:text-[#F8FAFC]'
                      : 'border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#1E293B] hover:bg-[#F3F4F6] dark:hover:bg-[#334155] text-[#111827] dark:text-[#F8FAFC]'
                  }`}
                >
                  <LocateFixed
                    className="w-4 h-4 text-[#C93B1E] dark:text-[#F06449] shrink-0"
                    aria-hidden="true"
                  />
                  <span>
                    {locating
                      ? 'Localizando...'
                      : proximityFilter?.active
                        ? `Localizado (${proximityFilter.radiusKm} km)`
                        : 'Usar localização'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenJobSearchInPortal(searchQuery, proximityFilter)}
                  className="min-h-[48px] sm:min-h-[44px] px-5 py-2 rounded-xl bg-[#111827] hover:bg-[#1F2937] dark:bg-[#F8FAFC] dark:hover:bg-[#E2E8F0] text-white dark:text-[#0F172A] text-sm font-semibold whitespace-nowrap shrink-0 active:scale-[0.98] transition-all cursor-pointer"
                >
                  Abrir no portal
                </button>
              </div>
            </form>

            {proximityFilter?.active && (
              <div
                role="status"
                data-testid="cover-proximity-status"
                className="mt-3 pt-3 border-t border-[#E5E7EB] dark:border-[#1E293B] space-y-2.5 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[#374151] dark:text-[#CBD5E1]">
                    Cidade detectada:{' '}
                    <strong className="text-[#111827] dark:text-[#F8FAFC]">
                      {proximityFilter.detectedCity}
                    </strong>{' '}
                    {proximityFilter.withinRadius
                      ? `· Mostrando vagas em até ${proximityFilter.radiusKm} km da sua localização`
                      : `· A ${proximityFilter.distanceToRondonopolisKm.toFixed(1).replace('.', ',')} km de Rondonópolis (limite: ${proximityFilter.radiusKm} km)`}
                  </p>
                  <button
                    type="button"
                    onClick={() => setProximityFilter(null)}
                    className="min-h-[44px] sm:min-h-[32px] px-2 text-xs font-semibold text-[#C93B1E] dark:text-[#F06449] hover:underline cursor-pointer"
                  >
                    Limpar distância
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <label
                    htmlFor="cover-proximity-radius-slider"
                    className="text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] whitespace-nowrap tabular-nums"
                  >
                    Distância máxima: {proximityFilter.radiusKm} km
                  </label>
                  <input
                    id="cover-proximity-radius-slider"
                    data-testid="cover-proximity-radius-slider"
                    type="range"
                    min={1}
                    max={100}
                    step={1}
                    value={Math.min(100, proximityFilter.radiusKm)}
                    onChange={(e) =>
                      setProximityFilter(
                        updateProximityRadius(proximityFilter, Number(e.target.value))
                      )
                    }
                    aria-label="Ajustar distância máxima das vagas em quilômetros"
                    className="w-full sm:max-w-xs accent-[#C93B1E] min-h-[36px] cursor-pointer"
                  />
                </div>
              </div>
            )}

            {geoError && (
              <p role="alert" className="mt-2.5 text-xs font-medium text-[#B91C1C] dark:text-[#F87171]">
                {geoError}
              </p>
            )}

            {/* Live filtered vacancies inside main section */}
            <div className="mt-4 pt-4 border-t border-[#E5E7EB] dark:border-[#1E293B]" data-testid="cover-filtered-jobs">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <p className="text-sm font-semibold text-[#111827] dark:text-[#F8FAFC] tabular-nums">
                  {proximityFilter?.active
                    ? `Vagas próximas de ${proximityFilter.detectedCity} — até ${proximityFilter.radiusKm} km (${filteredJobs.length})`
                    : searchQuery.trim()
                      ? `Vagas encontradas para "${searchQuery.trim()}" (${filteredJobs.length})`
                      : `Vagas disponíveis em Rondonópolis (${filteredJobs.length})`}
                </p>
                {(searchQuery.trim() || proximityFilter?.active) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setProximityFilter(null);
                    }}
                    className="min-h-[44px] px-2 text-xs font-semibold text-[#C93B1E] dark:text-[#F06449] hover:underline inline-flex items-center cursor-pointer"
                  >
                    Mostrar todas
                  </button>
                )}
              </div>

              {filteredJobs.length === 0 ? (
                <div className="py-4 text-center">
                  <p className="text-sm font-medium text-[#111827] dark:text-[#F8FAFC]">
                    {proximityFilter?.active
                      ? `Nenhuma vaga encontrada num raio de ${proximityFilter.radiusKm} km a partir de ${proximityFilter.detectedCity}.`
                      : 'Nenhuma vaga encontrada com esse título ou descrição.'}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                    {proximityFilter?.active && proximityFilter.radiusKm < 50 && (
                      <button
                        type="button"
                        onClick={() =>
                          setProximityFilter(updateProximityRadius(proximityFilter, 50))
                        }
                        className="min-h-[44px] px-4 py-2 rounded-lg bg-[#C93B1E] hover:bg-[#B23319] text-white text-xs font-semibold cursor-pointer"
                      >
                        Ampliar para 50 km
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setProximityFilter(null);
                      }}
                      className="min-h-[44px] px-4 py-2 rounded-lg border border-[#D1D5DB] dark:border-[#334155] text-xs font-semibold text-[#111827] dark:text-[#F8FAFC] hover:bg-[#F9FAFB] dark:hover:bg-[#1E293B] cursor-pointer"
                    >
                      Limpar pesquisa e ver vagas
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredJobs.map((job) => {
                    const distKm = distanceByJobId.get(job.id);
                    return (
                      <article
                        key={job.id}
                        className="rounded-xl border border-[#E5E7EB] dark:border-[#1E293B] bg-[#F9FAFB] dark:bg-[#0F172A] p-4 flex flex-col justify-between gap-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-display text-base font-bold text-[#111827] dark:text-[#F8FAFC]">
                              {job.funcao}
                            </h3>
                            <p className="text-xs text-[#4B5563] dark:text-[#94A3B8]">
                              {job.companyName} · {job.bairro}
                              {distKm !== undefined ? ` (~${formatDistanceKmPtBr(distKm)})` : ''} ·{' '}
                              {job.salarioOuDiaria}
                            </p>
                          </div>
                          <span className="text-sm font-bold text-[#C93B1E] dark:text-[#F06449] tabular-nums shrink-0">
                            {job.quantidadeVagas} {job.quantidadeVagas === 1 ? 'vaga' : 'vagas'}
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm text-[#374151] dark:text-[#CBD5E1] leading-relaxed whitespace-pre-line">
                          {job.descricao}
                        </p>

                        {job.beneficios && (
                          <p className="text-xs text-[#4B5563] dark:text-[#94A3B8]">
                            <span className="font-semibold text-[#111827] dark:text-[#F8FAFC]">Benefícios:</span>{' '}
                            {job.beneficios}
                          </p>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 4-column regional summary strip */}
          <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4 border-t border-[#111827]/15 dark:border-[#334155] pt-6">
            <div>
              <p className="font-display text-2xl sm:text-3xl font-bold text-[#111827] dark:text-[#F8FAFC] tabular-nums">
                {openVacanciesCount}
              </p>
              <p className="text-sm text-[#1F2937] dark:text-[#CBD5E1] mt-0.5">
                Vagas abertas agora
              </p>
            </div>
            <div>
              <p className="font-display text-2xl sm:text-3xl font-bold text-[#111827] dark:text-[#F8FAFC] tabular-nums">
                {companiesCount}
              </p>
              <p className="text-sm text-[#1F2937] dark:text-[#CBD5E1] mt-0.5">
                Construtoras na rede
              </p>
            </div>
            <div>
              <p className="font-display text-2xl sm:text-3xl font-bold text-[#111827] dark:text-[#F8FAFC] tabular-nums">
                {workersCount}
              </p>
              <p className="text-sm text-[#1F2937] dark:text-[#CBD5E1] mt-0.5">
                Perfis de profissionais
              </p>
            </div>
            <div>
              <p className="font-display text-2xl sm:text-3xl font-bold text-[#111827] dark:text-[#F8FAFC] tabular-nums">
                11+
              </p>
              <p className="text-sm text-[#1F2937] dark:text-[#CBD5E1] mt-0.5">
                Bairros e regiões de MT
              </p>
            </div>
          </div>
        </section>

        {/* How it works section */}
        <section id="como-funciona" className="bg-white dark:bg-[#111827] border-t border-[#E5E7EB] dark:border-[#1E293B] pb-safe">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#111827] dark:text-[#F8FAFC]">
              Como o BrickJobs funciona na prática
            </h2>
            <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm font-semibold text-[#C93B1E] dark:text-[#F06449]">01. Para o Contratante</p>
                <p className="mt-1.5 text-sm text-[#4B5563] dark:text-[#94A3B8] leading-relaxed">
                  Cadastre sua construtora com dados gerais e registre a busca por função e quantidade exata de vagas abertas.
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#C93B1E] dark:text-[#F06449]">02. Para o Contratado</p>
                <p className="mt-1.5 text-sm text-[#4B5563] dark:text-[#94A3B8] leading-relaxed">
                  Anexe seu currículo em PDF ou preencha as sub-abas de experiências com datas para gerar seu perfil completo com tempo de atuação.
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#C93B1E] dark:text-[#F06449]">03. Localização em Rondonópolis</p>
                <p className="mt-1.5 text-sm text-[#4B5563] dark:text-[#94A3B8] leading-relaxed">
                  Defina seu bairro ou região de interesse para encontrar vagas próximas da sua casa ou do canteiro de obras.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#F4F5F7] dark:bg-[#0B1120] border-t border-[#E5E7EB] dark:border-[#1E293B] pb-safe">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-[#4B5563] dark:text-[#94A3B8]">
            BrickJobs · Rondonópolis-MT · Tratamento de dados em conformidade com a LGPD (Lei nº 13.709/2018).
          </p>
          {onOpenLgpdModal && (
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => onOpenLgpdModal('cookies')}
                data-testid="cover-footer-cookies-button"
                className="min-h-[44px] sm:min-h-[40px] px-3.5 py-2 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#111827] hover:bg-[#F9FAFB] dark:hover:bg-[#1E293B] text-xs font-semibold text-[#111827] dark:text-[#F8FAFC] cursor-pointer"
              >
                Preferências de Cookies
              </button>
              <button
                type="button"
                onClick={() => onOpenLgpdModal('dados-sensiveis')}
                data-testid="cover-footer-lgpd-button"
                className="min-h-[44px] sm:min-h-[40px] px-3.5 py-2 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#111827] hover:bg-[#F9FAFB] dark:hover:bg-[#1E293B] text-xs font-semibold text-[#C93B1E] dark:text-[#F06449] cursor-pointer"
              >
                Dados Sensíveis (LGPD)
              </button>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};
