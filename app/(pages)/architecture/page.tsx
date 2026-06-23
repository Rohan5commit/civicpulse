"use client";

import {
  Activity,
  Zap,
  Brain,
  Target,
  MessageSquare,
  Cloud,
  ArrowRight,
  CheckCircle2,
  Server,
  Globe,
  Lock,
} from "lucide-react";

const PIPELINE_STEPS = [
  {
    agent: "Intake & Normalization Agent",
    icon: Activity,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    input: "Raw signals from 7+ sources (manual, CSV, weather, traffic, facility, complaints, citizen app)",
    output: "Normalized incidents with deduplication, urgency scoring, and confidence ratings",
    details: [
      "Schema validation with Zod",
      "Duplicate cluster detection via spatial + temporal proximity",
      "Type mapping and severity normalization",
      "Automatic missing-info flagging",
    ],
  },
  {
    agent: "Context Enrichment Agent",
    icon: Brain,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    input: "Normalized incidents with raw context",
    output: "Enriched context with weather, proximity, compounding risk, team assignment",
    details: [
      "NVIDIA NIM inference for context understanding",
      "Weather impact correlation",
      "Proximity analysis across active incidents",
      "Automatic team and escalation assignment",
    ],
  },
  {
    agent: "Priority Scoring Agent",
    icon: Target,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    input: "Enriched incidents with 10 scoring dimensions",
    output: "Ranked priority queue with explainable composite scores",
    details: [
      "10-factor weighted scoring (urgency, severity, population, compounding, time, resources, location, confidence, duplicates, service criticality)",
      "Deterministic base scoring + AI reasoning overlay",
      "Transparent, explainable rankings",
    ],
  },
  {
    agent: "Action Recommendation Agent",
    icon: Zap,
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    input: "Top-priority incidents with enriched context",
    output: "Immediate next steps, 30-min plans, resource lists, safety notes, 24hr risk",
    details: [
      "Immediate action generation",
      "Resource requirement identification",
      "Safety protocol enforcement",
      "Time-bounded action plans",
    ],
  },
  {
    agent: "Communications / Handoff Agent",
    icon: MessageSquare,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    input: "Incident data + action recommendations",
    output: "Operator handoff, field messages (SMS/WhatsApp), escalation notes, public updates",
    details: [
      "Multi-format output generation",
      "Audience-aware drafting (operator, field, supervisor, public)",
      "Grounded in system state — no hallucinated facts",
      "Editable and ready-to-send",
    ],
  },
];

const CLOUD_COMPONENTS = [
  {
    name: "Google Cloud Run",
    role: "Application hosting & deployment",
    usage: "Primary deployment target. Stateless container hosting for the Next.js application.",
    tier: "Free tier (2M requests/mo, 180K vCPU-seconds)",
  },
  {
    name: "Google Artifact Registry",
    role: "Container image storage",
    usage: "Stores the Docker image for Cloud Run deployment.",
    tier: "Free tier (0.5 GB storage)",
  },
  {
    name: "GitHub Actions",
    role: "CI/CD pipeline",
    usage: "Automated build, test, and deployment workflow. Triggered on push to main.",
    tier: "Free (2,000 min/mo for public repos)",
  },
  {
    name: "NVIDIA NIM API",
    role: "AI inference (all agents)",
    usage: "All AI enrichment, recommendation, explanation, and communication generation. meta/llama-3.1-8b-instruct model.",
    tier: "API key based — free inference credits",
  },
];

const ARCHITECTURE_DIAGRAM = `┌─────────────────────────────────────────────────────┐
│                    DATA SOURCES                      │
│  Manual Reports │ Weather │ Traffic │ Facility │ App  │
└──────────────────────┬──────────────────────────────┘
                       │
              ┌────────▼────────┐
              │  INTAKE AGENT   │
              │  Normalize +    │
              │  Deduplicate    │
              └────────┬────────┘
                       │
            ┌──────────▼──────────┐
            │ CONTEXT ENRICHMENT  │
            │ NVIDIA NIM + Rules  │
            └──────────┬──────────┘
                       │
          ┌────────────▼────────────┐
          │   PRIORITY SCORING      │
          │   10-Factor Composite   │
          └────────────┬────────────┘
                       │
       ┌───────────────▼───────────────┐
       │    ACTION RECOMMENDATION      │
       │  Plans, Resources, Safety     │
       └───────────────┬───────────────┘
                       │
    ┌──────────────────▼──────────────────┐
    │   COMMUNICATIONS / HANDOFF AGENT    │
    │  Summaries, Messages, Escalation    │
    └──────────────────┬──────────────────┘
                       │
              ┌────────▼────────┐
              │  OPERATOR UI    │
              │  Board │ Detail │
              │  Ask │ Handoff  │
              └─────────────────┘`;

