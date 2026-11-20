/**
 * @file LocationRegionBar.tsx
 * @description Barra de busca com seleção de região em Rondonópolis-MT, filtro de proximidade via
 *   geolocalização (km) e pesquisa por comando de voz (Web Speech API).
 */
import React, { useEffect, useRef, useState } from 'react';
import { LocateFixed, MapPin, Mic, Search, Square, X } from 'lucide-react';
import { RONDONOPOLIS_REGIONS } from '../data/rondonopolisSeed';
import { resolveNearestRondonopolisRegion } from '../utils/duration';
import {
  buildProximityFilterFromCoords,
  MAX_DISTANCE_OPTIONS_KM,
  PROXIMITY_RADIUS_KM,
  queryGeolocationPermission,
  resolveGeolocationErrorMessage,
  reverseGeocodeCity,
  shouldAutoDetectGeolocation,
  updateProximityRadius,
  type GeolocationPermissionState,
  type ProximityFilterState,
} from '../utils/geolocation';
import {
  extractTranscriptFromSpeechEvent,
  getSpeechRecognitionConstructor,
  getVoiceErrorMessage,
  parseVoiceJobCommand,
  type WebSpeechRecognitionInstance,
} from '../utils/voiceSearch';
import { SelectWrapper } from './SelectWrapper';

interface LocationRegionBarProps {
  selectedRegion: string;
  onChangeRegion: (region: string) => void;
  searchQuery: string;
  onChangeSearchQuery: (query: string) => void;
  searchPlaceholder?: string;
  regionLabel?: string;
  proximityFilter?: ProximityFilterState | null;
  onApplyProximity?: (state: ProximityFilterState) => void;
  onClearProximity?: () => void;
  onRegionDetected?: (nearestRegion: string, detectedCity: string) => void;
  autoDetectWhenGranted?: boolean;
  enableVoiceSearch?: boolean;
}

