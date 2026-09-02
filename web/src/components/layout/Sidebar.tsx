import { ChevronsLeftIcon, ChevronsRightIcon, MoonIcon, SunIcon } from 'lucide-react';
import logoBlack from '../../assets/logos/modibodi_black.png';
import logoWhite from '../../assets/logos/modibodi_white.png';
import { TABS } from '../../data/tabs';
import type { Theme } from '../../hooks/useTheme';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (id: string) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  theme: Theme;
  onToggleTheme: () => void;
}

export function Sidebar({ activeTab, onSelectTab, collapsed, onToggleCollapsed, theme, onToggleTheme }: SidebarProps) {
  return (
    <aside
      className={`flex h-full shrink-0 flex-col border-r border-hairline bg-surface transition-[width] duration-200 ease-out ${
        collapsed ? 'w-[68px]' : 'w-[228px]'
      }`}
    >
      <div className="flex h-16 items-center overflow-hidden px-4">
        <img
          src={theme === 'dark' ? logoWhite : logoBlack}
          alt="모디보디 코리아"
          className={`h-[18px] w-auto shrink-0 object-contain object-left transition-[max-width,opacity] duration-200 ${
            collapsed ? 'max-w-0 opacity-0' : 'max-w-[160px] opacity-100'
          }`}
        />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2.5 py-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              title={collapsed ? tab.label : undefined}
              className={`group flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-[13.5px] font-medium transition-colors ${
                isActive
                  ? 'bg-primary-soft text-primary-ink'
                  : 'text-ink-secondary hover:bg-surface-sunken hover:text-ink'
              }`}
            >
              <Icon size={18} strokeWidth={2.25} className="shrink-0" />
              <span
                className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ${
                  collapsed ? 'max-w-0 opacity-0' : 'max-w-[160px] opacity-100'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-hairline px-2.5 py-2.5">
        <button
          type="button"
          onClick={onToggleTheme}
          className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-[13.5px] font-medium text-ink-secondary transition-colors hover:bg-surface-sunken hover:text-ink"
        >
          {theme === 'dark' ? <SunIcon size={18} strokeWidth={2.25} /> : <MoonIcon size={18} strokeWidth={2.25} />}
          <span
            className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ${
              collapsed ? 'max-w-0 opacity-0' : 'max-w-[160px] opacity-100'
            }`}
          >
            {theme === 'dark' ? '라이트 모드' : '다크 모드'}
          </span>
        </button>
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-[13.5px] font-medium text-ink-secondary transition-colors hover:bg-surface-sunken hover:text-ink"
        >
          {collapsed ? <ChevronsRightIcon size={18} strokeWidth={2.25} /> : <ChevronsLeftIcon size={18} strokeWidth={2.25} />}
          <span
            className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ${
              collapsed ? 'max-w-0 opacity-0' : 'max-w-[160px] opacity-100'
            }`}
          >
            접기
          </span>
        </button>
      </div>
    </aside>
  );
}