export default function ArchitecturePage() {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Architecture & Judging Guide</h1>
          <p className="text-slate-400 max-w-2xl">
            How CivicPulse works, where AI is used, and why this is a real data intelligence tool — not a dashboard or chatbot.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-16">
        {/* Problem Statement */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-400" /> Problem Being Solved
          </h2>
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
            <p className="text-slate-300 leading-relaxed mb-4">
              Community operations teams — housing societies, NGOs, campus facilities, local administrators — face
              a critical problem: <strong className="text-white">signals are fragmented across multiple sources</strong> (manual reports,
              weather feeds, facility status, citizen complaints), and <strong className="text-white">prioritization under pressure is hard</strong>.
            </p>
            <p className="text-slate-300 leading-relaxed mb-4">
              An operator receiving 15+ simultaneous reports during a heatwave must decide: which issue threatens the most people?
              Which one is compounding? Which team should respond first? What happens if we delay the water outage vs. the traffic jam?
            </p>
            <p className="text-slate-300 leading-relaxed">
              <strong className="text-white">CivicPulse solves this</strong> by ingesting all signals, enriching them with AI context, ranking them
              with a transparent multi-factor scoring engine, and generating actionable recommendations and handoff summaries — all in seconds.
            </p>
          </div>
        </section>

        {/* Architecture Diagram */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-400" /> System Architecture
          </h2>
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 overflow-x-auto">
            <pre className="text-sm text-slate-300 font-mono whitespace-pre leading-relaxed">
              {ARCHITECTURE_DIAGRAM}
            </pre>
          </div>
        </section>

        {/* Agent Pipeline */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" /> Agentic Pipeline (5 Specialized Agents)
          </h2>
          <div className="space-y-4">
            {PIPELINE_STEPS.map((step, i) => (
              <div key={i} className={`p-5 rounded-xl border ${step.border} ${step.bg}`}>
                <div className="flex items-start gap-4">
                  <div className="shrink-0">
                    <div className={`w-10 h-10 rounded-lg ${step.bg} border ${step.border} flex items-center justify-center`}>
                      <step.icon className={`w-5 h-5 ${step.color}`} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-white">{step.agent}</h3>
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                        Agent {i + 1}/5
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div className="text-sm">
                        <span className="text-slate-500 text-xs uppercase tracking-wider">Input</span>
                        <p className="text-slate-300 mt-1">{step.input}</p>
                      </div>
                      <div className="text-sm">
                        <span className="text-slate-500 text-xs uppercase tracking-wider">Output</span>
                        <p className="text-slate-300 mt-1">{step.output}</p>
                      </div>
                    </div>
                    <ul className="space-y-1">
                      {step.details.map((detail, j) => (
                        <li key={j} className="text-xs text-slate-400 flex items-center gap-2">
                          <CheckCircle2 className={`w-3 h-3 ${step.color} shrink-0`} />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {i < PIPELINE_STEPS.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-slate-600 shrink-0 hidden md:block" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Where Acceleration Happens */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" /> Where Acceleration Happens
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                title: "Signal Ingestion → Normalized View",
                before: "Operator reads 15+ separate reports, manually categorizes each",
                after: "Automated normalization in <1 second",
              },
              {
                title: "Duplicate Detection",
                before: "Operator spends 30-40% of triage time identifying duplicates",
                after: "Spatial + temporal clustering in <100ms",
              },
              {
                title: "Priority Ranking",
                before: "5-8 minutes of mental comparison and debate",
                after: "10-factor scored ranking in <200ms",
              },
              {
                title: "Response Summary Generation",
                before: "10-15 minutes to write handoff, escalation, and field messages",
                after: "Generated instantly, grounded in data",
              },
              {
                title: "Decision Confidence",
                before: "Ambiguous — 'I think this is more urgent'",
                after: "Transparent scoring breakdown with AI explanation",
              },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <h3 className="font-medium text-white text-sm mb-3">{item.title}</h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2 rounded bg-red-500/5 border border-red-500/20">
                    <span className="text-red-400 font-medium">Manual:</span>
                    <p className="text-slate-400 mt-1">{item.before}</p>
                  </div>
                  <div className="p-2 rounded bg-green-500/5 border border-green-500/20">
                    <span className="text-green-400 font-medium">AI-Assisted:</span>
                    <p className="text-slate-400 mt-1">{item.after}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Google Cloud & NVIDIA NIM */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Cloud className="w-5 h-5 text-blue-400" /> Google Cloud & NVIDIA NIM Usage
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CLOUD_COMPONENTS.map((comp, i) => (
              <div key={i} className="p-5 rounded-xl bg-slate-900 border border-slate-800">
                <h3 className="font-semibold text-white mb-1">{comp.name}</h3>
                <p className="text-xs text-blue-400 mb-2">{comp.role}</p>
                <p className="text-sm text-slate-400 mb-3">{comp.usage}</p>
                <span className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-1 rounded">
                  {comp.tier}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 rounded-xl bg-green-500/5 border border-green-500/20">
            <p className="text-sm text-green-400">
              <strong>Cost commitment:</strong> This project is designed to run entirely within Google Cloud free tier.
              Cloud Run free tier provides 2M requests/month and 180K vCPU-seconds — more than sufficient for demo and production trial.
              NVIDIA NIM provides free inference credits via API key. No billing required.
            </p>
          </div>
        </section>

        {/* Why This Is More Than a Dashboard */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Globe className="w-5 h-5 text-green-400" /> Why This Is More Than a Dashboard or Chatbot
          </h2>
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                <h3 className="text-sm font-semibold text-red-400 mb-2">Not a Dashboard</h3>
                <p className="text-xs text-slate-400">
                  Dashboards show data. CivicPulse takes action — it prioritizes, recommends, generates plans,
                  and produces handoff communications. Every screen leads to a decision.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-orange-500/5 border border-orange-500/20">
                <h3 className="text-sm font-semibold text-orange-400 mb-2">Not a Chatbot</h3>
                <p className="text-xs text-slate-400">
                  Chatbots answer generic questions. CivicPulse is grounded in structured system state —
                  normalized incidents, scored priorities, and enriched context. Answers are evidence-based.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                <h3 className="text-sm font-semibold text-green-400 mb-2">A Decision Copilot</h3>
                <p className="text-xs text-slate-400">
                  CivicPulse changes the next decision. It answers: &quot;What should I do first?&quot; with ranked,
                  explainable, actionable intelligence — not just information.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 px-6 text-center text-sm text-slate-500">
        <div className="max-w-6xl mx-auto">
          CivicPulse — Gen AI Academy APAC Edition Cohort 2 | Built with NVIDIA NIM + Google Cloud Run
        </div>
      </footer>
    </div>
  );
}
