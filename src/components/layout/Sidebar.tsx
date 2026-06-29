import { NavLink } from 'react-router-dom';
import { ExternalLink, X } from 'lucide-react';
import { MENU_ITEMS } from '@/config/menu';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { hasAnyClaim, hasClaim } from '@/config/permissions';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const { isAdmin, roles } = useAuth();
  const { hasModule, isReady } = useTenant();

  const visibleItems = MENU_ITEMS.filter((item) => {
    if (item.always) {
      return true;
    }
    if (item.adminOnly) {
      return isAdmin;
    }
    if (item.anyClaim && !hasAnyClaim(roles, item.anyClaim)) {
      return false;
    }
    if (item.claim && !hasClaim(roles, item.claim)) {
      return false;
    }
    if (item.module) {
      if (!isReady) {
        return false;
      }
      return hasModule(item.module);
    }
    return true;
  });

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-700 px-5 py-4">
        <div className="flex items-center gap-3">
          <BrandLogo size="sm" />
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400">SahaMetrik</p>
            <h1 className="text-sm font-semibold text-white">İnşaat SaaS</h1>
          </div>
        </div>
        <button
          type="button"
          className="rounded-md p-1 text-slate-300 hover:bg-slate-800 lg:hidden"
          onClick={onClose}
          aria-label="Menüyü kapat"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.key}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                ].join(' ')
              }
              end={item.path === '/app'}
            >
              <Icon size={18} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {isAdmin ? (
        <div className="border-t border-slate-700 p-3">
          <NavLink
            to="/platform"
            onClick={onClose}
            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-amber-300 hover:bg-slate-800 hover:text-amber-200"
          >
            <ExternalLink size={16} />
            Platform paneli
          </NavLink>
        </div>
      ) : null}
    </div>
  );

  return (
    <>
      <aside className="hidden h-screen w-64 shrink-0 bg-sidebar lg:block">{content}</aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
            aria-label="Menü arka planı"
          />
          <aside className="relative z-50 h-full w-72 bg-sidebar shadow-xl">{content}</aside>
        </div>
      ) : null}
    </>
  );
}
