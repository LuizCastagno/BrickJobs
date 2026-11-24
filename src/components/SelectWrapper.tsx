/**
 * @file src/components/SelectWrapper.tsx
 * @description Wrapper reutilizável para controles `<select>` nativos com seta vetorial ChevronDown
 *   uniformemente alinhada à direita.
 */
import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectWrapperProps {
  children: React.ReactNode;
  className?: string;
  chevronClassName?: string;
}

/**
 * Envolve controles `<select>` nativos (que devem usar `appearance-none pr-10`)
 * com um vetor Lucide `ChevronDown` alinhado de forma uniforme à direita.
 */
export const SelectWrapper: React.FC<SelectWrapperProps> = ({
  children,
  className = '',
  chevronClassName = 'right-3.5',
}) => {
  return (
    <div className={`relative ${className}`}>
      {children}
      <ChevronDown
        className={`w-4 h-4 text-[#6B7280] dark:text-[#94A3B8] absolute top-1/2 -translate-y-1/2 pointer-events-none shrink-0 ${chevronClassName}`}
        aria-hidden="true"
      />
    </div>
  );
};
