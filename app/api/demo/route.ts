import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeSignals } from "@/lib/normalization/normalize";
import { scoreIncidents } from "@/lib/scoring/priority";
import { enrichIncident } from "@/lib/agents/enrichment";
import { generateActionRecommendation } from "@/lib/recommendations/actions";
import { generateHandoff } from "@/lib/handoff/generate";
import { computeAccelerationMetrics } from "@/lib/scoring/acceleration";
import type { IncidentSignal } from "@/lib/schemas";

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
  })),
});

export async function POST(request: Request) {
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

    // Step 3: Enrich with AI (NIM or fallback)
    const enrichStart = Date.now();
    const enrichments = [];
    for (const incident of incidents) {
      const enrichment = await enrichIncident(incident);
      enrichments.push(enrichment);
    }
    const enrichTime = Date.now() - enrichStart;

    // Step 4: Generate recommendations
    const actionStart = Date.now();
    const recommendations = [];
    for (const incident of incidents) {
      const enrichment = enrichments.find(e => e.incidentId === incident.id);
      if (enrichment) {
        const rec = await generateActionRecommendation(incident, enrichment);
        recommendations.push(rec);
      }
    }
    const actionTime = Date.now() - actionStart;

    const totalTime = Date.now() - startTime;

    // Build agent traces
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
        status: "success" as const,
        timestamp: new Date().toISOString(),
      },
      {
        agentName: "Priority Scoring Agent",
        input: `${incidents.length} enriched incidents`,
        output: `Top: "${incidents.find(i => i.id === scores[0]?.incidentId)?.title}" (Score: ${scores[0]?.compositeScore})`,
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
