import { callNimWithRetry, parseJsonResponse } from "@/lib/ai/nim-client";
import type {
  NormalizedIncident,
  PriorityScore,
  EnrichedContext,
  ActionRecommendation,
  AskResponse,
} from "@/lib/schemas";

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

function generateFallbackAnswer(
  question: string,
  incidents: NormalizedIncident[],
  scores: PriorityScore[],
  selectedIncidentId?: string
): AskResponse {
  const q = question.toLowerCase();
  const ranked = [...scores].sort((a, b) => a.rank - b.rank);

  if (q.includes("why") && q.includes("rank") && q.includes("above")) {
    return {
      answer:
        "The prioritization is based on a weighted composite of urgency, severity, affected population, compounding risk, service criticality, time sensitivity, and signal confidence. The top-ranked incident scores higher across these factors than the comparison incident.",
      groundedIn: ["Priority scoring engine weights", "Incident severity/urgency data"],
      confidence: 0.8,
    };
  }

  if (q.includes("next 30 minutes") || q.includes("what should")) {
    if (ranked.length > 0) {
      const top = incidents.find((i) => i.id === ranked[0].incidentId);
      return {
        answer: `Focus on the #1 priority: ${top?.title}. Immediate action: address the critical situation at ${top?.location.zone} affecting ${top?.affectedPopulation.toLocaleString()} people. Deploy the assigned response team and establish communication channels.`,
        groundedIn: ["Priority ranking #1", "Incident data"],
        confidence: 0.85,
      };
    }
  }

  if (q.includes("risk") && q.includes("delay")) {
    return {
      answer:
        "Delaying response to high-severity incidents can lead to escalation of downstream risks, increased affected population, potential casualties, and broader service disruption. Time-sensitive incidents degrade rapidly without intervention.",
      groundedIn: ["Incident downstream risk analysis", "Time sensitivity scoring"],
      confidence: 0.75,
    };
  }

  if (q.includes("ignore") || q.includes("skip")) {
    const lowRank = ranked[ranked.length - 1];
    if (lowRank) {
      const low = incidents.find((i) => i.id === lowRank.incidentId);
      return {
        answer: `The lowest priority incident is: ${low?.title} (Score: ${lowRank.compositeScore}). This can be deferred as it has lower severity and fewer downstream risks compared to current top priorities.`,
        groundedIn: ["Priority ranking", "Severity comparison"],
        confidence: 0.8,
      };
    }
  }

  if (q.includes("urgent") || q.includes("top priority")) {
    if (ranked.length > 0) {
      const top = incidents.find((i) => i.id === ranked[0].incidentId);
      const topScore = ranked[0];
      return {
        answer: `The most urgent incident is: "${top?.title}" ranked #${topScore.rank} with a priority score of ${topScore.compositeScore}/100. ${topScore.explanation}`,
        groundedIn: [`Priority rank #${topScore.rank}`, "Composite scoring"],
        confidence: 0.9,
      };
    }
  }

  const selected = selectedIncidentId
    ? incidents.find((i) => i.id === selectedIncidentId)
    : undefined;
  if (selected) {
    return {
      answer: `Regarding "${selected.title}": This is a ${selected.type.replace(/_/g, " ")} incident in ${selected.location.zone} with severity ${selected.severity}/10, affecting ${selected.affectedPopulation.toLocaleString()} people. ${selected.downstreamRisk}`,
      groundedIn: [`Incident ${selected.id}`, "Normalized incident data"],
      confidence: 0.85,
    };
  }

  return {
    answer: `There are ${incidents.length} active incidents in the system. The top priority is currently "${incidents.find((i) => i.id === ranked[0]?.incidentId)?.title}". Ask me about specific incidents, priorities, or recommended actions.`,
    groundedIn: ["System state", "Priority queue"],
    confidence: 0.7,
  };
}
