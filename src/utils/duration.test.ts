import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateExperienceMonths,
  calculateTotalExperienceMonths,
  filterJobsByLocationAndQuery,
  formatDurationPtBr,
  resolveNearestRondonopolisRegion,
} from './duration';
import type { JobPosting } from '../types/brickjobs';

test('calculateExperienceMonths computes inclusive months and validates order', () => {
  const ref = new Date('2026-11-14T12:00:00Z');
  const res1 = calculateExperienceMonths('2024-01', '2024-12', false, ref);
  assert.equal(res1.valid, true);
  assert.equal(res1.months, 12);

  const res2 = calculateExperienceMonths('2025-05', '', true, ref);
  assert.equal(res2.valid, true);
  assert.equal(res2.months, 19); // May 2025 through Nov 2026 inclusive

  const invalidOrder = calculateExperienceMonths('2025-06', '2025-02', false, ref);
  assert.equal(invalidOrder.valid, false);
  assert.ok(invalidOrder.error);
});

test('formatDurationPtBr formats years and months in natural Portuguese', () => {
  assert.equal(formatDurationPtBr(0), 'Menos de 1 mês');
  assert.equal(formatDurationPtBr(1), '1 mês');
  assert.equal(formatDurationPtBr(5), '5 meses');
  assert.equal(formatDurationPtBr(12), '1 ano');
  assert.equal(formatDurationPtBr(14), '1 ano e 2 meses');
  assert.equal(formatDurationPtBr(25), '2 anos e 1 mês');
});

test('calculateTotalExperienceMonths sums valid experiences', () => {
  const ref = new Date('2026-11-14T12:00:00Z');
  const total = calculateTotalExperienceMonths(
    [
      { dataInicio: '2022-01', dataFim: '2022-12', atual: false }, // 12m
      { dataInicio: '2023-03', dataFim: '2023-08', atual: false }, // 6m
    ],
    ref
  );
  assert.equal(total, 18);
});

test('filterJobsByLocationAndQuery filters by Rondonópolis region, status, and keyword', () => {
  const sampleJobs: JobPosting[] = [
    {
      id: '1',
      companyId: 'c1',
      companyName: 'Construtora Pantanal Sul',
      funcao: 'Pedreiro',
      quantidadeVagas: 4,
      bairro: 'Vila Aurora',
      regiaoInteresse: 'Vila Aurora',
      salarioOuDiaria: 'R$ 190/dia',
      turno: 'Comercial',
      descricao: 'Alvenaria estrutural',
      telefoneContato: '(66) 99911-1111',
      status: 'aberta',
      createdAt: '2026-11-01',
    },
    {
      id: '2',
      companyId: 'c2',
      companyName: 'Engenharia Mato Grosso',
      funcao: 'Eletricista Predial',
      quantidadeVagas: 2,
      bairro: 'Cidade Salmen',
      regiaoInteresse: 'Cidade Salmen',
      salarioOuDiaria: 'R$ 3.400/mês',
      turno: 'Comercial',
      descricao: 'Infraestrutura elétrica',
      telefoneContato: '(66) 99922-2222',
      status: 'encerrada',
      createdAt: '2026-10-15',
    },
  ];

  const byRegion = filterJobsByLocationAndQuery(sampleJobs, {
    region: 'Vila Aurora',
    query: '',
    onlyOpen: true,
  });
  assert.equal(byRegion.length, 1);
  assert.equal(byRegion[0].id, '1');

  const byQuery = filterJobsByLocationAndQuery(sampleJobs, {
    region: 'Toda Rondonópolis e Região',
    query: 'eletricista',
    onlyOpen: false,
  });
  assert.equal(byQuery.length, 1);
  assert.equal(byQuery[0].id, '2');
});

test('resolveNearestRondonopolisRegion maps local coordinates and handles distant coordinates', () => {
  assert.equal(resolveNearestRondonopolisRegion(-16.462, -54.618), 'Vila Aurora');
  assert.equal(resolveNearestRondonopolisRegion(-15.601, -56.097), 'Toda Rondonópolis e Região');
});
