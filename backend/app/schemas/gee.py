from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class LatLngModel(BaseModel):
    lat: float
    lng: float

class GeeStatusResponse(BaseModel):
    initialized: bool
    project_id: Optional[str] = None
    auth_mode: str
    message: str
    catalog_available: bool

class GeeLayerMetadata(BaseModel):
    name: str
    description: str
    dataset_id: str
    tile_url_template: str
    acquisition_date_range: str
    cloud_threshold_pct: float
    pixel_scale_m: float
    is_live_gee: bool
    caveat: str

class GeeLayerRequest(BaseModel):
    aoi_boundary: List[LatLngModel]
    date_start: str = Field(default="2024-01-01", description="Start date YYYY-MM-DD")
    date_end: str = Field(default="2024-12-31", description="End date YYYY-MM-DD")
    cloud_cover_max: float = Field(default=20.0, description="Max cloud cover percentage")
    include_optical_rgb: bool = True
    include_false_color: bool = True
    include_spectral_proxy: bool = True
    include_dem_elevation: bool = True

class GeeLayerResponse(BaseModel):
    status: str
    gee_live: bool
    layers: List[GeeLayerMetadata]
    message: str

class GeeSamplePoint(BaseModel):
    lat: float
    lng: float
    ferric_iron_proxy: Optional[float] = None
    elevation_msl_m: Optional[float] = None

class GeeSampleRequest(BaseModel):
    coordinates: List[LatLngModel]
    date_start: str = "2024-01-01"
    date_end: str = "2024-12-31"

class GeeSampleResponse(BaseModel):
    gee_live: bool
    samples: List[GeeSamplePoint]
    provenance: str
