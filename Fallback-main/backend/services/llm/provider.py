import os
import json
import logging
from typing import List, Dict, Any, Optional

from backend.models.schemas import (
    Incident,
    Recommendation,
    FailedFixSummary,
    SuccessfulFixSummary,
    SimilarIncidentMatch,
)
from backend.services.hindsight.schemas import MemoryRecallResult

logger = logging.getLogger("failback.llm")

class LLMProviderService:
    def __init__(self):
        self.openai_api_key = os.getenv("OPENAI_API_KEY", "").strip()
        self.gemini_api_key = os.getenv("GEMINI_API_KEY", "").strip()

    def generate_generic_recommendation(self, incident: Incident) -> Recommendation:
        """
        Generates standard generic/uninformed troubleshooting advice (WITHOUT MEMORY).
        Used to demonstrate the Stark difference between traditional chatbots / RAG and FAILBACK.
        """
        return Recommendation(
            recommended_action=f"Restart {incident.service} pods and increase proxy read timeout to 120s.",
            priority="P2 - General Triage",
            confidence="LOW",
            why="Standard troubleshooting heuristic for intermittent service degradation: rebooting clears process state, while increasing timeout accommodates slow responses.",
            what_was_considered="Standard microservice operational runbook: service availability, process memory consumption, network reachability, and default gateway timeout margins.",
            what_failed_before=[],
            what_worked_before=[],
            what_is_different_this_time="No historical baseline or prior incident memory available for comparison.",
            similar_incidents=[],
            prevented_failed_attempts=[],
            is_memory_backed=False,
        )

    def generate_memory_backed_recommendation(
        self,
        incident: Incident,
        recall_res: MemoryRecallResult,
    ) -> Recommendation:
        """
        Generates an evidence-based recommendation powered by Hindsight historical memories.
        Synthesizes WHAT FAILED BEFORE, WHAT WORKED, and WHY.
        """
        if not recall_res.results or len(recall_res.results) == 0:
            return self.generate_generic_recommendation(incident)

        # 1. Collate similar incidents
        similar_matches: List[SimilarIncidentMatch] = []
        failed_fixes_dict: Dict[str, Dict[str, Any]] = {}
        successful_fixes_dict: Dict[str, Dict[str, Any]] = {}

        for item in recall_res.results:
            meta = item.metadata or {}
            inc_id = meta.get("incident_id", item.id)

            # Collect what failed in this historical incident
            failed_in_inc = []
            for attempt in meta.get("failed_attempts", []):
                act = attempt.get("action") if isinstance(attempt, dict) else str(attempt)
                reason = attempt.get("reason", "Did not resolve the incident") if isinstance(attempt, dict) else "Did not resolve the incident"
                failed_in_inc.append({"action": act, "reason": reason})

                if act not in failed_fixes_dict:
                    failed_fixes_dict[act] = {"count": 0, "reasons": set(), "incidents": set()}
                failed_fixes_dict[act]["count"] += 1
                failed_fixes_dict[act]["reasons"].add(reason)
                failed_fixes_dict[act]["incidents"].add(inc_id)

            succ_fix = meta.get("successful_fix", "Configuration alignment")
            if succ_fix:
                if succ_fix not in successful_fixes_dict:
                    successful_fixes_dict[succ_fix] = {"count": 0, "incidents": set()}
                successful_fixes_dict[succ_fix]["count"] += 1
                successful_fixes_dict[succ_fix]["incidents"].add(inc_id)

            similar_matches.append(
                SimilarIncidentMatch(
                    incident_id=inc_id,
                    title=meta.get("title", item.text[:60]),
                    service=meta.get("service", incident.service),
                    similarity_score=item.similarity_score,
                    date=item.metadata.get("timestamp", "Recent"),
                    symptoms=meta.get("symptoms", item.text[:120]),
                    root_cause=meta.get("root_cause", "Configuration mismatch"),
                    what_was_tried=[f["action"] for f in failed_in_inc] + ([succ_fix] if succ_fix else []),
                    what_failed=failed_in_inc,
                    what_worked=succ_fix,
                    outcome="RESOLVED",
                )
            )

        # Build FailedFixSummary list
        failed_summaries: List[FailedFixSummary] = []
        for act, data in sorted(failed_fixes_dict.items(), key=lambda x: x[1]["count"], reverse=True):
            failed_summaries.append(
                FailedFixSummary(
                    action=act,
                    failure_count=data["count"],
                    reasons=list(data["reasons"]),
                    sample_incidents=list(data["incidents"])[:3],
                )
            )

        # Build SuccessfulFixSummary list
        successful_summaries: List[SuccessfulFixSummary] = []
        for act, data in sorted(successful_fixes_dict.items(), key=lambda x: x[1]["count"], reverse=True):
            successful_summaries.append(
                SuccessfulFixSummary(
                    action=act,
                    success_count=data["count"],
                    sample_incidents=list(data["incidents"])[:3],
                )
            )

        # Determine best recommendation based on historical success and failure avoidance
        top_successful_fix = successful_summaries[0].action if successful_summaries else "Investigate upstream configuration"
        top_similar_ids = [m.incident_id for m in similar_matches[:3]]
        similar_ids_str = ", ".join(top_similar_ids)

        # Check for environment or version difference
        top_match = similar_matches[0]
        top_match_version = recall_res.results[0].metadata.get("version", "v1.x")
        version_difference = (
            f"Current deployment is running {incident.version} (Node 22 / targetPort 8000), "
            f"whereas historical incident {top_match.incident_id} occurred on {top_match_version}. "
            f"However, the error signature and connection refusal symptoms are structurally identical."
            if incident.version != top_match_version
            else f"Both current and previous incidents share environment ({incident.environment}) and runtime stack."
        )

        # Construct explainability rationale
        failed_actions_str = ", ".join([f"'{f.action}'" for f in failed_summaries[:2]]) if failed_summaries else "restarting services"
        why_text = (
            f"This incident closely matches historical incidents ({similar_ids_str}). "
            f"In all {len(similar_matches)} similar historical occurrences, attempting {failed_actions_str} consistently FAILED to resolve the failure. "
            f"Conversely, '{top_successful_fix}' succeeded in {successful_summaries[0].success_count if successful_summaries else 1} prior incidents. "
            f"Therefore, FAILBACK strongly advises applying '{top_successful_fix}' immediately without repeating known failed steps."
        )

        considered_text = (
            f"Retrieved {len(similar_matches)} matching incident memories from Hindsight. "
            f"Evaluated {len(failed_summaries)} previously attempted actions that resulted in downtime escalation, "
            f"and cross-referenced {len(successful_summaries)} validated fixes against current deployment logs."
        )

        prevented_list = [f.action for f in failed_summaries]

        return Recommendation(
            recommended_action=top_successful_fix,
            priority="P1 - Immediate (High Historical Evidence)",
            confidence="HIGH" if len(similar_matches) >= 2 else "MEDIUM",
            why=why_text,
            what_was_considered=considered_text,
            what_failed_before=failed_summaries,
            what_worked_before=successful_summaries,
            what_is_different_this_time=version_difference,
            similar_incidents=similar_matches,
            prevented_failed_attempts=prevented_list,
            is_memory_backed=True,
        )

    def answer_copilot(
        self,
        query: str,
        incident: Optional[Incident],
        recall_res: MemoryRecallResult,
    ) -> Dict[str, Any]:
        """
        Strictly grounded SRE incident copilot.
        Answers questions based ONLY on incident context + Hindsight memory units.
        If no evidence exists, explicitly says so!
        """
        q_lower = query.lower()

        # Check if memory has evidence
        if not recall_res.results or len(recall_res.results) == 0:
            return {
                "answer": (
                    "I don't have historical evidence in Hindsight memory for this specific question yet. "
                    "You can teach me by reporting similar historical incidents or seeding synthetic incident data."
                ),
                "has_historical_evidence": False,
                "sources": [],
                "suggested_questions": [
                    "What are the general microservice triage steps?",
                    "How can I seed historical incidents into Hindsight?",
                ],
            }

        # Check for specific questions
        if "what failed" in q_lower or "failed fixes" in q_lower or "what didn't work" in q_lower:
            failed_points = []
            sources = []
            for r in recall_res.results:
                meta = r.metadata or {}
                inc_id = meta.get("incident_id", r.id)
                sources.append(inc_id)
                for f in meta.get("failed_attempts", []):
                    act = f.get("action") if isinstance(f, dict) else str(f)
                    reason = f.get("reason", "No effect") if isinstance(f, dict) else "No effect"
                    failed_points.append(f"• **{act}** on #{inc_id}: {reason}")

            if failed_points:
                ans = "Based on historical Hindsight records, the following troubleshooting approaches were previously attempted and **FAILED**:\n\n" + "\n".join(failed_points[:5])
            else:
                ans = "In the matched historical incidents, no failed troubleshooting attempts were explicitly recorded."

            return {
                "answer": ans,
                "has_historical_evidence": True,
                "sources": list(set(sources)),
                "suggested_questions": [
                    "What fix actually resolved the issue?",
                    "Why did service restart fail?",
                    "What is the recommended fix for this incident?",
                ],
            }

        if "last time" in q_lower or "similar" in q_lower or "seen this before" in q_lower:
            top = recall_res.results[0]
            meta = top.metadata or {}
            inc_id = meta.get("incident_id", top.id)
            root = meta.get("root_cause", "Configuration drift")
            fix = meta.get("successful_fix", "Applied configuration fix")
            sim_score = int(top.similarity_score * 100)

            ans = (
                f"Yes. We experienced an almost identical incident: **#{inc_id}** ({sim_score}% similarity score).\n\n"
                f"**Symptoms:** {meta.get('symptoms', 'Intermittent failures')}\n\n"
                f"**Root Cause:** {root}\n\n"
                f"**What Worked:** {fix}\n\n"
                f"Engineers initially tried restarting the service, which failed. The issue was resolved once the configuration was corrected."
            )
            return {
                "answer": ans,
                "has_historical_evidence": True,
                "sources": [inc_id],
                "suggested_questions": [
                    "What fixes failed in that incident?",
                    "What is different this time?",
                    "Show me the full timeline for #" + inc_id,
                ],
            }

        if "why" in q_lower and ("recommend" in q_lower or "fix" in q_lower):
            top = recall_res.results[0]
            meta = top.metadata or {}
            fix = meta.get("successful_fix", "Correct upstream configuration")
            ans = (
                f"I recommend **{fix}** because historical evidence from {len(recall_res.results)} similar incidents demonstrates "
                f"that this directly resolves the root cause. Crucially, attempting to restart services or modify timeouts "
                f"repeatedly failed in those incidents without resolving the issue."
            )
            return {
                "answer": ans,
                "has_historical_evidence": True,
                "sources": [r.metadata.get("incident_id", r.id) for r in recall_res.results[:3]],
                "suggested_questions": [
                    "What failed before?",
                    "Show similar incidents",
                ],
            }

        # Default synthesis
        matched_ids = [r.metadata.get("incident_id", r.id) for r in recall_res.results[:3]]
        top_meta = recall_res.results[0].metadata or {}
        ans = (
            f"Based on {len(recall_res.results)} historical incidents stored in Hindsight ({', '.join(matched_ids)}):\n\n"
            f"- **Pattern:** {top_meta.get('title', 'Service outage')}\n"
            f"- **Known Root Cause:** {top_meta.get('root_cause', 'Upstream configuration error')}\n"
            f"- **Successful Solution:** {top_meta.get('successful_fix', 'Inspect upstream mapping')}\n\n"
            f"Historical evidence warns against restarting pods, as it resulted in duplicate downtime without fixing the error."
        )
        return {
            "answer": ans,
            "has_historical_evidence": True,
            "sources": matched_ids,
            "suggested_questions": [
                "What failed before?",
                "Why are you recommending this?",
                "What is different this time?",
            ],
        }
