from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional

from backend.models.schemas import (
    Incident,
    IncidentIntakeRequest,
    IncidentResolutionRequest,
    IncidentFailureRequest,
    IncidentAnalysisResponse,
)
from backend.services.incident_service import IncidentService
from backend.services.hindsight.client import HindsightMemoryService
from backend.services.llm.provider import LLMProviderService
from backend.agents.incident_agent import IncidentAnalysisAgent

router = APIRouter(prefix="/api/incidents", tags=["Incidents"])

# Singletons initialized in main and injected or accessed
_incident_service = IncidentService()
_hindsight_service = HindsightMemoryService()
_llm_service = LLMProviderService()
_agent = IncidentAnalysisAgent(_hindsight_service, _llm_service)

def get_services():
    return _incident_service, _hindsight_service, _agent

@router.get("", response_model=List[Incident])
def list_incidents(
    service: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    environment: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
):
    inc_svc, _, _ = get_services()
    return inc_svc.list_incidents(
        service=service,
        severity=severity,
        environment=environment,
        status=status,
        search=search,
    )

@router.post("", response_model=Incident)
def create_incident(req: IncidentIntakeRequest):
    inc_svc, _, _ = get_services()
    return inc_svc.create_incident(req)

@router.get("/{incident_id}", response_model=Incident)
def get_incident(incident_id: str):
    inc_svc, _, _ = get_services()
    inc = inc_svc.get_incident(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    return inc

@router.get("/{incident_id}/analysis", response_model=IncidentAnalysisResponse)
def analyze_incident(
    incident_id: str,
    force_no_memory: bool = Query(False, description="Simulate agent without memory"),
):
    inc_svc, _, agent = get_services()
    inc = inc_svc.get_incident(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    return agent.analyze_incident(inc, force_no_memory=force_no_memory)

@router.post("/{incident_id}/resolve", response_model=Incident)
def resolve_incident(incident_id: str, req: IncidentResolutionRequest):
    inc_svc, hindsight, _ = get_services()
    inc = inc_svc.resolve_incident(incident_id, req, hindsight)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    return inc

@router.post("/{incident_id}/fail", response_model=Incident)
def record_failure(incident_id: str, req: IncidentFailureRequest):
    inc_svc, hindsight, _ = get_services()
    inc = inc_svc.record_failed_attempt(incident_id, req, hindsight)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    return inc
