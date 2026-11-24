/**
 * @file src/utils/siteSafetyGuides.test.ts
 * @description Testes unitários para o catálogo offline de dicas de segurança no canteiro de obras,
 *   filtragem por tema/busca e persistência de favoritos e snapshot local.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterSiteSafetyGuides,
  isSiteSafetyGuideRelevantToRole,
  loadOfflineSiteSafetySnapshot,
  saveOfflineSiteSafetySnapshot,
  SITE_SAFETY_GUIDES,
  toggleSavedSiteSafetyGuide,
} from './siteSafetyGuides';

test('SITE_SAFETY_GUIDES provides complete offline-bundled construction safety guides', () => {
  assert.ok(SITE_SAFETY_GUIDES.length >= 6);
  for (const guide of SITE_SAFETY_GUIDES) {
    assert.ok(guide.title.length > 5);
    assert.ok(guide.doList.length >= 2);
    assert.ok(guide.avoidList.length >= 2);
    assert.ok(guide.emergencyAction.length > 10);
  }
});

test('filterSiteSafetyGuides filters by category, search query, and saved items', () => {
  const alturaGuides = filterSiteSafetyGuides(SITE_SAFETY_GUIDES, {
    category: 'altura',
  });
  assert.equal(alturaGuides.length, 1);
  assert.equal(alturaGuides[0]?.id, 'site-altura-ancoragem');

  const queryGuides = filterSiteSafetyGuides(SITE_SAFETY_GUIDES, {
    query: 'Rondonópolis',
  });
  assert.ok(queryGuides.some((g) => g.id === 'site-calor-hidratacao-rondonopolis'));

  const savedOnly = filterSiteSafetyGuides(SITE_SAFETY_GUIDES, {
    onlySaved: true,
    savedIds: ['site-eletrica-bloqueio'],
  });
  assert.equal(savedOnly.length, 1);
  assert.equal(savedOnly[0]?.id, 'site-eletrica-bloqueio');
});

test('isSiteSafetyGuideRelevantToRole matches worker primary role', () => {
  const electricalGuide = SITE_SAFETY_GUIDES.find(
    (g) => g.id === 'site-eletrica-bloqueio'
  )!;
  assert.equal(
    isSiteSafetyGuideRelevantToRole(electricalGuide, 'Eletricista Predial'),
    true
  );
  assert.equal(
    isSiteSafetyGuideRelevantToRole(electricalGuide, 'Pintor Predial'),
    false
  );
});

test('offline snapshot and saved guides helpers work deterministically', () => {
  const snapshot = saveOfflineSiteSafetySnapshot(
    SITE_SAFETY_GUIDES,
    new Date('2026-11-24T12:00:00.000Z')
  );
  assert.equal(snapshot.guides.length, SITE_SAFETY_GUIDES.length);
  assert.equal(snapshot.syncedAt, '2026-11-24T12:00:00.000Z');

  const loaded = loadOfflineSiteSafetySnapshot();
  assert.equal(loaded.guides.length, SITE_SAFETY_GUIDES.length);

  const afterAdd = toggleSavedSiteSafetyGuide([], 'site-altura-ancoragem');
  assert.deepEqual(afterAdd, ['site-altura-ancoragem']);

  const afterRemove = toggleSavedSiteSafetyGuide(afterAdd, 'site-altura-ancoragem');
  assert.deepEqual(afterRemove, []);
});
