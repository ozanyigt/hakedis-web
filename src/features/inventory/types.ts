export interface Material {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  unit: string;
  description?: string | null;
  isActive: boolean;
}

export interface SiteStockBalance {
  id?: string;
  siteId: string;
  siteName?: string | null;
  materialId: string;
  materialCode?: string | null;
  materialName: string;
  unit: string;
  quantity: number;
  averageUnitCost: number;
  totalValue: number;
  updatedAt?: string | null;
}

export type StockMovementType = 1 | 2 | 3 | 4 | 5 | 6;

export interface StockTransaction {
  id: string;
  materialId: string;
  materialName: string;
  fromSiteId?: string | null;
  fromSiteName?: string | null;
  toSiteId?: string | null;
  toSiteName?: string | null;
  movementType: StockMovementType;
  quantity: number;
  unitCost?: number | null;
  totalCost?: number | null;
  occurredAt: string;
  reference?: string | null;
  notes?: string | null;
}

export interface StockMovementPayload {
  tenantId: string;
  projectId: string;
  materialId: string;
  siteId?: string;
  fromSiteId?: string;
  toSiteId?: string;
  quantity: number;
  unitCost?: number;
  adjustmentQuantity?: number;
  occurredAt: string;
  reference?: string | null;
  notes?: string | null;
  idempotencyKey: string;
}

export const STOCK_MOVEMENT_LABELS: Record<number, string> = {
  1: 'Giriş',
  2: 'Tüketim',
  3: 'Transfer çıkış',
  4: 'Transfer giriş',
  5: 'Düzeltme artışı',
  6: 'Düzeltme azalışı',
};
