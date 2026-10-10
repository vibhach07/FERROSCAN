import { DataOrigin } from './mission';

export interface TelemetrySample {
  flightId: string;
  missionName: string;
  missionTimestampUtc: string;
  simulationElapsedS: number;
  sampleIndex: number;
  latitude: number;
  longitude: number;
  plannedLatitude: number;
  plannedLongitude: number;
  headingDeg: number;
  groundSpeedMps: number;
  verticalSpeedMps: number;
  altitudeAglM: number;
  elevationMslM: number | null;
  altitudeMslM: number | null;
  distanceFromHomeM: number;
  distanceTravelledM: number;
  waypointIndex: number;
  batteryPercent: number;
  linkQualityPercent: number;
  magTotalFieldNt: number;
  magneticAnomalyNt: number;
  magnetometerNoiseNt: number;
  syntheticIronScorePct: number | null;
  gpsFixStatus: string;
  sensorStatus: string;
  dataOrigin: DataOrigin;
}

export interface AircraftAttitude {
  pitchDeg: number;
  rollDeg: number;
  yawDeg: number;
}

export interface TelemetryState {
  currentSample: TelemetrySample | null;
  attitude: AircraftAttitude;
  currentWaypointIndex: number;
  totalWaypoints: number;
  progressPercent: number;
  history: TelemetrySample[];
}
