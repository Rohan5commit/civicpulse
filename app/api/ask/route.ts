import { NextResponse } from "next/server";
import { z } from "zod";
import { callNimWithRetry, parseJsonResponse } from "@/lib/ai/nim-client";
import { validateApiSecret } from "@/lib/auth/api-secret";
import { generateFallbackAnswer } from "@/lib/ask-fallback";

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

    const fallbackResult = generateFallbackAnswer(question, [], []);
    const fallback: LocalAskResult = {
      answer: fallbackResult.answer,
      groundedIn: fallbackResult.groundedIn,
      confidence: fallbackResult.confidence,
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
      return NextResponse.json({ ...fallback, source: "fallback" as const });
    }

    const result = parseJsonResponse<LocalAskResult>(response.content, fallback);

    return NextResponse.json({
      answer: result.answer || fallback.answer,
      groundedIn: result.groundedIn?.length ? result.groundedIn : fallback.groundedIn,
      confidence: typeof result.confidence === "number" ? result.confidence : fallback.confidence,
      source: "ai" as const,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


