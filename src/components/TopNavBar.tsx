/**
 * @file TopNavBar.tsx
 * @description Barra de navegação superior fixa para desktop/tablet com marca, abas de seção
 *   e ação rápida de alternância entre os portais Contratante e Contratado.
 */
import React from 'react';
import { ArrowLeftRight } from 'lucide-react';
import type { UserRole } from '../types/brickjobs';
import { BrickLogo } from './BrickLogo';

/** Item individual exibido na barra de navegação superior (desktop). */
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 md:h-16 flex items-center justify-between gap-3 lg:gap-4">
        {/* Zona 1: Marca e retorno para capa */}
        <button
          type="button"
          onClick={onBackToCover}
          aria-label="Voltar para a capa do BrickJobs"
          className="min-h-[44px] inline-flex items-center shrink-0 focus-visible:outline-2 focus-visible:outline-[#C93B1E] rounded-md cursor-pointer"
        >
          <BrickLogo size="sm" />
        </button>

        {/* Zona 2: Abas de navegação desktop — wrapper interno com mx-auto e espaçamento calibrado para zero corte */}
        <nav
          aria-label="Navegação principal"
          className="hidden md:flex flex-1 min-w-0 items-center overflow-x-auto px-1"
        >
          <div className="flex items-center gap-2.5 lg:gap-3 xl:gap-3.5 mx-auto">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTab;
              const isHighlighted = highlightedTabId === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`min-h-[40px] py-1.5 text-xs lg:text-[13px] font-medium whitespace-nowrap shrink-0 border-b-2 inline-flex items-center transition-colors cursor-pointer ${
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
              className="min-h-[40px] py-1.5 text-xs lg:text-[13px] font-medium whitespace-nowrap shrink-0 border-b-2 border-transparent text-[#4B5563] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F8FAFC] inline-flex items-center transition-colors cursor-pointer"
            >
              Configurações
            </button>
          </div>
        </nav>

        {/* Título compacto no mobile */}
        <span className="md:hidden text-sm font-semibold text-[#111827] dark:text-[#F8FAFC] truncate">
          {role === 'contratante' ? 'Contratante' : 'Contratado'}
        </span>

        {/* Zona 3: Ação principal de troca de perfil */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onSwitchRole}
            className="min-h-[44px] px-3 md:px-4 py-1.5 rounded-lg border border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#1E293B] hover:bg-[#F4F5F7] dark:hover:bg-[#334155] text-xs sm:text-sm font-medium text-[#111827] dark:text-[#F8FAFC] inline-flex items-center gap-2 whitespace-nowrap shrink-0 active:scale-[0.98] transition-all cursor-pointer"
          >
            <ArrowLeftRight className="w-4 h-4 text-[#C93B1E] dark:text-[#F06449] shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">{switchLabel}</span>
            <span className="sm:hidden">Trocar</span>
          </button>
        </div>
      </div>
    </header>
  );
};
