import { callNimWithRetry, parseJsonResponse } from "@/lib/ai/nim-client";
import type {
  NormalizedIncident,
  PriorityScore,
  EnrichedContext,
  ActionRecommendation,
  AskResponse,
} from "@/lib/schemas";
import { generateFallbackAnswer } from "@/lib/ask-fallback";

interface AiAskResult {
  answer: string;
  groundedIn: string[];
  confidence: number;
}

const SYSTEM_PROMPT = `You are CivicPulse, a community operations AI assistant. You answer questions grounded ONLY in the provided incident data and system state. Never invent facts. Be concise and direct. Return ONLY valid JSON:
{
  "answer": "string - direct answer grounded in data",
  "groundedIn": ["string - which data points support this answer"],
  "confidence": number
}`;

export async function answerQuestion(
  question: string,
  incidents: NormalizedIncident[],
  scores: PriorityScore[],
  enrichments: EnrichedContext[],
  recommendations: ActionRecommendation[],
  selectedIncidentId?: string
): Promise<AskResponse> {
  const context = buildContextString(
    incidents,
    scores,
    enrichments,
    recommendations,
    selectedIncidentId
  );

  const userMessage = `System State:
${context}

Operator Question: ${question}

Answer based ONLY on the data above. If the data doesn't support an answer, say so.`;

  const response = await callNimWithRetry({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    temperature: 0.1,
    maxTokens: 400,
    jsonMode: true,
  });

  const fallback = generateFallbackAnswer(
    question,
    incidents,
    scores,
    selectedIncidentId
  );

  if (!response.success) {
    return fallback;
  }

  const parsed = parseJsonResponse<AiAskResult>(response.content, {
    answer: fallback.answer,
    groundedIn: fallback.groundedIn,
    confidence: fallback.confidence,
  });

  return {
    answer: parsed.answer || fallback.answer,
    groundedIn: parsed.groundedIn?.length ? parsed.groundedIn : fallback.groundedIn,
    confidence: typeof parsed.confidence === "number" ? parsed.confidence : fallback.confidence,
  };
}

function buildContextString(
  incidents: NormalizedIncident[],
  scores: PriorityScore[],
  enrichments: EnrichedContext[],
  recommendations: ActionRecommendation[],
  selectedIncidentId?: string
): string {
  const lines: string[] = [
    `Total active incidents: ${incidents.length}`,
    `Incidents triaged at: ${new Date().toISOString()}`,
    "",
    "PRIORITY QUEUE (ranked):",
  ];

  const ranked = [...scores].sort((a, b) => a.rank - b.rank);
  for (const score of ranked.slice(0, 5)) {
    const inc = incidents.find((i) => i.id === score.incidentId);
    if (!inc) continue;
    const rec = recommendations.find((r) => r.incidentId === inc.id);
    lines.push(
      `#${score.rank} [Score: ${score.compositeScore}] ${inc.title} — Severity ${inc.severity}/10, Urgency ${inc.urgency}/10, ${inc.affectedPopulation.toLocaleString()} affected, Zone ${inc.location.zone}${rec ? `, Action: ${rec.immediateNextStep.slice(0, 80)}` : ""}`
    );
  }

  if (selectedIncidentId) {
    const sel = incidents.find((i) => i.id === selectedIncidentId);
    const selScore = scores.find((s) => s.incidentId === selectedIncidentId);
    const selEnrich = enrichments.find((e) => e.incidentId === selectedIncidentId);
    if (sel) {
      lines.push(
        "",
        `SELECTED INCIDENT: ${sel.title}`,
        `Type: ${sel.type.replace(/_/g, " ")}`,
        `Severity: ${sel.severity}/10 | Urgency: ${sel.urgency}/10`,
        `Affected: ${sel.affectedPopulation.toLocaleString()} | Zone: ${sel.location.zone}`,
        `Status: ${sel.status} | Confidence: ${(sel.confidence * 100).toFixed(0)}%`,
        `Duplicates: ${sel.duplicates.length} related reports`,
        `Risk: ${sel.downstreamRisk}`,
        selScore ? `Priority Rank: #${selScore.rank} (Score: ${selScore.compositeScore})` : "",
        selEnrich
          ? `Team: ${selEnrich.recommendedTeam} | Escalation: ${selEnrich.escalationLevel}`
          : "",
      );
    }
  }

  return lines.join("\n");
}
