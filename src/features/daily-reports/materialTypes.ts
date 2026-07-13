export interface DailyReportMaterialLine {
  id?: string;
  materialId: string;
  materialName: string;
  unit: string;
  quantity: number;
  unitCost?: number | null;
  totalCost?: number | null;
  notes?: string | null;
}

export interface DailyReportMaterialLineInput {
  materialId: string;
  quantity: number;
  notes?: string | null;
}
