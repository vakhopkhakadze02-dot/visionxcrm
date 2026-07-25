/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * send-notification — Supabase Edge Function (Deno).
 *
 * Holds the Twilio and EmailJS credentials as server-side secrets so they never
 * reach the browser. The client sends the already-rendered message text and the
 * recipient; this function decides how (and whether) it can be delivered.
 *
 * Deploy:
 *   supabase functions deploy send-notification
 *
 * Secrets (all optional — missing ones put that channel in demo mode):
 *   supabase secrets set TWILIO_ACCOUNT_SID=... TWILIO_AUTH_TOKEN=... TWILIO_FROM_NUMBER=+1...
 *   supabase secrets set EMAILJS_SERVICE_ID=... EMAILJS_TEMPLATE_ID=... \
 *                        EMAILJS_PUBLIC_KEY=... EMAILJS_PRIVATE_KEY=...
 *
 * JWT verification is on by default, so only signed-in users can invoke this.
 */

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

/** "sent" — delivered. "demo" — no credentials configured. "error" — provider rejected it. */
type DeliveryStatus = "sent" | "demo" | "error";

interface NotificationRequest {
  channel: "sms" | "email";
  to: string;
  body: string;
  templateParams?: Record<string, string>;
}

const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
  });

/**
 * Normalizes a phone number to E.164, defaulting bare 9-digit numbers to
 * Georgia (+995). Mirrors what the client used to do before sending.
 */
function toE164(raw: string): string {
  const trimmed = raw.replace(/[\s\-()]/g, "");
  if (trimmed.startsWith("+")) return trimmed;
  if (trimmed.startsWith("995")) return `+${trimmed}`;
  if (trimmed.length === 9) return `+995${trimmed}`;
  return `+${trimmed}`;
}

async function sendSms(to: string, body: string): Promise<{ status: DeliveryStatus; message?: string }> {
  const sid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const token = Deno.env.get("TWILIO_AUTH_TOKEN");
  const from = Deno.env.get("TWILIO_FROM_NUMBER");

  if (!sid || !token || !from) return { status: "demo" };

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${sid}:${token}`)}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({ To: toE164(to), From: from, Body: body })
    }
  );

  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    return {
      status: "error",
      message: detail?.message || `Twilio HTTP ${response.status}`
    };
  }

  return { status: "sent" };
}

async function sendEmail(
  to: string,
  body: string,
  templateParams: Record<string, string>
): Promise<{ status: DeliveryStatus; message?: string }> {
  const serviceId = Deno.env.get("EMAILJS_SERVICE_ID");
  const templateId = Deno.env.get("EMAILJS_TEMPLATE_ID");
  const publicKey = Deno.env.get("EMAILJS_PUBLIC_KEY");
  const privateKey = Deno.env.get("EMAILJS_PRIVATE_KEY");

  if (!serviceId || !templateId || !publicKey) return { status: "demo" };

  const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      // Required for non-browser senders; without it EmailJS rejects the call.
      accessToken: privateKey || undefined,
      template_params: { ...templateParams, to_email: to, message: body }
    })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    return { status: "error", message: detail || `EmailJS HTTP ${response.status}` };
  }

  return { status: "sent" };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ status: "error", message: "Method not allowed" }, 405);

  let payload: NotificationRequest;
  try {
    payload = await req.json();
  } catch {
    return json({ status: "error", message: "Invalid JSON body" }, 400);
  }

  const { channel, to, body, templateParams } = payload;

  if (channel !== "sms" && channel !== "email") {
    return json({ status: "error", message: "channel must be 'sms' or 'email'" }, 400);
  }
  if (!to || !to.trim()) {
    return json({ status: "error", message: "Missing recipient" }, 400);
  }
  if (!body || !body.trim()) {
    return json({ status: "error", message: "Missing message body" }, 400);
  }

  try {
    const result =
      channel === "sms"
        ? await sendSms(to.trim(), body)
        : await sendEmail(to.trim(), body, templateParams || {});

    // Provider failures come back 200 with status:"error" so the client can log
    // the provider's own message instead of a generic invoke failure.
    return json(result);
  } catch (err) {
    return json({
      status: "error",
      message: err instanceof Error ? err.message : "Unexpected delivery error"
    });
  }
});
