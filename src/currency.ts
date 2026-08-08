/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CurrencyCode } from "./types";

/**
 * Currency conversion against National Bank of Georgia rates.
 *
 * NBG quotes GEL per `quantity` units of a currency — 1 USD = 2.6285 GEL, but
 * 100 JPY = 1.77 GEL. Dividing by `quantity` is therefore not optional, even
 * though every currency this app offers today happens to quote per single unit.
 *
 * GEL is the base and is never listed in the table; it converts 1:1 with itself.
 */

export interface RateEntry {
  rate: number;
  quantity: number;
}

export interface RateTable {
  /** The NBG publication date these rates are valid for (YYYY-MM-DD). */
  date: string;
  rates: Partial<Record<CurrencyCode, RateEntry>>;
}

export const BASE_CURRENCY: CurrencyCode = "GEL";

/**
 * The currency a record was created in.
 *
 * Records written before the `currency` column existed have none. They must
 * resolve to GEL — the database default the migration backfills them with — and
 * emphatically *not* to the business's current currency: that is the original
 * bug, where switching the business to EUR silently reprinted a 20 ₾ service as
 * €20.
 */
export const currencyOf = (currency?: CurrencyCode): CurrencyCode => currency ?? BASE_CURRENCY;

/** How much GEL `amount` of `code` is worth, or null when the rate is missing. */
export function toBase(amount: number, code: CurrencyCode, table: RateTable | null): number | null {
  if (code === BASE_CURRENCY) return amount;
  const entry = table?.rates?.[code];
  if (!entry || !entry.rate || !entry.quantity) return null;
  return (amount * entry.rate) / entry.quantity;
}

/** How much of `code` a GEL amount buys, or null when the rate is missing. */
export function fromBase(baseAmount: number, code: CurrencyCode, table: RateTable | null): number | null {
  if (code === BASE_CURRENCY) return baseAmount;
  const entry = table?.rates?.[code];
  if (!entry || !entry.rate || !entry.quantity) return null;
  return (baseAmount * entry.quantity) / entry.rate;
}

/**
 * Converts between any two supported currencies via GEL.
 *
 * Returns null rather than a guess when a rate is unavailable, so callers can
 * show the original amount instead of inventing a number.
 */
export function convert(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  table: RateTable | null
): number | null {
  if (from === to) return amount;
  const base = toBase(amount, from, table);
  if (base === null) return null;
  return fromBase(base, to, table);
}

/** Sums amounts in mixed currencies into one, skipping any that cannot convert. */
export function sumConverted(
  entries: { amount: number; currency: CurrencyCode }[],
  to: CurrencyCode,
  table: RateTable | null
): { total: number; unconverted: number } {
  let total = 0;
  let unconverted = 0;

  for (const entry of entries) {
    const converted = convert(entry.amount, entry.currency, to, table);
    if (converted === null) unconverted++;
    else total += converted;
  }

  return { total, unconverted };
}

/** True when the table is missing or was published before today. */
export function isStale(table: RateTable | null, today: string): boolean {
  return !table || table.date !== today;
}
