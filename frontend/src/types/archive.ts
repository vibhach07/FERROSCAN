import { DataOrigin, MissionSettings, MissionStatus, LatLng } from './mission';
import { ProspectivityResult } from './processing';

export interface SurveySessionRecord {
  id: string;
  missionName: string;
  createdAt: string;
  status: MissionStatus;
  sampleCount: number;
  durationSeconds: number;
  distanceMeters: number;
  bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
  aoiBoundary: LatLng[];
  waypoints: LatLng[];
  settings: MissionSettings;
  dataOrigin: DataOrigin;
  csvBlob: Blob;
  csvFileName: string;
  processedResult?: ProspectivityResult;
  manifest: {
    systemVersion: string;
    isSynthetic: boolean;
    seed: number;
    sensorMode: string;
    notice: string;
  };
}
