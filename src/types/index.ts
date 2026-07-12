export type FeatureModuleName = 'Metraj' | 'Puantaj' | 'Hakedis';

export type FirmRoleValue = 1 | 2 | 3 | 4 | 5 | 6;

export interface AppUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: boolean;
  tenantId?: string | null;
  firmRole?: FirmRoleValue | null;
  secondaryFirmRole?: FirmRoleValue | null;
}

export interface FirmRoleOption {
  value: FirmRoleValue;
  label: string;
  description: string;
}

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  tenantId?: string;
  firmRole: FirmRoleValue;
  secondaryFirmRole?: FirmRoleValue | null;
}

export interface UpdateUserPayload {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  firmRole: FirmRoleValue;
  secondaryFirmRole?: FirmRoleValue | null;
}

export type DrawingStatus = 'Uploaded' | 'Parsing' | 'Parsed' | 'Failed' | 'PendingReview' | 'Approved';

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

export interface TenantDetail extends Tenant {
  taxOffice?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface AppContext {
  isGlobalAdmin: boolean;
  firmRole?: FirmRoleValue | null;
  secondaryFirmRole?: FirmRoleValue | null;
  tenantId?: string | null;
  tenantName?: string | null;
  enabledModules: string[];
  canSwitchTenant: boolean;
  tenants: Array<{ id: string; name: string }>;
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
  billingCycle: number;
  status: number;
  startDate: string;
  endDate?: string | null;
  isManualAssignment?: boolean;
  notes?: string | null;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  enabledModules: string;
}

export interface SubscriptionPlanDetail extends SubscriptionPlan {
  code: string;
  description?: string | null;
  monthlyPrice: number;
  yearlyPrice: number;
  maxSiteCount: number;
  isActive: boolean;
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
  unit: number;
  quantity: number;
  grossQuantity?: number;
  suggestedQuantity?: number | null;
  approvalStatus?: number;
  judgmentDecision?: number | null;
  judgmentReason?: string | null;
  policyRef?: string | null;
  aiConfidence?: number | null;
  isLocked?: boolean;
  floorName?: string | null;
  spaceName?: string | null;
  calculatedAt: string;
  notes?: string | null;
}

export interface MetrajPolicy {
  id: string;
  tenantId: string;
  code: string;
  title: string;
  body: string;
  version: number;
  isActive: boolean;
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
  description?: string | null;
}

export interface PuantajRecord {
  id: string;
  tenantId: string;
  projectId: string;
  siteId?: string | null;
  workerId?: string | null;
  workDate: string;
  workType: number;
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
  unit: number;
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

export interface HakedisDeductionLine {
  id: string;
  tenantId: string;
  hakedisPeriodId: string;
  category: number;
  description: string;
  amount: number;
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

export const SITE_STATUS_LABELS: Record<number, string> = {
  1: 'Aktif',
  2: 'Tamamlandı',
};

export const DRAWING_STATUS_LABELS: Record<number, string> = {
  1: 'Yüklendi',
  2: 'İşleniyor',
  3: 'Hazır',
  4: 'Hata',
  5: 'İnceleme bekliyor',
  6: 'Onaylandı',
};

export const METRAJ_APPROVAL_STATUS_LABELS: Record<number, string> = {
  1: 'Bekliyor',
  2: 'Yapay zeka önerisi',
  3: 'Onaylandı',
  4: 'Reddedildi',
};

export const METRAJ_JUDGMENT_LABELS: Record<number, string> = {
  1: 'Say',
  2: 'Sayma',
  3: 'İncele',
};

export const METRAJ_KALEM_LABELS: Record<number, string> = {
  1: 'Duvar',
  2: 'Sıva',
  3: 'Boya',
  4: 'Dış Cephe Mantolama',
  5: 'Şap Beton',
  6: 'Kalıp',
};

export const MEASUREMENT_UNIT_LABELS: Record<number, string> = {
  1: 'm²',
  2: 'm³',
  3: 'm',
  4: 'kg',
  5: 'ton',
  6: 'adet',
  7: 'takım',
};

export const DEFAULT_UNIT_BY_KALEM: Record<number, number> = {
  1: 1,
  2: 1,
  3: 1,
  4: 1,
  5: 1,
  6: 1,
};

export const ALLOWED_UNITS_BY_KALEM: Record<number, number[]> = {
  1: [1, 2, 3, 6],
  2: [1, 2, 3, 6],
  3: [1, 2, 3, 6],
  4: [1, 2, 3, 6],
  5: [1, 2],
  6: [1, 2],
};

export const WORK_TYPE_LABELS: Record<number, string> = {
  1: 'Gündüz',
  2: 'Gece',
  3: 'Hafta Sonu',
  4: 'Resmi Tatil',
  5: 'İzin',
  6: 'Rapor',
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

export const DEDUCTION_CATEGORY_LABELS: Record<number, string> = {
  1: 'Malzeme',
  2: 'Makine',
  3: 'Yemek',
  4: 'İlave',
  5: 'Diğer',
};

export const STORAGE_KEYS = {
  accessToken: 'hakedis_access_token',
  tenantId: 'hakedis_tenant_id',
} as const;
