from fastapi import APIRouter
from typing import Dict, Any

from backend.api.incidents import _hindsight_service, _incident_service, _agent
from backend.models.schemas import (
    Incident,
    TroubleshootingAttempt,
    IncidentResolutionRequest,
)

router = APIRouter(prefix="/api/demo", tags=["Demo Mode"])

# Demo state tracker
_demo_state = {
    "current_stage": 1,
    "active_incident_id": "INC-DEMO-001",
    "description": "Stage 1: Fresh Agent without Memory",
}

# The canonical sample incident used across the demo
DEMO_INCIDENT_SAMPLE = {
    "id": "INC-DEMO-001",
    "title": "502 Bad Gateway on Payment Checkout after v2.5.0 Deployment",
    "service": "Payment API",
    "severity": "CRITICAL",
    "environment": "Production",
    "timestamp": "2026-09-28 14:02:00 UTC",
    "error_message": "502 Bad Gateway: upstream timed out (110: Connection timed out) while connecting to backend",
    "symptoms": "Intermittent 502 Bad Gateway spikes on /v1/checkout immediately following release v2.5.0. 45% failure rate.",
    "logs": "[error] 1421#1421: *892011 upstream timed out while connecting to upstream, request: \"POST /v1/checkout HTTP/1.1\", upstream: \"http://10.0.4.15:8080/v1/checkout\"",
    "version": "v2.5.0",
    "infrastructure_details": "AWS EKS, NGINX Ingress Controller -> Gunicorn Pods",
    "additional_context": "Deployment changed ingress keepalive timeout and upstream routing port mapping.",
    "status": "OPEN",
    "attempts": [],
    "is_synthetic": True,
}

@router.get("/state")
def get_demo_state():
    stats = _hindsight_service.get_stats()
    return {
        "stage": _demo_state["current_stage"],
        "description": _demo_state["description"],
        "active_incident_id": _demo_state["active_incident_id"],
        "hindsight_memories_count": stats["total_memories"],
        "failed_approaches_count": stats["failed_approaches_remembered"],
        "successful_fixes_count": stats["successful_fixes_remembered"],
    }

@router.post("/reset")
def reset_demo():
    """Resets to Stage 1: Clears Hindsight bank, reloads initial demo incident."""
    _hindsight_service.clear_bank()
    _demo_state["current_stage"] = 1
    _demo_state["description"] = "Stage 1: Fresh Agent — No Relevant Memory"

    # Ensure demo incident exists in incident service
    demo_inc = Incident(**DEMO_INCIDENT_SAMPLE)
    # Remove existing demo incidents from service
    _incident_service._incidents = [i for i in _incident_service._incidents if not i.id.startswith("INC-DEMO")]
    _incident_service._incidents.insert(0, demo_inc)
    _incident_service._save_store()

    return {
        "stage": 1,
        "message": "Demo reset to Stage 1. Memory cleared. Agent is fresh.",
        "incident": demo_inc.model_dump(),
    }

