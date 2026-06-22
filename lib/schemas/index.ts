import { z } from "zod";

// ─── Raw Signal Schema ───────────────────────────────────────────────
export const IncidentSignalSchema = z.object({
  id: z.string(),
  type: z.enum([
    "water_outage",
    "road_flooding",
    "waste_pileup",
    "clinic_shortage",
    "heatwave_alert",
    "electricity_issue",
    "safety_complaint",
    "traffic_disruption",
    "noise_complaint",
    "building_damage",
    "other",
  ]),
  title: z.string(),
  description: z.string(),
  timestamp: z.string(),
  location: z.object({
    address: z.string(),
    lat: z.number(),
    lng: z.number(),
    zone: z.string(),
  }),
  source: z.enum([
    "manual_report",
    "csv_feed",
    "weather_api",
    "traffic_api",
    "facility_status",
    "complaint_log",
    "inventory_feed",
    "citizen_app",
  ]),
  severity: z.number().min(1).max(10),
  affectedPopulation: z.number().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type IncidentSignal = z.infer<typeof IncidentSignalSchema>;

// ─── Normalized Incident Schema ──────────────────────────────────────
export const NormalizedIncidentSchema = z.object({
  id: z.string(),
  originalId: z.string(),
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
  severity: z.number().min(1).max(10),
  urgency: z.number().min(1).max(10),
  affectedPopulation: z.number(),
  status: z.enum([
    "new",
    "triaged",
    "in_progress",
    "resolved",
    "escalated",
  ]),
  confidence: z.number().min(0).max(1),
  duplicates: z.array(z.string()),
  downstreamRisk: z.string(),
  serviceCriticality: z.number().min(1).max(10),
  enrichment: z
    .object({
      weatherRisk: z.string().optional(),
      nearbyIncidents: z.number().optional(),
      compoundingFactors: z.array(z.string()).optional(),
      duplicateCluster: z.boolean().optional(),
      estimatedResponseTime: z.string().optional(),
      missingInfo: z.array(z.string()).optional(),
      aiReasoning: z.string().optional(),
    })
    .optional(),
});

export type NormalizedIncident = z.infer<typeof NormalizedIncidentSchema>;

// ─── Priority Score Schema ───────────────────────────────────────────
export const PriorityScoreSchema = z.object({
  incidentId: z.string(),
  compositeScore: z.number().min(0).max(100),
  rank: z.number(),
  breakdown: z.object({
    urgencyScore: z.number(),
    severityScore: z.number(),
    populationImpact: z.number(),
    compoundingRisk: z.number(),
    timeSensitivity: z.number(),
    resourceConstraint: z.number(),
    locationContext: z.number(),
    signalConfidence: z.number(),
    duplicatePenalty: z.number(),
    serviceCriticality: z.number(),
  }),
  explanation: z.string(),
  aiReasoning: z.string(),
});

export type PriorityScore = z.infer<typeof PriorityScoreSchema>;

// ─── Enriched Context Schema ─────────────────────────────────────────
export const EnrichedContextSchema = z.object({
  incidentId: z.string(),
  severity: z.number(),
  urgency: z.number(),
  affectedPopulation: z.number(),
  weatherContext: z.string(),
  proximityAnalysis: z.string(),
  duplicateAnalysis: z.string(),
  compoundingRisk: z.string(),
  estimatedImpact: z.string(),
  missingInfo: z.array(z.string()),
  recommendedTeam: z.string(),
  escalationLevel: z.enum(["none", "supervisor", "emergency", "external"]),
});

export type EnrichedContext = z.infer<typeof EnrichedContextSchema>;

// ─── Action Recommendation Schema ────────────────────────────────────
export const ActionRecommendationSchema = z.object({
  incidentId: z.string(),
  immediateNextStep: z.string(),
  suggestedAssignee: z.string(),
  escalationLevel: z.string(),
  requiredResources: z.array(z.string()),
  safetyNotes: z.array(z.string()),
  followUpQuestions: z.array(z.string()),
  thirtyMinutePlan: z.array(z.string()),
  twentyFourHourRisk: z.string(),
});

export type ActionRecommendation = z.infer<typeof ActionRecommendationSchema>;

// ─── Handoff Summary Schema ──────────────────────────────────────────
export const HandoffSummarySchema = z.object({
  incidentId: z.string(),
  operatorHandoff: z.string(),
  fieldMessage: z.string(),
  supervisorEscalation: z.string(),
  publicUpdate: z.string(),
  generatedAt: z.string(),
});

export type HandoffSummary = z.infer<typeof HandoffSummarySchema>;

// ─── Escalation Note Schema ──────────────────────────────────────────
export const EscalationNoteSchema = z.object({
  incidentId: z.string(),
  level: z.enum(["none", "supervisor", "emergency", "external"]),
  reason: z.string(),
  recommendedContact: z.string(),
  urgency: z.string(),
  deadline: z.string().optional(),
});

export type EscalationNote = z.infer<typeof EscalationNoteSchema>;

// ─── Acceleration Metric Schema ──────────────────────────────────────
export const AccelerationMetricSchema = z.object({
  metric: z.string(),
  manualTime: z.string(),
  aiAssistedTime: z.string(),
  improvement: z.string(),
  description: z.string(),
});

export type AccelerationMetric = z.infer<typeof AccelerationMetricSchema>;

// ─── Agent Run Trace Schema ──────────────────────────────────────────
export const AgentRunTraceSchema = z.object({
  agentName: z.string(),
  input: z.string(),
  output: z.string(),
  duration: z.number(),
  status: z.enum(["success", "error", "fallback"]),
  timestamp: z.string(),
});

export type AgentRunTrace = z.infer<typeof AgentRunTraceSchema>;

// ─── Operator Decision Schema ────────────────────────────────────────
export const OperatorDecisionSchema = z.object({
  incidentId: z.string(),
  decision: z.string(),
  reasoning: z.string(),
  timestamp: z.string(),
  timeToDecide: z.number(),
  aiAssisted: z.boolean(),
});

export type OperatorDecision = z.infer<typeof OperatorDecisionSchema>;

// ─── Demo Scenario Schema ────────────────────────────────────────────
export const DemoScenarioSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  signals: z.array(IncidentSignalSchema),
});

export type DemoScenario = z.infer<typeof DemoScenarioSchema>;

// ─── Ask Query Schema ────────────────────────────────────────────────
export const AskQuerySchema = z.object({
  question: z.string().min(1),
  context: z
    .object({
      selectedIncidentId: z.string().optional(),
      currentView: z.string().optional(),
    })
    .optional(),
});

export type AskQuery = z.infer<typeof AskQuerySchema>;

export const AskResponseSchema = z.object({
  answer: z.string(),
  groundedIn: z.array(z.string()),
  confidence: z.number(),
});

export type AskResponse = z.infer<typeof AskResponseSchema>;
