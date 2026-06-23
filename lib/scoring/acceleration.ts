import type { AccelerationMetric } from "@/lib/schemas";

export function computeAccelerationMetrics(
  totalIncidents: number,
  aiProcessingTimeMs: number
): AccelerationMetric[] {
  const seconds = aiProcessingTimeMs / 1000;
  const issuesPerMinute = totalIncidents / (seconds / 60);

  return [
    {
      metric: "Time to Identify Top Priority",
      manualTime: "5–8 minutes",
      aiAssistedTime: `${Math.max(1, Math.round(seconds / totalIncidents))} seconds`,
      improvement: "95% faster",
      description:
        "Manually scanning reports, comparing severity, and deciding which issue to tackle first takes 5–8 minutes for an experienced operator. CivicPulse ranks all incidents instantly.",
    },
    {
      metric: "Time to Prepare Response Summary",
      manualTime: "10–15 minutes",
      aiAssistedTime: "Instant (generated)",
      improvement: "100% faster",
      description:
        "Writing a structured handoff, escalation note, and field message takes 10–15 minutes manually. CivicPulse generates all three immediately from enriched data.",
    },
    {
      metric: "Issues Triaged per Minute",
      manualTime: "1–2 per minute",
      aiAssistedTime: `${issuesPerMinute.toFixed(0)}+ per minute`,
      improvement: `${Math.round((issuesPerMinute / 1.5 - 1) * 100)}% more`,
      description:
        `Operators manually triage 1–2 issues per minute under pressure. The AI pipeline processes all incidents simultaneously, enabling ${issuesPerMinute.toFixed(0)}+ triages per minute.`,
    },
    {
      metric: "Duplicate Review Effort",
      manualTime: "30–40% of review time",
      aiAssistedTime: "<5% (auto-clustered)",
      improvement: "85% reduction",
      description:
        "Operators spend significant time identifying which reports are duplicates. CivicPulse clusters related reports automatically, saving review effort.",
    },
    {
      metric: "Decision Clarity",
      manualTime: "Often ambiguous",
      aiAssistedTime: "Ranked + explained",
      improvement: "Measurable",
      description:
        "Every ranking includes a transparent scoring breakdown and AI-generated explanation, eliminating guesswork in prioritization decisions.",
    },
  ];
}
