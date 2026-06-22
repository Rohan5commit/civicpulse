# CivicPulse

**AI Decision Copilot for Faster Community Operations**

> Turn scattered live community signals into prioritized incidents, recommended actions, and faster response decisions.

---

## Challenge Target

**Gen AI Academy APAC Edition Cohort 2** — AI for Better Living and Smarter Communities

CivicPulse is a data intelligence tool that helps community operators make faster and better decisions by unifying live signals, prioritizing incidents with AI-powered scoring, and recommending the next best action.

## Problem

Community operations teams — housing societies, NGOs, campus facilities, local administrators — face fragmented signals across multiple sources (manual reports, weather feeds, facility status, citizen complaints). Prioritization under pressure is hard. An operator receiving 15+ simultaneous reports during a heatwave must decide: which issue threatens the most people? Which one is compounding? Which team should respond first?

## Solution

CivicPulse ingests all signals, normalizes them into a common model, enriches them with AI context, ranks them with a transparent 10-factor scoring engine, and generates actionable recommendations and handoff summaries — all in seconds.

**Core workflow:** `ingest → enrich → prioritize → recommend → explain → hand off`

## How the Agent Pipeline Works

CivicPulse uses a 5-agent pipeline:

1. **Intake & Normalization Agent** — Receives raw signals from 7+ sources, normalizes into a common incident model, detects duplicate clusters via spatial + temporal proximity
2. **Context Enrichment Agent** — Uses NVIDIA NIM to analyze weather context, proximity to other incidents, compounding risks, and assign recommended response teams
3. **Priority Scoring Agent** — Scores incidents on 10 factors (urgency, severity, population impact, compounding risk, time sensitivity, resource constraints, location context, signal confidence, duplicate clustering, service criticality) and produces explainable rankings
4. **Action Recommendation Agent** — Generates immediate next steps, 30-minute action plans, required resources, safety notes, and 24-hour risk assessments
5. **Communications / Handoff Agent** — Produces operator handoff summaries, field messages (WhatsApp/SMS style), supervisor escalation notes, and public update drafts

## How Acceleration is Demonstrated

The **Decision Acceleration Panel** compares manual vs AI-assisted metrics:

| Metric | Manual | AI-Assisted |
|--------|--------|-------------|
| Time to identify top priority | 5-8 min | <1 sec |
| Time to prepare response summary | 10-15 min | Instant |
| Issues triaged per minute | 1-2 | 20+ |
| Duplicate review effort | 30-40% | <5% |

## Google Cloud Architecture

- **Google Cloud Run** — Primary deployment target (free tier: 2M requests/mo)
- **Google Artifact Registry** — Container image storage
- **NVIDIA NIM API** — All AI inference (meta/llama-3.1-8b-instruct)

**Cost commitment:** Runs entirely within Google Cloud free tier. No billing required.

## NVIDIA NIM Usage

- All AI inference through NVIDIA NIM API (`integrate.api.nvidia.com`)
- Model: `meta/llama-3.1-8b-instruct`
- Structured JSON outputs with schema validation
- Retry logic with fallback to deterministic scoring
- Used for: context enrichment, recommendation generation, explanation generation, communications drafting

## Setup

### Prerequisites

- Node.js 20+
- npm
- NVIDIA NIM API key (get from build.nvidia.com)

### Local Development

```bash
# Clone the repository
git clone https://github.com/your-username/civicpulse.git
cd civicpulse

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env and add your NVIDIA_API_KEY

# Run development server
npm run dev

# Open http://localhost:3000
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NVIDIA_API_KEY` | Yes | NVIDIA NIM API key for AI inference |
| `NEXT_PUBLIC_APP_NAME` | No | Application name (default: CivicPulse) |

## Cloud Run Deployment

```bash
# Build the Docker image
docker build -t gcr.io/YOUR_PROJECT_ID/civicpulse .

# Push to Artifact Registry
docker push gcr.io/YOUR_PROJECT_ID/civicpulse

# Deploy to Cloud Run
gcloud run deploy civicpulse \
  --image gcr.io/YOUR_PROJECT_ID/civicpulse \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NVIDIA_API_KEY=your-key-here
```

Or using source-based deployment:
```bash
gcloud run deploy civicpulse --source . --platform managed --region us-central1
```

## Demo Flow

1. Open the app → Landing page with value proposition
2. Click "Try Demo" → Select a scenario (Heatwave + Water Shortage, Flooding + Traffic, or Clinic Supply Shortage)
3. Watch the AI pipeline process: normalize → enrich → score → recommend
4. Browse the ranked priority queue with severity/urgency badges
5. Click the top incident → See why it was prioritized, score breakdown, and AI enrichment
6. Switch to "Actions & Plan" tab → See immediate next step, resources, safety notes, 30-min plan
7. Click "Generate Handoff" → Get operator handoff, field message, escalation note, public update
8. Go to "Ask CivicPulse" → Ask questions grounded in system state
9. View Architecture page → See full agent pipeline and Google Cloud usage

## Limitations

- Demo mode uses seeded synthetic data (not live feeds)
- AI enrichment falls back to deterministic scoring when NIM API is unavailable
- No persistent database — state is session-based
- Single-region deployment (no multi-region failover)

## Future Work

- Real-time data feeds via Pub/Sub and Cloud Scheduler
- BigQuery integration for historical analytics
- Multi-tenant support for different organizations
- Mobile-responsive field interface
- Integration with real weather and traffic APIs
- Google ADK integration for production agent orchestration
- Push notifications for critical incidents

## Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, lucide-react
- **Validation:** Zod
- **AI:** NVIDIA NIM (meta/llama-3.1-8b-instruct)
- **Deployment:** Google Cloud Run, Docker
- **CI/CD:** GitHub Actions

---

Built for Gen AI Academy APAC Edition Cohort 2 Hackathon
