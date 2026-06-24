import type { ContractItem, HakedisPeriod } from '@/types';
import { DEFAULT_UNIT_BY_KALEM } from '@/types';

export function todayInputDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function nextPeriodNumber(periods: HakedisPeriod[]): number {
  if (periods.length === 0) {
    return 1;
  }
  return Math.max(...periods.map((p) => p.periodNumber)) + 1;
}

export function nextSortOrder(items: ContractItem[]): number {
  if (items.length === 0) {
    return 1;
  }
  return Math.max(...items.map((c) => c.sortOrder)) + 1;
}

export function buildContractItemForm(items: ContractItem[]) {
  return {
    kalemType: '1',
    description: '',
    unit: String(DEFAULT_UNIT_BY_KALEM[1] ?? 1),
    unitPrice: '',
    contractQuantity: '',
    sortOrder: String(nextSortOrder(items)),
  };
}

export function buildPeriodForm(periods: HakedisPeriod[]) {
  const today = todayInputDate();
  return {
    periodNumber: String(nextPeriodNumber(periods)),
    name: '',
    periodStart: today,
    periodEnd: today,
    notes: '',
  };
}

export function buildPuantajRecordForm() {
  return {
    workerId: '',
    siteId: '',
    workDate: todayInputDate(),
    workType: '1',
    dayCount: '1',
    overtimeHours: '',
    notes: '',
  };
}
