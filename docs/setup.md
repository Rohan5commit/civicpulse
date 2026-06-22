# Setup Guide

## Prerequisites

- Node.js 20+ (recommended: 20 LTS)
- npm 9+
- NVIDIA NIM API key ([get from build.nvidia.com](https://build.nvidia.com))
- Docker (for Cloud Run deployment)
- Google Cloud CLI (for deployment)

## Local Development

```bash
# Clone the repository
git clone https://github.com/your-username/civicpulse.git
cd civicpulse

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your NVIDIA_API_KEY

# Start development server
npm run dev

# Open http://localhost:3000
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NVIDIA_API_KEY` | Yes | NVIDIA NIM API key for AI inference |
| `NEXT_PUBLIC_APP_NAME` | No | Application name (default: CivicPulse) |

## Seeded Demo Setup

No additional setup required. The demo mode is built-in with three seeded scenarios:

1. **Heatwave + Water Shortage** — 7 signals across Zone A
2. **Local Flooding + Traffic Disruption** — 7 signals across Zone C
3. **Clinic Supply Shortage + Surge** — 7 signals across Zone B

Each scenario includes realistic synthetic data with duplicate clusters, compounding risks, and varying severity levels.

## Running Tests

```bash
# Run all tests
npm test

# Run type checking
npm run build
```

## Project Structure

```
civicpulse/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Landing page
│   ├── layout.tsx         # Shared layout
│   ├── (pages)/           # Route group
│   │   ├── demo/          # Operations board
│   │   ├── incident/[id]/ # Incident detail
│   │   ├── ask/           # Ask CivicPulse
│   │   └── architecture/  # Judge-facing architecture
│   └── api/               # API routes
│       └── ask/           # Ask endpoint
├── lib/                   # Core business logic
│   ├── schemas/           # Zod schemas & types
│   ├── intake/            # Demo data & signal intake
│   ├── normalization/     # Signal normalization
│   ├── scoring/           # Priority scoring & acceleration
│   ├── ai/                # NVIDIA NIM client
│   ├── agents/            # Agent implementations
│   ├── recommendations/   # Action recommendations
│   ├── handoff/           # Handoff generation
│   └── board-utils.ts     # Shared UI utilities
├── docs/                  # Documentation
├── __tests__/             # Test files
├── Dockerfile             # Cloud Run deployment
├── .gcloudignore          # Google Cloud ignore
└── .env.example           # Environment template
```
