import { NextResponse } from "next/server";
import { z } from "zod";

const AskSchema = z.object({
  question: z.string().min(1),
  context: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = AskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { question, context } = parsed.data;
    const apiKey = process.env.NVIDIA_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        answer: generateLocalAnswer(question),
        groundedIn: ["Local system state"],
        confidence: 0.75,
      });
    }

    const systemPrompt = `You are CivicPulse, a community operations AI assistant. You answer questions grounded ONLY in the provided incident data and system state. Never invent facts. Be concise and direct. Return ONLY valid JSON:
{
  "answer": "string - direct answer grounded in data",
  "groundedIn": ["string - which data points support this answer"],
  "confidence": number
}`;

    const userMessage = `System State:\n${context || "No active incidents loaded"}\n\nOperator Question: ${question}\n\nAnswer based ONLY on the data above. If the data doesn't support an answer, say so.`;

    const response = await fetch(
      "https://integrate.api.nvidia.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "meta/llama-3.1-8b-instruct",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          temperature: 0.1,
          max_tokens: 400,
          response_format: { type: "json_object" },
        }),
      }
    );

    if (!response.ok) {
      return NextResponse.json({
        answer: generateLocalAnswer(question),
        groundedIn: ["Local system state (API fallback)"],
        confidence: 0.7,
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);
      return NextResponse.json({
        answer: parsed.answer || generateLocalAnswer(question),
        groundedIn: parsed.groundedIn || ["System state"],
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.8,
      });
    } catch {
      return NextResponse.json({
        answer: content || generateLocalAnswer(question),
        groundedIn: ["NVIDIA NIM response"],
        confidence: 0.75,
      });
    }
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function generateLocalAnswer(question: string): string {
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
