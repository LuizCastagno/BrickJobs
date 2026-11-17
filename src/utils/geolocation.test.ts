import assert from 'node:assert/strict';
import test from 'node:test';
import { SEED_JOBS } from '../data/rondonopolisSeed.ts';
import {
  buildProximityFilterFromCoords,
  calculateDistanceKm,
  detectCityFallbackFromCoords,
  filterAndSortJobsByProximity,
  formatDistanceKmPtBr,
  getJobCoordinates,
  parseNominatimCity,
  PROXIMITY_RADIUS_KM,
  resolveAutoFilledRegionAndNeighborhood,
  resolveGeolocationErrorMessage,
  shouldAutoDetectGeolocation,
  updateProximityRadius,
  type ProximityFilterState,
} from './geolocation.ts';
import {
  RONDONOPOLIS_NEIGHBORHOODS,
  RONDONOPOLIS_REGIONS,
} from '../data/rondonopolisSeed.ts';

test('calculateDistanceKm computes accurate Haversine distance in kilometers', () => {
  const centerToVilaAurora = calculateDistanceKm(-16.4708, -54.6356, -16.4622, -54.6184);
  assert.ok(centerToVilaAurora > 1.5 && centerToVilaAurora < 3.0);

  const rooToCuiaba = calculateDistanceKm(-16.4708, -54.6356, -15.6014, -56.0979);
  assert.ok(rooToCuiaba > 170 && rooToRooApprox(rooToCuiaba));
});

function rooToRooApprox(dist: number): boolean {
  return dist < 210;
}

test('detectCityFallbackFromCoords identifies Rondonópolis and external cities', () => {
  assert.equal(detectCityFallbackFromCoords(-16.4622, -54.6184), 'Rondonópolis - MT');
  assert.equal(detectCityFallbackFromCoords(-16.6231, -54.4742), 'Pedra Preta - MT');
  assert.equal(detectCityFallbackFromCoords(-15.6014, -56.0979), 'Cuiabá - MT');
});

test('parseNominatimCity extracts city and state abbreviation cleanly', () => {
  const parsed = parseNominatimCity({
    address: {
      city: 'Rondonópolis',
      state: 'Mato Grosso',
      'ISO3166-2-lvl4': 'BR-MT',
    },
  });
  assert.equal(parsed, 'Rondonópolis - MT');
  assert.equal(parseNominatimCity(null), null);
});

test('filterAndSortJobsByProximity filters within 50km of Rondonópolis and sorts nearest first', () => {
  const openSeedJobs = SEED_JOBS.filter((j) => j.status === 'aberta');

  // User located in Vila Aurora
  const nearVilaAurora = filterAndSortJobsByProximity(
    openSeedJobs,
    { lat: -16.4622, lng: -54.6184 },
    PROXIMITY_RADIUS_KM
  );
  assert.equal(nearVilaAurora.length, openSeedJobs.length);
  assert.equal(nearVilaAurora[0].job.bairro, 'Vila Aurora');
  assert.equal(nearVilaAurora[0].distanceKm, 0);

  // User located >50km away (Cuiabá) -> 0 jobs within 50km radius
  const farAway = filterAndSortJobsByProximity(
    openSeedJobs,
    { lat: -15.6014, lng: -56.0979 },
    PROXIMITY_RADIUS_KM
  );
  assert.equal(farAway.length, 0);
});

test('filterAndSortJobsByProximity respects tight configurable max distance thresholds (km)', () => {
  const openSeedJobs = SEED_JOBS.filter((j) => j.status === 'aberta');
  const centroCoords = { lat: -16.4708, lng: -54.6356 };

  // Within 2 km of Centro: Centro (0 km) and Cidade Salmen (~2.0 km)
  const within2Km = filterAndSortJobsByProximity(openSeedJobs, centroCoords, 2);
  assert.ok(within2Km.length >= 2);
  assert.ok(within2Km.every((item) => item.distanceKm <= 2));
  assert.ok(!within2Km.some((item) => item.job.bairro === 'Distrito Industrial'));
  assert.ok(!within2Km.some((item) => item.job.bairro === 'Jardim Primavera'));

  // Within 3 km of Centro: includes Vila Aurora (~2.1 km), excludes Jardim Primavera (~3.2 km) & Distrito Industrial (~4.4 km)
  const within3Km = filterAndSortJobsByProximity(openSeedJobs, centroCoords, 3);
  assert.ok(within3Km.some((item) => item.job.bairro === 'Vila Aurora'));
  assert.ok(!within3Km.some((item) => item.job.bairro === 'Distrito Industrial'));

  // User in Distrito Industrial with 2 km max distance still sees Distrito Industrial jobs (0 km)
  const distritoCoords = { lat: -16.4985, lng: -54.6645 };
  const nearDistrito = filterAndSortJobsByProximity(openSeedJobs, distritoCoords, 2);
  assert.ok(nearDistrito.length >= 2);
  assert.ok(nearDistrito.every((item) => item.job.bairro === 'Distrito Industrial'));

  // Zero or negative max distance returns empty safely
  assert.equal(filterAndSortJobsByProximity(openSeedJobs, centroCoords, 0).length, 0);
});

