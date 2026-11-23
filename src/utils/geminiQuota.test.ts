import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createGeminiCooldownGuard,
  DEFAULT_QUOTA_COOLDOWN_MS,
  extractRetryDelayMs,
  formatSanitizedFallbackNotice,
  isGeminiQuotaError,
  MAX_QUOTA_COOLDOWN_MS,
  TRANSIENT_FAILURE_COOLDOWN_MS,
} from './geminiQuota.ts';

test('isGeminiQuotaError detects 429 and RESOURCE_EXHAUSTED payloads', () => {
  const rawApiError = new Error(
    '{"error":{"code":429,"message":"You exceeded your current quota","status":"RESOURCE_EXHAUSTED","details":[{"retryDelay":"1275s"}]}}'
  );
  assert.equal(isGeminiQuotaError(rawApiError), true);
  assert.equal(isGeminiQuotaError({ status: 429 }), true);
  assert.equal(isGeminiQuotaError({ error: { status: 'RESOURCE_EXHAUSTED' } }), true);
  assert.equal(isGeminiQuotaError(new Error('Network timeout')), false);
});

test('extractRetryDelayMs parses retryDelay seconds and human durations safely', () => {
  const errWithJsonDelay = new Error('{"retryDelay":"1275s"}');
  assert.equal(extractRetryDelayMs(errWithJsonDelay), 1275 * 1000);

  const errWithHumanDelay = new Error('Please retry in 21m15.172s.');
  assert.equal(extractRetryDelayMs(errWithHumanDelay), 1275172);

  const errHugeDelay = new Error('{"retryDelay":"99999s"}');
  assert.equal(extractRetryDelayMs(errHugeDelay), MAX_QUOTA_COOLDOWN_MS);

  const errNoDelay = new Error('RESOURCE_EXHAUSTED');
  assert.equal(extractRetryDelayMs(errNoDelay), DEFAULT_QUOTA_COOLDOWN_MS);
});

test('formatSanitizedFallbackNotice strips raw ApiError JSON and 429 tokens', () => {
  const rawApiError = new Error(
    'ApiError: {"error":{"code":429,"message":"You exceeded your current quota","status":"RESOURCE_EXHAUSTED"}}'
  );
  const msg = formatSanitizedFallbackNotice('/api/construction-news', rawApiError, 15 * 60 * 1000);
  assert.ok(msg.includes('/api/construction-news'));
  assert.ok(msg.includes('15 min'));
  assert.equal(msg.includes('429'), false);
  assert.equal(msg.includes('RESOURCE_EXHAUSTED'), false);
  assert.equal(msg.includes('ApiError'), false);
});

test('createGeminiCooldownGuard activates shared cooldown and suppresses repeated logs', () => {
  const guard = createGeminiCooldownGuard();
  const t0 = 1_000_000;
  assert.equal(guard.isActive(t0), false);

  const quotaErr = new Error('{"error":{"code":429,"status":"RESOURCE_EXHAUSTED"},"retryDelay":"300s"}');
  const first = guard.recordFailure('/api/construction-news', quotaErr, t0);
  assert.equal(first.quotaLimited, true);
  assert.equal(first.cooldownMs, 300_000);
  assert.ok(first.logMessage);
  assert.equal(guard.isActive(t0 + 1000), true);

  const second = guard.recordFailure('/api/career-tips', new Error('Network error'), t0 + 2000);
  assert.equal(second.quotaLimited, false);
  assert.equal(second.cooldownMs, TRANSIENT_FAILURE_COOLDOWN_MS);
  assert.equal(second.logMessage, null);

  assert.equal(guard.isActive(t0 + 300_000), false);
});
