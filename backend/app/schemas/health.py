from pydantic import BaseModel
from typing import List

class HealthResponse(BaseModel):
    status: str
    version: str
    gee_connected: bool
    gee_auth_mode: str
    simulation_available: bool

class ConfigResponse(BaseModel):
    app_name: str
    version: str
    gee_enabled: bool
    gee_connected: bool
    gee_default_dataset: str
    dem_dataset: str
    supported_layers: List[str]
    disclaimer: str
