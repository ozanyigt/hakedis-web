import { LogOut, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate();
  const { email, logout } = useAuth();
  const { tenants, tenantId, tenantName, setTenantId, isLoading, canSwitchTenant } = useTenant();

  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
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
          <p className="text-xs text-slate-500">Aktif kurum</p>
          <p className="font-medium text-slate-900">{tenantName ?? 'Kurum seçilmedi'}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {canSwitchTenant ? (
          <select
            className="min-w-48 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            value={tenantId ?? ''}
            disabled={isLoading || tenants.length === 0}
            onChange={(event) => setTenantId(event.target.value)}
          >
            {tenants.length === 0 ? <option value="">Kurum bulunamadı</option> : null}
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </select>
        ) : null}

        <div className="hidden text-right sm:block">
          <p className="text-xs text-slate-500">Kullanıcı</p>
          <p className="text-sm font-medium text-slate-800">{email}</p>
        </div>

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
