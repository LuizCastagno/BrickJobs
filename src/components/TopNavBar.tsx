import React from 'react';
import { ArrowLeftRight } from 'lucide-react';
import type { UserRole } from '../types/brickjobs';
import { BrickLogo } from './BrickLogo';

export interface NavTabItem {
  id: string;
  label: string;
}

interface TopNavBarProps {
  role: UserRole;
  tabs: NavTabItem[];
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  onBackToCover: () => void;
  onSwitchRole: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  role,
  tabs,
  activeTab,
  onSelectTab,
  onBackToCover,
  onSwitchRole,
}) => {
  const switchLabel = role === 'contratante' ? 'Ir para Contratado' : 'Ir para Contratante';

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-[52px] md:h-16 flex items-center justify-between gap-4 md:gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={onBackToCover}
          aria-label="Voltar para a capa do BrickJobs"
          className="focus-visible:outline-2 focus-visible:outline-[#C93B1E] rounded-md cursor-pointer"
        >
          <BrickLogo size="sm" />
        </button>

        {/* Zone 2: Desktop single-line nav tabs */}
        <nav aria-label="Navegação principal" className="hidden md:flex items-center gap-6">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`py-1.5 text-sm font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                  isActive
                    ? 'border-[#C93B1E] text-[#111827]'
                    : 'border-transparent text-[#4B5563] hover:text-[#111827]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Mobile current mode title */}
        <span className="md:hidden text-sm font-semibold text-[#111827] truncate">
          {role === 'contratante' ? 'Contratante' : 'Contratado'}
        </span>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onSwitchRole}
            className="min-h-[40px] md:min-h-[44px] px-3 md:px-4 py-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F4F5F7] text-xs sm:text-sm font-medium text-[#111827] inline-flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            <ArrowLeftRight className="w-4 h-4 text-[#C93B1E]" aria-hidden="true" />
            <span className="hidden sm:inline">{switchLabel}</span>
            <span className="sm:hidden">Trocar</span>
          </button>
        </div>
      </div>
    </header>
  );
};
