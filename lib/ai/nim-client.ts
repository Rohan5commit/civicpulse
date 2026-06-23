const NIM_ENDPOINT = "https://integrate.api.nvidia.com/v1/chat/completions";
const NIM_MODEL = "meta/llama-3.1-8b-instruct";
const REQUEST_TIMEOUT_MS = 20_000;

interface NimMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface NimRequestOptions {
  messages: NimMessage[];
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

interface NimResponse {
  content: string;
  success: boolean;
  error?: string;
}

export async function callNim(options: NimRequestOptions): Promise<NimResponse> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    return {
      content: "",
      success: false,
      error: "NVIDIA_API_KEY not configured",
    };
  }

  const body: Record<string, unknown> = {
    model: NIM_MODEL,
    messages: options.messages,
    temperature: options.temperature ?? 0.3,
    max_tokens: options.maxTokens ?? 1024,
  };

  if (options.jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(NIM_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        content: "",
        success: false,
        error: `NIM API error ${response.status}: ${errorText}`,
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    return { content, success: true };
  } catch (error) {
    const msg =
      error instanceof DOMException && error.name === "AbortError"
        ? `NIM request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`
        : error instanceof Error
          ? error.message
          : "Unknown NIM error";
    return { content: "", success: false, error: msg };
  } finally {
    clearTimeout(timeout);
  }
}

export async function callNimWithRetry(
  options: NimRequestOptions,
  maxRetries = 2
): Promise<NimResponse> {
  let lastError: string | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await callNim(options);
    if (response.success) return response;
    lastError = response.error;
    if (attempt < maxRetries) {
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }

  return {
    content: "",
    success: false,
    error: `Failed after ${maxRetries + 1} attempts. Last error: ${lastError}`,
  };
}

export function parseJsonResponse<T>(raw: string, fallback: T): T {
  try {
    const cleaned = raw
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return fallback;
  }
}
