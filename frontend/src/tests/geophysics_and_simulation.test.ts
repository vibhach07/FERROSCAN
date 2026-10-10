import { describe, it, expect } from 'vitest';
import { generateLawnmowerRoute } from '../map/routeGeneration';
import { calculateDistanceMeters } from '../map/geoUtils';
import { SyntheticMagnetometerModel } from '../simulation/syntheticMagnetometer';
import { DEMO_SURVEY_BOUNDARY, DEFAULT_MISSION_SETTINGS } from '../simulation/demoScenario';
import {
  serializeTelemetryToCsv,
  parseAndValidateCsv,
  CSV_HEADERS,
} from '../services/csvService';
import { interpolateSurveyData } from '../services/prospectivityService';
import { TelemetrySample } from '../types/telemetry';

describe('Mission Planning & Route Generation', () => {
  it('generates lawnmower survey route with exact loop closure (start === end)', () => {
    const { waypoints, totalDistanceMeters } = generateLawnmowerRoute(
      DEMO_SURVEY_BOUNDARY,
      25,
      true,
      60
    );

    expect(waypoints.length).toBeGreaterThan(4);
    expect(totalDistanceMeters).toBeGreaterThan(100);

    // Exact loop closure check
    const first = waypoints[0];
    const last = waypoints[waypoints.length - 1];

    expect(last.lat).toBeCloseTo(first.lat, 7);
    expect(last.lng).toBeCloseTo(first.lng, 7);
    expect(calculateDistanceMeters(first, last)).toBeLessThan(0.001);
  });

  it('respects non-closed loop option when requested', () => {
    const { waypoints } = generateLawnmowerRoute(
      DEMO_SURVEY_BOUNDARY,
      25,
      false,
      60
    );
    const first = waypoints[0];
    const last = waypoints[waypoints.length - 1];
    // In open loop, final point is at the end of the last transect, not at start
    const dist = calculateDistanceMeters(first, last);
    expect(dist).toBeGreaterThan(10);
  });
});

describe('Synthetic Magnetometer Geophysical Model', () => {
  it('is deterministic for the same coordinate, seed, and sensor mode', () => {
    const origin = { lat: 18.615, lng: 81.231 };
    const model1 = new SyntheticMagnetometerModel(origin, 'mixed', 42);
    const model2 = new SyntheticMagnetometerModel(origin, 'mixed', 42);

    const testCoord = { lat: 18.6152, lng: 81.2314 };
    const reading1 = model1.evaluate(testCoord, 100);
    const reading2 = model2.evaluate(testCoord, 100);

    expect(reading1.totalFieldNt).toEqual(reading2.totalFieldNt);
    expect(reading1.magneticAnomalyNt).toEqual(reading2.magneticAnomalyNt);
    expect(reading1.estimatedBackgroundNt).toEqual(reading2.estimatedBackgroundNt);
  });

  it('detects planted synthetic anomaly body near its local center', () => {
    const origin = { lat: 18.615, lng: 81.231 };
    const model = new SyntheticMagnetometerModel(origin, 'magnetite_like_strong', 42);

    // Target center is offset ~30m East, 40m North
    const targetApprox = { lat: 18.61536, lng: 81.23128 };
    const farCoord = { lat: 18.625, lng: 81.245 };

    const targetReading = model.evaluate(targetApprox, 1);
    const farReading = model.evaluate(farCoord, 1);

    expect(targetReading.magneticAnomalyNt).toBeGreaterThan(farReading.magneticAnomalyNt + 100);
    expect(targetReading.syntheticIronScorePct).toBeGreaterThan(farReading.syntheticIronScorePct);
  });
});

