import type { JobPosting } from '../types/brickjobs';

export interface Coordinates {
  lat: number;
  lng: number;
}

export const RONDONOPOLIS_CENTER: Coordinates = {
  lat: -16.4708,
  lng: -54.6356,
};

export const PROXIMITY_RADIUS_KM = 50;

export const MAX_DISTANCE_OPTIONS_KM: readonly number[] = [2, 3, 5, 10, 25, 50, 100];

export const NEIGHBORHOOD_COORDINATES: Record<string, Coordinates> = {
  Centro: { lat: -16.4708, lng: -54.6356 },
  'Vila Aurora': { lat: -16.4622, lng: -54.6184 },
  'Jardim Primavera': { lat: -16.4535, lng: -54.6112 },
  'Cidade Salmen': { lat: -16.4841, lng: -54.6231 },
  'Vila Operária': { lat: -16.4765, lng: -54.6518 },
  'Parque Sagrada Família': { lat: -16.4478, lng: -54.6442 },
  'Distrito Industrial': { lat: -16.4985, lng: -54.6645 },
  'Jardim Atlântico': { lat: -16.4445, lng: -54.6279 },
  'Jardim Tropical': { lat: -16.4589, lng: -54.6025 },
  'Coophalis / Residencial': { lat: -16.4692, lng: -54.6068 },
  'Região Sul / Pedra Preta': { lat: -16.6231, lng: -54.4742 },
};

const KNOWN_MT_CITIES: Array<{
  city: string;
  state: string;
  lat: number;
  lng: number;
  radiusKm: number;
}> = [
  { city: 'Rondonópolis', state: 'MT', lat: -16.4708, lng: -54.6356, radiusKm: 22 },
  { city: 'Pedra Preta', state: 'MT', lat: -16.6231, lng: -54.4742, radiusKm: 18 },
  { city: 'São José do Povo', state: 'MT', lat: -16.4675, lng: -54.2494, radiusKm: 16 },
  { city: 'Juscimeira', state: 'MT', lat: -16.0508, lng: -54.8858, radiusKm: 18 },
  { city: 'Jaciara', state: 'MT', lat: -15.9653, lng: -54.9683, radiusKm: 18 },
  { city: 'Poxoréu', state: 'MT', lat: -15.8372, lng: -54.3892, radiusKm: 18 },
  { city: 'Itiquira', state: 'MT', lat: -17.2089, lng: -54.1422, radiusKm: 20 },
  { city: 'Cuiabá', state: 'MT', lat: -15.6014, lng: -56.0979, radiusKm: 35 },
  { city: 'Várzea Grande', state: 'MT', lat: -15.6458, lng: -56.1322, radiusKm: 25 },
];

export interface ProximityFilterState {
  active: boolean;
  detectedCity: string;
  nearestRegion: string;
  userLat: number;
  userLng: number;
  distanceToRondonopolisKm: number;
  withinRadius: boolean;
  radiusKm: number;
}

export interface JobWithDistance {
  job: JobPosting;
  distanceKm: number;
}

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function calculateDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(earthRadiusKm * c * 10) / 10;
}

function findNeighborhoodCoords(label: string): Coordinates | undefined {
  const normalized = label.trim().toLowerCase();
  if (!normalized) return undefined;

  for (const [name, coords] of Object.entries(NEIGHBORHOOD_COORDINATES)) {
    if (name.toLowerCase() === normalized) {
      return coords;
    }
  }

  for (const item of KNOWN_MT_CITIES) {
    if (item.city.toLowerCase() === normalized) {
      return { lat: item.lat, lng: item.lng };
    }
  }

  return undefined;
}

export function getJobCoordinates(job: Pick<JobPosting, 'bairro' | 'regiaoInteresse'>): Coordinates {
  return (
    findNeighborhoodCoords(job.bairro) ??
    findNeighborhoodCoords(job.regiaoInteresse) ??
    RONDONOPOLIS_CENTER
  );
}

export function detectCityFallbackFromCoords(lat: number, lng: number): string {
  let closestMatch: { label: string; dist: number } | null = null;

  for (const item of KNOWN_MT_CITIES) {
    const dist = calculateDistanceKm(lat, lng, item.lat, item.lng);
    if (dist <= item.radiusKm) {
      if (!closestMatch || dist < closestMatch.dist) {
        closestMatch = { label: `${item.city} - ${item.state}`, dist };
      }
    }
  }

  if (closestMatch) return closestMatch.label;

  const distToRoo = calculateDistanceKm(
    lat,
    lng,
    RONDONOPOLIS_CENTER.lat,
    RONDONOPOLIS_CENTER.lng
  );
  if (distToRoo <= PROXIMITY_RADIUS_KM) {
    return 'Região de Rondonópolis - MT';
  }
  return 'Localidade externa';
}

export function parseNominatimCity(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const address = (payload as { address?: Record<string, string | undefined> }).address;
  if (!address) return null;

  const cityName =
    address.city ||
    address.town ||
    address.municipality ||
    address.village ||
    address.county;
  if (!cityName) return null;

  const isoState = address['ISO3166-2-lvl4'];
  const stateCode =
    isoState && isoState.includes('-')
      ? isoState.split('-')[1]
      : address.state === 'Mato Grosso'
        ? 'MT'
        : address.state;

  return stateCode ? `${cityName} - ${stateCode}` : cityName;
}

