import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addSiteWorkEntry,
  buildWorkerProductivityDashboard,
  getAvailableProductivityMonths,
  SEEDED_WORKER_PRODUCTIVITY_LOGS,
  type SiteWorkEntry,
} from './workerProductivity.ts';

test('getAvailableProductivityMonths returns descending unique YYYY-MM options with pt-BR labels', () => {
  const months = getAvailableProductivityMonths(SEEDED_WORKER_PRODUCTIVITY_LOGS);
  assert.ok(months.length >= 2);
  assert.equal(months[0].monthKey, '2026-11');
  assert.equal(months[0].label, 'Novembro de 2026');
  assert.equal(months[1].monthKey, '2026-10');
  assert.equal(months[1].label, 'Outubro de 2026');
});

test('buildWorkerProductivityDashboard aggregates total hours, weighted productivity, and multi-site breakdown', () => {
  const entries: SiteWorkEntry[] = [
    {
      id: 'e1',
      date: '2026-11-02',
      siteId: 'site-vila-aurora',
      siteName: 'Residencial Vila Aurora',
      neighborhood: 'Vila Aurora',
      hoursWorked: 10,
      productivityPct: 90,
      taskSummary: 'Alvenaria',
    },
    {
      id: 'e2',
      date: '2026-11-04',
      siteId: 'site-distrito-ind',
      siteName: 'Galpão Logístico BR-163',
      neighborhood: 'Distrito Industrial',
      hoursWorked: 5,
      productivityPct: 75,
      taskSummary: 'Piso industrial',
    },
  ];

  const dashboard = buildWorkerProductivityDashboard({
    entries,
    monthKey: '2026-11',
    siteId: 'todos',
  });

  assert.equal(dashboard.totalHours, 15);
  assert.equal(dashboard.activeDaysCount, 2);
  assert.equal(dashboard.avgDailyHours, 7.5);
  // Weighted average: (10*90 + 5*75) / 15 = 1275 / 15 = 85%
  assert.equal(dashboard.avgProductivityPct, 85);
  assert.equal(dashboard.sitesCount, 2);
  assert.equal(dashboard.bySite.length, 2);
  assert.equal(dashboard.topSite?.siteId, 'site-vila-aurora');
  assert.equal(dashboard.bySite[0].sharePct, 67);
  assert.equal(dashboard.bySite[1].sharePct, 33);
});

test('buildWorkerProductivityDashboard filters daily series and KPIs by selected construction site while preserving month breakdown', () => {
  const dashboard = buildWorkerProductivityDashboard({
    entries: SEEDED_WORKER_PRODUCTIVITY_LOGS,
    monthKey: '2026-11',
    siteId: 'site-distrito-ind',
  });

  assert.equal(dashboard.sitesCount, 1);
  assert.equal(dashboard.dailySeries.length, 3);
  assert.equal(dashboard.totalHours, 27.5);
  // Month breakdown remains intact for comparison chart
  assert.equal(dashboard.bySite.length, 4);
  assert.equal(dashboard.topSite?.siteId, 'site-distrito-ind');
});

test('addSiteWorkEntry validates inputs and appends valid shifts in chronological order', () => {
  const invalidHours = addSiteWorkEntry(SEEDED_WORKER_PRODUCTIVITY_LOGS, {
    date: '2026-11-18',
    siteId: 'site-vila-aurora',
    hoursWorked: 20,
    productivityPct: 90,
    taskSummary: 'Reboco',
  });
  assert.equal(invalidHours.ok, false);

  const invalidTask = addSiteWorkEntry(SEEDED_WORKER_PRODUCTIVITY_LOGS, {
    date: '2026-11-18',
    siteId: 'site-vila-aurora',
    hoursWorked: 8,
    productivityPct: 90,
    taskSummary: 'ab',
  });
  assert.equal(invalidTask.ok, false);

  const valid = addSiteWorkEntry(SEEDED_WORKER_PRODUCTIVITY_LOGS, {
    date: '2026-11-18',
    siteId: 'site-vila-aurora',
    hoursWorked: 8,
    productivityPct: 98,
    taskSummary: 'Assentamento de piso cerâmico',
  });
  assert.equal(valid.ok, true);
  if (valid.ok) {
    assert.equal(valid.entries.length, SEEDED_WORKER_PRODUCTIVITY_LOGS.length + 1);
    assert.equal(valid.created.siteName, 'Residencial Vila Aurora');
    assert.equal(valid.created.productivityPct, 98);
  }
});
