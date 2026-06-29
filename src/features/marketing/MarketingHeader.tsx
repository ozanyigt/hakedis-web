import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { BrandLogo } from '@/components/brand/BrandLogo';

const NAV_LINKS = [
  { label: 'Özellikler', href: '#ozellikler' },
  { label: 'Modüller', href: '#moduller' },
  { label: 'Nasıl Çalışır', href: '#nasil-calisir' },
] as const;

export function MarketingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <BrandLogo
          to="/"
          size="sm"
          showWordmark
          wordmarkClassName="text-lg font-semibold tracking-tight text-white group-hover:text-brand-100"
        />

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={isHome ? link.href : `/${link.href}`}
              className="text-sm font-medium text-slate-300 transition hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-200 transition hover:text-white"
          >
            Giriş Yap
          </Link>
          <Link
            to="/demo-talep"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-500"
          >
            Demo Talep Et
          </Link>
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-slate-300 hover:bg-white/10 md:hidden"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label="Menü"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-white/10 bg-slate-950 px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={isHome ? link.href : `/${link.href}`}
                className="text-sm font-medium text-slate-300"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/login"
              className="text-sm font-medium text-slate-300"
              onClick={() => setMobileOpen(false)}
            >
              Giriş Yap
            </Link>
            <Link
              to="/demo-talep"
              className="rounded-lg bg-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-white"
              onClick={() => setMobileOpen(false)}
            >
              Demo Talep Et
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
