import { LogOut, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface PlatformHeaderProps {
  onMenuClick: () => void;
}

export function PlatformHeader({ onMenuClick }: PlatformHeaderProps) {
  const navigate = useNavigate();
  const { email, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-md border border-slate-200 p-2 text-slate-700 hover:bg-slate-50 lg:hidden"
          aria-label="Menüyü aç"
        >
          <Menu size={18} />
        </button>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-600">
            SahaMetrik Platform
          </p>
          <p className="text-sm text-slate-600">Firma ve abonelik yönetimi</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <p className="hidden text-sm text-slate-600 sm:block">{email}</p>
        <button
          type="button"
          onClick={() => {
            logout();
            navigate('/');
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <LogOut size={16} />
          Çıkış
        </button>
      </div>
    </header>
  );
}
