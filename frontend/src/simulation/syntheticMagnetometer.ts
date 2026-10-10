import { LatLng, SensorMode } from '../types/mission';
import { toLocalMeters } from '../map/geoUtils';

export interface AnomalyBody {
  id: string;
  name: string;
  centerLocalM: { x: number; y: number };
  sigmaXM: number;
  sigmaYM: number;
  rotationDeg: number;
  baseAmplitudeNt: number;
}

export interface SyntheticMagReading {
  totalFieldNt: number;
  magneticAnomalyNt: number;
  noiseNt: number;
  estimatedBackgroundNt: number;
  syntheticIronScorePct: number;
}

/**
 * Seeded pseudo-random generator (Mulberry32) for determinism
 */
export function createRng(seed: number) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Box-Muller transform for gaussian noise
 */
function gaussianRandom(rng: () => number, mean: number = 0, stdev: number = 1): number {
  const u1 = Math.max(1e-7, rng());
  const u2 = rng();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * stdev + mean;
}

export class SyntheticMagnetometerModel {
  private referenceOrigin: LatLng;
  private baseFieldNt: number;
  private regionalGradientXNtPerKm: number;
  private regionalGradientYNtPerKm: number;
  private noiseStdDevNt: number;
  private sensorMode: SensorMode;
  private anomalyBodies: AnomalyBody[];
  private rng: () => number;

  constructor(
    referenceOrigin: LatLng,
    sensorMode: SensorMode = 'mixed',
    seed: number = 42,
    baseFieldNt: number = 45280.0
  ) {
    this.referenceOrigin = referenceOrigin;
    this.sensorMode = sensorMode;
    this.baseFieldNt = baseFieldNt;
    this.regionalGradientXNtPerKm = 18.5; // ~18.5 nT / km East
    this.regionalGradientYNtPerKm = -12.2; // ~ -12.2 nT / km North
    this.noiseStdDevNt = 6.5;
    this.rng = createRng(seed);

    // Scaling factor based on mineralogy mode
    let ampMultiplier = 1.0;
    if (sensorMode === 'magnetite_like_strong') ampMultiplier = 2.4;
    else if (sensorMode === 'hematite_like_weak') ampMultiplier = 0.35;

    // Planted synthetic anomaly bodies near reference center
    this.anomalyBodies = [
      {
        id: 'primary-target',
        name: 'Planted Banded Iron Ridge Synthetic Target',
        centerLocalM: { x: 30, y: 40 }, // offset ~30m East, 40m North from origin
        sigmaXM: 95,
        sigmaYM: 180,
        rotationDeg: 35, // oriented along NE-SW geological strike
        baseAmplitudeNt: 520 * ampMultiplier,
      },
      {
        id: 'secondary-target',
        name: 'Secondary Weak Hematitic Anomaly',
        centerLocalM: { x: -110, y: -70 },
        sigmaXM: 70,
        sigmaYM: 110,
        rotationDeg: -20,
        baseAmplitudeNt: 210 * ampMultiplier,
      },
    ];
  }

  /**
   * Evaluates magnetic response at coordinates (lat, lng)
   */
  public evaluate(coord: LatLng, stepNoiseSeed?: number): SyntheticMagReading {
    const local = toLocalMeters(coord, this.referenceOrigin);
    const posKmX = local.x / 1000.0;
    const posKmY = local.y / 1000.0;

    // 1. Regional background field
    const estimatedBackgroundNt =
      this.baseFieldNt +
      this.regionalGradientXNtPerKm * posKmX +
      this.regionalGradientYNtPerKm * posKmY;

    // 2. Sum elliptical Gaussian anomaly bodies
    let pureAnomalyNt = 0;
    for (const body of this.anomalyBodies) {
      const dx = local.x - body.centerLocalM.x;
      const dy = local.y - body.centerLocalM.y;

      // Rotate coordinates by body rotation
      const rad = (-body.rotationDeg * Math.PI) / 180.0;
      const rotX = dx * Math.cos(rad) - dy * Math.sin(rad);
      const rotY = dx * Math.sin(rad) + dy * Math.cos(rad);

      const mahalanobisSq =
        (rotX * rotX) / (body.sigmaXM * body.sigmaXM) +
        (rotY * rotY) / (body.sigmaYM * body.sigmaYM);

      const bodyContribution = body.baseAmplitudeNt * Math.exp(-0.5 * mahalanobisSq);
      pureAnomalyNt += bodyContribution;
    }

    // 3. Seeded sensor noise
    const rngToUse = stepNoiseSeed !== undefined ? createRng(stepNoiseSeed) : this.rng;
    const noiseNt = gaussianRandom(rngToUse, 0, this.noiseStdDevNt);

    // 4. Total field & anomaly
    const totalFieldNt = estimatedBackgroundNt + pureAnomalyNt + noiseNt;
    const magneticAnomalyNt = totalFieldNt - estimatedBackgroundNt;

    // 5. Demonstrative planted synthetic prospectivity score (0 - 100)
    // Normalized proxy relative to primary anomaly peak
    const peakAmp = Math.max(1, this.anomalyBodies[0].baseAmplitudeNt);
    const normalizedScore = Math.max(0, Math.min(100, (pureAnomalyNt / peakAmp) * 94 + 5));

    return {
      totalFieldNt: Math.round(totalFieldNt * 100) / 100,
      magneticAnomalyNt: Math.round(magneticAnomalyNt * 100) / 100,
      noiseNt: Math.round(noiseNt * 100) / 100,
      estimatedBackgroundNt: Math.round(estimatedBackgroundNt * 100) / 100,
      syntheticIronScorePct: Math.round(normalizedScore * 10) / 10,
    };
  }

  public getPlantedTargets(): AnomalyBody[] {
    return this.anomalyBodies;
  }
}
