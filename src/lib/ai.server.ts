/**
 * AI assistant server helpers.
 *
 * Everything is environment driven so the template can point at ANY
 * OpenAI-compatible endpoint (OpenAI, Groq, Together, OpenRouter, Ollama,
 * vLLM, LM Studio, a self-hosted gateway, ...):
 *
 *   AI_ENABLED=true
 *   AI_BASE_URL=https://api.openai.com/v1
 *   AI_API_KEY=sk-...
 *   AI_MODEL=gpt-4o-mini
 *   AI_TEMPERATURE=0.4          (optional)
 *   AI_MAX_TOKENS=700           (optional)
 *   AI_ASSISTANT_NAME=Neema     (optional, overrides site.json)
 */

export type AiConfig = {
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  name: string;
};

export function aiConfig(): AiConfig {
  const env = process.env;
  const baseUrl = (env["AI_BASE_URL"] || "").trim().replace(/\/+$/, "");
  const apiKey = (env["AI_API_KEY"] || "").trim();
  const model = (env["AI_MODEL"] || "").trim();
  const enabled = (env["AI_ENABLED"] || "").toLowerCase() !== "false" && Boolean(baseUrl && model);

  return {
    enabled,
    baseUrl,
    apiKey,
    model,
    temperature: Number(env["AI_TEMPERATURE"] ?? 0.4),
    maxTokens: Number(env["AI_MAX_TOKENS"] ?? 700),
    name: (env["AI_ASSISTANT_NAME"] || "").trim(),
  };
}

let cache: { at: number; text: string } | null = null;
const CACHE_MS = 60_000;

/** Live snapshot of the company's own content, fed to the model as grounding. */
export async function knowledgeBase(): Promise<string> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.text;

  const { db } = await import("./db.server");
  const client = db();

  const [settings, services, articles, team, socials] = await Promise.all([
    client.from("settings").select("key,value"),
    client
      .from("services")
      .select("slug,title,summary,body,highlights")
      .eq("published", true)
      .order("order_index"),
    client
      .from("articles")
      .select("slug,title,excerpt,published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(12),
    client.from("team_members").select("name,role,bio").order("order_index"),
    client.from("socials").select("platform,url,enabled").order("order_index"),
  ]);

  const map = new Map((settings.data ?? []).map((r) => [r.key, r.value as unknown]));
  const contacts = map.get("contacts") as
    | {
        companyName?: string;
        addressLines?: string[];
        phones?: string[];
        emails?: string[];
        hours?: { label: string; value: string }[];
      }
    | undefined;
  const about = map.get("about") as
    { heading?: string; paragraphs?: string[]; highlight?: string } | undefined;

  const parts: string[] = [];

  if (about) {
    parts.push(
      `# About\n${about.heading ?? ""}\n${(about.paragraphs ?? []).join("\n")}\n${about.highlight ?? ""}`,
    );
  }

  if (contacts) {
    parts.push(
      [
        "# Contacts",
        contacts.companyName ? `Company: ${contacts.companyName}` : "",
        contacts.addressLines?.length ? `Address: ${contacts.addressLines.join(", ")}` : "",
        contacts.phones?.length ? `Phones: ${contacts.phones.join(", ")}` : "",
        contacts.emails?.length ? `Emails: ${contacts.emails.join(", ")}` : "",
        contacts.hours?.length
          ? `Working hours: ${contacts.hours.map((h) => `${h.label} ${h.value}`).join("; ")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }

  if (services.data?.length) {
    parts.push(
      "# Services (link as /services/{slug})\n" +
        services.data
          .map((s) => {
            const body = String((s as { body?: string }).body ?? "")
              .replace(/<[^>]+>/g, " ")
              .replace(/\s+/g, " ")
              .trim()
              .slice(0, 600);
            const highlights = Array.isArray(s.highlights) ? s.highlights.join("; ") : "";
            return `- ${s.title} (/services/${s.slug}): ${s.summary ?? ""}${
              highlights ? ` | Includes: ${highlights}` : ""
            }${body ? ` | Details: ${body}` : ""}`;
          })
          .join("\n"),
    );
  }

  if (articles.data?.length) {
    parts.push(
      "# Recent articles (link as /blog/{slug})\n" +
        articles.data.map((a) => `- ${a.title} (/blog/${a.slug}): ${a.excerpt ?? ""}`).join("\n"),
    );
  }

  if (team.data?.length) {
    parts.push("# Team\n" + team.data.map((t) => `- ${t.name} — ${t.role ?? ""}`).join("\n"));
  }

  const enabledSocials = (socials.data ?? []).filter(
    (s) => (s as { enabled?: boolean }).enabled && s.url,
  );
  if (enabledSocials.length) {
    parts.push("# Social\n" + enabledSocials.map((s) => `- ${s.platform}: ${s.url}`).join("\n"));
  }

  const text = parts.join("\n\n");
  cache = { at: Date.now(), text };
  return text;
}

export function systemPrompt(assistantName: string, company: string, knowledge: string): string {
  return `You are ${assistantName}, the friendly online assistant for ${company}.

LANGUAGE
- The visitor may write in English or Kiswahili (or mix them). Always reply in the same language they used; if it is mixed or unclear, reply in English and offer Kiswahili.
- Kiswahili replies must be natural, warm and respectful (use "Karibu", "Asante", polite "tafadhali"), never machine-literal.

STYLE
- Warm, charming, confident and brief: 2-5 short sentences or a tight bullet list.
- Plain text or simple markdown. Never use emojis.
- Always be useful: suggest the exact next step (a page link, a phone call, or the contact form).

GROUNDING
- Answer ONLY from the company information below plus general, non-binding guidance about company registration and business consultancy.
- If a detail (price, timeline, legal advice, personal case) is not in the information, say so honestly and invite the visitor to contact the team through the contacts on the site.
- Never invent phone numbers, emails, prices or promises.
- Link internal pages with relative paths such as /services, /services/{slug}, /blog, /contacts, /about-us.

COMPANY INFORMATION
${knowledge || "(No company content published yet.)"}`;
}
