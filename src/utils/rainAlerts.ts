/**
 * @file src/utils/rainAlerts.ts
 * @description Classificação de severidade meteorológica, recomendações para canteiros de obras e integração Open-Meteo.
 */

import {
  NEIGHBORHOOD_COORDINATES,
  RONDONOPOLIS_CENTER,
  type Coordinates,
} from './geolocation.ts';

export type RainSeverity =
  | 'sem_risco'
  | 'atencao'
  | 'alerta_chuva'
  | 'risco_tempestade';

export interface HourlyRainSlot {
  timeIso: string;
  hourLabel: string;
  temperatureC: number;
  precipitationMm: number;
  precipitationProbability: number;
  windSpeedKmh: number;
  weatherCode: number;
}

export interface DailyRainSummary {
  dateIso: string;
  dayLabel: string;
  precipitationSumMm: number;
  maxProbability: number;
  maxWindKmh: number;
  weatherCode: number;
}

export interface RegionRainForecast {
  scope: 'canteiro' | 'cidade';
  locationLabel: string;
  coordinates: Coordinates;
  currentTempC: number;
  currentPrecipitationMm: number;
  currentProbability: number;
  currentWindKmh: number;
  maxProbabilityNext12h: number;
  totalPrecipitationNext12hMm: number;
  peakRainHourLabel: string | null;
  severity: RainSeverity;
  severityLabel: string;
  headline: string;
  siteAdvisories: string[];
  nextHours: HourlyRainSlot[];
  nextDays: DailyRainSummary[];
}

export interface RainAlertsPayload {
  updatedAt: string;
  source: 'open-meteo' | 'fallback';
  siteRegionName: string;
  cityName: string;
  siteForecast: RegionRainForecast;
  cityForecast: RegionRainForecast;
  combinedAlertMessage: string;
}

export function resolveConstructionSiteLocation(
  region: string,
  customCoords?: Coordinates | null
): { label: string; coordinates: Coordinates } {
  const trimmed = region.trim();
  if (customCoords && Number.isFinite(customCoords.lat) && Number.isFinite(customCoords.lng)) {
    return {
      label:
        trimmed && trimmed !== 'Toda Rondonópolis e Região'
          ? trimmed
          : 'Localização GPS do canteiro',
      coordinates: customCoords,
    };
  }

  if (trimmed && trimmed !== 'Toda Rondonópolis e Região') {
    for (const [name, coords] of Object.entries(NEIGHBORHOOD_COORDINATES)) {
      if (name.toLowerCase() === trimmed.toLowerCase()) {
        return { label: name, coordinates: coords };
      }
    }
  }

  return {
    label: 'Centro / Região Central',
    coordinates: NEIGHBORHOOD_COORDINATES['Centro'] ?? RONDONOPOLIS_CENTER,
  };
}

export function classifyRainSeverity(
  maxProbPct: number,
  maxHourlyMm: number,
  total12hMm: number,
  maxWindKmh: number
): RainSeverity {
  if (maxHourlyMm >= 8 || total12hMm >= 20 || (maxProbPct >= 75 && maxWindKmh >= 40)) {
    return 'risco_tempestade';
  }
  if (maxHourlyMm >= 1.5 || total12hMm >= 4 || maxProbPct >= 55) {
    return 'alerta_chuva';
  }
  if (maxHourlyMm >= 0.2 || total12hMm >= 0.5 || maxProbPct >= 25) {
    return 'atencao';
  }
  return 'sem_risco';
}

export function getRainSeverityLabel(severity: RainSeverity): string {
  switch (severity) {
    case 'risco_tempestade':
      return 'Alerta forte de chuva e vento';
    case 'alerta_chuva':
      return 'Aviso de chuva no canteiro';
    case 'atencao':
      return 'Possibilidade de pancadas isoladas';
    case 'sem_risco':
    default:
      return 'Tempo firme para serviços externos';
  }
}

export function getWeatherDescriptionPtBr(weatherCode: number): string {
  if (weatherCode === 0) return 'Céu limpo';
  if (weatherCode >= 1 && weatherCode <= 3) return 'Parcialmente nublado';
  if (weatherCode === 45 || weatherCode === 48) return 'Neblina';
  if (weatherCode >= 51 && weatherCode <= 57) return 'Garoa';
  if (weatherCode >= 61 && weatherCode <= 65) return 'Chuva';
  if (weatherCode >= 66 && weatherCode <= 67) return 'Chuva intensa';
  if (weatherCode >= 80 && weatherCode <= 82) return 'Pancadas de chuva';
  if (weatherCode >= 95) return 'Trovoadas e rajadas';
  return 'Condição variável';
}

