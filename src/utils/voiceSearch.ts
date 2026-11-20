/**
 * @file src/utils/voiceSearch.ts
 * @description Wrapper tipado para Web Speech API (`SpeechRecognition`) em português do Brasil para busca de vagas por voz.
 */

export interface WebSpeechAlternative {
  transcript: string;
  confidence?: number;
}

export interface WebSpeechResult {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: WebSpeechAlternative;
}

export interface WebSpeechResultList {
  readonly length: number;
  [index: number]: WebSpeechResult;
}

export interface WebSpeechRecognitionEvent {
  readonly resultIndex?: number;
  readonly results: WebSpeechResultList;
}

export interface WebSpeechRecognitionErrorEvent {
  readonly error: string;
  readonly message?: string;
}

export interface WebSpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: WebSpeechRecognitionEvent) => void) | null;
  onerror: ((event: WebSpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

export type WebSpeechRecognitionConstructor = new () => WebSpeechRecognitionInstance;

export interface ParsedVoiceJobCommand {
  action: 'search' | 'clear';
  query: string;
  rawTranscript: string;
}

const CLEAR_COMMAND_PATTERNS: RegExp[] = [
  /^limpar(\s+(a\s+)?(busca|pesquisa|filtro|filtros))?$/i,
  /^apagar(\s+(a\s+)?(busca|pesquisa))?$/i,
  /^remover(\s+(o\s+)?filtro)?$/i,
  /^(mostrar|ver|exibir)\s+todas(\s+as\s+vagas)?$/i,
  /^todas\s+as\s+vagas$/i,
];

const VOICE_PREFIX_PATTERN =
  /^(?:por favor\s+)?(?:eu\s+)?(?:quero|queria|gostaria\s+de|preciso\s+de|buscar|busca|procurar|procura|pesquisar|pesquisa|encontrar|achar|ver|mostrar|exibir|tem|há)(?:\s+por)?(?:\s+vagas?|\s+oportunidades?|\s+trabalho|\s+servi[cç]o)?(?:\s+(?:de|para|pra|em|com))?\s+/i;

const TRAILING_FILLER_PATTERN = /\s+(?:por favor|obrigado|obrigada)$/i;

export function getSpeechRecognitionConstructor(
  win: unknown = typeof window !== 'undefined' ? window : undefined
): WebSpeechRecognitionConstructor | null {
  if (!win || typeof win !== 'object') return null;
  const candidate = win as Record<string, unknown>;
  const ctor = candidate.SpeechRecognition ?? candidate.webkitSpeechRecognition;
  return typeof ctor === 'function'
    ? (ctor as WebSpeechRecognitionConstructor)
    : null;
}

export function isWebSpeechSupported(
  win: unknown = typeof window !== 'undefined' ? window : undefined
): boolean {
  return getSpeechRecognitionConstructor(win) !== null;
}

export function normalizeVoiceTranscript(rawTranscript: string): string {
  return rawTranscript
    .replace(/[.,!?;:"'«»]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseVoiceJobCommand(
  rawTranscript: string
): ParsedVoiceJobCommand {
  const cleaned = normalizeVoiceTranscript(rawTranscript);
  if (!cleaned) {
    return {
      action: 'search',
      query: '',
      rawTranscript: '',
    };
  }

  for (const pattern of CLEAR_COMMAND_PATTERNS) {
    if (pattern.test(cleaned)) {
      return {
        action: 'clear',
        query: '',
        rawTranscript: cleaned,
      };
    }
  }

  let query = cleaned.replace(VOICE_PREFIX_PATTERN, '').trim();
  query = query.replace(TRAILING_FILLER_PATTERN, '').trim();

  if (!query) {
    query = cleaned;
  }

  return {
    action: 'search',
    query,
    rawTranscript: cleaned,
  };
}

export function extractTranscriptFromSpeechEvent(
  event: WebSpeechRecognitionEvent
): { transcript: string; isFinal: boolean } {
  const results = event?.results;
  if (!results || typeof results.length !== 'number' || results.length === 0) {
    return { transcript: '', isFinal: false };
  }

  const startIndex =
    typeof event.resultIndex === 'number' && event.resultIndex >= 0
      ? event.resultIndex
      : 0;

  const chunks: string[] = [];
  let hasFinal = false;

  for (let i = startIndex; i < results.length; i += 1) {
    const res = results[i];
    if (!res || res.length === 0) continue;
    const alt = res[0];
    if (alt && typeof alt.transcript === 'string') {
      chunks.push(alt.transcript);
    }
    if (res.isFinal) {
      hasFinal = true;
    }
  }

  return {
    transcript: chunks.join(' ').replace(/\s+/g, ' ').trim(),
    isFinal: hasFinal,
  };
}

export function getVoiceErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Permissão do microfone negada. Libere o acesso ao microfone no navegador para pesquisar por voz.';
    case 'no-speech':
      return 'Nenhuma fala detectada. Toque no microfone e diga o nome da vaga (ex: "pedreiro" ou "eletricista").';
    case 'audio-capture':
      return 'Nenhum microfone encontrado ou disponível neste dispositivo.';
    case 'network':
      return 'Erro de conexão ao reconhecer a voz. Verifique sua internet ou digite sua busca.';
    case 'aborted':
      return 'Busca por voz cancelada.';
    default:
      return 'Não foi possível concluir o comando de voz. Tente novamente ou digite a vaga desejada.';
  }
}
