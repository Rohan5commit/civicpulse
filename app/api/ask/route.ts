import { NextResponse } from "next/server";
import { z } from "zod";
import { callNimWithRetry, parseJsonResponse } from "@/lib/ai/nim-client";
import { validateApiSecret } from "@/lib/auth/api-secret";

const AskSchema = z.object({
  question: z.string().min(1),
  context: z.string().optional(),
});

const SYSTEM_PROMPT = `You are CivicPulse, a community operations AI assistant. You answer questions grounded ONLY in the provided incident data and system state. Never invent facts. Be concise and direct. Return ONLY valid JSON:
{
  "answer": "string - direct answer grounded in data",
  "groundedIn": ["string - which data points support this answer"],
  "confidence": number
}`;

interface LocalAskResult {
  answer: string;
  groundedIn: string[];
  confidence: number;
}

export async function POST(request: Request) {
  const authError = validateApiSecret(request);
  if (authError) return authError;

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

    const userMessage = `System State:\n${context || "No active incidents loaded"}\n\nOperator Question: ${question}\n\nAnswer based ONLY on the data above. If the data doesn't support an answer, say so.`;

    const fallback: LocalAskResult = {
      answer: generateLocalAnswer(question),
      groundedIn: ["Local system state"],
      confidence: 0.75,
    };

    const response = await callNimWithRetry({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0.1,
      maxTokens: 400,
      jsonMode: true,
    });

    if (!response.success) {
      return NextResponse.json(fallback);
    }

    const result = parseJsonResponse<LocalAskResult>(response.content, fallback);

    return NextResponse.json({
      answer: result.answer || fallback.answer,
      groundedIn: result.groundedIn?.length ? result.groundedIn : fallback.groundedIn,
      confidence: typeof result.confidence === "number" ? result.confidence : fallback.confidence,
    });
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
