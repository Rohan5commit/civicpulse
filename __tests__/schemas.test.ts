import { describe, it, expect } from "@jest/globals";
import {
  IncidentSignalSchema,
  NormalizedIncidentSchema,
  PriorityScoreSchema,
  AskQuerySchema,
} from "@/lib/schemas";

describe("IncidentSignalSchema", () => {
  it("validates a correct signal", () => {
    const result = IncidentSignalSchema.safeParse({
      id: "test-001",
      type: "water_outage",
      title: "Test Signal",
      description: "A test",
      timestamp: new Date().toISOString(),
      location: { address: "Test", lat: 28, lng: 77, zone: "A" },
      source: "manual_report",
      severity: 5,
      affectedPopulation: 100,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid type", () => {
    const result = IncidentSignalSchema.safeParse({
      id: "test-001",
      type: "invalid_type",
      title: "Test",
      description: "A test",
      timestamp: new Date().toISOString(),
      location: { address: "Test", lat: 28, lng: 77, zone: "A" },
      source: "manual_report",
      severity: 5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects severity out of range", () => {
    const result = IncidentSignalSchema.safeParse({
      id: "test-001",
      type: "water_outage",
      title: "Test",
      description: "A test",
      timestamp: new Date().toISOString(),
      location: { address: "Test", lat: 28, lng: 77, zone: "A" },
      source: "manual_report",
      severity: 15,
    });
    expect(result.success).toBe(false);
  });
});

describe("NormalizedIncidentSchema", () => {
  it("validates a correct normalized incident", () => {
    const result = NormalizedIncidentSchema.safeParse({
      id: "test-001",
      originalId: "orig-001",
      type: "water_outage",
      title: "Test",
      description: "A test",
      timestamp: new Date().toISOString(),
      location: { address: "Test", lat: 28, lng: 77, zone: "A" },
      source: "manual_report",
      severity: 5,
      urgency: 6,
      affectedPopulation: 100,
      status: "new",
      confidence: 0.9,
      duplicates: [],
      downstreamRisk: "Test risk",
      serviceCriticality: 7,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = NormalizedIncidentSchema.safeParse({
      id: "test-001",
      originalId: "orig-001",
      type: "water_outage",
      title: "Test",
      description: "A test",
      timestamp: new Date().toISOString(),
      location: { address: "Test", lat: 28, lng: 77, zone: "A" },
      source: "manual_report",
      severity: 5,
      urgency: 6,
      affectedPopulation: 100,
      status: "invalid",
      confidence: 0.9,
      duplicates: [],
      downstreamRisk: "Test risk",
      serviceCriticality: 7,
    });
    expect(result.success).toBe(false);
  });
});

describe("PriorityScoreSchema", () => {
  it("validates a correct priority score", () => {
    const result = PriorityScoreSchema.safeParse({
      incidentId: "test-001",
      compositeScore: 75.5,
      rank: 1,
      breakdown: {
        urgencyScore: 80,
        severityScore: 70,
        populationImpact: 60,
        compoundingRisk: 50,
        timeSensitivity: 90,
        resourceConstraint: 40,
        locationContext: 75,
        signalConfidence: 95,
        duplicatePenalty: 0,
        serviceCriticality: 80,
      },
      explanation: "Test explanation",
      aiReasoning: "Test reasoning",
    });
    expect(result.success).toBe(true);
  });
});

describe("AskQuerySchema", () => {
  it("validates a correct query", () => {
    const result = AskQuerySchema.safeParse({
      question: "What is the top priority?",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty question", () => {
    const result = AskQuerySchema.safeParse({
      question: "",
    });
    expect(result.success).toBe(false);
  });
});
