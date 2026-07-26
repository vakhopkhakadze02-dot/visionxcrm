/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * exchange-rates — Supabase Edge Function (Deno).
 *
 * Serves National Bank of Georgia rates, fetched at most once per publication
 * day and cached in the `exchange_rates` table.
 *
 * It runs server-side for two reasons: nbg.gov.ge sends no CORS headers, so the
 * browser cannot call it directly; and caching centrally means one fetch per day
 * for the whole project rather than one per user per device.
 *
 * Deploy:
 *   supabase functions deploy exchange-rates
 *
 * No secrets to configure — SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are
 * injected automatically. The service role is needed because `exchange_rates`
 * is readable by users but writable only by this function.
 */

import { createClient } from "jsr:@supabase/supabase-js@2";

const NBG_URL = "https://nbg.gov.ge/gw/api/ct/monetarypolicy/currencies/en/json/";

/** Currencies the CRM offers. GEL is the base and is never quoted. */
const SUPPORTED = ["USD", "EUR", "GBP"];

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

interface RateEntry {
  rate: number;
  quantity: number;
}

const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
  });

/**
 * Today in Tbilisi. Rates are published against the Georgian banking day, so
 * using the server's UTC date would switch over four hours early.
 */
function tbilisiDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tbilisi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

async function fetchFromNbg(): Promise<{ date: string; rates: Record<string, RateEntry> }> {
  const response = await fetch(NBG_URL, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`NBG responded ${response.status}`);

  const payload = await response.json();
  const envelope = Array.isArray(payload) ? payload[0] : payload;
  const currencies = envelope?.currencies;
  if (!Array.isArray(currencies)) throw new Error("Unexpected NBG payload shape");

  const rates: Record<string, RateEntry> = {};
  for (const entry of currencies) {
    if (!SUPPORTED.includes(entry?.code)) continue;
    const rate = Number(entry.rate);
    const quantity = Number(entry.quantity) || 1;
    if (!Number.isFinite(rate) || rate <= 0) continue;
    rates[entry.code] = { rate, quantity };
  }

  if (Object.keys(rates).length === 0) throw new Error("NBG returned no usable rates");

  // Prefer NBG's own validity date; fall back to the Tbilisi date.
  const published = typeof envelope.date === "string" ? envelope.date.slice(0, 10) : tbilisiDate();
  return { date: published, rates };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const today = tbilisiDate();

  try {
    // Serve the cached day if we already have it.
    const cached = await supabase
      .from("exchange_rates")
      .select("code, rate, quantity")
      .eq("date", today);

    if (!cached.error && cached.data && cached.data.length >= SUPPORTED.length) {
      const rates: Record<string, RateEntry> = {};
      for (const row of cached.data) {
        rates[row.code] = { rate: Number(row.rate), quantity: Number(row.quantity) || 1 };
      }
      return json({ date: today, rates, source: "cache" });
    }

    const fresh = await fetchFromNbg();

    const rows = Object.entries(fresh.rates).map(([code, entry]) => ({
      date: fresh.date,
      code,
      rate: entry.rate,
      quantity: entry.quantity
    }));

    const { error: upsertError } = await supabase
      .from("exchange_rates")
      .upsert(rows, { onConflict: "date,code" });

    // A failed cache write is not worth failing the request over — the caller
    // still gets today's rates, we just fetch NBG again next time.
    if (upsertError) console.warn("Could not cache exchange rates:", upsertError);

    return json({ date: fresh.date, rates: fresh.rates, source: "nbg" });
  } catch (err) {
    console.error("Exchange rate lookup failed:", err);

    // Fall back to the most recent cached day so the app keeps working when
    // NBG is unreachable. The client shows how old the rates are.
    const fallback = await supabase
      .from("exchange_rates")
      .select("date, code, rate, quantity")
      .order("date", { ascending: false })
      .limit(SUPPORTED.length * 2);

    if (!fallback.error && fallback.data && fallback.data.length > 0) {
      const latestDate = fallback.data[0].date;
      const rates: Record<string, RateEntry> = {};
      for (const row of fallback.data) {
        if (row.date !== latestDate) continue;
        rates[row.code] = { rate: Number(row.rate), quantity: Number(row.quantity) || 1 };
      }
      return json({ date: latestDate, rates, source: "stale-cache" });
    }

    return json(
      { error: err instanceof Error ? err.message : "Exchange rate lookup failed" },
      502
    );
  }
});
