import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileCheck2,
  FileText,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react';
import type {
  DocumentAttachment,
  RegistrantSex,
  RequiredDocumentKey,
  RequiredDocumentsMap,
} from '../types/brickjobs';
import { formatFileSizePtBr } from '../utils/duration';
import {
  DOCUMENT_ACCEPT_ATTR,
  countAttachedRequiredDocuments,
  getDocumentFieldErrorMessage,
  getResolvedDocumentRequirements,
  validateDocumentFile,
} from '../utils/requiredDocuments';

interface RequiredDocumentsSectionProps {
  category: 'contratante' | 'contratado';
  sectionTitle?: string;
  sex?: RegistrantSex | '';
  documents?: RequiredDocumentsMap;
  missingKeys?: RequiredDocumentKey[];
  missingSex?: boolean;
  onChangeDocuments: (next: RequiredDocumentsMap) => void;
}

export const RequiredDocumentsSection: React.FC<
  RequiredDocumentsSectionProps
> = ({
  category,
  sectionTitle = 'Documentos necessários para anexo',
  sex = '',
  documents = {},
  missingKeys = [],
  missingSex = false,
  onChangeDocuments,
}) => {
  const [uploadError, setUploadError] = useState<string>('');
  const inputRefs = useRef<
    Partial<Record<RequiredDocumentKey, HTMLInputElement | null>>
  >({});

  const requirements = getResolvedDocumentRequirements(sex, documents);
  const progress = countAttachedRequiredDocuments(sex, documents);

  const handleFileSelected = (
    key: RequiredDocumentKey,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setUploadError('');
    const file = e.target.files?.[0];
    // Reset input value so re-selecting the same file works cleanly
    e.target.value = '';
    if (!file) return;

    const validation = validateDocumentFile({
      name: file.name,
      type: file.type,
      size: file.size,
    });

    if (!validation.ok) {
      setUploadError(validation.error);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl) {
        setUploadError('Não foi possível ler o arquivo selecionado.');
        return;
      }
      const attachment: DocumentAttachment = {
        fileName: file.name,
        fileSizeBytes: file.size,
        mimeType: file.type || 'application/pdf',
        uploadedAt: new Date().toISOString().slice(0, 10),
        dataUrl,
      };
      onChangeDocuments({
        ...documents,
        [key]: attachment,
      });
    };
    reader.onerror = () => {
      setUploadError('Erro ao carregar o arquivo. Tente novamente.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = (key: RequiredDocumentKey) => {
    setUploadError('');
    onChangeDocuments({
      ...documents,
      [key]: null,
    });
  };

  const categoryAudienceHint =
    category === 'contratante'
      ? 'Documentação exigida do responsável legal pelo cadastro da construtora.'
      : 'Documentação exigida para validar o cadastro do profissional na plataforma.';

  const hasMissingErrors = missingSex || missingKeys.length > 0;

  return (
    <div
      className={`bg-white dark:bg-[#111827] border rounded-2xl p-5 sm:p-6 space-y-4 transition-colors ${
        hasMissingErrors
          ? 'border-[#DC2626] dark:border-[#F87171]'
          : 'border-[#E5E7EB] dark:border-[#1E293B]'
      }`}
      data-testid={`required-documents-section-${category}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck
              className="w-5 h-5 text-[#C93B1E] dark:text-[#F06449] shrink-0"
              aria-hidden="true"
            />
            <h3 className="font-display text-lg sm:text-xl font-bold text-[#111827] dark:text-[#F8FAFC]">
              {sectionTitle}
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-[#4B5563] dark:text-[#94A3B8] mt-1">
            {categoryAudienceHint} Formatos aceitos: PDF, JPG, PNG ou WEBP (até 1,5 MB cada).
          </p>
        </div>

        <div
          className="shrink-0 text-left sm:text-right"
          data-testid={`required-docs-counter-${category}`}
        >
          <p
            className={`text-sm font-bold tabular-nums ${
              progress.isComplete
                ? 'text-[#047857] dark:text-[#34D399]'
                : hasMissingErrors
                  ? 'text-[#B91C1C] dark:text-[#F87171]'
                  : 'text-[#111827] dark:text-[#F8FAFC]'
            }`}
          >
            {progress.attachedCount} de {progress.totalRequired} obrigatórios anexados
          </p>
          <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">
            {sex === 'masculino'
              ? 'Inclui Reservista/CDI (sexo masculino)'
              : sex === 'feminino' || sex === 'outro'
                ? 'Histórico Criminal e Título de Eleitor'
                : 'Selecione o sexo acima para confirmar'}
          </p>
        </div>
      </div>

      {missingSex && (
        <div
          role="alert"
          data-testid={`missing-sex-docs-alert-${category}`}
          className="p-3.5 rounded-xl bg-[#FEF2F2] dark:bg-[#7F1D1D]/30 border border-[#FECACA] dark:border-[#991B1B] flex items-start gap-2.5 text-xs sm:text-sm font-semibold text-[#B91C1C] dark:text-[#FCA5A5]"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            Selecione o campo Sexo acima para liberar e validar corretamente os documentos obrigatórios.
          </span>
        </div>
      )}

      {uploadError && (
        <p
          role="alert"
          className="text-xs sm:text-sm font-semibold text-[#B91C1C] dark:text-[#F87171]"
        >
          {uploadError}
        </p>
      )}

      <div className="divide-y divide-[#E5E7EB] dark:divide-[#1E293B] border border-[#E5E7EB] dark:border-[#1E293B] rounded-xl overflow-hidden">
        {requirements.map((req) => {
          const inputId = `doc-input-${category}-${req.key}`;
          const attached = req.attachment;
          const isOptionalInactive = !req.required && sex !== '';
          const isRowMissing =
            req.required && !attached && missingKeys.includes(req.key);

          return (
            <div
              key={req.key}
              data-testid={`doc-row-${category}-${req.key}`}
              className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                isRowMissing
                  ? 'bg-[#FEF2F2]/70 dark:bg-[#7F1D1D]/15'
                  : isOptionalInactive
                    ? 'bg-[#F9FAFB] dark:bg-[#0F172A]/60 opacity-80'
                    : 'bg-white dark:bg-[#111827]'
              }`}
            >
              <input
                ref={(el) => {
                  inputRefs.current[req.key] = el;
                }}
                id={inputId}
                data-testid={`doc-upload-${category}-${req.key}`}
                type="file"
                accept={DOCUMENT_ACCEPT_ATTR}
                onChange={(e) => handleFileSelected(req.key, e)}
                className="sr-only"
              />

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="text-sm font-semibold text-[#111827] dark:text-[#F8FAFC]">
                    {req.label}
                    {req.required ? ' *' : ''}
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      req.required
                        ? 'text-[#C93B1E] dark:text-[#F06449]'
                        : 'text-[#6B7280] dark:text-[#94A3B8]'
                    }`}
                  >
                    ({req.requirementBadge})
                  </span>
                </div>

                <p className="text-xs text-[#4B5563] dark:text-[#94A3B8] leading-relaxed">
                  {req.description}
                </p>

                {attached ? (
                  <div
                    className="pt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs"
                    data-testid={`doc-status-${category}-${req.key}`}
                  >
                    <span className="inline-flex items-center gap-1 font-semibold text-[#047857] dark:text-[#34D399]">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>Anexado: {attached.fileName}</span>
                    </span>
                    <span className="text-[#6B7280] dark:text-[#94A3B8] tabular-nums">
                      {formatFileSizePtBr(attached.fileSizeBytes)}
                    </span>
                  </div>
                ) : isRowMissing ? (
                  <p
                    role="alert"
                    data-testid={`doc-error-${category}-${req.key}`}
                    className="pt-0.5 text-xs font-semibold text-[#B91C1C] dark:text-[#F87171] flex items-center gap-1.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{getDocumentFieldErrorMessage(req)}</span>
                  </p>
                ) : (
                  <p
                    className="pt-0.5 text-xs font-medium text-[#6B7280] dark:text-[#94A3B8]"
                    data-testid={`doc-status-${category}-${req.key}`}
                  >
                    {req.required
                      ? 'Pendente de anexo'
                      : sex === ''
                        ? 'Obrigatório caso selecione sexo Masculino'
                        : 'Anexo opcional para o sexo selecionado'}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => inputRefs.current[req.key]?.click()}
                  data-testid={`doc-trigger-${category}-${req.key}`}
                  aria-invalid={isRowMissing || undefined}
                  aria-label={
                    attached ? `Trocar ${req.label}` : `Anexar ${req.label}`
                  }
                  className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap ${
                    attached
                      ? 'border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] hover:bg-[#F9FAFB] dark:hover:bg-[#1E293B]'
                      : isRowMissing
                        ? 'bg-[#B91C1C] hover:bg-[#991B1B] text-white'
                        : req.required
                          ? 'bg-[#111827] hover:bg-[#1F2937] dark:bg-[#F8FAFC] dark:hover:bg-[#E2E8F0] text-white dark:text-[#0F172A]'
                          : 'border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-[#374151] dark:text-[#CBD5E1] hover:border-[#111827] dark:hover:border-[#64748B]'
                  }`}
                >
                  {attached ? (
                    <>
                      <FileCheck2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>Trocar arquivo</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>Anexar documento</span>
                    </>
                  )}
                </button>

                {attached && (
                  <button
                    type="button"
                    onClick={() => handleRemove(req.key)}
                    data-testid={`doc-remove-${category}-${req.key}`}
                    aria-label={`Remover ${req.label}`}
                    className="min-h-[44px] px-3 py-2 rounded-xl border border-[#FECACA] dark:border-[#991B1B] bg-white dark:bg-[#0F172A] text-xs font-semibold text-[#B91C1C] dark:text-[#F87171] hover:bg-[#FEF2F2] dark:hover:bg-[#7F1D1D]/30 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Remover</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Concise rules summary line */}
      <p className="text-xs text-[#4B5563] dark:text-[#94A3B8] flex items-start gap-2">
        <FileText className="w-4 h-4 text-[#6B7280] dark:text-[#94A3B8] shrink-0 mt-0.5" aria-hidden="true" />
        <span>
          Regra padrão das duas categorias: <strong>Comprovante de Histórico Criminal</strong> e{' '}
          <strong>Título de Eleitor</strong> são obrigatórios para ambos os sexos;{' '}
          <strong>Reservista ou Certificado de Dispensa de Incorporação (CDI)</strong> é obrigatório para candidatos do sexo masculino.
        </span>
      </p>
    </div>
  );
};