test('getJobCoordinates handles trimmed/case-insensitive neighborhoods and city names', () => {
  const coords = getJobCoordinates({
    bairro: '  vila aurora ',
    regiaoInteresse: 'Centro',
  });
  assert.equal(coords.lat, -16.4622);
  assert.equal(coords.lng, -54.6184);
});

test('updateProximityRadius clamps values cleanly and preserves location metadata', () => {
  const base: ProximityFilterState = {
    active: true,
    detectedCity: 'Rondonópolis - MT',
    nearestRegion: 'Centro',
    userLat: -16.4708,
    userLng: -54.6356,
    distanceToRondonopolisKm: 0,
    withinRadius: true,
    radiusKm: 50,
  };

  assert.equal(updateProximityRadius(base, 10).radiusKm, 10);
  assert.equal(updateProximityRadius(base, 0).radiusKm, 1);
  assert.equal(updateProximityRadius(base, 500).radiusKm, 200);
});

test('formatDistanceKmPtBr formats sub-kilometer and kilometer distances naturally', () => {
  assert.equal(formatDistanceKmPtBr(0.42), '400 m');
  assert.equal(formatDistanceKmPtBr(3.4), '3,4 km');
});

test('shouldAutoDetectGeolocation triggers only when permission is already granted and user has not opted out', () => {
  assert.equal(
    shouldAutoDetectGeolocation({
      permissionState: 'granted',
      alreadyActive: false,
      userOptedOut: false,
      autoDetectWhenGranted: true,
    }),
    true
  );
  assert.equal(
    shouldAutoDetectGeolocation({
      permissionState: 'prompt',
      alreadyActive: false,
      userOptedOut: false,
      autoDetectWhenGranted: true,
    }),
    false
  );
  assert.equal(
    shouldAutoDetectGeolocation({
      permissionState: 'denied',
      alreadyActive: false,
      userOptedOut: false,
      autoDetectWhenGranted: true,
    }),
    false
  );
  assert.equal(
    shouldAutoDetectGeolocation({
      permissionState: 'granted',
      alreadyActive: true,
      userOptedOut: false,
      autoDetectWhenGranted: true,
    }),
    false
  );
  assert.equal(
    shouldAutoDetectGeolocation({
      permissionState: 'granted',
      alreadyActive: false,
      userOptedOut: true,
      autoDetectWhenGranted: true,
    }),
    false
  );
});

test('resolveGeolocationErrorMessage returns clear Portuguese guidance by error code', () => {
  assert.match(resolveGeolocationErrorMessage(1), /Permissão de localização negada/);
  assert.match(resolveGeolocationErrorMessage(2), /localização atual/);
  assert.match(resolveGeolocationErrorMessage(3), /Tempo esgotado/);
});

test('buildProximityFilterFromCoords builds consistent state and radius clamping', () => {
  const built = buildProximityFilterFromCoords({
    lat: -16.4622,
    lng: -54.6184,
    radiusKm: 15,
    nearestRegion: 'Vila Aurora',
    detectedCity: 'Rondonópolis - MT',
  });
  assert.equal(built.active, true);
  assert.equal(built.nearestRegion, 'Vila Aurora');
  assert.equal(built.withinRadius, true);
  assert.equal(built.radiusKm, 15);
});

test('resolveAutoFilledRegionAndNeighborhood populates neighborhood and region when matched', () => {
  const matched = resolveAutoFilledRegionAndNeighborhood({
    nearestRegion: 'Distrito Industrial',
    availableNeighborhoods: RONDONOPOLIS_NEIGHBORHOODS,
    availableRegions: RONDONOPOLIS_REGIONS,
    currentNeighborhood: 'Centro',
    currentRegion: 'Toda Rondonópolis e Região',
  });
  assert.equal(matched.bairro, 'Distrito Industrial');
  assert.equal(matched.regiaoInteresse, 'Distrito Industrial');
  assert.equal(matched.matchedExactNeighborhood, true);

  const fallback = resolveAutoFilledRegionAndNeighborhood({
    nearestRegion: 'Toda Rondonópolis e Região',
    availableNeighborhoods: RONDONOPOLIS_NEIGHBORHOODS,
    availableRegions: RONDONOPOLIS_REGIONS,
    currentNeighborhood: 'Vila Operária',
    currentRegion: 'Centro',
  });
  assert.equal(fallback.bairro, 'Vila Operária');
  assert.equal(fallback.regiaoInteresse, 'Toda Rondonópolis e Região');
  assert.equal(fallback.matchedExactNeighborhood, false);
});

