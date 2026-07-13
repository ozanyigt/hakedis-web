import { Loader2, Save, Trash2 } from 'lucide-react';
import { FormField, formInputClass } from '@/components/FormField';
import type { Project, Site } from '@/types';
import {
  DAILY_REPORT_WEATHER_OPTIONS,
  type DailyReportFormValues,
} from './types';

interface DailyReportFormProps {
  form: DailyReportFormValues;
  projects: Project[];
  sites: Site[];
  existing: boolean;
  editable: boolean;
  saving: boolean;
  canDelete: boolean;
  onChange: (form: DailyReportFormValues) => void;
  onProjectChange: (projectId: string) => void;
  onSave: () => void;
  onDelete: () => void;
}

const textareaClass = `${formInputClass} min-h-24 resize-y`;

export function DailyReportForm({
  form,
  projects,
  sites,
  existing,
  editable,
  saving,
  canDelete,
  onChange,
  onProjectChange,
  onSave,
  onDelete,
}: DailyReportFormProps) {
  const inputClass = `${formInputClass} disabled:bg-slate-100 disabled:text-slate-500`;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900">
            {existing ? 'Rapor Detayı' : 'Yeni Taslak Rapor'}
          </h3>
          {!editable ? (
            <p className="mt-1 text-xs text-slate-500">Bu rapor salt okunur görüntüleniyor.</p>
          ) : null}
        </div>
        {canDelete ? (
          <button
            type="button"
            disabled={saving}
            onClick={onDelete}
            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 size={15} />
            Sil
          </button>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <FormField label="Proje" required>
          <select
            className={inputClass}
            value={form.projectId}
            disabled={!editable || existing}
            onChange={(event) => onProjectChange(event.target.value)}
          >
            <option value="">Proje seçin</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Şantiye" required>
          <select
            className={inputClass}
            value={form.siteId}
            disabled={!editable || !form.projectId || existing}
            onChange={(event) => onChange({ ...form, siteId: event.target.value })}
          >
            <option value="">Şantiye seçin</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>{site.name}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Rapor tarihi" required>
          <input
            type="date"
            className={inputClass}
            value={form.reportDate}
            disabled={!editable}
            onChange={(event) => onChange({ ...form, reportDate: event.target.value })}
          />
        </FormField>
        <FormField label="Hava durumu">
          <select
            className={inputClass}
            value={form.weather}
            disabled={!editable}
            onChange={(event) => onChange({ ...form, weather: event.target.value })}
          >
            <option value="">Seçilmedi</option>
            {DAILY_REPORT_WEATHER_OPTIONS.map((weather) => (
              <option key={weather} value={weather}>{weather}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Minimum sıcaklık (°C)">
          <input
            type="number"
            step="0.1"
            className={inputClass}
            value={form.minTemperature}
            disabled={!editable}
            onChange={(event) => onChange({ ...form, minTemperature: event.target.value })}
          />
        </FormField>
        <FormField label="Maksimum sıcaklık (°C)">
          <input
            type="number"
            step="0.1"
            className={inputClass}
            value={form.maxTemperature}
            disabled={!editable}
            onChange={(event) => onChange({ ...form, maxTemperature: event.target.value })}
          />
        </FormField>
        <FormField label="Yapılan işler özeti" required className="md:col-span-2 xl:col-span-3">
          <textarea
            className={textareaClass}
            value={form.workSummary}
            disabled={!editable}
            placeholder="Gün içinde tamamlanan ve devam eden işleri özetleyin."
            onChange={(event) => onChange({ ...form, workSummary: event.target.value })}
          />
        </FormField>
        <FormField label="İşgücü notları">
          <textarea
            className={textareaClass}
            value={form.workforceNotes}
            disabled={!editable}
            placeholder="Ekipler, kişi sayıları ve çalışma bilgileri"
            onChange={(event) => onChange({ ...form, workforceNotes: event.target.value })}
          />
        </FormField>
        <FormField label="Ekipman notları">
          <textarea
            className={textareaClass}
            value={form.equipmentNotes}
            disabled={!editable}
            placeholder="Kullanılan veya beklenen ekipmanlar"
            onChange={(event) => onChange({ ...form, equipmentNotes: event.target.value })}
          />
        </FormField>
        <FormField label="Malzeme notları">
          <textarea
            className={textareaClass}
            value={form.materialNotes}
            disabled={!editable}
            placeholder="Gelen, kullanılan veya eksik malzemeler"
            onChange={(event) => onChange({ ...form, materialNotes: event.target.value })}
          />
        </FormField>
        <FormField label="Engeller / gecikmeler" className="md:col-span-2">
          <textarea
            className={textareaClass}
            value={form.blockers}
            disabled={!editable}
            placeholder="İşi etkileyen engeller ve gecikmeler"
            onChange={(event) => onChange({ ...form, blockers: event.target.value })}
          />
        </FormField>
        <FormField label="Genel notlar">
          <textarea
            className={textareaClass}
            value={form.generalNotes}
            disabled={!editable}
            placeholder="Diğer saha notları"
            onChange={(event) => onChange({ ...form, generalNotes: event.target.value })}
          />
        </FormField>
      </div>

      {editable ? (
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            disabled={saving}
            onClick={onSave}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            {existing ? 'Değişiklikleri Kaydet' : 'Taslağı Oluştur'}
          </button>
        </div>
      ) : null}
    </section>
  );
}
