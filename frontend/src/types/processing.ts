import { DataOrigin } from './mission';

export interface GridCell {
  lat: number;
  lng: number;
  x?: number;
  y?: number;
  anomalyNt: number;
  syntheticScore: number | null;
  spectralProxy: number | null;
  compositeIndex: number; // 0 - 100
  nearestSampleDistM: number;
  neighborCount: number;
}

export interface CandidateHotspot {
  id: string;
  rank: number;
  lat: number;
  lng: number;
  anomalyNt: number;
  syntheticScore: number | null;
  spectralProxy: number | null;
  compositeIndex: number;
  nearestSampleDistM: number;
}

export interface InterpolationOptions {
  gridResolutionM: number; // default 25m
  idwPower: number;        // default 2.0
  maxSearchDistM: number;  // default 150m
  weightMag: number;       // default 0.70
  weightSpectral: number;  // default 0.30
  colorRamp: 'geophysics' | 'thermal' | 'viridis';
  opacity: number;         // 0 - 1
  minSampleCoverageM: number; // mask cells > this dist from sample
}

export interface ProspectivityResult {
  flightId: string;
  sourceDatasetName: string;
  processedAt: string;
  cells: GridCell[];
  hotspots: CandidateHotspot[];
  stats: {
    minAnomalyNt: number;
    maxAnomalyNt: number;
    meanAnomalyNt: number;
    maxCompositeIndex: number;
    meanCompositeIndex: number;
    cellCount: number;
    validSamplesCount: number;
  };
  options: InterpolationOptions;
  dataOrigin: DataOrigin;
  hasGeeSpectral: boolean;
  geeMetadata?: {
    datasetId: string;
    dateRange: string;
    cloudMasked: boolean;
    pixelScaleM: number;
  };
  disclaimer: string;
}

export interface CsvValidationReport {
  isValid: boolean;
  totalRows: number;
  validRows: number;
  droppedRows: number;
  errors: string[];
  warnings: string[];
  fieldMapping: Record<string, string>;
  detectedOrigin: DataOrigin;
  dateRange: { start: string; end: string } | null;
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number } | null;
  hasMagneticAnomaly: boolean;
  hasTotalField: boolean;
  hasSyntheticScore: boolean;
}
