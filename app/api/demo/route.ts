import { NextResponse } from "next/server";
import { z } from "zod";
import { validateApiSecret } from "@/lib/auth/api-secret";
import { normalizeSignals } from "@/lib/normalization/normalize";
import { scoreIncidents } from "@/lib/scoring/priority";
import { enrichIncident } from "@/lib/agents/enrichment";
import { generateActionRecommendation } from "@/lib/recommendations/actions";
import { computeAccelerationMetrics } from "@/lib/scoring/acceleration";
import type {
  IncidentSignal,
  NormalizedIncident,
  EnrichedContext,
  ActionRecommendation,
} from "@/lib/schemas";

const DemoRequestSchema = z.object({
  signals: z.array(z.object({
    id: z.string(),
    type: z.string(),
    title: z.string(),
    description: z.string(),
    timestamp: z.string(),
    location: z.object({
      address: z.string(),
      lat: z.number(),
      lng: z.number(),
      zone: z.string(),
    }),
    source: z.string(),
    severity: z.number(),
    affectedPopulation: z.number().optional(),
  })).max(30),
});

function enrichmentFallback(incident: NormalizedIncident): EnrichedContext {
  return {
    incidentId: incident.id,
    severity: incident.severity,
    urgency: incident.urgency,
    affectedPopulation: incident.affectedPopulation,
    weatherContext: "Weather data not available via AI",
    proximityAnalysis: "Proximity analysis pending",
    compoundingRisk: incident.downstreamRisk,
    duplicateAnalysis:
      incident.duplicates.length > 0
        ? `${incident.duplicates.length} related reports detected`
        : "No duplicate reports detected",
    estimatedImpact: `Affects ${incident.affectedPopulation.toLocaleString()} people in ${incident.location.zone}`,
    missingInfo: incident.enrichment?.missingInfo ?? [],
    recommendedTeam: incident.type.replace(/_/g, " ") + " response team",
    escalationLevel: incident.severity >= 9 ? "supervisor" : ("none" as const),
  };
}

function recommendationFallback(
  incident: NormalizedIncident,
  enriched: EnrichedContext
): ActionRecommendation {
  return {
    incidentId: incident.id,
    immediateNextStep: `Deploy ${enriched.recommendedTeam} to ${incident.location.address}`,
    suggestedAssignee: enriched.recommendedTeam,
    escalationLevel: enriched.escalationLevel,
    requiredResources: ["Communication equipment", "Response team personnel"],
    safetyNotes: ["Follow safety protocols"],
    followUpQuestions: ["Is the incident still active?"],
    thirtyMinutePlan: [
      "Dispatch response team",
      "Notify department heads",
      "Establish communication",
      "Mobilize resources",
    ],
    twentyFourHourRisk: incident.downstreamRisk || "Situation may escalate if not addressed promptly",
  };
}

export async function POST(request: Request) {
  const authError = validateApiSecret(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const parsed = DemoRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    const signals = parsed.data.signals as IncidentSignal[];

    // Step 1: Normalize
    const normalizeStart = Date.now();
    const incidents = normalizeSignals(signals);
    const normalizeTime = Date.now() - normalizeStart;

    // Step 2: Score (deterministic)
    const scoreStart = Date.now();
    const scores = scoreIncidents(incidents);
    const scoreTime = Date.now() - scoreStart;

    // Step 3: Enrich with AI — parallelized with fallback
    const enrichStart = Date.now();
    const enrichmentResults = await Promise.allSettled(
      incidents.map((inc) => enrichIncident(inc))
    );
    const enrichments = enrichmentResults.map((r, i) =>
      r.status === "fulfilled" ? r.value : enrichmentFallback(incidents[i])
    );
    const enrichTime = Date.now() - enrichStart;

    // Step 4: Generate recommendations — parallelized with fallback
    const actionStart = Date.now();
    const recResults = await Promise.allSettled(
      incidents.map((inc, i) =>
        generateActionRecommendation(inc, enrichments[i])
      )
    );
    const recommendations = recResults.map((r, i) =>
      r.status === "fulfilled"
        ? r.value
        : recommendationFallback(incidents[i], enrichments[i])
    );
    const actionTime = Date.now() - actionStart;

    const totalTime = Date.now() - startTime;

    // Determine enrichment status for traces
    const enrichStatus = enrichmentResults.every((r) => r.status === "fulfilled")
      ? "success"
      : enrichmentResults.every((r) => r.status === "rejected")
        ? "error"
        : ("success" as const);

    const traces = [
      {
        agentName: "Intake & Normalization Agent",
        input: `${signals.length} raw signals`,
        output: `${incidents.length} normalized incidents with duplicate clustering`,
        duration: normalizeTime,
        status: "success" as const,
        timestamp: new Date().toISOString(),
      },
      {
        agentName: "Context Enrichment Agent",
        input: `${incidents.length} incidents for enrichment`,
        output: "Weather, proximity, compounding, and team context generated",
        duration: enrichTime,
        status: enrichStatus as "success" | "fallback" | "error",
        timestamp: new Date().toISOString(),
      },
      {
        agentName: "Priority Scoring Agent",
        input: `${incidents.length} enriched incidents`,
        output: `Top: "${incidents.find((i) => i.id === scores[0]?.incidentId)?.title}" (Score: ${scores[0]?.compositeScore})`,
        duration: scoreTime,
        status: "success" as const,
        timestamp: new Date().toISOString(),
      },
      {
        agentName: "Action Recommendation Agent",
        input: `${recommendations.length} incidents for action planning`,
        output: "Action plans, assignees, and 30-minute roadmaps generated",
        duration: actionTime,
        status: "success" as const,
        timestamp: new Date().toISOString(),
      },
      {
        agentName: "Communications Agent",
        input: "Action recommendations for handoff",
        output: "Handoff generation available on incident detail",
        duration: 0,
        status: "success" as const,
        timestamp: new Date().toISOString(),
      },
    ];

    const metrics = computeAccelerationMetrics(incidents.length, totalTime);

    return NextResponse.json({
      incidents,
      scores,
      enrichments,
      recommendations,
      traces,
      metrics,
      processingTimeMs: totalTime,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
