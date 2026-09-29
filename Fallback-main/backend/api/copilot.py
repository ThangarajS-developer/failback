from fastapi import APIRouter
from typing import Dict, Any

from backend.api.incidents import _hindsight_service, _incident_service, _llm_service
from backend.models.schemas import CopilotQueryRequest, CopilotQueryResponse

router = APIRouter(prefix="/api/copilot", tags=["Incident Copilot"])

@router.post("/query", response_model=CopilotQueryResponse)
def query_copilot(req: CopilotQueryRequest):
    incident = None
    if req.incident_id:
        incident = _incident_service.get_incident(req.incident_id)

    # Build recall query from copilot input + incident context
    query_text = req.query
    if incident:
        query_text = f"{req.query} {incident.service} {incident.error_message}"

    recall_res = _hindsight_service.recall(query=query_text, limit=5)

    ans_dict = _llm_service.answer_copilot(
        query=req.query,
        incident=incident,
        recall_res=recall_res,
    )

    return CopilotQueryResponse(
        answer=ans_dict["answer"],
        has_historical_evidence=ans_dict["has_historical_evidence"],
        sources=ans_dict["sources"],
        suggested_questions=ans_dict.get("suggested_questions", []),
    )