@router.post("/step/{stage_number}")
def execute_demo_step(stage_number: int):
    """
    Executes or advances to a specific stage:
    Stage 1: Fresh Agent (Zero memory - generic response)
    Stage 2: Teach Agent (Seeds 3 historical 502 incidents into Hindsight)
    Stage 3: New Incident (Submits similar 502 incident)
    Stage 4: Intelligent Recommendation (Recalls memories, highlights what failed vs what worked)
    Stage 5: Learn Again (Resolves incident, stores into Hindsight, strengthens pattern)
    """
    if stage_number == 1:
        return reset_demo()

    elif stage_number == 2:
        # Teach the Agent: Retain 3 specific 502 incidents with explicit failure journeys into Hindsight
        _demo_state["current_stage"] = 2
        _demo_state["description"] = "Stage 2: Teach FAILBACK — Retaining 3 Historical Incidents into Hindsight"

        incidents_to_teach = [
            {
                "id": "INC-042",
                "title": "502 Bad Gateway across Payment API after deployment",
                "service": "Payment API",
                "severity": "CRITICAL",
                "environment": "Production",
                "version": "v2.4.1",
                "error_message": "502 Bad Gateway: upstream timed out while connecting to backend",
                "symptoms": "Requests intermittently failing immediately following v2.4.1 deployment.",
                "logs": "upstream timed out (110: Connection timed out) while connecting to upstream",
                "failed_attempts": [
                    {"action": "Restart Payment API service pods", "reason": "Pods restarted in 45s but 502 errors persisted at identical 40% error rate.", "observed": "Did not alter connection timeout."},
                    {"action": "Increase proxy_read_timeout in Ingress to 120s", "reason": "Connections still timed out; client latency ballooned, cascading socket exhaustion.", "observed": "Extended client wait without receiving packets."},
                ],
                "root_cause": "Incorrect upstream configuration in Nginx ingress pointing to targetPort 8080 while container was on 8000.",
                "successful_fix": "Correct upstream configuration and targetPort mapping in Ingress ConfigMap",
                "feedback": "Service restart was a reflexive mistake that wasted 10 minutes. Upstream config should have been checked first.",
            },
            {
                "id": "INC-031",
                "title": "502 Bad Gateway on Checkout Service after canary rollout",
                "service": "Checkout Service",
                "severity": "CRITICAL",
                "environment": "Production",
                "version": "v3.1.0-canary",
                "error_message": "502 Bad Gateway: connect() failed (111: Connection refused) while connecting to upstream",
                "symptoms": "Canary traffic hitting 502 errors on POST /checkout/orders.",
                "logs": "connect() failed (111: Connection refused) while connecting to upstream",
                "failed_attempts": [
                    {"action": "Restart Checkout canary pods", "reason": "Pods restarted into Running state but Envoy continued returning 502 Connection refused.", "observed": "App rejecting ingress connections."},
                ],
                "root_cause": "Node.js v3.1.0 default HOST bound to 127.0.0.1 instead of 0.0.0.0, rejecting container networking.",
                "successful_fix": "Correct upstream host binding configuration (HOST=0.0.0.0)",
                "feedback": "Restarting was attempted first, which failed. The upstream binding was the issue.",
            },
            {
                "id": "INC-017",
                "title": "Intermittent 502 Bad Gateway on User Gateway",
                "service": "User Gateway",
                "severity": "HIGH",
                "environment": "Production",
                "version": "v1.9.4",
                "error_message": "502 Bad Gateway: upstream server temporarily disabled while connecting to upstream",
                "symptoms": "15% of auth token validation calls failing with 502.",
                "logs": "upstream server 10.0.12.8:5000 temporarily disabled while connecting to upstream",
                "failed_attempts": [
                    {"action": "Increase HTTP connection timeouts", "reason": "Timeout change caused Nginx to hang longer on dead pods, worsening 502 cascade.", "observed": "502 errors increased to 22%."},
                ],
                "root_cause": "Nginx upstream max_fails=1 caused premature evictions of healthy backend pods during rolling update.",
                "successful_fix": "Correct upstream Nginx fail_timeout and max_fails configuration",
                "feedback": "Increasing timeout failed. Correcting the upstream parameters worked immediately.",
            },
        ]

        for item in incidents_to_teach:
            content = (
                f"Incident #{item['id']}: {item['title']}\n"
                f"Service: {item['service']} | Environment: {item['environment']} | Severity: {item['severity']}\n"
                f"Error: {item['error_message']}\n"
                f"Symptoms: {item['symptoms']}\n"
                f"Logs: {item['logs']}\n"
                f"Failed attempts: {item['failed_attempts']}\n"
                f"Root cause: {item['root_cause']}\n"
                f"Successful fix: {item['successful_fix']}\n"
                f"Engineer notes: {item['feedback']}"
            )
            _hindsight_service.retain(
                content=content,
                metadata={
                    "incident_id": item["id"],
                    "title": item["title"],
                    "service": item["service"],
                    "environment": item["environment"],
                    "severity": item["severity"],
                    "version": item["version"],
                    "error_message": item["error_message"],
                    "root_cause": item["root_cause"],
                    "successful_fix": item["successful_fix"],
                    "failed_attempts": item["failed_attempts"],
                },
                tags=["incident", "error:502", f"service:{item['service'].lower().replace(' ', '-')}"],
                memory_type="incident",
            )

        return {
            "stage": 2,
            "message": "Learned 3 historical incidents into Hindsight. Memory layer now populated with failure records.",
            "seeded_incidents": ["INC-042", "INC-031", "INC-017"],
            "stats": _hindsight_service.get_stats(),
        }

    elif stage_number == 3:
        # Submit new incident similar to INC-042
        _demo_state["current_stage"] = 3
        _demo_state["description"] = "Stage 3: New Similar Incident Submitted"

        demo_inc = _incident_service.get_incident("INC-DEMO-001")
        if not demo_inc:
            demo_inc = Incident(**DEMO_INCIDENT_SAMPLE)
            _incident_service._incidents.insert(0, demo_inc)
            _incident_service._save_store()

        return {
            "stage": 3,
            "message": "New incident submitted: '502 Bad Gateway on Payment Checkout'. Ready for Hindsight recall.",
            "incident": demo_inc.model_dump(),
        }

    elif stage_number == 4:
        # Generate Intelligent Failure-Aware Recommendation
        _demo_state["current_stage"] = 4
        _demo_state["description"] = "Stage 4: Intelligent Failure-Aware Recommendation Generated"

        demo_inc = _incident_service.get_incident("INC-DEMO-001")
        if not demo_inc:
            demo_inc = Incident(**DEMO_INCIDENT_SAMPLE)

        analysis = _agent.analyze_incident(demo_inc, force_no_memory=False)

        return {
            "stage": 4,
            "message": "FAILBACK analyzed incident against Hindsight memories. Found 3 similar incidents and flagged previously failed approaches.",
            "analysis": analysis.model_dump(),
        }

    elif stage_number == 5:
        # Mark resolved, retain into Hindsight, show memory count increment
        _demo_state["current_stage"] = 5
        _demo_state["description"] = "Stage 5: New Experience Retained — Hindsight Memory Bank Strengthened"

        demo_inc = _incident_service.get_incident("INC-DEMO-001")
        if not demo_inc:
            demo_inc = Incident(**DEMO_INCIDENT_SAMPLE)
            _incident_service._incidents.insert(0, demo_inc)

        res_req = IncidentResolutionRequest(
            resolution_used="Correct upstream configuration in Ingress ConfigMap and align container targetPort",
            root_cause="Port mapping mismatch between Ingress service (8080) and backend container listener (8000)",
            notes="Followed FAILBACK recommendation directly. Did not waste time restarting pods. Resolution took under 5 minutes.",
            time_to_resolution_minutes=5,
        )

        resolved_inc = _incident_service.resolve_incident("INC-DEMO-001", res_req, _hindsight_service)

        stats = _hindsight_service.get_stats()
        return {
            "stage": 5,
            "message": "Incident resolved and retained into Hindsight! Total memories incremented from 3 to 4. Failure pattern reinforced.",
            "incident": resolved_inc.model_dump() if resolved_inc else None,
            "stats": stats,
            "memory_growth": {
                "before_demo": 3,
                "after_demo": 4,
                "pattern_strength": "Enhanced from 3 prior incidents to 4 validated records",
            },
        }

    return {"error": "Invalid stage number"}
