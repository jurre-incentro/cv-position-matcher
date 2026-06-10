import { Resend } from "resend";
import { Webhook } from "svix";
import { getResendReportEnv, getResendWebhookEnv } from "@/lib/env";
import type { MatchResult, ScanJob } from "@/lib/types";

export function verifyResendWebhook(rawBody: string, headers: Headers) {
  const env = getResendWebhookEnv();
  const webhook = new Webhook(env.RESEND_WEBHOOK_SECRET);

  return webhook.verify(rawBody, {
    "svix-id": headers.get("svix-id") ?? "",
    "svix-timestamp": headers.get("svix-timestamp") ?? "",
    "svix-signature": headers.get("svix-signature") ?? "",
  });
}

export async function sendMatchReport(job: ScanJob, matches: MatchResult[]) {
  const env = getResendReportEnv();
  const resend = new Resend(env.RESEND_API_KEY);

  const recipient = job.email_from ?? env.RESULT_EMAIL_TO;

  await resend.emails.send({
    from: env.RESULT_EMAIL_FROM,
    to: recipient,
    subject: `CV matchrapport: ${job.email_subject ?? "nieuwe aanvraag"}`,
    html: renderReportHtml(job, matches),
    text: renderReportText(job, matches),
  });
}

function renderReportText(job: ScanJob, matches: MatchResult[]) {
  const lines = [
    `Matchrapport voor: ${job.email_subject ?? "nieuwe aanvraag"}`,
    "",
    job.request_summary ?? "",
    "",
    ...matches.flatMap((match) => [
      `${match.rank}. ${match.candidate_name} - ${match.score}/100`,
      `Redenen: ${match.match_reasons.join("; ") || "-"}`,
      `Risico's: ${match.risks.join("; ") || "-"}`,
      `Ontbrekend: ${match.missing_requirements.join("; ") || "-"}`,
      "",
    ]),
  ];

  return lines.join("\n");
}

function renderReportHtml(job: ScanJob, matches: MatchResult[]) {
  return `
    <main style="font-family: Arial, sans-serif; color: #17211c; line-height: 1.5;">
      <h1>CV matchrapport</h1>
      <p><strong>Aanvraag:</strong> ${escapeHtml(job.email_subject ?? "nieuwe aanvraag")}</p>
      <p>${escapeHtml(job.request_summary ?? "")}</p>
      ${matches
        .map(
          (match) => `
            <section style="border-top: 1px solid #d8e3dc; padding: 16px 0;">
              <h2>${match.rank}. ${escapeHtml(match.candidate_name)} - ${match.score}/100</h2>
              ${renderList("Matchredenen", match.match_reasons)}
              ${renderList("Risico's", match.risks)}
              ${renderList("Ontbrekende eisen", match.missing_requirements)}
            </section>
          `,
        )
        .join("")}
    </main>
  `;
}

function renderList(title: string, items: string[]) {
  const list = items.length ? items.map((item) => `<li>${escapeHtml(item)}</li>`).join("") : "<li>-</li>";
  return `<h3>${title}</h3><ul>${list}</ul>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