export function buildConstructionSiteAdvisories(
  severity: RainSeverity,
  maxWindKmh: number,
  total12hMm: number
): string[] {
  if (severity === 'risco_tempestade') {
    return [
      'Suspenda atividades em altura (andaimes/telhados - NR-35) e trabalhos em redes elétricas expostas.',
      `Acúmulo previsto de ${total12hMm.toFixed(1).replace('.', ',')} mm nas próximas 12h: proteja sacos de cimento, painéis e valas abertas com lonas e drenagem.`,
      maxWindKmh >= 35
        ? `Rajadas de até ${Math.round(maxWindKmh)} km/h: reforce escoramentos, tapumes e amarração de materiais leves.`
        : 'Evite concretagem e pintura externa até a estabilização do tempo.',
    ];
  }

  if (severity === 'alerta_chuva') {
    return [
      'Reprograme pintura de fachada, reboco externo e impermeabilizações sensíveis à umidade.',
      'Mantenha lonas preparadas para cobrir concreto fresco, armaduras e insumos no canteiro.',
      maxWindKmh >= 30
        ? `Vento previsto de ${Math.round(maxWindKmh)} km/h: redobre a inspeção de andaimes e proteções coletivas.`
        : 'Priorize frentes de serviço cobertas (acabamento interno, instalações e organização).',
    ];
  }

  if (severity === 'atencao') {
    return [
      'Pancadas rápidas podem ocorrer: mantenha cobertura próxima para cimento, argamassa e ferramentas elétricas.',
      'Acompanhe a janela horária antes de iniciar concretagem de lajes ou aplicação de massa externa.',
    ];
  }

  return [
    'Baixo risco de precipitação nas próximas 12h: condições favoráveis para alvenaria, concretagem e serviços externos.',
    'Mantenha hidratação da equipe e proteções solares/EPI regulares no canteiro.',
  ];
}

function formatHourLabelFromIso(iso: string): string {
  const match = /T(\d{2}:\d{2})/.exec(iso);
  return match ? `${match[1].slice(0, 2)}h` : iso.slice(11, 16) || '--h';
}

function formatDayLabelPtBr(dateIso: string, index: number): string {
  if (index === 0) return 'Hoje';
  if (index === 1) return 'Amanhã';
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateIso);
  if (!match) return dateIso;
  return `${match[3]}/${match[2]}`;
}

interface OpenMeteoRaw {
  current?: {
    time?: string;
    temperature_2m?: number;
    precipitation?: number;
    rain?: number;
    weather_code?: number;
    wind_speed_10m?: number;
  };
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    precipitation_probability?: number[];
    precipitation?: number[];
    weather_code?: number[];
    wind_speed_10m?: number[];
  };
  daily?: {
    time?: string[];
    precipitation_sum?: number[];
    precipitation_probability_max?: number[];
    wind_speed_10m_max?: number[];
    weather_code?: number[];
  };
}

