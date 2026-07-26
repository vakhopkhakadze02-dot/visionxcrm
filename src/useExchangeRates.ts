/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { StorageScope, readScoped, writeScoped } from "./storage";
import { RateTable, isStale } from "./currency";
import { toDateKey } from "./dates";

/**
 * National Bank of Georgia rates, refreshed once a day.
 *
 * The table is cached per scope so the app opens with usable rates instantly
 * and keeps working offline; a background refresh replaces them once a new
 * publication day is available. Rates are only ever fetched through the
 * exchange-rates Edge Function — nbg.gov.ge sends no CORS headers, so the
 * browser cannot reach it directly.
 */
export function useExchangeRates(scope: StorageScope | null, enabled: boolean) {
  const [table, setTable] = useState<RateTable | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const scopeId = scope ? (scope.kind === "local" ? "local" : scope.userId) : null;

  // Load whatever was cached for this account first.
  useEffect(() => {
    if (!scope) {
      setTable(null);
      return;
    }
    setTable(readScoped<RateTable | null>(scope, "exchange_rates", null));
  }, [scopeId]);

  const refresh = useCallback(
    async (force = false) => {
      if (!enabled || !isSupabaseConfigured || inFlight.current) return;

      const today = toDateKey();
      const cached = scope ? readScoped<RateTable | null>(scope, "exchange_rates", null) : null;
      if (!force && !isStale(cached, today)) {
        setTable(cached);
        return;
      }

      inFlight.current = true;
      setIsRefreshing(true);
      try {
        const { data, error } = await supabase.functions.invoke("exchange-rates", { body: {} });
        if (error) throw error;
        if (!data?.rates) throw new Error("კურსების სერვისმა დააბრუნა მოულოდნელი პასუხი");

        const fresh: RateTable = { date: data.date, rates: data.rates };
        setTable(fresh);
        setLastError(null);
        if (scope) writeScoped(scope, "exchange_rates", fresh);
      } catch (err: any) {
        // Keep serving the cached table — stale rates beat no rates, and the
        // UI labels how old they are.
        console.warn("Could not refresh exchange rates:", err);
        setLastError(err?.message || "კურსების განახლება ვერ მოხერხდა");
      } finally {
        inFlight.current = false;
        setIsRefreshing(false);
      }
    },
    [enabled, scopeId]
  );

  // Refresh on load and when the app regains focus, in case the day rolled over
  // while the tab sat open.
  useEffect(() => {
    if (!enabled) return;
    void refresh();

    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [enabled, refresh]);

  return {
    table,
    isRefreshing,
    lastError,
    /** True when the rates on hand predate today's publication. */
    isStale: isStale(table, toDateKey()),
    refresh
  };
}
