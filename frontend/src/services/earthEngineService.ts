import {
  BackendGeeLayersResponse,
  BackendGeeStatus,
  fetchGeeLayers,
  getBackendGeeStatus,
  BackendGeeLayerMetadata,
} from './apiClient';
import { LatLng } from '../types/mission';

export interface GeeServiceState {
  status: BackendGeeStatus | null;
  layers: BackendGeeLayerMetadata[];
  activeGeeLayer: string | null;
  dateStart: string;
  dateEnd: string;
  cloudMax: number;
  isLoading: boolean;
  error: string | null;
}

class EarthEngineManager {
  private state: GeeServiceState = {
    status: null,
    layers: [],
    activeGeeLayer: null,
    dateStart: '2024-01-01',
    dateEnd: '2024-12-31',
    cloudMax: 20.0,
    isLoading: false,
    error: null,
  };

  private listeners: ((state: GeeServiceState) => void)[] = [];

  public subscribe(listener: (state: GeeServiceState) => void) {
    this.listeners.push(listener);
    listener({ ...this.state });
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l({ ...this.state }));
  }

  public async refreshStatus(): Promise<BackendGeeStatus | null> {
    const status = await getBackendGeeStatus();
    this.state.status = status;
    this.notify();
    return status;
  }

  public async loadLayers(aoiBoundary: LatLng[]): Promise<BackendGeeLayerMetadata[]> {
    if (aoiBoundary.length < 3) return [];

    this.state.isLoading = true;
    this.state.error = null;
    this.notify();

    try {
      const res: BackendGeeLayersResponse | null = await fetchGeeLayers(
        aoiBoundary,
        this.state.dateStart,
        this.state.dateEnd,
        this.state.cloudMax
      );

      if (res && res.layers) {
        this.state.layers = res.layers;
        if (!this.state.activeGeeLayer && res.layers.length > 0 && res.gee_live) {
          this.state.activeGeeLayer = res.layers[0].name;
        }
      }
    } catch (err: any) {
      this.state.error = err.message || 'Failed to fetch GEE layers';
    } finally {
      this.state.isLoading = false;
      this.notify();
    }

    return this.state.layers;
  }

  public setDateRange(start: string, end: string) {
    this.state.dateStart = start;
    this.state.dateEnd = end;
    this.notify();
  }

  public setCloudMax(cloud: number) {
    this.state.cloudMax = cloud;
    this.notify();
  }

  public setActiveGeeLayer(layerName: string | null) {
    this.state.activeGeeLayer = layerName;
    this.notify();
  }

  public getState(): GeeServiceState {
    return { ...this.state };
  }
}

export const earthEngineManager = new EarthEngineManager();
