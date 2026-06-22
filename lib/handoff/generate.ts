import { callNimWithRetry, parseJsonResponse } from "@/lib/ai/nim-client";
import type {
  NormalizedIncident,
  EnrichedContext,
  ActionRecommendation,
  HandoffSummary,
} from "@/lib/schemas";

interface AiHandoffResult {
  operatorHandoff: string;
  fieldMessage: string;
  supervisorEscalation: string;
  publicUpdate: string;
}

const SYSTEM_PROMPT = `You are a community operations communications agent. Generate clear, concise handoff summaries. Return ONLY valid JSON matching:
{
  "operatorHandoff": "string - detailed handoff for the next operator on duty (3-5 sentences)",
  "fieldMessage": "string - short WhatsApp/SMS style message for field teams (max 160 chars)",
  "supervisorEscalation": "string - formal escalation summary for supervisor (2-3 sentences)",
  "publicUpdate": "string - safe public-facing update if relevant (2-3 sentences, no sensitive details)"
}`;

export async function generateHandoff(
  incident: NormalizedIncident,
  enriched: EnrichedContext,
  recommendation: ActionRecommendation
): Promise<HandoffSummary> {
  const userMessage = `Incident: ${incident.title}
Severity: ${incident.severity}/10 | Urgency: ${incident.urgency}/10
Location: ${incident.location.address} (${incident.location.zone})
Affected: ${incident.affectedPopulation.toLocaleString()} people
Team: ${enriched.recommendedTeam}
Immediate Action: ${recommendation.immediateNextStep}
Escalation: ${recommendation.escalationLevel}
Key Risk: ${recommendation.twentyFourHourRisk}
Status: ${incident.status}`;

  const response = await callNimWithRetry({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    temperature: 0.3,
    maxTokens: 500,
    jsonMode: true,
  });

  const fallbackResult: AiHandoffResult = {
    operatorHandoff: `${incident.title} reported at ${incident.location.address}. Severity ${incident.severity}/10 affecting ${incident.affectedPopulation.toLocaleString()} people. ${recommendation.immediateNextStep}. Assigned to ${enriched.recommendedTeam}. Monitor for escalation.`,
    fieldMessage: `URGENT: ${incident.title.replace(/(.{40}).*/, "$1...")} — ${incident.location.zone}. Action: ${recommendation.immediateNextStep.slice(0, 80)}`,
    supervisorEscalation: `Escalation: ${incident.title} (${incident.severity}/10 severity, ${incident.urgency}/10 urgency). ${recommendation.escalationLevel} escalation required. ${recommendation.twentyFourHourRisk.slice(0, 150)}`,
    publicUpdate: `Our team is actively responding to a ${incident.type.replace(/_/g, " ")} situation in ${incident.location.zone}. Residents are advised to follow safety guidance from local authorities.`,
  };

  if (!response.success) {
    return {
      incidentId: incident.id,
      ...fallbackResult,
      generatedAt: new Date().toISOString(),
    };
  }

  const parsed = parseJsonResponse<AiHandoffResult>(response.content, fallbackResult);

  return {
    incidentId: incident.id,
    operatorHandoff: parsed.operatorHandoff || fallbackResult.operatorHandoff,
    fieldMessage: parsed.fieldMessage || fallbackResult.fieldMessage,
    supervisorEscalation: parsed.supervisorEscalation || fallbackResult.supervisorEscalation,
    publicUpdate: parsed.publicUpdate || fallbackResult.publicUpdate,
    generatedAt: new Date().toISOString(),
  };
}
