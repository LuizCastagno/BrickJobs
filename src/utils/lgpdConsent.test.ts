import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COOKIE_CATEGORIES,
  LGPD_POLICY_VERSION,
  SENSITIVE_DATA_ITEMS,
  TITULAR_RIGHTS_ART18,
  acceptAllCookiesConsent,
  createDefaultLgpdConsent,
  formatConsentTimestampPtBr,
  formatLgpdStatusSummary,
  rejectOptionalCookiesConsent,
  saveCookiePreferences,
  setSensitiveDataConsent,
  shouldShowCookieBanner,
} from './lgpdConsent';

test('default LGPD consent keeps only essenciais enabled and shows cookie banner', () => {
  const initial = createDefaultLgpdConsent();
  assert.equal(initial.version, LGPD_POLICY_VERSION);
  assert.equal(initial.cookiesConfigured, false);
  assert.equal(initial.cookies.essenciais, true);
  assert.equal(initial.cookies.funcionais, false);
  assert.equal(initial.cookies.analiticos, false);
  assert.equal(initial.sensitiveDataConsent, false);
  assert.equal(shouldShowCookieBanner(initial), true);

  const summary = formatLgpdStatusSummary(initial);
  assert.equal(summary.cookiesLabel, 'Aguardando definição');
  assert.equal(summary.sensitiveLabel, 'Pendente de autorização');
});

test('cookie consent actions update toggles, timestamps, and banner visibility', () => {
  const fixedNow = new Date('2026-05-10T14:30:00.000Z');
  const initial = createDefaultLgpdConsent();

  const acceptedAll = acceptAllCookiesConsent(initial, fixedNow);
  assert.equal(acceptedAll.cookiesConfigured, true);
  assert.equal(acceptedAll.cookies.essenciais, true);
  assert.equal(acceptedAll.cookies.funcionais, true);
  assert.equal(acceptedAll.cookies.analiticos, true);
  assert.equal(acceptedAll.cookiesAnsweredAt, fixedNow.toISOString());
  assert.equal(shouldShowCookieBanner(acceptedAll), false);
  assert.equal(formatLgpdStatusSummary(acceptedAll).cookiesLabel, 'Todos aceitos');

  const essentialOnly = rejectOptionalCookiesConsent(acceptedAll, fixedNow);
  assert.equal(essentialOnly.cookies.essenciais, true);
  assert.equal(essentialOnly.cookies.funcionais, false);
  assert.equal(essentialOnly.cookies.analiticos, false);
  assert.equal(formatLgpdStatusSummary(essentialOnly).cookiesLabel, 'Apenas essenciais');

  const custom = saveCookiePreferences(
    essentialOnly,
    { funcionais: true, analiticos: false },
    fixedNow
  );
  assert.equal(custom.cookies.funcionais, true);
  assert.equal(custom.cookies.analiticos, false);
  assert.equal(formatLgpdStatusSummary(custom).cookiesLabel, 'Essenciais + Funcionais');
});

test('sensitive personal data consent can be granted and revoked cleanly per LGPD Art. 11 & 18', () => {
  const t1 = new Date('2026-05-10T15:00:00.000Z');
  const t2 = new Date('2026-05-10T15:15:00.000Z');

  const initial = createDefaultLgpdConsent();
  const granted = setSensitiveDataConsent(initial, true, t1);
  assert.equal(granted.sensitiveDataConsent, true);
  assert.equal(granted.sensitiveDataAnsweredAt, t1.toISOString());
  assert.equal(formatLgpdStatusSummary(granted).sensitiveLabel, 'Consentimento ativo');

  const revoked = setSensitiveDataConsent(granted, false, t2);
  assert.equal(revoked.sensitiveDataConsent, false);
  assert.equal(revoked.sensitiveDataAnsweredAt, t2.toISOString());
  assert.equal(formatLgpdStatusSummary(revoked).sensitiveLabel, 'Autorização revogada');
});

test('LGPD descriptors and timestamp formatting provide valid pt-BR metadata', () => {
  assert.equal(COOKIE_CATEGORIES.length, 3);
  assert.equal(COOKIE_CATEGORIES[0].required, true);
  assert.ok(SENSITIVE_DATA_ITEMS.length >= 3);
  assert.ok(TITULAR_RIGHTS_ART18.length >= 4);

  assert.equal(formatConsentTimestampPtBr(null), 'Ainda não registrado');
  assert.equal(formatConsentTimestampPtBr('invalid-date'), 'Ainda não registrado');
  assert.match(formatConsentTimestampPtBr('2026-05-10T15:00:00.000Z'), /\d{2}\/\d{2}\/2026/);
});
