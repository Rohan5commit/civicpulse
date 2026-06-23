import Link from "next/link";
import {
  ArrowRight,
  Activity,
  Zap,
  Target,
  MessageSquare,
  ChevronRight,
  Shield,
  BarChart3,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-blue-500/8 to-transparent rounded-full blur-3xl" />

        <nav className="relative z-10 flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-400" />
            <span className="text-lg font-semibold tracking-tight">CivicPulse</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-400">
            <Link href="/architecture" className="hover:text-white transition-colors">
              Architecture
            </Link>
            <Link href="/ask" className="hover:text-white transition-colors">
              Ask AI
            </Link>
            <Link
              href="/demo"
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors font-medium"
            >
              Try Demo
            </Link>
          </div>
        </nav>

        <div className="relative z-10 max-w-4xl mx-auto px-8 pt-24 pb-32 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-sm text-blue-400 mb-8">
            <Zap className="w-3.5 h-3.5" />
            AI Decision Copilot for Community Operations
          </div>

          <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-6">
            Turn scattered signals into
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              faster, better decisions
            </span>
          </h1>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            CivicPulse unifies live community signals, prioritizes incidents by
            urgency and impact, recommends the next best action, and accelerates
            operator response — all powered by AI agents.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/demo"
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-lg font-semibold transition-all flex items-center gap-2 text-base"
            >
              Try Demo
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/architecture"
              className="border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white px-8 py-3.5 rounded-lg font-semibold transition-all text-base"
            >
              View Architecture
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-8 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">How CivicPulse Works</h2>
        <p className="text-slate-400 text-center mb-16 max-w-xl mx-auto">
          One focused workflow: from scattered signals to confident action, in minutes not hours.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              icon: Activity,
              title: "Collect Signals",
              desc: "Ingest from manual reports, weather feeds, facility status, citizen apps, and more — all normalized into one view.",
              color: "text-blue-400",
              bg: "bg-blue-500/10",
              border: "border-blue-500/20",
            },
            {
              icon: Target,
              title: "Prioritize Incidents",
              desc: "AI-powered scoring considers urgency, severity, population impact, compounding risk, and service criticality.",
              color: "text-orange-400",
              bg: "bg-orange-500/10",
              border: "border-orange-500/20",
            },
            {
              icon: Zap,
              title: "Recommend Actions",
              desc: "For each priority: immediate next step, assignee, resources, safety notes, 30-minute plan, and 24-hour risk.",
              color: "text-green-400",
              bg: "bg-green-500/10",
              border: "border-green-500/20",
            },
            {
              icon: MessageSquare,
              title: "Respond Faster",
              desc: "Generate handoff summaries, field messages, and escalation notes — then hand off with confidence.",
              color: "text-purple-400",
              bg: "bg-purple-500/10",
              border: "border-purple-500/20",
            },
          ].map((step, i) => (
            <div
              key={i}
              className={`relative p-6 rounded-xl border ${step.border} ${step.bg} transition-all hover:scale-[1.02]`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${step.bg}`}>
                  <step.icon className={`w-5 h-5 ${step.color}`} />
                </div>
                <span className="text-xs font-mono text-slate-500">Step {i + 1}</span>
              </div>
              <h3 className="font-semibold text-white mb-2">{step.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
              {i < 3 && (
                <ChevronRight className="hidden md:block absolute top-1/2 -right-4 w-5 h-5 text-slate-600 -translate-y-1/2" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Why This Matters */}
      <section className="py-24 px-8 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">Why This Matters</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "Real Data Intelligence",
                desc: "Not a dashboard. Not a chatbot. A tool that takes action — prioritizing, recommending, and handing off with clear reasoning.",
              },
              {
                icon: BarChart3,
                title: "Measurable Acceleration",
                desc: "Compare manual triage vs AI-assisted triage side by side. See exactly how many minutes and decisions are saved.",
              },
              {
                icon: Zap,
                title: "Agentic AI Pipeline",
                desc: "Five specialized agents work in sequence: intake, enrichment, prioritization, recommendation, and communication — each with clear roles.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="p-8 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/50 transition-colors"
              >
                <item.icon className="w-8 h-8 text-blue-400 mb-4" />
                <h3 className="text-lg font-semibold mb-3">{item.title}</h3>
                <p className="text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-8 text-center">
        <h2 className="text-3xl font-bold mb-6">Ready to see it in action?</h2>
        <p className="text-slate-400 mb-10 max-w-lg mx-auto">
          Experience a live community operations scenario with real AI-powered prioritization and recommendations.
        </p>
        <Link
          href="/demo"
          className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-lg font-semibold transition-all inline-flex items-center gap-2 text-lg"
        >
          Launch Demo
          <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 px-8 text-center text-sm text-slate-500">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span>CivicPulse — Gen AI Academy APAC Edition Cohort 2</span>
          <span>Powered by NVIDIA NIM + Google Cloud Run</span>
        </div>
      </footer>
    </div>
  );
}
