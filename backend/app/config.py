from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "ANVESHAA Airborne Survey API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Google Earth Engine configuration
    GEE_ENABLED: bool = False
    GEE_PROJECT_ID: str = ""
    GEE_AUTH_MODE: str = "adc"  # "adc" | "service_account" | "none"
    GEE_SERVICE_ACCOUNT_EMAIL: str = ""
    GEE_SERVICE_ACCOUNT_KEY_FILE: str = ""
    GEE_DEFAULT_DATASET: str = "COPERNICUS/S2_SR_HARMONIZED"
    GEE_DEM_DATASET: str = "USGS/SRTMGL1_003"

    # CORS configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

settings = Settings()
