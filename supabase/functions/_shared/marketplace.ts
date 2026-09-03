export const marketplaceAllowedOrigins = new Set([
  "https://stmmotors.co.uk",
  "https://www.stmmotors.co.uk",
  "https://stmmotors.com",
  "https://www.stmmotors.com",
  "https://staff.stmmotors.com",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

export function marketplaceCorsHeaders(request: Request) {
  const origin = request.headers.get("origin") ?? "";
  return {
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Origin": marketplaceAllowedOrigins.has(origin)
      ? origin
      : "https://stmmotors.co.uk",
    Vary: "Origin",
  };
}

export function marketplaceJsonResponse(
  request: Request,
  body: unknown,
  status = 200,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...marketplaceCorsHeaders(request),
      "Content-Type": "application/json",
    },
  });
}

export function trimText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export function nullableText(value: unknown, maxLength: number) {
  const text = trimText(value, maxLength);
  return text || null;
}

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export function normalizeSourceUrl(value: unknown) {
  const text = trimText(value, 500);
  if (!text) return null;
  try {
    const url = new URL(text);
    return marketplaceAllowedOrigins.has(url.origin) ? url.toString() : null;
  } catch {
    return null;
  }
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function verifyMarketplaceCaptcha({
  token,
  secret,
  remoteIp,
}: {
  token: string;
  secret: string;
  remoteIp: string | null;
}) {
  if (!secret) return;
  if (!token) throw new Error("Complete the spam protection check before submitting.");

  const payload = new URLSearchParams({ secret, response: token });
  if (remoteIp) payload.set("remoteip", remoteIp);
  const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: payload,
  });
  const result = (await response.json()) as { success?: boolean; score?: number };
  if (!response.ok || !result.success || (typeof result.score === "number" && result.score < 0.3)) {
    throw new Error("Spam protection could not verify this request. Please try again.");
  }
}

export async function sendMarketplaceEmail({
  apiKey,
  from,
  to,
  replyTo,
  subject,
  html,
  text,
}: {
  apiKey: string;
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  html: string;
  text: string;
}) {
  if (!apiKey) {
    console.warn("Marketplace enquiry saved without email: RESEND_API_KEY is missing.");
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: replyTo,
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    console.error("Marketplace email delivery failed.", {
      status: response.status,
      response: (await response.text()).slice(0, 500),
    });
    return false;
  }

  return true;
}

export function getMarketplaceEmailConfig() {
  return {
    apiKey: Deno.env.get("RESEND_API_KEY")?.trim() ?? "",
    from:
      Deno.env.get("MARKETPLACE_FROM_EMAIL")?.trim() ||
      Deno.env.get("CONTACT_FORM_FROM_EMAIL")?.trim() ||
      "STM Motors Sales <info@stmmotors.com>",
    to:
      Deno.env.get("MARKETPLACE_TO_EMAIL")?.trim() ||
      Deno.env.get("CONTACT_FORM_TO_EMAIL")?.trim() ||
      "info@stmmotors.com",
    captchaSecret: Deno.env.get("CONTACT_RECAPTCHA_SECRET")?.trim() ?? "",
  };
}

export function getRemoteIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
}
