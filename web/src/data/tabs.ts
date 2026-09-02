import {
  BoxesIcon,
  CalendarDaysIcon,
  CalendarRangeIcon,
  ImagesIcon,
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
  { id: 'ad-performance', label: '광고 성과 분석', icon: ImagesIcon },
  { id: 'calendar', label: '캠페인 캘린더', icon: CalendarDaysIcon },
  { id: 'pnl', label: '손익', icon: WalletIcon },
  { id: 'crm', label: 'CRM', icon: UsersIcon },
  { id: 'md', label: 'MD·상품', icon: ShirtIcon },
  { id: 'inventory', label: '재고', icon: BoxesIcon },
  { id: 'personal-calendar', label: '일정관리', icon: CalendarRangeIcon },
  { id: 'settings', label: '설정', icon: SettingsIcon },
];
