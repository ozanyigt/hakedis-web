import type { DailyReportWorkforce } from './workforceTypes';

export function WorkforceSummaryCards({ workforce }: { workforce: DailyReportWorkforce }) {
  const cards = [
    ['Çalışan', workforce.workerCount],
    ['Toplam gün', workforce.totalDayCount.toFixed(1)],
    ['Fazla mesai', `${workforce.totalOvertimeHours.toFixed(1)} saat`],
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {cards.map(([label, amount]) => (
        <div key={label} className="rounded-lg bg-slate-50 px-4 py-3">
          <p className="text-xs text-slate-500">{label}</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{amount}</p>
        </div>
      ))}
    </div>
  );
}
