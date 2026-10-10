import { LatLng } from '../types/mission';

const EARTH_RADIUS_M = 6371000;

export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function radiansToDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Calculates geodesic distance between two points in meters using Haversine formula
 */
export function calculateDistanceMeters(p1: LatLng, p2: LatLng): number {
  const dLat = degreesToRadians(p2.lat - p1.lat);
  const dLng = degreesToRadians(p2.lng - p1.lng);
  const lat1 = degreesToRadians(p1.lat);
  const lat2 = degreesToRadians(p2.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

/**
 * Calculates initial bearing in degrees [0, 360) from p1 to p2
 */
export function calculateBearingDegrees(p1: LatLng, p2: LatLng): number {
  const lat1 = degreesToRadians(p1.lat);
  const lat2 = degreesToRadians(p2.lat);
  const dLng = degreesToRadians(p2.lng - p1.lng);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  let brng = radiansToDegrees(Math.atan2(y, x));
  return (brng + 360) % 360;
}

/**
 * Local tangent plane projection (Equirectangular approximation centered on reference origin)
 * Accurate within millimeters over several square kilometers.
 */
export function toLocalMeters(point: LatLng, origin: LatLng): { x: number; y: number } {
  const latRad = degreesToRadians(origin.lat);
  const x = degreesToRadians(point.lng - origin.lng) * EARTH_RADIUS_M * Math.cos(latRad);
  const y = degreesToRadians(point.lat - origin.lat) * EARTH_RADIUS_M;
  return { x, y };
}

export function fromLocalMeters(local: { x: number; y: number }, origin: LatLng): LatLng {
  const latRad = degreesToRadians(origin.lat);
  const dLatRad = local.y / EARTH_RADIUS_M;
  const dLngRad = local.x / (EARTH_RADIUS_M * Math.cos(latRad));

  return {
    lat: origin.lat + radiansToDegrees(dLatRad),
    lng: origin.lng + radiansToDegrees(dLngRad),
  };
}

/**
 * Linear interpolation between two coordinates
 */
export function interpolateLatLng(p1: LatLng, p2: LatLng, t: number): LatLng {
  const clampedT = Math.max(0, Math.min(1, t));
  return {
    lat: p1.lat + (p2.lat - p1.lat) * clampedT,
    lng: p1.lng + (p2.lng - p1.lng) * clampedT,
  };
}

/**
 * Ray-casting algorithm for testing if point is inside a polygon
 */
export function isPointInPolygon(point: LatLng, polygon: LatLng[]): boolean {
  if (polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    const intersect =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Calculates geodesic bounding box of a list of coordinates
 */
export function calculateBounds(points: LatLng[]): {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
} {
  if (points.length === 0) {
    return { minLat: 0, maxLat: 0, minLng: 0, maxLng: 0 };
  }
  let minLat = points[0].lat;
  let maxLat = points[0].lat;
  let minLng = points[0].lng;
  let maxLng = points[0].lng;

  for (const pt of points) {
    if (pt.lat < minLat) minLat = pt.lat;
    if (pt.lat > maxLat) maxLat = pt.lat;
    if (pt.lng < minLng) minLng = pt.lng;
    if (pt.lng > maxLng) maxLng = pt.lng;
  }

  return { minLat, maxLat, minLng, maxLng };
}

/**
 * Computes polygon area in square meters using spherical polygon formula
 */
export function calculatePolygonAreaM2(polygon: LatLng[]): number {
  if (polygon.length < 3) return 0;
  let totalArea = 0;
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    const p1 = polygon[i];
    const p2 = polygon[j];
    totalArea +=
      degreesToRadians(p2.lng - p1.lng) *
      (2 + Math.sin(degreesToRadians(p1.lat)) + Math.sin(degreesToRadians(p2.lat)));
  }
  totalArea = (Math.abs(totalArea) * EARTH_RADIUS_M * EARTH_RADIUS_M) / 2.0;
  return totalArea;
}

/**
 * Computes a bounding polygon for a list of coordinates with an optional margin in degrees (~200-300m)
 */
export function createBufferedBoundingPolygon(points: LatLng[], marginDeg: number = 0.003): LatLng[] {
  if (points.length === 0) return [];
  const bounds = calculateBounds(points);
  const minLat = bounds.minLat - marginDeg;
  const maxLat = bounds.maxLat + marginDeg;
  const minLng = bounds.minLng - marginDeg;
  const maxLng = bounds.maxLng + marginDeg;

  return [
    { lat: minLat, lng: minLng },
    { lat: maxLat, lng: minLng },
    { lat: maxLat, lng: maxLng },
    { lat: minLat, lng: maxLng },
  ];
}
