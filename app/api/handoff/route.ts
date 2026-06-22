import { NextResponse } from "next/server";
import { z } from "zod";

const HandoffRequestSchema = z.object({
  incidentId: z.string(),
  incident: z.object({
    title: z.string(),
    type: z.string(),
    severity: z.number(),
    urgency: z.number(),
    affectedPopulation: z.number(),
    location: z.object({ address: z.string(), zone: z.string() }),
    downstreamRisk: z.string(),
    status: z.string(),
  }),
  enrichment: z.object({
    recommendedTeam: z.string(),
    escalationLevel: z.string(),
  }),
  recommendation: z.object({
    immediateNextStep: z.string(),
    escalationLevel: z.string(),
    twentyFourHourRisk: z.string(),
  }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = HandoffRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { incidentId, incident, enrichment, recommendation } = parsed.data;
    const apiKey = process.env.NVIDIA_API_KEY;

    const fallback = {
      incidentId,
      operatorHandoff: `${incident.title} reported at ${incident.location.address}. Severity ${incident.severity}/10 affecting ${incident.affectedPopulation.toLocaleString()} people. ${recommendation.immediateNextStep}. Assigned to ${enrichment.recommendedTeam}. Monitor for escalation in the next 2 hours.`,
      fieldMessage: `URGENT: ${incident.title.slice(0, 40)}... — ${incident.location.zone}. Action needed immediately.`,
      supervisorEscalation: `Escalation: ${incident.title} (${incident.severity}/10 severity, ${incident.urgency}/10 urgency). ${recommendation.escalationLevel} escalation required. ${recommendation.twentyFourHourRisk.slice(0, 150)}`,
      publicUpdate: `Our team is actively responding to a ${incident.type.replace(/_/g, " ")} situation in ${incident.location.zone}. Residents are advised to follow safety guidance from local authorities.`,
      generatedAt: new Date().toISOString(),
    };

    if (!apiKey) return NextResponse.json(fallback);

    const systemPrompt = `You are a community operations communications agent. Generate clear, concise handoff summaries. Return ONLY valid JSON:
{
  "operatorHandoff": "string - detailed handoff for next operator (3-5 sentences)",
  "fieldMessage": "string - short WhatsApp/SMS style message (max 160 chars)",
  "supervisorEscalation": "string - formal escalation summary (2-3 sentences)",
  "publicUpdate": "string - safe public-facing update (2-3 sentences, no sensitive details)"
}`;

    const userMessage = `Incident: ${incident.title}\nSeverity: ${incident.severity}/10 | Urgency: ${incident.urgency}/10\nLocation: ${incident.location.address} (${incident.location.zone})\nAffected: ${incident.affectedPopulation.toLocaleString()} people\nTeam: ${enrichment.recommendedTeam}\nImmediate Action: ${recommendation.immediateNextStep}\nEscalation: ${recommendation.escalationLevel}\nKey Risk: ${recommendation.twentyFourHourRisk}\nStatus: ${incident.status}`;

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "meta/llama-3.1-8b-instruct",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) return NextResponse.json(fallback);

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);
      return NextResponse.json({
        incidentId,
        operatorHandoff: parsed.operatorHandoff || fallback.operatorHandoff,
        fieldMessage: parsed.fieldMessage || fallback.fieldMessage,
        supervisorEscalation: parsed.supervisorEscalation || fallback.supervisorEscalation,
        publicUpdate: parsed.publicUpdate || fallback.publicUpdate,
        generatedAt: new Date().toISOString(),
      });
    } catch {
      return NextResponse.json(fallback);
    }
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
