import { apiClient } from '@/api/client';
import type {
  Material,
  SiteStockBalance,
  StockMovementPayload,
  StockTransaction,
} from '@/features/inventory/types';

type RecordValue = Record<string, unknown>;
const pick = (source: RecordValue, ...keys: string[]) => keys.map((key) => source[key]).find((item) => item !== undefined);
const num = (input: unknown) => Number(input ?? 0) || 0;

function items(input: unknown): unknown[] {
  if (Array.isArray(input)) return input;
  const body = (input ?? {}) as RecordValue;
  const result = pick(body, 'items', 'Items', 'data', 'Data');
  return Array.isArray(result) ? result : [];
}

function mapMaterial(input: unknown): Material {
  const row = input as RecordValue;
  return {
    id: String(pick(row, 'id', 'Id') ?? ''),
    tenantId: String(pick(row, 'tenantId', 'TenantId') ?? ''),
    code: String(pick(row, 'code', 'Code') ?? ''),
    name: String(pick(row, 'name', 'Name') ?? ''),
    unit: String(pick(row, 'unit', 'Unit', 'unitName', 'UnitName') ?? ''),
    description: pick(row, 'description', 'Description') as string | null | undefined,
    isActive: Boolean(pick(row, 'isActive', 'IsActive') ?? true),
  };
}

function mapBalance(input: unknown): SiteStockBalance {
  const row = input as RecordValue;
  const quantity = num(pick(row, 'quantity', 'Quantity', 'onHandQuantity', 'OnHandQuantity'));
  const averageUnitCost = num(pick(row, 'averageUnitCost', 'AverageUnitCost', 'movingAverageUnitCost', 'MovingAverageUnitCost'));
  return {
    id: pick(row, 'id', 'Id') as string | undefined,
    siteId: String(pick(row, 'siteId', 'SiteId') ?? ''),
    siteName: pick(row, 'siteName', 'SiteName') as string | null | undefined,
    materialId: String(pick(row, 'materialId', 'MaterialId') ?? ''),
    materialCode: pick(row, 'materialCode', 'MaterialCode') as string | null | undefined,
    materialName: String(pick(row, 'materialName', 'MaterialName', 'materialCode', 'MaterialCode') ?? ''),
    unit: String(pick(row, 'unit', 'Unit') ?? ''),
    quantity,
    averageUnitCost,
    totalValue: num(pick(row, 'totalValue', 'TotalValue')) || quantity * averageUnitCost,
    updatedAt: pick(row, 'updatedAt', 'UpdatedAt', 'updatedDate', 'UpdatedDate') as string | null | undefined,
  };
}

function mapTransaction(input: unknown): StockTransaction {
  const row = input as RecordValue;
  const movementType = num(pick(row, 'movementType', 'MovementType', 'type', 'Type'));
  const siteId = pick(row, 'siteId', 'SiteId') as string | undefined;
  const siteName = pick(row, 'siteName', 'SiteName') as string | undefined;
  const isInbound = movementType === 1 || movementType === 4 || movementType === 5;
  return {
    id: String(pick(row, 'id', 'Id') ?? ''),
    materialId: String(pick(row, 'materialId', 'MaterialId') ?? ''),
    materialName: String(pick(row, 'materialName', 'MaterialName') ?? ''),
    fromSiteId: (pick(row, 'fromSiteId', 'FromSiteId') as string | null | undefined) ?? (isInbound ? undefined : siteId),
    fromSiteName: (pick(row, 'fromSiteName', 'FromSiteName') as string | null | undefined) ?? (isInbound ? undefined : siteName),
    toSiteId: (pick(row, 'toSiteId', 'ToSiteId') as string | null | undefined) ?? (isInbound ? siteId : undefined),
    toSiteName: (pick(row, 'toSiteName', 'ToSiteName') as string | null | undefined) ?? (isInbound ? siteName : undefined),
    movementType: movementType as StockTransaction['movementType'],
    quantity: num(pick(row, 'quantity', 'Quantity')),
    unitCost: num(pick(row, 'unitCost', 'UnitCost')),
    totalCost: num(pick(row, 'totalCost', 'TotalCost')),
    occurredAt: String(pick(row, 'occurredAt', 'OccurredAt', 'postedAt', 'PostedAt', 'createdDate', 'CreatedDate') ?? ''),
    reference: pick(row, 'reference', 'Reference') as string | null | undefined,
    notes: pick(row, 'notes', 'Notes') as string | null | undefined,
  };
}

export async function getMaterials(tenantId: string): Promise<Material[]> {
  const { data } = await apiClient.get('/inventory/materials', { params: { tenantId, includeInactive: true } });
  return items(data).map(mapMaterial);
}

export async function saveMaterial(payload: Omit<Material, 'id'> & { id?: string }): Promise<Material> {
  const { data } = payload.id
    ? await apiClient.put(`/inventory/materials/${payload.id}`, payload)
    : await apiClient.post('/inventory/materials', payload);
  return mapMaterial(data);
}

export async function deleteMaterial(id: string, tenantId: string): Promise<void> {
  await apiClient.delete(`/inventory/materials/${id}`, { params: { tenantId } });
}

export async function getSiteStockBalances(tenantId: string, siteId?: string): Promise<SiteStockBalance[]> {
  const { data } = await apiClient.get('/inventory/balances', { params: { tenantId, siteId: siteId || undefined } });
  return items(data).map(mapBalance);
}

export async function getStockTransactions(tenantId: string, siteId?: string): Promise<StockTransaction[]> {
  const { data } = await apiClient.get('/inventory/ledger', { params: { tenantId, siteId: siteId || undefined, take: 500 } });
  return items(data).map(mapTransaction);
}

export async function postStockMovement(
  action: 'receipt' | 'consumption' | 'transfer' | 'adjustment',
  payload: StockMovementPayload,
): Promise<void> {
  const endpoint = { receipt: 'receipts', consumption: 'consumptions', transfer: 'transfers', adjustment: 'adjustments' }[action];
  const body = action === 'transfer'
    ? { tenantId: payload.tenantId, sourceSiteId: payload.fromSiteId, destinationSiteId: payload.toSiteId, materialId: payload.materialId, quantity: payload.quantity, occurredAt: payload.occurredAt, reference: payload.reference, idempotencyKey: payload.idempotencyKey, notes: payload.notes }
    : {
        tenantId: payload.tenantId,
        siteId: payload.siteId,
        materialId: payload.materialId,
        quantity: action === 'adjustment' ? Math.abs(payload.adjustmentQuantity ?? payload.quantity) : payload.quantity,
        receiptUnitCost: action === 'receipt' ? payload.unitCost : undefined,
        increase: action === 'adjustment' ? (payload.adjustmentQuantity ?? 0) > 0 : undefined,
        adjustmentUnitCost: action === 'adjustment' && (payload.adjustmentQuantity ?? 0) > 0 ? payload.unitCost : undefined,
        occurredAt: payload.occurredAt,
        reference: payload.reference,
        idempotencyKey: payload.idempotencyKey,
        notes: payload.notes,
      };
  await apiClient.post(`/inventory/${endpoint}`, body, {
    headers: { 'Idempotency-Key': payload.idempotencyKey },
  });
}
