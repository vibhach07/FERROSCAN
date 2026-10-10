import logging
import os
import json
from pathlib import Path
from typing import Dict, Any, List, Optional
from ..config import settings
from ..schemas.gee import LatLngModel, GeeLayerMetadata

logger = logging.getLogger(__name__)

class EarthEngineService:
    def __init__(self):
        self.initialized = False
        self.init_error_message = ""
        self._try_initialize()

    def _try_initialize(self):
        try:
            import ee

            # Check for service account file candidates
            sa_candidates = [
                settings.GEE_SERVICE_ACCOUNT_KEY_FILE,
                "service-account.json",
                os.path.join(os.path.dirname(__file__), "..", "..", "service-account.json"),
                os.path.join(os.path.dirname(__file__), "..", "..", "..", "service-account.json"),
            ]

            sa_path = None
            for p in sa_candidates:
                if p and os.path.exists(p):
                    sa_path = os.path.abspath(p)
                    break

            # If service account file is found
            if sa_path:
                with open(sa_path, "r") as f:
                    sa_data = json.load(f)

                priv_key = sa_data.get("private_key", "")
                if "REPLACE_WITH_YOUR_GCP_PRIVATE_KEY" in priv_key or "..." in priv_key:
                    self.initialized = False
                    self.init_error_message = (
                        "The service-account.json file contains placeholder text ('...REPLACE_WITH_YOUR_GCP_PRIVATE_KEY...'). "
                        "Please replace it with your complete GCP RSA private key."
                    )
                    return

                client_email = sa_data.get("client_email", settings.GEE_SERVICE_ACCOUNT_EMAIL)
                project_id = sa_data.get("project_id", settings.GEE_PROJECT_ID)

                credentials = ee.ServiceAccountCredentials(
                    email=client_email,
                    key_file=sa_path,
                )
                ee.Initialize(credentials, project=project_id)
                self.initialized = True
                settings.GEE_PROJECT_ID = project_id
                settings.GEE_AUTH_MODE = "service_account"
                logger.info(f"Earth Engine initialized via Service Account ({client_email}) for project {project_id}.")
                return

            # If no service account, check if project is configured for ADC
            if not settings.GEE_ENABLED and not settings.GEE_PROJECT_ID:
                self.initialized = False
                self.init_error_message = (
                    "GEE_ENABLED is False or GEE_PROJECT_ID not set. "
                    "Running in local geophysical simulation mode."
                )
                return

            # ADC mode
            if settings.GEE_PROJECT_ID:
                ee.Initialize(project=settings.GEE_PROJECT_ID)
            else:
                ee.Initialize()

            self.initialized = True
            logger.info("Google Earth Engine initialized successfully via ADC.")
        except Exception as e:
            self.initialized = False
            self.init_error_message = str(e)
            logger.warning(f"Google Earth Engine not initialized: {e}")

    def get_status(self) -> Dict[str, Any]:
        if not self.initialized:
            # Re-attempt initialization in case user just added key file or credentials
            self._try_initialize()

        return {
            "initialized": self.initialized,
            "project_id": settings.GEE_PROJECT_ID if self.initialized else None,
            "auth_mode": settings.GEE_AUTH_MODE,
            "message": (
                "Google Earth Engine is live and connected."
                if self.initialized
                else f"GEE offline ({self.init_error_message}). Using local simulation mode."
            ),
            "catalog_available": self.initialized,
        }

    def get_layers(
        self,
        aoi_boundary: List[LatLngModel],
        date_start: str = "2024-01-01",
        date_end: str = "2024-12-31",
        cloud_cover_max: float = 20.0,
    ) -> List[GeeLayerMetadata]:
        if not self.initialized:
            self._try_initialize()

        if not self.initialized:
            # Return documented fallback message
            return [
                GeeLayerMetadata(
                    name="Sentinel-2 L2A Natural Color (GEE Offline)",
                    description="Live Earth Engine optical tiles unavailable without Google Cloud credentials.",
                    dataset_id=settings.GEE_DEFAULT_DATASET,
                    tile_url_template="",
                    acquisition_date_range=f"{date_start} to {date_end}",
                    cloud_threshold_pct=cloud_cover_max,
                    pixel_scale_m=10.0,
                    is_live_gee=False,
                    caveat="Requires configured GEE Cloud Project. Basemap fallback active.",
                )
            ]

        import ee

        coords = [[p.lng, p.lat] for p in aoi_boundary] if aoi_boundary else []
        if len(coords) == 1:
            lng, lat = coords[0]
            coords = [
                [lng - 0.005, lat - 0.005],
                [lng + 0.005, lat - 0.005],
                [lng + 0.005, lat + 0.005],
                [lng - 0.005, lat + 0.005],
                [lng - 0.005, lat - 0.005],
            ]
        elif len(coords) == 2:
            min_lng = min(coords[0][0], coords[1][0]) - 0.003
            max_lng = max(coords[0][0], coords[1][0]) + 0.003
            min_lat = min(coords[0][1], coords[1][1]) - 0.003
            max_lat = max(coords[0][1], coords[1][1]) + 0.003
            coords = [
                [min_lng, min_lat],
                [max_lng, min_lat],
                [max_lng, max_lat],
                [min_lng, max_lat],
                [min_lng, min_lat],
            ]
        elif len(coords) < 3:
            # Fallback to Bailadila Deposit 14 mining bounds if no valid polygon provided
            coords = [
                [81.220, 18.600],
                [81.236, 18.600],
                [81.236, 18.616],
                [81.220, 18.616],
                [81.220, 18.600],
            ]
        elif coords[0] != coords[-1]:
            coords.append(coords[0])

        aoi = ee.Geometry.Polygon(coords)

        # 1. Sentinel-2 L2A SR collection
        s2 = (
            ee.ImageCollection(settings.GEE_DEFAULT_DATASET)
            .filterBounds(aoi)
            .filterDate(date_start, date_end)
            .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", cloud_cover_max))
        )

        composite = s2.median().clip(aoi)

        layers: List[GeeLayerMetadata] = []

        try:
            # A. True Color RGB (B4, B3, B2)
            rgb_vis = {"bands": ["B4", "B3", "B2"], "min": 0, "max": 3000}
            rgb_map = composite.getMapId(rgb_vis)
            layers.append(
                GeeLayerMetadata(
                    name="Sentinel-2 L2A True-Color (B4/B3/B2)",
                    description="Real surface reflectance composite from Google Earth Engine clipped to survey area.",
                    dataset_id=settings.GEE_DEFAULT_DATASET,
                    tile_url_template=rgb_map["tile_fetcher"].url_format,
                    acquisition_date_range=f"{date_start} to {date_end}",
                    cloud_threshold_pct=cloud_cover_max,
                    pixel_scale_m=10.0,
                    is_live_gee=True,
                    caveat="Real Copernicus Sentinel-2 Level-2A surface reflectance.",
                )
            )

            # B. False Color Infrared (B8, B4, B3)
            fc_vis = {"bands": ["B8", "B4", "B3"], "min": 0, "max": 4000}
            fc_map = composite.getMapId(fc_vis)
            layers.append(
                GeeLayerMetadata(
                    name="Sentinel-2 False-Color NIR (B8/B4/B3)",
                    description="Vegetation and terrain contrast composite (NIR, Red, Green).",
                    dataset_id=settings.GEE_DEFAULT_DATASET,
                    tile_url_template=fc_map["tile_fetcher"].url_format,
                    acquisition_date_range=f"{date_start} to {date_end}",
                    cloud_threshold_pct=cloud_cover_max,
                    pixel_scale_m=10.0,
                    is_live_gee=True,
                    caveat="Vegetation in red/orange; exposed rocks and iron pits in darker contrast.",
                )
            )

            # C. Normalized Difference Vegetation Index (NDVI) (B8 - B4) / (B8 + B4)
            ndvi = composite.normalizedDifference(["B8", "B4"]).rename("ndvi")
            ndvi_vis = {
                "min": -0.1,
                "max": 0.85,
                "palette": ["#0000ff", "#ffffff", "#8ce68c", "#00aa00", "#004d00"],
            }
            ndvi_map = ndvi.getMapId(ndvi_vis)
            layers.append(
                GeeLayerMetadata(
                    name="NDVI Vegetation Index ((B8-B4)/(B8+B4))",
                    description="Normalized difference vegetation index isolating bare mineral pits vs canopy.",
                    dataset_id=settings.GEE_DEFAULT_DATASET,
                    tile_url_template=ndvi_map["tile_fetcher"].url_format,
                    acquisition_date_range=f"{date_start} to {date_end}",
                    cloud_threshold_pct=cloud_cover_max,
                    pixel_scale_m=10.0,
                    is_live_gee=True,
                    caveat="Low NDVI (<0.2) indicates bare mineral benches and ore pits; high NDVI indicates forest.",
                )
            )

            # D. Experimental Ferric-Iron Surface Proxy (B4/B2)
            ferric_proxy = (
                composite.select("B4")
                .divide(composite.select("B2").add(0.0001))
                .rename("ferric_proxy")
            )
            proxy_vis = {"min": 0.8, "max": 2.2, "palette": ["blue", "yellow", "red"]}
            proxy_map = ferric_proxy.getMapId(proxy_vis)
            layers.append(
                GeeLayerMetadata(
                    name="Ferric-Iron Surface Proxy (B4/B2)",
                    description="Experimental surface spectral reflectance contrast ratio (Red / Blue).",
                    dataset_id=settings.GEE_DEFAULT_DATASET,
                    tile_url_template=proxy_map["tile_fetcher"].url_format,
                    acquisition_date_range=f"{date_start} to {date_end}",
                    cloud_threshold_pct=cloud_cover_max,
                    pixel_scale_m=10.0,
                    is_live_gee=True,
                    caveat="Experimental surface indicator only. Not a measurement of buried iron ore.",
                )
            )

            # E. Ferrous Iron Mineral Index (B12 / B8)
            ferrous = (
                composite.select("B12")
                .divide(composite.select("B8").add(0.0001))
                .rename("ferrous_iron")
            )
            ferrous_vis = {"min": 0.6, "max": 2.4, "palette": ["#000088", "#00b4d8", "#ffee32", "#ff3b30"]}
            ferrous_map = ferrous.getMapId(ferrous_vis)
            layers.append(
                GeeLayerMetadata(
                    name="Ferrous Iron Mineral Index (B12/B8)",
                    description="SWIR2 to NIR ratio highlighting ferrous minerals and banded iron formation.",
                    dataset_id=settings.GEE_DEFAULT_DATASET,
                    tile_url_template=ferrous_map["tile_fetcher"].url_format,
                    acquisition_date_range=f"{date_start} to {date_end}",
                    cloud_threshold_pct=cloud_cover_max,
                    pixel_scale_m=20.0,
                    is_live_gee=True,
                    caveat="SWIR2/NIR spectral alteration proxy for iron mineral grouping.",
                )
            )

            # F. SRTM 30m DEM Elevation & Slope
            dem = ee.Image(settings.GEE_DEM_DATASET).clip(aoi)
            dem_vis = {"bands": ["elevation"], "min": 500, "max": 1200, "palette": ["green", "yellow", "brown"]}
            dem_map = dem.getMapId(dem_vis)
            layers.append(
                GeeLayerMetadata(
                    name="SRTM 30m DEM Elevation",
                    description="Shuttle Radar Topography Mission digital elevation model.",
                    dataset_id=settings.GEE_DEM_DATASET,
                    tile_url_template=dem_map["tile_fetcher"].url_format,
                    acquisition_date_range="Global SRTM 1-ArcSecond",
                    cloud_threshold_pct=0,
                    pixel_scale_m=30.0,
                    is_live_gee=True,
                    caveat="Terrain elevation MSL context.",
                )
            )

        except Exception as e:
            logger.error(f"Error building GEE layers: {e}")

        return layers

earth_engine_service = EarthEngineService()
