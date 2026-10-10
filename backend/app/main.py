import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .api.health import router as health_router
from .api.gee import router as gee_router
from .api.processing import router as processing_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("anveshaa")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Backend API for ANVESHAA Airborne Iron-Ore Prospecting Simulator with Google Earth Engine integration.",
)

# Configure CORS restricted to frontend development and deployment origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(health_router, prefix="/api")
app.include_router(gee_router, prefix="/api")
app.include_router(processing_router, prefix="/api")

@app.get("/")
def root():
    return {
        "message": "ANVESHAA Airborne Survey Flight API is running.",
        "docs": "/docs",
        "health": "/api/health",
    }
