import { Link } from 'react-router-dom';
import { getActiveModulesMessage } from '@/config/firmRoles';
import { canAccessProjectsPage } from '@/config/permissions';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';

export function DashboardPage() {
  const { roles } = useAuth();
  const {
    tenantName,
    enabledModules,
    firmRole,
    secondaryFirmRole,
    hasModule,
    isReady,
  } = useTenant();
  const showProjectsLink = canAccessProjectsPage(roles);
  const showMetrajLink = hasModule('Metraj');

  const modulesMessage = getActiveModulesMessage({
    enabledModules,
    firmRole,
    secondaryFirmRole,
    tenantName,
    isReady,
  });

  const modulesHint =
    enabledModules.length === 0 && isReady && firmRole
      ? 'Modül erişimi abonelik planı ile rolünüzün kesişimine göre belirlenir.'
      : null;

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-bold text-slate-900">Özet</h2>
        <p className="mt-1 text-slate-600">
          {tenantName
            ? `${tenantName} için aktif modüller ve hızlı işlemler`
            : 'Kurum seçerek başlayın'}
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900">Aktif Modüller</h3>
          <p
            className={`mt-2 text-sm ${
              enabledModules.length > 0 ? 'text-slate-600' : 'text-amber-800'
            }`}
          >
            {modulesMessage}
          </p>
          {modulesHint ? <p className="mt-2 text-xs text-slate-500">{modulesHint}</p> : null}
        </article>

        {showMetrajLink ? (
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-slate-900">DXF ile metraj</h3>
            <p className="mt-2 text-sm text-slate-600">
              Proje çizimini DXF yükleyip metrajı hesaplayın, kontrol edip onaylayın.
            </p>
            <Link
              to="/app/metraj"
              className="mt-4 inline-flex rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Metraj ekranına git
            </Link>
          </article>
        ) : null}

        {showProjectsLink ? (
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-slate-900">Projeler</h3>
            <p className="mt-2 text-sm text-slate-600">Şantiye ve proje kayıtlarını yönetin.</p>
            <Link
              to="/app/projects"
              className="mt-4 inline-flex rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Projeleri görüntüle
            </Link>
          </article>
        ) : null}
      </div>
    </div>
  );
}
