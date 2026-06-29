import type { LucideIcon } from 'lucide-react';
import { Building2, CreditCard, Inbox, LayoutDashboard, Package, PlusCircle } from 'lucide-react';

export interface PlatformMenuItem {
  key: string;
  label: string;
  path: string;
  icon: LucideIcon;
}

export const PLATFORM_MENU_ITEMS: PlatformMenuItem[] = [
  { key: 'dashboard', label: 'Özet', path: '/platform', icon: LayoutDashboard },
  { key: 'tenants', label: 'Firmalar', path: '/platform/tenants', icon: Building2 },
  { key: 'new-tenant', label: 'Yeni Firma', path: '/platform/tenants/new', icon: PlusCircle },
  { key: 'demo-requests', label: 'Demo Talepleri', path: '/platform/demo-requests', icon: Inbox },
  { key: 'plans', label: 'Abonelik Planları', path: '/platform/plans', icon: Package },
  { key: 'subscriptions', label: 'Abonelikler', path: '/platform/subscriptions', icon: CreditCard },
];
