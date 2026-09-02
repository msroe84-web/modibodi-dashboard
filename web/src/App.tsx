import { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { OverviewTab } from './components/overview/OverviewTab';
import { MarketingTab } from './components/marketing/MarketingTab';
import { AdPerformanceTab } from './components/marketing/AdPerformanceTab';
import { CalendarTab } from './components/calendar/CalendarTab';
import { PnlTab } from './components/pnl/PnlTab';
import { CrmTab } from './components/crm/CrmTab';
import { MdTab } from './components/md/MdTab';
import { InventoryTab } from './components/inventory/InventoryTab';
import { PersonalCalendarTab } from './components/calendar/PersonalCalendarTab';
import { SettingsTab } from './components/settings/SettingsTab';
import { SettingsProvider } from './context/SettingsContext';
import { useTheme } from './hooks/useTheme';

const TAB_COMPONENTS: Record<string, () => React.JSX.Element> = {
  overview: OverviewTab,
  marketing: MarketingTab,
  'ad-performance': AdPerformanceTab,
  calendar: CalendarTab,
  pnl: PnlTab,
  crm: CrmTab,
  md: MdTab,
  inventory: InventoryTab,
  'personal-calendar': PersonalCalendarTab,
  settings: SettingsTab,
};

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [collapsed, setCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const ActiveComponent = TAB_COMPONENTS[activeTab] ?? OverviewTab;

  return (
    <SettingsProvider>
      <div className="flex h-screen overflow-hidden bg-page">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((c) => !c)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        <main className="h-full min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-6 py-6 lg:px-8">
          <ActiveComponent />
        </main>
      </div>
    </SettingsProvider>
  );
}

export default App;
