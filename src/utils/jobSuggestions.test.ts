import test from 'node:test';
import assert from 'node:assert/strict';
import {
  appendRequirementSnippet,
  formatSuggestionForTextarea,
  getJobDescriptionSuggestions,
  getQuickRequirementsForRole,
} from './jobSuggestions';

test('getJobDescriptionSuggestions returns two tailored templates for known roles', () => {
  const pedreiro = getJobDescriptionSuggestions('Pedreiro', {
    experienceLevel: 'Experiente (3+ anos)',
    contractType: 'CLT',
    neighborhood: 'Vila Aurora',
  });
  assert.equal(pedreiro.length, 2);
  assert.match(pedreiro[0].descricao, /alvenaria/i);
  assert.match(pedreiro[0].descricao, /Vila Aurora/);
  assert.ok(
    pedreiro[0].requisitos.some((r) => r.includes('3+ anos'))
  );

  const eletricista = getJobDescriptionSuggestions('Eletricista Predial', {
    experienceLevel: 'Intermediário (1 a 3 anos)',
  });
  assert.equal(eletricista.length, 2);
  assert.match(eletricista[0].requisitos.join(' '), /NR-10/i);

  const instalacoes = getJobDescriptionSuggestions('Instalações Elétricas', {
    experienceLevel: 'Intermediário (1 a 3 anos)',
    neighborhood: 'Vila Aurora',
  });
  assert.equal(instalacoes.length, 2);
  assert.match(instalacoes[0].descricao, /NBR 5410/i);
  assert.match(instalacoes[0].requisitos.join(' '), /NR-10/i);

  const redes = getJobDescriptionSuggestions('Manutenção de Redes Elétricas', {
    experienceLevel: 'Experiente (3+ anos)',
  });
  assert.equal(redes.length, 2);
  assert.match(redes[0].descricao, /média tensão|redes elétricas/i);
  assert.match(redes[0].requisitos.join(' '), /SEP/i);
});

test('getJobDescriptionSuggestions generates contextual fallback for custom roles', () => {
  const custom = getJobDescriptionSuggestions('Gesseiro', {
    experienceLevel: 'Sem experiência / Auxiliar',
    neighborhood: 'Centro',
  });
  assert.equal(custom.length, 2);
  assert.match(custom[0].titulo, /Gesseiro/);
  assert.match(custom[0].descricao, /gesseiro/i);
  assert.match(custom[0].descricao, /Centro/);
  assert.ok(
    custom[0].requisitos.some((r) => /auxiliar|sem experiência/i.test(r))
  );
});

test('getQuickRequirementsForRole returns specific shortcuts for known and custom roles', () => {
  const armadorReqs = getQuickRequirementsForRole('Armador de Ferragem');
  assert.ok(armadorReqs.length >= 3);
  assert.ok(armadorReqs.some((r) => /estrutural/i.test(r)));

  const customReqs = getQuickRequirementsForRole('Vidraceiro');
  assert.ok(customReqs.length >= 3);
});

test('formatSuggestionForTextarea and appendRequirementSnippet build clean readable text without duplicates', () => {
  const [tpl] = getJobDescriptionSuggestions('Carpinteiro');
  const formatted = formatSuggestionForTextarea(tpl);
  assert.match(formatted, /Requisitos:/);
  assert.match(formatted, /• /);

  const withAdded = appendRequirementSnippet(formatted, 'Disponibilidade para horas extras');
  assert.match(withAdded, /• Disponibilidade para horas extras/);

  // Re-adding exact or case-insensitive snippet does not duplicate
  const deduplicated = appendRequirementSnippet(withAdded, 'disponibilidade para horas extras');
  assert.equal(deduplicated, withAdded);

  // Starting from empty textarea creates clean Requisitos section
  assert.equal(
    appendRequirementSnippet('', 'NR-35 em dia'),
    'Requisitos:\n• NR-35 em dia'
  );
});
