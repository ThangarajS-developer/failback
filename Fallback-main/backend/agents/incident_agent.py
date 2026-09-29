import logging
from typing import Dict, Any, List, Optional

from backend.models.schemas import (
    Incident,
    IncidentAnalysisResponse,
    Recommendation,
)
from backend.services.hindsight.client import HindsightMemoryService
from backend.services.llm.provider import LLMProviderService

logger = logging.getLogger("failback.agent")

class IncidentAnalysisAgent:
    def __init__(
        self,
        hindsight_service: HindsightMemoryService,
        llm_service: LLMProviderService,
    ):
        self.hindsight = hindsight_service
        self.llm = llm_service

    def analyze_incident(self, incident: Incident, force_no_memory: bool = False) -> IncidentAnalysisResponse:
        """
        Executes the failure-aware incident analysis pipeline:
        1. Recalls relevant historical experience from Hindsight.
        2. Identifies matching failure patterns, what failed, and what worked.
        3. Synthesizes an explainable recommendation.
        4. Constructs visual timeline and observability metadata.
        """
        if force_no_memory:
            recommendation = self.llm.generate_generic_recommendation(incident)
            stats = {
                "relevant_incidents_found": 0,
                "failure_patterns_identified": 0,
                "successful_resolutions_found": 0,
                "failed_approaches_found": 0,
                "is_memory_backed": False,
                "status": "No historical memory utilized (generic baseline mode)",
            }
        else:
            # Query Hindsight memory bank using combined error, symptoms, and service terms
            query = f"{incident.service} {incident.error_message} {incident.symptoms} {incident.logs[:150]}"
            recall_res = self.hindsight.recall(query=query, limit=5)

            # Filter out current incident if it was already stored
            filtered_results = [r for r in recall_res.results if r.metadata.get("incident_id") != incident.id]
            recall_res.results = filtered_results

            if not recall_res.results:
                recommendation = self.llm.generate_generic_recommendation(incident)
                stats = {
                    "relevant_incidents_found": 0,
                    "failure_patterns_identified": 0,
                    "successful_resolutions_found": 0,
                    "failed_approaches_found": 0,
                    "is_memory_backed": False,
                    "status": "No historical matches found in Hindsight bank.",
                }
            else:
                recommendation = self.llm.generate_memory_backed_recommendation(incident, recall_res)
                stats = {
                    "relevant_incidents_found": len(recommendation.similar_incidents),
                    "failure_patterns_identified": len(recommendation.what_failed_before),
                    "successful_resolutions_found": len(recommendation.what_worked_before),
                    "failed_approaches_found": sum(f.failure_count for f in recommendation.what_failed_before),
                    "is_memory_backed": True,
                    "strategy": recall_res.trace.get("strategy", "TEMPR"),
                    "backend": recall_res.trace.get("backend", "embedded_hindsight"),
                    "status": "Successfully recalled historical experience from Hindsight",
                }

        # Build visual timeline
        timeline_events = []
        timeline_events.append({
            "timestamp": incident.timestamp,
            "title": "Incident Detected",
            "type": "DETECTION",
            "status": "CRITICAL" if incident.severity == "CRITICAL" else "WARNING",
            "description": f"Triggered on {incident.service} - {incident.error_message}",
        })

        for att in incident.attempts:
            timeline_events.append({
                "timestamp": att.timestamp,
                "title": f"Attempt: {att.action}",
                "type": "ATTEMPT",
                "status": att.status,
                "hypothesis": att.hypothesis,
                "description": att.failure_reason if att.status == "FAILED" else att.observed_result,
                "engineer_notes": att.engineer_notes,
            })

        if incident.status == "RESOLVED":
            timeline_events.append({
                "timestamp": incident.attempts[-1].timestamp if incident.attempts else incident.timestamp,
                "title": "Root Cause Confirmed & Resolved",
                "type": "RESOLUTION",
                "status": "SUCCESS",
                "description": incident.root_cause or "Resolution validated.",
                "fix": incident.successful_fix,
            })

        return IncidentAnalysisResponse(
            incident_id=incident.id,
            recommendation=recommendation,
            timeline=timeline_events,
            memory_retrieval_stats=stats,
        )
