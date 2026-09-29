import json
import logging
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime

from backend.models.schemas import (
    Incident,
    TroubleshootingAttempt,
    IncidentIntakeRequest,
    IncidentResolutionRequest,
    IncidentFailureRequest,
)
from backend.services.hindsight.client import HindsightMemoryService

logger = logging.getLogger("failback.incidents")

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
INCIDENTS_STORE_FILE = DATA_DIR / "incidents_store.json"
SYNTHETIC_FILE = DATA_DIR / "synthetic_incidents.json"

class IncidentService:
    def __init__(self):
        self._incidents: List[Incident] = []
        self._load_store()

    def _load_store(self):
        if INCIDENTS_STORE_FILE.exists():
            try:
                with open(INCIDENTS_STORE_FILE, "r", encoding="utf-8") as f:
                    raw_data = json.load(f)
                    self._incidents = [Incident(**item) for item in raw_data]
            except Exception as e:
                logger.error(f"Error loading incidents store: {e}. Falling back to synthetic.")
                self._load_synthetic()
        else:
            self._load_synthetic()

    def _load_synthetic(self):
        if SYNTHETIC_FILE.exists():
            try:
                with open(SYNTHETIC_FILE, "r", encoding="utf-8") as f:
                    raw_data = json.load(f)
                    self._incidents = [Incident(**item) for item in raw_data]
                    self._save_store()
            except Exception as e:
                logger.error(f"Error loading synthetic incidents: {e}")
                self._incidents = []
        else:
            self._incidents = []

    def _save_store(self):
        try:
            with open(INCIDENTS_STORE_FILE, "w", encoding="utf-8") as f:
                json.dump([inc.model_dump() for inc in self._incidents], f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Error saving incidents store: {e}")

    def list_incidents(
        self,
        service: Optional[str] = None,
        severity: Optional[str] = None,
        environment: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[Incident]:
        results = self._incidents

        if service:
            results = [i for i in results if i.service.lower() == service.lower()]
        if severity:
            results = [i for i in results if i.severity.upper() == severity.upper()]
        if environment:
            results = [i for i in results if i.environment.lower() == environment.lower()]
        if status:
            results = [i for i in results if i.status.upper() == status.upper()]
        if search:
            q = search.lower()
            results = [
                i for i in results
                if q in i.title.lower()
                or q in i.error_message.lower()
                or q in i.service.lower()
                or q in i.symptoms.lower()
                or (i.root_cause and q in i.root_cause.lower())
            ]

        # Sort newest first
        return sorted(results, key=lambda x: x.timestamp, reverse=True)

    def get_incident(self, incident_id: str) -> Optional[Incident]:
        return next((i for i in self._incidents if i.id == incident_id), None)

    def create_incident(self, req: IncidentIntakeRequest) -> Incident:
        # Determine next ID
        existing_numbers = []
        for inc in self._incidents:
            if inc.id.startswith("INC-"):
                try:
                    num = int(inc.id.split("-")[1])
                    existing_numbers.append(num)
                except ValueError:
                    pass
        next_num = max(existing_numbers, default=300) + 1
        new_id = f"INC-{next_num:03d}"

        new_incident = Incident(
            id=new_id,
            title=req.title,
            service=req.service,
            severity=req.severity,
            environment=req.environment,
            timestamp=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
            error_message=req.error_message,
            symptoms=req.symptoms,
            logs=req.logs,
            version=req.version,
            infrastructure_details=req.infrastructure_details,
            additional_context=req.additional_context,
            status="OPEN",
            attempts=[],
            is_synthetic=False,
        )

        self._incidents.insert(0, new_incident)
        self._save_store()
        return new_incident

    def resolve_incident(
        self,
        incident_id: str,
        res_req: IncidentResolutionRequest,
        hindsight: HindsightMemoryService,
    ) -> Optional[Incident]:
        incident = self.get_incident(incident_id)
        if not incident:
            return None

        # Add successful attempt to timeline if not already there
        successful_attempt = TroubleshootingAttempt(
            id=f"att-{incident.id}-{len(incident.attempts) + 1}",
            timestamp=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
            action=res_req.resolution_used,
            hypothesis="Final applied resolution",
            status="SUCCESS",
            observed_result="Incident resolved successfully. Service operational.",
            engineer_notes=res_req.notes,
        )
        incident.attempts.append(successful_attempt)

        incident.status = "RESOLVED"
        incident.root_cause = res_req.root_cause
        incident.successful_fix = res_req.resolution_used
        incident.time_to_resolution_minutes = res_req.time_to_resolution_minutes
        incident.engineer_feedback = res_req.notes

        self._save_store()

        # RETAIN TO HINDSIGHT: The complete incident learning journey
        failed_attempts_summary = [
            {"action": a.action, "reason": a.failure_reason, "observed": a.observed_result}
            for a in incident.attempts
            if a.status in ["FAILED", "PARTIAL"]
        ]

        hindsight_content = (
            f"Incident #{incident.id}: {incident.title}\n"
            f"Service: {incident.service} | Environment: {incident.environment} | Severity: {incident.severity}\n"
            f"Version: {incident.version}\n"
            f"Error: {incident.error_message}\n"
            f"Symptoms: {incident.symptoms}\n"
            f"Logs: {incident.logs[:300]}\n"
            f"Failed attempts: {json.dumps(failed_attempts_summary)}\n"
            f"Root cause: {incident.root_cause}\n"
            f"Successful fix: {incident.successful_fix}\n"
            f"Engineer notes: {incident.engineer_feedback}"
        )

        tags = [
            "incident",
            f"service:{incident.service.lower().replace(' ', '-')}",
            f"env:{incident.environment.lower()}",
            f"severity:{incident.severity.lower()}",
            "outcome:resolved",
        ]
        if "502" in incident.error_message:
            tags.append("error:502")
        elif "timeout" in incident.error_message.lower():
            tags.append("error:timeout")
        elif "oom" in incident.error_message.lower():
            tags.append("error:oom")

        hindsight.retain(
            content=hindsight_content,
            metadata={
                "incident_id": incident.id,
                "title": incident.title,
                "service": incident.service,
                "environment": incident.environment,
                "severity": incident.severity,
                "version": incident.version,
                "error_message": incident.error_message,
                "root_cause": incident.root_cause,
                "successful_fix": incident.successful_fix,
                "failed_attempts": failed_attempts_summary,
                "time_to_resolution": incident.time_to_resolution_minutes,
            },
            tags=tags,
            memory_type="incident",
        )

        return incident

    def record_failed_attempt(
        self,
        incident_id: str,
        fail_req: IncidentFailureRequest,
        hindsight: HindsightMemoryService,
    ) -> Optional[Incident]:
        incident = self.get_incident(incident_id)
        if not incident:
            return None

        attempt = TroubleshootingAttempt(
            id=f"att-{incident.id}-{len(incident.attempts) + 1}",
            timestamp=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
            action=fail_req.attempted_action,
            hypothesis="Attempted fix that failed",
            status="FAILED",
            failure_reason=fail_req.why_it_failed,
            observed_result=fail_req.observed_result,
            engineer_notes=fail_req.why_it_failed,
        )
        incident.attempts.append(attempt)
        incident.status = "INVESTIGATING"

        self._save_store()

        # Retain failed attempt directly into Hindsight as a negative learning unit
        hindsight.retain(
            content=(
                f"Failed troubleshooting attempt on {incident.id} ({incident.service}): "
                f"Action '{fail_req.attempted_action}' FAILED. "
                f"Reason: {fail_req.why_it_failed}. "
                f"Observed result: {fail_req.observed_result or 'No change'}."
            ),
            metadata={
                "incident_id": incident.id,
                "service": incident.service,
                "failed_action": fail_req.attempted_action,
                "failure_reason": fail_req.why_it_failed,
                "type": "failed_attempt",
            },
            tags=["failed_attempt", f"service:{incident.service.lower().replace(' ', '-')}"],
            memory_type="failed_attempt",
        )

        return incident

    def seed_hindsight_from_synthetic(self, hindsight: HindsightMemoryService, limit: Optional[int] = None) -> int:
        """Seeds Hindsight memory layer with synthetic historical incidents."""
        count = 0
        items_to_seed = self._incidents[:limit] if limit else self._incidents

        for inc in items_to_seed:
            if not inc.root_cause or not inc.successful_fix:
                continue

            failed_attempts_summary = [
                {"action": a.action, "reason": a.failure_reason, "observed": a.observed_result}
                for a in inc.attempts
                if a.status in ["FAILED", "PARTIAL"]
            ]

            content = (
                f"Incident #{inc.id}: {inc.title}\n"
                f"Service: {inc.service} | Environment: {inc.environment} | Severity: {inc.severity}\n"
                f"Version: {inc.version}\n"
                f"Error: {inc.error_message}\n"
                f"Symptoms: {inc.symptoms}\n"
                f"Logs: {inc.logs[:300]}\n"
                f"Failed attempts: {json.dumps(failed_attempts_summary)}\n"
                f"Root cause: {inc.root_cause}\n"
                f"Successful fix: {inc.successful_fix}\n"
                f"Engineer notes: {inc.engineer_feedback}"
            )

            tags = [
                "incident",
                f"service:{inc.service.lower().replace(' ', '-')}",
                f"env:{inc.environment.lower()}",
                f"severity:{inc.severity.lower()}",
                "outcome:resolved",
            ]
            if "502" in inc.error_message:
                tags.append("error:502")
            if "timeout" in inc.error_message.lower():
                tags.append("error:timeout")
            if "oom" in inc.error_message.lower() or "memory" in inc.error_message.lower():
                tags.append("error:oom")

            hindsight.retain(
                content=content,
                metadata={
                    "incident_id": inc.id,
                    "title": inc.title,
                    "service": inc.service,
                    "environment": inc.environment,
                    "severity": inc.severity,
                    "version": inc.version,
                    "error_message": inc.error_message,
                    "root_cause": inc.root_cause,
                    "successful_fix": inc.successful_fix,
                    "failed_attempts": failed_attempts_summary,
                    "time_to_resolution": inc.time_to_resolution_minutes,
                },
                tags=tags,
                memory_type="incident",
            )
            count += 1

        return count

    def reset_to_synthetic(self):
        self._load_synthetic()