describe('CSV Serialization & Schema Validation', () => {
  const dummySample: TelemetrySample = {
    flightId: 'FLT-TEST-001',
    missionName: 'Bailadila_Test_Flight',
    missionTimestampUtc: '2016-08-29T14:15:15Z',
    simulationElapsedS: 0,
    sampleIndex: 0,
    latitude: 18.615,
    longitude: 81.231,
    plannedLatitude: 18.615,
    plannedLongitude: 81.231,
    headingDeg: 90,
    groundSpeedMps: 8,
    verticalSpeedMps: 0,
    altitudeAglM: 60,
    elevationMslM: 685,
    altitudeMslM: 745,
    distanceFromHomeM: 0,
    distanceTravelledM: 0,
    waypointIndex: 0,
    batteryPercent: 100,
    linkQualityPercent: 98,
    magTotalFieldNt: 45780.25,
    magneticAnomalyNt: 500.25,
    magnetometerNoiseNt: 2.1,
    syntheticIronScorePct: 88.5,
    gpsFixStatus: 'RTK FIX (Simulated)',
    sensorStatus: 'Active / Sampling',
    dataOrigin: 'synthetic_simulation',
  };

  it('serializes all 27 required columns in exact required order', () => {
    const csvText = serializeTelemetryToCsv([dummySample]);
    const lines = csvText.trim().split('\n');
    expect(lines.length).toBe(2);

    const headerCols = lines[0].replace(/\r$/, '').split(',');
    expect(headerCols).toEqual([...CSV_HEADERS]);
    expect(headerCols.length).toBe(27);
  });

  it('validates and round-trips exported CSV data successfully', () => {
    const csvText = serializeTelemetryToCsv([dummySample]);
    const { report, samples } = parseAndValidateCsv(csvText);

    expect(report.isValid).toBe(true);
    expect(report.totalRows).toBe(1);
    expect(report.validRows).toBe(1);
    expect(report.detectedOrigin).toBe('synthetic_simulation');
    expect(samples[0].latitude).toBeCloseTo(18.615, 5);
    expect(samples[0].magneticAnomalyNt).toBeCloseTo(500.25, 2);
  });

  it('handles external CSV column aliases (e.g. lat, lon, total_field_nt)', () => {
    const externalCsv = `lat,lon,total_field_nt\n18.615,81.231,45800.5\n18.616,81.232,45900.0`;
    const { report, samples } = parseAndValidateCsv(externalCsv);

    expect(report.isValid).toBe(true);
    expect(report.validRows).toBe(2);
    expect(report.detectedOrigin).toBe('uploaded_csv');
    expect(samples[0].magTotalFieldNt).toBe(45800.5);
  });
});

describe('Spatial Prospectivity IDW Interpolation', () => {
  it('interpolates survey samples into grid cells and candidate hotspots', () => {
    const dummySamples: TelemetrySample[] = [
      {
        flightId: 'FLT-TEST',
        missionName: 'Test',
        missionTimestampUtc: '2016-08-29T14:15:15Z',
        simulationElapsedS: 0,
        sampleIndex: 0,
        latitude: 18.6080,
        longitude: 81.2275,
        plannedLatitude: 18.6080,
        plannedLongitude: 81.2275,
        headingDeg: 0,
        groundSpeedMps: 8,
        verticalSpeedMps: 0,
        altitudeAglM: 60,
        elevationMslM: 1050,
        altitudeMslM: 1110,
        distanceFromHomeM: 0,
        distanceTravelledM: 0,
        waypointIndex: 0,
        batteryPercent: 100,
        linkQualityPercent: 98,
        magTotalFieldNt: 45900,
        magneticAnomalyNt: 620,
        magnetometerNoiseNt: 1,
        syntheticIronScorePct: 95,
        gpsFixStatus: 'RTK FIX',
        sensorStatus: 'Active',
        dataOrigin: 'synthetic_simulation',
      },
      {
        flightId: 'FLT-TEST',
        missionName: 'Test',
        missionTimestampUtc: '2016-08-29T14:15:20Z',
        simulationElapsedS: 5,
        sampleIndex: 1,
        latitude: 18.6085,
        longitude: 81.2280,
        plannedLatitude: 18.6085,
        plannedLongitude: 81.2280,
        headingDeg: 0,
        groundSpeedMps: 8,
        verticalSpeedMps: 0,
        altitudeAglM: 60,
        elevationMslM: 685,
        altitudeMslM: 745,
        distanceFromHomeM: 50,
        distanceTravelledM: 50,
        waypointIndex: 1,
        batteryPercent: 99,
        linkQualityPercent: 98,
        magTotalFieldNt: 45350,
        magneticAnomalyNt: 70,
        magnetometerNoiseNt: 1,
        syntheticIronScorePct: 20,
        gpsFixStatus: 'RTK FIX',
        sensorStatus: 'Active',
        dataOrigin: 'synthetic_simulation',
      },
    ];

    const result = interpolateSurveyData(dummySamples, DEMO_SURVEY_BOUNDARY);

    expect(result.cells.length).toBeGreaterThan(0);
    expect(result.stats.maxAnomalyNt).toBeGreaterThanOrEqual(600);
    expect(result.stats.maxCompositeIndex).toBeLessThanOrEqual(100);
    expect(result.stats.maxCompositeIndex).toBeGreaterThanOrEqual(0);
    expect(result.hotspots.length).toBeGreaterThanOrEqual(1);
  });
});
