import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  approveDailySiteReport,
  createDailySiteReport,
  deleteDailySiteReport,
  deleteDailySiteReportPhoto,
  getDailySiteReport,
  getDailySiteReports,
  rejectDailySiteReport,
  submitDailySiteReport,
  updateDailySiteReport,
  uploadDailySiteReportPhotos,
} from '@/api/dailySiteReports';
import { getApiErrorMessage } from '@/api/client';
import { getProjectsByTenant } from '@/api/projects';
import { getSitesByProject } from '@/api/sites';
import { hasClaim } from '@/config/permissions';
import { useAuth } from '@/contexts/AuthContext';
import { useDialog } from '@/contexts/DialogContext';
import { useTenant } from '@/contexts/TenantContext';
import type { Project, Site } from '@/types';
import {
  DAILY_REPORT_STATUS,
  createEmptyDailyReportForm,
  dailyReportToForm,
  type DailyReportFilterValues,
  type DailyReportFormValues,
  type DailySiteReport,
  type DailySiteReportPayload,
} from './types';

function initialFilters(): DailyReportFilterValues {
  const now = new Date();
  const monthAgo = new Date(now);
  monthAgo.setDate(monthAgo.getDate() - 30);
  return {
    projectId: '',
    siteId: '',
    fromDate: monthAgo.toISOString().slice(0, 10),
    toDate: now.toISOString().slice(0, 10),
  };
}

