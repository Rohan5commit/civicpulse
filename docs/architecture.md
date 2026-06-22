# Architecture

## System Overview

CivicPulse is an AI-native data intelligence application built as a Next.js 15 application deployed on Google Cloud Run. It uses NVIDIA NIM for all AI inference and follows a 5-agent pipeline architecture.

## Ingest → Enrich → Prioritize → Recommend → Handoff Flow

### 1. Data Ingestion Layer
- Accepts signals from multiple sources: manual reports, CSV/JSON feeds, weather API, traffic API, facility status, complaint logs, inventory feeds, citizen apps
- Demo mode uses seeded synthetic data with 3 realistic scenarios

### 2. Normalization Layer
- Converts raw signals into a common `NormalizedIncident` model
- Schema validation via Zod
- Duplicate cluster detection using spatial proximity (<0.005° lat/lng), temporal proximity (<2h), same type, same zone
- Urgency computation from severity, age, affected population, and incident type
- Downstream risk generation

### 3. AI Enrichment (NVIDIA NIM)
- Context Enrichment Agent calls NVIDIA NIM with structured prompts
- Generates: weather context, proximity analysis, compounding risk, recommended team, escalation level
- Falls back to deterministic enrichment if NIM unavailable

### 4. Priority Scoring Engine
- 10-factor weighted composite scoring:
  - Urgency (20%), Severity (15%), Population Impact (15%), Compounding Risk (12%), Time Sensitivity (10%), Resource Constraint (8%), Location Context (7%), Signal Confidence (5%), Duplicate Penalty (-3%), Service Criticality (11%)
- Deterministic base scoring with AI reasoning overlay
- Explainable rankings with factor breakdown

### 5. Action Recommendation (NVIDIA NIM)
- Generates: immediate next step, suggested assignee, escalation level, required resources, safety notes, 30-minute action plan, 24-hour risk assessment
- Fallback to rule-based recommendations

### 6. Communications / Handoff (NVIDIA NIM)
- Generates 4 output formats: operator handoff, field message (SMS/WhatsApp), supervisor escalation, public update
- Audience-aware drafting grounded in system state

## Google Cloud Components

| Component | Role | Free Tier |
|-----------|------|-----------|
| Cloud Run | Application hosting | 2M requests/mo, 180K vCPU-seconds |
| Artifact Registry | Container storage | 0.5 GB |
| GitHub Actions | CI/CD | 2,000 min/mo |

## AI Inference Path

```
Operator Query → API Route → NVIDIA NIM (meta/llama-3.1-8b-instruct) → Structured JSON → Schema Validation → Response
```

## Acceleration Measurement

The Decision Acceleration Panel computes metrics by comparing:
- Manual time estimates (industry benchmarks)
- AI-assisted times (actual pipeline processing time)
- Improvement percentages
