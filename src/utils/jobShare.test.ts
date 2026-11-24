import test from 'node:test';
import assert from 'node:assert/strict';
import type { JobPosting } from '../types/brickjobs';
import {
  buildJobSharePayload,
  buildJobShareUrl,
  shareJobPosting,
} from './jobShare';

const sampleJob: JobPosting = {
  id: 'job-roo-1',
  companyId: 'seed-comp-1',
  companyName: 'Construtora Cerrado Sul',
  funcao: 'Pedreiro',
  quantidadeVagas: 5,
  bairro: 'Vila Aurora',
  regiaoInteresse: 'Vila Aurora',
  salarioOuDiaria: 'R$ 195/dia',
  beneficios: 'Almoço na obra e vale-transporte',
  tipoContrato: 'Autônomo',
  nivelExperiencia: 'Intermediário (1 a 3 anos)',
  turno: 'Comercial (07h–17h)',
  descricao: 'Alvenaria estrutural e reboco interno.',
  telefoneContato: '(66) 99612-4410',
  status: 'aberta',
  createdAt: '2026-11-12',
};

test('buildJobShareUrl and buildJobSharePayload produce deep link and WhatsApp URL', () => {
  const url = buildJobShareUrl('job-roo-1', 'https://brickjobs.example.com/');
  assert.equal(url, 'https://brickjobs.example.com/?autostart=contratado&vaga=job-roo-1');

  const payload = buildJobSharePayload(sampleJob, 'https://brickjobs.example.com');
  assert.equal(payload.title, 'Vaga: Pedreiro — Construtora Cerrado Sul');
  assert.ok(payload.text.includes('Vila Aurora'));
  assert.ok(payload.text.includes('R$ 195/dia'));
  assert.ok(payload.text.includes('Almoço na obra e vale-transporte'));
  assert.ok(payload.whatsappHref.startsWith('https://wa.me/?text='));
  assert.ok(
    decodeURIComponent(payload.whatsappHref).includes(
      'https://brickjobs.example.com/?autostart=contratado&vaga=job-roo-1'
    )
  );
});

test('shareJobPosting uses Web Share API when supported', async () => {
  const sharedCalls: Array<{ title?: string; text?: string; url?: string }> = [];

  const result = await shareJobPosting(sampleJob, {
    baseOrigin: 'https://brickjobs.example.com',
    navigatorOverride: {
      share: async (data) => {
        sharedCalls.push(data);
      },
    },
  });

  assert.equal(result.outcome, 'shared');
  assert.equal(result.method, 'web-share');
  assert.equal(sharedCalls.length, 1);
  assert.equal(sharedCalls[0].title, 'Vaga: Pedreiro — Construtora Cerrado Sul');
  assert.equal(
    sharedCalls[0].url,
    'https://brickjobs.example.com/?autostart=contratado&vaga=job-roo-1'
  );
});

test('shareJobPosting handles AbortError cleanly without throwing or overwriting clipboard', async () => {
  let copied = false;
  const result = await shareJobPosting(sampleJob, {
    navigatorOverride: {
      share: async () => {
        const err = new Error('User cancelled');
        err.name = 'AbortError';
        throw err;
      },
      clipboard: {
        writeText: async () => {
          copied = true;
        },
      },
    },
  });

  assert.equal(result.outcome, 'cancelled');
  assert.equal(copied, false);
});

test('shareJobPosting falls back to clipboard and manual link when Web Share API is unavailable', async () => {
  let copiedText = '';
  const clipboardResult = await shareJobPosting(sampleJob, {
    baseOrigin: 'https://brickjobs.example.com',
    navigatorOverride: {
      clipboard: {
        writeText: async (txt) => {
          copiedText = txt;
        },
      },
    },
  });

  assert.equal(clipboardResult.outcome, 'copied');
  assert.equal(clipboardResult.method, 'clipboard');
  assert.ok(copiedText.includes('Pedreiro'));
  assert.ok(
    copiedText.includes(
      'https://brickjobs.example.com/?autostart=contratado&vaga=job-roo-1'
    )
  );

  const manualResult = await shareJobPosting(sampleJob, {
    baseOrigin: 'https://brickjobs.example.com',
    navigatorOverride: {},
  });
  assert.equal(manualResult.outcome, 'fallback');
  assert.equal(manualResult.method, 'manual');
});
