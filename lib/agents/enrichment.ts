import { callNimWithRetry, parseJsonResponse } from "@/lib/ai/nim-client";
import type { NormalizedIncident, EnrichedContext } from "@/lib/schemas";

interface AiEnrichmentResult {
  weatherContext: string;
  proximityAnalysis: string;
  compoundingRisk: string;
  missingInfo: string[];
  recommendedTeam: string;
  escalationLevel: "none" | "supervisor" | "emergency" | "external";
  aiReasoning: string;
}

const SYSTEM_PROMPT = `You are a community operations AI enrichment agent. Given an incident, provide structured context enrichment. Return ONLY valid JSON matching this schema:
{
  "weatherContext": "string - weather-related risk factors",
  "proximityAnalysis": "string - nearby incident relationships",
  "compoundingRisk": "string - what could worsen this situation",
  "missingInfo": ["string - array of information gaps"],
  "recommendedTeam": "string - best team to assign",
  "escalationLevel": "none|supervisor|emergency|external",
  "aiReasoning": "string - 1-2 sentence reasoning for priority"
}`;

export async function enrichIncident(
  incident: NormalizedIncident,
  maxRetries = 2
): Promise<EnrichedContext> {
  const userMessage = `Incident: ${incident.title}
Type: ${incident.type.replace(/_/g, " ")}
Severity: ${incident.severity}/10
Urgency: ${incident.urgency}/10
Affected Population: ${incident.affectedPopulation.toLocaleString()}
Location: ${incident.location.address} (${incident.location.zone})
Description: ${incident.description}
Duplicate reports: ${incident.duplicates.length}
Service Criticality: ${incident.serviceCriticality}/10
Current Status: ${incident.status}`;

  const response = await callNimWithRetry({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    temperature: 0.2,
    maxTokens: 512,
    jsonMode: true,
  }, maxRetries);

  const fallback: AiEnrichmentResult = {
    weatherContext: "Weather data not available via AI",
    proximityAnalysis: "Proximity analysis pending",
    compoundingRisk: incident.downstreamRisk,
    missingInfo: incident.enrichment?.missingInfo ?? [],
    recommendedTeam: determineTeam(incident.type),
    escalationLevel: incident.severity >= 9 ? "supervisor" : "none",
    aiReasoning: `Incident rated ${incident.severity}/10 severity with ${incident.affectedPopulation} people affected.`,
  };

  if (!response.success) {
    return buildEnrichedContext(incident, fallback);
  }

  const parsed = parseJsonResponse<AiEnrichmentResult>(response.content, fallback);

  return buildEnrichedContext(incident, {
    weatherContext: parsed.weatherContext || fallback.weatherContext,
    proximityAnalysis: parsed.proximityAnalysis || fallback.proximityAnalysis,
    compoundingRisk: parsed.compoundingRisk || fallback.compoundingRisk,
    missingInfo: parsed.missingInfo?.length ? parsed.missingInfo : fallback.missingInfo,
    recommendedTeam: parsed.recommendedTeam || fallback.recommendedTeam,
    escalationLevel: parsed.escalationLevel || fallback.escalationLevel,
    aiReasoning: parsed.aiReasoning || fallback.aiReasoning,
  });
}

function determineTeam(type: string): string {
  const teamMap: Record<string, string> = {
    water_outage: "Water & Utilities Response Team",
    road_flooding: "Emergency Services & Road Maintenance",
    waste_pileup: "Sanitation & Waste Management",
    clinic_shortage: "Health Services Coordination",
    heatwave_alert: "Public Safety & Welfare Team",
    electricity_issue: "Power Grid Response Unit",
    safety_complaint: "Safety & Compliance Officers",
    traffic_disruption: "Traffic Management Cell",
    noise_complaint: "Municipal Enforcement",
    building_damage: "Structural Engineering & Safety",
    other: "General Operations Team",
  };
  return teamMap[type] || "General Operations Team";
}

function buildEnrichedContext(
  incident: NormalizedIncident,
  aiResult: AiEnrichmentResult
): EnrichedContext {
  return {
    incidentId: incident.id,
    severity: incident.severity,
    urgency: incident.urgency,
    affectedPopulation: incident.affectedPopulation,
    weatherContext: aiResult.weatherContext,
    proximityAnalysis: aiResult.proximityAnalysis,
    compoundingRisk: aiResult.compoundingRisk,
    duplicateAnalysis:
      incident.duplicates.length > 0
        ? `${incident.duplicates.length} related reports detected - likely same incident`
        : "No duplicate reports detected",
    estimatedImpact: `Affects ${incident.affectedPopulation.toLocaleString()} people in ${incident.location.zone}`,
    missingInfo: aiResult.missingInfo,
    recommendedTeam: aiResult.recommendedTeam,
    escalationLevel: aiResult.escalationLevel,
  };
}

export async function enrichAllIncidents(
  incidents: NormalizedIncident[]
): Promise<EnrichedContext[]> {
  return Promise.all(incidents.map(enrichIncident));
}
