import { Plus } from 'lucide-react';
import { DailyReportForm } from './DailyReportForm';
import { DailyReportPhotoUploader } from './DailyReportPhotoUploader';
import { DailyReportsFilters } from './DailyReportsFilters';
import { DailyReportsList } from './DailyReportsList';
import { DailyReportStatusActions } from './DailyReportStatusActions';
import { DailyReportWorkforceSection } from './DailyReportWorkforceSection';
import { DailyReportMaterialConsumptionSection } from './DailyReportMaterialConsumptionSection';
import { useDailyReports } from './useDailyReports';

export function DailyReportsPage() {
  const dailyReports = useDailyReports();
  const {
    projects,
    sites,
    reports,
    filters,
    form,
    selectedReport,
    loading,
    saving,
    message,
    error,
    canCreate,
    canUpdate,
    canAdmin,
    canEditSelected,
    isApproved,
    siteNames,
  } = dailyReports;
  const editable = selectedReport ? canEditSelected : canCreate;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Günlük Saha Raporu</h2>
          <p className="mt-1 text-sm text-slate-600">
            Günlük saha ilerlemesini, ekipleri, malzemeleri ve fotoğrafları kayıt altına alın.
          </p>
        </div>
        {canCreate ? (
          <button
            type="button"
            onClick={dailyReports.startNew}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <Plus size={17} />
            Yeni Rapor
          </button>
        ) : null}
      </header>

      <DailyReportsFilters
        projects={projects}
        sites={sites}
        filters={filters}
        disabled={loading}
        onChange={dailyReports.setFilter}
      />

      {message ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>
      ) : null}
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Raporlar</h3>
          <span className="text-sm text-slate-500">{reports.length} kayıt</span>
        </div>
        <DailyReportsList
          reports={reports}
          selectedId={selectedReport?.id}
          siteNames={siteNames}
          loading={loading}
          onSelect={(report) => void dailyReports.selectReport(report)}
        />
      </section>

      {selectedReport || canCreate ? (
        <DailyReportForm
          form={form}
          projects={projects}
          sites={sites}
          existing={Boolean(selectedReport)}
          editable={editable}
          saving={saving}
          canDelete={Boolean(selectedReport && canAdmin && canEditSelected)}
          onChange={dailyReports.setForm}
          onProjectChange={(projectId) => {
            dailyReports.setFilter('projectId', projectId);
            dailyReports.setForm({ ...form, projectId, siteId: '' });
          }}
          onSave={() => void dailyReports.saveReport()}
          onDelete={() => void dailyReports.removeReport()}
        />
      ) : (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
          Detaylarını görüntülemek için listeden bir rapor seçin.
        </p>
      )}

      {selectedReport ? (
        <>
          <DailyReportWorkforceSection report={selectedReport} />
          <DailyReportMaterialConsumptionSection
            report={selectedReport}
            editable={canEditSelected}
          />
          <DailyReportPhotoUploader
            photos={selectedReport.photos ?? []}
            editable={canEditSelected && !isApproved}
            saving={saving}
            onUpload={dailyReports.uploadPhotos}
            onDelete={(photoId) => void dailyReports.removePhoto(photoId)}
          />
          <DailyReportStatusActions
            report={selectedReport}
            canUpdate={canUpdate}
            canAdmin={canAdmin}
            saving={saving}
            onAction={(action, reason) => void dailyReports.changeStatus(action, reason)}
          />
        </>
      ) : null}
    </div>
  );
}
