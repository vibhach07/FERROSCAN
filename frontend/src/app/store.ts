import {
  LatLng,
  MissionSettings,
  MissionStatus,
  Waypoint,
} from '../types/mission';
import { AircraftAttitude, TelemetrySample } from '../types/telemetry';
import { ProspectivityResult } from '../types/processing';
import {
  DEFAULT_MISSION_SETTINGS,
  buildDemoMission,
} from '../simulation/demoScenario';

export interface AppState {
  missionStatus: MissionStatus;
  settings: MissionSettings;
  aoiBoundary: LatLng[];
  waypoints: Waypoint[];
  totalRouteDistanceMeters: number;
  currentTelemetry: TelemetrySample | null;
  attitude: AircraftAttitude;
  telemetryHistory: TelemetrySample[];
  processedResult: ProspectivityResult | null;
  isLibraryOpen: boolean;
  isWelcomeOpen: boolean;
  activeLayer: 'satellite' | 'osm' | 'terrain' | 'gee_rgb';
  showHeatmap: boolean;
  showFlownTrail: boolean;
  showWaypoints: boolean;
  showPlantedTargets: boolean;
  heatmapOpacity: number;
  isDrawingBoundary: boolean;
  isDrawingManualRoute: boolean;
}

export function createInitialState(): AppState {
  const demo = buildDemoMission();
  return {
    missionStatus: 'READY',
    settings: { ...DEFAULT_MISSION_SETTINGS },
    aoiBoundary: demo.boundary,
    waypoints: demo.waypoints,
    totalRouteDistanceMeters: demo.totalDistanceMeters,
    currentTelemetry: null,
    attitude: { pitchDeg: 0, rollDeg: 0, yawDeg: 0 },
    telemetryHistory: [],
    processedResult: null,
    isLibraryOpen: false,
    isWelcomeOpen: true,
    activeLayer: 'satellite',
    showHeatmap: true,
    showFlownTrail: true,
    showWaypoints: true,
    showPlantedTargets: false,
    heatmapOpacity: 0.75,
    isDrawingBoundary: false,
    isDrawingManualRoute: false,
  };
}
