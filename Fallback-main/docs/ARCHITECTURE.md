# FAILBACK Architecture & Engineering Specification

> **Tagline:** *"Your team's failed fixes shouldn't have to fail twice."*

---

## 1. High-Level System Architecture

```
                    ┌────────────────────────────────────────────────────────┐
                    │                    FAILBACK Web UI                     │
                    │      Next.js 14 • Tailwind CSS • Lucide • Recharts     │
                    └───────────────────────────┬────────────────────────────┘
                                                │ REST API Calls
                                                ▼
                    ┌────────────────────────────────────────────────────────┐
                    │                 FastAPI Backend Service                │
                    │               Python 3.13 • Uvicorn ASGI               │
                    └───────────┬────────────────────────────────┬───────────┘
                                │                                │
                   Recall/Retain│                   State Query  │
                                ▼                                ▼
┌──────────────────────────────────────────────┐  ┌──────────────────────────┐
│           Hindsight Memory Layer             │  │    Application State     │
│                                              │  │                          │
│ • Official SDK: hindsight_client (v0.10.1)   │  │ • Synthetic Incidents    │
│ • Bank: failback-incidents                   │  │ • Incident Registry      │
│ • Dual Mode: Remote Cluster or Embedded Engine│ │ • Real-time State (JSON) │
│ • Operations: Retain, Recall, Reflect        │  └──────────────────────────┘
│ • Indexing: Errors, Services, Failures, Fixes│
└───────────────────────┬──────────────────────┘
                        │
       Contextual Recall│
                        ▼
┌──────────────────────────────────────────────┐
│           Incident Analysis Agent            │
│                                              │
│ • Failure-Aware Reasoning Engine             │
│ • Multi-Signal Similarity Scoring (TEMPR)    │
│ • Negative Pattern Extraction (What Failed)  │
│ • Explainability Generator (5-Point Schema)  │
│ • Grounded SRE Copilot Model                 │
└──────────────────────────────────────────────┘
```

---

## 2. The Core Innovation: Remembering the Complete Troubleshooting Journey

Unlike traditional Runbook systems or standard document RAG that only store the final resolution, FAILBACK models and indexes the **entire incident learning journey**:

$$\text{Incident Trigger} \longrightarrow \text{Symptoms \& Telemetry} \longrightarrow \text{Initial Hypotheses} \longrightarrow \mathbf{\text{Failed Attempts (Why They Failed)}} \longrightarrow \mathbf{\text{Successful Fix}} \longrightarrow \text{Confirmed Root Cause} \longrightarrow \text{Human Feedback}$$

### The Failure Memory Schema
Every troubleshooting attempt is preserved with structured failure attribution:
- `action`: The exact mitigation attempted (e.g., `Restart Payment API service pods`).
- `hypothesis`: The engineer's mental model at the time (e.g., `Transient process deadlock`).
- `status`: `FAILED` | `SUCCESS` | `PARTIAL`.
- `failure_reason`: Concrete reason why it failed (e.g., `502 connection refused persisted; pods restarted into same error state`).
- `observed_result`: The immediate telemetry outcome (e.g., `Added 30s of unnecessary pod termination overhead`).

When a similar incident occurs later, FAILBACK queries Hindsight, detects the matching failure signature, and explicitly warns:
```
DO NOT ATTEMPT PREVIOUSLY FAILED ACTIONS:
❌ Restart Payment API pods (Failed in 2 similar incidents)
❌ Increase proxy read timeout (Failed in 1 similar incident)
```

---

## 3. Hindsight Memory Layer Integration

FAILBACK adheres strictly to the official `hindsight-client` Python SDK architecture:

### A. Memory Bank Organization
- **Bank ID**: `failback-incidents`
- **Memory Types**:
  - `incident`: Complete historical incident stories with logs and root causes.
  - `failed_attempt`: Dedicated negative learning records warning against dead-ends.
  - `successful_fix`: Validated remediation steps.
  - `pattern`: Reflection-synthesized recurring failure classes.
  - `lesson`: High-level institutional rules of thumb.

### B. Core Operations
1. **Retain (`Hindsight.retain`)**:
   Called when an incident is resolved or a failed troubleshooting attempt is recorded. Ingests structured content with metadata (`incident_id`, `service`, `environment`, `severity`, `version`, `root_cause`, `failed_attempts`, `time_to_resolution`) and tags (`error:502`, `service:payment-api`, `outcome:resolved`).
2. **Recall (`Hindsight.recall`)**:
   Called during incident intake and analysis. Uses TEMPR multi-signal semantic search to match error codes, service names, symptom text, and deployment context.
3. **Reflect (`Hindsight.reflect`)**:
   Aggregates across all stored incident memories to extract macro failure patterns, calculate false-assumption frequencies, and generate institutional SRE lessons.

---

## 4. Explainable AI Recommendation Engine

Every recommendation generated by FAILBACK answers 5 explicit questions:
1. **WHY THIS RECOMMENDATION?**
   Explains the historical evidence from matching incidents and the causal connection to the root cause.
2. **WHAT WAS CONSIDERED?**
   Transparently lists the historical memories retrieved, failed attempts evaluated, and candidate fixes compared.
3. **WHAT FAILED BEFORE?**
   Identifies previously attempted fixes that resulted in downtime escalation.
4. **WHAT WORKED HISTORICALLY?**
   Cites the exact fix validated in prior incidents and the number of times it succeeded.
5. **WHAT IS DIFFERENT THIS TIME?**
   Highlights environmental drift, such as runtime version differences (e.g., Node 22 vs Node 20) or deployment configuration changes.

---

## 5. Security & SRE Safety Principles
- **Advisory Only**: The agent provides evidence-based recommendations to human engineers. It does not automatically execute destructive production actions (database deletion, pod rebooting, or firewall changes).
- **Calibrated Scores**: Similarity percentages are explicitly labeled as *historical similarity scores*, avoiding pseudo-scientific probability claims.
- **Grounded Copilot**: The copilot assistant answers queries strictly from Hindsight memory records. If no evidence exists, it explicitly states: *"I don't have historical evidence in Hindsight memory for this specific question yet."*