export async function reverseGeocodeCity(
  lat: number,
  lng: number,
  timeoutMs = 2500
): Promise<string> {
  const fallback = detectCityFallbackFromCoords(lat, lng);
  if (typeof fetch === 'undefined') return fallback;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
      lat
    )}&lon=${encodeURIComponent(lng)}&zoom=10&addressdetails=1&accept-language=pt-BR`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return fallback;
    const json = (await res.json()) as unknown;
    return parseNominatimCity(json) || fallback;
  } catch {
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}

export function updateProximityRadius(
  state: ProximityFilterState,
  nextRadiusKm: number
): ProximityFilterState {
  const clampedRadius = Math.max(1, Math.min(200, Math.round(nextRadiusKm)));
  return {
    ...state,
    radiusKm: clampedRadius,
    withinRadius:
      state.distanceToRondonopolisKm <= Math.max(clampedRadius, PROXIMITY_RADIUS_KM),
  };
}

export function filterAndSortJobsByProximity(
  jobs: JobPosting[],
  userCoords: Coordinates,
  maxDistanceKm = PROXIMITY_RADIUS_KM
): JobWithDistance[] {
  if (!Number.isFinite(maxDistanceKm) || maxDistanceKm <= 0) {
    return [];
  }

  return jobs
    .map((job) => {
      const coords = getJobCoordinates(job);
      const distanceFromUser = calculateDistanceKm(
        userCoords.lat,
        userCoords.lng,
        coords.lat,
        coords.lng
      );
      return {
        job,
        distanceKm: distanceFromUser,
      };
    })
    .filter((entry) => entry.distanceKm <= maxDistanceKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export function formatDistanceKmPtBr(distanceKm: number): string {
  if (distanceKm < 1) {
    const meters = Math.max(100, Math.round((distanceKm * 1000) / 100) * 100);
    return `${meters} m`;
  }
  return `${distanceKm.toFixed(1).replace('.', ',')} km`;
}

export type GeolocationPermissionState =
  | 'granted'
  | 'prompt'
  | 'denied'
  | 'unsupported';

export async function queryGeolocationPermission(): Promise<GeolocationPermissionState> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return 'unsupported';
  }
  if (typeof navigator.permissions?.query !== 'function') {
    return 'prompt';
  }
  try {
    const status = await navigator.permissions.query({
      name: 'geolocation' as PermissionName,
    });
    if (
      status.state === 'granted' ||
      status.state === 'denied' ||
      status.state === 'prompt'
    ) {
      return status.state;
    }
    return 'prompt';
  } catch {
    return 'prompt';
  }
}

export function shouldAutoDetectGeolocation(params: {
  permissionState: GeolocationPermissionState;
  alreadyActive: boolean;
  userOptedOut: boolean;
  autoDetectWhenGranted: boolean;
}): boolean {
  return (
    params.autoDetectWhenGranted &&
    params.permissionState === 'granted' &&
    !params.alreadyActive &&
    !params.userOptedOut
  );
}

export function resolveGeolocationErrorMessage(errorCode?: number): string {
  switch (errorCode) {
    case 1:
      return 'Permissão de localização negada no navegador. Libere o acesso nas configurações do site ou selecione a região manualmente.';
    case 2:
      return 'Não foi possível determinar sua localização atual pelo GPS ou rede. Selecione a região desejada na lista.';
    case 3:
      return 'Tempo esgotado ao detectar sua localização. Tente novamente ou selecione a região manualmente.';
    default:
      return 'Permissão de localização negada ou indisponível. Selecione a região desejada na lista.';
  }
}

export function buildProximityFilterFromCoords(params: {
  lat: number;
  lng: number;
  radiusKm: number;
  nearestRegion: string;
  detectedCity: string;
}): ProximityFilterState {
  const distanceToRoo = calculateDistanceKm(
    params.lat,
    params.lng,
    RONDONOPOLIS_CENTER.lat,
    RONDONOPOLIS_CENTER.lng
  );
  const safeRadius = Math.max(1, Math.min(200, Math.round(params.radiusKm)));
  const withinRadius =
    distanceToRoo <= Math.max(safeRadius, PROXIMITY_RADIUS_KM);

  return {
    active: true,
    detectedCity: params.detectedCity,
    nearestRegion: params.nearestRegion,
    userLat: params.lat,
    userLng: params.lng,
    distanceToRondonopolisKm: distanceToRoo,
    withinRadius,
    radiusKm: safeRadius,
  };
}

export function resolveAutoFilledRegionAndNeighborhood(params: {
  nearestRegion: string;
  availableNeighborhoods: readonly string[];
  availableRegions: readonly string[];
  currentNeighborhood?: string;
  currentRegion?: string;
}): {
  bairro: string;
  regiaoInteresse: string;
  matchedExactNeighborhood: boolean;
} {
  const {
    nearestRegion,
    availableNeighborhoods,
    availableRegions,
    currentNeighborhood = '',
    currentRegion = '',
  } = params;

  const regiaoInteresse = availableRegions.includes(nearestRegion)
    ? nearestRegion
    : currentRegion || availableRegions[0] || 'Toda Rondonópolis e Região';

  const matchedExactNeighborhood = availableNeighborhoods.includes(nearestRegion);
  const bairro = matchedExactNeighborhood
    ? nearestRegion
    : currentNeighborhood || availableNeighborhoods[0] || 'Centro';

  return {
    bairro,
    regiaoInteresse,
    matchedExactNeighborhood,
  };
}

