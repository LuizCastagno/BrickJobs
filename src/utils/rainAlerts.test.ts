import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCombinedRainAlertMessage,
  classifyRainSeverity,
  parseOpenMeteoForecast,
  resolveConstructionSiteLocation,
} from './rainAlerts.ts';
import { RONDONOPOLIS_CENTER } from './geolocation.ts';

test('resolveConstructionSiteLocation maps Rondonópolis neighborhoods and custom GPS coordinates', () => {
  const vilaAurora = resolveConstructionSiteLocation('Vila Aurora');
  assert.equal(vilaAurora.label, 'Vila Aurora');
  assert.equal(vilaAurora.coordinates.lat, -16.4622);

  const fallbackAll = resolveConstructionSiteLocation('Toda Rondonópolis e Região');
  assert.equal(fallbackAll.label, 'Centro / Região Central');

  const gps = resolveConstructionSiteLocation('Distrito Industrial', {
    lat: -16.5,
    lng: -54.66,
  });
  assert.equal(gps.label, 'Distrito Industrial');
  assert.equal(gps.coordinates.lat, -16.5);
});

test('classifyRainSeverity distinguishes clear, attention, rain warning, and storm risk', () => {
  assert.equal(classifyRainSeverity(10, 0, 0, 12), 'sem_risco');
  assert.equal(classifyRainSeverity(35, 0.3, 0.8, 15), 'atencao');
  assert.equal(classifyRainSeverity(65, 2.4, 5.2, 20), 'alerta_chuva');
  assert.equal(classifyRainSeverity(90, 9.5, 24.0, 42), 'risco_tempestade');
});

test('parseOpenMeteoForecast builds site and city rain alerts with peak hour and advisories', () => {
  const sampleNow = new Date('2026-11-15T12:00:00Z');
  const raw = {
    current: {
      temperature_2m: 28.4,
      precipitation: 0.4,
      weather_code: 61,
      wind_speed_10m: 22,
    },
    hourly: {
      time: [
        '2026-11-15T12:00',
        '2026-11-15T13:00',
        '2026-11-15T14:00',
        '2026-11-15T15:00',
      ],
      temperature_2m: [28.4, 27.9, 26.2, 25.8],
      precipitation_probability: [40, 70, 85, 60],
      precipitation: [0.4, 1.8, 4.5, 1.1],
      weather_code: [61, 63, 80, 61],
      wind_speed_10m: [20, 25, 32, 18],
    },
    daily: {
      time: ['2026-11-15', '2026-11-16', '2026-11-17'],
      precipitation_sum: [12.4, 4.0, 0.2],
      precipitation_probability_max: [85, 45, 15],
      wind_speed_10m_max: [32, 19, 14],
      weather_code: [80, 2, 1],
    },
  };

  const site = parseOpenMeteoForecast(
    raw,
    'canteiro',
    'Distrito Industrial',
    { lat: -16.4985, lng: -54.6645 },
    sampleNow
  );

  assert.equal(site.severity, 'alerta_chuva');
  assert.equal(site.maxProbabilityNext12h, 85);
  assert.equal(site.totalPrecipitationNext12hMm, 7.8);
  assert.equal(site.peakRainHourLabel, '14h');
  assert.equal(site.nextDays.length, 3);
  assert.ok(site.siteAdvisories.length >= 2);

  const cityDry = parseOpenMeteoForecast(
    {
      current: { temperature_2m: 31, precipitation: 0, weather_code: 1, wind_speed_10m: 10 },
      hourly: {
        time: ['2026-11-15T12:00', '2026-11-15T13:00'],
        temperature_2m: [31, 32],
        precipitation_probability: [10, 10],
        precipitation: [0, 0],
        weather_code: [1, 1],
        wind_speed_10m: [10, 11],
      },
      daily: {
        time: ['2026-11-15'],
        precipitation_sum: [0],
        precipitation_probability_max: [10],
        wind_speed_10m_max: [12],
        weather_code: [1],
      },
    },
    'cidade',
    'Rondonópolis - MT',
    RONDONOPOLIS_CENTER,
    sampleNow
  );

  const combined = buildCombinedRainAlertMessage(site, cityDry);
  assert.match(combined, /Distrito Industrial/);
  assert.match(combined, /85%/);
});
