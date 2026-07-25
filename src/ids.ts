/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Collision-resistant record ids.
 *
 * `Date.now()` alone repeats whenever two records are created inside the same
 * millisecond — easy to hit when seeding or clicking quickly — and leaks the
 * creation time into the primary key.
 */
export function newId(prefix: string): string {
  const uuid =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

  return `${prefix}_${uuid}`;
}
