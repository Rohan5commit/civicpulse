import type { IncidentSignal, NormalizedIncident } from "@/lib/schemas";
import { NormalizedIncidentSchema } from "@/lib/schemas";

const TYPE_MAP: Record<string, string> = {
  water_outage: "Water Supply Failure",
  road_flooding: "Road Flooding",
  waste_pileup: "Waste Accumulation",
  clinic_shortage: "Medical Supply Shortage",
  heatwave_alert: "Heatwave Alert",
  electricity_issue: "Electricity Failure",
  safety_complaint: "Safety Concern",
  traffic_disruption: "Traffic Disruption",
  noise_complaint: "Noise Issue",
  building_damage: "Structural Damage",
  other: "General Issue",
};

const SERVICE_CRITICALITY: Record<string, number> = {
  water_outage: 9,
  road_flooding: 8,
  clinic_shortage: 10,
  heatwave_alert: 8,
  electricity_issue: 7,
  safety_complaint: 6,
  traffic_disruption: 5,
  waste_pileup: 4,
  noise_complaint: 2,
  building_damage: 9,
  other: 3,
};

function computeUrgency(signal: IncidentSignal): number {
  let urgency = signal.severity;
  const age = Date.now() - new Date(signal.timestamp).getTime();
  const hours = age / 3600000;
  if (hours > 4) urgency = Math.min(10, urgency + 2);
  else if (hours > 2) urgency = Math.min(10, urgency + 1);
  if (signal.affectedPopulation && signal.affectedPopulation > 5000) {
    urgency = Math.min(10, urgency + 1);
  }
  if (
    signal.type === "heatwave_alert" ||
    signal.type === "water_outage" ||
    signal.type === "clinic_shortage"
  ) {
    urgency = Math.min(10, urgency + 1);
  }
  return Math.max(1, Math.min(10, urgency));
}

function computeDownstreamRisk(signal: IncidentSignal): string {
  const risks: string[] = [];
  if (signal.type === "heatwave_alert") {
    risks.push("Heatstroke cases expected to increase");
    risks.push("Power grid overload likely");
  }
  if (signal.type === "water_outage") {
    risks.push("Hygiene-related disease outbreak risk");
    risks.push("Hospital operations may be compromised");
  }
  if (signal.type === "road_flooding") {
    risks.push("Emergency vehicle access compromised");
    risks.push("Electrocution risk from submerged infrastructure");
  }
  if (signal.type === "clinic_shortage") {
    risks.push("Patient outcomes may deteriorate");
    risks.push("Referrals to distant facilities increase burden");
  }
  if (signal.type === "building_damage") {
    risks.push("Structural collapse possible if rain continues");
    risks.push("Mass evacuation may be required");
  }
  if (signal.type === "electricity_issue") {
    risks.push("Critical equipment failure in healthcare facilities");
    risks.push("Water pumping stations may go offline");
  }
  if (risks.length === 0) {
    risks.push("Limited downstream impact expected");
  }
  return risks.join("; ");
}

function detectDuplicates(
  signals: IncidentSignal[]
): Map<string, string[]> {
  const clusters = new Map<string, string[]>();
  const seen = new Set<string>();

  for (let i = 0; i < signals.length; i++) {
    if (seen.has(signals[i].id)) continue;
    const cluster: string[] = [signals[i].id];
    for (let j = i + 1; j < signals.length; j++) {
      if (seen.has(signals[j].id)) continue;
      const sameType = signals[i].type === signals[j].type;
      const sameZone = signals[i].location.zone === signals[j].location.zone;
      const closeTime =
        Math.abs(
          new Date(signals[i].timestamp).getTime() -
            new Date(signals[j].timestamp).getTime()
        ) < 7200000;
      const closeLat =
        Math.abs(signals[i].location.lat - signals[j].location.lat) < 0.005;
      const closeLng =
        Math.abs(signals[i].location.lng - signals[j].location.lng) < 0.005;

      if (sameType && sameZone && closeTime && closeLat && closeLng) {
        cluster.push(signals[j].id);
        seen.add(signals[j].id);
      }
    }
    if (cluster.length > 1) {
      for (const id of cluster) {
        clusters.set(id, cluster.filter((c) => c !== id));
      }
    }
    seen.add(signals[i].id);
  }
  return clusters;
}

export function normalizeSignals(
  signals: IncidentSignal[]
): NormalizedIncident[] {
  const duplicateClusters = detectDuplicates(signals);
  const enriched: NormalizedIncident[] = [];

  for (const signal of signals) {
    const urgency = computeUrgency(signal);
    const downstreamRisk = computeDownstreamRisk(signal);
    const duplicates = duplicateClusters.get(signal.id) || [];
    const serviceCriticality = SERVICE_CRITICALITY[signal.type] || 3;

    const missingInfo: string[] = [];
    if (!signal.affectedPopulation || signal.affectedPopulation === 0) {
      missingInfo.push("Affected population count unknown");
    }
    if (signal.severity < 5) {
      missingInfo.push("Severity may need re-assessment with on-ground verification");
    }

    const normalized: NormalizedIncident = {
      id: signal.id,
      originalId: signal.id,
      type: signal.type,
      title: signal.title,
      description: signal.description,
      timestamp: signal.timestamp,
      location: signal.location,
      source: signal.source,
      severity: signal.severity,
      urgency,
      affectedPopulation: signal.affectedPopulation || 0,
      status: "new",
      confidence: duplicates.length > 0 ? 0.85 : 0.95,
      duplicates,
      downstreamRisk,
      serviceCriticality,
      enrichment: {
        duplicateCluster: duplicates.length > 0,
        missingInfo,
      },
    };

    const parsed = NormalizedIncidentSchema.safeParse(normalized);
    if (parsed.success) {
      enriched.push(parsed.data);
    }
  }

  return enriched;
}
