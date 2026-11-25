/**
 * @file src/utils/workerCompetencySuggestions.ts
 * @description Utilitários puros para preparar o perfil e experiências do trabalhador,
 *   validar/parsear exatamente 3 competências sugeridas pela Gemini API, calcular fingerprint
 *   de cache e gerenciar competências aplicadas no perfil.
 */

import type { WorkExperience, WorkerProfile } from '../types/brickjobs';

export const REQUIRED_COMPETENCY_COUNT = 3;
export const MAX_APPLIED_COMPETENCIES = 12;
const COMPETENCY_CACHE_STORAGE_KEY = 'brickjobs_worker_competencies_cache_v1';

export interface WorkerCompetencySuggestion {
  name: string;
  category: string;
  rationale: string;
}

export interface WorkerCompetencyAnalysisResult {
  summary: string;
  competencies: WorkerCompetencySuggestion[];
  generatedAt: string;
  fingerprint: string;
}

export interface AnalyzableExperienceInput {
  empresaLocal: string;
  funcao: string;
  dataInicio: string;
  dataFim: string;
  atual: boolean;
  atividades: string;
}

export interface CompetencyAnalysisRequestPayload {
  role: string;
  summary: string;
  experiences: AnalyzableExperienceInput[];
  fingerprint: string;
}

function cleanText(value: unknown, maxLength = 240): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function normalizeComparisonKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function sanitizeAnalyzableExperiences(
  experiencias: Array<Partial<WorkExperience>> | undefined | null
): AnalyzableExperienceInput[] {
  if (!Array.isArray(experiencias)) return [];

  const cleaned: AnalyzableExperienceInput[] = [];
  for (const exp of experiencias) {
    if (!exp || typeof exp !== 'object') continue;
    const empresaLocal = cleanText(exp.empresaLocal, 140);
    const funcao = cleanText(exp.funcao, 100);
    const atividades = cleanText(exp.atividades, 320);
    const dataInicio = cleanText(exp.dataInicio, 20);
    const atual = Boolean(exp.atual);
    const dataFim = atual ? '' : cleanText(exp.dataFim, 20);

    if (!funcao && !empresaLocal && !atividades) continue;

    cleaned.push({
      empresaLocal,
      funcao,
      dataInicio,
      dataFim,
      atual,
      atividades,
    });
  }

  return cleaned;
}

export function hasAnalyzableExperiences(
  experiencias: Array<Partial<WorkExperience>> | undefined | null
): boolean {
  const sanitized = sanitizeAnalyzableExperiences(experiencias);
  return sanitized.some(
    (exp) => Boolean(exp.funcao || exp.atividades || exp.empresaLocal)
  );
}

export function hasCompleteExperienceForAutoSuggest(
  experiencias: Array<Partial<WorkExperience>> | undefined | null
): boolean {
  const sanitized = sanitizeAnalyzableExperiences(experiencias);
  return sanitized.some(
    (exp) =>
      Boolean(exp.funcao) && Boolean(exp.empresaLocal || exp.atividades)
  );
}

export function buildWorkerCompetencyFingerprint(
  profile: Pick<WorkerProfile, 'funcaoPrincipal' | 'resumoProfissional'> & {
    experiencias?: Array<Partial<WorkExperience>>;
  }
): string {
  const role = normalizeComparisonKey(cleanText(profile.funcaoPrincipal, 100));
  const summary = normalizeComparisonKey(cleanText(profile.resumoProfissional, 240));
  const experiences = sanitizeAnalyzableExperiences(profile.experiencias)
    .map((exp) =>
      [
        normalizeComparisonKey(exp.funcao),
        normalizeComparisonKey(exp.empresaLocal),
        exp.dataInicio,
        exp.atual ? 'atual' : exp.dataFim,
        normalizeComparisonKey(exp.atividades),
      ].join('|')
    )
    .sort();

  return JSON.stringify({ role, summary, experiences });
}

export function buildCompetencyAnalysisRequestPayload(
  profile: Pick<WorkerProfile, 'funcaoPrincipal' | 'resumoProfissional'> & {
    experiencias?: Array<Partial<WorkExperience>>;
  }
): CompetencyAnalysisRequestPayload {
  const role =
    cleanText(profile.funcaoPrincipal, 100) || 'Profissional da Construção Civil';
  const summary = cleanText(profile.resumoProfissional, 320);
  const experiences = sanitizeAnalyzableExperiences(profile.experiencias);

  return {
    role,
    summary,
    experiences,
    fingerprint: buildWorkerCompetencyFingerprint({
      funcaoPrincipal: role,
      resumoProfissional: summary,
      experiencias: experiences,
    }),
  };
}

function stripJsonCodeFences(rawText: string): string {
  const trimmed = rawText.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenceMatch ? fenceMatch[1].trim() : trimmed;
}

