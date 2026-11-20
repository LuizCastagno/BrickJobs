/**
 * @file src/components/RainAlertsPanel.tsx
 * @description Painel de previsão meteorológica e alertas de chuva por região de Rondonópolis para planejamento seguro de obras.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CloudDrizzle,
  CloudLightning,
  CloudRain,
  HardHat,
  MapPin,
  RefreshCw,
  Sun,
  Wind,
} from 'lucide-react';
import { RONDONOPOLIS_NEIGHBORHOODS } from '../data/rondonopolisSeed';
import type { Coordinates } from '../utils/geolocation';
import type {
  RainAlertsPayload,
  RainSeverity,
  RegionRainForecast,
} from '../utils/rainAlerts';
import { getWeatherDescriptionPtBr } from '../utils/rainAlerts';
import { SelectWrapper } from './SelectWrapper';

interface RainAlertsPanelProps {
  siteRegion: string;
  onChangeSiteRegion?: (region: string) => void;
  gpsCoordinates?: Coordinates | null;
  variant?: 'compact' | 'full';
  onOpenFullPanel?: () => void;
}

function getSeverityMeta(severity: RainSeverity): {
  badgeTextClass: string;
  surfaceClass: string;
  Icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  shortTag: string;
} {
  switch (severity) {
    case 'risco_tempestade':
      return {
        badgeTextClass: 'text-[#B91C1C] dark:text-[#FCA5A5]',
        surfaceClass:
          'bg-[#FEF2F2] dark:bg-[#7F1D1D]/25 border-[#FECACA] dark:border-[#991B1B]',
        Icon: CloudLightning,
        shortTag: 'Alerta forte',
      };
    case 'alerta_chuva':
      return {
        badgeTextClass: 'text-[#B45309] dark:text-[#FCD34D]',
        surfaceClass:
          'bg-[#FFFBEB] dark:bg-[#78350F]/25 border-[#FDE68A] dark:border-[#92400E]',
        Icon: CloudRain,
        shortTag: 'Aviso de chuva',
      };
    case 'atencao':
      return {
        badgeTextClass: 'text-[#0369A1] dark:text-[#7DD3FC]',
        surfaceClass:
          'bg-[#F0F9FF] dark:bg-[#0C4A6E]/25 border-[#BAE6FD] dark:border-[#075985]',
        Icon: CloudDrizzle,
        shortTag: 'Atenção',
      };
    case 'sem_risco':
    default:
      return {
        badgeTextClass: 'text-[#047857] dark:text-[#34D399]',
        surfaceClass:
          'bg-[#ECFDF5] dark:bg-[#064E3B]/25 border-[#A7F3D0] dark:border-[#065F46]',
        Icon: Sun,
        shortTag: 'Tempo firme',
      };
  }
}

function formatUpdatedHour(iso: string): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return '--:--';
  }
}

function ForecastCard({ forecast }: { forecast: RegionRainForecast }) {
  const meta = getSeverityMeta(forecast.severity);
  const Icon = meta.Icon;

  return (
    <article
      data-testid={`rain-card-${forecast.scope}`}
      className="rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-[#F9FAFB] dark:bg-[#0F172A] p-4 sm:p-5 flex flex-col justify-between gap-4 min-w-0"
    >
      <div className="space-y-3 min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#C93B1E] dark:text-[#F06449]">
              {forecast.scope === 'canteiro'
                ? 'Região do canteiro de obras'
                : 'Previsão na cidade'}
            </p>
            <h3 className="font-display text-base sm:text-lg font-bold text-[#111827] dark:text-[#F8FAFC] break-words">
              {forecast.locationLabel}
            </h3>
          </div>

          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold shrink-0 ${meta.surfaceClass} ${meta.badgeTextClass}`}
          >
            <Icon className="w-4 h-4 shrink-0" aria-hidden={true} />
            <span>{meta.shortTag}</span>
          </div>
        </div>

        {/* Key telemetry metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-[#E5E7EB] dark:border-[#1E293B]">
          <div>
            <p className="text-xs text-[#4B5563] dark:text-[#94A3B8]">Agora</p>
            <p className="font-display text-base font-bold text-[#111827] dark:text-[#F8FAFC] tabular-nums">
              {forecast.currentTempC.toFixed(0)}°C
            </p>
          </div>
          <div>
            <p className="text-xs text-[#4B5563] dark:text-[#94A3B8]">Máx. 12h</p>
            <p className="font-display text-base font-bold text-[#111827] dark:text-[#F8FAFC] tabular-nums">
              {forecast.maxProbabilityNext12h}%
            </p>
          </div>
          <div>
            <p className="text-xs text-[#4B5563] dark:text-[#94A3B8]">Chuva 12h</p>
            <p className="font-display text-base font-bold text-[#111827] dark:text-[#F8FAFC] tabular-nums">
              {forecast.totalPrecipitationNext12hMm.toFixed(1).replace('.', ',')} mm
            </p>
          </div>
          <div>
            <p className="text-xs text-[#4B5563] dark:text-[#94A3B8]">Vento</p>
            <p className="font-display text-base font-bold text-[#111827] dark:text-[#F8FAFC] tabular-nums inline-flex items-center gap-1">
              <Wind className="w-3.5 h-3.5 text-[#6B7280] dark:text-[#94A3B8]" aria-hidden="true" />
              <span>{forecast.currentWindKmh} km/h</span>
            </p>
          </div>
        </div>

        <p className="text-xs sm:text-sm font-medium text-[#111827] dark:text-[#F8FAFC] leading-relaxed">
          {forecast.headline}
        </p>

        {/* Next hours timeline */}
        {forecast.nextHours.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-2">
              Janela das próximas horas
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {forecast.nextHours.map((slot) => (
                <div
                  key={slot.timeIso}
                  className="rounded-xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] p-2 text-center"
                >
                  <p className="text-xs font-semibold text-[#111827] dark:text-[#F8FAFC] tabular-nums">
                    {slot.hourLabel}
                  </p>
                  <p
                    className={`text-xs font-bold mt-0.5 tabular-nums ${
                      slot.precipitationProbability >= 55
                        ? 'text-[#B45309] dark:text-[#FCD34D]'
                        : 'text-[#4B5563] dark:text-[#94A3B8]'
                    }`}
                  >
                    {slot.precipitationProbability}%
                  </p>
                  <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8] tabular-nums">
                    {slot.precipitationMm.toFixed(1).replace('.', ',')} mm
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Construction site advisories */}
        <div className="pt-2 border-t border-[#E5E7EB] dark:border-[#1E293B]">
          <p className="text-xs font-semibold text-[#111827] dark:text-[#F8FAFC] flex items-center gap-1.5 mb-1.5">
            <HardHat className="w-3.5 h-3.5 text-[#C93B1E] dark:text-[#F06449]" aria-hidden="true" />
            <span>Orientações operacionais</span>
          </p>
          <ul className="space-y-1 text-xs text-[#374151] dark:text-[#CBD5E1] list-disc pl-4">
            {forecast.siteAdvisories.map((tip, idx) => (
              <li key={idx}>{tip}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* 3-day outlook */}
      {forecast.nextDays.length > 0 && (
        <div className="pt-3 border-t border-[#E5E7EB] dark:border-[#1E293B] grid grid-cols-3 gap-2 text-xs">
          {forecast.nextDays.map((day) => (
            <div key={day.dateIso} className="min-w-0">
              <p className="font-semibold text-[#111827] dark:text-[#F8FAFC]">
                {day.dayLabel}
              </p>
              <p className="text-[#4B5563] dark:text-[#94A3B8] truncate">
                {getWeatherDescriptionPtBr(day.weatherCode)}
              </p>
              <p className="text-[#374151] dark:text-[#CBD5E1] font-medium tabular-nums">
                {day.maxProbability}% · {day.precipitationSumMm.toFixed(1).replace('.', ',')} mm
              </p>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

export const RainAlertsPanel: React.FC<RainAlertsPanelProps> = ({
  siteRegion,
  onChangeSiteRegion,
  gpsCoordinates = null,
  variant = 'full',
  onOpenFullPanel,
}) => {
  const effectiveDefaultRegion =
    siteRegion && siteRegion !== 'Toda Rondonópolis e Região'
      ? siteRegion
      : 'Centro';
  const [localRegion, setLocalRegion] = useState<string>(effectiveDefaultRegion);
  const [data, setData] = useState<RainAlertsPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (siteRegion && siteRegion !== 'Toda Rondonópolis e Região') {
      setLocalRegion(siteRegion);
    }
  }, [siteRegion]);

  const activeRegion =
    siteRegion && siteRegion !== 'Toda Rondonópolis e Região'
      ? siteRegion
      : localRegion;

  const fetchRainAlerts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ region: activeRegion });
      if (gpsCoordinates) {
        params.set('lat', String(gpsCoordinates.lat));
        params.set('lng', String(gpsCoordinates.lng));
      }
      const res = await fetch(`/api/rain-alerts?${params.toString()}`);
      const payload = (await res.json().catch(() => ({}))) as Partial<
        RainAlertsPayload & { error?: string }
      >;
      if (!res.ok || !payload.siteForecast || !payload.cityForecast) {
        throw new Error(
          payload.error ||
            'Não foi possível obter a previsão de chuva para o canteiro e a cidade.'
        );
      }
      setData(payload as RainAlertsPayload);
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'Erro ao consultar previsão de chuva.'
      );
    } finally {
      setLoading(false);
    }
  }, [activeRegion, gpsCoordinates]);

  useEffect(() => {
    void fetchRainAlerts();
  }, [fetchRainAlerts]);

  const handleRegionChange = (nextRegion: string) => {
    setLocalRegion(nextRegion);
    onChangeSiteRegion?.(nextRegion);
  };

  const siteMeta = data ? getSeverityMeta(data.siteForecast.severity) : null;
  const cityMeta = data ? getSeverityMeta(data.cityForecast.severity) : null;

  return (
    <section
      aria-label="Avisos de chuva na região do canteiro de obras e na cidade"
      data-testid={variant === 'compact' ? 'rain-alerts-compact' : 'rain-alerts-panel'}
      className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl p-4 sm:p-6 space-y-4"
    >
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#F3F4F6] dark:border-[#1E293B]">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#C93B1E] dark:text-[#F06449]">
            <CloudRain className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Monitoramento meteorológico · Canteiro e Rondonópolis-MT</span>
          </div>
          <h2 className="font-display text-lg sm:text-xl font-bold text-[#111827] dark:text-[#F8FAFC] mt-0.5">
            Avisos de chuva na obra e na cidade
          </h2>
          {data && (
            <p className="text-xs text-[#4B5563] dark:text-[#94A3B8] mt-0.5 tabular-nums">
              Atualizado às {formatUpdatedHour(data.updatedAt)} · Dados em tempo real para o bairro da obra e centro urbano
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <label
              htmlFor={`rain-region-select-${variant}`}
              className="text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] whitespace-nowrap"
            >
              Canteiro:
            </label>
            <SelectWrapper chevronClassName="right-2.5">
              <MapPin
                className="w-3.5 h-3.5 text-[#C93B1E] dark:text-[#F06449] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none shrink-0"
                aria-hidden="true"
              />
              <select
                id={`rain-region-select-${variant}`}
                data-testid={`rain-region-select-${variant}`}
                value={activeRegion}
                onChange={(e) => handleRegionChange(e.target.value)}
                className="min-h-[44px] appearance-none pl-8 pr-9 py-1.5 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs sm:text-sm font-medium text-[#111827] dark:text-[#F8FAFC] focus:outline-none focus:border-[#C93B1E] cursor-pointer"
              >
                {RONDONOPOLIS_NEIGHBORHOODS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </SelectWrapper>
          </div>

          <button
            type="button"
            onClick={() => void fetchRainAlerts()}
            disabled={loading}
            data-testid={`rain-refresh-button-${variant}`}
            className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#1E293B] hover:bg-[#F3F4F6] dark:hover:bg-[#334155] disabled:opacity-60 text-xs sm:text-sm font-semibold text-[#111827] dark:text-[#F8FAFC] inline-flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <RefreshCw
              className={`w-4 h-4 text-[#C93B1E] dark:text-[#F06449] shrink-0 ${
                loading ? 'animate-spin' : ''
              }`}
              aria-hidden="true"
            />
            <span>{loading ? 'Atualizando...' : 'Atualizar'}</span>
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && !data && (
        <div
          role="status"
          data-testid="rain-alerts-loading"
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          {[0, 1].map((idx) => (
            <div
              key={idx}
              className="rounded-xl border border-[#E5E7EB] dark:border-[#1E293B] bg-[#F9FAFB] dark:bg-[#0F172A] p-4 animate-pulse space-y-2"
            >
              <div className="h-3 w-28 rounded bg-[#E5E7EB] dark:bg-[#334155]" />
              <div className="h-5 w-44 rounded bg-[#E5E7EB] dark:bg-[#334155]" />
              <div className="h-3 w-full rounded bg-[#E5E7EB] dark:bg-[#334155]" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div
          role="alert"
          data-testid="rain-alerts-error"
          className="p-4 rounded-xl bg-[#FEF2F2] dark:bg-[#7F1D1D]/30 border border-[#FECACA] dark:border-[#991B1B] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <AlertTriangle
              className="w-4 h-4 text-[#B91C1C] dark:text-[#FCA5A5] shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <p className="text-xs sm:text-sm font-medium text-[#B91C1C] dark:text-[#FCA5A5] min-w-0 [overflow-wrap:anywhere]">
              {error}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void fetchRainAlerts()}
            className="min-h-[44px] px-4 py-2 rounded-lg bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs font-semibold cursor-pointer shrink-0"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Content */}
      {data && siteMeta && cityMeta && (
        <>
          {variant === 'compact' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Canteiro Compact Card */}
                <div
                  data-testid="rain-compact-site"
                  className={`rounded-xl border p-3.5 flex flex-col gap-1.5 ${siteMeta.surfaceClass}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#111827] dark:text-[#F8FAFC]">
                      Canteiro · {data.siteForecast.locationLabel}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold ${siteMeta.badgeTextClass}`}
                    >
                      <siteMeta.Icon className="w-3.5 h-3.5 shrink-0" aria-hidden={true} />
                      <span>{siteMeta.shortTag}</span>
                    </span>
                  </div>
                  <p className="text-xs text-[#374151] dark:text-[#CBD5E1] tabular-nums">
                    Máx. 12h: <strong>{data.siteForecast.maxProbabilityNext12h}%</strong> · Acúmulo:{' '}
                    <strong>
                      {data.siteForecast.totalPrecipitationNext12hMm.toFixed(1).replace('.', ',')} mm
                    </strong>{' '}
                    · Vento: {data.siteForecast.currentWindKmh} km/h · {data.siteForecast.currentTempC.toFixed(0)}°C
                  </p>
                </div>

                {/* Cidade Compact Card */}
                <div
                  data-testid="rain-compact-city"
                  className={`rounded-xl border p-3.5 flex flex-col gap-1.5 ${cityMeta.surfaceClass}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#111827] dark:text-[#F8FAFC]">
                      Cidade · {data.cityForecast.locationLabel}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold ${cityMeta.badgeTextClass}`}
                    >
                      <cityMeta.Icon className="w-3.5 h-3.5 shrink-0" aria-hidden={true} />
                      <span>{cityMeta.shortTag}</span>
                    </span>
                  </div>
                  <p className="text-xs text-[#374151] dark:text-[#CBD5E1] tabular-nums">
                    Máx. 12h: <strong>{data.cityForecast.maxProbabilityNext12h}%</strong> · Acúmulo:{' '}
                    <strong>
                      {data.cityForecast.totalPrecipitationNext12hMm.toFixed(1).replace('.', ',')} mm
                    </strong>{' '}
                    · Vento: {data.cityForecast.currentWindKmh} km/h · {data.cityForecast.currentTempC.toFixed(0)}°C
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <p
                  data-testid="rain-combined-message"
                  className="text-xs sm:text-sm font-medium text-[#111827] dark:text-[#F8FAFC]"
                >
                  {data.combinedAlertMessage}
                </p>
                {onOpenFullPanel && (
                  <button
                    type="button"
                    onClick={onOpenFullPanel}
                    data-testid="open-full-rain-panel"
                    className="min-h-[44px] sm:min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold text-[#C93B1E] dark:text-[#F06449] hover:underline cursor-pointer shrink-0"
                  >
                    Ver previsão por hora e orientações
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p
                data-testid="rain-combined-message"
                className="text-sm font-medium text-[#111827] dark:text-[#F8FAFC] bg-[#F9FAFB] dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#1E293B] rounded-xl px-4 py-3"
              >
                {data.combinedAlertMessage}
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ForecastCard forecast={data.siteForecast} />
                <ForecastCard forecast={data.cityForecast} />
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
};
