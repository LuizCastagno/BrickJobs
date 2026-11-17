import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDailySafetyQuiz,
  buildSafetyLeaderboard,
  calculateQuizPoints,
  DAILY_SAFETY_TIPS,
  EMPTY_WORKER_SAFETY_STATS,
  evaluateSafetyQuizAnswers,
  filterSafetyTips,
  getDailySafetyTip,
  getDailyTipIndex,
  getLocalDateKey,
  isTipRelevantToRole,
  recordWorkerQuizAttempt,
  SAFETY_QUIZ_QUESTIONS,
  toggleAcknowledgedSafetyTip,
} from './safetyTips.ts';

test('DAILY_SAFETY_TIPS entries have complete NR references, practices, and PPE items', () => {
  assert.ok(DAILY_SAFETY_TIPS.length >= 10);
  for (const tip of DAILY_SAFETY_TIPS) {
    assert.ok(tip.id.length > 0);
    assert.ok(tip.nrReference.includes('NR-'));
    assert.ok(tip.title.trim().length > 10);
    assert.ok(tip.recommendedPractice.trim().length > 20);
    assert.ok(tip.whyItMatters.trim().length > 15);
    assert.ok(tip.requiredPpe.length >= 2);
  }
});

test('getLocalDateKey formats YYYY-MM-DD in local calendar values', () => {
  const d = new Date(2026, 10, 16, 13, 25, 0);
  assert.equal(getLocalDateKey(d), '2026-11-16');
});

test('getDailyTipIndex is deterministic per day and rotates on consecutive days', () => {
  const day1 = new Date(2026, 10, 16, 9, 0, 0);
  const day1Later = new Date(2026, 10, 16, 21, 30, 0);
  const day2 = new Date(2026, 10, 17, 9, 0, 0);

  const idx1 = getDailyTipIndex(day1, DAILY_SAFETY_TIPS.length, 'Pedreiro');
  const idx1Later = getDailyTipIndex(
    day1Later,
    DAILY_SAFETY_TIPS.length,
    'Pedreiro'
  );
  const idx2 = getDailyTipIndex(day2, DAILY_SAFETY_TIPS.length, 'Pedreiro');

  assert.equal(idx1, idx1Later);
  assert.notEqual(idx1, idx2);
});

test('filterSafetyTips isolates each safety category accurately', () => {
  const epis = filterSafetyTips(DAILY_SAFETY_TIPS, 'epis');
  assert.ok(epis.length >= 2);
  assert.ok(epis.every((t) => t.category === 'epis'));

  const all = filterSafetyTips(DAILY_SAFETY_TIPS, 'todos');
  assert.equal(all.length, DAILY_SAFETY_TIPS.length);
});

test('getDailySafetyTip wraps positive and negative navigation offsets cleanly', () => {
  const date = new Date(2026, 10, 16);
  const first = getDailySafetyTip({ date, category: 'epis', offset: 0 });
  const next = getDailySafetyTip({ date, category: 'epis', offset: 1 });
  const wrappedBack = getDailySafetyTip({
    date,
    category: 'epis',
    offset: -first.totalInScope,
  });

  assert.equal(first.dateKey, '2026-11-16');
  assert.notEqual(first.tip.id, next.tip.id);
  assert.equal(wrappedBack.tip.id, first.tip.id);
});

test('isTipRelevantToRole matches accent-insensitively and ignores generic tags', () => {
  const eletricaTip = DAILY_SAFETY_TIPS.find(
    (t) => t.id === 'eletrica-bloqueio-quadro'
  )!;
  assert.equal(isTipRelevantToRole(eletricaTip, 'Eletricista Predial'), true);
  assert.equal(isTipRelevantToRole(eletricaTip, 'Servente de Obras'), false);

  const helmetTip = DAILY_SAFETY_TIPS.find(
    (t) => t.id === 'epi-capacete-jugular'
  )!;
  assert.equal(isTipRelevantToRole(helmetTip, 'Pintor'), false);
});

test('toggleAcknowledgedSafetyTip adds and removes tip IDs cleanly', () => {
  const added = toggleAcknowledgedSafetyTip([], 'epi-capacete-jugular');
  assert.deepEqual(added, ['epi-capacete-jugular']);

  const removed = toggleAcknowledgedSafetyTip(added, 'epi-capacete-jugular');
  assert.deepEqual(removed, []);
});

