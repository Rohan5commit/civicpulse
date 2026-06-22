import { callNimWithRetry, parseJsonResponse } from "@/lib/ai/nim-client";
import type {
  NormalizedIncident,
  EnrichedContext,
  ActionRecommendation,
} from "@/lib/schemas";

interface AiActionResult {
  immediateNextStep: string;
  suggestedAssignee: string;
  escalationLevel: string;
  requiredResources: string[];
  safetyNotes: string[];
  followUpQuestions: string[];
  thirtyMinutePlan: string[];
  twentyFourHourRisk: string;
}

const SYSTEM_PROMPT = `You are a community operations action recommendation agent. Given an enriched incident, generate practical, actionable recommendations. Return ONLY valid JSON matching:
{
  "immediateNextStep": "string - single most important action right now",
  "suggestedAssignee": "string - who should handle this",
  "escalationLevel": "string - none|supervisor|emergency|external",
  "requiredResources": ["string - list of needed resources"],
  "safetyNotes": ["string - safety considerations"],
  "followUpQuestions": ["string - questions operator should ask"],
  "thirtyMinutePlan": ["string - step by step for next 30 minutes"],
  "twentyFourHourRisk": "string - what could go wrong in 24 hours"
}`;

export async function generateActionRecommendation(
  incident: NormalizedIncident,
  enriched: EnrichedContext
): Promise<ActionRecommendation> {
  const userMessage = `Incident: ${incident.title}
Type: ${incident.type.replace(/_/g, " ")}
Severity: ${incident.severity}/10 | Urgency: ${incident.urgency}/10
Affected: ${incident.affectedPopulation.toLocaleString()} people
Location: ${incident.location.address}
Weather Risk: ${enriched.weatherContext}
Compounding Risk: ${enriched.compoundingRisk}
Recommended Team: ${enriched.recommendedTeam}
Escalation: ${enriched.escalationLevel}
Missing Info: ${enriched.missingInfo.join(", ") || "None identified"}
Description: ${incident.description}`;

  const response = await callNimWithRetry({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    temperature: 0.2,
    maxTokens: 600,
    jsonMode: true,
  });

  const fallback: AiActionResult = {
    immediateNextStep: determineImmediateStep(incident, enriched),
    suggestedAssignee: enriched.recommendedTeam,
    escalationLevel: enriched.escalationLevel,
    requiredResources: determineResources(incident),
    safetyNotes: determineSafetyNotes(incident),
    followUpQuestions: [
      "Is this incident still active?",
      "Are there any updates from the ground team?",
    ],
    thirtyMinutePlan: [
      "Dispatch response team to location",
      "Notify relevant department heads",
      "Establish communication channel with on-ground contacts",
      "Begin resource mobilization",
    ],
    twentyFourHourRisk: incident.downstreamRisk || "Situation may escalate if not addressed promptly",
  };

  if (!response.success) {
    return { incidentId: incident.id, ...fallback };
  }

  const parsed = parseJsonResponse<AiActionResult>(response.content, fallback);

  return {
    incidentId: incident.id,
    immediateNextStep: parsed.immediateNextStep || fallback.immediateNextStep,
    suggestedAssignee: parsed.suggestedAssignee || fallback.suggestedAssignee,
    escalationLevel: parsed.escalationLevel || fallback.escalationLevel,
    requiredResources: parsed.requiredResources?.length ? parsed.requiredResources : fallback.requiredResources,
    safetyNotes: parsed.safetyNotes?.length ? parsed.safetyNotes : fallback.safetyNotes,
    followUpQuestions: parsed.followUpQuestions?.length ? parsed.followUpQuestions : fallback.followUpQuestions,
    thirtyMinutePlan: parsed.thirtyMinutePlan?.length ? parsed.thirtyMinutePlan : fallback.thirtyMinutePlan,
    twentyFourHourRisk: parsed.twentyFourHourRisk || fallback.twentyFourHourRisk,
  };
}

function determineImmediateStep(
  incident: NormalizedIncident,
  enriched: EnrichedContext
): string {
  if (incident.type === "water_outage" && incident.severity >= 8) {
    return "Deploy emergency water tankers to affected zones and notify hospital administration";
  }
  if (incident.type === "heatwave_alert") {
    return "Activate heatwave emergency protocol - open cooling centers and distribute water";
  }
  if (incident.type === "road_flooding") {
    return "Block submerged roads, deploy barricades, and reroute traffic immediately";
  }
  if (incident.type === "clinic_shortage") {
    return "Initiate emergency procurement from nearest medical supply depot";
  }
  if (incident.type === "building_damage") {
    return "Evacuate residents from affected building and establish safety perimeter";
  }
  if (incident.type === "electricity_issue") {
    return "Assess electrical safety, de-energize submerged equipment, and deploy backup power";
  }
  if (enriched.escalationLevel === "emergency") {
    return "Escalate to emergency coordination center immediately";
  }
  return `Dispatch ${enriched.recommendedTeam} to assess and respond to the situation`;
}

function determineResources(incident: NormalizedIncident): string[] {
  const base = ["Communication equipment", "Response team personnel"];
  if (incident.type === "water_outage") {
    return [...base, "Emergency water tankers", "Water purification tablets", "Mobile water testing kit"];
  }
  if (incident.type === "heatwave_alert") {
    return [...base, "ORS packets", "Drinking water", "Cooling supplies", "First aid kits"];
  }
  if (incident.type === "road_flooding") {
    return [...base, "Pumping equipment", "Traffic barricades", "High-water vehicle"];
  }
  if (incident.type === "building_damage") {
    return [...base, "Structural assessment tools", "Evacuation transport", "Temporary shelter supplies"];
  }
  return base;
}

function determineSafetyNotes(incident: NormalizedIncident): string[] {
  const notes: string[] = ["Ensure responder safety protocols are followed"];
  if (incident.type === "road_flooding") {
    notes.push("Do not attempt to drive through flooded roads");
    notes.push("Beware of electrical hazards in standing water");
  }
  if (incident.type === "heatwave_alert") {
    notes.push("Responders must take hydration breaks every 30 minutes");
    notes.push("Watch for signs of heat exhaustion in vulnerable populations");
  }
  if (incident.type === "building_damage") {
    notes.push("Do not re-enter damaged structures until cleared by engineer");
    notes.push("Establish minimum 50m safety perimeter");
  }
  if (incident.type === "electricity_issue") {
    notes.push("Treat all downed power lines as live");
    notes.push("Only qualified electricians should handle electrical equipment");
  }
  return notes;
}
