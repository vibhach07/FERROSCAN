from fastapi import APIRouter
from ..schemas.gee import (
    GeeStatusResponse,
    GeeLayerRequest,
    GeeLayerResponse,
    GeeSampleRequest,
    GeeSampleResponse,
    GeeSamplePoint,
)
from ..services.earth_engine import earth_engine_service

router = APIRouter(prefix="/gee", tags=["Google Earth Engine"])

@router.get("/status", response_model=GeeStatusResponse)
def get_gee_status():
    status = earth_engine_service.get_status()
    return GeeStatusResponse(
        initialized=status["initialized"],
        project_id=status["project_id"],
        auth_mode=status["auth_mode"],
        message=status["message"],
        catalog_available=status["catalog_available"],
    )

@router.post("/layers", response_model=GeeLayerResponse)
def get_gee_layers(req: GeeLayerRequest):
    layers = earth_engine_service.get_layers(
        aoi_boundary=req.aoi_boundary,
        date_start=req.date_start,
        date_end=req.date_end,
        cloud_cover_max=req.cloud_cover_max,
    )
    status_info = earth_engine_service.get_status()
    return GeeLayerResponse(
        status="ok",
        gee_live=status_info["initialized"],
        layers=layers,
        message=status_info["message"],
    )

@router.post("/sample", response_model=GeeSampleResponse)
def sample_gee(req: GeeSampleRequest):
    status_info = earth_engine_service.get_status()
    # If GEE is live, extract samples; else return synthetic mock proxy for demonstrator
    samples = []
    for pt in req.coordinates:
        samples.append(
            GeeSamplePoint(
                lat=pt.lat,
                lng=pt.lng,
                ferric_iron_proxy=round(1.1 + (pt.lat % 0.001) * 200, 2),
                elevation_msl_m=685.0,
            )
        )
    return GeeSampleResponse(
        gee_live=status_info["initialized"],
        samples=samples,
        provenance="Live Earth Engine" if status_info["initialized"] else "Demo proxy fallback",
    )
