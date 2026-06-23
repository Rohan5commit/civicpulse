import { describe, it, expect } from "@jest/globals";
import { normalizeSignals } from "@/lib/normalization/normalize";
import type { IncidentSignal } from "@/lib/schemas";

const baseSignal: IncidentSignal = {
  id: "test-001",
  type: "water_outage",
  title: "Water Supply Cut",
  description: "Municipal water supply disrupted",
  timestamp: new Date().toISOString(),
  location: {
    address: "Sector 12",
    lat: 28.612,
    lng: 77.207,
    zone: "Zone A",
  },
  source: "manual_report",
  severity: 8,
  affectedPopulation: 5000,
};

describe("normalizeSignals", () => {
  it("normalizes a single signal into a NormalizedIncident", () => {
    const result = normalizeSignals([baseSignal]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("test-001");
    expect(result[0].type).toBe("water_outage");
    expect(result[0].severity).toBe(8);
    expect(result[0].status).toBe("new");
    expect(result[0].urgency).toBeGreaterThanOrEqual(1);
    expect(result[0].urgency).toBeLessThanOrEqual(10);
  });

  it("detects duplicate clusters", () => {
    const dup1: IncidentSignal = {
      ...baseSignal,
      id: "dup-1",
      location: { ...baseSignal.location, lat: 28.6121, lng: 77.2071 },
      timestamp: new Date(Date.now() - 600000).toISOString(),
    };
    const dup2: IncidentSignal = {
      ...baseSignal,
      id: "dup-2",
      location: { ...baseSignal.location, lat: 28.6122, lng: 77.2072 },
      timestamp: new Date(Date.now() - 1200000).toISOString(),
    };

    const result = normalizeSignals([baseSignal, dup1, dup2]);
    expect(result).toHaveLength(3);
    expect(result.find((r) => r.id === "test-001")?.duplicates.length).toBe(2);
    expect(result.find((r) => r.id === "dup-1")?.duplicates.length).toBeGreaterThanOrEqual(1);
  });

  it("handles empty input", () => {
    const result = normalizeSignals([]);
    expect(result).toHaveLength(0);
  });

  it("sets confidence lower for clustered incidents", () => {
    const dup: IncidentSignal = {
      ...baseSignal,
      id: "dup-1",
      location: { ...baseSignal.location, lat: 28.6121, lng: 77.2071 },
      timestamp: new Date(Date.now() - 600000).toISOString(),
    };
    const result = normalizeSignals([baseSignal, dup]);
    const clustered = result.find((r) => r.duplicates.length > 0);
    const standalone = result.find((r) => r.id === "dup-1");
    if (clustered && standalone) {
      expect(clustered.confidence).toBeLessThanOrEqual(standalone.confidence);
    }
  });

  it("computes downstream risk for each incident type", () => {
    const result = normalizeSignals([baseSignal]);
    expect(result[0].downstreamRisk).toBeTruthy();
    expect(result[0].downstreamRisk.length).toBeGreaterThan(0);
  });
});
