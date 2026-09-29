from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class TroubleshootingAttempt(BaseModel):
    id: str
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"))
    action: str
    hypothesis: Optional[str] = None
    status: str  # FAILED, SUCCESS, PARTIAL
    failure_reason: Optional[str] = None
    observed_result: Optional[str] = None
    engineer_notes: Optional[str] = None

class Incident(BaseModel):
    id: str
    title: str
    service: str
    severity: str  # CRITICAL, HIGH, MEDIUM, LOW
    environment: str  # Production, Staging, Canaries, Dev
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"))
    error_message: str
    symptoms: str
    logs: str
    version: str
    infrastructure_details: Optional[str] = None
    additional_context: Optional[str] = None
    status: str = "OPEN"  # OPEN, INVESTIGATING, MITIGATING, RESOLVED, FAILED
    attempts: List[TroubleshootingAttempt] = Field(default_factory=list)
    root_cause: Optional[str] = None
    successful_fix: Optional[str] = None
    time_to_resolution_minutes: Optional[int] = None
    engineer_feedback: Optional[str] = None
    is_synthetic: bool = False

class IncidentIntakeRequest(BaseModel):
    title: str
    service: str
    severity: str
    environment: str
    error_message: str
    symptoms: str
    logs: str
    version: str
    infrastructure_details: Optional[str] = None
    additional_context: Optional[str] = None

class IncidentResolutionRequest(BaseModel):
    resolution_used: str
    root_cause: str
    notes: Optional[str] = None
    time_to_resolution_minutes: Optional[int] = 15

class IncidentFailureRequest(BaseModel):
    attempted_action: str
    why_it_failed: str
    observed_result: Optional[str] = None

class SimilarIncidentMatch(BaseModel):
    incident_id: str
    title: str
    service: str
    similarity_score: float  # 0.0 - 1.0 (labeled as similarity score)
    date: str
    symptoms: str
    root_cause: str
    what_was_tried: List[str] = Field(default_factory=list)
    what_failed: List[Dict[str, str]] = Field(default_factory=list)
    what_worked: str
    outcome: str

class FailedFixSummary(BaseModel):
    action: str
    failure_count: int
    reasons: List[str] = Field(default_factory=list)
    sample_incidents: List[str] = Field(default_factory=list)

class SuccessfulFixSummary(BaseModel):
    action: str
    success_count: int
    sample_incidents: List[str] = Field(default_factory=list)

class Recommendation(BaseModel):
    recommended_action: str
    priority: str = "P1 - Immediate"
    confidence: str = "HIGH"  # HIGH, MEDIUM, LOW
    why: str
    what_was_considered: str
    what_failed_before: List[FailedFixSummary] = Field(default_factory=list)
    what_worked_before: List[SuccessfulFixSummary] = Field(default_factory=list)
    what_is_different_this_time: str
    similar_incidents: List[SimilarIncidentMatch] = Field(default_factory=list)
    prevented_failed_attempts: List[str] = Field(default_factory=list)
    is_memory_backed: bool = True
    generated_at: str = Field(default_factory=lambda: datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"))

class IncidentAnalysisResponse(BaseModel):
    incident_id: str
    recommendation: Recommendation
    timeline: List[Dict[str, Any]] = Field(default_factory=list)
    memory_retrieval_stats: Dict[str, Any] = Field(default_factory=dict)

class CopilotQueryRequest(BaseModel):
    incident_id: Optional[str] = None
    query: str
    conversation_history: List[Dict[str, str]] = Field(default_factory=list)

class CopilotQueryResponse(BaseModel):
    answer: str
    has_historical_evidence: bool
    sources: List[str] = Field(default_factory=list)
    suggested_questions: List[str] = Field(default_factory=list)

class MemoryUnitView(BaseModel):
    id: str
    type: str  # incident, failure, fix, pattern, lesson
    title: str
    content: str
    timestamp: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    tags: List[str] = Field(default_factory=list)
    score: Optional[float] = None

class DashboardMetrics(BaseModel):
    active_incidents: int
    resolved_today: int
    known_failure_patterns: int
    memory_entries: int
    average_resolution_time_min: int
    prevented_repeated_failures: int
    memory_bank_id: str
    hindsight_status: str
