from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from .gee import LatLngModel

class ValidateCsvResponse(BaseModel):
    is_valid: bool
    total_rows: int
    valid_rows: int
    dropped_rows: int
    errors: List[str]
    warnings: List[str]
    detected_origin: str

class ProspectivityGridCellModel(BaseModel):
    lat: float
    lng: float
    magnetic_anomaly_nt: float
    spectral_proxy: Optional[float] = None
    composite_index: float
    nearest_sample_dist_m: float
    neighbor_count: int

class CandidateHotspotModel(BaseModel):
    id: str
    rank: int
    lat: float
    lng: float
    magnetic_anomaly_nt: float
    composite_index: float
    nearest_sample_dist_m: float

class ProspectivityAnalysisRequest(BaseModel):
    flight_id: str
    mission_name: str
    samples: List[Dict[str, Any]]
    aoi_boundary: List[LatLngModel]
    weight_mag: float = 0.70
    weight_spectral: float = 0.30
    grid_resolution_m: float = 25.0
    search_radius_m: float = 150.0

class ProspectivityAnalysisResponse(BaseModel):
    flight_id: str
    processed_at: str
    cells: List[ProspectivityGridCellModel]
    hotspots: List[CandidateHotspotModel]
    stats: Dict[str, float]
    disclaimer: str
