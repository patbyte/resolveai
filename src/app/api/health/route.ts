import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "resolveai-web",
    version: process.env.APP_VERSION ?? "development",
    checks: {
      application: "ok",
      aiProvider: process.env.OPENAI_API_KEY ? "configured" : "demo"
    },
    timestamp: new Date().toISOString()
  }, {
    headers: { "Cache-Control": "no-store" }
  });
}
