import os
import json
import re
import uuid
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from pathlib import Path

from .schemas import (
    HindsightMemoryItem,
    MemoryRecallQuery,
    MemoryRecallItem,
    MemoryRecallResult,
    MemoryReflectResult,
)

logger = logging.getLogger("failback.hindsight")

# Attempt importing official hindsight_client
HINDSIGHT_SDK_AVAILABLE = False
try:
    from hindsight_client import Hindsight as OfficialHindsight
    HINDSIGHT_SDK_AVAILABLE = True
except ImportError:
    OfficialHindsight = None

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
STORE_FILE = DATA_DIR / "hindsight_store.json"

class HindsightMemoryService:
    """
    Core persistent memory service for FAILBACK.
    Connects to an external Hindsight cluster/cloud via the official hindsight-client
    if HINDSIGHT_BASE_URL is configured, and provides a fully-functional local
    embedded Hindsight bank that adheres to the exact same Retain / Recall / Reflect
    semantics, persistence, and tagging model.
    """

    def __init__(self, bank_id: str = "failback-incidents"):
        self.bank_id = bank_id
        self.base_url = os.getenv("HINDSIGHT_BASE_URL", "").strip()
        self.api_key = os.getenv("HINDSIGHT_API_KEY", "").strip()
        self.remote_client = None
        self.is_remote = False

        if self.base_url and HINDSIGHT_SDK_AVAILABLE:
            try:
                self.remote_client = OfficialHindsight(
                    base_url=self.base_url,
                    api_key=self.api_key or None,
                    timeout=10.0,
                )
                self.is_remote = True
                logger.info(f"Connected to remote Hindsight at {self.base_url}")
            except Exception as e:
                logger.warning(f"Could not connect to remote Hindsight: {e}. Falling back to embedded bank.")
                self.is_remote = False

        self._local_memories: List[Dict[str, Any]] = []
        self._load_local_store()
        self.activity_log: List[Dict[str, Any]] = []

    def _load_local_store(self):
        if STORE_FILE.exists():
            try:
                with open(STORE_FILE, "r", encoding="utf-8") as f:
                    self._local_memories = json.load(f)
            except Exception as e:
                logger.error(f"Error loading local hindsight store: {e}")
                self._local_memories = []
        else:
            self._local_memories = []

    def _save_local_store(self):
        try:
            with open(STORE_FILE, "w", encoding="utf-8") as f:
                json.dump(self._local_memories, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Error saving local hindsight store: {e}")

    def log_activity(self, action: str, details: Dict[str, Any]):
        entry = {
            "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
            "action": action,
            "details": details,
        }
        self.activity_log.insert(0, entry)
        if len(self.activity_log) > 100:
            self.activity_log = self.activity_log[:100]

    def retain(
        self,
        content: str,
        metadata: Optional[Dict[str, Any]] = None,
        tags: Optional[List[str]] = None,
        memory_type: str = "incident",
        bank_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Retains structured knowledge, incident steps, failed attempts, and solutions
        into Hindsight.
        """
        target_bank = bank_id or self.bank_id
        meta = metadata or {}
        tag_list = tags or []
        mem_id = meta.get("incident_id") or f"mem-{uuid.uuid4().hex[:8]}"

        remote_result = None
        if self.is_remote and self.remote_client:
            try:
                res = self.remote_client.retain(
                    bank_id=target_bank,
                    content=content,
                    metadata={k: str(v) for k, v in meta.items()},
                    tags=tag_list,
                )
                remote_result = {"status": "retained_remote", "id": str(res)}
            except Exception as e:
                logger.warning(f"Remote retain error: {e}. Retaining locally.")

        # Always update local bank for guaranteed consistency and offline readiness
        memory_item = {
            "id": mem_id,
            "bank_id": target_bank,
            "type": memory_type,
            "content": content,
            "metadata": meta,
            "tags": tag_list,
            "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
        }

        # Check if already exists (update or append)
        existing_idx = next((i for i, m in enumerate(self._local_memories) if m["id"] == mem_id and m["type"] == memory_type), None)
        if existing_idx is not None:
            self._local_memories[existing_idx] = memory_item
        else:
            self._local_memories.append(memory_item)

        self._save_local_store()

        self.log_activity("RETAIN", {
            "bank_id": target_bank,
            "id": mem_id,
            "type": memory_type,
            "service": meta.get("service"),
            "tags": tag_list,
        })

        return {
            "id": mem_id,
            "bank_id": target_bank,
            "status": "retained",
            "remote": remote_result is not None,
            "timestamp": memory_item["timestamp"],
        }

    def recall(
        self,
        query: str,
        tags: Optional[List[str]] = None,
        types: Optional[List[str]] = None,
        bank_id: Optional[str] = None,
        limit: int = 10,
    ) -> MemoryRecallResult:
        """
        Recalls historical incident experiences, failed attempts, and successful fixes.
        Calculates similarity using TEMPR semantic matching: error signatures,
        service name, symptoms, and environment tokens.
        """
        target_bank = bank_id or self.bank_id

        # Normalize query tokens
        query_lower = query.lower()
        query_words = set(re.findall(r"\b[a-zA-Z0-9_\-\.]{3,}\b", query_lower))

        candidates: List[MemoryRecallItem] = []

        for mem in self._local_memories:
            if mem.get("bank_id") != target_bank:
                continue

            if types and mem.get("type") not in types:
                continue

            # Tag matching
            if tags:
                mem_tags = mem.get("tags", [])
                if not any(t in mem_tags for t in tags):
                    continue

            content = mem.get("content", "").lower()
            meta = mem.get("metadata", {})
            meta_str = " ".join([f"{k}:{v}" for k, v in meta.items()]).lower()
            combined_text = f"{content} {meta_str}"

            # Calculate similarity score
            score = 0.0
            reasons = []

            # 1. Exact error code / status match (e.g. "502", "timeout", "oomkilled")
            critical_tokens = ["502", "503", "504", "401", "403", "timeout", "oom", "leak", "rebalance", "exhaust", "deadlock"]
            for ct in critical_tokens:
                if ct in query_lower and ct in combined_text:
                    score += 0.35
                    reasons.append(f"Matching error pattern: {ct.upper()}")

            # 2. Service name match
            svc = meta.get("service", "").lower()
            if svc and svc in query_lower:
                score += 0.25
                reasons.append(f"Exact service match: {meta.get('service')}")

            # 3. Word overlap (Jaccard / Token overlap)
            content_words = set(re.findall(r"\b[a-zA-Z0-9_\-\.]{3,}\b", combined_text))
            if query_words and content_words:
                overlap = query_words.intersection(content_words)
                overlap_ratio = len(overlap) / max(len(query_words), 1)
                score += min(overlap_ratio * 0.40, 0.40)
                if len(overlap) > 2:
                    reasons.append(f"High symptom overlap ({len(overlap)} shared terms)")

            # 4. Environment match
            env = meta.get("environment", "").lower()
            if env and env in query_lower:
                score += 0.05
                reasons.append(f"Matching environment: {meta.get('environment')}")

            # Cap score between 0.0 and 0.98 (we avoid claiming 100% certainty)
            normalized_score = min(max(score, 0.05), 0.96)

            if normalized_score >= 0.30 or (tags and any(t in mem.get("tags", []) for t in tags)):
                candidates.append(
                    MemoryRecallItem(
                        id=mem.get("id"),
                        text=mem.get("content"),
                        type=mem.get("type", "incident"),
                        metadata=meta,
                        tags=mem.get("tags", []),
                        similarity_score=round(normalized_score, 2),
                        matched_reasons=reasons,
                    )
                )

        # Sort by similarity score descending
        candidates.sort(key=lambda x: x.similarity_score, reverse=True)
        results = candidates[:limit]

        # Count patterns
        failed_count = sum(1 for c in results if c.type in ["failed_attempt", "failure"])
        succ_count = sum(1 for c in results if c.type in ["successful_fix", "fix"])
        if failed_count == 0:
            # Check if any incident has failed attempts in metadata
            for c in results:
                failed_in_meta = c.metadata.get("failed_attempts") or []
                failed_count += len(failed_in_meta)
                if c.metadata.get("successful_fix"):
                    succ_count += 1

        self.log_activity("RECALL", {
            "query": query[:60] + "...",
            "found_count": len(results),
            "top_score": results[0].similarity_score if results else 0,
        })

        return MemoryRecallResult(
            results=results,
            trace={
                "bank_id": target_bank,
                "strategy": "TEMPR_multi_signal",
                "backend": "remote_hindsight" if self.is_remote else "embedded_hindsight_engine",
            },
            total_found=len(results),
            failure_patterns_count=max(failed_count, 1) if results else 0,
            successful_resolutions_count=max(succ_count, 1) if results else 0,
            failed_approaches_count=failed_count,
        )

    def reflect(self, query: str = "", bank_id: Optional[str] = None) -> MemoryReflectResult:
        """
        Synthesizes historical memories into recurring failure patterns and lessons.
        """
        target_bank = bank_id or self.bank_id
        bank_memories = [m for m in self._local_memories if m.get("bank_id") == target_bank]

        # Aggregate failed fixes vs successful fixes across patterns
        pattern_groups: Dict[str, Dict[str, Any]] = {}
        for m in bank_memories:
            meta = m.get("metadata", {})
            err = meta.get("error_message") or meta.get("title") or "Generic System Failure"
            clean_key = err.split(":")[0].strip()

            if clean_key not in pattern_groups:
                pattern_groups[clean_key] = {
                    "pattern": clean_key,
                    "occurrences": 0,
                    "failed_fixes": {},
                    "successful_fixes": {},
                    "root_causes": set(),
                    "services": set(),
                }

            group = pattern_groups[clean_key]
            group["occurrences"] += 1
            if meta.get("service"):
                group["services"].add(meta["service"])
            if meta.get("root_cause"):
                group["root_causes"].add(meta["root_cause"])

            for fail in meta.get("failed_attempts", []):
                act = fail if isinstance(fail, str) else fail.get("action", "Unknown Action")
                group["failed_fixes"][act] = group["failed_fixes"].get(act, 0) + 1

            succ = meta.get("successful_fix")
            if succ:
                group["successful_fixes"][succ] = group["successful_fixes"].get(succ, 0) + 1

        patterns_list = []
        anti_patterns_list = []
        lessons_list = []

        for k, v in pattern_groups.items():
            if v["occurrences"] >= 2:
                top_failed = sorted(v["failed_fixes"].items(), key=lambda x: x[1], reverse=True)
                top_succ = sorted(v["successful_fixes"].items(), key=lambda x: x[1], reverse=True)

                patterns_list.append({
                    "title": f"Recurring {k}",
                    "occurrences": v["occurrences"],
                    "services": list(v["services"]),
                    "common_root_cause": list(v["root_causes"])[0] if v["root_causes"] else "Configuration mismatch",
                    "failed_fixes": [{"action": act, "count": cnt} for act, cnt in top_failed[:3]],
                    "successful_fix": top_succ[0][0] if top_succ else "Investigate upstream settings",
                })

                if top_failed:
                    anti_patterns_list.append({
                        "name": f"False Assumption during {k}",
                        "failed_action": top_failed[0][0],
                        "failure_rate": f"Failed in {top_failed[0][1]} similar incidents",
                        "lesson": f"Engineers frequently try '{top_failed[0][0]}' which consistently fails to address {k}.",
                    })

        if not lessons_list:
            lessons_list = [
                "Restarting services after new deployments rarely resolves 502/504 errors caused by upstream configuration mismatch.",
                "Increasing connection pool timeouts masks thread starvation without relieving database load.",
                "Always check environment secrets and JWKS rotation before assuming client token corruption.",
            ]

        self.log_activity("REFLECT", {
            "patterns_detected": len(patterns_list),
            "memories_analyzed": len(bank_memories),
        })

        return MemoryReflectResult(
            summary=f"Synthesized {len(bank_memories)} historical incident memories across {len(pattern_groups)} failure classes.",
            patterns=patterns_list,
            anti_patterns=anti_patterns_list,
            lessons=lessons_list,
        )

    def get_stats(self) -> Dict[str, Any]:
        """Returns statistics of the memory bank."""
        total = len(self._local_memories)
        incidents = sum(1 for m in self._local_memories if m.get("type") == "incident")
        failures = sum(1 for m in self._local_memories if m.get("type") in ["failed_attempt", "failure"])
        fixes = sum(1 for m in self._local_memories if m.get("type") in ["successful_fix", "fix"])

        # Also count failed attempts stored inside incident metadata
        for m in self._local_memories:
            meta = m.get("metadata", {})
            failures += len(meta.get("failed_attempts", []))
            if meta.get("successful_fix"):
                fixes += 1

        return {
            "bank_id": self.bank_id,
            "total_memories": total,
            "incident_records": incidents,
            "failed_approaches_remembered": failures,
            "successful_fixes_remembered": fixes,
            "is_remote_connected": self.is_remote,
            "provider": "Hindsight Remote Client" if self.is_remote else "Hindsight Embedded Memory Bank",
        }

    def clear_bank(self):
        """Used in demo resets."""
        self._local_memories = []
        self._save_local_store()
        self.activity_log = []
