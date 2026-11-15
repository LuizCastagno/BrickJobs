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
  highlightedTabId?: string | null;
  onSelectTab: (tabId: string) => void;
  onBackToCover: () => void;
  onSwitchRole: () => void;
  onOpenSettings: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  role,
  tabs,
  activeTab,
  highlightedTabId = null,
  onSelectTab,
  onBackToCover,
  onSwitchRole,
  onOpenSettings,
}) => {
  const switchLabel = role === 'contratante' ? 'Ir para Contratado' : 'Ir para Contratante';

  return (
    <header className="sticky top-0 z-30 pt-safe bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-b border-[#E5E7EB] dark:border-[#1E293B]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-12 md:h-16 flex items-center justify-between gap-4 md:gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={onBackToCover}
          aria-label="Voltar para a capa do BrickJobs"
          className="min-h-[44px] inline-flex items-center focus-visible:outline-2 focus-visible:outline-[#C93B1E] rounded-md cursor-pointer"
        >
          <BrickLogo size="sm" />
        </button>

        {/* Zone 2: Desktop single-line nav tabs */}
        <nav aria-label="Navegação principal" className="hidden md:flex items-center gap-6">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            const isHighlighted = highlightedTabId === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`py-1.5 text-sm font-medium whitespace-nowrap shrink-0 border-b-2 transition-all cursor-pointer ${
                  isHighlighted
                    ? 'px-2.5 rounded-lg border-[#C93B1E] dark:border-[#F06449] bg-[#C93B1E]/10 dark:bg-[#C93B1E]/20 text-[#C93B1E] dark:text-[#F06449] ring-2 ring-[#C93B1E] dark:ring-[#F06449]'
                    : isActive
                      ? 'border-[#C93B1E] dark:border-[#F06449] text-[#111827] dark:text-[#F8FAFC]'
                      : 'border-transparent text-[#4B5563] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F8FAFC]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={onOpenSettings}
            data-testid="open-settings-nav"
            className="py-1.5 text-sm font-medium whitespace-nowrap shrink-0 border-b-2 border-transparent text-[#4B5563] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F8FAFC] transition-colors cursor-pointer"
          >
            Configurações
          </button>
        </nav>

        {/* Mobile current mode title */}
        <span className="md:hidden text-sm font-semibold text-[#111827] dark:text-[#F8FAFC] truncate">
          {role === 'contratante' ? 'Contratante' : 'Contratado'}
        </span>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onSwitchRole}
            className="min-h-[44px] px-3 md:px-4 py-1.5 rounded-lg border border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#1E293B] hover:bg-[#F4F5F7] dark:hover:bg-[#334155] text-xs sm:text-sm font-medium text-[#111827] dark:text-[#F8FAFC] inline-flex items-center gap-2 whitespace-nowrap shrink-0 active:scale-[0.98] transition-all cursor-pointer"
          >
            <ArrowLeftRight className="w-4 h-4 text-[#C93B1E] dark:text-[#F06449]" aria-hidden="true" />
            <span className="hidden sm:inline">{switchLabel}</span>
            <span className="sm:hidden">Trocar</span>
          </button>
        </div>
      </div>
    </header>
  );
};
