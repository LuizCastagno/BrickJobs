/**
 * @file src/utils/requiredDocuments.ts
 * @description Regras de obrigatoriedade de documentos conforme sexo do titular, validação de MIME/tamanho e leitura em Data URL.
 */

import type {
  DocumentAttachment,
  RegistrantSex,
  RequiredDocumentKey,
  RequiredDocumentsMap,
} from '../types/brickjobs';

export const MAX_DOCUMENT_FILE_SIZE_BYTES = 1.5 * 1024 * 1024;

export const ACCEPTED_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const ACCEPTED_DOCUMENT_EXTENSIONS = [
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
] as const;

export const DOCUMENT_ACCEPT_ATTR =
  'application/pdf,image/jpeg,image/png,image/webp,.pdf,.jpg,.jpeg,.png,.webp';

export const REGISTRANT_SEX_OPTIONS: ReadonlyArray<{
  value: RegistrantSex;
  label: string;
}> = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'feminino', label: 'Feminino' },
  { value: 'outro', label: 'Outro / Prefiro não informar' },
];

export interface RequiredDocumentSpec {
  key: RequiredDocumentKey;
  label: string;
  description: string;
  audienceRule: 'ambos' | 'masculino';
  audienceLabel: string;
}

export const REQUIRED_DOCUMENT_SPECS: ReadonlyArray<RequiredDocumentSpec> = [
  {
    key: 'historicoCriminal',
    label: 'Comprovante de histórico criminal',
    description:
      'Certidão de antecedentes criminais emitida pela Polícia Civil, Polícia Federal ou Tribunal de Justiça.',
    audienceRule: 'ambos',
    audienceLabel: 'Obrigatório para ambos os sexos',
  },
  {
    key: 'tituloEleitor',
    label: 'Título de eleitor',
    description:
      'Cópia legível (frente e verso) ou e-Título exportado em PDF ou imagem.',
    audienceRule: 'ambos',
    audienceLabel: 'Obrigatório para ambos os sexos',
  },
  {
    key: 'testeToxicologico',
    label: 'Teste toxicológico',
    description:
      'Laudo ou exame toxicológico recente emitido por laboratório credenciado.',
    audienceRule: 'ambos',
    audienceLabel: 'Obrigatório para ambos os sexos',
  },
  {
    key: 'reservistaOuCdi',
    label: 'Reservista ou Certificado de Dispensa de Incorporação (CDI)',
    description:
      'Certificado de Reservista ou Certificado de Dispensa de Incorporação válido.',
    audienceRule: 'masculino',
    audienceLabel: 'Obrigatório para homens (sexo masculino)',
  },
];

export interface ResolvedDocumentRequirement extends RequiredDocumentSpec {
  required: boolean;
  applicable: boolean;
  requirementBadge: string;
  attachment: DocumentAttachment | null;
}

export function normalizeRegistrantSex(
  value?: string | null
): RegistrantSex | '' {
  if (value === 'masculino' || value === 'feminino' || value === 'outro') {
    return value;
  }
  return '';
}

export function formatRegistrantSexLabel(sex?: string | null): string {
  switch (sex) {
    case 'masculino':
      return 'Masculino';
    case 'feminino':
      return 'Feminino';
    case 'outro':
      return 'Outro / Prefiro não informar';
    default:
      return 'Não informado';
  }
}

export function isValidDocumentAttachment(
  attachment?: DocumentAttachment | null
): boolean {
  return Boolean(
    attachment &&
      typeof attachment.fileName === 'string' &&
      attachment.fileName.trim().length > 0 &&
      typeof attachment.dataUrl === 'string' &&
      attachment.dataUrl.trim().length > 0 &&
      Number(attachment.fileSizeBytes) > 0
  );
}

export function getDocumentFieldErrorMessage(
  spec: Pick<RequiredDocumentSpec, 'key' | 'label' | 'audienceRule'>
): string {
  if (spec.audienceRule === 'masculino') {
    return `Obrigatório para homens: anexe o ${spec.label} antes de enviar.`;
  }
  return `Campo obrigatório: anexe o ${spec.label} antes de enviar.`;
}

export function sanitizeRequiredDocumentsMap(
  raw?: RequiredDocumentsMap | null
): RequiredDocumentsMap {
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  const clean: RequiredDocumentsMap = {};
  for (const spec of REQUIRED_DOCUMENT_SPECS) {
    const item = raw[spec.key];
    if (
      item &&
      typeof item === 'object' &&
      typeof item.fileName === 'string' &&
      item.fileName.trim() &&
      typeof item.dataUrl === 'string' &&
      item.dataUrl.trim() &&
      Number(item.fileSizeBytes) > 0
    ) {
      clean[spec.key] = {
        fileName: item.fileName,
        fileSizeBytes: Number(item.fileSizeBytes),
        mimeType: item.mimeType || 'application/pdf',
        uploadedAt: item.uploadedAt || '',
        dataUrl: item.dataUrl,
      };
    } else {
      clean[spec.key] = null;
    }
  }
  return clean;
}

