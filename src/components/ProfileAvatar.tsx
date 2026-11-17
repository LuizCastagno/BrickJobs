import React, { useEffect, useId, useMemo, useState } from 'react';
import {
  extractAvatarInitials,
  getAvatarPaletteForName,
  hasConfiguredAvatarPhoto,
  type AvatarEntityType,
} from '../utils/avatar';

export type ProfileAvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ProfileAvatarShape = 'auto' | 'circle' | 'rounded';

export interface ProfileAvatarProps {
  name: string;
  photoUrl?: string | null;
  entityType?: AvatarEntityType;
  size?: ProfileAvatarSize;
  shape?: ProfileAvatarShape;
  alt?: string;
  fallbackInitials?: string;
  className?: string;
  testId?: string;
}

const SIZE_CLASSES: Record<ProfileAvatarSize, string> = {
  xs: 'w-7 h-7',
  sm: 'w-9 h-9',
  md: 'w-11 h-11',
  lg: 'w-14 h-14',
  xl: 'w-16 h-16 sm:w-18 sm:h-18',
};

const SVG_FONT_SIZE_BY_SIZE: Record<ProfileAvatarSize, number> = {
  xs: 42,
  sm: 40,
  md: 38,
  lg: 36,
  xl: 36,
};

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  name,
  photoUrl,
  entityType = 'worker',
  size = 'md',
  shape = 'auto',
  alt,
  fallbackInitials = 'BJ',
  className = '',
  testId,
}) => {
  const [imageError, setImageError] = useState(false);
  const gradientId = useId();

  useEffect(() => {
    setImageError(false);
  }, [photoUrl]);

  const trimmedName = (name || '').trim();
  const initials = useMemo(
    () => extractAvatarInitials(trimmedName, fallbackInitials),
    [trimmedName, fallbackInitials]
  );
  const palette = useMemo(
    () => getAvatarPaletteForName(trimmedName, entityType),
    [trimmedName, entityType]
  );

  const showPhoto = hasConfiguredAvatarPhoto(photoUrl) && !imageError;

  const resolvedShapeClass =
    shape === 'circle'
      ? 'rounded-full'
      : shape === 'rounded'
        ? 'rounded-xl'
        : entityType === 'company'
          ? 'rounded-xl'
          : 'rounded-full';

  const accessibleLabel =
    alt ??
    (trimmedName
      ? entityType === 'company'
        ? `Logo ou iniciais da construtora ${trimmedName}`
        : `Foto ou iniciais de ${trimmedName}`
      : entityType === 'company'
        ? 'Avatar padrão da construtora'
        : 'Avatar padrão do trabalhador');

  return (
    <div
      data-testid={testId}
      data-avatar-mode={showPhoto ? 'photo' : 'initials'}
      data-initials={initials}
      data-entity-type={entityType}
      className={`relative shrink-0 overflow-hidden select-none border border-black/10 dark:border-white/10 shadow-xs ${SIZE_CLASSES[size]} ${resolvedShapeClass} ${className}`}
    >
      {showPhoto ? (
        <img
          src={photoUrl!.trim()}
          alt={accessibleLabel}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover block"
        />
      ) : (
        <svg
          viewBox="0 0 100 100"
          role="img"
          aria-label={accessibleLabel}
          className="w-full h-full block"
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={palette.bgStart} />
              <stop offset="100%" stopColor={palette.bgEnd} />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill={`url(#${gradientId})`} />
          <rect
            x="2"
            y="2"
            width="96"
            height="96"
            rx={resolvedShapeClass === 'rounded-full' ? 48 : 20}
            fill="none"
            stroke="#FFFFFF"
            strokeOpacity="0.18"
            strokeWidth="2"
          />
          <text
            x="50"
            y="51"
            fill={palette.textColor}
            fontFamily="Outfit, Plus Jakarta Sans, sans-serif"
            fontSize={SVG_FONT_SIZE_BY_SIZE[size]}
            fontWeight="700"
            letterSpacing="0.03em"
            textAnchor="middle"
            dominantBaseline="central"
          >
            {initials}
          </text>
        </svg>
      )}
    </div>
  );
};
