import { describe, it, expect } from "@jest/globals";
import { scoreIncidents } from "@/lib/scoring/priority";
import { normalizeSignals } from "@/lib/normalization/normalize";
import { getAllSignals } from "@/lib/intake/demo-data";

describe("scoreIncidents", () => {
  it("returns scores for all incidents", () => {
    const signals = getAllSignals();
    const incidents = normalizeSignals(signals);
    const scores = scoreIncidents(incidents);
    expect(scores).toHaveLength(incidents.length);
  });

  it("ranks incidents from highest to lowest score", () => {
    const signals = getAllSignals();
    const incidents = normalizeSignals(signals);
    const scores = scoreIncidents(incidents);
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i - 1].compositeScore).toBeGreaterThanOrEqual(scores[i].compositeScore);
    }
  });

  it("assigns rank 1 to highest score", () => {
    const signals = getAllSignals();
    const incidents = normalizeSignals(signals);
    const scores = scoreIncidents(incidents);
    expect(scores[0].rank).toBe(1);
    expect(scores[scores.length - 1].rank).toBe(scores.length);
  });

  it("scores are between 0 and 100", () => {
    const signals = getAllSignals();
    const incidents = normalizeSignals(signals);
    const scores = scoreIncidents(incidents);
    for (const score of scores) {
      expect(score.compositeScore).toBeGreaterThanOrEqual(0);
      expect(score.compositeScore).toBeLessThanOrEqual(100);
    }
  });

  it("generates explanation for each scored incident", () => {
    const signals = getAllSignals();
    const incidents = normalizeSignals(signals);
    const scores = scoreIncidents(incidents);
    for (const score of scores) {
      expect(score.explanation).toBeTruthy();
      expect(score.explanation.length).toBeGreaterThan(10);
    }
  });

  it("includes all breakdown factors", () => {
    const signals = getAllSignals();
    const incidents = normalizeSignals(signals);
    const scores = scoreIncidents(incidents);
    const expectedKeys = [
      "urgencyScore",
      "severityScore",
      "populationImpact",
      "compoundingRisk",
      "timeSensitivity",
      "resourceConstraint",
      "locationContext",
      "signalConfidence",
      "duplicatePenalty",
      "serviceCriticality",
    ];
    for (const score of scores) {
      for (const key of expectedKeys) {
        expect(score.breakdown).toHaveProperty(key);
        expect(typeof score.breakdown[key as keyof typeof score.breakdown]).toBe("number");
      }
    }
  });

  it("empty input returns empty array", () => {
    const scores = scoreIncidents([]);
    expect(scores).toHaveLength(0);
  });
});
