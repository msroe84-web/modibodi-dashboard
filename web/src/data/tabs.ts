import {
  BoxesIcon,
  CalendarDaysIcon,
  LayoutDashboardIcon,
  type LucideIcon,
  MegaphoneIcon,
  SettingsIcon,
  ShirtIcon,
  UsersIcon,
  WalletIcon,
} from 'lucide-react';

export interface TabConfig {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const TABS: TabConfig[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboardIcon },
  { id: 'marketing', label: '마케팅', icon: MegaphoneIcon },
  { id: 'calendar', label: '캠페인 캘린더', icon: CalendarDaysIcon },
  { id: 'pnl', label: '손익', icon: WalletIcon },
  { id: 'crm', label: 'CRM', icon: UsersIcon },
  { id: 'md', label: 'MD·상품', icon: ShirtIcon },
  { id: 'inventory', label: '재고', icon: BoxesIcon },
  { id: 'settings', label: '설정', icon: SettingsIcon },
];
