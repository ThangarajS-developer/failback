# FAILBACK Hackathon Live Pitch & Demo Script (HackWithHyderabad 3.0)

> **Duration:** 3–5 Minutes  
> **Target Audience:** Hackathon Judges, SREs, DevOps Engineers, AI Architects

---

## 1. The Hook (30 Seconds)

> *"Judges, imagine it's 2:00 AM. Production is down with a 502 Bad Gateway. Your on-call engineer reflexively restarts the pods. Ten minutes later, the error persists. They increase timeouts. The outage spreads. Finally, forty minutes later, they discover a port mismatch in the Ingress ConfigMap.*
> 
> *Here is the tragedy: three weeks ago, a different engineer on the team faced the exact same 502 error, tried restarting the service, failed, and resolved it via the Ingress ConfigMap.*
> 
> *Current incident management systems and chatbots only remember how incidents were fixed. They don't remember the failed attempts along the way.*
> 
> *Meet **FAILBACK**: The Failure-Aware Incident Learning Agent powered by **Hindsight**. Our core mission: **Your team's failed fixes shouldn't have to fail twice.**"*

---

## 2. Live Demo Walkthrough (2.5 Minutes)

### Step 1: Open FAILBACK
1. Navigate to the **Landing Page** (`/`).
2. Point out the animated learning flow: `INCIDENT` $\rightarrow$ `MEMORY` $\rightarrow$ `FAILED ATTEMPTS` $\rightarrow$ `PROVEN FIXES` $\rightarrow$ `LEARNING`.
3. Click **"Run Memory Learning Demo"** (`/demo`).

### Step 2: Show Stage 1 — Fresh Agent (Zero Memory)
1. Show that the Hindsight memory bank is fresh (0 memories).
2. Point to the incoming incident: *502 Bad Gateway on /v1/checkout*.
3. Highlight the generic advice: *"Restart API pods and increase proxy read timeout."*
4. Explain: *"Without memory, the agent gives the textbook runbook advice that actually exacerbates downtime."*

### Step 3: Teach FAILBACK (Stage 2)
1. Click **"Advance to Stage 2: Teach FAILBACK"**.
2. Show 3 real historical incidents being retained into Hindsight (`INC-042`, `INC-031`, `INC-017`).
3. Point out that FAILBACK records the failed attempts:
   - ❌ Restart Payment API pods: FAILED
   - ❌ Increase proxy read timeout: FAILED
   - ✅ Correct upstream Ingress configuration: SUCCESS

### Step 4: The Outage Strikes (Stage 3 & 4)
1. Click **"Advance to Stage 4: Intelligent Recommendation"**.
2. Show Hindsight recalling the 3 matching memories:
   - **"WHAT FAILED BEFORE"** (Red Card): ❌ Restart service (Failed in 2 incidents), ❌ Increase timeout (Failed in 1 incident).
   - **"WHAT WORKED"** (Green Card): ✅ Correct upstream configuration.
   - **Recommendation**: Investigate upstream port mapping *first* before restarting pods.
3. Highlight the 5-point explainability: *Why this fix? What was considered? What failed before? What is different this time?*

### Step 5: The Learning Loop (Stage 5)
1. Click **"Advance to Stage 5: Learn & Retain Again"**.
2. Show the resolution being confirmed in 5 minutes.
3. Show the live Hindsight memory count incrementing from **3 to 4 incidents**.
4. Show the failure pattern strengthening by +33%.

---

## 3. The Before vs After Proof (30 Seconds)
1. Navigate to **Before vs After** (`/compare`).
2. Show judges the side-by-side split screen:
   - Left: Generic stateless advice that repeats the failed restart.
   - Right: FAILBACK failure-aware advice that cites historical incidents and prevents repeat downtime.

---

## 4. The Closing Line (15 Seconds)

> *"FAILBACK doesn't just remember how incidents were fixed.*  
> ***It remembers how engineers learned to fix them.***  
> *Thank you."*
