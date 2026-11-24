/**
 * @file src/utils/appErrorHandling.test.ts
 * @description Testes unitários para classificação de falhas de carregamento, detecção de erros
 *   fatais de módulos dinâmicos e formatação de relatório técnico da tela de erro.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyAppError,
  extractErrorDetails,
  formatErrorReportText,
  isFatalLoadError,
} from './appErrorHandling';

test('isFatalLoadError detects dynamic import and chunk load failures', () => {
  assert.equal(
    isFatalLoadError(new TypeError('Failed to fetch dynamically imported module: https://app/assets/EmployerPortal.js')),
    true
  );
  assert.equal(
    isFatalLoadError(new Error('ChunkLoadError: Loading chunk 42 failed.')),
    true
  );
  assert.equal(
    isFatalLoadError('Unable to preload CSS for /assets/index.css'),
    true
  );
  assert.equal(
    isFatalLoadError(new Error('ResizeObserver loop limit exceeded')),
    false
  );
  assert.equal(
    isFatalLoadError(new Error('API timeout while fetching optional weather')),
    false
  );
});

test('classifyAppError prioritizes chunk_load with reload guidance', () => {
  const descriptor = classifyAppError(
    new Error('Failed to fetch dynamically imported module: /assets/WorkerPortal.js'),
    { isOnline: true, scope: 'portal' }
  );

  assert.equal(descriptor.category, 'chunk_load');
  assert.equal(descriptor.code, 'ERR_CARREGAMENTO_MODULO');
  assert.equal(descriptor.preferReload, true);
  assert.match(descriptor.title, /não foi possível carregar este portal/i);
});

test('classifyAppError detects offline and network failures accurately', () => {
  const offlineDescriptor = classifyAppError(new Error('Load failed'), {
    isOnline: false,
    scope: 'app',
  });
  assert.equal(offlineDescriptor.category, 'network');
  assert.equal(offlineDescriptor.code, 'ERR_CONEXAO_REDE');
  assert.match(offlineDescriptor.title, /sem conexão/i);

  const onlineNetDescriptor = classifyAppError(new TypeError('Failed to fetch'), {
    isOnline: true,
    scope: 'app',
  });
  assert.equal(onlineNetDescriptor.category, 'network');
  assert.equal(onlineNetDescriptor.preferReload, false);
});

test('classifyAppError detects storage quota errors and generic render errors', () => {
  const quotaErr = new Error('QuotaExceededError: localStorage is full');
  const storageDescriptor = classifyAppError(quotaErr, { isOnline: true });
  assert.equal(storageDescriptor.category, 'storage');
  assert.equal(storageDescriptor.code, 'ERR_ARMAZENAMENTO_LOCAL');

  const renderDescriptor = classifyAppError(
    new Error('Cannot read properties of undefined'),
    { isOnline: true, scope: 'app' }
  );
  assert.equal(renderDescriptor.category, 'render');
  assert.equal(renderDescriptor.code, 'ERR_EXIBICAO_TELA');
});

test('extractErrorDetails and formatErrorReportText handle non-Error inputs safely', () => {
  const fromObj = extractErrorDetails({ reason: 'Importing a module script failed.' });
  assert.equal(fromObj.message, 'Importing a module script failed.');

  const descriptor = classifyAppError(new Error('Erro de teste'), { isOnline: true });
  const report = formatErrorReportText(descriptor, '2026-11-24T14:46:00.000Z');
  assert.match(report, /ERR_EXIBICAO_TELA/);
  assert.match(report, /2026-11-24T14:46:00.000Z/);
  assert.match(report, /Erro de teste/);
});