export const LocationRegionBar: React.FC<LocationRegionBarProps> = ({
  selectedRegion,
  onChangeRegion,
  searchQuery,
  onChangeSearchQuery,
  searchPlaceholder = 'Buscar por função ou empresa (ex: Pedreiro)',
  regionLabel = 'Região de interesse em Rondonópolis-MT',
  proximityFilter = null,
  onApplyProximity,
  onClearProximity,
  onRegionDetected,
  autoDetectWhenGranted = false,
  enableVoiceSearch = false,
}) => {
  const [geoError, setGeoError] = useState<string>('');
  const [geoInfo, setGeoInfo] = useState<string>('');
  const [locating, setLocating] = useState(false);
  const [permissionState, setPermissionState] =
    useState<GeolocationPermissionState>('prompt');
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voiceStatus, setVoiceStatus] = useState('');
  const [voiceError, setVoiceError] = useState('');
  const recognitionRef = useRef<WebSpeechRecognitionInstance | null>(null);
  const userOptedOutRef = useRef<boolean>(false);
  const autoDetectTriggeredRef = useRef<boolean>(false);

  const supportsProximity = Boolean(onApplyProximity);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore abort cleanup error
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let permStatusObj: PermissionStatus | null = null;

    const syncPermission = async () => {
      const nextState = await queryGeolocationPermission();
      if (!cancelled) {
        setPermissionState(nextState);
      }

      if (
        typeof navigator !== 'undefined' &&
        typeof navigator.permissions?.query === 'function'
      ) {
        try {
          permStatusObj = await navigator.permissions.query({
            name: 'geolocation' as PermissionName,
          });
          if (!cancelled && permStatusObj) {
            permStatusObj.onchange = () => {
              if (cancelled || !permStatusObj) return;
              const updated =
                permStatusObj.state === 'granted' ||
                permStatusObj.state === 'denied' ||
                permStatusObj.state === 'prompt'
                  ? permStatusObj.state
                  : 'prompt';
              setPermissionState(updated);
            };
          }
        } catch {
          // Permissions API listener optional
        }
      }
    };

    void syncPermission();

    return () => {
      cancelled = true;
      if (permStatusObj) {
        permStatusObj.onchange = null;
      }
    };
  }, []);

  const stopVoiceSearch = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore stop error if already ended
      }
    }
    setIsListening(false);
  };

  const handleToggleVoiceSearch = () => {
    setVoiceError('');
    if (isListening) {
      stopVoiceSearch();
      return;
    }

    const SpeechRecognitionCtor = getSpeechRecognitionConstructor();
    if (!SpeechRecognitionCtor) {
      setVoiceStatus('');
      setVoiceError(
        'Reconhecimento de voz (Web Speech API) indisponível neste navegador. Digite a vaga desejada ou use Chrome, Edge ou Safari.'
      );
      return;
    }

    try {
      const recognition = new SpeechRecognitionCtor();
      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setInterimTranscript('');
        setVoiceStatus('');
        setVoiceError('');
      };

      recognition.onresult = (event) => {
        const { transcript, isFinal } = extractTranscriptFromSpeechEvent(event);
        if (!transcript) return;
        setInterimTranscript(transcript);

        if (isFinal) {
          const parsed = parseVoiceJobCommand(transcript);
          onChangeSearchQuery(parsed.query);
          if (parsed.action === 'clear') {
            setVoiceStatus(
              `Busca limpa por comando de voz («${parsed.rawTranscript}»).`
            );
          } else if (
            parsed.query.toLowerCase() !== parsed.rawTranscript.toLowerCase()
          ) {
            setVoiceStatus(
              `Comando de voz aplicado: «${parsed.query}» (ouvido: «${parsed.rawTranscript}»).`
            );
          } else {
            setVoiceStatus(`Busca por voz aplicada: «${parsed.query}».`);
          }
        }
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        setInterimTranscript('');
        if (event?.error === 'aborted') {
          setVoiceStatus('Busca por voz cancelada.');
          return;
        }
        setVoiceStatus('');
        setVoiceError(getVoiceErrorMessage(event?.error ?? 'unknown'));
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
      recognitionRef.current = null;
      setVoiceError(getVoiceErrorMessage('unknown'));
    }
  };

  const triggerGeolocation = (
    targetRadiusKm: number,
    options?: { silentOnError?: boolean }
  ) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      if (!options?.silentOnError) {
        setGeoError(
          'Geolocalização indisponível neste dispositivo. Selecione a região manualmente.'
        );
      }
      return;
    }

    setLocating(true);
    setGeoError('');
    setGeoInfo('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const nearestRegion = resolveNearestRondonopolisRegion(latitude, longitude);
        const detectedCity = await reverseGeocodeCity(latitude, longitude);

        setPermissionState('granted');
        onRegionDetected?.(nearestRegion, detectedCity);

        if (onApplyProximity) {
          onChangeRegion('Toda Rondonópolis e Região');
          onApplyProximity(
            buildProximityFilterFromCoords({
              lat: latitude,
              lng: longitude,
              radiusKm: targetRadiusKm,
              nearestRegion,
              detectedCity,
            })
          );
        } else {
          onChangeRegion(nearestRegion);
          setGeoInfo(`Cidade detectada: ${detectedCity} · Região: ${nearestRegion}`);
        }
        setLocating(false);
      },
      (err) => {
        if (err?.code === 1) {
          setPermissionState('denied');
        }
        if (!options?.silentOnError) {
          setGeoError(resolveGeolocationErrorMessage(err?.code));
        }
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 6000 }
    );
  };

  useEffect(() => {
    if (autoDetectTriggeredRef.current) return;
    if (
      shouldAutoDetectGeolocation({
        permissionState,
        alreadyActive: Boolean(proximityFilter?.active),
        userOptedOut: userOptedOutRef.current,
        autoDetectWhenGranted,
      })
    ) {
      autoDetectTriggeredRef.current = true;
      triggerGeolocation(PROXIMITY_RADIUS_KM, { silentOnError: true });
    }
  }, [permissionState, proximityFilter?.active, autoDetectWhenGranted]);

  const handleUseLocation = () => {
    userOptedOutRef.current = false;
    const activeRadius = proximityFilter?.active
      ? proximityFilter.radiusKm
      : PROXIMITY_RADIUS_KM;
    triggerGeolocation(activeRadius);
  };

  const handleFillRegionFieldFromProximity = () => {
    if (!proximityFilter?.nearestRegion) return;
    const targetRegion = proximityFilter.nearestRegion;
    const detectedCity = proximityFilter.detectedCity;
    userOptedOutRef.current = true;
    onClearProximity?.();
    onChangeRegion(targetRegion);
    setGeoError('');
    setGeoInfo(
      `Região preenchida automaticamente com «${targetRegion}» (${detectedCity}).`
    );
  };

  const handleMaxDistanceSelectChange = (rawValue: string) => {
    setGeoError('');
    if (!rawValue) {
      userOptedOutRef.current = true;
      onClearProximity?.();
      return;
    }

    const nextRadius = Number(rawValue);
    if (!Number.isFinite(nextRadius) || nextRadius <= 0) return;

    userOptedOutRef.current = false;
    if (proximityFilter?.active && onApplyProximity) {
      onApplyProximity(updateProximityRadius(proximityFilter, nextRadius));
    } else {
      triggerGeolocation(nextRadius);
    }
  };

  const activeSelectValue = proximityFilter?.active
    ? String(proximityFilter.radiusKm)
    : '';
  const isCustomRadius =
    Boolean(proximityFilter?.active) &&
    !MAX_DISTANCE_OPTIONS_KM.includes(proximityFilter?.radiusKm ?? 0);

  return (
    <section
      aria-label="Localização e filtros de busca"
      className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl p-4 sm:p-5"
    >
      <div
        className={
          supportsProximity
            ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[minmax(210px,1.05fr)_minmax(290px,1.75fr)_minmax(160px,0.85fr)_auto] gap-3.5 items-end'
            : 'grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end'
        }
      >
        {/* Seletor de região de interesse */}
        <div className={supportsProximity ? 'min-w-0' : 'md:col-span-4'}>
          <label
            htmlFor="brickjobs-region-select"
            className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
          >
            {regionLabel}
          </label>
          <SelectWrapper>
            <MapPin
              className="w-4 h-4 text-[#C93B1E] dark:text-[#F06449] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none shrink-0"
              aria-hidden="true"
            />
            <select
              id="brickjobs-region-select"
              value={selectedRegion}
              onChange={(e) => {
                userOptedOutRef.current = true;
                onChangeRegion(e.target.value);
                onClearProximity?.();
                setGeoError('');
                setGeoInfo('');
              }}
              className="w-full min-h-[44px] appearance-none pl-10 pr-10 py-2 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-base sm:text-sm text-[#111827] dark:text-[#F8FAFC] focus:outline-none focus:border-[#C93B1E] cursor-pointer"
            >
              {RONDONOPOLIS_REGIONS.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </SelectWrapper>
        </div>

        {/* Busca textual e por voz */}
        <div className={supportsProximity ? 'min-w-0' : 'md:col-span-4'}>
          <label
            htmlFor="brickjobs-search-input"
            className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
          >
            Filtrar por função ou palavra-chave
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <Search
                className="w-4 h-4 text-[#6B7280] dark:text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none shrink-0"
                aria-hidden="true"
              />
              <input
                id="brickjobs-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  onChangeSearchQuery(e.target.value);
                  if (voiceStatus) setVoiceStatus('');
                }}
                placeholder={searchPlaceholder}
                className="w-full min-h-[44px] pl-10 pr-11 py-2 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-base sm:text-sm text-[#111827] dark:text-[#F8FAFC] placeholder:text-[#6B7280] dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-[#C93B1E]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    onChangeSearchQuery('');
                    setVoiceStatus('');
                  }}
                  aria-label="Limpar busca"
                  className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-[#6B7280] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F8FAFC] cursor-pointer"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>

            {enableVoiceSearch && (
              <button
                type="button"
                onClick={handleToggleVoiceSearch}
                aria-pressed={isListening}
                aria-label={
                  isListening
                    ? 'Parar comando de voz'
                    : 'Pesquisar vagas por comando de voz'
                }
                title={
                  isListening
                    ? 'Parar gravação de voz'
                    : 'Pesquisar vagas por voz (Web Speech)'
                }
                data-testid="voice-search-button"
                className={`min-w-[44px] min-h-[44px] px-3 rounded-xl border text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] shrink-0 cursor-pointer ${
                  isListening
                    ? 'border-[#C93B1E] dark:border-[#F06449] bg-[#C93B1E] text-white ring-3 ring-[#C93B1E]/25'
                    : 'border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#1E293B] hover:bg-[#F3F4F6] dark:hover:bg-[#334155] text-[#111827] dark:text-[#F8FAFC]'
                }`}
              >
                {isListening ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current shrink-0" aria-hidden="true" />
                    <span>Parar</span>
                  </>
                ) : (
                  <>
                    <Mic
                      className="w-4 h-4 text-[#C93B1E] dark:text-[#F06449] shrink-0"
                      aria-hidden="true"
                    />
                    <span className="sm:hidden lg:hidden">Voz</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Filtro de distância máxima (km) */}
        {supportsProximity && (
          <div className="min-w-0">
            <label
              htmlFor="brickjobs-max-distance-select"
              className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5"
            >
              Distância máxima (km)
            </label>
            <SelectWrapper>
              <select
                id="brickjobs-max-distance-select"
                data-testid="max-distance-select"
                value={activeSelectValue}
                disabled={locating}
                onChange={(e) => handleMaxDistanceSelectChange(e.target.value)}
                className="w-full min-h-[44px] appearance-none pl-3.5 pr-10 py-2 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-base sm:text-sm text-[#111827] dark:text-[#F8FAFC] focus:outline-none focus:border-[#C93B1E] disabled:opacity-60 cursor-pointer"
              >
                <option value="">Qualquer distância</option>
                {MAX_DISTANCE_OPTIONS_KM.map((km) => (
                  <option key={km} value={String(km)}>
                    Até {km} km
                  </option>
                ))}
                {isCustomRadius && proximityFilter && (
                  <option value={String(proximityFilter.radiusKm)}>
                    Até {proximityFilter.radiusKm} km
                  </option>
                )}
              </select>
            </SelectWrapper>
          </div>
        )}

        {/* Ação rápida de geolocalização GPS */}
        <div className={supportsProximity ? 'shrink-0' : 'md:col-span-4'}>
          <button
            type="button"
            onClick={handleUseLocation}
            disabled={locating}
            data-testid="proximity-geolocate-button"
            className={`w-full min-h-[44px] px-4 py-2 rounded-xl border text-sm font-medium inline-flex items-center justify-center gap-2 transition-all active:scale-[0.98] whitespace-nowrap cursor-pointer disabled:opacity-60 ${
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
                ? 'Detectando localização...'
                : onApplyProximity
                  ? proximityFilter?.active
                    ? 'Atualizar localização'
                    : 'Usar minha localização'
                  : 'Minha localização'}
            </span>
          </button>
        </div>
      </div>

      {proximityFilter?.active && (
        <div
          role="status"
          data-testid="proximity-status-banner"
          className="mt-3 pt-3 border-t border-[#F3F4F6] dark:border-[#1E293B] space-y-2.5 text-xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[#374151] dark:text-[#CBD5E1]">
              Cidade detectada:{' '}
              <strong className="text-[#111827] dark:text-[#F8FAFC]">
                {proximityFilter.detectedCity}
              </strong>{' '}
              {proximityFilter.withinRadius
                ? `· Exibindo vagas em até ${proximityFilter.radiusKm} km da sua localização (ref.: ${proximityFilter.nearestRegion})`
                : `· A ${proximityFilter.distanceToRondonopolisKm.toFixed(1).replace('.', ',')} km de Rondonópolis (limite atual: ${proximityFilter.radiusKm} km)`}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              {proximityFilter.nearestRegion &&
                proximityFilter.nearestRegion !== 'Toda Rondonópolis e Região' && (
                  <button
                    type="button"
                    onClick={handleFillRegionFieldFromProximity}
                    data-testid="fill-region-from-location-button"
                    className="min-h-[44px] sm:min-h-[32px] px-3 py-1 rounded-lg border border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#1E293B] hover:bg-[#F3F4F6] dark:hover:bg-[#334155] text-xs font-semibold text-[#111827] dark:text-[#F8FAFC] inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#C93B1E] dark:text-[#F06449]" aria-hidden="true" />
                    <span>Preencher região ({proximityFilter.nearestRegion})</span>
                  </button>
                )}

              {onClearProximity && (
                <button
                  type="button"
                  onClick={() => {
                    userOptedOutRef.current = true;
                    onClearProximity();
                  }}
                  data-testid="clear-proximity-button"
                  className="min-h-[44px] sm:min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-semibold text-[#C93B1E] dark:text-[#F06449] hover:underline inline-flex items-center cursor-pointer"
                >
                  Limpar distância
                </button>
              )}
            </div>
          </div>

          {onApplyProximity && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <label
                htmlFor="brickjobs-radius-slider"
                className="text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] whitespace-nowrap tabular-nums"
              >
                Raio máximo: {proximityFilter.radiusKm} km
              </label>
              <input
                id="brickjobs-radius-slider"
                data-testid="proximity-radius-slider"
                type="range"
                min={1}
                max={100}
                step={1}
                value={Math.min(100, proximityFilter.radiusKm)}
                onChange={(e) => {
                  const nextKm = Number(e.target.value);
                  onApplyProximity(updateProximityRadius(proximityFilter, nextKm));
                }}
                aria-label="Ajustar distância máxima em quilômetros"
                className="w-full sm:max-w-xs accent-[#C93B1E] min-h-[36px] cursor-pointer"
              />
            </div>
          )}
        </div>
      )}

      {enableVoiceSearch && (isListening || voiceStatus) && (
        <div
          role="status"
          aria-live="polite"
          data-testid="voice-search-status"
          className="mt-3 pt-3 border-t border-[#F3F4F6] dark:border-[#1E293B] flex flex-wrap items-center justify-between gap-2 text-xs min-w-0"
        >
          {isListening ? (
            <div className="flex items-center gap-2 text-[#111827] dark:text-[#F8FAFC] min-w-0 flex-1">
              <Mic
                className="w-4 h-4 text-[#C93B1E] dark:text-[#F06449] shrink-0"
                aria-hidden="true"
              />
              <span className="min-w-0 [overflow-wrap:anywhere]">
                Ouvindo comando de voz em português...{' '}
                {interimTranscript ? (
                  <strong>«{interimTranscript}»</strong>
                ) : (
                  <span className="text-[#4B5563] dark:text-[#94A3B8]">
                    Ex.: «buscar vagas de pedreiro», «eletricista» ou «limpar busca».
                  </span>
                )}
              </span>
            </div>
          ) : (
            <p className="text-[#047857] dark:text-[#34D399] font-medium flex items-center gap-1.5 min-w-0 flex-1">
              <Mic className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="min-w-0 [overflow-wrap:anywhere]">{voiceStatus}</span>
            </p>
          )}

          {isListening ? (
            <button
              type="button"
              onClick={stopVoiceSearch}
              className="min-h-[44px] sm:min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-semibold text-[#C93B1E] dark:text-[#F06449] hover:underline cursor-pointer shrink-0"
            >
              Cancelar voz
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setVoiceStatus('')}
              className="min-h-[44px] sm:min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-medium text-[#4B5563] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F8FAFC] cursor-pointer shrink-0"
            >
              Ocultar aviso
            </button>
          )}
        </div>
      )}

      {enableVoiceSearch && voiceError && (
        <p
          role="alert"
          data-testid="voice-search-error"
          className="mt-2.5 text-xs font-medium text-[#B91C1C] dark:text-[#F87171] [overflow-wrap:anywhere]"
        >
          {voiceError}
        </p>
      )}

      {!proximityFilter?.active && geoInfo && (
        <p className="mt-2.5 text-xs text-[#4B5563] dark:text-[#94A3B8]" role="status">
          {geoInfo}
        </p>
      )}

      {geoError && (
        <p className="mt-2.5 text-xs font-medium text-[#B91C1C] dark:text-[#F87171]" role="alert">
          {geoError}
        </p>
      )}
    </section>
  );
};
