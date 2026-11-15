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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

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
