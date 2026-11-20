/**
 * @file src/components/ProfilePhotoField.tsx
 * @description Campo de upload, validação e compressão automática de foto de perfil ou logotipo da empresa.
 */

import React, { useId, useRef, useState } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import {
  compressAvatarImageFile,
  hasConfiguredAvatarPhoto,
  validateAvatarImageFile,
  type AvatarEntityType,
} from '../utils/avatar';
import { ProfileAvatar } from './ProfileAvatar';

interface ProfilePhotoFieldProps {
  name: string;
  photoUrl?: string | null;
  entityType: AvatarEntityType;
  onChangePhotoUrl: (nextUrl: string) => void;
  testIdPrefix: string;
}

export const ProfilePhotoField: React.FC<ProfilePhotoFieldProps> = ({
  name,
  photoUrl,
  entityType,
  onChangePhotoUrl,
  testIdPrefix,
}) => {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const hasPhoto = hasConfiguredAvatarPhoto(photoUrl);
  const title =
    entityType === 'company'
      ? 'Logotipo ou foto da construtora'
      : 'Foto de perfil (opcional)';
  const helper =
    entityType === 'company'
      ? 'Sem logotipo enviado, o BrickJobs exibe automaticamente as iniciais da construtora.'
      : 'Se preferir não enviar foto, suas iniciais são exibidas automaticamente no perfil.';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setError('');
    const check = validateAvatarImageFile({
      name: file.name,
      type: file.type,
      size: file.size,
    });
    if (!check.ok) {
      setError(check.error ?? 'Arquivo de imagem inválido.');
      return;
    }

    setIsProcessing(true);
    try {
      const compressed = await compressAvatarImageFile(file);
      onChangePhotoUrl(compressed);
    } catch {
      setError('Não foi possível processar a imagem selecionada.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      data-testid={`${testIdPrefix}-photo-field`}
      className="rounded-xl border border-[#E5E7EB] dark:border-[#1E293B] bg-[#F9FAFB] dark:bg-[#0F172A] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <ProfileAvatar
          name={name}
          photoUrl={photoUrl}
          entityType={entityType}
          size="xl"
          testId={`${testIdPrefix}-avatar-preview`}
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#111827] dark:text-[#F8FAFC]">
            {title}
          </p>
          <p className="text-xs text-[#4B5563] dark:text-[#94A3B8] mt-0.5 leading-relaxed">
            {helper}
          </p>
          {error && (
            <p
              role="alert"
              data-testid={`${testIdPrefix}-photo-error`}
              className="mt-1.5 text-xs font-semibold text-[#B91C1C] dark:text-[#F87171]"
            >
              {error}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <input
          ref={fileInputRef}
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          data-testid={`${testIdPrefix}-photo-input`}
          className="sr-only"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          data-testid={`${testIdPrefix}-upload-photo-button`}
          className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#1E293B] hover:bg-[#F3F4F6] dark:hover:bg-[#334155] text-xs font-semibold text-[#111827] dark:text-[#F8FAFC] inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
        >
          <Camera className="w-4 h-4 text-[#C93B1E] dark:text-[#F06449] shrink-0" aria-hidden="true" />
          <span>
            {isProcessing
              ? 'Processando...'
              : hasPhoto
                ? 'Alterar foto'
                : entityType === 'company'
                  ? 'Enviar logotipo'
                  : 'Enviar foto'}
          </span>
        </button>

        {hasPhoto && (
          <button
            type="button"
            onClick={() => {
              setError('');
              onChangePhotoUrl('');
            }}
            data-testid={`${testIdPrefix}-remove-photo-button`}
            className="min-h-[44px] px-3 py-2 rounded-xl border border-[#FECACA] dark:border-[#7F1D1D] bg-white dark:bg-[#1E293B] hover:bg-[#FEF2F2] dark:hover:bg-[#7F1D1D]/40 text-xs font-semibold text-[#B91C1C] dark:text-[#FCA5A5] inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Usar iniciais</span>
          </button>
        )}
      </div>
    </div>
  );
};
