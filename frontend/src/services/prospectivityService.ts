import { LatLng } from '../types/mission';
import { TelemetrySample } from '../types/telemetry';
import {
  CandidateHotspot,
  GridCell,
  InterpolationOptions,
  ProspectivityResult,
} from '../types/processing';
import {
  calculateBounds,
  calculateDistanceMeters,
  fromLocalMeters,
  toLocalMeters,
} from '../map/geoUtils';
import Papa from 'papaparse';

export const DEFAULT_INTERPOLATION_OPTIONS: InterpolationOptions = {
  gridResolutionM: 25,
  idwPower: 2.0,
  maxSearchDistM: 150,
  weightMag: 0.70,
  weightSpectral: 0.30,
  colorRamp: 'geophysics',
  opacity: 0.75,
  minSampleCoverageM: 100,
};

/**
 * Robust percentile calculation (e.g. 2nd and 98th percentiles)
 */
function getPercentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/**
 * Client-side Inverse Distance Weighting (IDW) interpolation
 */
export function interpolateSurveyData(
  samples: TelemetrySample[],
  aoiBoundary: LatLng[],
  options: InterpolationOptions = DEFAULT_INTERPOLATION_OPTIONS,
  flightId: string = 'DEMO',
  missionName: string = 'Survey Flight'
): ProspectivityResult {
  if (samples.length === 0) {
    throw new Error('Cannot process survey: zero data samples provided.');
  }

  const origin = aoiBoundary.length > 0 ? aoiBoundary[0] : { lat: samples[0].latitude, lng: samples[0].longitude };

  // Project samples to local meter space
  const localSamples = samples.map((s) => {
    const loc = toLocalMeters({ lat: s.latitude, lng: s.longitude }, origin);
    return {
      x: loc.x,
      y: loc.y,
      anomalyNt: s.magneticAnomalyNt,
      syntheticScore: s.syntheticIronScorePct,
    };
  });

  // Calculate bounding box in local meter coordinates
  const allCoords = aoiBoundary.length > 0 ? aoiBoundary : samples.map((s) => ({ lat: s.latitude, lng: s.longitude }));
  const bounds = calculateBounds(allCoords);

  const localMin = toLocalMeters({ lat: bounds.minLat, lng: bounds.minLng }, origin);
  const localMax = toLocalMeters({ lat: bounds.maxLat, lng: bounds.maxLng }, origin);

  const bufferM = 30; // modest buffer around bounding box
  const minX = Math.min(localMin.x, localMax.x) - bufferM;
  const maxX = Math.max(localMin.x, localMax.x) + bufferM;
  const minY = Math.min(localMin.y, localMax.y) - bufferM;
  const maxY = Math.max(localMin.y, localMax.y) + bufferM;

  const resM = options.gridResolutionM;
  const p = options.idwPower;
  const maxDistSq = options.maxSearchDistM * options.maxSearchDistM;

  const cells: GridCell[] = [];
  const rawAnomalyValues: number[] = [];

  for (let y = minY; y <= maxY; y += resM) {
    for (let x = minX; x <= maxX; x += resM) {
      let weightSum = 0;
      let anomalyWeightedSum = 0;
      let scoreWeightedSum = 0;
      let scoreWeightSum = 0;
      let nearestDistSq = Infinity;
      let neighborCount = 0;
      let exactMatchSample: (typeof localSamples)[0] | null = null;

      for (const sample of localSamples) {
        const dx = x - sample.x;
        const dy = y - sample.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < nearestDistSq) {
          nearestDistSq = distSq;
        }

        if (distSq < 1e-4) {
          exactMatchSample = sample;
          break;
        }

        if (distSq <= maxDistSq) {
          const w = 1.0 / Math.pow(distSq, p / 2);
          weightSum += w;
          anomalyWeightedSum += w * sample.anomalyNt;
          neighborCount++;

          if (sample.syntheticScore !== null && sample.syntheticScore !== undefined) {
            scoreWeightedSum += w * sample.syntheticScore;
            scoreWeightSum += w;
          }
        }
      }

      const nearestDistM = Math.sqrt(nearestDistSq);

      // Mask cells with inadequate local survey coverage
      if (nearestDistM > options.minSampleCoverageM || (weightSum === 0 && !exactMatchSample)) {
        continue;
      }

      let interpolatedAnomaly = 0;
      let interpolatedScore: number | null = null;

      if (exactMatchSample) {
        interpolatedAnomaly = exactMatchSample.anomalyNt;
        interpolatedScore = exactMatchSample.syntheticScore;
        neighborCount = 1;
      } else {
        interpolatedAnomaly = anomalyWeightedSum / weightSum;
        if (scoreWeightSum > 0) {
          interpolatedScore = scoreWeightedSum / scoreWeightSum;
        }
      }

      const geoPoint = fromLocalMeters({ x, y }, origin);

      cells.push({
        lat: parseFloat(geoPoint.lat.toFixed(6)),
        lng: parseFloat(geoPoint.lng.toFixed(6)),
        x,
        y,
        anomalyNt: Math.round(interpolatedAnomaly * 100) / 100,
        syntheticScore: interpolatedScore !== null ? Math.round(interpolatedScore * 10) / 10 : null,
        spectralProxy: null, // populated when GEE is connected
        compositeIndex: 0,   // calculated in second pass below
        nearestSampleDistM: Math.round(nearestDistM * 10) / 10,
        neighborCount,
      });

      rawAnomalyValues.push(interpolatedAnomaly);
    }
  }

  // Robust percentile normalization for exploratory prospectivity index
  const p2 = getPercentile(rawAnomalyValues, 2);
  const p98 = getPercentile(rawAnomalyValues, 98);
  const range = Math.max(1e-3, p98 - p2);

  let maxComposite = 0;
  let sumComposite = 0;

  for (const cell of cells) {
    // Normalise magnetic anomaly component robustly to 0 - 100
    const magNorm = Math.max(0, Math.min(100, ((cell.anomalyNt - p2) / range) * 100));

    // If synthetic score is present, blend gracefully
    let index = magNorm;
    if (cell.syntheticScore !== null && cell.syntheticScore !== undefined) {
      index = 0.5 * magNorm + 0.5 * cell.syntheticScore;
    }

    cell.compositeIndex = Math.round(index * 10) / 10;
    if (cell.compositeIndex > maxComposite) maxComposite = cell.compositeIndex;
    sumComposite += cell.compositeIndex;
  }

  // Sort and extract top candidate hotspots (non-adjacent)
  const sortedCells = [...cells].sort((a, b) => b.compositeIndex - a.compositeIndex);
  const hotspots: CandidateHotspot[] = [];

  for (const cell of sortedCells) {
    if (hotspots.length >= 5) break;

    // Ensure candidate hotspots are at least 50m apart
    const isSeparated = hotspots.every(
      (h) => calculateDistanceMeters(cell, h) > 40
    );

    if (isSeparated) {
      hotspots.push({
        id: `HOTSPOT-${(hotspots.length + 1).toString().padStart(2, '0')}`,
        rank: hotspots.length + 1,
        lat: cell.lat,
        lng: cell.lng,
        anomalyNt: cell.anomalyNt,
        syntheticScore: cell.syntheticScore,
        spectralProxy: cell.spectralProxy,
        compositeIndex: cell.compositeIndex,
        nearestSampleDistM: cell.nearestSampleDistM,
      });
    }
  }

  const minAnomaly = rawAnomalyValues.length > 0 ? Math.min(...rawAnomalyValues) : 0;
  const maxAnomaly = rawAnomalyValues.length > 0 ? Math.max(...rawAnomalyValues) : 0;
  const meanAnomaly =
    rawAnomalyValues.length > 0
      ? rawAnomalyValues.reduce((a, b) => a + b, 0) / rawAnomalyValues.length
      : 0;

  return {
    flightId,
    sourceDatasetName: missionName,
    processedAt: new Date().toISOString(),
    cells,
    hotspots,
    stats: {
      minAnomalyNt: Math.round(minAnomaly * 10) / 10,
      maxAnomalyNt: Math.round(maxAnomaly * 10) / 10,
      meanAnomalyNt: Math.round(meanAnomaly * 10) / 10,
      maxCompositeIndex: Math.round(maxComposite * 10) / 10,
      meanCompositeIndex: cells.length > 0 ? Math.round((sumComposite / cells.length) * 10) / 10 : 0,
      cellCount: cells.length,
      validSamplesCount: samples.length,
    },
    options,
    dataOrigin: samples[0]?.dataOrigin || 'synthetic_simulation',
    hasGeeSpectral: false,
    disclaimer:
      'Prototype limitation: Magnetometer readings in this demonstrator are synthetic. The displayed exploratory index (0-100) is an uncalibrated relative spatial ranking, not a confirmed ore occurrence or probability of finding iron ore.',
  };
}

