import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateProportionalNoticeDays,
  calculateProportionalVacationMonths,
  calculateSeverance,
  calculateThirteenthMonthsInYear,
  calculateTotalServiceMonths,
} from './severanceCalculator';

test('calculateProportionalNoticeDays applies Lei 12.506/2011 and caps at 90 days', () => {
  assert.equal(calculateProportionalNoticeDays(0), 30);
  assert.equal(calculateProportionalNoticeDays(1), 33);
  assert.equal(calculateProportionalNoticeDays(2), 36);
  assert.equal(calculateProportionalNoticeDays(25), 90);
});

test('calculateTotalServiceMonths and thirteenth month rules respect >=15 days rule', () => {
  assert.equal(calculateTotalServiceMonths('2026-01-01', '2026-06-30'), 6);
  assert.equal(calculateTotalServiceMonths('2026-01-10', '2026-02-25'), 2);
  assert.equal(calculateThirteenthMonthsInYear('2026-03-10', '2026-07-20'), 5);
  assert.equal(calculateProportionalVacationMonths('2025-05-01', '2026-10-20'), 6);
});

test('calculateSeverance computes full sem_justa_causa package including 40% FGTS fine', () => {
  const result = calculateSeverance({
    monthlySalary: 3000,
    admissionDate: '2024-03-01',
    terminationDate: '2026-11-15',
    reason: 'sem_justa_causa',
    noticeType: 'indenizado',
    workedDaysInLastMonth: 15,
    overdueVacationPeriods: 1,
    dependents: 0,
  });

  assert.equal(result.valid, true);
  assert.equal(result.serviceYears, 2);
  assert.equal(result.proportionalNoticeDays, 36);
  assert.ok(result.grossTotal > 12000);
  assert.ok(result.fgtsFineAmount > 2500);
  assert.equal(
    result.items.some((item) => item.id === 'aviso-previo-indenizado'),
    true
  );
  assert.equal(
    result.items.some((item) => item.id === 'ferias-vencidas'),
    true
  );
  assert.equal(
    result.items.some((item) => item.id === 'multa-fgts'),
    true
  );
});

test('calculateSeverance handles pedido_demissao without FGTS fine and with notice deduction when not worked', () => {
  const result = calculateSeverance({
    monthlySalary: 2500,
    admissionDate: '2025-01-10',
    terminationDate: '2026-09-20',
    reason: 'pedido_demissao',
    noticeType: 'indenizado',
    workedDaysInLastMonth: 20,
    overdueVacationPeriods: 0,
    dependents: 0,
  });

  assert.equal(result.valid, true);
  assert.equal(result.fgtsFineAmount, 0);
  assert.equal(
    result.items.some((item) => item.id === 'desconto-aviso-previo'),
    true
  );
});

test('calculateSeverance handles acordo_mutuo with 50% notice and 20% FGTS fine', () => {
  const result = calculateSeverance({
    monthlySalary: 4000,
    admissionDate: '2025-01-01',
    terminationDate: '2026-06-30',
    reason: 'acordo_mutuo',
    noticeType: 'indenizado',
    workedDaysInLastMonth: 30,
    overdueVacationPeriods: 0,
    dependents: 1,
    fgtsBalanceOverride: 5000,
  });

  assert.equal(result.valid, true);
  const noticeItem = result.items.find((i) => i.id === 'aviso-previo-acordo');
  assert.ok(noticeItem);
  // 1 completed year => 33 notice days; half of 33 days at 4000/mo = 2200
  assert.equal(noticeItem.amount, 2200);
  assert.ok(result.fgtsFineAmount > 1000);
});

test('calculateSeverance handles justa_causa and rejects invalid dates', () => {
  const justaCausa = calculateSeverance({
    monthlySalary: 2200,
    admissionDate: '2024-01-01',
    terminationDate: '2026-06-15',
    reason: 'justa_causa',
    noticeType: 'dispensado',
    workedDaysInLastMonth: 15,
    overdueVacationPeriods: 0,
    dependents: 0,
  });
  assert.equal(justaCausa.valid, true);
  assert.equal(justaCausa.fgtsFineAmount, 0);
  assert.equal(justaCausa.grossTotal, 1100);

  const invalid = calculateSeverance({
    monthlySalary: 2200,
    admissionDate: '2026-10-01',
    terminationDate: '2026-05-01',
    reason: 'sem_justa_causa',
    noticeType: 'indenizado',
    workedDaysInLastMonth: 10,
    overdueVacationPeriods: 0,
    dependents: 0,
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.error);
});
