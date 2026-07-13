import { apiClient } from '@/api/client';
import type { DailyReportMaterialLine, DailyReportMaterialLineInput } from '@/features/daily-reports/materialTypes';

type Row = Record<string, unknown>;
const pick = (row: Row, ...keys: string[]) => keys.map((key) => row[key]).find((item) => item !== undefined);
const numberValue = (input: unknown) => Number(input ?? 0) || 0;

function mapLine(input: unknown): DailyReportMaterialLine {
  const row = input as Row;
  return {
    id: pick(row, 'id', 'Id') as string | undefined,
    materialId: String(pick(row, 'materialId', 'MaterialId') ?? ''),
    materialName: String(pick(row, 'materialName', 'MaterialName') ?? ''),
    unit: String(pick(row, 'unit', 'Unit') ?? ''),
    quantity: numberValue(pick(row, 'quantity', 'Quantity')),
    unitCost: numberValue(pick(row, 'unitCost', 'UnitCost', 'postedUnitCost', 'PostedUnitCost')),
    totalCost: numberValue(pick(row, 'totalCost', 'TotalCost', 'postedTotalCost', 'PostedTotalCost')),
    notes: pick(row, 'notes', 'Notes') as string | null | undefined,
  };
}

function unwrap(input: unknown): unknown[] {
  if (Array.isArray(input)) return input;
  const body = (input ?? {}) as Row;
  const rows = pick(body, 'items', 'Items', 'lines', 'Lines');
  return Array.isArray(rows) ? rows : [];
}

export async function getDailyReportMaterialLines(reportId: string): Promise<DailyReportMaterialLine[]> {
  const { data } = await apiClient.get(`/DailySiteReports/${reportId}/materials`);
  return unwrap(data).map(mapLine);
}

export async function replaceDailyReportMaterialLines(
  reportId: string,
  lines: DailyReportMaterialLineInput[],
): Promise<DailyReportMaterialLine[]> {
  const { data } = await apiClient.put(`/DailySiteReports/${reportId}/materials`, lines);
  return unwrap(data).map(mapLine);
}
