import { getEnv } from "@/lib/env";
import type { CandidateMatch, CvDocument, StructuredPositionRequest } from "@/lib/types";

type OpenRouterMessage = {
  role: "system" | "user";
  content: string;
};

export async function structurePositionRequest(emailText: string): Promise<StructuredPositionRequest> {
  const content = await callOpenRouter([
    {
      role: "system",
      content:
        "Je structureert Nederlandse detacheringsaanvragen. Geef uitsluitend geldig JSON terug volgens het gevraagde schema.",
    },
    {
      role: "user",
      content: `Zet deze aanvraag om naar JSON met keys title, seniority, must_have_skills, nice_to_have_skills, domain_context, location, availability, language_requirements, contract_details, summary.\n\nAanvraag:\n${truncate(emailText, 12000)}`,
    },
  ]);

  return parseJson<StructuredPositionRequest>(content);
}

export async function matchCvToRequest(request: StructuredPositionRequest, cv: CvDocument): Promise<CandidateMatch> {
  const content = await callOpenRouter([
    {
      role: "system",
      content:
        "Je matcht een CV tegen een detacheringsaanvraag. Geef uitsluitend geldig JSON terug. Wees kritisch, uitlegbaar en scoor 0-100.",
    },
    {
      role: "user",
      content: `Aanvraag JSON:\n${JSON.stringify(request)}\n\nCV-bestandsnaam: ${cv.fileName}\nCV-tekst:\n${truncate(cv.text, 18000)}\n\nGeef JSON met keys candidate_name, role_title, score, match_reasons, risks, missing_requirements, evidence. Arrays maximaal 5 items. Evidence mag korte, niet-privacygevoelige samenvattingen bevatten, geen lange CV-fragmenten.`,
    },
  ]);

  const result = parseJson<CandidateMatch>(content);
  return {
    candidate_name: result.candidate_name || inferNameFromFileName(cv.fileName),
    role_title: result.role_title,
    score: clampScore(result.score),
    match_reasons: normalizeStringArray(result.match_reasons),
    risks: normalizeStringArray(result.risks),
    missing_requirements: normalizeStringArray(result.missing_requirements),
    evidence: normalizeStringArray(result.evidence),
  };
}

async function callOpenRouter(messages: OpenRouterMessage[]) {
  const env = getEnv();
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": env.NEXT_PUBLIC_APP_URL,
      "X-Title": "CV Position Matcher",
    },
    body: JSON.stringify({
      model: env.OPENROUTER_MODEL,
      messages,
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter request failed: ${response.status} ${errorText.slice(0, 300)}`);
  }

  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenRouter returned no content");
  }

  return content as string;
}

function parseJson<T>(content: string): T {
  const cleaned = content
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  return JSON.parse(cleaned) as T;
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}\n[afgekapt voor tokenlimiet]` : value;
}

function clampScore(score: number) {
  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => String(item)).filter(Boolean).slice(0, 5);
}

function inferNameFromFileName(fileName: string) {
  return fileName.replace(/\.(pdf|docx)$/i, "").replace(/[_-]+/g, " ").trim();
}
