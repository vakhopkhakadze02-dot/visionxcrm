/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Durable outbox for cloud writes.
 *
 * Every mutation is recorded here before it is attempted, and the record is
 * persisted per account. A write can therefore survive a lost connection, a
 * closed tab or a reload: on the next load the queue is replayed. Nothing is
 * lost silently, which is the whole point — the previous design applied changes
 * locally and dropped them if the network call failed.
 *
 * Writes that can never succeed (row-level security, constraint violations, a
 * schema that has not been migrated) are not retried forever. They are marked
 * failed and handed to the UI for the user to resolve.
 */

export type SyncEntity =
  | "businesses"
  | "clients"
  | "services"
  | "staff"
  | "bookings"
  | "followups"
  | "documents"
  | "workflows";

export type SyncOperation = "insert" | "update" | "delete";

export interface PendingOp {
  id: string;
  entity: SyncEntity;
  operation: SyncOperation;
  /** Primary key of the affected row, used for update/delete and for replay. */
  rowId: string;
  /** Column payload for insert/update. */
  payload?: Record<string, any>;
  /** Matching column for deletes that target a foreign key rather than the id. */
  matchColumn?: string;
  /** Human-readable description, shown in the UI. */
  label: string;
  /**
   * Ops that must succeed or fail together — deleting a client's bookings
   * before the client itself, for example. If one fails permanently the rest
   * are abandoned rather than executed, so nothing is left orphaned.
   */
  groupId?: string;
  createdAt: number;
  attempts: number;
  /** Epoch ms before which this op should not be retried. */
  nextAttemptAt: number;
  status: "pending" | "failed";
  lastError?: string;
}

/** Backoff between retries. The last value repeats until maxAttempts. */
export const RETRY_DELAYS_MS = [2_000, 5_000, 15_000, 30_000, 60_000];

export const MAX_ATTEMPTS = 8;

/**
 * PostgreSQL / PostgREST codes that will keep failing no matter how many times
 * the write is replayed, so retrying is pointless and hides the real problem.
 */
const PERMANENT_CODES = new Set([
  "42501", // insufficient_privilege — usually a row-level security denial
  "42P01", // undefined_table — migration not run
  "42703", // undefined_column — migration not run
  "22P02", // invalid_text_representation
  "23502", // not_null_violation
  "23503", // foreign_key_violation
  "23505", // unique_violation
  "23514", // check_violation
  "PGRST204", // schema cache is missing a column
  "PGRST205", // schema cache is missing a table
  "PGRST301" // JWT expired / not authorised
]);

const PERMANENT_MESSAGE_HINTS = [
  "row-level security",
  "violates",
  "does not exist",
  "schema cache",
  "invalid input",
  "permission denied",
  "jwt"
];

/** A column or table the project's schema does not have yet. */
export function isMissingColumnError(err: any): boolean {
  if (!err) return false;
  const code = (err.code ?? "").toString();
  if (code === "42703" || code === "PGRST204") return true;
  const message = (err.message ?? "").toString().toLowerCase();
  return message.includes("schema cache") || (message.includes("column") && message.includes("does not exist"));
}

export type ErrorKind = "retryable" | "permanent";

/**
 * Decides whether replaying an op could ever help.
 *
 * Anything that looks like a transport problem is retryable — that is the case
 * the queue exists for. Everything the database actively rejected is permanent.
 * Unknown shapes are treated as retryable but bounded by MAX_ATTEMPTS, so a
 * misclassification costs a few retries rather than an infinite loop.
 */
export function classifyError(err: any): ErrorKind {
  if (!err) return "retryable";

  const code = (err.code ?? "").toString();
  if (PERMANENT_CODES.has(code)) return "permanent";

  const status = Number(err.status ?? err.statusCode ?? 0);
  if (status === 401 || status === 403 || status === 404 || status === 409 || status === 422) {
    return "permanent";
  }
  if (status >= 500) return "retryable";

  const message = (err.message ?? "").toString().toLowerCase();

  // fetch() rejects like this when the network is unreachable.
  if (message.includes("failed to fetch") || message.includes("networkerror") || message.includes("load failed")) {
    return "retryable";
  }
  if (message.includes("timeout") || message.includes("aborted")) return "retryable";

  if (PERMANENT_MESSAGE_HINTS.some(hint => message.includes(hint))) return "permanent";

  return "retryable";
}

export function delayForAttempt(attempts: number): number {
  const index = Math.min(attempts, RETRY_DELAYS_MS.length - 1);
  return RETRY_DELAYS_MS[index];
}

/** Ops that still have work to do, oldest first. */
export const pendingOps = (ops: PendingOp[]): PendingOp[] =>
  ops.filter(op => op.status === "pending");

export const failedOps = (ops: PendingOp[]): PendingOp[] =>
  ops.filter(op => op.status === "failed");

/**
 * The next op to attempt, or null when the queue is empty or every pending op
 * is still waiting out its backoff.
 */
export function nextRunnableOp(ops: PendingOp[], now: number): PendingOp | null {
  const pending = pendingOps(ops);
  if (pending.length === 0) return null;

  // Strict FIFO: a later op may depend on an earlier one (a booking that
  // references a client created moments before), so the head of the queue is
  // the only candidate. If it is waiting, everything waits.
  const head = pending[0];
  return head.nextAttemptAt <= now ? head : null;
}

/** How long until the head of the queue becomes runnable, or null if never. */
export function msUntilNextAttempt(ops: PendingOp[], now: number): number | null {
  const pending = pendingOps(ops);
  if (pending.length === 0) return null;
  return Math.max(0, pending[0].nextAttemptAt - now);
}

export function markSucceeded(ops: PendingOp[], opId: string): PendingOp[] {
  return ops.filter(op => op.id !== opId);
}

export function markRetrying(ops: PendingOp[], opId: string, error: string, now: number): PendingOp[] {
  return ops.map(op => {
    if (op.id !== opId) return op;
    const attempts = op.attempts + 1;
    if (attempts >= MAX_ATTEMPTS) {
      return { ...op, attempts, status: "failed" as const, lastError: error };
    }
    return { ...op, attempts, nextAttemptAt: now + delayForAttempt(attempts), lastError: error };
  });
}

/**
 * Marks an op failed, along with any siblings in its group — if removing a
 * client's bookings was rejected, deleting the client must not go ahead.
 */
export function markFailed(ops: PendingOp[], opId: string, error: string): PendingOp[] {
  const target = ops.find(op => op.id === opId);
  if (!target) return ops;

  return ops.map(op => {
    if (op.id === opId) {
      return { ...op, status: "failed" as const, lastError: error };
    }
    if (target.groupId && op.groupId === target.groupId && op.status === "pending") {
      return {
        ...op,
        status: "failed" as const,
        lastError: `დამოკიდებული ოპერაცია ვერ შესრულდა: ${target.label}`
      };
    }
    return op;
  });
}

/** Puts failed ops back in line for another attempt. */
export function requeueFailed(ops: PendingOp[], now: number): PendingOp[] {
  return ops.map(op =>
    op.status === "failed"
      ? { ...op, status: "pending" as const, attempts: 0, nextAttemptAt: now, lastError: undefined }
      : op
  );
}

export const discardFailed = (ops: PendingOp[]): PendingOp[] =>
  ops.filter(op => op.status !== "failed");
