import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  getCuratedConstructionNews,
  filterConstructionNews,
  parseConstructionNewsPayload,
  CONSTRUCTION_NEWS_CATEGORIES,
} from './constructionNews.ts';

test('getCuratedConstructionNews returns Mato Grosso & Rondonópolis headlines', () => {
  const payload = getCuratedConstructionNews();
  assert.ok(payload.items.length >= 5);
  assert.equal(payload.source, 'curated_feed');
  assert.ok(payload.headlineBanner.includes('Ferrovia') || payload.headlineBanner.includes('Rondonópolis'));

  const ferrovias = payload.items.find((i) => i.category === 'ferrovias');
  assert.ok(ferrovias);
  assert.ok(ferrovias.title.includes('Ferrovia'));
  assert.ok(ferrovias.url.startsWith('http'));
  assert.ok(ferrovias.jobImpact.length > 5);
});

test('filterConstructionNews correctly filters by category and search keyword', () => {
  const payload = getCuratedConstructionNews();

  const ferroviasOnly = filterConstructionNews(payload.items, 'ferrovias');
  assert.ok(ferroviasOnly.length > 0);
  assert.ok(ferroviasOnly.every((i) => i.category === 'ferrovias'));

  const rodoviasOnly = filterConstructionNews(payload.items, 'rodovias');
  assert.ok(rodoviasOnly.length > 0);
  assert.ok(rodoviasOnly.every((i) => i.category === 'rodovias'));

  const querySearch = filterConstructionNews(payload.items, 'todas', 'BR-163');
  assert.ok(querySearch.length > 0);
  assert.ok(querySearch.some((i) => i.title.includes('BR-163') || i.summary.includes('BR-163')));
});

test('parseConstructionNewsPayload handles structured search results with grounding chunks', () => {
  const fakeAiResponse = JSON.stringify({
    headlineBanner: 'Novas obras de infraestrutura aceleram contratações em MT',
    items: [
      {
        id: 'news-1',
        title: 'Duplicação do trecho sul da BR-163 recebe novos maquinários',
        summary: 'Equipes atuam em ritmo acelerado entre Rondonópolis e Jaciara.',
        source: 'Sinfra-MT',
        category: 'rodovias',
        location: 'Rondonópolis - MT',
        relativeDate: 'Hoje',
        jobImpact: 'Contratações para operadores de rolo compactador e motoristas.',
      },
    ],
  });

  const groundingChunks = [
    { web: { uri: 'https://noticias.mt.gov.br/obras-br163', title: 'Obras BR-163' } },
  ];

  const parsed = parseConstructionNewsPayload(fakeAiResponse, groundingChunks);
  assert.equal(parsed.source, 'gemini_search');
  assert.equal(parsed.items.length, 1);
  assert.equal(parsed.items[0].url, 'https://noticias.mt.gov.br/obras-br163');
  assert.equal(parsed.items[0].category, 'rodovias');
  assert.equal(parsed.items[0].categoryLabel, 'BR-163 & Rodovias');
});

test('parseConstructionNewsPayload gracefully falls back when given invalid input', () => {
  const emptyParsed = parseConstructionNewsPayload('');
  assert.ok(emptyParsed.items.length >= 5);
  assert.equal(emptyParsed.source, 'curated_feed');
});

test('CONSTRUCTION_NEWS_CATEGORIES has essential category tabs', () => {
  const ids = CONSTRUCTION_NEWS_CATEGORIES.map((c) => c.id);
  assert.ok(ids.includes('todas'));
  assert.ok(ids.includes('ferrovias'));
  assert.ok(ids.includes('rodovias'));
  assert.ok(ids.includes('obras_urbanas'));
  assert.ok(ids.includes('habitacao'));
});
