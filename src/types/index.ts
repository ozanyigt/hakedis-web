export type FeatureModuleName = 'Metraj' | 'Puantaj' | 'Hakedis';

export type DrawingStatus = 'Uploaded' | 'Parsing' | 'Parsed' | 'Failed';

export interface AccessToken {
  token: string;
  expirationDate: string;
}

export interface LoginResponse {
  accessToken: AccessToken;
  requiredAuthenticatorType?: number | null;
}

export interface PagedResponse<T> {
  items: T[];
  index: number;
  size: number;
  count: number;
  pages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  taxNumber?: string;
  isActive: boolean;
}

export interface Project {
  id: string;
  tenantId: string;
  name: string;
  code?: string | null;
  location?: string | null;
  clientName?: string | null;
  contractAmount: number;
  startDate?: string | null;
  endDate?: string | null;
  status: number;
  description?: string | null;
}

export interface Subscription {
  id: string;
  tenantId: string;
  subscriptionPlanId: string;
  status: number;
  startDate: string;
  endDate?: string | null;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  enabledModules: string;
}

export interface Drawing {
  id: string;
  tenantId: string;
  projectId: string;
  siteId?: string | null;
  fileName: string;
  fileExtension: string;
  fileSizeBytes: number;
  status: number;
  parseErrorMessage?: string | null;
  parsedAt?: string | null;
}

export interface MetrajResult {
  id: string;
  tenantId: string;
  projectId: string;
  drawingId: string;
  kalemType: number;
  unit: string;
  quantity: number;
  floorName?: string | null;
  spaceName?: string | null;
  calculatedAt: string;
  notes?: string | null;
}

export interface Worker {
  id: string;
  tenantId: string;
  fullName: string;
  trade?: string | null;
  phone?: string | null;
  identityNumber?: string | null;
  isActive: boolean;
}

export interface Site {
  id: string;
  tenantId: string;
  projectId: string;
  name: string;
  code?: string | null;
  location?: string | null;
  status: number;
}

export interface PuantajRecord {
  id: string;
  tenantId: string;
  projectId: string;
  siteId?: string | null;
  workerId?: string | null;
  workDate: string;
  workType: string;
  dayCount: number;
  overtimeHours: number;
  status: number;
  approvedAt?: string | null;
  notes?: string | null;
}

export interface ContractItem {
  id: string;
  tenantId: string;
  projectId: string;
  kalemType: number;
  description: string;
  unit: string;
  unitPrice: number;
  contractQuantity?: number | null;
  sortOrder: number;
}

export interface HakedisPeriod {
  id: string;
  tenantId: string;
  projectId: string;
  periodNumber: number;
  name: string;
  periodStart: string;
  periodEnd: string;
  status: number;
  totalAmount: number;
  deductionAmount: number;
  netAmount: number;
  approvedAt?: string | null;
  notes?: string | null;
}

export interface ProgressEntry {
  id: string;
  tenantId: string;
  hakedisPeriodId: string;
  contractItemId: string;
  quantityThisPeriod: number;
  cumulativeQuantity: number;
  amountThisPeriod: number;
  metrajResultId?: string | null;
  isManualEntry: boolean;
  notes?: string | null;
}

export interface JwtPayload {
  sub?: string;
  email?: string;
  [key: string]: unknown;
}

export const PROJECT_STATUS_LABELS: Record<number, string> = {
  1: 'Aktif',
  2: 'Tamamlandı',
  3: 'Askıda',
};

export const DRAWING_STATUS_LABELS: Record<number, string> = {
  1: 'Yüklendi',
  2: 'İşleniyor',
  3: 'Hazır',
  4: 'Hata',
};

export const METRAJ_KALEM_LABELS: Record<number, string> = {
  1: 'Duvar',
  2: 'Sıva',
  3: 'Boya',
  4: 'Dış Cephe Mantolama',
  5: 'Şap Beton',
  6: 'Kalıp',
};

export const PUANTAJ_STATUS_LABELS: Record<number, string> = {
  1: 'Taslak',
  2: 'Gönderildi',
  3: 'Onaylandı',
  4: 'Reddedildi',
};

export const HAKEDIS_STATUS_LABELS: Record<number, string> = {
  1: 'Taslak',
  2: 'Gönderildi',
  3: 'Onaylandı',
  4: 'Reddedildi',
};

export const PUANTAJ_STATUS_COLORS: Record<number, string> = {
  1: 'bg-slate-100 text-slate-700',
  2: 'bg-blue-100 text-blue-700',
  3: 'bg-emerald-100 text-emerald-700',
  4: 'bg-red-100 text-red-700',
};

export const HAKEDIS_STATUS_COLORS: Record<number, string> = {
  1: 'bg-slate-100 text-slate-700',
  2: 'bg-blue-100 text-blue-700',
  3: 'bg-emerald-100 text-emerald-700',
  4: 'bg-red-100 text-red-700',
};

export const STORAGE_KEYS = {
  accessToken: 'hakedis_access_token',
  tenantId: 'hakedis_tenant_id',
} as const;
