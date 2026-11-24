/**
 * @file src/utils/jobShare.ts
 * @description Construção de links e textos formatados para compartilhamento de vagas via Web Share API,
 *   WhatsApp e área de transferência (fallback).
 */

import type { JobPosting } from '../types/brickjobs';

export interface JobSharePayload {
  title: string;
  text: string;
  url: string;
  whatsappHref: string;
  clipboardText: string;
}

export interface ShareNavigatorLike {
  share?: (data: { title?: string; text?: string; url?: string }) => Promise<void>;
  clipboard?: {
    writeText?: (text: string) => Promise<void>;
  };
}

export type JobShareResult =
  | {
      outcome: 'shared';
      method: 'web-share';
      message: string;
      payload: JobSharePayload;
    }
  | {
      outcome: 'cancelled';
      method: 'web-share';
      message: string;
      payload: JobSharePayload;
    }
  | {
      outcome: 'copied';
      method: 'clipboard';
      message: string;
      payload: JobSharePayload;
    }
  | {
      outcome: 'fallback';
      method: 'manual';
      message: string;
      payload: JobSharePayload;
    };

export function resolveBaseOrigin(explicitOrigin?: string): string {
  if (explicitOrigin && explicitOrigin.trim()) {
    return explicitOrigin.trim().replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, '');
  }
  return 'https://brickjobs.app';
}

export function buildJobShareUrl(jobId: string, baseOrigin?: string): string {
  const origin = resolveBaseOrigin(baseOrigin);
  return `${origin}/?autostart=contratado&vaga=${encodeURIComponent(jobId)}`;
}

export function buildJobSharePayload(
  job: JobPosting,
  baseOrigin?: string
): JobSharePayload {
  const url = buildJobShareUrl(job.id, baseOrigin);
  const vacanciesLabel =
    job.quantidadeVagas === 1 ? '1 vaga' : `${job.quantidadeVagas} vagas`;
  const title = `Vaga: ${job.funcao} — ${job.companyName}`;

  const lines = [
    `Oportunidade na construção civil em Rondonópolis-MT (${vacanciesLabel})`,
    `Função: ${job.funcao}`,
    `Construtora: ${job.companyName}`,
    `Local: ${job.bairro}`,
    `Remuneração: ${job.salarioOuDiaria} · ${job.tipoContrato ?? 'CLT'} · ${job.turno}`,
  ];

  if (job.beneficios?.trim()) {
    lines.push(`Benefícios: ${job.beneficios.trim()}`);
  }

  lines.push(`Ver detalhes e candidatar-se no BrickJobs:`);

  const text = lines.join('\n');
  const clipboardText = `${text}\n${url}`;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(clipboardText)}`;

  return {
    title,
    text,
    url,
    whatsappHref,
    clipboardText,
  };
}

export async function copyJobShareText(
  text: string,
  nav?: ShareNavigatorLike
): Promise<boolean> {
  const targetNav =
    nav ?? (typeof navigator !== 'undefined' ? navigator : undefined);
  if (targetNav?.clipboard?.writeText) {
    try {
      await targetNav.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export async function shareJobPosting(
  job: JobPosting,
  options: {
    baseOrigin?: string;
    navigatorOverride?: ShareNavigatorLike;
  } = {}
): Promise<JobShareResult> {
  const payload = buildJobSharePayload(job, options.baseOrigin);
  const nav =
    options.navigatorOverride ??
    (typeof navigator !== 'undefined' ? navigator : undefined);

  if (nav && typeof nav.share === 'function') {
    try {
      await nav.share({
        title: payload.title,
        text: payload.text,
        url: payload.url,
      });
      return {
        outcome: 'shared',
        method: 'web-share',
        message: 'Vaga compartilhada pelo menu do dispositivo.',
        payload,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          outcome: 'cancelled',
          method: 'web-share',
          message: 'Compartilhamento cancelado.',
          payload,
        };
      }
      // Continua para fallback de área de transferência / link WhatsApp
    }
  }

  const copied = await copyJobShareText(payload.clipboardText, nav);
  if (copied) {
    return {
      outcome: 'copied',
      method: 'clipboard',
      message:
        'Detalhes e link da vaga copiados! Envie direto pelo WhatsApp ou cole onde preferir.',
      payload,
    };
  }

  return {
    outcome: 'fallback',
    method: 'manual',
    message: 'Use o link abaixo para enviar a vaga pelo WhatsApp ou redes sociais.',
    payload,
  };
}