export function useDailyReports() {
  const { tenantId } = useTenant();
  const { roles } = useAuth();
  const { confirm } = useDialog();
  const [projects, setProjects] = useState<Project[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [reports, setReports] = useState<DailySiteReport[]>([]);
  const [filters, setFilters] = useState<DailyReportFilterValues>(initialFilters);
  const [form, setForm] = useState<DailyReportFormValues>(createEmptyDailyReportForm);
  const [selectedReport, setSelectedReport] = useState<DailySiteReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canCreate = hasClaim(roles, 'DailySiteReports.Create');
  const canUpdate = hasClaim(roles, 'DailySiteReports.Update');
  const canAdmin = hasClaim(roles, 'DailySiteReports.Admin');
  const isApproved = selectedReport?.status === DAILY_REPORT_STATUS.approved;
  const isFrozen = selectedReport?.status === DAILY_REPORT_STATUS.submitted || isApproved;
  const canEditSelected = Boolean(selectedReport && canUpdate && !isFrozen);

  const loadReports = useCallback(async () => {
    if (!tenantId || !filters.projectId) {
      setReports([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const items = await getDailySiteReports({
        tenantId,
        projectId: filters.projectId,
        siteId: filters.siteId || undefined,
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined,
      });
      setReports(items.sort((a, b) => b.reportDate.localeCompare(a.reportDate)));
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [filters.fromDate, filters.projectId, filters.siteId, filters.toDate, tenantId]);

  useEffect(() => {
    async function loadProjects() {
      if (!tenantId) {
        setProjects([]);
        setFilters(initialFilters());
        return;
      }
      try {
        const items = await getProjectsByTenant(tenantId);
        setProjects(items);
        setFilters((current) => ({
          ...current,
          projectId: items.some((item) => item.id === current.projectId)
            ? current.projectId
            : (items[0]?.id ?? ''),
          siteId: '',
        }));
      } catch (loadError) {
        setError(getApiErrorMessage(loadError));
      }
    }
    void loadProjects();
  }, [tenantId]);

  useEffect(() => {
    async function loadSites() {
      if (!filters.projectId) {
        setSites([]);
        return;
      }
      try {
        const items = await getSitesByProject(filters.projectId);
        setSites(items);
        setFilters((current) => ({
          ...current,
          siteId: items.some((item) => item.id === current.siteId) ? current.siteId : '',
        }));
      } catch (loadError) {
        setError(getApiErrorMessage(loadError));
      }
    }
    void loadSites();
  }, [filters.projectId]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  useEffect(() => {
    if (!selectedReport) {
      setForm((current) => ({
        ...current,
        projectId: filters.projectId,
        siteId: filters.siteId,
      }));
    }
  }, [filters.projectId, filters.siteId, selectedReport]);

  const setFilter = useCallback(
    (name: keyof DailyReportFilterValues, value: string) => {
      setFilters((current) => ({
        ...current,
        [name]: value,
        ...(name === 'projectId' ? { siteId: '' } : {}),
      }));
      setSelectedReport(null);
    },
    [],
  );

  const startNew = useCallback(() => {
    setSelectedReport(null);
    setForm(createEmptyDailyReportForm(filters.projectId, filters.siteId));
    setMessage(null);
    setError(null);
  }, [filters.projectId, filters.siteId]);

  const selectReport = useCallback(async (report: DailySiteReport) => {
    setLoading(true);
    setError(null);
    try {
      const detail = await getDailySiteReport(report.id);
      setSelectedReport(detail);
      setForm(dailyReportToForm(detail));
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshSelected = useCallback(async (reportId: string) => {
    const detail = await getDailySiteReport(reportId);
    setSelectedReport(detail);
    setForm(dailyReportToForm(detail));
    return detail;
  }, []);

  const saveReport = useCallback(async () => {
    if (!tenantId || !form.projectId || !form.siteId || !form.reportDate) {
      setError('Proje, şantiye ve rapor tarihi zorunludur.');
      return;
    }
    if (!form.workSummary.trim()) {
      setError('Yapılan işler özeti zorunludur.');
      return;
    }
    const minTemperature = form.minTemperature === '' ? null : Number(form.minTemperature);
    const maxTemperature = form.maxTemperature === '' ? null : Number(form.maxTemperature);
    if (
      (minTemperature != null && !Number.isFinite(minTemperature)) ||
      (maxTemperature != null && !Number.isFinite(maxTemperature))
    ) {
      setError('Sıcaklık değerleri geçerli bir sayı olmalıdır.');
      return;
    }
    if (minTemperature != null && maxTemperature != null && minTemperature > maxTemperature) {
      setError('Minimum sıcaklık maksimum sıcaklıktan büyük olamaz.');
      return;
    }

    const payload: DailySiteReportPayload = {
      tenantId,
      projectId: form.projectId,
      siteId: form.siteId,
      reportDate: form.reportDate,
      weather: form.weather.trim() || null,
      minTemperature,
      maxTemperature,
      workSummary: form.workSummary.trim(),
      workforceNotes: form.workforceNotes.trim() || null,
      equipmentNotes: form.equipmentNotes.trim() || null,
      materialNotes: form.materialNotes.trim() || null,
      blockers: form.blockers.trim() || null,
      generalNotes: form.generalNotes.trim() || null,
    };

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const saved = selectedReport
        ? await updateDailySiteReport({ ...payload, id: selectedReport.id })
        : await createDailySiteReport(payload);
      await refreshSelected(saved.id);
      setMessage(selectedReport ? 'Günlük saha raporu güncellendi.' : 'Taslak rapor oluşturuldu.');
      await loadReports();
    } catch (saveError) {
      setError(getApiErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }, [form, loadReports, refreshSelected, selectedReport, tenantId]);

  const removeReport = useCallback(async () => {
    if (!selectedReport) return;
    const approved = await confirm({
      title: 'Raporu sil',
      message: 'Bu günlük saha raporunu kalıcı olarak silmek istediğinize emin misiniz?',
      confirmLabel: 'Sil',
      variant: 'danger',
    });
    if (!approved) return;
    setSaving(true);
    try {
      await deleteDailySiteReport(selectedReport.id);
      setSelectedReport(null);
      setForm(createEmptyDailyReportForm(filters.projectId, filters.siteId));
      setMessage('Günlük saha raporu silindi.');
      await loadReports();
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError));
    } finally {
      setSaving(false);
    }
  }, [confirm, filters.projectId, filters.siteId, loadReports, selectedReport]);

  const changeStatus = useCallback(async (
    action: 'submit' | 'approve' | 'reject',
    reason?: string,
  ) => {
    if (!selectedReport) return;
    if (action !== 'reject') {
      const accepted = await confirm({
        title: action === 'submit' ? 'Raporu gönder' : 'Raporu onayla',
        message:
          action === 'submit'
            ? 'Raporu onaya göndermek istediğinize emin misiniz?'
            : 'Raporu onaylamak istediğinize emin misiniz?',
        confirmLabel: action === 'submit' ? 'Gönder' : 'Onayla',
        variant: action === 'submit' ? 'warning' : 'default',
      });
      if (!accepted) return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      if (action === 'submit') await submitDailySiteReport(selectedReport.id);
      if (action === 'approve') await approveDailySiteReport(selectedReport.id);
      if (action === 'reject') await rejectDailySiteReport(selectedReport.id, reason);
      await refreshSelected(selectedReport.id);
      setMessage(
        action === 'submit'
          ? 'Rapor onaya gönderildi.'
          : action === 'approve'
            ? 'Rapor onaylandı.'
            : 'Rapor reddedildi.',
      );
      await loadReports();
    } catch (statusError) {
      setError(getApiErrorMessage(statusError));
    } finally {
      setSaving(false);
    }
  }, [confirm, loadReports, refreshSelected, selectedReport]);

  const uploadPhotos = useCallback(async (files: File[], descriptions: string[]) => {
    if (!selectedReport) return false;
    setSaving(true);
    setError(null);
    try {
      await uploadDailySiteReportPhotos(selectedReport.id, files, descriptions);
      await refreshSelected(selectedReport.id);
      setMessage('Fotoğraflar yüklendi.');
      await loadReports();
      return true;
    } catch (uploadError) {
      setError(getApiErrorMessage(uploadError));
      return false;
    } finally {
      setSaving(false);
    }
  }, [loadReports, refreshSelected, selectedReport]);

  const removePhoto = useCallback(async (photoId: string) => {
    if (!selectedReport) return;
    const approved = await confirm({
      title: 'Fotoğrafı sil',
      message: 'Bu fotoğrafı rapordan kaldırmak istediğinize emin misiniz?',
      confirmLabel: 'Sil',
      variant: 'danger',
    });
    if (!approved) return;
    setSaving(true);
    try {
      await deleteDailySiteReportPhoto(selectedReport.id, photoId);
      await refreshSelected(selectedReport.id);
      setMessage('Fotoğraf silindi.');
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError));
    } finally {
      setSaving(false);
    }
  }, [confirm, refreshSelected, selectedReport]);

  const siteNames = useMemo(
    () => Object.fromEntries(sites.map((site) => [site.id, site.name])),
    [sites],
  );

  return {
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
    setFilter,
    setForm,
    startNew,
    selectReport,
    saveReport,
    removeReport,
    changeStatus,
    uploadPhotos,
    removePhoto,
  };
}
