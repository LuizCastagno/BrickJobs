import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHAT_MODAL_TRANSITION,
  CHAT_MODAL_VARIANTS,
  INITIAL_SPLASH_DURATION_MS,
  JOB_CARD_MAX_STAGGER_SEC,
  JOB_CARD_VARIANTS,
  PAGE_TRANSITION_CONFIG,
  PAGE_TRANSITION_VARIANTS,
  ROUTE_TRANSITION_DURATION_MS,
  SPLASH_OVERLAY_VARIANTS,
  TAB_TRANSITION_CONFIG,
  TAB_TRANSITION_VARIANTS,
  getJobCardEnterDelay,
  getRouteTransitionLabel,
} from './motionPresets';

test('getJobCardEnterDelay handles zero, negative, and caps stagger delay cleanly', () => {
  assert.equal(getJobCardEnterDelay(-2), 0);
  assert.equal(getJobCardEnterDelay(0), 0);
  assert.equal(getJobCardEnterDelay(1), 0.035);
  assert.equal(getJobCardEnterDelay(2), 0.07);
  assert.equal(getJobCardEnterDelay(20), JOB_CARD_MAX_STAGGER_SEC);
});

test('motion presets stay within snappy 250ms interactive budgets and use compositor properties', () => {
  assert.ok(CHAT_MODAL_TRANSITION.duration <= 0.25);
  assert.ok(PAGE_TRANSITION_CONFIG.duration <= 0.25);
  assert.ok(TAB_TRANSITION_CONFIG.duration <= 0.22);

  assert.deepEqual(Object.keys(CHAT_MODAL_VARIANTS.initial).sort(), [
    'opacity',
    'scale',
    'y',
  ]);
  assert.deepEqual(Object.keys(JOB_CARD_VARIANTS.initial).sort(), [
    'opacity',
    'scale',
    'y',
  ]);
  assert.deepEqual(Object.keys(PAGE_TRANSITION_VARIANTS.initial).sort(), [
    'opacity',
    'scale',
    'y',
  ]);
  assert.deepEqual(Object.keys(TAB_TRANSITION_VARIANTS.initial).sort(), [
    'opacity',
    'y',
  ]);

  assert.equal(JOB_CARD_VARIANTS.exit.transition.delay, 0);
  assert.equal(PAGE_TRANSITION_VARIANTS.exit.transition.delay, 0);
  assert.equal(TAB_TRANSITION_VARIANTS.exit.transition.delay, 0);
  assert.equal(SPLASH_OVERLAY_VARIANTS.exit.transition.delay, 0);
  assert.ok(JOB_CARD_VARIANTS.exit.transition.duration <= 0.2);
});

test('loading overlay durations and route transition labels are well bounded in pt-BR', () => {
  assert.ok(INITIAL_SPLASH_DURATION_MS >= 400 && INITIAL_SPLASH_DURATION_MS <= 1000);
  assert.ok(ROUTE_TRANSITION_DURATION_MS >= 180 && ROUTE_TRANSITION_DURATION_MS <= 400);

  assert.match(getRouteTransitionLabel('contratante'), /Construtora/);
  assert.match(getRouteTransitionLabel('contratado'), /Contratado/);
  assert.match(getRouteTransitionLabel('cover'), /inicial/);
});
