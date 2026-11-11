import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Chat API is not implemented yet. Phase 2 uses demo mode." },
    { status: 501 }
  );
}
