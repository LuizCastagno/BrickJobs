/**
 * @file server.ts
 * @description Servidor Express do BrickJobs. Fornece rotas `/api/rain-alerts`, `/api/career-tips`,
 *   `/api/safety-weekly-reminders`, `/api/construction-news` e `/api/worker-competencies`,
 *   além de servir o Vite em dev e `dist/` em produção.
 */
import 'dotenv/config';
import http from 'node:http';
import express, { type Request, type Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import {
  getCuratedCareerTips,
  getIsoWeekInfo,
  parseCareerTipsPayload,
  type CareerTipFocus,
  type WeeklyCareerTipsBundle,
} from './src/utils/careerTips.ts';
import { RONDONOPOLIS_CENTER } from './src/utils/geolocation.ts';
import {
  buildCombinedRainAlertMessage,
  parseOpenMeteoForecast,
  resolveConstructionSiteLocation,
  type RainAlertsPayload,
} from './src/utils/rainAlerts.ts';
import {
  getIsoWeekString,
  getCuratedSafetyWeeklyReminders,
  parseSafetyWeeklyTipsPayload,
  type SafetyWeeklyPayload,
} from './src/utils/safetyWeeklyTips.ts';
import {
  getCuratedConstructionNews,
  parseConstructionNewsPayload,
  type ConstructionNewsPayload,
} from './src/utils/constructionNews.ts';
import { createGeminiCooldownGuard, extractErrorMessage, isGeminiQuotaError } from './src/utils/geminiQuota.ts';
import {
  buildCompetencyAnalysisRequestPayload,
  parseGeminiCompetencySuggestions,
  type WorkerCompetencyAnalysisResult,
} from './src/utils/workerCompetencySuggestions.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

const RAIN_CACHE_TTL_MS = 10 * 60 * 1000;
const rainAlertCache = new Map<
  string,
  { expiresAt: number; payload: RainAlertsPayload }
>();

const NEWS_CACHE_TTL_MS = 15 * 60 * 1000;
let newsCache: { expiresAt: number; payload: ConstructionNewsPayload } | null = null;

const CAREER_TIPS_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const careerTipsCache = new Map<
  string,
  { expiresAt: number; payload: WeeklyCareerTipsBundle }
>();

const SAFETY_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const safetyWeeklyCache = new Map<
  string,
  { expiresAt: number; payload: SafetyWeeklyPayload }
>();

const WORKER_COMPETENCIES_CACHE_TTL_MS = 30 * 60 * 1000;
const workerCompetenciesCache = new Map<
  string,
  { expiresAt: number; payload: WorkerCompetencyAnalysisResult }
>();

const geminiCooldown = createGeminiCooldownGuard();

function extractHttpStatus(err: unknown): number | null {
  if (err && typeof err === 'object') {
    const obj = err as {
      status?: unknown;
      code?: unknown;
      error?: { code?: unknown };
    };
    if (typeof obj.status === 'number' && obj.status >= 400 && obj.status < 600) {
      return obj.status;
    }
    if (typeof obj.code === 'number' && obj.code >= 400 && obj.code < 600) {
      return obj.code;
    }
    if (
      typeof obj.error?.code === 'number' &&
      obj.error.code >= 400 &&
      obj.error.code < 600
    ) {
      return obj.error.code;
    }
  }
  const msg = extractErrorMessage(err);
  if (/API_KEY_INVALID/i.test(msg)) return 400;
  if (/PERMISSION_DENIED/i.test(msg)) return 403;
  if (/NOT_FOUND/i.test(msg)) return 404;
  if (isGeminiQuotaError(err)) return 429;
  return null;
}

function isRetryableGeminiError(err: unknown): boolean {
  const status = extractHttpStatus(err);
  if (status === 400 || status === 401 || status === 403 || status === 404) {
    return false;
  }
  return true;
}

function formatGeminiCompetencyError(err: unknown): {
  status: number;
  error: string;
} {
  const status = extractHttpStatus(err);
  const rawMessage = extractErrorMessage(err);

  if (status === 403 || /PERMISSION_DENIED/i.test(rawMessage)) {
    return {
      status: 403,
      error:
        'A chave da Gemini API não tem permissão para esta solicitação. Verifique a chave configurada em Settings > Secrets.',
    };
  }
  if (status === 400 || /API_KEY_INVALID/i.test(rawMessage)) {
    return {
      status: 400,
      error:
        'Chave da Gemini API inválida ou solicitação malformada. Confira a chave configurada em Settings > Secrets.',
    };
  }
  if (status === 404 || /NOT_FOUND/i.test(rawMessage)) {
    return {
      status: 404,
      error:
        'Modelo Gemini selecionado não encontrado ou indisponível no momento.',
    };
  }
  if (status === 429 || isGeminiQuotaError(err)) {
    return {
      status: 429,
      error:
        'Limite de requisições da Gemini API atingido no momento. Aguarde alguns instantes ou verifique o nível da sua chave em Settings > Secrets.',
    };
  }
  return {
    status: status && status >= 500 ? status : 502,
    error:
      'Não foi possível analisar as experiências com a Gemini API agora. Tente novamente em instantes.',
  };
}

async function fetchOpenMeteoWeather(lat: number, lng: number): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}` +
      `&longitude=${encodeURIComponent(lng)}` +
      `&current=temperature_2m,precipitation,rain,weather_code,wind_speed_10m` +
      `&hourly=temperature_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m` +
      `&daily=weather_code,precipitation_sum,precipitation_probability_max,wind_speed_10m_max` +
      `&forecast_days=3&timezone=America%2FCuiaba`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`Open-Meteo HTTP ${res.status}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get('/api/rain-alerts', async (req: Request, res: Response) => {
    try {
      const regionParam =
        typeof req.query.region === 'string'
          ? req.query.region
          : 'Toda Rondonópolis e Região';
      const latParam =
        typeof req.query.lat === 'string' ? Number(req.query.lat) : NaN;
      const lngParam =
        typeof req.query.lng === 'string' ? Number(req.query.lng) : NaN;

      const customCoords =
        Number.isFinite(latParam) &&
        Number.isFinite(lngParam) &&
        Math.abs(latParam) <= 90 &&
        Math.abs(lngParam) <= 180
          ? { lat: latParam, lng: lngParam }
          : null;

      const siteLoc = resolveConstructionSiteLocation(regionParam, customCoords);
      const cacheKey = `${siteLoc.label}:${siteLoc.coordinates.lat.toFixed(3)},${siteLoc.coordinates.lng.toFixed(3)}`;
      const cached = rainAlertCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        res.json(cached.payload);
        return;
      }

      const samePointAsCity =
        Math.abs(siteLoc.coordinates.lat - RONDONOPOLIS_CENTER.lat) < 0.004 &&
        Math.abs(siteLoc.coordinates.lng - RONDONOPOLIS_CENTER.lng) < 0.004;

      const [siteRaw, cityRaw] = await Promise.all([
        fetchOpenMeteoWeather(siteLoc.coordinates.lat, siteLoc.coordinates.lng),
        samePointAsCity
          ? Promise.resolve(null)
          : fetchOpenMeteoWeather(
              RONDONOPOLIS_CENTER.lat,
              RONDONOPOLIS_CENTER.lng
            ),
      ]);

      const now = new Date();
      const siteForecast = parseOpenMeteoForecast(
        siteRaw,
        'canteiro',
        siteLoc.label,
        siteLoc.coordinates,
        now
      );
      const cityForecast = parseOpenMeteoForecast(
        cityRaw ?? siteRaw,
        'cidade',
        'Rondonópolis - MT',
        RONDONOPOLIS_CENTER,
        now
      );

      const payload: RainAlertsPayload = {
        updatedAt: now.toISOString(),
        source: 'open-meteo',
        siteRegionName: siteLoc.label,
        cityName: 'Rondonópolis - MT',
        siteForecast,
        cityForecast,
        combinedAlertMessage: buildCombinedRainAlertMessage(
          siteForecast,
          cityForecast
        ),
      };

      rainAlertCache.set(cacheKey, {
        expiresAt: Date.now() + RAIN_CACHE_TTL_MS,
        payload,
      });

      res.json(payload);
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : 'Falha ao consultar previsão meteorológica.';
      res.status(503).json({
        error: `Não foi possível atualizar os avisos de chuva agora (${message}).`,
      });
    }
  });

  app.post('/api/career-tips', async (req: Request, res: Response) => {
    const body = (req.body ?? {}) as {
      role?: string;
      focus?: CareerTipFocus;
      experienceCount?: number;
      hasPdfResume?: boolean;
    };

    const workerRole =
      typeof body.role === 'string' && body.role.trim()
        ? body.role.trim()
        : 'Profissional da Construção Civil';

    const focus: CareerTipFocus =
      body.focus === 'curriculo' || body.focus === 'entrevista'
        ? body.focus
        : 'todos';

    const weekInfo = getIsoWeekInfo(new Date());
    const cacheKey = `${weekInfo.weekKey}:${workerRole.toLowerCase()}:${focus}`;

    try {
      const cached = careerTipsCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        res.json(cached.payload);
        return;
      }

      const ai = getGeminiClient();

      if (!ai || geminiCooldown.isActive()) {
        const fallback = getCuratedCareerTips({
          role: workerRole,
          focus,
          weekKey: weekInfo.weekKey,
          weekLabel: weekInfo.weekLabel,
          notice: !ai
            ? 'Modo offline: exibindo orientações semanais verificadas para sua função.'
            : 'Exibindo orientações semanais curadas enquanto o serviço de IA se recupera.',
        });
        res.json(fallback);
        return;
      }

      const focusInstruction =
        focus === 'curriculo'
          ? 'Concentre todas as 4 dicas no aperfeiçoamento do currículo e apresentação de experiências em obra.'
          : focus === 'entrevista'
            ? 'Concentre todas as 4 dicas em como se destacar na entrevista presencial ou conversa no canteiro de obras.'
            : 'Entregue 4 dicas equilibradas: 2 para melhorar o currículo/perfil e 2 para se destacar em entrevistas na construção civil.';

      const profileContext = [
        `Ocupação principal: ${workerRole}.`,
        `Região de atuação: Rondonópolis-MT e obras comerciais/residenciais/logísticas.`,
        typeof body.experienceCount === 'number'
          ? `Experiências cadastradas no perfil: ${body.experienceCount}.`
          : '',
        body.hasPdfResume
          ? 'Já possui currículo em PDF anexado.'
          : 'Está montando o perfil profissional no aplicativo.',
      ]
        .filter(Boolean)
        .join(' ');

      const prompt = [
        `Gere as Dicas de Carreira da ${weekInfo.weekLabel} (${weekInfo.weekKey}) em português do Brasil para trabalhadores da construção civil.`,
        profileContext,
        focusInstruction,
        'Seja direto, prático e respeitoso com a linguagem do canteiro de obras (sem termos corporativos complexos).',
      ].join('\n\n');

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'Você é um orientador profissional especialista em recrutamento para construção civil no Brasil (Rondonópolis-MT). Gere conselhos concretos, curtos e acionáveis sobre currículo de obras e entrevista com mestres de obras, engenheiros e RH de construtoras.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              headline: {
                type: Type.STRING,
                description:
                  'Título curto e motivador para as dicas semanais (máximo 10 palavras).',
              },
              summary: {
                type: Type.STRING,
                description:
                  'Resumo em 1 a 2 frases curtas conectando currículo e entrevista para o cargo.',
              },
              tips: {
                type: Type.ARRAY,
                description: 'Lista de 4 dicas práticas da semana.',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: {
                      type: Type.STRING,
                      description: 'Use exatamente "Currículo" ou "Entrevista".',
                    },
                    title: {
                      type: Type.STRING,
                      description: 'Título curto da dica (máximo 8 palavras).',
                    },
                    action: {
                      type: Type.STRING,
                      description:
                        'O que fazer na prática, em 1 ou 2 frases claras.',
                    },
                    impact: {
                      type: Type.STRING,
                      description:
                        'Por que isso chama atenção da construtora (1 frase curta).',
                    },
                  },
                  required: ['category', 'title', 'action', 'impact'],
                },
              },
            },
            required: ['headline', 'summary', 'tips'],
          },
        },
      });

      const parsed = parseCareerTipsPayload(response.text ?? '');
      const result: WeeklyCareerTipsBundle = {
        weekKey: weekInfo.weekKey,
        weekLabel: weekInfo.weekLabel,
        role: workerRole,
        headline: parsed.headline,
        summary: parsed.summary,
        tips: parsed.tips,
        generatedAt: new Date().toISOString(),
      };
      careerTipsCache.set(cacheKey, {
        expiresAt: Date.now() + CAREER_TIPS_CACHE_TTL_MS,
        payload: result,
      });
      res.json(result);
    } catch (err) {
      const failure = geminiCooldown.recordFailure('/api/career-tips', err);
      if (failure.logMessage) {
        console.info(failure.logMessage);
      }
      const fallback = getCuratedCareerTips({
        role: workerRole,
        focus,
        weekKey: weekInfo.weekKey,
        weekLabel: weekInfo.weekLabel,
        notice:
          'Exibindo orientações semanais curadas enquanto o serviço de IA se recupera.',
      });
      careerTipsCache.set(cacheKey, {
        expiresAt: Math.min(
          Date.now() + CAREER_TIPS_CACHE_TTL_MS,
          geminiCooldown.getExpiresAt()
        ),
        payload: fallback,
      });
      res.json(fallback);
    }
  });

  app.post('/api/safety-weekly-reminders', async (req: Request, res: Response) => {
    const body = (req.body ?? {}) as {
      weekKey?: string;
      role?: string;
      focusEpi?: string;
    };

    const workerRole =
      typeof body.role === 'string' && body.role.trim()
        ? body.role.trim()
        : 'Operário da Construção Civil';

    const focusEpi =
      typeof body.focusEpi === 'string' ? body.focusEpi.trim() : '';

    const weekInfo = getIsoWeekString(new Date());
    const safetyCacheKey = `${weekInfo.weekKey}:${workerRole.toLowerCase()}:${focusEpi.toLowerCase()}`;

    try {
      const cached = safetyWeeklyCache.get(safetyCacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        res.json(cached.payload);
        return;
      }

      const ai = getGeminiClient();

      if (!ai || geminiCooldown.isActive()) {
        const baseFallback = getCuratedSafetyWeeklyReminders(weekInfo.weekNumber);
        const fallback: SafetyWeeklyPayload = {
          ...baseFallback,
          weekKey: weekInfo.weekKey,
          weekLabel: weekInfo.weekLabel,
        };
        res.json(fallback);
        return;
      }

      const prompt = [
        `Gere os Lembretes Semanais de Segurança no Canteiro e Uso de EPIs para a ${weekInfo.weekLabel} (${weekInfo.weekKey}) para trabalhadores de canteiros de obra em Rondonópolis e Mato Grosso, incluindo obras residenciais, construções industriais, montagem de pré-moldados e sistemas sustentáveis.`,
        `Ocupação de referência do trabalhador: ${workerRole}.`,
        body.focusEpi ? `Foco principal solicitado: ${body.focusEpi}.` : '',
        'Aborde exatamente 4 EPIs indispensáveis conforme as normas brasileiras NR-06, NR-10, NR-11 (içamento e movimentação de pré-moldados), NR-12 (máquinas e centrais industriais), NR-15, NR-18 e NR-35.',
        'Explique de forma prática: por que importa no calor e poeira do canteiro de Rondonópolis, checklist de inspeção física de 3 passos, 2 erros comuns, risco/penalidade do não uso, 2 competências requeridas (obrigatórias) e 2 competências preferenciais (diferenciais).',
        'Linguagem direta, firme e acolhedora de encarregado/mestre e técnico de segurança do trabalho.',
      ]
        .filter(Boolean)
        .join('\n\n');

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'Você é um Engenheiro de Segurança do Trabalho e Técnico de Segurança (NR-11, NR-12, NR-18 e NR-35) atuando na construção civil, galpões industriais e montagem de pré-moldados em Rondonópolis-MT. Gere diretrizes precisas e acionáveis sobre inspeção diária e uso de EPIs no canteiro.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              themeTitle: {
                type: Type.STRING,
                description: 'Tema semanal curto da campanha de EPI (máximo 10 palavras).',
              },
              themeDescription: {
                type: Type.STRING,
                description: 'Resumo em 1 ou 2 frases sobre a meta de prevenção da semana.',
              },
              generalNotice: {
                type: Type.STRING,
                description: 'Lembrete sobre o Diálogo Diário de Segurança (DDS) ou inspeção matinal.',
              },
              weeklyHighlights: {
                type: Type.ARRAY,
                description: 'Lista de exatamente 4 EPIs cruciais para a semana.',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    epiName: {
                      type: Type.STRING,
                      description: 'Nome do EPI (ex: Capacete com Jugular, Botina com Biqueira, Cinto NR-35).',
                    },
                    category: {
                      type: Type.STRING,
                      description: 'Uma de: cabeca, pes, olhos, ouvidos, altura, respiratoria, maos.',
                    },
                    categoryLabel: { type: Type.STRING },
                    title: { type: Type.STRING, description: 'Título prático da recomendação.' },
                    nrReference: { type: Type.STRING, description: 'Ex: NR-06, NR-11, NR-12 & NR-18 ou NR-35.' },
                    whyItMatters: {
                      type: Type.STRING,
                      description: 'Por que protege a vida do operário no canteiro em 1 a 2 frases.',
                    },
                    inspectionChecklist: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: '3 itens objetivos de checagem física do equipamento.',
                    },
                    commonMistakes: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: '2 erros comuns cometidos pelos operários.',
                    },
                    penaltyOrRisk: {
                      type: Type.STRING,
                      description: 'Consequência física grave do não uso.',
                    },
                    requiredCompetencies: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: '2 competências técnicas/NRs obrigatórias.',
                    },
                    preferredCompetencies: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: '2 competências diferenciais ou preferenciais.',
                    },
                  },
                  required: [
                    'id',
                    'epiName',
                    'category',
                    'categoryLabel',
                    'title',
                    'nrReference',
                    'whyItMatters',
                    'inspectionChecklist',
                    'commonMistakes',
                    'penaltyOrRisk',
                    'requiredCompetencies',
                    'preferredCompetencies',
                  ],
                },
              },
            },
            required: ['themeTitle', 'themeDescription', 'generalNotice', 'weeklyHighlights'],
          },
        },
      });

      const parsed = parseSafetyWeeklyTipsPayload(
        response.text ?? '',
        weekInfo.weekKey
      );
      safetyWeeklyCache.set(safetyCacheKey, {
        expiresAt: Date.now() + SAFETY_CACHE_TTL_MS,
        payload: parsed,
      });
      res.json(parsed);
    } catch (err) {
      const failure = geminiCooldown.recordFailure(
        '/api/safety-weekly-reminders',
        err
      );
      if (failure.logMessage) {
        console.info(failure.logMessage);
      }
      const baseFallback = getCuratedSafetyWeeklyReminders(weekInfo.weekNumber);
      const fallback: SafetyWeeklyPayload = {
        ...baseFallback,
        weekKey: weekInfo.weekKey,
        weekLabel: weekInfo.weekLabel,
      };
      safetyWeeklyCache.set(safetyCacheKey, {
        expiresAt: Math.min(
          Date.now() + SAFETY_CACHE_TTL_MS,
          geminiCooldown.getExpiresAt()
        ),
        payload: fallback,
      });
      res.json(fallback);
    }
  });

  app.get('/api/construction-news', async (_req: Request, res: Response) => {
    try {
      if (newsCache && newsCache.expiresAt > Date.now()) {
        res.json(newsCache.payload);
        return;
      }

      const ai = getGeminiClient();
      if (!ai || geminiCooldown.isActive()) {
        const fallback = getCuratedConstructionNews();
        res.json(fallback);
        return;
      }

      const prompt =
        'Traga as principais manchetes, notícias recentes e anúncios de infraestrutura sobre construção civil em Mato Grosso e Rondonópolis (como Ferrovia Estadual FMT / Rumo, duplicação da BR-163 pela Nova Rota do Oeste, pavimentação urbana, saneamento, lançamentos logísticos e habitação). ' +
        'Gere um JSON com os campos: headlineBanner (resumo geral da semana) e items (array de notícias, cada uma com id, title, summary, source, category entre "ferrovias", "rodovias", "obras_urbanas", "habitacao", "mercado", location, relativeDate, jobImpact destacando cargos como pedreiro, operador, carpinteiro, eletricista e armador).';

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const groundingChunks = (
        response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? []
      ) as Array<{ web?: { uri?: string; title?: string } }>;

      const parsed = parseConstructionNewsPayload(
        response.text ?? '',
        groundingChunks
      );

      newsCache = {
        expiresAt: Date.now() + NEWS_CACHE_TTL_MS,
        payload: parsed,
      };

      res.json(parsed);
    } catch (err) {
      const failure = geminiCooldown.recordFailure('/api/construction-news', err);
      if (failure.logMessage) {
        console.info(failure.logMessage);
      }
      const fallback = getCuratedConstructionNews();
      newsCache = {
        expiresAt: Math.min(
          Date.now() + NEWS_CACHE_TTL_MS,
          geminiCooldown.getExpiresAt()
        ),
        payload: fallback,
      };
      res.json(fallback);
    }
  });

  app.post('/api/worker-competencies', async (req: Request, res: Response) => {
    const body = (req.body ?? {}) as {
      role?: string;
      summary?: string;
      experiences?: Array<{
        empresaLocal?: string;
        funcao?: string;
        dataInicio?: string;
        dataFim?: string;
        atual?: boolean;
        atividades?: string;
      }>;
      forceRefresh?: boolean;
    };

    const payloadInput = buildCompetencyAnalysisRequestPayload({
      funcaoPrincipal: typeof body.role === 'string' ? body.role : '',
      resumoProfissional: typeof body.summary === 'string' ? body.summary : '',
      experiencias: Array.isArray(body.experiences) ? body.experiences : [],
    });

    if (payloadInput.experiences.length === 0) {
      res.status(400).json({
        error:
          'Cadastre ao menos uma experiência profissional com função, local da obra ou atividades para gerar 3 competências.',
      });
      return;
    }

    if (!body.forceRefresh) {
      const cached = workerCompetenciesCache.get(payloadInput.fingerprint);
      if (cached && cached.expiresAt > Date.now()) {
        res.json(cached.payload);
        return;
      }
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error:
          'A análise automática requer GEMINI_API_KEY configurada no servidor (Settings > Secrets).',
      });
      return;
    }

    const experiencesBlock = payloadInput.experiences
      .map((exp, idx) => {
        const periodo = exp.atual
          ? `${exp.dataInicio || 'início não informado'} até Atual`
          : `${exp.dataInicio || 'início não informado'} até ${exp.dataFim || 'fim não informado'}`;
        return [
          `Experiência ${idx + 1}:`,
          `- Função exercida: ${exp.funcao || 'Não informada'}`,
          `- Empresa / Local da obra: ${exp.empresaLocal || 'Não informado'}`,
          `- Período: ${periodo}`,
          `- Atividades realizadas: ${exp.atividades || 'Não detalhadas'}`,
        ].join('\n');
      })
      .join('\n\n');

    const prompt = [
      'Analise o perfil do trabalhador da construção civil abaixo e sugira EXATAMENTE 3 competências profissionais concretas e relevantes para o mercado de obras em Rondonópolis-MT.',
      `Função principal declarada: ${payloadInput.role}`,
      payloadInput.summary
        ? `Resumo / observações do profissional: ${payloadInput.summary}`
        : '',
      experiencesBlock,
      'Regras:',
      '1. Baseie cada competência diretamente nas funções, locais de obra e atividades descritas acima.',
      '2. Use nomes objetivos de competência (2 a 5 palavras, ex: "Alvenaria Estrutural", "Leitura de Planta Baixa", "Assentamento de Porcelanato", "NR-35 Trabalho em Altura").',
      '3. Retorne exatamente 3 competências distintas no campo competencies.',
    ]
      .filter(Boolean)
      .join('\n\n');

    const maxAttempts = 3;
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: prompt,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            systemInstruction:
              'Você é um especialista em recrutamento técnico da construção civil no Brasil (Rondonópolis-MT). Analise históricos de obra e devolva sempre exatamente 3 competências técnicas objetivas, claras e diretamente comprovadas pelas experiências cadastradas do trabalhador, em português do Brasil.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                summary: {
                  type: Type.STRING,
                  description:
                    'Síntese curta (1 a 2 frases) do ponto forte identificado nas experiências cadastradas.',
                },
                competencies: {
                  type: Type.ARRAY,
                  description:
                    'Lista com exatamente 3 competências técnicas distintas sugeridas a partir das experiências.',
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: {
                        type: Type.STRING,
                        description:
                          'Nome curto e claro da competência técnica (2 a 5 palavras).',
                      },
                      category: {
                        type: Type.STRING,
                        description:
                          'Área técnica da obra (ex: Estrutura e Alvenaria, Acabamento, Projetos e Medidas, Segurança NR, Instalações).',
                      },
                      rationale: {
                        type: Type.STRING,
                        description:
                          'Explicação objetiva em 1 frase conectando a competência às experiências cadastradas.',
                      },
                    },
                    required: ['name', 'category', 'rationale'],
                  },
                },
              },
              required: ['summary', 'competencies'],
            },
          },
        });

        const parsed = parseGeminiCompetencySuggestions(
          response.text ?? '',
          payloadInput.fingerprint
        );

        workerCompetenciesCache.set(payloadInput.fingerprint, {
          expiresAt: Date.now() + WORKER_COMPETENCIES_CACHE_TTL_MS,
          payload: parsed,
        });

        res.json(parsed);
        return;
      } catch (err) {
        lastError = err;
        if (attempt < maxAttempts && isRetryableGeminiError(err)) {
          const delayMs = 350 * Math.pow(2, attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }
        break;
      }
    }

    const mapped = formatGeminiCompetencyError(lastError);
    res.status(mapped.status).json({ error: mapped.error });
  });

  const httpServer = http.createServer(app);

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
        hmr:
          process.env.DISABLE_HMR === 'true'
            ? false
            : { server: httpServer },
        ws: { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`BrickJobs server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start BrickJobs server:', err);
  process.exit(1);
});
