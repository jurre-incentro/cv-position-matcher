const MAX_HTML_BYTES = 1_500_000;
const MAX_TEXT_CHARS = 30_000;
const REQUEST_TIMEOUT_MS = 12_000;

export type ScrapedVacancy = {
  url: string;
  title: string | null;
  text: string;
};

export async function scrapeVacancyPage(inputUrl: string): Promise<ScrapedVacancy> {
  const url = parseScrapeUrl(inputUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "CVPositionMatcher/1.0 (+https://example.com)",
      },
      redirect: "follow",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Vacaturepagina kon niet worden opgehaald (${response.status})`);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("text/html")) {
      throw new Error("De link verwijst niet naar een HTML-pagina");
    }

    const contentLength = Number(response.headers.get("content-length") ?? 0);
    if (contentLength > MAX_HTML_BYTES) {
      throw new Error("De vacaturepagina is te groot om veilig te verwerken");
    }

    const html = await readLimitedText(response, MAX_HTML_BYTES);
    const title = extractTitle(html);
    const text = extractReadableText(html);

    if (text.length < 200) {
      throw new Error("Er kon onvoldoende vacaturetekst uit deze pagina worden gelezen");
    }

    return {
      url: response.url || url.toString(),
      title,
      text: text.slice(0, MAX_TEXT_CHARS),
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Vacaturepagina ophalen duurde te lang");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function parseScrapeUrl(inputUrl: string) {
  let url: URL;

  try {
    url = new URL(inputUrl.trim());
  } catch {
    throw new Error("Voer een geldige vacaturelink in");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Alleen http- en https-links worden ondersteund");
  }

  if (isBlockedHostname(url.hostname)) {
    throw new Error("Deze host mag niet worden gescrapet");
  }

  return url;
}

function isBlockedHostname(hostname: string) {
  const normalized = hostname.toLowerCase();
  return (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized === "0.0.0.0" ||
    normalized.startsWith("127.") ||
    normalized.startsWith("10.") ||
    normalized.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(normalized)
  );
}

async function readLimitedText(response: Response, maxBytes: number) {
  const reader = response.body?.getReader();
  if (!reader) {
    return response.text();
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;

    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      throw new Error("De vacaturepagina is te groot om veilig te verwerken");
    }

    chunks.push(value);
  }

  return new TextDecoder().decode(Buffer.concat(chunks));
}

function extractTitle(html: string) {
  const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i)?.[1];
  const title = ogTitle ?? html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? null;
  return title ? normalizeText(decodeHtml(title)) : null;
}

function extractReadableText(html: string) {
  const mainHtml =
    html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ??
    html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1] ??
    html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] ??
    html;

  const withoutNoise = mainHtml
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<aside[\s\S]*?<\/aside>/gi, " ")
    .replace(/<form[\s\S]*?<\/form>/gi, " ")
    .replace(/<(br|p|div|section|article|li|h[1-6]|tr)\b[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ");

  return normalizeText(decodeHtml(withoutNoise));
}

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_match, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_match, code: string) => String.fromCodePoint(Number.parseInt(code, 10)));
}

function normalizeText(text: string) {
  return text
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
