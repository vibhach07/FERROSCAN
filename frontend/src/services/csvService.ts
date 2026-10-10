import Papa from 'papaparse';
import { TelemetrySample } from '../types/telemetry';
import { CsvValidationReport } from '../types/processing';

export const CSV_HEADERS = [
  'flight_id',
  'mission_name',
  'mission_timestamp_utc',
  'simulation_elapsed_s',
  'sample_index',
  'latitude',
  'longitude',
  'planned_latitude',
  'planned_longitude',
  'heading_deg',
  'ground_speed_mps',
  'vertical_speed_mps',
  'altitude_agl_m',
  'elevation_m_msl',
  'altitude_m_msl',
  'distance_from_home_m',
  'distance_travelled_m',
  'waypoint_index',
  'battery_percent',
  'link_quality_percent',
  'mag_total_field_nt',
  'magnetic_anomaly_nt',
  'magnetometer_noise_nt',
  'synthetic_iron_score_pct',
  'gps_fix_status',
  'sensor_status',
  'data_origin',
] as const;

/**
 * Serializes telemetry samples to a compliant CSV string
 */
export function serializeTelemetryToCsv(samples: TelemetrySample[]): string {
  const rows = samples.map((s) => ({
    flight_id: s.flightId,
    mission_name: s.missionName,
    mission_timestamp_utc: s.missionTimestampUtc,
    simulation_elapsed_s: s.simulationElapsedS,
    sample_index: s.sampleIndex,
    latitude: s.latitude,
    longitude: s.longitude,
    planned_latitude: s.plannedLatitude,
    planned_longitude: s.plannedLongitude,
    heading_deg: s.headingDeg,
    ground_speed_mps: s.groundSpeedMps,
    vertical_speed_mps: s.verticalSpeedMps,
    altitude_agl_m: s.altitudeAglM,
    elevation_m_msl: s.elevationMslM ?? '',
    altitude_m_msl: s.altitudeMslM ?? '',
    distance_from_home_m: s.distanceFromHomeM,
    distance_travelled_m: s.distanceTravelledM,
    waypoint_index: s.waypointIndex,
    battery_percent: s.batteryPercent,
    link_quality_percent: s.linkQualityPercent,
    mag_total_field_nt: s.magTotalFieldNt,
    magnetic_anomaly_nt: s.magneticAnomalyNt,
    magnetometer_noise_nt: s.magnetometerNoiseNt,
    synthetic_iron_score_pct: s.syntheticIronScorePct ?? '',
    gps_fix_status: s.gpsFixStatus,
    sensor_status: s.sensorStatus,
    data_origin: s.dataOrigin,
  }));

  return Papa.unparse(rows, {
    columns: [...CSV_HEADERS],
    quotes: false,
  });
}

/**
 * Creates a downloadable File Blob from telemetry samples
 */
export function createTelemetryCsvBlob(samples: TelemetrySample[]): Blob {
  const csvContent = serializeTelemetryToCsv(samples);
  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}

/**
 * Triggers browser download of a CSV blob with standardized naming
 */
export function downloadCsvFile(
  blob: Blob,
  missionName: string,
  flightId: string,
  isAborted: boolean = false
) {
  const cleanName = missionName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '-');
  const tag = isAborted ? 'ABORTED_PARTIAL_SYNTHETIC' : 'SYNTHETIC';
  const fileName = `${cleanName}_${dateStr}_${timeStr}_${flightId}_${tag}.csv`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Flexible header alias dictionary for external or custom CSV files
 */
const ALIAS_MAP: Record<string, string> = {
  lat: 'latitude',
  latitude_deg: 'latitude',
  y: 'latitude',
  lon: 'longitude',
  lng: 'longitude',
  longitude_deg: 'longitude',
  x: 'longitude',
  timestamp: 'mission_timestamp_utc',
  time: 'mission_timestamp_utc',
  time_utc: 'mission_timestamp_utc',
  mag_anomaly: 'magnetic_anomaly_nt',
  anomaly: 'magnetic_anomaly_nt',
  mag_anomaly_nt: 'magnetic_anomaly_nt',
  anomaly_nt: 'magnetic_anomaly_nt',
  magnetic_anomaly: 'magnetic_anomaly_nt',
  total_field: 'mag_total_field_nt',
  total_field_nt: 'mag_total_field_nt',
  mag_field: 'mag_total_field_nt',
  b_field_nt: 'mag_total_field_nt',
  iron_score: 'synthetic_iron_score_pct',
  synthetic_score: 'synthetic_iron_score_pct',
  score: 'synthetic_iron_score_pct',
  prospectivity: 'synthetic_iron_score_pct',
};

/**
 * Parses and validates an uploaded or archived CSV file
 */
