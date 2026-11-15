import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getOnboardingStepsForRole,
  markRoleOnboardingSeen,
  parseOnboardingSeenMap,
} from './onboarding.ts';

test('getOnboardingStepsForRole provides Vagas, Cadastro, and Perfil steps for both roles', () => {
  const workerSteps = getOnboardingStepsForRole('contratado');
  assert.equal(workerSteps.length, 3);
  assert.deepEqual(
    workerSteps.map((s) => s.tabLabel),
    ['Vagas', 'Cadastro', 'Perfil']
  );
  assert.deepEqual(
    workerSteps.map((s) => s.tabId),
    ['vagas', 'cadastro', 'perfil']
  );

  const employerSteps = getOnboardingStepsForRole('contratante');
  assert.equal(employerSteps.length, 3);
  assert.deepEqual(
    employerSteps.map((s) => s.tabLabel),
    ['Vagas', 'Cadastro', 'Perfil']
  );
  assert.deepEqual(
    employerSteps.map((s) => s.tabId),
    ['vagas', 'cadastro', 'profissionais']
  );
});

test('parseOnboardingSeenMap handles null, malformed JSON, and valid role flags', () => {
  assert.deepEqual(parseOnboardingSeenMap(null), {
    contratado: false,
    contratante: false,
  });
  assert.deepEqual(parseOnboardingSeenMap('{bad-json'), {
    contratado: false,
    contratante: false,
  });
  assert.deepEqual(
    parseOnboardingSeenMap(JSON.stringify({ contratado: true })),
    { contratado: true, contratante: false }
  );
});

test('markRoleOnboardingSeen marks only the target role without mutating input', () => {
  const initial = { contratado: false, contratante: false };
  const updated = markRoleOnboardingSeen(initial, 'contratado');
  assert.deepEqual(initial, { contratado: false, contratante: false });
  assert.deepEqual(updated, { contratado: true, contratante: false });
});
