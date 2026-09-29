from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

class HindsightMemoryItem(BaseModel):
    id: str
    type: str  # "incident", "failed_attempt", "successful_fix", "pattern", "reflection"
    text: str
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"))
    metadata: Dict[str, Any] = Field(default_factory=dict)
    tags: List[str] = Field(default_factory=list)
    scores: Dict[str, float] = Field(default_factory=dict)
    bank_id: str = "failback-incidents"

class MemoryRecallQuery(BaseModel):
    bank_id: str = "failback-incidents"
    query: str
    types: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    budget: str = "mid"
    max_tokens: int = 4096

class MemoryRecallItem(BaseModel):
    id: str
    text: str
    type: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    tags: List[str] = Field(default_factory=list)
    similarity_score: float
    matched_reasons: List[str] = Field(default_factory=list)

class MemoryRecallResult(BaseModel):
    results: List[MemoryRecallItem] = Field(default_factory=list)
    trace: Dict[str, Any] = Field(default_factory=dict)
    total_found: int = 0
    failure_patterns_count: int = 0
    successful_resolutions_count: int = 0
    failed_approaches_count: int = 0

class MemoryReflectResult(BaseModel):
    summary: str
    patterns: List[Dict[str, Any]] = Field(default_factory=list)
    anti_patterns: List[Dict[str, Any]] = Field(default_factory=list)
    lessons: List[str] = Field(default_factory=list)
