/**
 * @file src/utils/severanceCalculator.ts
 * @description Motor de cálculo estimativo de rescisão trabalhista CLT com cenários pré-configurados da construção civil.
 */

export type TerminationReason =
  | 'sem_justa_causa'
  | 'pedido_demissao'
  | 'acordo_mutuo'
  | 'termino_contrato'
  | 'justa_causa';

export type NoticeType = 'indenizado' | 'trabalhado' | 'dispensado';

export interface SeveranceInput {
  monthlySalary: number;
  admissionDate: string; // YYYY-MM-DD
  terminationDate: string; // YYYY-MM-DD
  reason: TerminationReason;
  noticeType: NoticeType;
  workedDaysInLastMonth: number;
  overdueVacationPeriods: number;
  dependents: number;
  fgtsBalanceOverride?: number | null;
}

export type SeveranceItemKind = 'provento' | 'desconto' | 'fgts';

export interface SeveranceLineItem {
  id: string;
  label: string;
  reference: string;
  amount: number;
  kind: SeveranceItemKind;
  note?: string;
}

export interface SeveranceResult {
  valid: boolean;
  error?: string;
  serviceYears: number;
  serviceMonthsTotal: number;
  proportionalNoticeDays: number;
  thirteenthMonths: number;
  proportionalVacationMonths: number;
  estimatedFgtsDepositBase: number;
  fgtsFineAmount: number;
  grossTotal: number;
  totalDeductions: number;
  netTotal: number;
  totalWithFgtsFine: number;
  items: SeveranceLineItem[];
  legalNotes: string[];
}

export interface TerminationReasonOption {
  value: TerminationReason;
  label: string;
  summary: string;
}

export const TERMINATION_REASON_OPTIONS: TerminationReasonOption[] = [
  {
    value: 'sem_justa_causa',
    label: 'Demissão sem justa causa',
    summary: 'Direito a aviso prévio proporcional, 13º, férias + 1/3 e multa de 40% do FGTS.',
  },
  {
    value: 'pedido_demissao',
    label: 'Pedido de demissão',
    summary: 'Recebe saldo, 13º e férias proporcionais + 1/3; sem multa do FGTS.',
  },
  {
    value: 'acordo_mutuo',
    label: 'Acordo mútuo (Art. 484-A CLT)',
    summary: '50% do aviso prévio indenizado, multa de 20% do FGTS e saque de até 80% do saldo.',
  },
  {
    value: 'termino_contrato',
    label: 'Término de contrato / obra certa',
    summary: 'Encerramento no prazo combinado: saldo, 13º e férias proporcionais + 1/3.',
  },
  {
    value: 'justa_causa',
    label: 'Demissão por justa causa',
    summary: 'Apenas saldo de salário e eventuais férias vencidas + 1/3.',
  },
];

export interface SeverancePreset {
  id: string;
  label: string;
  monthlySalary: number;
  monthsAgo: number;
  reason: TerminationReason;
  noticeType: NoticeType;
}

export const CONSTRUCTION_SEVERANCE_PRESETS: SeverancePreset[] = [
  {
    id: 'pedreiro-sem-justa',
    label: 'Pedreiro · R$ 2.800 (20 meses)',
    monthlySalary: 2800,
    monthsAgo: 20,
    reason: 'sem_justa_causa',
    noticeType: 'indenizado',
  },
  {
    id: 'servente-obra-certa',
    label: 'Servente · R$ 1.850 (6 meses)',
    monthlySalary: 1850,
    monthsAgo: 6,
    reason: 'termino_contrato',
    noticeType: 'dispensado',
  },
  {
    id: 'eletricista-acordo',
    label: 'Eletricista · R$ 3.900 (36 meses)',
    monthlySalary: 3900,
    monthsAgo: 36,
    reason: 'acordo_mutuo',
    noticeType: 'indenizado',
  },
];

function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function parseIsoDateParts(
  isoDate: string
): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const check = new Date(Date.UTC(year, month - 1, day));
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

function toUtcDate(parts: { year: number; month: number; day: number }): Date {
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
}

export function addDaysIsoDate(isoDate: string, days: number): string {
  const parts = parseIsoDateParts(isoDate);
  if (!parts) return isoDate;
  const d = toUtcDate(parts);
  d.setUTCDate(d.getUTCDate() + Math.round(days));
  return d.toISOString().slice(0, 10);
}

