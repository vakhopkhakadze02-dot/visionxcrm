/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "./supabaseClient";
import { StorageScope, readScoped, writeScoped } from "./storage";
import { stripNewerClientColumns } from "./dbSchema";
import { newId } from "./ids";
import {
  PendingOp,
  SyncEntity,
  SyncOperation,
  classifyError,
  delayForAttempt,
  discardFailed,
  failedOps,
  isMissingColumnError,
  markFailed,
  markRetrying,
  markSucceeded,
  msUntilNextAttempt,
  nextRunnableOp,
  pendingOps,
  requeueFailed
} from "./syncQueue";

export interface EnqueueInput {
  entity: SyncEntity;
  operation: SyncOperation;
  rowId: string;
  payload?: Record<string, any>;
  matchColumn?: string;
  label: string;
  groupId?: string;
}

/** Sends one op to Supabase. Inserts upsert so a replay cannot duplicate a row. */
async function runOp(op: PendingOp, payload?: Record<string, any>): Promise<{ error: any }> {
  const table = supabase.from(op.entity);

  switch (op.operation) {
    case "insert":
      return table.upsert(payload ?? {}, { onConflict: "id" });
    case "update":
      return table.update(payload ?? {}).eq("id", op.rowId);
    case "delete":
      return table.delete().eq(op.matchColumn ?? "id", op.rowId);
  }
}

/**
 * Runs an op, degrading gracefully when the project's schema predates the newer
 * client columns: the core fields are saved rather than the whole row failing.
 * `degraded` tells the caller to prompt for the outstanding migration.
 */
async function executeOp(op: PendingOp): Promise<{ error: any; degraded?: boolean }> {
  const result = await runOp(op, op.payload);

  const canDegrade =
    result.error &&
    op.entity === "clients" &&
    op.operation !== "delete" &&
    isMissingColumnError(result.error);

  if (!canDegrade) return result;

  const retry = await runOp(op, stripNewerClientColumns(op.payload ?? {}));
  return { error: retry.error, degraded: !retry.error };
}

/**
 * Runs the outbox.
 *
 * Ops are processed strictly in order, one at a time — a booking may reference
 * a client queued moments earlier, so overtaking would break referential
 * integrity. A retryable failure pauses the queue and schedules a backoff; a
 * permanent one moves that op (and its group) aside so the rest can proceed.
 */
export interface SyncQueueOptions {
  /** Called when a write only succeeded by dropping columns the schema lacks. */
  onSchemaGap?: () => void;
}

export function useSyncQueue(
  scope: StorageScope | null,
  enabled: boolean,
  options: SyncQueueOptions = {}
) {
  const onSchemaGapRef = useRef(options.onSchemaGap);
  useEffect(() => {
    onSchemaGapRef.current = options.onSchemaGap;
  }, [options.onSchemaGap]);

  const [ops, setOps] = useState<PendingOp[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator === "undefined" ? true : navigator.onLine
  );

  const opsRef = useRef<PendingOp[]>([]);
  const runningRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydratedScopeRef = useRef<string | null>(null);

  const scopeId = scope ? (scope.kind === "local" ? "local" : scope.userId) : null;

  useEffect(() => {
    opsRef.current = ops;
  }, [ops]);

  // Load this account's outbox, then keep it on disk so a reload or a closed
  // tab does not lose queued work.
  useEffect(() => {
    if (!scope) {
      setOps([]);
      hydratedScopeRef.current = null;
      return;
    }
    setOps(readScoped<PendingOp[]>(scope, "pending_ops", []));
    hydratedScopeRef.current = scopeId;
  }, [scopeId]);

  useEffect(() => {
    if (scope && hydratedScopeRef.current === scopeId) {
      writeScoped(scope, "pending_ops", ops);
    }
  }, [ops, scopeId]);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const pump = useCallback(async () => {
    if (runningRef.current || !enabled) return;

    const op = nextRunnableOp(opsRef.current, Date.now());
    if (!op) return;

    if (typeof navigator !== "undefined" && !navigator.onLine) return;

    runningRef.current = true;
    try {
      const { error, degraded } = await executeOp(op);

      if (!error) {
        if (degraded) onSchemaGapRef.current?.();
        setOps(prev => markSucceeded(prev, op.id));
        return;
      }

      const message = error.message || JSON.stringify(error);
      if (classifyError(error) === "permanent") {
        console.warn(`Sync permanently failed (${op.label}):`, error);
        setOps(prev => markFailed(prev, op.id, message));
      } else {
        console.warn(`Sync will retry (${op.label}):`, error);
        setOps(prev => markRetrying(prev, op.id, message, Date.now()));
      }
    } catch (err: any) {
      const message = err?.message || String(err);
      if (classifyError(err) === "permanent") {
        setOps(prev => markFailed(prev, op.id, message));
      } else {
        setOps(prev => markRetrying(prev, op.id, message, Date.now()));
      }
    } finally {
      runningRef.current = false;
    }
  }, [enabled]);

  // Drive the queue: run whenever there is a runnable op, and wake up again
  // when the head of the queue comes out of its backoff.
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!enabled || !isOnline) return;

    const wait = msUntilNextAttempt(ops, Date.now());
    if (wait === null) return;

    timerRef.current = setTimeout(() => {
      void pump();
    }, wait);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [ops, enabled, isOnline, pump]);

  const enqueue = useCallback(
    (input: EnqueueInput) => {
      if (!enabled) return;
      const now = Date.now();
      setOps(prev => [
        ...prev,
        {
          id: newId("op"),
          entity: input.entity,
          operation: input.operation,
          rowId: input.rowId,
          payload: input.payload,
          matchColumn: input.matchColumn,
          label: input.label,
          groupId: input.groupId,
          createdAt: now,
          attempts: 0,
          nextAttemptAt: now,
          status: "pending"
        }
      ]);
    },
    [enabled]
  );

  const retryFailed = useCallback(() => {
    setOps(prev => requeueFailed(prev, Date.now()));
  }, []);

  const discardFailedOps = useCallback(() => {
    setOps(prev => discardFailed(prev));
  }, []);

  const pending = useMemo(() => pendingOps(ops), [ops]);
  const failed = useMemo(() => failedOps(ops), [ops]);

  return {
    pending,
    failed,
    pendingCount: pending.length,
    failedCount: failed.length,
    isOnline,
    enqueue,
    retryFailed,
    discardFailed: discardFailedOps,
    /** Next backoff length, for the "retrying in…" hint. */
    nextRetryMs: pending.length > 0 ? delayForAttempt(pending[0].attempts) : 0
  };
}
