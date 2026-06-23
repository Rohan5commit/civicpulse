"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  Loader2,
  Zap,
  Shield,
  FileText,
  Send,
} from "lucide-react";
import {
  type NormalizedIncident,
  type PriorityScore,
  type EnrichedContext,
  type ActionRecommendation,
  type HandoffSummary,
} from "@/lib/schemas";
import { getAllSignals } from "@/lib/intake/demo-data";
import { normalizeSignals } from "@/lib/normalization/normalize";
import { scoreIncidents } from "@/lib/scoring/priority";
import {
  getSeverityColor,
  getUrgencyColor,
  getScoreColor,
  getTypeIcon,
  formatTimeAgo,
  formatPopulation,
} from "@/lib/board-utils";

type Tab = "overview" | "actions" | "handoff";

export default function IncidentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const incidentId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [incident, setIncident] = useState<NormalizedIncident | null>(null);
  const [score, setScore] = useState<PriorityScore | null>(null);
  const [enrichment, setEnrichment] = useState<EnrichedContext | null>(null);
  const [recommendation, setRecommendation] = useState<ActionRecommendation | null>(null);
  const [handoff, setHandoff] = useState<HandoffSummary & { source?: "ai" | "fallback" } | null>(null);
  const [generatingHandoff, setGeneratingHandoff] = useState(false);

  useEffect(() => {
    async function loadIncident() {
      // Try the real agent pipeline via API
      try {
        const signals = getAllSignals();
        const res = await fetch("/api/demo", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-secret": "f2487aebd6c1e8c4160e50b22d197437" },
          body: JSON.stringify({ signals }),
        });
        if (res.ok) {
          const data = await res.json();
          const inc = data.incidents.find((i: NormalizedIncident) => i.id === incidentId);
          const sc = data.scores.find((s: PriorityScore) => s.incidentId === incidentId);
          const en = data.enrichments.find((e: EnrichedContext) => e.incidentId === incidentId);
          const re = data.recommendations.find((r: ActionRecommendation) => r.incidentId === incidentId);
          if (inc) setIncident(inc);
          if (sc) setScore(sc);
          if (en) setEnrichment(en);
          if (re) setRecommendation(re);
          setLoading(false);
          return;
        }
      } catch {
        // Fall through to client-side fallback
      }

      // Client-side fallback: deterministic scoring only
      const signals = getAllSignals();
      const incidents = normalizeSignals(signals);
      const scores = scoreIncidents(incidents);

      const inc = incidents.find((i) => i.id === incidentId);
      const sc = scores.find((s) => s.incidentId === incidentId);

      if (inc) setIncident(inc);
      if (sc) setScore(sc);

      if (inc) {
        setEnrichment({
          incidentId: inc.id, severity: inc.severity, urgency: inc.urgency,
          affectedPopulation: inc.affectedPopulation,
          weatherContext: "High temperature expected; compounding risk for water and health incidents",
          proximityAnalysis: `${inc.duplicates.length} related signals detected nearby`,
          compoundingRisk: inc.downstreamRisk,
          duplicateAnalysis: inc.duplicates.length > 0 ? "Clustered with related reports" : "No duplicates",
          estimatedImpact: `Affects ${inc.affectedPopulation.toLocaleString()} people in ${inc.location.zone}`,
          missingInfo: inc.enrichment?.missingInfo ?? [],
          recommendedTeam: inc.type.replace(/_/g, " ") + " response team",
          escalationLevel: (inc.severity >= 9 ? "supervisor" : "none") as "none" | "supervisor" | "emergency" | "external",
        });
        setRecommendation({
          incidentId: inc.id,
          immediateNextStep: `Deploy ${inc.type.replace(/_/g, " ")} response team to ${inc.location.address} immediately`,
          suggestedAssignee: inc.type.replace(/_/g, " ") + " response team",
          escalationLevel: inc.severity >= 9 ? "supervisor" : "none",
          requiredResources: ["Communication equipment", "Response team personnel", "Transport vehicle", "Emergency supplies"],
          safetyNotes: ["Ensure responder safety protocols are followed", "Establish communication before approach"],
          followUpQuestions: ["Is the incident still active?", "Are there any ground updates?", "Has the affected population been notified?"],
          thirtyMinutePlan: ["Dispatch response team to location", "Notify relevant department heads", "Establish communication with on-ground contacts", "Begin resource mobilization", "Set up incident monitoring"],
          twentyFourHourRisk: inc.downstreamRisk,
        });
      }
      setLoading(false);
    }
    loadIncident();
  }, [incidentId]);

  const generateHandoff = useCallback(async () => {
    if (!incident || !enrichment || !recommendation) return;
    setGeneratingHandoff(true);
    try {
      const res = await fetch("/api/handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-secret": "f2487aebd6c1e8c4160e50b22d197437" },
        body: JSON.stringify({
          incidentId: incident.id,
          incident: {
            title: incident.title,
            type: incident.type,
            severity: incident.severity,
            urgency: incident.urgency,
            affectedPopulation: incident.affectedPopulation,
            location: incident.location,
            downstreamRisk: incident.downstreamRisk,
            status: incident.status,
          },
          enrichment: {
            recommendedTeam: enrichment.recommendedTeam,
            escalationLevel: enrichment.escalationLevel,
          },
          recommendation: {
            immediateNextStep: recommendation.immediateNextStep,
            escalationLevel: recommendation.escalationLevel,
            twentyFourHourRisk: recommendation.twentyFourHourRisk,
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setHandoff(data);
      } else {
        throw new Error("Handoff API failed");
      }
    } catch {
      // Fallback: generate locally
      setHandoff({
        source: "fallback",
        incidentId: incident.id,
        operatorHandoff: `${incident.title} reported at ${incident.location.address}. Severity ${incident.severity}/10 affecting ${incident.affectedPopulation.toLocaleString()} people. ${recommendation.immediateNextStep}. Assigned to ${enrichment.recommendedTeam}. Monitor for escalation in the next 2 hours.`,
        fieldMessage: `URGENT: ${incident.title.slice(0, 40)}... — ${incident.location.zone}. Action needed immediately.`,
        supervisorEscalation: `Escalation: ${incident.title} (${incident.severity}/10 severity, ${incident.urgency}/10 urgency). ${recommendation.escalationLevel} escalation required. ${recommendation.twentyFourHourRisk.slice(0, 150)}`,
        publicUpdate: `Our team is actively responding to a ${incident.type.replace(/_/g, " ")} situation in ${incident.location.zone}. Residents are advised to follow safety guidance from local authorities.`,
        generatedAt: new Date().toISOString(),
      });
    }
    setGeneratingHandoff(false);
    setTab("handoff");
  }, [incident, enrichment, recommendation]);

  if (loading || !incident || !score || !enrichment || !recommendation) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-3">
            <ArrowLeft className="w-4 h-4" /> Back to Board
          </button>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-2xl">{getTypeIcon(incident.type)}</span>
                <h1 className="text-2xl font-bold">{incident.title}</h1>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {incident.location.address}</span>
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {formatPopulation(incident.affectedPopulation)} affected</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {formatTimeAgo(incident.timestamp)}</span>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${getScoreColor(score.compositeScore)}`}>{score.compositeScore}</div>
              <div className="text-xs text-slate-500">Priority Score</div>
              <div className="text-sm font-semibold text-blue-400 mt-1">Rank #{score.rank}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-800 px-6">
        <div className="max-w-6xl mx-auto flex gap-1">
          {(["overview", "actions", "handoff"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? "border-blue-500 text-white"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              {t === "overview" ? "Overview" : t === "actions" ? "Actions & Plan" : "Handoff"}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {tab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Why Prioritized */}
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
                <h2 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400" /> Why This Was Prioritized
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">{score.explanation}</p>
              </div>

              {/* Score Breakdown */}
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
                <h2 className="font-semibold mb-3">Score Breakdown</h2>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(score.breakdown).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between text-sm">
                      <span className="text-slate-400 capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                      <span className={`font-mono ${val >= 70 ? "text-red-400" : val >= 40 ? "text-yellow-400" : "text-slate-400"}`}>
                        {typeof val === "number" ? val.toFixed(0) : val}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Enrichment */}
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
                <h2 className="font-semibold mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" /> AI Enrichment
                </h2>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-slate-400">Weather Context: </span>
                    <span className="text-slate-200">{enrichment.weatherContext}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Compounding Risk: </span>
                    <span className="text-slate-200">{enrichment.compoundingRisk}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Recommended Team: </span>
                    <span className="text-blue-400 font-medium">{enrichment.recommendedTeam}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Escalation Level: </span>
                    <span className={`font-medium capitalize ${
                      enrichment.escalationLevel === "emergency" ? "text-red-400" :
                      enrichment.escalationLevel === "supervisor" ? "text-orange-400" : "text-green-400"
                    }`}>{enrichment.escalationLevel}</span>
                  </div>
                  {enrichment.missingInfo.length > 0 && (
                    <div>
                      <span className="text-slate-400">Missing Information: </span>
                      <ul className="mt-1 space-y-1">
                        {enrichment.missingInfo.map((info, i) => (
                          <li key={i} className="text-yellow-400 text-xs">• {info}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Side */}
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className={`text-xl font-bold ${getSeverityColor(incident.severity).split(" ").find(c => c.startsWith("text-"))}`}>{incident.severity}/10</div>
                    <div className="text-xs text-slate-500">Severity</div>
                  </div>
                  <div>
                    <div className={`text-xl font-bold ${getUrgencyColor(incident.urgency).split(" ").find(c => c.startsWith("text-"))}`}>{incident.urgency}/10</div>
                    <div className="text-xs text-slate-500">Urgency</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-white">{formatPopulation(incident.affectedPopulation)}</div>
                    <div className="text-xs text-slate-500">Affected</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-white">{(incident.confidence * 100).toFixed(0)}%</div>
                    <div className="text-xs text-slate-500">Confidence</div>
                  </div>
                </div>
              </div>

              {incident.duplicates.length > 0 && (
                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <div className="text-sm font-medium text-purple-400 mb-1">
                    Duplicate Cluster ({incident.duplicates.length + 1} reports)
                  </div>
                  <p className="text-xs text-slate-400">
                    Related reports have been auto-clustered. Signal confidence boosted to {(incident.confidence * 100).toFixed(0)}%.
                  </p>
                </div>
              )}

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <h3 className="text-sm font-medium mb-2">Downstream Risk</h3>
                <p className="text-sm text-slate-400">{incident.downstreamRisk}</p>
              </div>

              <Link
                href="/ask"
                className="block p-4 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 hover:bg-blue-600/20 transition-colors text-sm font-medium text-center"
              >
                Ask about this incident →
              </Link>
            </div>
          </div>
        )}

        {tab === "actions" && (
          <div className="max-w-3xl space-y-6">
            {/* Immediate Next Step */}
            <div className="p-5 rounded-xl bg-green-500/10 border border-green-500/20">
              <h2 className="font-semibold mb-2 text-green-400 flex items-center gap-2">
                <Zap className="w-4 h-4" /> Immediate Next Step
              </h2>
              <p className="text-lg text-white font-medium">{recommendation.immediateNextStep}</p>
            </div>

            {/* Assignment & Escalation */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-500 mb-1">Assign To</div>
                <div className="font-medium">{recommendation.suggestedAssignee}</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-500 mb-1">Escalation Level</div>
                <div className={`font-medium capitalize ${
                  recommendation.escalationLevel === "emergency" ? "text-red-400" :
                  recommendation.escalationLevel === "supervisor" ? "text-orange-400" : "text-green-400"
                }`}>{recommendation.escalationLevel}</div>
              </div>
            </div>

            {/* Resources */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" /> Required Resources
              </h2>
              <div className="flex flex-wrap gap-2">
                {recommendation.requiredResources.map((r, i) => (
                  <span key={i} className="bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg text-sm">{r}</span>
                ))}
              </div>
            </div>

            {/* Safety Notes */}
            <div className="p-5 rounded-xl bg-red-500/5 border border-red-500/20">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" /> Safety Notes
              </h2>
              <ul className="space-y-2">
                {recommendation.safetyNotes.map((note, i) => (
                  <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">⚠</span> {note}
                  </li>
                ))}
              </ul>
            </div>

            {/* 30-Minute Plan */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
              <h2 className="font-semibold mb-3">30-Minute Action Plan</h2>
              <div className="space-y-3">
                {recommendation.thirtyMinutePlan.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                      {i + 1}
                    </div>
                    <span className="text-sm text-slate-300 pt-0.5">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 24-Hour Risk */}
            <div className="p-5 rounded-xl bg-orange-500/5 border border-orange-500/20">
              <h2 className="font-semibold mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-400" /> 24-Hour Risk Assessment
              </h2>
              <p className="text-sm text-slate-300">{recommendation.twentyFourHourRisk}</p>
            </div>

            {/* Follow-Up */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
              <h2 className="font-semibold mb-3">Follow-Up Questions</h2>
              <ul className="space-y-2">
                {recommendation.followUpQuestions.map((q, i) => (
                  <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                    <span className="text-blue-400">?</span> {q}
                  </li>
                ))}
              </ul>
            </div>

            {/* Generate Handoff */}
            <button
              onClick={generateHandoff}
              disabled={generatingHandoff}
              className="w-full p-4 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 text-white font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {generatingHandoff ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating Handoff...</>
              ) : (
                <><Send className="w-4 h-4" /> Generate Handoff Summary</>
              )}
            </button>
          </div>
        )}

        {tab === "handoff" && (
          <div className="max-w-3xl space-y-6">
            {!handoff ? (
              <div className="text-center py-16">
                <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">No Handoff Generated Yet</h2>
                <p className="text-slate-400 mb-6">Generate a handoff summary from the Actions tab</p>
                <button
                  onClick={() => setTab("actions")}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Go to Actions
                </button>
              </div>
            ) : (
              <>
                <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
                  <h2 className="font-semibold mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400" /> Operator Handoff Summary
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{handoff.operatorHandoff}</p>
                </div>

                <div className="p-5 rounded-xl bg-green-500/5 border border-green-500/20">
                  <h2 className="font-semibold mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-green-400" /> Field Message (WhatsApp/SMS)
                  </h2>
                  <div className="bg-slate-800 p-4 rounded-lg text-sm text-green-300 font-mono">{handoff.fieldMessage}</div>
                </div>

                <div className="p-5 rounded-xl bg-orange-500/5 border border-orange-500/20">
                  <h2 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-400" /> Supervisor Escalation
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed">{handoff.supervisorEscalation}</p>
                </div>

                <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
                  <h2 className="font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-400" /> Public Update Draft
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed">{handoff.publicUpdate}</p>
                </div>

                {handoff.source === "fallback" && (
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                  <span className="text-xs font-medium text-yellow-400">AI unavailable — using fallback</span>
                </div>
              )}
              <div className="text-xs text-slate-500 text-right">
                  Generated at {new Date(handoff.generatedAt).toLocaleTimeString()}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
