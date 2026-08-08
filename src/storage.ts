/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Scoped localStorage.
 *
 * Every piece of CRM data is stored under a scope so that two accounts sharing
 * a browser can never read each other's clients, invoices, follow-ups or
 * notification history. Signing out wipes the scope it belongs to.
 *
 *   vxcrm:local:clients        <- local (no account) mode
 *   vxcrm:u_<uuid>:clients     <- signed-in user
 */

export type StorageScope =
  | { kind: "local" }
  | { kind: "user"; userId: string };

export const LOCAL_SCOPE: StorageScope = { kind: "local" };

/** Device-level preferences and mode flags. Not customer data — never scoped. */
export const DEVICE_KEYS = [
  "vxcrm_theme",
  "vxcrm_local_mode",
  "vxcrm_start_empty",
  "vxcrm_last_active_email"
] as const;

/** Short names used with read/write. Kept in one place so clearScope is exhaustive. */
export type ScopedKey =
  | "businesses"
  | "selected_business"
  | "clients"
  | "services"
  | "staff"
  | "bookings"
  | "followups"
  | "documents"
  | "workflows"
  | "integration_config"
  | "notification_settings"
  | "notification_logs"
  | "notifications"
  | "notified_booking_ids"
  | "business_currencies"
  | "pending_ops"
  | "exchange_rates"
  | "currency_display";

/** Un-namespaced keys written by versions before scoping existed. */
const LEGACY_KEYS: Record<string, ScopedKey> = {
  vxcrm_businesses: "businesses",
  vxcrm_selected_business: "selected_business",
  vxcrm_clients: "clients",
  vxcrm_services: "services",
  vxcrm_staff: "staff",
  vxcrm_bookings: "bookings",
  vxcrm_followups: "followups",
  vxcrm_documents: "documents",
  vxcrm_workflows: "workflows",
  vxcrm_integration_config: "integration_config",
  vxcrm_notification_settings: "notification_settings",
  vxcrm_notification_logs: "notification_logs",
  vxcrm_notifications: "notifications",
  vxcrm_notified_booking_ids: "notified_booking_ids",
  vxcrm_business_currencies: "business_currencies"
};

const MIGRATION_MARKER = "vxcrm_storage_scoped_v2";

/** Provider secrets older builds kept in the browser. They now live server-side. */
const RETIRED_CREDENTIAL_FIELDS = [
  "twilioSid",
  "twilioToken",
  "twilioFrom",
  "emailjsServiceId",
  "emailjsTemplateId",
  "emailjsUserId",
  "emailjsAccessToken"
];

function stripDeliveryCredentials(rawSettings: string): string {
  try {
    const parsed = JSON.parse(rawSettings);
    RETIRED_CREDENTIAL_FIELDS.forEach(field => delete parsed[field]);
    return JSON.stringify(parsed);
  } catch {
    // Unparseable blob — drop it rather than carry a secret forward.
    return "{}";
  }
}

const scopeId = (scope: StorageScope): string =>
  scope.kind === "local" ? "local" : `u_${scope.userId}`;

const prefixOf = (scope: StorageScope): string => `vxcrm:${scopeId(scope)}:`;

export const scopedKey = (scope: StorageScope, key: ScopedKey): string =>
  `${prefixOf(scope)}${key}`;

export function readScoped<T>(scope: StorageScope, key: ScopedKey, fallback: T): T {
  try {
    const raw = localStorage.getItem(scopedKey(scope, key));
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`Could not read "${key}" from storage:`, err);
    return fallback;
  }
}

export function writeScoped(scope: StorageScope, key: ScopedKey, value: unknown): void {
  try {
    localStorage.setItem(scopedKey(scope, key), JSON.stringify(value));
  } catch (err) {
    // Quota exceeded, private browsing, etc. Data stays in memory for this session.
    console.warn(`Could not persist "${key}" to storage:`, err);
  }
}

/** Removes every key belonging to a scope. Used on sign-out. */
export function clearScope(scope: StorageScope): void {
  const prefix = prefixOf(scope);
  const doomed: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) doomed.push(key);
  }
  doomed.forEach(key => localStorage.removeItem(key));
}

/** Device keys worth carrying inside a backup file. */
const BACKUP_DEVICE_KEYS = ["vxcrm_theme", "vxcrm_last_active_email"];

const SCOPED_KEY_PATTERN = /^vxcrm:(?:local|u_[^:]+):(.+)$/;

const isKnownScopedName = (name: string): name is ScopedKey =>
  Object.values(LEGACY_KEYS).includes(name as ScopedKey);

/** Everything stored under a scope, for the backup file. */
export function exportScopeData(scope: StorageScope): Record<string, string> {
  const prefix = prefixOf(scope);
  const out: Record<string, string> = {};

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (key.startsWith(prefix) || BACKUP_DEVICE_KEYS.includes(key)) {
      const value = localStorage.getItem(key);
      if (value !== null) out[key] = value;
    }
  }

  return out;
}

/**
 * Restores a backup file into the local workspace.
 *
 * Everything lands in the local scope regardless of which scope produced the
 * file, so a backup can never be used to write into somebody else's account on
 * this device. Unrecognised keys are ignored. Returns how many were restored.
 */
export function importBackupData(data: Record<string, unknown>): number {
  let restored = 0;

  Object.entries(data).forEach(([key, value]) => {
    if (typeof value !== "string") return;

    let target: string | null = null;

    if (BACKUP_DEVICE_KEYS.includes(key)) {
      target = key;
    } else if (key in LEGACY_KEYS) {
      // Backups taken before scoping existed.
      target = scopedKey(LOCAL_SCOPE, LEGACY_KEYS[key]);
    } else {
      const match = key.match(SCOPED_KEY_PATTERN);
      if (match && isKnownScopedName(match[1])) {
        target = scopedKey(LOCAL_SCOPE, match[1]);
      }
    }

    if (!target) return;

    localStorage.setItem(
      target,
      target.endsWith(":notification_settings") ? stripDeliveryCredentials(value) : value
    );
    restored++;
  });

  if (restored > 0) localStorage.setItem(MIGRATION_MARKER, "done");
  return restored;
}

/**
 * Moves pre-scoping data into the local scope, once.
 *
 * Older builds wrote follow-ups, documents, workflows, integration tokens and
 * notification logs to shared keys regardless of who was signed in, so that data
 * has no reliable owner. It is parked in the local scope rather than handed to
 * whichever account happens to sign in next.
 */
export function migrateLegacyStorage(): void {
  try {
    if (localStorage.getItem(MIGRATION_MARKER) === "done") return;

    Object.entries(LEGACY_KEYS).forEach(([legacyKey, scopedName]) => {
      const value = localStorage.getItem(legacyKey);
      if (value === null) return;
      const target = scopedKey(LOCAL_SCOPE, scopedName);
      if (localStorage.getItem(target) === null) {
        localStorage.setItem(
          target,
          scopedName === "notification_settings" ? stripDeliveryCredentials(value) : value
        );
      }
      localStorage.removeItem(legacyKey);
    });

    localStorage.setItem(MIGRATION_MARKER, "done");
  } catch (err) {
    console.warn("Storage migration skipped:", err);
  }
}
