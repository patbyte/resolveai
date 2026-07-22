import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "resolveai-web",
    timestamp: new Date().toISOString()
  });
}
