/**
 * @file src/utils/jobAdvancedFilters.test.ts
 * @description Testes unitários para filtragem avançada de vagas por região de atuação,
 *   faixa salarial estimada, tipo de serviço e modelo de contrato.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import type { JobPosting } from '../types/brickjobs';
import {
  countAllActiveAdvancedFilters,
  DEFAULT_REGION_LABEL,
  filterJobsAdvanced,
  getActiveAdvancedFilterItems,
  getAvailableServiceTypeOptions,
  matchesSalaryBand,
  matchesServiceType,
} from './jobAdvancedFilters';

const SAMPLE_JOBS: JobPosting[] = [
  {
    id: 'j1',
    companyId: 'c1',
    companyName: 'Construtora Cerrado Sul',
    funcao: 'Pedreiro',
    quantidadeVagas: 4,
    bairro: 'Vila Aurora',
    regiaoInteresse: 'Vila Aurora',
    salarioOuDiaria: 'R$ 195/dia', // 195 * 22 = R$ 4.290/mês
    tipoContrato: 'Autônomo',
    nivelExperiencia: 'Intermediário (1 a 3 anos)',
    prioridade: 'urgente',
    turno: 'Comercial (07h–17h)',
    descricao: 'Execução de alvenaria estrutural e reboco interno.',
    skillTags: ['alvenaria', 'acabamento'],
    telefoneContato: '(66) 99612-4410',
    status: 'aberta',
    createdAt: '2026-11-12',
  },
  {
    id: 'j2',
    companyId: 'c2',
    companyName: 'Engenharia Mato Grosso',
    funcao: 'Armador de Ferragem',
    quantidadeVagas: 3,
    bairro: 'Distrito Industrial',
    regiaoInteresse: 'Distrito Industrial',
    salarioOuDiaria: 'R$ 3.400 – R$ 3.800/mês', // R$ 3.600/mês
    tipoContrato: 'CLT',
    nivelExperiencia: 'Experiente (3+ anos)',
    prioridade: 'normal',
    turno: 'Comercial (07h–17h)',
    descricao: 'Montagem de ferragem para galpão logístico.',
    skillTags: ['ferragem'],
    telefoneContato: '(66) 99934-8120',
    status: 'aberta',
    createdAt: '2026-11-11',
  },
  {
    id: 'j3',
    companyId: 'c3',
    companyName: 'Rondonópolis Obras',
    funcao: 'Servente de Obras',
    quantidadeVagas: 6,
    bairro: 'Cidade Salmen',
    regiaoInteresse: 'Cidade Salmen',
    salarioOuDiaria: 'R$ 135/dia', // 135 * 22 = R$ 2.970/mês
    tipoContrato: 'Temporário',
    nivelExperiencia: 'Sem experiência / Auxiliar',
    prioridade: 'normal',
    turno: 'Comercial (07h–17h)',
    descricao: 'Apoio geral no canteiro.',
    skillTags: ['obra e apoio'],
    telefoneContato: '(66) 99205-7740',
    status: 'aberta',
    createdAt: '2026-11-10',
  },
  {
    id: 'j4',
    companyId: 'c4',
    companyName: 'Pantanal Edificações',
    funcao: 'Instalações Elétricas',
    quantidadeVagas: 2,
    bairro: 'Vila Aurora',
    regiaoInteresse: 'Vila Aurora',
    salarioOuDiaria: 'A combinar',
    tipoContrato: 'CLT',
    nivelExperiencia: 'Intermediário (1 a 3 anos)',
    prioridade: 'alta',
    turno: 'Comercial (07h–17h)',
    descricao: 'Infraestrutura elétrica comercial e quadros QDC.',
    skillTags: ['elétrica'],
    telefoneContato: '(66) 99981-3095',
    status: 'aberta',
    createdAt: '2026-11-14',
  },
];

test('matchesSalaryBand categorizes daily rates, monthly ranges, and negotiable salaries accurately', () => {
  assert.equal(matchesSalaryBand('R$ 135/dia', 'ate_3000'), true);
  assert.equal(matchesSalaryBand('R$ 135/dia', '3001_4200'), false);

  assert.equal(matchesSalaryBand('R$ 3.400 – R$ 3.800/mês', '3001_4200'), true);
  assert.equal(matchesSalaryBand('R$ 3.400 – R$ 3.800/mês', 'acima_4200'), false);

  assert.equal(matchesSalaryBand('R$ 195/dia', 'acima_4200'), true);
  assert.equal(matchesSalaryBand('A combinar', 'a_combinar'), true);
  assert.equal(matchesSalaryBand('A combinar', 'ate_3000'), false);
  assert.equal(matchesSalaryBand('A combinar', 'Todas'), true);
});

test('matchesServiceType matches inferred and explicit service skill tags', () => {
  assert.equal(matchesServiceType(SAMPLE_JOBS[0], 'alvenaria'), true);
  assert.equal(matchesServiceType(SAMPLE_JOBS[0], 'Alvenaria'), true);
  assert.equal(matchesServiceType(SAMPLE_JOBS[0], 'elétrica'), false);
  assert.equal(matchesServiceType(SAMPLE_JOBS[3], 'elétrica'), true);
  assert.equal(matchesServiceType(SAMPLE_JOBS[3], 'Todos'), true);
});

test('filterJobsAdvanced combines region, salaryBand, serviceType, and contractType cleanly', () => {
  // Region = Vila Aurora + Salary = acima_4200 => Pedreiro (j1)
  const res1 = filterJobsAdvanced(SAMPLE_JOBS, {
    region: 'Vila Aurora',
    query: '',
    onlyOpen: true,
    salaryBand: 'acima_4200',
  });
  assert.deepEqual(
    res1.map((j) => j.id),
    ['j1']
  );

  // Region = Vila Aurora + Service = elétrica + Contract = CLT => Instalações Elétricas (j4)
  const res2 = filterJobsAdvanced(SAMPLE_JOBS, {
    region: 'Vila Aurora',
    query: '',
    onlyOpen: true,
    serviceType: 'elétrica',
    contractType: 'CLT',
  });
  assert.deepEqual(
    res2.map((j) => j.id),
    ['j4']
  );

  // Salary = ate_3000 + Contract = Temporário => Servente (j3)
  const res3 = filterJobsAdvanced(SAMPLE_JOBS, {
    region: DEFAULT_REGION_LABEL,
    query: '',
    onlyOpen: true,
    salaryBand: 'ate_3000',
    contractType: 'Temporário',
  });
  assert.deepEqual(
    res3.map((j) => j.id),
    ['j3']
  );

  // Salary = a_combinar => Instalações Elétricas (j4)
  const res4 = filterJobsAdvanced(SAMPLE_JOBS, {
    region: DEFAULT_REGION_LABEL,
    query: '',
    onlyOpen: true,
    salaryBand: 'a_combinar',
  });
  assert.deepEqual(
    res4.map((j) => j.id),
    ['j4']
  );
});

test('getAvailableServiceTypeOptions and active filter summary helpers produce deterministic results', () => {
  const serviceOptions = getAvailableServiceTypeOptions(SAMPLE_JOBS);
  assert.ok(serviceOptions.some((o) => o.value === 'alvenaria' && o.label === 'Alvenaria'));
  assert.ok(serviceOptions.some((o) => o.value === 'elétrica' && o.label === 'Elétrica'));

  const activeItems = getActiveAdvancedFilterItems({
    region: 'Vila Aurora',
    salaryBand: 'acima_4200',
    serviceType: 'alvenaria',
    contractType: 'Autônomo',
    occupation: 'Todas',
    experienceLevel: 'Todos',
    onlyUrgent: true,
  });

  assert.equal(activeItems.length, 5);
  assert.equal(
    countAllActiveAdvancedFilters({
      region: 'Vila Aurora',
      salaryBand: 'acima_4200',
      serviceType: 'alvenaria',
      contractType: 'Autônomo',
      occupation: 'Todas',
      experienceLevel: 'Todos',
      onlyUrgent: true,
    }),
    5
  );
  assert.deepEqual(
    activeItems.map((i) => i.key),
    ['region', 'salaryBand', 'serviceType', 'contractType', 'onlyUrgent']
  );
});
