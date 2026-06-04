import { NextResponse } from "next/server";
import { createAndRunScan } from "@/lib/services/scan-pipeline";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const { subject, text, from } = await request.json();

  if (!text?.trim()) {
    return NextResponse.json({ error: "Tekst is verplicht" }, { status: 400 });
  }

  try {
    const job = await createAndRunScan({
      messageId: null,
      from: from ?? null,
      subject: subject ?? null,
      text,
    });

    return NextResponse.json({ id: job.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
