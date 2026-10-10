export interface BackendHealth {
  status: string;
  version: string;
  gee_connected: boolean;
  gee_auth_mode: string;
  simulation_available: boolean;
}

export interface BackendGeeStatus {
  initialized: boolean;
  project_id: string | null;
  auth_mode: string;
  message: string;
  catalog_available: boolean;
}

export interface BackendGeeLayerMetadata {
  name: string;
  description: string;
  dataset_id: string;
  tile_url_template: string;
  acquisition_date_range: string;
  cloud_threshold_pct: number;
  pixel_scale_m: number;
  is_live_gee: boolean;
  caveat: string;
}

export interface BackendGeeLayersResponse {
  status: string;
  gee_live: boolean;
  layers: BackendGeeLayerMetadata[];
  message: string;
}

export async function checkBackendHealth(): Promise<BackendHealth | null> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getBackendGeeStatus(): Promise<BackendGeeStatus | null> {
  try {
    const res = await fetch('/api/gee/status');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchGeeLayers(
  aoiBoundary: { lat: number; lng: number }[],
  dateStart: string = '2024-01-01',
  dateEnd: string = '2024-12-31',
  cloudCoverMax: number = 20.0
): Promise<BackendGeeLayersResponse | null> {
  try {
    const res = await fetch('/api/gee/layers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aoi_boundary: aoiBoundary,
        date_start: dateStart,
        date_end: dateEnd,
        cloud_cover_max: cloudCoverMax,
      }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
