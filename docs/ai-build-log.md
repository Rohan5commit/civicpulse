# AI Build Log

## CivicPulse — AI-Assisted Development Record

### Phase 1: Project Setup
- Used AI to scaffold Next.js 15 project with TypeScript, Tailwind CSS v4, and shadcn/ui
- AI generated Dockerfile for Cloud Run standalone build
- AI configured next.config.ts for standalone output

### Phase 2: Core Business Logic
- AI designed 10 Zod schemas for the complete data model
- AI implemented normalization layer with duplicate detection (spatial + temporal proximity)
- AI built 10-factor weighted priority scoring engine
- AI created NVIDIA NIM client with retry logic and JSON fallback

### Phase 3: Agent Pipeline
- AI designed 5-agent architecture: Intake, Enrichment, Scoring, Action, Communications
- AI wrote system prompts for each agent with structured JSON output requirements
- AI implemented deterministic fallbacks for all AI-dependent functions
- AI built Ask CivicPulse grounded Q&A with local fallback answers

### Phase 4: Frontend
- AI built 6 pages: Landing, Demo/Board, Incident Detail, Ask, Architecture, Handoff
- AI designed dark-mode operational UI with severity/urgency badges
- AI implemented loading states, error states, and empty states
- AI built Decision Acceleration Panel with comparative metrics

### Phase 5: Deployment
- AI created Dockerfile for Cloud Run
- AI wrote deployment documentation
- AI configured .gcloudignore and environment variables

### Key AI Decisions
1. **Deterministic + AI hybrid scoring** — Scoring engine uses weighted math as base, with AI-generated reasoning overlay. This ensures scores are always reproducible even if NIM is down.
2. **Local fallback for all AI functions** — Every NIM call has a rule-based fallback, ensuring the demo works without API key.
3. **Structured JSON outputs** — All prompts request JSON with schema validation, preventing malformed AI responses from corrupting state.
4. **Free tier compliance** — All Google Cloud usage stays within free tier limits (Cloud Run: 2M requests/mo).

### Models Used
- NVIDIA NIM: `meta/llama-3.1-8b-instruct` for all inference
- Temperature: 0.1-0.3 (low for consistency)
- Max tokens: 400-600 (compact, operational responses)