export function isDocumentRequiredForSex(
  spec: RequiredDocumentSpec,
  sex?: RegistrantSex | '' | null
): boolean {
  if (spec.audienceRule === 'ambos') {
    return true;
  }
  return sex === 'masculino';
}

export function getResolvedDocumentRequirements(
  sex?: RegistrantSex | '' | null,
  docs?: RequiredDocumentsMap | null
): ResolvedDocumentRequirement[] {
  const normalizedSex = normalizeRegistrantSex(sex);
  const safeDocs = sanitizeRequiredDocumentsMap(docs);

  return REQUIRED_DOCUMENT_SPECS.map((spec) => {
    const required = isDocumentRequiredForSex(spec, normalizedSex);
    const applicable =
      spec.audienceRule === 'ambos' ||
      normalizedSex === 'masculino' ||
      normalizedSex === '';

    let requirementBadge = 'Obrigatório · Ambos os sexos';
    if (spec.audienceRule === 'masculino') {
      if (normalizedSex === 'masculino') {
        requirementBadge = 'Obrigatório · Sexo masculino';
      } else if (normalizedSex === '') {
        requirementBadge = 'Obrigatório para homens';
      } else {
        requirementBadge = 'Não exigido para este sexo';
      }
    }

    return {
      ...spec,
      required,
      applicable,
      requirementBadge,
      attachment: safeDocs[spec.key] ?? null,
    };
  });
}

export function countAttachedRequiredDocuments(
  sex?: RegistrantSex | '' | null,
  docs?: RequiredDocumentsMap | null
): { attachedCount: number; totalRequired: number; isComplete: boolean } {
  const resolved = getResolvedDocumentRequirements(sex, docs);
  const requiredItems = resolved.filter((item) => item.required);
  const attachedCount = requiredItems.filter((item) =>
    isValidDocumentAttachment(item.attachment)
  ).length;
  const totalRequired = requiredItems.length;

  return {
    attachedCount,
    totalRequired,
    isComplete:
      normalizeRegistrantSex(sex) !== '' && attachedCount === totalRequired,
  };
}

export function validateDocumentFile(file: {
  name: string;
  type: string;
  size: number;
}): { ok: true } | { ok: false; error: string } {
  const lowerName = file.name.toLowerCase();
  const hasValidExt = ACCEPTED_DOCUMENT_EXTENSIONS.some((ext) =>
    lowerName.endsWith(ext)
  );
  const hasValidMime = (
    ACCEPTED_DOCUMENT_MIME_TYPES as readonly string[]
  ).includes(file.type);

  if (!hasValidExt && !hasValidMime) {
    return {
      ok: false,
      error:
        'Formato inválido. Envie o documento em PDF (.pdf) ou imagem (.jpg, .jpeg, .png, .webp).',
    };
  }

  if (file.size <= 0) {
    return {
      ok: false,
      error: 'O arquivo selecionado está vazio. Escolha um documento válido.',
    };
  }

  if (file.size > MAX_DOCUMENT_FILE_SIZE_BYTES) {
    return {
      ok: false,
      error: 'O arquivo deve ter no máximo 1,5 MB.',
    };
  }

  return { ok: true };
}

export type RequiredDocumentsValidationResult =
  | { valid: true }
  | {
      valid: false;
      missingSex: boolean;
      missingKeys: RequiredDocumentKey[];
      errorMessage: string;
    };

export function validateRequiredRegistrationDocuments(
  sex?: RegistrantSex | '' | null,
  docs?: RequiredDocumentsMap | null,
  categoryLabel: 'contratante' | 'contratado' = 'contratado'
): RequiredDocumentsValidationResult {
  const normalizedSex = normalizeRegistrantSex(sex);
  const resolved = getResolvedDocumentRequirements(normalizedSex, docs);
  const missing = resolved.filter(
    (item) => item.required && !isValidDocumentAttachment(item.attachment)
  );
  const missingKeys = missing.map((m) => m.key);

  if (!normalizedSex) {
    const personLabel =
      categoryLabel === 'contratante'
        ? 'do responsável pela construtora'
        : 'do profissional';
    return {
      valid: false,
      missingSex: true,
      missingKeys,
      errorMessage: `Selecione o sexo ${personLabel} e anexe os documentos obrigatórios antes de enviar.`,
    };
  }

  if (missing.length > 0) {
    const names = missing.map((m) => m.label).join(', ');
    return {
      valid: false,
      missingSex: false,
      missingKeys,
      errorMessage: `Anexe todos os documentos obrigatórios antes de salvar: ${names}.`,
    };
  }

  return { valid: true };
}
