import React from 'react';
import { Settings } from 'lucide-react';

export interface MobileTabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
}

interface MobileBottomNavProps {
  items: MobileTabItem[];
  activeTab: string;
  highlightedTabId?: string | null;
  onSelectTab: (tabId: string) => void;
  onOpenSettings?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  items,
  activeTab,
  highlightedTabId = null,
  onSelectTab,
  onOpenSettings,
}) => {
  const totalCols = onOpenSettings ? items.length + 1 : items.length;
  const gridClass =
    totalCols === 5
      ? 'grid-cols-5'
      : totalCols === 4
        ? 'grid-cols-4'
        : 'grid-cols-3';

  return (
    <nav
      aria-label="Navegação inferior"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 pb-safe bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-t border-[#E5E7EB] dark:border-[#1E293B]"
    >
      <div className={`grid ${gridClass} h-14 items-center`}>
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === activeTab;
          const isHighlighted = highlightedTabId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative min-h-[48px] flex flex-col items-center justify-center gap-0.5 px-1.5 active:scale-95 transition-all cursor-pointer ${
                isHighlighted
                  ? 'bg-[#C93B1E]/12 dark:bg-[#C93B1E]/25 text-[#C93B1E] dark:text-[#F06449] ring-2 ring-inset ring-[#C93B1E] dark:ring-[#F06449] rounded-lg'
                  : isActive
                    ? 'text-[#C93B1E] dark:text-[#F06449]'
                    : 'text-[#6B7280] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F8FAFC]'
              }`}
            >
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute top-0 w-10 h-0.5 bg-[#C93B1E] dark:bg-[#F06449] rounded-b-full"
                />
              )}
              <Icon className="w-5 h-5 shrink-0" aria-hidden={true} />
              <span
                className={`text-[11px] tracking-tight whitespace-nowrap ${
                  isActive ? 'font-bold' : 'font-medium'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}

        {onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            data-testid="open-settings-mobile"
            className="relative min-h-[48px] flex flex-col items-center justify-center gap-0.5 px-1.5 text-[#6B7280] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F8FAFC] active:scale-95 transition-transform cursor-pointer"
          >
            <Settings className="w-5 h-5 shrink-0" aria-hidden={true} />
            <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">
              Ajustes
            </span>
          </button>
        )}
      </div>
    </nav>
  );
};
