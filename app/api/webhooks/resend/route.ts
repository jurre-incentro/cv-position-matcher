import { NextResponse } from "next/server";
import { createAndRunScan, type InboundEmail } from "@/lib/services/scan-pipeline";
import { verifyResendWebhook } from "@/lib/services/resend";

export const runtime = "nodejs";
export const maxDuration = 60;

type ResendWebhookPayload = {
  type?: string;
  data?: {
    email_id?: string;
    message_id?: string;
    from?: string | { email?: string };
    subject?: string;
    text?: string;
    html?: string;
  };
};

export async function POST(request: Request) {
  const rawBody = await request.text();

  let payload: ResendWebhookPayload;
  try {
    payload = verifyResendWebhook(rawBody, request.headers) as ResendWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  if (!payload.type?.includes("email") || !payload.data) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const inboundEmail = normalizeInboundEmail(payload);
  if (!inboundEmail.text) {
    return NextResponse.json({ error: "Inbound email has no text body" }, { status: 400 });
  }

  const job = await createAndRunScan(inboundEmail);
  return NextResponse.json({ ok: true, jobId: job.id });
}

function normalizeInboundEmail(payload: ResendWebhookPayload): InboundEmail {
  const data = payload.data ?? {};
  const from = typeof data.from === "string" ? data.from : data.from?.email ?? null;

  return {
    messageId: data.message_id ?? data.email_id ?? null,
    from,
    subject: data.subject ?? null,
    text: data.text ?? stripHtml(data.html ?? ""),
  };
}

function stripHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
