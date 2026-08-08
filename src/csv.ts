/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Escapes one CSV field.
 *
 * Quoting alone does not stop spreadsheet formula injection: Excel and Sheets
 * still evaluate a quoted field that begins with = + - @ or a control character,
 * so a client named `=HYPERLINK(...)` runs when the export is opened. Those
 * fields get a leading apostrophe, which spreadsheets treat as "this is text".
 */
export function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  const guarded = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${guarded.replace(/"/g, '""')}"`;
}

/** Builds a CSV document with a UTF-8 BOM so Excel reads Georgian correctly. */
export function buildCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(csvCell).join(","), ...rows.map(row => row.map(csvCell).join(","))];
  return "﻿" + lines.join("\n");
}

/** Triggers a client-side download of the given CSV text. */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
