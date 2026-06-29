import type { FeatureModuleName } from '@/types';
import type { LucideIcon } from 'lucide-react';
import {
  Calculator,
  ClipboardList,
  FolderKanban,
  LayoutDashboard,
  Receipt,
  Users,
} from 'lucide-react';

export interface MenuItem {
  key: string;
  label: string;
  path: string;
  icon: LucideIcon;
  always?: boolean;
  adminOnly?: boolean;
  claim?: string;
  anyClaim?: string[];
  module?: FeatureModuleName;
}

export const MENU_ITEMS: MenuItem[] = [
  {
    key: 'dashboard',
    label: 'Özet',
    path: '/app',
    icon: LayoutDashboard,
    always: true,
  },
  {
    key: 'users',
    label: 'Kullanıcılar',
    path: '/app/users',
    icon: Users,
    claim: 'Users.Read',
  },
  {
    key: 'projects',
    label: 'Projeler',
    path: '/app/projects',
    icon: FolderKanban,
    anyClaim: ['Projects.Admin', 'Sites.Admin'],
  },
  {
    key: 'metraj',
    label: 'Metraj',
    path: '/app/metraj',
    icon: Calculator,
    module: 'Metraj',
  },
  {
    key: 'puantaj',
    label: 'Puantaj',
    path: '/app/puantaj',
    icon: ClipboardList,
    module: 'Puantaj',
  },
  {
    key: 'hakedis',
    label: 'Hakediş',
    path: '/app/hakedis',
    icon: Receipt,
    module: 'Hakedis',
  },
];
