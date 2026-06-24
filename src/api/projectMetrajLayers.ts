import { apiClient } from '@/api/client';

export interface DrawingLayerInfo {
  name: string;
  entityCount: number;
  hasClosedArea: boolean;
  hasLines: boolean;
}

export interface ProjectMetrajLayerMapping {
  kalemType: number;
  layerNames: string[];
}

export async function getDrawingLayers(drawingId: string): Promise<DrawingLayerInfo[]> {
  const { data } = await apiClient.get<{
    success: boolean;
    errorMessage?: string | null;
    layers: DrawingLayerInfo[];
  }>(`/Drawings/${drawingId}/layers`);

  if (!data.success) {
    throw new Error(data.errorMessage ?? 'Katman listesi okunamadı.');
  }

  return data.layers ?? [];
}

export async function getProjectMetrajLayerMappings(
  projectId: string,
): Promise<ProjectMetrajLayerMapping[]> {
  const { data } = await apiClient.get<ProjectMetrajLayerMapping[]>(
    `/Projects/${projectId}/metraj-layer-mappings`,
  );
  return data ?? [];
}

export async function saveProjectMetrajLayerMappings(
  projectId: string,
  mappings: ProjectMetrajLayerMapping[],
): Promise<ProjectMetrajLayerMapping[]> {
  const { data } = await apiClient.put<ProjectMetrajLayerMapping[]>(
    `/Projects/${projectId}/metraj-layer-mappings`,
    mappings,
  );
  return data ?? [];
}
