/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { CurrencyCode, formatPrice } from "../types";
import { RateTable, convert, currencyOf } from "../currency";

export type CurrencyDisplayMode = "record" | "business";

interface PriceTagProps {
  amount: number;
  /** Currency the record was created in. Absent means GEL, per the DB default. */
  currency?: CurrencyCode;
  /** The business's main currency. */
  businessCurrency: CurrencyCode;
  mode: CurrencyDisplayMode;
  rates: RateTable | null;
  className?: string;
  secondaryClassName?: string;
}

/**
 * Shows an amount in its own currency alongside the business's main currency.
 *
 * A booking taken in USD reads "$100" with "≈ 263 ₾" beside it; flipping the
 * mode swaps which one leads. The converted side is always marked with ≈ and is
 * omitted entirely when no rate is available, so an amount is never silently
 * shown as a currency it was not agreed in.
 */
export default function PriceTag({
  amount,
  currency,
  businessCurrency,
  mode,
  rates,
  className = "",
  secondaryClassName = ""
}: PriceTagProps) {
  const recordCurrency = currencyOf(currency);
  const converted =
    recordCurrency === businessCurrency ? null : convert(amount, recordCurrency, businessCurrency, rates);

  // Nothing to compare against: one currency, or no usable rate.
  if (recordCurrency === businessCurrency || converted === null) {
    return (
      <span className={className}>
        {formatPrice(amount, recordCurrency)}
        {recordCurrency !== businessCurrency && (
          <span className={`opacity-60 ${secondaryClassName}`} title="კურსი ჯერ არ არის ხელმისაწვდომი">
            {" "}(კურსის გარეშე)
          </span>
        )}
      </span>
    );
  }

  const leading = mode === "record" ? formatPrice(amount, recordCurrency) : formatPrice(Math.round(converted), businessCurrency);
  const trailing = mode === "record" ? formatPrice(Math.round(converted), businessCurrency) : formatPrice(amount, recordCurrency);
  const trailingIsConverted = mode === "record";

  return (
    <span className={className}>
      {leading}
      <span
        className={`ml-1.5 font-normal opacity-70 ${secondaryClassName}`}
        title={
          trailingIsConverted
            ? `გადაყვანილია ეროვნული ბანკის კურსით${rates?.date ? ` (${rates.date})` : ""}`
            : "თანხის ორიგინალი ვალუტა"
        }
      >
        {trailingIsConverted ? "≈ " : ""}
        {trailing}
      </span>
    </span>
  );
}
