import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  getIsoWeekString,
  getCuratedSafetyWeeklyReminders,
  parseSafetyWeeklyTipsPayload,
  toggleWeeklyEpiChecklistItem,
  getCategoryLabel,
  formatCategoryBadgeStyle,
} from './safetyWeeklyTips.ts';

test('getIsoWeekString returns correct ISO week info format', () => {
  const d = new Date(2026, 10, 18); // Nov 18, 2026
  const weekInfo = getIsoWeekString(d);
  assert.ok(weekInfo.weekKey.startsWith('2026-W'));
  assert.ok(weekInfo.weekLabel.includes('Semana'));
  assert.equal(typeof weekInfo.weekNumber, 'number');
  assert.equal(weekInfo.year, 2026);
});

test('getCuratedSafetyWeeklyReminders provides comprehensive default PPE highlights', () => {
  const payload0 = getCuratedSafetyWeeklyReminders(0);
  assert.ok(payload0.weeklyHighlights.length >= 4);
  assert.equal(payload0.source, 'curated');
  assert.ok(payload0.themeTitle.length > 5);

  const capacete = payload0.weeklyHighlights.find((h) => h.category === 'cabeca');
  assert.ok(capacete);
  assert.ok(capacete.inspectionChecklist.length >= 2);
  assert.ok(capacete.nrReference.includes('NR'));

  const payload1 = getCuratedSafetyWeeklyReminders(1);
  const oculos = payload1.weeklyHighlights.find((h) => h.category === 'olhos');
  assert.ok(oculos);

  const payload2 = getCuratedSafetyWeeklyReminders(2);
  assert.ok(payload2.themeTitle.includes('NR-11'));
  assert.ok(payload2.themeTitle.includes('NR-12'));
  assert.ok(
    payload2.weeklyHighlights.every(
      (h) =>
        Array.isArray(h.requiredCompetencies) &&
        h.requiredCompetencies.length >= 2 &&
        Array.isArray(h.preferredCompetencies) &&
        h.preferredCompetencies.length >= 2
    )
  );
});

test('parseSafetyWeeklyTipsPayload handles valid structured JSON from Gemini', () => {
  const rawJson = JSON.stringify({
    weekKey: '2026-W47',
    weekLabel: 'Semana 47/2026',
    themeTitle: 'Semana de Proteção Contra Poeiras e Altura',
    themeDescription: 'Foco especial em lixamento e montagem de andaimes.',
    generalNotice: 'DDS às 07:00 com o Técnico em Segurança.',
    weeklyHighlights: [
      {
        id: 'epi-mascara-teste',
        epiName: 'Máscara PFF2 Carvão Ativado',
        category: 'respiratoria',
        title: 'Proteção contra poeiras finas',
        nrReference: 'NR-06',
        whyItMatters: 'Evita inalação de partículas tóxicas.',
        inspectionChecklist: ['Verificar elástico', 'Ajustar clipe nasal'],
        commonMistakes: ['Usar frouxo'],
        penaltyOrRisk: 'Comprometimento respiratório',
        requiredCompetencies: ['Teste prático de vedação PFF2 (NR-06)'],
        preferredCompetencies: ['Experiência em obras de construção seca'],
      },
      {
        id: 'epi-cinto-teste',
        epiName: 'Cinto Paraquedista NR-35',
        category: 'altura',
        title: 'Ancoragem dupla',
        nrReference: 'NR-35',
        whyItMatters: 'Proteção contra queda de desnível.',
        inspectionChecklist: ['Verificar costuras', 'Testar mosquetão'],
        commonMistakes: ['Conectar em ponto fraco'],
        penaltyOrRisk: 'Queda fatal',
      },
    ],
  });

  const parsed = parseSafetyWeeklyTipsPayload(rawJson);
  assert.equal(parsed.source, 'gemini');
  assert.equal(parsed.themeTitle, 'Semana de Proteção Contra Poeiras e Altura');
  assert.equal(parsed.weeklyHighlights.length, 2);
  assert.equal(parsed.weeklyHighlights[0].category, 'respiratoria');
  assert.equal(parsed.weeklyHighlights[0].categoryLabel, 'Vias Respiratórias');
  assert.deepEqual(parsed.weeklyHighlights[0].requiredCompetencies, [
    'Teste prático de vedação PFF2 (NR-06)',
  ]);
  assert.deepEqual(parsed.weeklyHighlights[0].preferredCompetencies, [
    'Experiência em obras de construção seca',
  ]);
});

test('parseSafetyWeeklyTipsPayload gracefully falls back on malformed or empty responses', () => {
  const fallback = parseSafetyWeeklyTipsPayload('invalid json string');
  assert.ok(fallback.weeklyHighlights.length >= 3);
  assert.ok(fallback.themeTitle.length > 0);

  const nullFallback = parseSafetyWeeklyTipsPayload(null);
  assert.ok(nullFallback.weeklyHighlights.length >= 3);
});

test('toggleWeeklyEpiChecklistItem toggles check state cleanly', () => {
  const initial = { 'check-1': true };
  const afterRemove = toggleWeeklyEpiChecklistItem(initial, 'check-1');
  assert.equal(afterRemove['check-1'], undefined);

  const afterAdd = toggleWeeklyEpiChecklistItem(afterRemove, 'check-2');
  assert.equal(afterAdd['check-2'], true);
});

test('category labels and badge styles are defined for all categories', () => {
  assert.equal(getCategoryLabel('cabeca'), 'Cabeça e Crânio');
  assert.equal(getCategoryLabel('altura'), 'Trabalho em Altura (NR-35)');

  const style = formatCategoryBadgeStyle('altura');
  assert.ok(style.bgClass.includes('red'));
});