export function getDefaultWorkedDaysFromDate(isoDate: string): number {
  const parts = parseIsoDateParts(isoDate);
  if (!parts) return 15;
  return Math.min(30, Math.max(1, parts.day));
}

export function calculateCompletedServiceYears(
  admissionIso: string,
  terminationIso: string
): number {
  const start = parseIsoDateParts(admissionIso);
  const end = parseIsoDateParts(terminationIso);
  if (!start || !end) return 0;

  let years = end.year - start.year;
  if (
    end.month < start.month ||
    (end.month === start.month && end.day < start.day)
  ) {
    years -= 1;
  }
  return Math.max(0, years);
}

export function calculateTotalServiceMonths(
  admissionIso: string,
  terminationIso: string
): number {
  const start = parseIsoDateParts(admissionIso);
  const end = parseIsoDateParts(terminationIso);
  if (!start || !end) return 0;

  const startDate = toUtcDate(start);
  const endDate = toUtcDate(end);
  if (endDate < startDate) return 0;

  let months =
    (end.year - start.year) * 12 + (end.month - start.month);
  const dayDiff = end.day - start.day + 1;
  if (dayDiff >= 15) {
    months += 1;
  } else if (dayDiff <= 0) {
    months = Math.max(0, months - 1);
    const prevMonthEndDays = new Date(
      Date.UTC(end.year, end.month - 1, 0)
    ).getUTCDate();
    const remainingDays = prevMonthEndDays - start.day + 1 + end.day;
    if (remainingDays >= 15) {
      months += 1;
    }
  }
  return Math.max(0, months);
}

export function calculateProportionalNoticeDays(completedYears: number): number {
  const safeYears = Math.max(0, Math.floor(completedYears));
  return Math.min(90, 30 + safeYears * 3);
}

/**
 * Counts months with >= 15 days worked in the termination calendar year for 13th salary.
 */
export function calculateThirteenthMonthsInYear(
  admissionIso: string,
  effectiveTerminationIso: string
): number {
  const start = parseIsoDateParts(admissionIso);
  const end = parseIsoDateParts(effectiveTerminationIso);
  if (!start || !end) return 0;
  if (toUtcDate(end) < toUtcDate(start)) return 0;

  let count = 0;
  for (let m = 1; m <= end.month; m += 1) {
    const daysInMonth = new Date(Date.UTC(end.year, m, 0)).getUTCDate();
    const firstActiveDay =
      start.year === end.year && start.month === m
        ? start.day
        : start.year > end.year || (start.year === end.year && start.month > m)
          ? daysInMonth + 1
          : 1;
    const lastActiveDay = m === end.month ? end.day : daysInMonth;
    const activeDays = Math.max(0, lastActiveDay - firstActiveDay + 1);
    if (activeDays >= 15) {
      count += 1;
    }
  }
  return Math.min(12, Math.max(0, count));
}

/**
 * Counts months since the start of the current acquisition period (>= 15 days = 1/12).
 */
