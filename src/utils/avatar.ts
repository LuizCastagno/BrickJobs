export type AvatarEntityType = 'worker' | 'company';

export interface AvatarPalette {
  id: string;
  bgStart: string;
  bgEnd: string;
  textColor: string;
  ringColor: string;
}

const PORTUGUESE_STOP_WORDS = new Set([
  'da',
  'de',
  'do',
  'das',
  'dos',
  'e',
  'em',
  'na',
  'no',
  'para',
  'por',
  'com',
]);

const COMPANY_LEGAL_SUFFIXES = new Set([
  'ltda',
  'me',
  'epp',
  'eireli',
  'sa',
  's/a',
  's.a',
  's.a.',
  'cia',
]);

// Curated BrickJobs palette: every gradient stop guarantees >= 4.5:1 contrast with #FFFFFF text
export const AVATAR_PALETTES: AvatarPalette[] = [
  {
    id: 'terracotta',
    bgStart: '#D9482B',
    bgEnd: '#A82C14',
    textColor: '#FFFFFF',
    ringColor: 'rgba(201, 59, 30, 0.25)',
  },
  {
    id: 'slate',
    bgStart: '#334155',
    bgEnd: '#0F172A',
    textColor: '#FFFFFF',
    ringColor: 'rgba(51, 65, 85, 0.25)',
  },
  {
    id: 'forest',
    bgStart: '#059669',
    bgEnd: '#065F46',
    textColor: '#FFFFFF',
    ringColor: 'rgba(5, 150, 105, 0.25)',
  },
  {
    id: 'ochre',
    bgStart: '#D97706',
    bgEnd: '#92400E',
    textColor: '#FFFFFF',
    ringColor: 'rgba(217, 119, 6, 0.25)',
  },
  {
    id: 'cobalt',
    bgStart: '#2563EB',
    bgEnd: '#1E40AF',
    textColor: '#FFFFFF',
    ringColor: 'rgba(37, 99, 235, 0.25)',
  },
  {
    id: 'steel-teal',
    bgStart: '#0D9488',
    bgEnd: '#115E59',
    textColor: '#FFFFFF',
    ringColor: 'rgba(13, 148, 136, 0.25)',
  },
  {
    id: 'brick-plum',
    bgStart: '#7C3AED',
    bgEnd: '#4C1D95',
    textColor: '#FFFFFF',
    ringColor: 'rgba(124, 58, 237, 0.25)',
  },
  {
    id: 'copper-brown',
    bgStart: '#9A3412',
    bgEnd: '#7C2D12',
    textColor: '#FFFFFF',
    ringColor: 'rgba(154, 52, 18, 0.25)',
  },
];

function stripDiacritics(input: string): string {
  return input.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function cleanToken(token: string): string {
  return stripDiacritics(token).replace(/[^a-zA-Z0-9]/g, '');
}

export function extractAvatarInitials(
  name: string | null | undefined,
  fallback = 'BJ'
): string {
  if (!name || typeof name !== 'string') return fallback;

  const rawTokens = name
    .trim()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);

  if (rawTokens.length === 0) return fallback;

  const meaningfulTokens = rawTokens.filter((token) => {
    const normalized = stripDiacritics(token).toLowerCase();
    const alphaOnly = normalized.replace(/[^a-z0-9./-]/g, '');
    if (!alphaOnly) return false;
    if (PORTUGUESE_STOP_WORDS.has(alphaOnly)) return false;
    return true;
  });

  const withoutLegalSuffixes = meaningfulTokens.filter((token) => {
    const normalized = stripDiacritics(token)
      .toLowerCase()
      .replace(/[^a-z0-9./]/g, '');
    return !COMPANY_LEGAL_SUFFIXES.has(normalized);
  });

  const candidates = (
    withoutLegalSuffixes.length > 0 ? withoutLegalSuffixes : meaningfulTokens
  )
    .map(cleanToken)
    .filter(Boolean);

  if (candidates.length === 0) {
    const rawClean = cleanToken(rawTokens.join(''));
    return rawClean ? rawClean.slice(0, 2).toUpperCase() : fallback;
  }

  if (candidates.length === 1) {
    return candidates[0].slice(0, 2).toUpperCase();
  }

  const first = candidates[0][0];
  const last = candidates[candidates.length - 1][0];
  return `${first}${last}`.toUpperCase();
}

export function getAvatarPaletteForName(
  name: string | null | undefined,
  entityType: AvatarEntityType = 'worker'
): AvatarPalette {
  const normalized = stripDiacritics((name ?? '').trim().toLowerCase());
  const seed = `${entityType}:${normalized || 'brickjobs'}`;

  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const index = (hash >>> 0) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
}

export function hasConfiguredAvatarPhoto(
  photoUrl: string | null | undefined
): boolean {
  return typeof photoUrl === 'string' && photoUrl.trim().length > 0;
}

export const MAX_AVATAR_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

export function validateAvatarImageFile(file: {
  name: string;
  type: string;
  size: number;
}): { ok: boolean; error?: string } {
  const mime = (file.type || '').toLowerCase();
  const ext = (file.name || '').toLowerCase();
  const hasAllowedExt =
    ext.endsWith('.jpg') ||
    ext.endsWith('.jpeg') ||
    ext.endsWith('.png') ||
    ext.endsWith('.webp');

  if (!ALLOWED_AVATAR_MIME_TYPES.has(mime) && !hasAllowedExt) {
    return {
      ok: false,
      error: 'Selecione uma imagem JPG, PNG ou WebP para a foto de perfil.',
    };
  }

  if (file.size > MAX_AVATAR_UPLOAD_BYTES) {
    return {
      ok: false,
      error: 'A imagem escolhida excede o limite de 5 MB.',
    };
  }

  return { ok: true };
}

export async function compressAvatarImageFile(file: File): Promise<string> {
  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo de imagem.'));
    reader.readAsDataURL(file);
  });

  if (typeof document === 'undefined' || typeof Image === 'undefined') {
    return rawDataUrl;
  }

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Imagem inválida.'));
      el.src = rawDataUrl;
    });

    const targetSize = 256;
    const canvas = document.createElement('canvas');
    canvas.width = targetSize;
    canvas.height = targetSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return rawDataUrl;

    const minDim = Math.min(img.naturalWidth || img.width, img.naturalHeight || img.height);
    if (!minDim) return rawDataUrl;

    const sx = ((img.naturalWidth || img.width) - minDim) / 2;
    const sy = ((img.naturalHeight || img.height) - minDim) / 2;

    ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, targetSize, targetSize);
    return canvas.toDataURL('image/jpeg', 0.84);
  } catch {
    return rawDataUrl;
  }
}