export function parseGeminiCompetencySuggestions(
  rawText: string,
  fingerprint = ''
): WorkerCompetencyAnalysisResult {
  const cleanedRaw = stripJsonCodeFences(rawText);
  if (!cleanedRaw) {
    throw new Error('A Gemini API retornou uma resposta vazia.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleanedRaw);
  } catch {
    throw new Error('Não foi possível interpretar o JSON retornado pela Gemini API.');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Estrutura de resposta inválida da Gemini API.');
  }

  const obj = parsed as {
    summary?: unknown;
    competencies?: unknown;
  };

  if (!Array.isArray(obj.competencies)) {
    throw new Error('A resposta da Gemini API não trouxe a lista de competências.');
  }

  const seenNames = new Set<string>();
  const competencies: WorkerCompetencySuggestion[] = [];

  for (const item of obj.competencies) {
    if (!item || typeof item !== 'object') continue;
    const rawItem = item as {
      name?: unknown;
      category?: unknown;
      rationale?: unknown;
    };

    const name = cleanText(rawItem.name, 70);
    const category = cleanText(rawItem.category, 45) || 'Técnica de Obra';
    const rationale =
      cleanText(rawItem.rationale, 200) ||
      'Compatível com as atividades registradas nas experiências do perfil.';

    if (!name) continue;

    const key = normalizeComparisonKey(name);
    if (!key || seenNames.has(key)) continue;
    seenNames.add(key);

    competencies.push({
      name,
      category,
      rationale,
    });

    if (competencies.length === REQUIRED_COMPETENCY_COUNT) {
      break;
    }
  }

  if (competencies.length < REQUIRED_COMPETENCY_COUNT) {
    throw new Error(
      `A Gemini API retornou apenas ${competencies.length} competência(s) válida(s); eram esperadas ${REQUIRED_COMPETENCY_COUNT}.`
    );
  }

  const summary =
    cleanText(obj.summary, 240) ||
    'Sugestão de 3 competências gerada a partir das suas experiências em obra.';

  return {
    summary,
    competencies,
    generatedAt: new Date().toISOString(),
    fingerprint,
  };
}

export function normalizeAppliedCompetencies(
  items: Array<string> | undefined | null
): string[] {
  if (!Array.isArray(items)) return [];
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of items) {
    const cleaned = cleanText(item, 70);
    if (!cleaned) continue;
    const key = normalizeComparisonKey(cleaned);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(cleaned);
    if (result.length >= MAX_APPLIED_COMPETENCIES) break;
  }

  return result;
}

export function isCompetencyApplied(
  applied: string[] | undefined | null,
  competencyName: string
): boolean {
  const targetKey = normalizeComparisonKey(cleanText(competencyName, 70));
  if (!targetKey || !Array.isArray(applied)) return false;
  return applied.some((item) => normalizeComparisonKey(item) === targetKey);
}

export function mergeAppliedCompetencies(
  existing: string[] | undefined | null,
  additions: string[]
): string[] {
  return normalizeAppliedCompetencies([...(existing ?? []), ...additions]);
}

export function toggleAppliedCompetency(
  existing: string[] | undefined | null,
  competencyName: string
): string[] {
  const cleaned = cleanText(competencyName, 70);
  if (!cleaned) return normalizeAppliedCompetencies(existing);

  const normalized = normalizeAppliedCompetencies(existing);
  const targetKey = normalizeComparisonKey(cleaned);

  if (normalized.some((item) => normalizeComparisonKey(item) === targetKey)) {
    return normalized.filter((item) => normalizeComparisonKey(item) !== targetKey);
  }

  return normalizeAppliedCompetencies([...normalized, cleaned]);
}

export function loadCachedWorkerCompetencies(
  fingerprint: string
): WorkerCompetencyAnalysisResult | null {
  if (!fingerprint || typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(COMPETENCY_CACHE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<
      string,
      WorkerCompetencyAnalysisResult
    >;
    const hit = parsed?.[fingerprint];
    if (
      !hit ||
      !Array.isArray(hit.competencies) ||
      hit.competencies.length !== REQUIRED_COMPETENCY_COUNT
    ) {
      return null;
    }
    return hit;
  } catch {
    return null;
  }
}

export function saveCachedWorkerCompetencies(
  result: WorkerCompetencyAnalysisResult
): void {
  if (!result.fingerprint || typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(COMPETENCY_CACHE_STORAGE_KEY);
    const existing = raw
      ? (JSON.parse(raw) as Record<string, WorkerCompetencyAnalysisResult>)
      : {};
    const keys = Object.keys(existing);
    if (keys.length >= 12) {
      delete existing[keys[0]];
    }
    existing[result.fingerprint] = result;
    window.localStorage.setItem(
      COMPETENCY_CACHE_STORAGE_KEY,
      JSON.stringify(existing)
    );
  } catch {
    // Ignore storage quota issues safely
  }
}