export function parseAndValidateCsv(csvText: string): {
  report: CsvValidationReport;
  samples: TelemetrySample[];
} {
  const result = Papa.parse<Record<string, any>>(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  const errors: string[] = [];
  const warnings: string[] = [];
  const rawHeaders = result.meta.fields || [];

  // Match columns to standard names
  const fieldMapping: Record<string, string> = {};
  for (const rawCol of rawHeaders) {
    const normalized = rawCol.trim().toLowerCase();
    if (CSV_HEADERS.includes(normalized as any)) {
      fieldMapping[rawCol] = normalized;
    } else if (ALIAS_MAP[normalized]) {
      fieldMapping[rawCol] = ALIAS_MAP[normalized];
    }
  }

  const mappedCols = Object.values(fieldMapping);
  const hasLat = mappedCols.includes('latitude');
  const hasLng = mappedCols.includes('longitude');
  const hasAnomaly = mappedCols.includes('magnetic_anomaly_nt');
  const hasTotalField = mappedCols.includes('mag_total_field_nt');
  const hasScore = mappedCols.includes('synthetic_iron_score_pct');

  if (!hasLat || !hasLng) {
    errors.push('Missing required latitude/longitude coordinate columns.');
  }

  if (!hasAnomaly && !hasTotalField) {
    errors.push('Missing magnetic field data (neither magnetic_anomaly_nt nor mag_total_field_nt detected).');
  }

  const validSamples: TelemetrySample[] = [];
  let droppedCount = 0;
  let minLat = Infinity,
    maxLat = -Infinity,
    minLng = Infinity,
    maxLng = -Infinity;
  let earliestDate: string | null = null;
  let latestDate: string | null = null;

  result.data.forEach((row, idx) => {
    // Extract mapped fields
    const latKey = Object.keys(fieldMapping).find((k) => fieldMapping[k] === 'latitude');
    const lngKey = Object.keys(fieldMapping).find((k) => fieldMapping[k] === 'longitude');
    const anomKey = Object.keys(fieldMapping).find((k) => fieldMapping[k] === 'magnetic_anomaly_nt');
    const totKey = Object.keys(fieldMapping).find((k) => fieldMapping[k] === 'mag_total_field_nt');
    const scoreKey = Object.keys(fieldMapping).find((k) => fieldMapping[k] === 'synthetic_iron_score_pct');
    const timeKey = Object.keys(fieldMapping).find((k) => fieldMapping[k] === 'mission_timestamp_utc');

    const lat = latKey ? parseFloat(row[latKey]) : NaN;
    const lng = lngKey ? parseFloat(row[lngKey]) : NaN;

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      droppedCount++;
      return;
    }

    let anomalyNt = anomKey ? parseFloat(row[anomKey]) : NaN;
    let totalFieldNt = totKey ? parseFloat(row[totKey]) : NaN;

    if (isNaN(anomalyNt) && !isNaN(totalFieldNt)) {
      // Approximate background baseline subtraction if only total field exists
      anomalyNt = totalFieldNt - 45280.0;
    } else if (isNaN(totalFieldNt) && !isNaN(anomalyNt)) {
      totalFieldNt = 45280.0 + anomalyNt;
    }

    if (isNaN(anomalyNt) && isNaN(totalFieldNt)) {
      droppedCount++;
      return;
    }

    const score = scoreKey && !isNaN(parseFloat(row[scoreKey])) ? parseFloat(row[scoreKey]) : null;
    const timeStr = timeKey && row[timeKey] ? String(row[timeKey]) : new Date().toISOString();

    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;

    if (!earliestDate || timeStr < earliestDate) earliestDate = timeStr;
    if (!latestDate || timeStr > latestDate) latestDate = timeStr;

    validSamples.push({
      flightId: String(row['flight_id'] || 'IMPORTED'),
      missionName: String(row['mission_name'] || 'Imported Survey'),
      missionTimestampUtc: timeStr,
      simulationElapsedS: Number(row['simulation_elapsed_s'] || idx),
      sampleIndex: Number(row['sample_index'] || idx),
      latitude: lat,
      longitude: lng,
      plannedLatitude: Number(row['planned_latitude'] || lat),
      plannedLongitude: Number(row['planned_longitude'] || lng),
      headingDeg: Number(row['heading_deg'] || 0),
      groundSpeedMps: Number(row['ground_speed_mps'] || 0),
      verticalSpeedMps: Number(row['vertical_speed_mps'] || 0),
      altitudeAglM: Number(row['altitude_agl_m'] || 60),
      elevationMslM: row['elevation_m_msl'] !== null && !isNaN(Number(row['elevation_m_msl'])) ? Number(row['elevation_m_msl']) : null,
      altitudeMslM: row['altitude_m_msl'] !== null && !isNaN(Number(row['altitude_m_msl'])) ? Number(row['altitude_m_msl']) : null,
      distanceFromHomeM: Number(row['distance_from_home_m'] || 0),
      distanceTravelledM: Number(row['distance_travelled_m'] || 0),
      waypointIndex: Number(row['waypoint_index'] || 0),
      batteryPercent: Number(row['battery_percent'] || 100),
      linkQualityPercent: Number(row['link_quality_percent'] || 100),
      magTotalFieldNt: totalFieldNt,
      magneticAnomalyNt: anomalyNt,
      magnetometerNoiseNt: Number(row['magnetometer_noise_nt'] || 0),
      syntheticIronScorePct: score,
      gpsFixStatus: String(row['gps_fix_status'] || 'IMPORTED'),
      sensorStatus: String(row['sensor_status'] || 'Validated'),
      dataOrigin: row['data_origin'] === 'synthetic_simulation' ? 'synthetic_simulation' : 'uploaded_csv',
    });
  });

  const isSynthetic = validSamples.length > 0 && validSamples[0].dataOrigin === 'synthetic_simulation';

  const report: CsvValidationReport = {
    isValid: errors.length === 0 && validSamples.length > 0,
    totalRows: result.data.length,
    validRows: validSamples.length,
    droppedRows: droppedCount,
    errors,
    warnings,
    fieldMapping,
    detectedOrigin: isSynthetic ? 'synthetic_simulation' : 'uploaded_csv',
    dateRange: earliestDate && latestDate ? { start: earliestDate, end: latestDate } : null,
    bounds: validSamples.length > 0 ? { minLat, maxLat, minLng, maxLng } : null,
    hasMagneticAnomaly: hasAnomaly,
    hasTotalField: hasTotalField,
    hasSyntheticScore: hasScore,
  };

  return { report, samples: validSamples };
}