test('SAFETY_QUIZ_QUESTIONS covers every daily tip with 3 valid options', () => {
  assert.equal(SAFETY_QUIZ_QUESTIONS.length, DAILY_SAFETY_TIPS.length);
  for (const tip of DAILY_SAFETY_TIPS) {
    const match = SAFETY_QUIZ_QUESTIONS.find((q) => q.tipId === tip.id);
    assert.ok(match, `Missing quiz question for tip ${tip.id}`);
    assert.equal(match.options.length, 3);
    assert.ok(match.correctIndex >= 0 && match.correctIndex <= 2);
    assert.ok(match.explanation.trim().length > 15);
  }
});

test('buildDailySafetyQuiz starts with primary tip and returns distinct questions', () => {
  const quiz = buildDailySafetyQuiz({
    primaryTipId: 'epi-respiratorio-cimento',
    dateKey: '2026-11-16',
    count: 3,
  });

  assert.equal(quiz.length, 3);
  assert.equal(quiz[0].tipId, 'epi-respiratorio-cimento');
  const uniqueIds = new Set(quiz.map((q) => q.id));
  assert.equal(uniqueIds.size, 3);
});

test('evaluateSafetyQuizAnswers computes score, percentage, and pass threshold accurately', () => {
  const quiz = buildDailySafetyQuiz({
    primaryTipId: 'epi-capacete-jugular',
    dateKey: '2026-11-16',
    count: 3,
  });

  const perfect = evaluateSafetyQuizAnswers(
    quiz,
    quiz.map((q) => q.correctIndex)
  );
  assert.equal(perfect.total, 3);
  assert.equal(perfect.correctCount, 3);
  assert.equal(perfect.percentage, 100);
  assert.equal(perfect.passed, true);

  const partial = evaluateSafetyQuizAnswers(quiz, [
    quiz[0].correctIndex,
    (quiz[1].correctIndex + 1) % 3,
    (quiz[2].correctIndex + 1) % 3,
  ]);
  assert.equal(partial.correctCount, 1);
  assert.equal(partial.percentage, 33);
  assert.equal(partial.passed, false);
});

test('calculateQuizPoints awards 10 pts per correct answer plus 5 bonus for 100%', () => {
  assert.equal(calculateQuizPoints({ correctCount: 3, total: 3 }), 35);
  assert.equal(calculateQuizPoints({ correctCount: 2, total: 3 }), 20);
  assert.equal(calculateQuizPoints({ correctCount: 1, total: 3 }), 10);
  assert.equal(calculateQuizPoints({ correctCount: 0, total: 3 }), 0);
});

test('recordWorkerQuizAttempt accumulates points, quizzes completed, and accuracy stats', () => {
  const summary = {
    total: 3,
    correctCount: 3,
    percentage: 100,
    passed: true,
    items: [],
  };

  const first = recordWorkerQuizAttempt(EMPTY_WORKER_SAFETY_STATS, summary);
  assert.equal(first.pointsEarned, 35);
  assert.equal(first.nextStats.points, 35);
  assert.equal(first.nextStats.quizzesCompleted, 1);
  assert.equal(first.nextStats.totalCorrect, 3);
  assert.equal(first.nextStats.totalAnswered, 3);
});

test('buildSafetyLeaderboard ranks Top 3 and promotes current worker upon scoring', () => {
  const before = buildSafetyLeaderboard({
    workerName: 'João Silva',
    workerRole: 'Pedreiro',
    workerRegion: 'Vila Aurora',
    stats: EMPTY_WORKER_SAFETY_STATS,
  });

  assert.equal(before.topThree.length, 3);
  assert.equal(before.topThree[0].rank, 1);
  assert.equal(before.currentUserEntry.rank, 5);
  assert.equal(before.pointsToTopThree, 21);

  const afterPerfect = buildSafetyLeaderboard({
    workerName: 'João Silva',
    workerRole: 'Pedreiro',
    workerRegion: 'Vila Aurora',
    stats: {
      points: 35,
      quizzesCompleted: 1,
      totalCorrect: 3,
      totalAnswered: 3,
      lastUpdatedAt: '2026-11-16T23:40:00.000Z',
    },
  });

  assert.equal(afterPerfect.currentUserEntry.rank, 3);
  assert.equal(afterPerfect.pointsToTopThree, 0);
  assert.equal(afterPerfect.topThree[2].isCurrentUser, true);
  assert.equal(afterPerfect.topThree[2].name, 'João Silva');
});


