import { NavLink } from 'react-router-dom';
import { MENU_ITEMS } from '@/config/menu';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { X } from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const { isAdmin } = useAuth();
  const { hasModule } = useTenant();

  const visibleItems = MENU_ITEMS.filter((item) => {
    if (item.always) {
      return true;
    }
    if (item.adminOnly) {
      return isAdmin;
    }
    if (item.module) {
      return hasModule(item.module);
    }
    return true;
  });

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-700 px-5 py-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-400">Hakediş</p>
          <h1 className="text-lg font-semibold text-white">İnşaat SaaS</h1>
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
              end={item.path === '/'}
            >
              <Icon size={18} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
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