export function calculateProportionalVacationMonths(
  admissionIso: string,
  effectiveTerminationIso: string
): number {
  const start = parseIsoDateParts(admissionIso);
  const end = parseIsoDateParts(effectiveTerminationIso);
  if (!start || !end) return 0;
  if (toUtcDate(end) < toUtcDate(start)) return 0;

  const completedYears = calculateCompletedServiceYears(
    admissionIso,
    effectiveTerminationIso
  );
  const periodStartYear = start.year + completedYears;
  const maxDaysInStartMonth = new Date(
    Date.UTC(periodStartYear, start.month, 0)
  ).getUTCDate();
  const periodStart = toUtcDate({
    year: periodStartYear,
    month: start.month,
    day: Math.min(start.day, maxDaysInStartMonth),
  });
  const endDate = toUtcDate(end);

  let months = 0;
  let cursor = new Date(periodStart.getTime());

  for (let i = 0; i < 12; i += 1) {
    if (cursor > endDate) break;
    const nextCursor = new Date(cursor.getTime());
    nextCursor.setUTCMonth(nextCursor.getUTCMonth() + 1);
    if (endDate >= nextCursor) {
      months += 1;
      cursor = nextCursor;
    } else {
      const diffDays =
        Math.floor(
          (endDate.getTime() - cursor.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1;
      if (diffDays >= 15) {
        months += 1;
      }
      break;
    }
  }

  return Math.min(12, Math.max(0, months));
}

/**
 * Progressive Brazilian INSS deduction (2025/2026 brackets).
 */
export function calculateProgressiveInss(taxableAmount: number): number {
  if (!Number.isFinite(taxableAmount) || taxableAmount <= 0) return 0;

  const brackets = [
    { limit: 1518.0, rate: 0.075 },
    { limit: 2793.88, rate: 0.09 },
    { limit: 4190.83, rate: 0.12 },
    { limit: 8157.41, rate: 0.14 },
  ];

  let prevLimit = 0;
  let total = 0;
  const capped = Math.min(taxableAmount, brackets[brackets.length - 1].limit);

  for (const bracket of brackets) {
    if (capped <= prevLimit) break;
    const slice = Math.min(capped, bracket.limit) - prevLimit;
    if (slice > 0) {
      total += slice * bracket.rate;
    }
    prevLimit = bracket.limit;
  }

  return roundMoney(total);
}

/**
 * Simplified monthly IRRF estimate on taxable salary portion.
 */
export function calculateSimplifiedIrrf(
  taxableBeforeInss: number,
  inssDeduction: number,
  dependents = 0
): number {
  if (!Number.isFinite(taxableBeforeInss) || taxableBeforeInss <= 0) return 0;
  const dependentDeduction = Math.max(0, Math.floor(dependents)) * 189.59;
  const baseLegal = Math.max(
    0,
    taxableBeforeInss - inssDeduction - dependentDeduction
  );
  // Simplified discount option (R$ 607.20) when more favorable
  const baseSimplified = Math.max(0, taxableBeforeInss - 607.2);
  const base = Math.min(baseLegal, baseSimplified);

  if (base <= 2428.8) return 0;
  if (base <= 2826.65) return roundMoney(Math.max(0, base * 0.075 - 182.16));
  if (base <= 3751.05) return roundMoney(Math.max(0, base * 0.15 - 394.16));
  if (base <= 4664.68) return roundMoney(Math.max(0, base * 0.225 - 675.49));
  return roundMoney(Math.max(0, base * 0.275 - 908.73));
}

export function formatCurrencyBrl(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe);
}

export function calculateSeverance(input: SeveranceInput): SeveranceResult {
  const emptyResult = (error: string): SeveranceResult => ({
    valid: false,
    error,
    serviceYears: 0,
    serviceMonthsTotal: 0,
    proportionalNoticeDays: 0,
    thirteenthMonths: 0,
    proportionalVacationMonths: 0,
    estimatedFgtsDepositBase: 0,
    fgtsFineAmount: 0,
    grossTotal: 0,
    totalDeductions: 0,
    netTotal: 0,
    totalWithFgtsFine: 0,
    items: [],
    legalNotes: [],
  });

  if (!Number.isFinite(input.monthlySalary) || input.monthlySalary <= 0) {
    return emptyResult('Informe um salário bruto mensal maior que R$ 0,00.');
  }

  const startParts = parseIsoDateParts(input.admissionDate);
  const endParts = parseIsoDateParts(input.terminationDate);
  if (!startParts || !endParts) {
    return emptyResult('Informe datas válidas de admissão e demissão.');
  }

  if (toUtcDate(endParts) < toUtcDate(startParts)) {
    return emptyResult(
      'A data de saída não pode ser anterior à data de admissão.'
    );
  }

  const workedDays = Math.min(
    31,
    Math.max(0, Math.round(input.workedDaysInLastMonth))
  );
  const overduePeriods = Math.min(
    3,
    Math.max(0, Math.floor(input.overdueVacationPeriods))
  );
  const dependents = Math.min(10, Math.max(0, Math.floor(input.dependents)));

  const salary = roundMoney(input.monthlySalary);
  const serviceYears = calculateCompletedServiceYears(
    input.admissionDate,
    input.terminationDate
  );
  const serviceMonthsTotal = calculateTotalServiceMonths(
    input.admissionDate,
    input.terminationDate
  );
  const proportionalNoticeDays = calculateProportionalNoticeDays(serviceYears);

  // Notice projection applies for indemnified dismissal without just cause or mutual agreement
  const projectsNotice =
    input.noticeType === 'indenizado' &&
    (input.reason === 'sem_justa_causa' || input.reason === 'acordo_mutuo');
  const projectedTerminationDate = projectsNotice
    ? addDaysIsoDate(input.terminationDate, proportionalNoticeDays)
    : input.terminationDate;

  const thirteenthMonths =
    input.reason === 'justa_causa'
      ? 0
      : calculateThirteenthMonthsInYear(
          input.admissionDate,
          projectedTerminationDate
        );

  const proportionalVacationMonths =
    input.reason === 'justa_causa'
      ? 0
      : calculateProportionalVacationMonths(
          input.admissionDate,
          projectedTerminationDate
        );

  const items: SeveranceLineItem[] = [];

  // 1. Saldo de salário
  const salaryBalance = roundMoney((salary / 30) * Math.min(30, workedDays));
  items.push({
    id: 'saldo-salario',
    label: 'Saldo de salário',
    reference: `${Math.min(30, workedDays)} dias trabalhados`,
    amount: salaryBalance,
    kind: 'provento',
  });

  // 2. Aviso prévio (indenizado / acordo / desconto no pedido de demissão)
  let noticeAmount = 0;
  let noticeDiscount = 0;

  if (
    input.reason === 'sem_justa_causa' &&
    input.noticeType === 'indenizado'
  ) {
    noticeAmount = roundMoney((salary / 30) * proportionalNoticeDays);
    items.push({
      id: 'aviso-previo-indenizado',
      label: 'Aviso prévio indenizado proporcional',
      reference: `${proportionalNoticeDays} dias (Lei 12.506/2011)`,
      amount: noticeAmount,
      kind: 'provento',
    });
  } else if (
    input.reason === 'acordo_mutuo' &&
    input.noticeType === 'indenizado'
  ) {
    noticeAmount = roundMoney(((salary / 30) * proportionalNoticeDays) * 0.5);
    items.push({
      id: 'aviso-previo-acordo',
      label: 'Aviso prévio indenizado (50% - Art. 484-A)',
      reference: `Metade de ${proportionalNoticeDays} dias`,
      amount: noticeAmount,
      kind: 'provento',
    });
  } else if (
    input.reason === 'pedido_demissao' &&
    input.noticeType === 'indenizado'
  ) {
    noticeDiscount = roundMoney(salary);
    items.push({
      id: 'desconto-aviso-previo',
      label: 'Desconto de aviso prévio não cumprido',
      reference: '30 dias (pedido de demissão)',
      amount: noticeDiscount,
      kind: 'desconto',
      note: 'Aplicável quando a empresa não dispensa o cumprimento dos 30 dias.',
    });
  }

  // 3. 13º salário proporcional
  let thirteenthAmount = 0;
  if (input.reason !== 'justa_causa' && thirteenthMonths > 0) {
    thirteenthAmount = roundMoney((salary / 12) * thirteenthMonths);
    items.push({
      id: 'decimo-terceiro-proporcional',
      label: '13º salário proporcional',
      reference: `${thirteenthMonths}/12 avos`,
      amount: thirteenthAmount,
      kind: 'provento',
    });
  }

  // 4. Férias vencidas + 1/3
  if (overduePeriods > 0) {
    const overdueBase = roundMoney(salary * overduePeriods);
    const overdueThird = roundMoney(overdueBase / 3);
    items.push({
      id: 'ferias-vencidas',
      label: 'Férias vencidas + 1/3 constitucional',
      reference: `${overduePeriods} ${overduePeriods === 1 ? 'período' : 'períodos'}`,
      amount: roundMoney(overdueBase + overdueThird),
      kind: 'provento',
    });
  }

  // 5. Férias proporcionais + 1/3
  if (input.reason !== 'justa_causa' && proportionalVacationMonths > 0) {
    const propVacBase = roundMoney(
      (salary / 12) * proportionalVacationMonths
    );
    const propVacThird = roundMoney(propVacBase / 3);
    items.push({
      id: 'ferias-proporcionais',
      label: 'Férias proporcionais + 1/3 constitucional',
      reference: `${proportionalVacationMonths}/12 avos`,
      amount: roundMoney(propVacBase + propVacThird),
      kind: 'provento',
    });
  }

  // 6. Descontos tributários estimados (INSS sobre saldo de salário e 13º em separado, IRRF sobre saldo)
  const inssSaldo = calculateProgressiveInss(salaryBalance);
  const inssDecimo = calculateProgressiveInss(thirteenthAmount);
  const totalInss = roundMoney(inssSaldo + inssDecimo);
  if (totalInss > 0) {
    items.push({
      id: 'inss-estimado',
      label: 'Desconto INSS estimado (saldo + 13º)',
      reference: 'Tabela progressiva vigente',
      amount: totalInss,
      kind: 'desconto',
    });
  }

  const irrfSaldo = calculateSimplifiedIrrf(
    salaryBalance,
    inssSaldo,
    dependents
  );
  const irrfDecimo = calculateSimplifiedIrrf(
    thirteenthAmount,
    inssDecimo,
    dependents
  );
  const totalIrrf = roundMoney(irrfSaldo + irrfDecimo);
  if (totalIrrf > 0) {
    items.push({
      id: 'irrf-estimado',
      label: 'Desconto IRRF estimado',
      reference:
        dependents > 0
          ? `${dependents} dependente(s)`
          : 'Sem dependentes',
      amount: totalIrrf,
      kind: 'desconto',
    });
  }

  // 7. FGTS estimado + Multa rescisória (40% ou 20%)
  const severanceFgtsContribution = roundMoney(
    (salaryBalance + thirteenthAmount + noticeAmount) * 0.08
  );
  const accumulatedFgtsEstimate =
    input.fgtsBalanceOverride != null &&
    Number.isFinite(input.fgtsBalanceOverride) &&
    input.fgtsBalanceOverride >= 0
      ? roundMoney(input.fgtsBalanceOverride)
      : roundMoney(salary * 0.08 * Math.max(1, serviceMonthsTotal));

  const estimatedFgtsDepositBase = roundMoney(
    accumulatedFgtsEstimate + severanceFgtsContribution
  );

  let fgtsFineRate = 0;
  if (input.reason === 'sem_justa_causa') fgtsFineRate = 0.4;
  else if (input.reason === 'acordo_mutuo') fgtsFineRate = 0.2;

  const fgtsFineAmount = roundMoney(estimatedFgtsDepositBase * fgtsFineRate);
  if (fgtsFineAmount > 0) {
    items.push({
      id: 'multa-fgts',
      label: `Multa rescisória do FGTS (${Math.round(fgtsFineRate * 100)}%)`,
      reference: `Sobre base estimada de ${formatCurrencyBrl(estimatedFgtsDepositBase)}`,
      amount: fgtsFineAmount,
      kind: 'fgts',
      note: 'Depositada na conta vinculada do FGTS (Caixa Econômica).',
    });
  }

  const grossTotal = roundMoney(
    items
      .filter((item) => item.kind === 'provento')
      .reduce((sum, item) => sum + item.amount, 0)
  );
  const totalDeductions = roundMoney(
    items
      .filter((item) => item.kind === 'desconto')
      .reduce((sum, item) => sum + item.amount, 0)
  );
  const netTotal = roundMoney(Math.max(0, grossTotal - totalDeductions));
  const totalWithFgtsFine = roundMoney(netTotal + fgtsFineAmount);

  const legalNotes: string[] = [
    'Prazo legal para pagamento das verbas rescisórias: até 10 dias corridos após o término do contrato (Art. 477 §6º da CLT).',
  ];
  if (input.reason === 'sem_justa_causa') {
    legalNotes.push(
      'Com dispensa sem justa causa, há direito ao saque integral do FGTS e possível seguro-desemprego conforme tempo mínimo de trabalho.'
    );
  } else if (input.reason === 'acordo_mutuo') {
    legalNotes.push(
      'No acordo mútuo (Art. 484-A), é permitido sacar até 80% do saldo do FGTS, sem direito ao seguro-desemprego.'
    );
  } else if (input.reason === 'pedido_demissao') {
    legalNotes.push(
      'No pedido de demissão, não há multa de 40%, saque imediato do FGTS ou seguro-desemprego.'
    );
  } else if (input.reason === 'justa_causa') {
    legalNotes.push(
      'Na justa causa, não são devidos aviso prévio, 13º proporcional, férias proporcionais ou multa de FGTS.'
    );
  }

  return {
    valid: true,
    serviceYears,
    serviceMonthsTotal,
    proportionalNoticeDays,
    thirteenthMonths,
    proportionalVacationMonths,
    estimatedFgtsDepositBase,
    fgtsFineAmount,
    grossTotal,
    totalDeductions,
    netTotal,
    totalWithFgtsFine,
    items,
    legalNotes,
  };
}
