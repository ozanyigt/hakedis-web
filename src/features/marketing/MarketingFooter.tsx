import { Link } from 'react-router-dom';
import { BrandLogo } from '@/components/brand/BrandLogo';

export function MarketingFooter() {
  return (
    <footer className="border-t border-white/10 bg-slate-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-start gap-4">
          <BrandLogo size="md" />
          <div>
            <p className="text-lg font-semibold text-white">SahaMetrik</p>
            <p className="mt-1 max-w-md text-sm text-slate-400">
              İnşaat sahaları için metraj, puantaj ve hakediş süreçlerini tek platformda yönetin.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-slate-400">
          <Link to="/demo-talep" className="hover:text-white">
            Demo Talep Et
          </Link>
          <Link to="/login" className="hover:text-white">
            Giriş Yap
          </Link>
        </div>
      </div>
      <div className="border-t border-white/5 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} SahaMetrik. Tüm hakları saklıdır.
      </div>
    </footer>
  );
}
