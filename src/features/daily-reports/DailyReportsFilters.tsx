import type { Project, Site } from '@/types';
import type { DailyReportFilterValues } from './types';

interface DailyReportsFiltersProps {
  projects: Project[];
  sites: Site[];
  filters: DailyReportFilterValues;
  disabled?: boolean;
  onChange: (name: keyof DailyReportFilterValues, value: string) => void;
}

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100';

export function DailyReportsFilters({
  projects,
  sites,
  filters,
  disabled,
  onChange,
}: DailyReportsFiltersProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <label className="text-sm font-medium text-slate-700">
          Proje
          <select
            className={inputClass}
            value={filters.projectId}
            disabled={disabled}
            onChange={(event) => onChange('projectId', event.target.value)}
          >
            <option value="">Proje seçin</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Şantiye
          <select
            className={inputClass}
            value={filters.siteId}
            disabled={disabled || !filters.projectId}
            onChange={(event) => onChange('siteId', event.target.value)}
          >
            <option value="">Tüm şantiyeler</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>{site.name}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Başlangıç tarihi
          <input
            type="date"
            className={inputClass}
            value={filters.fromDate}
            disabled={disabled}
            max={filters.toDate || undefined}
            onChange={(event) => onChange('fromDate', event.target.value)}
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Bitiş tarihi
          <input
            type="date"
            className={inputClass}
            value={filters.toDate}
            disabled={disabled}
            min={filters.fromDate || undefined}
            onChange={(event) => onChange('toDate', event.target.value)}
          />
        </label>
      </div>
    </section>
  );
}