export function parseOpenMeteoForecast(
  raw: unknown,
  scope: 'canteiro' | 'cidade',
  locationLabel: string,
  coordinates: Coordinates,
  now = new Date()
): RegionRainForecast {
  const payload = (raw ?? {}) as OpenMeteoRaw;
  const hourlyTimes = payload.hourly?.time ?? [];
  const hourlyTemps = payload.hourly?.temperature_2m ?? [];
  const hourlyProbs = payload.hourly?.precipitation_probability ?? [];
  const hourlyPrecips = payload.hourly?.precipitation ?? [];
  const hourlyCodes = payload.hourly?.weather_code ?? [];
  const hourlyWinds = payload.hourly?.wind_speed_10m ?? [];

  // Select up to 12 future/current hours starting from the nearest current local hour (America/Cuiaba UTC-4)
  const localNowPrefix =
    payload.current?.time?.slice(0, 13) ||
    new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString().slice(0, 13);
  let startIndex = hourlyTimes.findIndex((t) => t.slice(0, 13) >= localNowPrefix);
  if (startIndex < 0) startIndex = 0;

  const next12Slots: HourlyRainSlot[] = [];
  for (let i = startIndex; i < Math.min(hourlyTimes.length, startIndex + 12); i += 1) {
    const timeIso = hourlyTimes[i] ?? '';
    next12Slots.push({
      timeIso,
      hourLabel: formatHourLabelFromIso(timeIso),
      temperatureC: Math.round((Number(hourlyTemps[i]) || 28) * 10) / 10,
      precipitationMm: Math.round((Number(hourlyPrecips[i]) || 0) * 10) / 10,
      precipitationProbability: Math.round(Number(hourlyProbs[i]) || 0),
      windSpeedKmh: Math.round(Number(hourlyWinds[i]) || 0),
      weatherCode: Number(hourlyCodes[i]) || 0,
    });
  }

  const maxProbabilityNext12h = next12Slots.reduce(
    (max, slot) => Math.max(max, slot.precipitationProbability),
    0
  );
  const maxHourlyMm = next12Slots.reduce(
    (max, slot) => Math.max(max, slot.precipitationMm),
    0
  );
  const totalPrecipitationNext12hMm =
    Math.round(
      next12Slots.reduce((sum, slot) => sum + slot.precipitationMm, 0) * 10
    ) / 10;
  const maxWind12h = next12Slots.reduce(
    (max, slot) => Math.max(max, slot.windSpeedKmh),
    Number(payload.current?.wind_speed_10m) || 0
  );

  let peakSlot: HourlyRainSlot | null = null;
  for (const slot of next12Slots) {
    if (
      !peakSlot ||
      slot.precipitationMm > peakSlot.precipitationMm ||
      (slot.precipitationMm === peakSlot.precipitationMm &&
        slot.precipitationProbability > peakSlot.precipitationProbability)
    ) {
      peakSlot = slot;
    }
  }
  const peakRainHourLabel =
    peakSlot && (peakSlot.precipitationProbability >= 25 || peakSlot.precipitationMm > 0)
      ? peakSlot.hourLabel
      : null;

  const severity = classifyRainSeverity(
    maxProbabilityNext12h,
    maxHourlyMm,
    totalPrecipitationNext12hMm,
    maxWind12h
  );
  const severityLabel = getRainSeverityLabel(severity);

  const currentTempC =
    Math.round((Number(payload.current?.temperature_2m) || next12Slots[0]?.temperatureC || 29) * 10) /
    10;
  const currentPrecipitationMm =
    Math.round((Number(payload.current?.precipitation ?? payload.current?.rain) || 0) * 10) / 10;
  const currentProbability = next12Slots[0]?.precipitationProbability ?? 0;
  const currentWindKmh = Math.round(
    Number(payload.current?.wind_speed_10m) || next12Slots[0]?.windSpeedKmh || 8
  );

  const dailyTimes = payload.daily?.time ?? [];
  const dailySums = payload.daily?.precipitation_sum ?? [];
  const dailyProbs = payload.daily?.precipitation_probability_max ?? [];
  const dailyWinds = payload.daily?.wind_speed_10m_max ?? [];
  const dailyCodes = payload.daily?.weather_code ?? [];

  const nextDays: DailyRainSummary[] = dailyTimes.slice(0, 3).map((dateIso, idx) => ({
    dateIso,
    dayLabel: formatDayLabelPtBr(dateIso, idx),
    precipitationSumMm: Math.round((Number(dailySums[idx]) || 0) * 10) / 10,
    maxProbability: Math.round(Number(dailyProbs[idx]) || 0),
    maxWindKmh: Math.round(Number(dailyWinds[idx]) || 0),
    weatherCode: Number(dailyCodes[idx]) || 0,
  }));

  const headline =
    severity === 'sem_risco'
      ? `Sem previsão de chuva expressiva em ${locationLabel} nas próximas 12h (máx. ${maxProbabilityNext12h}%).`
      : peakRainHourLabel
        ? `Maior chance de chuva em ${locationLabel} por volta das ${peakRainHourLabel} (${maxProbabilityNext12h}% · ${totalPrecipitationNext12hMm.toFixed(1).replace('.', ',')} mm em 12h).`
        : `Chuva prevista em ${locationLabel}: até ${maxProbabilityNext12h}% (${totalPrecipitationNext12hMm.toFixed(1).replace('.', ',')} mm em 12h).`;

  return {
    scope,
    locationLabel,
    coordinates,
    currentTempC,
    currentPrecipitationMm,
    currentProbability,
    currentWindKmh,
    maxProbabilityNext12h,
    totalPrecipitationNext12hMm,
    peakRainHourLabel,
    severity,
    severityLabel,
    headline,
    siteAdvisories: buildConstructionSiteAdvisories(
      severity,
      maxWind12h,
      totalPrecipitationNext12hMm
    ),
    nextHours: next12Slots.slice(0, 6),
    nextDays,
  };
}

export function buildCombinedRainAlertMessage(
  site: RegionRainForecast,
  city: RegionRainForecast
): string {
  const rank: Record<RainSeverity, number> = {
    sem_risco: 0,
    atencao: 1,
    alerta_chuva: 2,
    risco_tempestade: 3,
  };

  const highest = rank[site.severity] >= rank[city.severity] ? site : city;

  if (highest.severity === 'sem_risco') {
    return `Sem alerta de chuva para o canteiro (${site.locationLabel}) nem para ${city.locationLabel} nas próximas 12 horas.`;
  }
  if (site.severity !== 'sem_risco' && city.severity !== 'sem_risco') {
    return `Atenção para chuva no canteiro (${site.locationLabel}: ${site.maxProbabilityNext12h}%) e na cidade de ${city.locationLabel} (${city.maxProbabilityNext12h}%).`;
  }
  if (site.severity !== 'sem_risco') {
    return `Aviso localizado na região do canteiro (${site.locationLabel}): ${site.maxProbabilityNext12h}% de chance de chuva nas próximas 12h.`;
  }
  return `Aviso de chuva na cidade (${city.locationLabel}: ${city.maxProbabilityNext12h}%): acompanhe avanço para o canteiro em ${site.locationLabel}.`;
}
