import React from 'react';
import { Home, Wheat, PawPrint, MessageSquareQuote, Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type NavTab = 'home' | 'crops' | 'animals' | 'farmchat' | 'more';

interface BottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  const { t } = useTranslation();

  const navItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: t('nav.home'), icon: Home },
    { id: 'crops', label: t('nav.crops'), icon: Wheat },
    { id: 'animals', label: t('nav.animals'), icon: PawPrint },
    { id: 'farmchat', label: t('nav.farmChat'), icon: MessageSquareQuote },
    { id: 'more', label: t('nav.more'), icon: Menu },
  ];

  return (
    <nav
      id="bottom-navigation-bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-farm-navy border-t-2 border-slate-800 shadow-[0_-4px_16px_rgba(0,0,0,0.2)] pb-safe"
    >
      <div className="max-w-4xl mx-auto flex items-center justify-around px-1 py-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              type="button"
              onClick={() => onChangeTab(item.id)}
              className={`flex-1 min-h-[58px] min-w-[48px] py-1.5 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer select-none ${
                isActive
                  ? 'bg-farm-navy-light text-farm-cyan font-extrabold ring-1 ring-farm-cyan/40 shadow-inner'
                  : 'text-slate-300 hover:text-white active:scale-95 font-semibold'
              }`}
            >
              <Icon className={`w-6 h-6 stroke-[2.4] ${isActive ? 'text-farm-cyan scale-110' : 'text-slate-300'}`} />
              <span className="text-[13px] sm:text-sm tracking-tight leading-none text-center truncate max-w-full">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
