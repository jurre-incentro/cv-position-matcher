import { NextResponse } from "next/server";
import { createAndRunScan, createAndRunVacancyUrlScan } from "@/lib/services/scan-pipeline";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const { subject, text, from, url } = await request.json();
  const normalizedUrl = typeof url === "string" ? url.trim() : "";
  const normalizedText = typeof text === "string" ? text.trim() : "";

  if (!normalizedUrl && !normalizedText) {
    return NextResponse.json({ error: "Vacaturelink of aanvraagtekst is verplicht" }, { status: 400 });
  }

  try {
    const job = normalizedUrl
      ? await createAndRunVacancyUrlScan(normalizedUrl)
      : await createAndRunScan({
          messageId: null,
          from: from ?? null,
          subject: subject ?? null,
          text: normalizedText,
        });

    return NextResponse.json({ id: job.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