/**
 * Exports processed grid to CSV format matching section 16.4
 */
export function exportProcessedGridCsv(result: ProspectivityResult): string {
  const rows = result.cells.map((c) => ({
    latitude: c.lat,
    longitude: c.lng,
    magnetic_anomaly_nt_interpolated: c.anomalyNt,
    spectral_proxy: c.spectralProxy ?? '',
    relative_prospectivity_index: c.compositeIndex,
    nearest_sample_distance_m: c.nearestSampleDistM,
    sample_count_or_neighbours: c.neighborCount,
    processing_method: `IDW (p=${result.options.idwPower}, res=${result.options.gridResolutionM}m)`,
    data_origin: result.dataOrigin,
  }));

  return Papa.unparse(rows);
}

/**
 * Exports candidate hotspots and grid as GeoJSON FeatureCollection
 */
export function exportProspectivityGeoJson(result: ProspectivityResult): string {
  const features = result.hotspots.map((h) => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [h.lng, h.lat],
    },
    properties: {
      id: h.id,
      rank: h.rank,
      composite_index: h.compositeIndex,
      magnetic_anomaly_nt: h.anomalyNt,
      nearest_sample_dist_m: h.nearestSampleDistM,
    },
  }));

  const geoJson = {
    type: 'FeatureCollection',
    metadata: {
      flightId: result.flightId,
      processedAt: result.processedAt,
      stats: result.stats,
      disclaimer: result.disclaimer,
    },
    features,
  };

  return JSON.stringify(geoJson, null, 2);
}
