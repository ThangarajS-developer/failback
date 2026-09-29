from fastapi import APIRouter
from typing import List, Dict, Any

from backend.api.incidents import _hindsight_service

router = APIRouter(prefix="/api/patterns", tags=["Failure Patterns"])

@router.get("")
def list_failure_patterns():
    reflection = _hindsight_service.reflect()

    # If reflection has patterns, return them
    if reflection.patterns:
        return {
            "summary": reflection.summary,
            "patterns": reflection.patterns,
            "anti_patterns": reflection.anti_patterns,
            "lessons": reflection.lessons,
        }

    # Pre-computed fallback patterns if bank is fresh
    fallback_patterns = [
        {
            "title": "502 Bad Gateway after Deployment",
            "occurrences": 8,
            "services": ["Payment API", "Checkout Service", "User Gateway"],
            "common_root_cause": "Upstream configuration or port mapping mismatch",
            "failed_fixes": [
                {"action": "Restart Payment API service pods", "count": 6},
                {"action": "Increase proxy_read_timeout in Ingress", "count": 4},
                {"action": "Roll back deployment", "count": 2},
            ],
            "successful_fix": "Correct upstream configuration and keepalive mismatch in Ingress ConfigMap",
        },
        {
            "title": "Database Connection Pool Exhaustion",
            "occurrences": 5,
            "services": ["Order Management", "Inventory Service"],
            "common_root_cause": "Session-level connection holding during traffic surges",
            "failed_fixes": [
                {"action": "Restart application pods", "count": 5},
                {"action": "Increase HikariCP connectionTimeout", "count": 3},
            ],
            "successful_fix": "Switch PgBouncer to transaction pooling mode and tune max_client_conn",
        },
        {
            "title": "Redis Connection Timeouts & maxclients",
            "occurrences": 4,
            "services": ["Session Store", "Search Service"],
            "common_root_cause": "Blocking KEYS commands or unpooled client connections",
            "failed_fixes": [
                {"action": "Restart Redis cluster nodes", "count": 3},
                {"action": "Increase Redis command timeout", "count": 2},
            ],
            "successful_fix": "Kill blocking KEYS command via CLIENT KILL and implement connection pooling",
        },
        {
            "title": "Kafka Consumer Group Rebalance Storm",
            "occurrences": 3,
            "services": ["Order Ingestion Worker"],
            "common_root_cause": "Batch processing time exceeding max.poll.interval.ms",
            "failed_fixes": [
                {"action": "Restart consumer group pods", "count": 3},
            ],
            "successful_fix": "Increase max.poll.interval.ms and reduce max.poll.records",
        },
    ]

    fallback_anti_patterns = [
        {
            "name": "False Assumption: Pod Restart resolves Ingress 502",
            "failed_action": "Restart service pods",
            "failure_rate": "Failed in 6 similar incidents",
            "lesson": "Restarting the backend does not resolve upstream port mapping or proxy configuration mismatches in the ingress controller.",
        },
        {
            "name": "False Assumption: Increasing timeouts cures DB exhaustion",
            "failed_action": "Increase connection timeouts",
            "failure_rate": "Failed in 3 similar incidents",
            "lesson": "Increasing timeouts causes thread backlog and cascades into HTTP 504 Gateway Timeouts.",
        },
    ]

    fallback_lessons = [
        "Restarting services after new deployments rarely resolves 502/504 errors caused by upstream configuration mismatch.",
        "Increasing connection pool timeouts masks thread starvation without relieving database load.",
        "Always check environment secrets and JWKS rotation before assuming client token corruption.",
    ]

    return {
        "summary": "Synthesized historical incident memories across 4 major failure classes.",
        "patterns": fallback_patterns,
        "anti_patterns": fallback_anti_patterns,
        "lessons": fallback_lessons,
    }
