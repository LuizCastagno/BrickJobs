import React from 'react';

export interface MobileTabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
}

interface MobileBottomNavProps {
  items: MobileTabItem[];
  activeTab: string;
  onSelectTab: (tabId: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  items,
  activeTab,
  onSelectTab,
}) => {
  return (
    <nav
      aria-label="Navegação inferior"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5E7EB]"
    >
      <div className="grid grid-cols-3 h-16 items-center">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === activeTab;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative min-h-[48px] flex flex-col items-center justify-center gap-1 px-2 cursor-pointer ${
                isActive ? 'text-[#C93B1E]' : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute top-0 w-10 h-0.5 bg-[#C93B1E] rounded-b-full"
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
      </div>
    </nav>
  );
};
