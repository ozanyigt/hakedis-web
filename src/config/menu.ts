import type { FeatureModuleName } from '@/types';
import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  Calculator,
  ClipboardList,
  FolderKanban,
  LayoutDashboard,
  Receipt,
} from 'lucide-react';

export interface MenuItem {
  key: string;
  label: string;
  path: string;
  icon: LucideIcon;
  always?: boolean;
  adminOnly?: boolean;
  module?: FeatureModuleName;
}

export const MENU_ITEMS: MenuItem[] = [
  {
    key: 'dashboard',
    label: 'Özet',
    path: '/',
    icon: LayoutDashboard,
    always: true,
  },
  {
    key: 'tenants',
    label: 'Kurumlar',
    path: '/tenants',
    icon: Building2,
    adminOnly: true,
  },
  {
    key: 'projects',
    label: 'Projeler',
    path: '/projects',
    icon: FolderKanban,
    always: true,
  },
  {
    key: 'metraj',
    label: 'Metraj',
    path: '/metraj',
    icon: Calculator,
    module: 'Metraj',
  },
  {
    key: 'puantaj',
    label: 'Puantaj',
    path: '/puantaj',
    icon: ClipboardList,
    module: 'Puantaj',
  },
  {
    key: 'hakedis',
    label: 'Hakediş',
    path: '/hakedis',
    icon: Receipt,
    module: 'Hakedis',
  },
];
