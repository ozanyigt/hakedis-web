import { apiClient } from '@/api/client';

function fileNameFromDisposition(header?: string): string | null {
  if (!header) return null;
  const utfMatch = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (utfMatch?.[1]) return decodeURIComponent(utfMatch[1]);
  const match = /filename="?([^";]+)"?/i.exec(header);
  return match?.[1] ?? null;
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function downloadExport(path: string, params: Record<string, string>, fallbackName: string) {
  const response = await apiClient.get(path, {
    params,
    responseType: 'blob',
  });

  const fileName = fileNameFromDisposition(response.headers['content-disposition']) ?? fallbackName;
  triggerDownload(response.data as Blob, fileName);
}

export async function exportProjectsExcel(tenantId: string) {
  await downloadExport('/Exports/projects', { tenantId }, 'projeler.xlsx');
}

export async function exportPuantajExcel(tenantId: string, projectId: string) {
  await downloadExport('/Exports/puantaj', { tenantId, projectId }, 'puantaj.xlsx');
}

export async function exportMetrajExcel(tenantId: string, projectId: string) {
  await downloadExport('/Exports/metraj', { tenantId, projectId }, 'metraj.xlsx');
}

export async function exportHakedisExcel(tenantId: string, projectId: string) {
  await downloadExport('/Exports/hakedis', { tenantId, projectId }, 'hakedis.xlsx');
}

export async function exportContractItemsExcel(tenantId: string, projectId: string) {
  await downloadExport('/Exports/contract-items', { tenantId, projectId }, 'sozlesme-kalemleri.xlsx');
}
