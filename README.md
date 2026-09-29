# FAILBACK: Failure-Aware Incident Learning Agent

[![Hackathon](https://img.shields.io/badge/HackWithHyderabad-3.0-blue.svg)](https://hackwithhyderabad.com)
[![Hindsight Memory](https://img.shields.io/badge/Memory%20Layer-Hindsight%20AI-06b6d4.svg)](https://github.com/vectorize-io/hindsight)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20Python%203.13-059669.svg)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014%20TypeScript-000000.svg)](https://nextjs.org)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

> **Tagline:** *"Your team's failed fixes shouldn't have to fail twice."*

---

## 1. Problem Statement

When production outages occur, on-call DevOps and SRE engineers are under extreme pressure to restore service availability. In the heat of the moment, engineers instinctively resort to textbook heuristics:
- Rebooting servers or restarting Kubernetes pods
- Increasing connection timeouts
- Scaling out worker pools
- Flushing caches

**The Reality:** In complex microservice architectures, these reflex actions frequently fail, consume 15–45 minutes of critical downtime, or trigger severe cascading failures (such as thundering-herd connection exhaustion or client backpressure).

**The Institutional Amnesia:** Months or weeks earlier, another engineer on the same team often encountered the exact same failure signature, tried the exact same reboot, watched it fail, and eventually discovered the real root cause. Yet because existing incident systems only record the final resolution, that negative learning was lost. **The team is condemned to repeat its own failed fixes.**

---

## 2. Solution: FAILBACK

**FAILBACK** is an AI-powered Incident Response and Learning Agent built for **HackWithHyderabad 3.0**. 

The core innovation is that FAILBACK remembers the **entire troubleshooting journey**:

$$\text{Incident} \longrightarrow \text{Symptoms} \longrightarrow \text{Hypotheses} \longrightarrow \mathbf{\text{Failed Attempts (Why They Failed)}} \longrightarrow \mathbf{\text{Successful Fix}} \longrightarrow \text{Root Cause} \longrightarrow \text{Human Feedback}$$

### The Core Product Behavior
When a similar incident occurs later, FAILBACK:
1. Recalls relevant historical experience from **Hindsight**.
2. Identifies matching incidents and failure patterns.
3. Explicitly warns: **"WHAT FAILED BEFORE"** (preventing repeat downtime).
4. Highlights: **"WHAT WORKED"** with historical evidence and confidence ratings.
5. Generates an explainable recommendation answering: *Why this fix? What was considered? What failed before? What is different this time?*
6. Retains new resolution feedback back into Hindsight.

---

## 3. Why Existing Systems are Insufficient

| Capability | Generic Chatbots / LLMs | Static Runbooks / Wikis | Traditional RAG | FAILBACK |
| :--- | :---: | :---: | :---: | :---: |
| **Suggests fixes** | ✅ (Generic) | ✅ (Static) | ✅ (Document match) | ✅ (Evidence-based) |
| **Remembers past failures** | ❌ No | ❌ No | ❌ No | ✅ **Explicit Failure Memory** |
| **Warns against dead-end fixes**| ❌ No | ❌ No | ❌ No | ✅ **Proactive Anti-Pattern Warning** |
| **Persistent Agent Memory** | ❌ Ephemeral | ❌ Manual | ❌ Read-only search | ✅ **Hindsight (Retain/Recall/Reflect)** |
| **Learns from new attempts** | ❌ No | ❌ Slow manual edits | ❌ Requires re-indexing | ✅ **Instant Automatic Retention** |
| **Multi-signal similarity (TEMPR)**| ❌ Token-only | ❌ Keyword search | ❌ Cosine similarity | ✅ **TEMPR Error/Infra Matching** |

---

## 4. System Architecture

```
Engineer
   │
   ▼
FAILBACK Web Console (Next.js 14 + Tailwind CSS + Lucide + Recharts)
   │
   ▼ REST API
FastAPI Backend (Python 3.13)
   │
   ▼ Context Recall & Semantic Matching
┌────────────────────────────────────────────────────────┐
│                   Hindsight Memory                     │
│                                                        │
│ • Incidents              • Failed Attempts & Whys      │
│ • Successful Fixes       • Root Causes                 │
│ • SRE Lessons            • Recurring Failure Patterns  │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
               Incident Analysis Agent
                           │
            ┌──────────────┴──────────────┐
            ▼                             ▼
    Explainable AI Rationale       Historical Failure Warnings
    (Why? What was considered?     (❌ Pod restart failed in 2 prior
     What is different?)            incidents; avoid repeating)
            │
            ▼
    Engineer Action & Resolution Confirmation
            │
            ▼ Retain Structured Memory
Hindsight Memory Bank Updated (Knowledge Base Strengthens)
```

---

## 5. Hindsight Integration

FAILBACK utilizes **Hindsight** as the persistent agent memory layer using the official `hindsight-client` Python SDK (v0.10.1):

- **Bank ID:** `failback-incidents`
- **Core Operations:**
  1. `retain(bank_id, content, metadata, tags)`: Ingests completed incident stories, failed troubleshooting actions, and verified fixes with rich telemetry tags (`service:payment-api`, `error:502`, `outcome:resolved`).
  2. `recall(bank_id, query, tags, budget)`: Recalls multi-signal historical context using TEMPR semantics to match error signatures, service names, and symptom overlap.
  3. `reflect(bank_id, query)`: Synthesizes high-level failure patterns across multiple incidents to identify institutional anti-patterns and rules of thumb.
- **Dual-Mode Engine:** Supports connecting to an external Hindsight cloud/server via `HINDSIGHT_BASE_URL`, while featuring a built-in local embedded Hindsight bank for 100% offline, zero-friction execution.

---

## 6. Key Features & Screens

1. **SRE Command Center Dashboard (`/dashboard`)**:
   - Real-time KPIs: Active Incidents, Resolved Today, Known Failure Patterns, Memory Units, Average Resolution Time, Prevented Repeated Failures.
   - Hindsight institutional memory growth chart over time.
   - Live activity stream of Retained, Recalled, and Reflected operations.
2. **Incident Intake (`/incidents/new`)**:
   - Comprehensive form for manual incident reporting.
   - 1-Click "Load Sample Outage" presets (502 Bad Gateway, DB Pool Exhaustion, Redis Connection Timeouts, Auth0 JWKS Key Rotation).
3. **Incident Detail & Analysis (`/incidents/[id]`)**:
   - Chronological visual timeline of detection, hypotheses, failed attempts, and resolution.
   - **Prominent "WHAT FAILED BEFORE"** card with red badges and failure reasons.
   - **"WHAT WORKED"** card with green badges and success counts.
   - 5-point explainable AI recommendation card.
   - Interactive resolution modal to record resolution or failed attempts into Hindsight.
4. **Before vs After Memory Split Screen (`/compare`)**:
   - Direct side-by-side comparison between stateless generic advice and FAILBACK memory-driven advice.
5. **Interactive 5-Stage Demo Mode (`/demo`)**:
   - Designed for hackathon presentation with 1-click automated or manual stage progression.
6. **Hindsight Memory Explorer (`/memory`)**:
   - Inspect raw and synthesized Hindsight memory units with search and filtering.
7. **Recurring Failure Patterns (`/patterns`)**:
   - Synthesizes recurring failure patterns and engineering anti-patterns.
8. **Grounded SRE Copilot (Drawer)**:
   - Ask: *"What fixes failed?"*, *"What happened last time?"*, *"Why are you recommending this?"*.
   - Strictly grounded in Hindsight memories (no hallucinations).

---

## 7. Synthetic Dataset

Pre-seeded with 20 realistic synthetic incidents covering 10 major outage categories:
1. **API Gateway / 502 Bad Gateway** (Nginx Ingress port mapping mismatch)
2. **Database Connection Pool Exhaustion** (HikariCP / PgBouncer session mode pinning)
3. **Authentication & JWT Failures** (Auth0 JWKS key rotation cache miss)
4. **NTP Clock Skew** (EC2 virtualization drift and future token validation)
5. **Memory Leaks** (Node.js WebSocket event listener leak)
6. **JVM Metaspace Leak** (Dynamic Groovy classloader explosion)
7. **Kubernetes Deployment Drift** (Missing ConfigMap reference in Helm values)
8. **Redis Timeouts & 100% CPU** (Blocking O(N) KEYS command execution)
9. **Kafka Consumer Rebalance Storm** (Poll interval timeout from downstream API latency)
10. **Container OOMKilled** (Linux cgroup v2 memory overhead miscalculation)

---

## 8. Quick Start & Local Setup

### Prerequisites
- Python 3.11+ (Python 3.13 tested)
- Node.js 18+ (Node 24 tested)
- npm 9+

### 1. Clone Repository
```bash
git clone https://github.com/your-org/failback.git
cd failback
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Start FastAPI backend (runs on http://localhost:8000)
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend Setup
```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Next.js development server (runs on http://localhost:3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 9. Environment Variables

Create `.env` at root (or copy `.env.example`):
```env
# Optional: Set to connect to live Hindsight server
HINDSIGHT_BASE_URL=
HINDSIGHT_API_KEY=
HINDSIGHT_BANK_ID=failback-incidents

# Optional: Set for live OpenAI / Gemini LLM completions
OPENAI_API_KEY=
GEMINI_API_KEY=

# Backend & Frontend URLs
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
NEXT_PUBLIC_API_URL=http://localhost:8000
```
*Note: If `HINDSIGHT_BASE_URL` and LLM keys are omitted, FAILBACK automatically uses its embedded local Hindsight bank engine and deterministic SRE reasoning engine.*

---

## 10. Live Hackathon Demo Instructions

1. Open [http://localhost:3000/demo](http://localhost:3000/demo).
2. Click **"Run Memory Learning Demo"** (or click through Stages 1–5):
   - **Stage 1 (Fresh Agent):** Shows incoming 502 error; agent gives generic advice to restart pods.
   - **Stage 2 (Teach FAILBACK):** Seeds 3 historical 502 incidents into Hindsight with explicit failure records.
   - **Stage 3 (New Outage):** Submits similar 502 incident.
   - **Stage 4 (Intelligent Recommendation):** Recalls memories, warns against restarting pods, and recommends inspecting upstream Ingress ConfigMap.
   - **Stage 5 (Learn Again):** Confirms resolution; Hindsight bank increments from 3 to 4 incidents, strengthening the pattern.

---

## 11. Limitations & Future Scope

### Current MVP Limitations
- Advisory only: Does not directly trigger automated production changes (by design for SRE safety).
- Synthetic benchmark dataset used for demonstration.

### Future Roadmap
- Bi-directional PagerDuty, Opsgenie, and Slack bot integrations.
- Automated PR creation to patch recurring configuration drifts.
- Multi-cluster distributed Hindsight federated memory banks.

---

## 12. Team & Acknowledgements

Built with ❤️ for **HackWithHyderabad 3.0** powered by the **Hindsight AI Memory Layer**.
