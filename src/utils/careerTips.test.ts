import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterCareerTipsByFocus,
  getCuratedCareerTips,
  getIsoWeekInfo,
  normalizeCareerTipCategory,
  parseCareerTipsPayload,
} from './careerTips';

test('getIsoWeekInfo computes deterministic ISO week key and Portuguese label', () => {
  const info = getIsoWeekInfo(new Date(2026, 10, 14)); // Nov 14, 2026
  assert.equal(info.weekKey, '2026-W46');
  assert.equal(info.weekLabel, 'Semana 46 · Nov/2026');
});

test('normalizeCareerTipCategory maps variants to Currículo or Entrevista', () => {
  assert.equal(normalizeCareerTipCategory('entrevista'), 'Entrevista');
  assert.equal(normalizeCareerTipCategory('Entrevista Técnica'), 'Entrevista');
  assert.equal(normalizeCareerTipCategory('Currículo'), 'Currículo');
  assert.equal(normalizeCareerTipCategory('Perfil'), 'Currículo');
});

test('parseCareerTipsPayload parses valid JSON and strips markdown code fences', () => {
  const raw = [
    '```json',
    JSON.stringify({
      headline: 'Destaque suas obras recentes',
      summary: 'Organize seu histórico por tipo de obra e segurança no canteiro.',
      tips: [
        {
          category: 'Currículo',
          title: 'Detalhe tipos de alvenaria e acabamento',
          action: 'Informe se trabalhou com bloco estrutural, reboco ou porcelanato.',
          impact: 'Ajuda o mestre de obras a encaixar você na frente certa.',
        },
        {
          category: 'Entrevista',
          title: 'Mostre cuidado com EPI e prazos',
          action: 'Cite exemplos de cumprimento de cronograma e uso de NR-18.',
          impact: 'Transmite confiança imediata ao engenheiro responsável.',
        },
      ],
    }),
    '```',
  ].join('\n');

  const parsed = parseCareerTipsPayload(raw);
  assert.equal(parsed.headline, 'Destaque suas obras recentes');
  assert.equal(parsed.tips.length, 2);
  assert.equal(parsed.tips[0].category, 'Currículo');
  assert.equal(parsed.tips[1].category, 'Entrevista');
});

test('parseCareerTipsPayload throws when tips array is empty', () => {
  assert.throws(() =>
    parseCareerTipsPayload(JSON.stringify({ headline: 'Teste', summary: 'Ok', tips: [] }))
  );
});

test('filterCareerTipsByFocus filters Currículo and Entrevista cleanly', () => {
  const tips = [
    { category: 'Currículo' as const, title: 'A', action: 'B', impact: 'C' },
    { category: 'Entrevista' as const, title: 'D', action: 'E', impact: 'F' },
  ];
  assert.equal(filterCareerTipsByFocus(tips, 'todos').length, 2);
  assert.equal(filterCareerTipsByFocus(tips, 'curriculo').length, 1);
  assert.equal(filterCareerTipsByFocus(tips, 'entrevista').length, 1);
});

test('getCuratedCareerTips returns balanced fallback tips tailored to role and focus', () => {
  const bundle = getCuratedCareerTips({
    role: 'Eletricista Predial',
    focus: 'todos',
    notice: 'Modo offline',
    now: new Date(2026, 10, 23),
  });

  assert.equal(bundle.role, 'Eletricista Predial');
  assert.equal(bundle.tips.length, 4);
  assert.equal(filterCareerTipsByFocus(bundle.tips, 'curriculo').length, 2);
  assert.equal(filterCareerTipsByFocus(bundle.tips, 'entrevista').length, 2);
  assert.equal(bundle.notice, 'Modo offline');
});
