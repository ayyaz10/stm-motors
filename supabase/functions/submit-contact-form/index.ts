import {
  buildAdminContactEmail,
  type ContactEnquiryEmailInput,
} from "../_shared/contact-emails.ts";

const corsHeaders = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

interface ContactFormRequestBody {
  captchaToken?: string;
  email?: string;
  enquiryType?: string;
  message?: string;
  name?: string;
  phone?: string;
  service?: string;
  sourceUrl?: string;
  website?: string;
}

interface ResendEmailPayload {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
  reply_to?: string;
}

interface RecaptchaVerificationResponse {
  success?: boolean;
  hostname?: string;
  "error-codes"?: string[];
}

type ContactEnquiryType = ContactEnquiryEmailInput["enquiryType"];

const enquiryTypes: ContactEnquiryType[] = [
  "general",
  "service",
  "buy-car",
  "sell-car",
];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  });
}

function trimOrNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function asEnquiryType(value: string | null | undefined): ContactEnquiryType {
  if (value && enquiryTypes.includes(value as ContactEnquiryType)) {
    return value as ContactEnquiryType;
  }

  return "general";
}

function normaliseSourceUrl(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? "";

  if (!trimmed) {
    return Deno.env.get("PUBLIC_WEBSITE_URL")?.trim() || "https://stmmotors.com";
  }

  try {
    return new URL(trimmed).toString();
  } catch {
    return Deno.env.get("PUBLIC_WEBSITE_URL")?.trim() || "https://stmmotors.com";
  }
}

function getAllowedCaptchaHosts(sourceUrl: string): Set<string> {
  const allowedHosts = new Set<string>();

  try {
    const hostname = new URL(sourceUrl).hostname.toLowerCase();
    allowedHosts.add(hostname);
    allowedHosts.add(hostname.replace(/^www\./, ""));

    if (!hostname.startsWith("www.")) {
      allowedHosts.add(`www.${hostname}`);
    }
  } catch {
    allowedHosts.add("stmmotors.com");
    allowedHosts.add("www.stmmotors.com");
    allowedHosts.add("localhost");
    allowedHosts.add("127.0.0.1");
  }

  allowedHosts.add("localhost");
  allowedHosts.add("127.0.0.1");

  return allowedHosts;
}

async function verifyRecaptchaToken(input: {
  token: string;
  secret: string;
  sourceUrl: string;
  remoteIp: string | null;
}): Promise<void> {
  const body = new URLSearchParams({
    secret: input.secret,
    response: input.token,
  });

  if (input.remoteIp) {
    body.set("remoteip", input.remoteIp);
  }

  const response = await fetch(
    "https://www.google.com/recaptcha/api/siteverify",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    },
  );

  if (!response.ok) {
    throw new Error("Unable to verify the spam protection check.");
  }

  const result = (await response.json()) as RecaptchaVerificationResponse;

  if (!result.success) {
    throw new Error("Spam protection verification failed. Please try again.");
  }

  if (result.hostname) {
    const allowedHosts = getAllowedCaptchaHosts(input.sourceUrl);
    const hostname = result.hostname.toLowerCase();

    if (!allowedHosts.has(hostname)) {
      throw new Error("Spam protection verification could not be trusted.");
    }
  }
}

async function sendResendEmail(
  resendApiKey: string,
  payload: ResendEmailPayload,
): Promise<void> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    return;
  }

  let parsedBody: { message?: string } | null = null;

  try {
    parsedBody = (await response.json()) as { message?: string };
  } catch {
    parsedBody = null;
  }

  throw new Error(
    parsedBody?.message || `Resend request failed with status ${response.status}.`,
  );
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY")?.trim() ?? "";
    const toEmail =
      Deno.env.get("CONTACT_FORM_TO_EMAIL")?.trim() || "info@stmmotors.com";
    const fromEmail =
      Deno.env.get("CONTACT_FORM_FROM_EMAIL")?.trim() ||
      "STM Motors <info@stmmotors.com>";
    const recaptchaSecret =
      Deno.env.get("CONTACT_RECAPTCHA_SECRET")?.trim() ?? "";

    if (!resendApiKey) {
      return jsonResponse(
        { error: "Contact form email delivery is not configured yet." },
        500,
      );
    }

    const body = (await request.json()) as ContactFormRequestBody;
    const name = body.name?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const phone = trimOrNull(body.phone);
    const enquiryType = asEnquiryType(body.enquiryType);
    const service = trimOrNull(body.service);
    const message = body.message?.trim() ?? "";
    const sourceUrl = normaliseSourceUrl(body.sourceUrl);
    const captchaToken = body.captchaToken?.trim() ?? "";
    const website = body.website?.trim() ?? "";

    if (website) {
      return jsonResponse({ success: true });
    }

    if (name.length < 2 || name.length > 120) {
      return jsonResponse(
        { error: "Enter your name before sending the message." },
        400,
      );
    }

    if (!isValidEmail(email)) {
      return jsonResponse(
        { error: "Enter a valid email address before sending the message." },
        400,
      );
    }

    if (message.length < 10) {
      return jsonResponse(
        { error: "Add a little more detail so we can help properly." },
        400,
      );
    }

    if (recaptchaSecret) {
      if (!captchaToken) {
        return jsonResponse(
          { error: "Complete the spam protection check before sending." },
          400,
        );
      }

      const forwardedFor = request.headers.get("x-forwarded-for");
      const remoteIp = forwardedFor?.split(",")[0]?.trim() || null;

      await verifyRecaptchaToken({
        token: captchaToken,
        secret: recaptchaSecret,
        sourceUrl,
        remoteIp,
      });
    }

    const submittedAt = new Date().toISOString();

    const preparedEmail = buildAdminContactEmail({
      email,
      enquiryType,
      message,
      name,
      phone,
      service,
      sourceUrl,
      submittedAt,
    });

    await sendResendEmail(resendApiKey, {
      from: fromEmail,
      to: [toEmail],
      subject: preparedEmail.subject,
      html: preparedEmail.html,
      text: preparedEmail.text,
      reply_to: email,
    });

    return jsonResponse({ success: true });
  } catch (error) {
    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected contact form error.",
      },
      500,
    );
  }
});
