import { LatLng, MissionSettings, Waypoint } from '../types/mission';
import { generateLawnmowerRoute } from '../map/routeGeneration';

export const BAILADILA_CENTER: LatLng = {
  lat: 18.6080,
  lng: 81.2275,
};

// NMDC Deposit 14 Open-Cast Iron Ore Mine Pit Footprint (~650m x 550m over active excavation benches)
export const DEMO_SURVEY_BOUNDARY: LatLng[] = [
  { lat: 18.6115, lng: 81.2245 },
  { lat: 18.6110, lng: 81.2305 },
  { lat: 18.6050, lng: 81.2315 },
  { lat: 18.6042, lng: 81.2275 },
  { lat: 18.6055, lng: 81.2238 },
];

export const DEFAULT_MISSION_SETTINGS: MissionSettings = {
  missionName: 'Bailadila_Iron_Demo_Survey_01',
  simulatedStartTimeUtc: '2016-08-29T14:15:15Z',
  altitudeAglM: 60,
  speedMps: 8,
  surveyLineSpacingM: 25,
  sampleRateHz: 1,
  nominalEnduranceMinutes: 35,
  closeLoop: true,
  simulationTimeScale: 1,
  sensorMode: 'mixed',
  randomSeed: 20160829,
};

/**
 * Builds demo mission route waypoints
 */
export function buildDemoMission(): {
  boundary: LatLng[];
  waypoints: Waypoint[];
  totalDistanceMeters: number;
} {
  const result = generateLawnmowerRoute(
    DEMO_SURVEY_BOUNDARY,
    DEFAULT_MISSION_SETTINGS.surveyLineSpacingM,
    DEFAULT_MISSION_SETTINGS.closeLoop,
    DEFAULT_MISSION_SETTINGS.altitudeAglM
  );

  return {
    boundary: DEMO_SURVEY_BOUNDARY,
    waypoints: result.waypoints,
    totalDistanceMeters: result.totalDistanceMeters,
  };
}
