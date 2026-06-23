import { NextResponse } from "next/server";

/**
 * Validates the x-api-secret header against INTERNAL_API_SECRET env var.
 * Returns null if valid, or a 401 NextResponse if unauthorized.
 */
export function validateApiSecret(request: Request): NextResponse | null {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) {
    // If no secret is configured, allow all requests (dev mode)
    return null;
  }
  const authHeader = request.headers.get("x-api-secret");
  if (authHeader !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
