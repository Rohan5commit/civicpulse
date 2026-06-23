import type {
  NormalizedIncident,
  PriorityScore,
  AskResponse,
} from "@/lib/schemas";

/**
 * Simple keyword-matched fallback for server-side routes.
 * No incident data needed — returns a generic answer based on question keywords.
 */
export function generateLocalAnswer(question: string): string {
  const q = question.toLowerCase();
  if (q.includes("why") && q.includes("rank")) {
    return "The prioritization is based on a weighted composite of urgency, severity, affected population, compounding risk, service criticality, time sensitivity, and signal confidence. The top-ranked incident scores higher across these factors.";
  }
  if (q.includes("next 30") || q.includes("what should") || q.includes("do first")) {
    return "Focus on the #1 priority incident. Deploy the assigned response team, establish communication with on-ground contacts, and begin resource mobilization immediately.";
  }
  if (q.includes("risk") && q.includes("delay")) {
    return "Delaying response to high-severity incidents leads to escalation of downstream risks, increased affected population, potential casualties, and broader service disruption. Time-sensitive incidents degrade rapidly without intervention.";
  }
  if (q.includes("ignore") || q.includes("skip")) {
    return "The lowest priority incident can be safely deferred as it has lower severity, fewer affected people, and minimal downstream risk compared to current top priorities.";
  }
  return "I can help with questions about incident priorities, recommended actions, risks of delays, and team assignments. Please ask a specific question about your incidents.";
}

/**
 * Pure fallback answer generation — no NIM dependencies.
 * Shared between client components and server-side agent modules.
 */
export function generateFallbackAnswer(
  question: string,
  incidents: NormalizedIncident[],
  scores: PriorityScore[],
  selectedIncidentId?: string
): AskResponse {
  const q = question.toLowerCase();
  const ranked = [...scores].sort((a, b) => a.rank - b.rank);

  if (q.includes("why") && q.includes("rank") && q.includes("above")) {
    if (ranked.length >= 2) {
      const top = incidents.find((i) => i.id === ranked[0].incidentId);
      const second = incidents.find((i) => i.id === ranked[1].incidentId);
      return {
        answer: `The ${top?.type.replace(/_/g, " ")} incident "${top?.title}" (Score: ${ranked[0].compositeScore}) is ranked #1 because it combines high severity (${top?.severity}/10), significant affected population (${top?.affectedPopulation.toLocaleString()}), and strong service criticality. The ${second?.type.replace(/_/g, " ")} incident "${second?.title}" (Score: ${ranked[1].compositeScore}) ranks lower due to fewer compounding factors.`,
        groundedIn: ["Priority scoring engine weights", "Incident severity/urgency data"],
        confidence: 0.8,
      };
    }
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

  if (q.includes("urgent") || q.includes("top priority") || q.includes("most important")) {
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

  if (q.includes("next 30") || q.includes("what should") || q.includes("do first")) {
    if (ranked.length > 0) {
      const top = incidents.find((i) => i.id === ranked[0].incidentId);
      return {
        answer: `Focus immediately on #1 priority: "${top?.title}" in ${top?.location.zone}. Deploy ${top?.type.replace(/_/g, " ")} response team, establish communication with on-ground contacts, and begin resource mobilization. This incident affects ${top?.affectedPopulation.toLocaleString()} people and has a priority score of ${ranked[0].compositeScore}/100.`,
        groundedIn: ["Priority ranking #1", "Incident data"],
        confidence: 0.85,
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
