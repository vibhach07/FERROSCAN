from fastapi import APIRouter
from ..config import settings
from ..schemas.health import HealthResponse, ConfigResponse
from ..services.earth_engine import earth_engine_service

router = APIRouter(tags=["Health & Config"])

@router.get("/health", response_model=HealthResponse)
def get_health():
    status = earth_engine_service.get_status()
    return HealthResponse(
        status="healthy",
        version=settings.APP_VERSION,
        gee_connected=status["initialized"],
        gee_auth_mode=status["auth_mode"],
        simulation_available=True,
    )

@router.get("/config", response_model=ConfigResponse)
def get_config():
    status = earth_engine_service.get_status()
    return ConfigResponse(
        app_name=settings.APP_NAME,
        version=settings.APP_VERSION,
        gee_enabled=settings.GEE_ENABLED,
        gee_connected=status["initialized"],
        gee_default_dataset=settings.GEE_DEFAULT_DATASET,
        dem_dataset=settings.GEE_DEM_DATASET,
        supported_layers=[
            "Sentinel-2 L2A Natural Color",
            "Sentinel-2 False Color NIR",
            "Ferric-Iron Surface Proxy (B4/B2)",
            "SRTM 30m Elevation & Slope",
        ],
        disclaimer=(
            "Prototype limitation: Built-in magnetometer values are synthetic. "
            "Earth Engine layers are real surface/terrain datasets, but the prospectivity index is exploratory and unvalidated."
        ),
    )
