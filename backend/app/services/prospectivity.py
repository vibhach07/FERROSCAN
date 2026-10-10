import math
import numpy as np
from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple
from ..schemas.processing import (
    ProspectivityAnalysisRequest,
    ProspectivityAnalysisResponse,
    ProspectivityGridCellModel,
    CandidateHotspotModel,
)

EARTH_RADIUS_M = 6371000.0

def haversine_dist(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (
        math.sin(dlat / 2.0) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2.0) ** 2
    )
    return EARTH_RADIUS_M * 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

def to_local_m(lat: float, lng: float, origin_lat: float, origin_lng: float) -> Tuple[float, float]:
    lat_rad = math.radians(origin_lat)
    x = math.radians(lng - origin_lng) * EARTH_RADIUS_M * math.cos(lat_rad)
    y = math.radians(lat - origin_lat) * EARTH_RADIUS_M
    return x, y

def from_local_m(x: float, y: float, origin_lat: float, origin_lng: float) -> Tuple[float, float]:
    lat_rad = math.radians(origin_lat)
    dlat = y / EARTH_RADIUS_M
    dlng = x / (EARTH_RADIUS_M * math.cos(lat_rad))
    return origin_lat + math.degrees(dlat), origin_lng + math.degrees(dlng)

class BackendProspectivityService:
    @staticmethod
    def analyze(req: ProspectivityAnalysisRequest) -> ProspectivityAnalysisResponse:
        if not req.samples:
            raise ValueError("No sample rows provided for analysis.")

        origin_lat = req.aoi_boundary[0].lat if req.aoi_boundary else req.samples[0]["latitude"]
        origin_lng = req.aoi_boundary[0].lng if req.aoi_boundary else req.samples[0]["longitude"]

        # Parse local coords and values
        local_samples = []
        for s in req.samples:
            lat = float(s.get("latitude", 0))
            lng = float(s.get("longitude", 0))
            anom = float(s.get("magnetic_anomaly_nt", 0))
            spectral = s.get("ferric_iron_proxy")
            if spectral is not None:
                try:
                    spectral = float(spectral)
                except (ValueError, TypeError):
                    spectral = None

            lx, ly = to_local_m(lat, lng, origin_lat, origin_lng)
            local_samples.append({
                "x": lx,
                "y": ly,
                "lat": lat,
                "lng": lng,
                "anomaly": anom,
                "spectral": spectral,
            })

        xs = [s["x"] for s in local_samples]
        ys = [s["y"] for s in local_samples]
        min_x, max_x = min(xs) - 20, max(xs) + 20
        min_y, max_y = min(ys) - 20, max(ys) + 20

        res = req.grid_resolution_m
        p = 2.0
        max_dist = req.search_radius_m
        max_dist_sq = max_dist * max_dist

        cells: List[ProspectivityGridCellModel] = []
        raw_anomalies: List[float] = []

        # Grid evaluation
        y_curr = min_y
        while y_curr <= max_y:
            x_curr = min_x
            while x_curr <= max_x:
                weight_sum = 0.0
                val_sum = 0.0
                spectral_val_sum = 0.0
                spectral_w_sum = 0.0
                nearest_dist_sq = float("inf")
                neighbor_count = 0
                exact_match = None

                for s in local_samples:
                    dx = x_curr - s["x"]
                    dy = y_curr - s["y"]
                    d2 = dx * dx + dy * dy
                    if d2 < nearest_dist_sq:
                        nearest_dist_sq = d2

                    if d2 < 1e-4:
                        exact_match = s
                        break

                    if d2 <= max_dist_sq:
                        w = 1.0 / (d2 ** (p / 2.0))
                        weight_sum += w
                        val_sum += w * s["anomaly"]
                        neighbor_count += 1
                        if s["spectral"] is not None:
                            spectral_val_sum += w * s["spectral"]
                            spectral_w_sum += w

                nearest_dist_m = math.sqrt(nearest_dist_sq)

                if nearest_dist_m <= 100 and (weight_sum > 0 or exact_match):
                    if exact_match:
                        interp_anom = exact_match["anomaly"]
                        interp_spec = exact_match["spectral"]
                        neighbor_count = 1
                    else:
                        interp_anom = val_sum / weight_sum
                        interp_spec = (
                            spectral_val_sum / spectral_w_sum if spectral_w_sum > 0 else None
                        )

                    c_lat, c_lng = from_local_m(x_curr, y_curr, origin_lat, origin_lng)
                    cells.append(
                        ProspectivityGridCellModel(
                            lat=round(c_lat, 6),
                            lng=round(c_lng, 6),
                            magnetic_anomaly_nt=round(interp_anom, 2),
                            spectral_proxy=round(interp_spec, 2) if interp_spec is not None else None,
                            composite_index=0.0,
                            nearest_sample_dist_m=round(nearest_dist_m, 1),
                            neighbor_count=neighbor_count,
                        )
                    )
                    raw_anomalies.append(interp_anom)

                x_curr += res
            y_curr += res

        # Robust Percentile Scaling
        if raw_anomalies:
            p2 = float(np.percentile(raw_anomalies, 2))
            p98 = float(np.percentile(raw_anomalies, 98))
            anom_range = max(1e-3, p98 - p2)

            for cell in cells:
                norm_mag = max(0.0, min(100.0, ((cell.magnetic_anomaly_nt - p2) / anom_range) * 100.0))

                if cell.spectral_proxy is not None:
                    norm_spec = max(0.0, min(100.0, (cell.spectral_proxy / 2.0) * 100.0))
                    comp = req.weight_mag * norm_mag + req.weight_spectral * norm_spec
                else:
                    comp = norm_mag

                cell.composite_index = round(comp, 1)

        # Candidate Hotspots Extraction
        sorted_cells = sorted(cells, key=lambda c: c.composite_index, reverse=True)
        hotspots: List[CandidateHotspotModel] = []

        for c in sorted_cells:
            if len(hotspots) >= 5:
                break
            if all(haversine_dist(c.lat, c.lng, h.lat, h.lng) > 40.0 for h in hotspots):
                hotspots.append(
                    CandidateHotspotModel(
                        id=f"HOTSPOT-{len(hotspots) + 1:02d}",
                        rank=len(hotspots) + 1,
                        lat=c.lat,
                        lng=c.lng,
                        magnetic_anomaly_nt=c.magnetic_anomaly_nt,
                        composite_index=c.composite_index,
                        nearest_sample_dist_m=c.nearest_sample_dist_m,
                    )
                )

        min_a = min(raw_anomalies) if raw_anomalies else 0.0
        max_a = max(raw_anomalies) if raw_anomalies else 0.0
        mean_a = float(np.mean(raw_anomalies)) if raw_anomalies else 0.0
        max_c = max((c.composite_index for c in cells), default=0.0)

        return ProspectivityAnalysisResponse(
            flight_id=req.flight_id,
            processed_at=datetime.now(timezone.utc).isoformat(),
            cells=cells,
            hotspots=hotspots,
            stats={
                "min_anomaly_nt": round(min_a, 1),
                "max_anomaly_nt": round(max_a, 1),
                "mean_anomaly_nt": round(mean_a, 1),
                "max_composite_index": round(max_c, 1),
                "cell_count": len(cells),
                "sample_count": len(req.samples),
            },
            disclaimer=(
                "Prototype limitation: Magnetometer values are synthetic. "
                "The composite index is exploratory and unvalidated, not a confirmed ore body."
            ),
        )
