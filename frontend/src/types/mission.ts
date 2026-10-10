export type MissionStatus =
  | 'IDLE'
  | 'PLANNED'
  | 'READY'
  | 'RUNNING'
  | 'PAUSED'
  | 'RETURNING_HOME'
  | 'COMPLETED'
  | 'ABORTED';

export type DataOrigin = 'synthetic_simulation' | 'uploaded_csv' | 'field_measurement';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Waypoint {
  id: string;
  index: number;
  lat: number;
  lng: number;
  altitudeAglM?: number;
}

export type SensorMode = 'hematite_like_weak' | 'mixed' | 'magnetite_like_strong';

export interface MissionSettings {
  missionName: string;
  simulatedStartTimeUtc: string; // e.g. "2016-08-29T14:15:15Z"
  altitudeAglM: number;          // 20 - 150m (default 60m)
  speedMps: number;              // 2 - 20 m/s (default 8 m/s)
  surveyLineSpacingM: number;    // 10 - 100m (default 25m)
  sampleRateHz: number;          // 1 - 10 Hz (default 1 Hz)
  nominalEnduranceMinutes: number; // default 35 min
  closeLoop: boolean;            // true by default
  simulationTimeScale: 1 | 2 | 5; // playback speed multiplier
  sensorMode: SensorMode;
  randomSeed: number;
}

export interface SurveyBoundary {
  type: 'Polygon';
  coordinates: LatLng[];
}
