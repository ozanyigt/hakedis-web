import { NavLink } from 'react-router-dom';
import { ExternalLink, X } from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { PLATFORM_MENU_ITEMS } from '@/config/platformMenu';

interface PlatformSidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export function PlatformSidebar({ mobileOpen, onClose }: PlatformSidebarProps) {
  const content = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-700 px-5 py-4">
        <div>
          <BrandLogo size="md" />
          <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-amber-400">
            Platform
          </p>
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
        {PLATFORM_MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.key}
              to={item.path}
              onClick={onClose}
              end={item.path === '/platform'}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                  isActive
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                ].join(' ')
              }
            >
              <Icon size={18} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-slate-700 p-3">
        <NavLink
          to="/app"
          className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <ExternalLink size={16} />
          Müşteri uygulaması
        </NavLink>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden h-full w-64 shrink-0 overflow-y-auto bg-slate-950 lg:block">{content}</aside>
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
            aria-label="Menü arka planı"
          />
          <aside className="relative z-50 h-full w-72 bg-slate-950 shadow-xl">{content}</aside>
        </div>
      ) : null}
    </>
  );
}
