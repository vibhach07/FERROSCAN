from fastapi import APIRouter, HTTPException
from ..schemas.processing import (
    ValidateCsvResponse,
    ProspectivityAnalysisRequest,
    ProspectivityAnalysisResponse,
)
from ..services.prospectivity import BackendProspectivityService

router = APIRouter(prefix="/process", tags=["Processing"])

@router.post("/prospectivity", response_model=ProspectivityAnalysisResponse)
def analyze_prospectivity(req: ProspectivityAnalysisRequest):
    try:
        return BackendProspectivityService.analyze(req)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
