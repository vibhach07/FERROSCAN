import { LatLng, Waypoint } from '../types/mission';
import {
  toLocalMeters,
  fromLocalMeters,
  isPointInPolygon,
  calculateDistanceMeters,
} from './geoUtils';

interface LineSegment {
  p1: { x: number; y: number };
  p2: { x: number; y: number };
}

/**
 * Finds intersection point between a horizontal line y = y0 and a segment (x1, y1) -> (x2, y2)
 */
function intersectHorizontalLine(
  y0: number,
  seg: LineSegment
): number | null {
  const { p1, p2 } = seg;
  if ((p1.y <= y0 && p2.y >= y0) || (p2.y <= y0 && p1.y >= y0)) {
    if (Math.abs(p2.y - p1.y) < 1e-6) {
      return null; // collinear horizontal segment
    }
    const t = (y0 - p1.y) / (p2.y - p1.y);
    return p1.x + t * (p2.x - p1.x);
  }
  return null;
}

/**
 * Generates lawnmower survey flight waypoints clipped inside a survey boundary polygon.
 */
export function generateLawnmowerRoute(
  boundary: LatLng[],
  spacingMeters: number = 25,
  closeLoop: boolean = true,
  altitudeAglM: number = 60
): { waypoints: Waypoint[]; totalDistanceMeters: number } {
  if (boundary.length < 3) {
    return { waypoints: [], totalDistanceMeters: 0 };
  }

  const origin = boundary[0];
  const localPoly = boundary.map((p) => toLocalMeters(p, origin));

  // Determine local bounding box
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const p of localPoly) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  // Polygon edge segments
  const polySegments: LineSegment[] = [];
  for (let i = 0; i < localPoly.length; i++) {
    const nextIdx = (i + 1) % localPoly.length;
    polySegments.push({ p1: localPoly[i], p2: localPoly[nextIdx] });
  }

  // Generate sweep lines from minY + margin to maxY - margin
  const margin = Math.min(spacingMeters / 2, 10);
  const startY = minY + margin;
  const endY = maxY - margin;

  const rawTransects: { y: number; xStarts: number[] }[] = [];

  for (let y = startY; y <= endY; y += spacingMeters) {
    const xIntersections: number[] = [];
    for (const seg of polySegments) {
      const x = intersectHorizontalLine(y, seg);
      if (x !== null) {
        xIntersections.push(x);
      }
    }

    xIntersections.sort((a, b) => a - b);
    // Remove nearly duplicate intersection points
    const deduped: number[] = [];
    for (const x of xIntersections) {
      if (deduped.length === 0 || Math.abs(x - deduped[deduped.length - 1]) > 1.0) {
        deduped.push(x);
      }
    }

    if (deduped.length >= 2) {
      rawTransects.push({ y, xStarts: deduped });
    }
  }

  if (rawTransects.length === 0) {
    // If polygon is too small for sweep lines, use polygon perimeter
    const wp: Waypoint[] = boundary.map((p, idx) => ({
      id: `WP-${idx + 1}`,
      index: idx,
      lat: p.lat,
      lng: p.lng,
      altitudeAglM,
    }));
    if (closeLoop && wp.length > 0) {
      wp.push({
        id: `WP-${wp.length + 1}`,
        index: wp.length,
        lat: boundary[0].lat,
        lng: boundary[0].lng,
        altitudeAglM,
      });
    }
    return { waypoints: wp, totalDistanceMeters: calculateTotalRouteDistance(wp) };
  }

  // Construct boustrophedon track
  const localWaypoints: { x: number; y: number }[] = [];
  let sweepDirectionForward = true;

  for (const transect of rawTransects) {
    const { y, xStarts } = transect;
    // Connect pairs of intersections [x0, x1], [x2, x3]
    for (let i = 0; i < xStarts.length - 1; i += 2) {
      const leftX = xStarts[i];
      const rightX = xStarts[i + 1];

      if (sweepDirectionForward) {
        localWaypoints.push({ x: leftX, y });
        localWaypoints.push({ x: rightX, y });
      } else {
        localWaypoints.push({ x: rightX, y });
        localWaypoints.push({ x: leftX, y });
      }
    }
    sweepDirectionForward = !sweepDirectionForward;
  }

  // Filter or verify points are inside polygon (with small tolerance)
  const waypoints: Waypoint[] = localWaypoints.map((pt, idx) => {
    const latLng = fromLocalMeters(pt, origin);
    return {
      id: `WP-${(idx + 1).toString().padStart(2, '0')}`,
      index: idx,
      lat: latLng.lat,
      lng: latLng.lng,
      altitudeAglM,
    };
  });

  // Ensure loop closure: the final segment returns to the EXACT start coordinate
  if (closeLoop && waypoints.length > 0) {
    const startPoint = waypoints[0];
    waypoints.push({
      id: `WP-${(waypoints.length + 1).toString().padStart(2, '0')}`,
      index: waypoints.length,
      lat: startPoint.lat,
      lng: startPoint.lng,
      altitudeAglM,
    });
  }

  const totalDistanceMeters = calculateTotalRouteDistance(waypoints);
  return { waypoints, totalDistanceMeters };
}

export function calculateTotalRouteDistance(waypoints: Waypoint[] | LatLng[]): number {
  if (waypoints.length < 2) return 0;
  let totalDist = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    totalDist += calculateDistanceMeters(waypoints[i], waypoints[i + 1]);
  }
  return totalDist;
}
