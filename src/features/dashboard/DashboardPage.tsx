import { Link } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';

export function DashboardPage() {
  const { tenantName, enabledModules } = useTenant();

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
          <p className="mt-2 text-sm text-slate-600">
            {enabledModules.length > 0 ? enabledModules.join(', ') : 'Modül bulunamadı'}
          </p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900">DWG / DXF Yükleme</h3>
          <p className="mt-2 text-sm text-slate-600">
            Proje çizimlerini yükleyip metraj hesaplamasını başlatın.
          </p>
          <Link
            to="/metraj"
            className="mt-4 inline-flex rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Metraj ekranına git
          </Link>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900">Projeler</h3>
          <p className="mt-2 text-sm text-slate-600">Şantiye ve proje kayıtlarını yönetin.</p>
          <Link
            to="/projects"
            className="mt-4 inline-flex rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Projeleri görüntüle
          </Link>
        </article>
      </div>
    </div>
  );
}
