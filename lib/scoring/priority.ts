import type { NormalizedIncident } from "@/lib/schemas";
import { PriorityScoreSchema } from "@/lib/schemas";
import type { z } from "zod";

type PriorityScore = z.infer<typeof PriorityScoreSchema>;

const WEIGHTS = {
  urgency: 20,
  severity: 15,
  populationImpact: 15,
  compoundingRisk: 12,
  timeSensitivity: 10,
  resourceConstraint: 8,
  locationContext: 7,
  signalConfidence: 5,
  duplicatePenalty: 3,
  serviceCriticality: 11,
};

function normalize(value: number, max: number): number {
  return Math.max(0, Math.min(1, value / max));
}

function computeUrgencyScore(incident: NormalizedIncident): number {
  return normalize(incident.urgency, 10) * 100;
}

function computeSeverityScore(incident: NormalizedIncident): number {
  return normalize(incident.severity, 10) * 100;
}

function computePopulationImpact(incident: NormalizedIncident): number {
  if (incident.affectedPopulation === 0) return 10;
  if (incident.affectedPopulation > 10000) return 100;
  if (incident.affectedPopulation > 5000) return 85;
  if (incident.affectedPopulation > 1000) return 70;
  if (incident.affectedPopulation > 500) return 50;
  return 30;
}

function computeCompoundingRisk(incident: NormalizedIncident): number {
  const risk = incident.downstreamRisk;
  if (!risk) return 10;
  const factors = risk.split(";").length;
  if (factors >= 3) return 95;
  if (factors === 2) return 70;
  if (factors === 1) return 45;
  return 10;
}

function computeTimeSensitivity(incident: NormalizedIncident): number {
  const age = Date.now() - new Date(incident.timestamp).getTime();
  const hours = age / 3600000;
  if (hours < 0.5) return 95;
  if (hours < 1) return 85;
  if (hours < 2) return 70;
  if (hours < 4) return 55;
  if (hours < 8) return 40;
  return 25;
}

function computeResourceConstraint(incident: NormalizedIncident): number {
  if (incident.type === "clinic_shortage") return 90;
  if (incident.type === "electricity_issue") return 75;
  if (incident.type === "water_outage") return 80;
  if (incident.type === "building_damage") return 85;
  return 50;
}

function computeLocationContext(incident: NormalizedIncident): number {
  if (incident.location.zone === "All") return 90;
  const criticalZones = ["Zone A", "Zone C"];
  if (criticalZones.includes(incident.location.zone)) return 75;
  return 50;
}

function computeSignalConfidence(incident: NormalizedIncident): number {
  return incident.confidence * 100;
}

function computeDuplicatePenalty(incident: NormalizedIncident): number {
  return incident.duplicates.length > 0 ? 80 : 0;
}

function computeServiceCriticality(incident: NormalizedIncident): number {
  return normalize(incident.serviceCriticality, 10) * 100;
}

function generateExplanation(
  incident: NormalizedIncident,
  scores: ReturnType<typeof computeBreakdown>
): string {
  const topFactors: [string, number][] = [
    ["urgency", scores.urgencyScore],
    ["severity", scores.severityScore],
    ["population impact", scores.populationImpact],
    ["compounding risk", scores.compoundingRisk],
    ["service criticality", scores.serviceCriticality],
  ];

  topFactors.sort((a, b) => b[1] - a[1]);
  const top2 = topFactors.slice(0, 2);

  let explanation = `This incident is ranked highly primarily due to ${top2[0][0]} (score: ${top2[0][1].toFixed(0)}/100) and ${top2[1][0]} (score: ${top2[1][1].toFixed(0)}/100). `;

  if (incident.affectedPopulation > 5000) {
    explanation += `It affects ${incident.affectedPopulation.toLocaleString()} people, amplifying impact. `;
  }
  if (incident.duplicates.length > 0) {
    explanation += `${incident.duplicates.length} related reports confirm this issue, increasing signal confidence. `;
  }
  if (incident.serviceCriticality >= 8) {
    explanation += `This involves a critical service (${incident.type.replace(/_/g, " ")}). `;
  }

  return explanation;
}

function computeBreakdown(incident: NormalizedIncident) {
  return {
    urgencyScore: computeUrgencyScore(incident),
    severityScore: computeSeverityScore(incident),
    populationImpact: computePopulationImpact(incident),
    compoundingRisk: computeCompoundingRisk(incident),
    timeSensitivity: computeTimeSensitivity(incident),
    resourceConstraint: computeResourceConstraint(incident),
    locationContext: computeLocationContext(incident),
    signalConfidence: computeSignalConfidence(incident),
    duplicatePenalty: computeDuplicatePenalty(incident),
    serviceCriticality: computeServiceCriticality(incident),
  };
}

export function scoreIncidents(
  incidents: NormalizedIncident[]
): PriorityScore[] {
  const scored = incidents.map((incident) => {
    const breakdown = computeBreakdown(incident);

    const compositeScore =
      breakdown.urgencyScore * (WEIGHTS.urgency / 100) +
      breakdown.severityScore * (WEIGHTS.severity / 100) +
      breakdown.populationImpact * (WEIGHTS.populationImpact / 100) +
      breakdown.compoundingRisk * (WEIGHTS.compoundingRisk / 100) +
      breakdown.timeSensitivity * (WEIGHTS.timeSensitivity / 100) +
      breakdown.resourceConstraint * (WEIGHTS.resourceConstraint / 100) +
      breakdown.locationContext * (WEIGHTS.locationContext / 100) +
      breakdown.signalConfidence * (WEIGHTS.signalConfidence / 100) +
      -breakdown.duplicatePenalty * (WEIGHTS.duplicatePenalty / 100) +
      breakdown.serviceCriticality * (WEIGHTS.serviceCriticality / 100);

    const normalizedScore = Math.max(0, Math.min(100, compositeScore));

    return {
      incidentId: incident.id,
      compositeScore: Math.round(normalizedScore * 10) / 10,
      rank: 0,
      breakdown,
      explanation: "",
      aiReasoning: "",
    };
  });

  scored.sort((a, b) => b.compositeScore - a.compositeScore);
  scored.forEach((s, i) => {
    s.rank = i + 1;
  });

  for (const score of scored) {
    const incident = incidents.find((i) => i.id === score.incidentId);
    if (incident) {
      score.explanation = generateExplanation(incident, score.breakdown);
    }
  }

  return scored;
}
