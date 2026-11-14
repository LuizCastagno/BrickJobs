import React from 'react';

interface BrickLogoProps {
  size?: 'sm' | 'md';
}

export const BrickLogo: React.FC<BrickLogoProps> = ({ size = 'md' }) => {
  const iconSize = size === 'sm' ? 'w-7 h-7' : 'w-8 h-8';
  const textSize = size === 'sm' ? 'text-lg' : 'text-xl';

  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0">
      <svg
        className={`${iconSize} shrink-0`}
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
      >
        <rect width="32" height="32" rx="7" fill="#111827" />
        <rect x="6" y="7" width="9" height="5" rx="1" fill="#C93B1E" />
        <rect x="17" y="7" width="9" height="5" rx="1" fill="#E5E7EB" />
        <rect x="6" y="13.5" width="5" height="5" rx="1" fill="#E5E7EB" />
        <rect x="13" y="13.5" width="13" height="5" rx="1" fill="#C93B1E" />
        <rect x="6" y="20" width="11" height="5" rx="1" fill="#E5E7EB" />
        <rect x="19" y="20" width="7" height="5" rx="1" fill="#C93B1E" />
      </svg>
      <span className={`font-display font-bold tracking-tight text-[#111827] ${textSize}`}>
        Brick<span className="text-[#C93B1E]">Jobs</span>
      </span>
    </span>
  );
};
