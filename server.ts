import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Type } from '@google/genai';
import {
  getIsoWeekInfo,
  parseCareerTipsPayload,
  type CareerTipFocus,
} from './src/utils/careerTips.ts';
import { RONDONOPOLIS_CENTER } from './src/utils/geolocation.ts';
import {
  buildCombinedRainAlertMessage,
  parseOpenMeteoForecast,
  resolveConstructionSiteLocation,
  type RainAlertsPayload,
} from './src/utils/rainAlerts.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

const RAIN_CACHE_TTL_MS = 10 * 60 * 1000;
const rainAlertCache = new Map<
  string,
  { expiresAt: number; payload: RainAlertsPayload }
>();

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
    try {
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
      const ai = getGeminiClient();

      if (!ai) {
        res.status(503).json({
          error:
            'Chave GEMINI_API_KEY não configurada no servidor. Configure-a em Settings > Secrets para gerar as Dicas de Carreira com o Gemini.',
        });
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
      res.json({
        weekKey: weekInfo.weekKey,
        weekLabel: weekInfo.weekLabel,
        role: workerRole,
        headline: parsed.headline,
        summary: parsed.summary,
        tips: parsed.tips,
        generatedAt: new Date().toISOString(),
      });
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : 'Erro ao consultar o serviço do Gemini.';
      console.error('Erro em /api/career-tips:', message);
      res.status(502).json({
        error: `Não foi possível gerar as dicas semanais agora: ${message}`,
      });
    }
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BrickJobs server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start BrickJobs server:', err);
  process.exit(1);
});
