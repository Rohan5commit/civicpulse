"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  Zap,
  Filter,
  MapPin,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Loader2,
  Eye,
} from "lucide-react";
import {
  type NormalizedIncident,
  type PriorityScore,
  type EnrichedContext,
  type ActionRecommendation,
  type AgentRunTrace,
  type AccelerationMetric,
} from "@/lib/schemas";
import { getAllSignals, demoScenarios } from "@/lib/intake/demo-data";
import { normalizeSignals } from "@/lib/normalization/normalize";
import { scoreIncidents } from "@/lib/scoring/priority";
import {
  getSeverityColor,
  getUrgencyColor,
  getScoreColor,
  getRankBadge,
  getTypeIcon,
  formatTimeAgo,
  formatPopulation,
} from "@/lib/board-utils";
import { computeAccelerationMetrics } from "@/lib/scoring/acceleration";

interface DemoState {
  phase: "setup" | "loading" | "ready";
  selectedScenario: string;
  incidents: NormalizedIncident[];
  scores: PriorityScore[];
  enrichments: EnrichedContext[];
  recommendations: ActionRecommendation[];
  traces: AgentRunTrace[];
  metrics: AccelerationMetric[];
}

export default function DemoPage() {
  const [state, setState] = useState<DemoState>({
    phase: "setup",
    selectedScenario: "",
    incidents: [],
    scores: [],
    enrichments: [],
    recommendations: [],
    traces: [],
    metrics: [],
  });
  const [filter, setFilter] = useState<string>("all");
  const [loadingStep, setLoadingStep] = useState("");

  const startDemo = useCallback(async (scenarioId: string) => {
    setState((prev) => ({ ...prev, phase: "loading", selectedScenario: scenarioId }));
    const signals = getAllSignals();

    setLoadingStep("Normalizing incoming signals...");
    await new Promise((r) => setTimeout(r, 800));
    const incidents = normalizeSignals(signals);
    const normalizeTrace: AgentRunTrace = {
      agentName: "Intake & Normalization Agent",
      input: `${signals.length} raw signals from ${new Set(signals.map((s) => s.source)).size} sources`,
      output: `${incidents.length} normalized incidents with duplicate clustering`,
      duration: 800,
      status: "success",
      timestamp: new Date().toISOString(),
    };

    setLoadingStep("Enriching incidents with AI context...");
    await new Promise((r) => setTimeout(r, 1200));
    const enrichments: EnrichedContext[] = incidents.map((inc) => ({
      incidentId: inc.id,
      severity: inc.severity,
      urgency: inc.urgency,
      affectedPopulation: inc.affectedPopulation,
      weatherContext: "High ambient temperature expected; compounding factors for water and health incidents",
      proximityAnalysis: `${inc.duplicates.length} related signals detected in ${inc.location.zone}`,
      compoundingRisk: inc.downstreamRisk,
      duplicateAnalysis: inc.duplicates.length > 0 ? "Clustered with related reports" : "No duplicates",
      estimatedImpact: `Affects ${inc.affectedPopulation.toLocaleString()} people`,
      missingInfo: inc.enrichment?.missingInfo ?? [],
      recommendedTeam: inc.type.replace(/_/g, " ") + " response team",
      escalationLevel: inc.severity >= 9 ? "supervisor" : "none",
    }));
    const enrichTrace: AgentRunTrace = {
      agentName: "Context Enrichment Agent",
      input: `${incidents.length} incidents for context enrichment`,
      output: "Weather, proximity, compounding, and team assignment context generated",
      duration: 1200,
      status: "success",
      timestamp: new Date().toISOString(),
    };

    setLoadingStep("Computing priority scores...");
    await new Promise((r) => setTimeout(r, 600));
    const scores = scoreIncidents(incidents);
    const scoreTrace: AgentRunTrace = {
      agentName: "Priority Scoring Agent",
      input: `${incidents.length} enriched incidents for scoring`,
      output: `Top priority: #1 "${incidents.find((i) => i.id === scores[0]?.incidentId)?.title}" (Score: ${scores[0]?.compositeScore})`,
      duration: 600,
      status: "success",
      timestamp: new Date().toISOString(),
    };

    setLoadingStep("Generating action recommendations...");
    await new Promise((r) => setTimeout(r, 1000));
    const recommendations: ActionRecommendation[] = incidents.map((inc) => ({
      incidentId: inc.id,
      immediateNextStep: `Deploy response team to ${inc.location.zone} for ${inc.type.replace(/_/g, " ")}`,
      suggestedAssignee: `${inc.type.replace(/_/g, " ")} response team`,
      escalationLevel: inc.severity >= 9 ? "supervisor" : "none",
      requiredResources: ["Communication equipment", "Response team personnel"],
      safetyNotes: ["Ensure responder safety protocols are followed"],
      followUpQuestions: ["Is this incident still active?"],
      thirtyMinutePlan: [
        "Dispatch response team to location",
        "Notify relevant department heads",
        "Establish communication channel",
        "Begin resource mobilization",
      ],
      twentyFourHourRisk: inc.downstreamRisk,
    }));
    const actionTrace: AgentRunTrace = {
      agentName: "Action Recommendation Agent",
      input: `${incidents.length} incidents for action planning`,
      output: "Action plans, assignees, and 30-minute roadmaps generated",
      duration: 1000,
      status: "success",
      timestamp: new Date().toISOString(),
    };

    setLoadingStep("Building communications...");
    await new Promise((r) => setTimeout(r, 500));
    const commsTrace: AgentRunTrace = {
      agentName: "Communications Agent",
      input: "Action recommendations for handoff generation",
      output: "Operator handoff, field messages, and escalation summaries ready",
      duration: 500,
      status: "success",
      timestamp: new Date().toISOString(),
    };

    const totalProcessingTime =
      normalizeTrace.duration + enrichTrace.duration + scoreTrace.duration + actionTrace.duration + commsTrace.duration;
    const metrics = computeAccelerationMetrics(incidents.length, totalProcessingTime);

    setState({
      phase: "ready",
      selectedScenario: scenarioId,
      incidents,
      scores,
      enrichments,
      recommendations,
      traces: [normalizeTrace, enrichTrace, scoreTrace, actionTrace, commsTrace],
      metrics,
    });
  }, []);

  const rankedIncidents = state.scores
    .sort((a, b) => a.rank - b.rank)
    .map((score) => ({
      incident: state.incidents.find((i) => i.id === score.incidentId)!,
      score,
      enrichment: state.enrichments.find((e) => e.incidentId === score.incidentId),
    }))
    .filter((item) => item.incident);

  const filteredIncidents = filter === "all"
    ? rankedIncidents
    : rankedIncidents.filter((item) => item.incident.type === filter);

  const types = [...new Set(state.incidents.map((i) => i.type))];

  if (state.phase === "setup") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">CivicPulse Operations Board</h1>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Select a scenario to load the AI-powered incident prioritization engine
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {demoScenarios.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => startDemo(scenario.id)}
                className="group p-6 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/80 transition-all text-left"
              >
                <div className="text-3xl mb-4">{scenario.icon === "Thermometer" ? "🌡️" : scenario.icon === "CloudRain" ? "🌧️" : "🏥"}</div>
                <h3 className="text-lg font-semibold mb-2 group-hover:text-blue-400 transition-colors">
                  {scenario.name}
                </h3>
                <p className="text-sm text-slate-400 mb-4">{scenario.description}</p>
                <div className="flex items-center gap-2 text-sm text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Load scenario <ArrowRight className="w-4 h-4" />
                </div>
                <div className="mt-3 text-xs text-slate-500">
                  {scenario.signals.length} signals from {new Set(scenario.signals.map((s) => s.source)).size} sources
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (state.phase === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-6" />
          <h2 className="text-xl font-semibold mb-3">Processing Signals</h2>
          <p className="text-slate-400">{loadingStep}</p>
        </div>
      </div>
    );
  }

  const topIncident = rankedIncidents[0];

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 px-6 py-4">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Operations Board</h1>
            <p className="text-sm text-slate-400">
              {demoScenarios.find((s) => s.id === state.selectedScenario)?.name} — {state.incidents.length} incidents loaded
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setState({ phase: "setup", selectedScenario: "", incidents: [], scores: [], enrichments: [], recommendations: [], traces: [], metrics: [] });
              }}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
            <Link
              href="/ask"
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              Ask CivicPulse <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Priority Queue */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <Filter className="w-4 h-4 text-slate-500 shrink-0" />
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filter === "all" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                All ({state.incidents.length})
              </button>
              {types.map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    filter === type ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {getTypeIcon(type)} {type.replace(/_/g, " ")}
                </button>
              ))}
            </div>

            {/* Incident List */}
            <div className="space-y-3">
              {filteredIncidents.map(({ incident, score }) => (
                <Link
                  key={incident.id}
                  href={`/incident/${incident.id}`}
                  className="block p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-600 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${getRankBadge(score.rank)}`}>
                      {score.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{getTypeIcon(incident.type)}</span>
                        <h3 className="font-semibold truncate group-hover:text-blue-400 transition-colors">
                          {incident.title}
                        </h3>
                      </div>
                      <p className="text-sm text-slate-400 line-clamp-1 mb-2">{incident.description}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {incident.location.zone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" /> {formatPopulation(incident.affectedPopulation)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatTimeAgo(incident.timestamp)}
                        </span>
                        {incident.duplicates.length > 0 && (
                          <span className="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded text-xs">
                            {incident.duplicates.length + 1} reports
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-lg font-bold ${getScoreColor(score.compositeScore)}`}>
                        {score.compositeScore.toFixed(0)}
                      </div>
                      <div className="text-xs text-slate-500">score</div>
                      <div className="flex gap-1 mt-1">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] border ${getSeverityColor(incident.severity)}`}>
                          S:{incident.severity}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] border ${getUrgencyColor(incident.urgency)}`}>
                          U:{incident.urgency}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Right: Acceleration Panel */}
          <div className="space-y-6">
            {/* Top Priority Quick View */}
            {topIncident && (
              <div className="p-5 rounded-xl bg-slate-900 border border-red-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-sm font-semibold text-red-400">Top Priority</span>
                </div>
                <h3 className="font-bold mb-1">{topIncident.incident.title}</h3>
                <p className="text-sm text-slate-400 mb-3">
                  Score {topIncident.score.compositeScore}/100 — {topIncident.score.explanation.slice(0, 120)}...
                </p>
                <Link
                  href={`/incident/${topIncident.incident.id}`}
                  className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" /> View details & actions
                </Link>
              </div>
            )}

            {/* Decision Acceleration Panel */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" /> Decision Acceleration
              </h3>
              <div className="space-y-4">
                {state.metrics.map((metric, i) => (
                  <div key={i} className="text-sm">
                    <div className="font-medium text-white mb-1">{metric.metric}</div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>Manual: {metric.manualTime}</span>
                      <span className="text-green-400 font-medium">{metric.aiAssistedTime}</span>
                    </div>
                    <div className="text-[11px] text-green-400 font-medium">{metric.improvement}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Agent Pipeline */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
              <h3 className="font-semibold mb-4">Agent Pipeline</h3>
              <div className="space-y-3">
                {state.traces.map((trace, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-white">{trace.agentName}</div>
                      <div className="text-xs text-slate-400">{trace.output.slice(0, 60)}...</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{trace.duration}ms</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
