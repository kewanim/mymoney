// Generic localStorage-backed CRUD store, shared by Account/Bill/Debt/Income.
// Sprint 1 has no backend — everything lives in the browser. Exposes a
// `useAll()` hook (via useSyncExternalStore) so components stay in sync with
// the store, and with each other, without manual refetching after a mutation.

import { useSyncExternalStore } from "react";
import { bumpLocalChangeClock } from "./changeClock";

interface Entity {
  id: string;
}

// Every write also mirrors to a shadow "<key>:backup" entry. Without this, a
// single corrupted read (an interrupted write, the WebView getting killed
// mid-save) used to look identical to "genuinely empty" — readAll silently
// returned [], and the very next create/update/remove then wrote that empty
// array back over the primary key, permanently erasing real data. Real
// incident: this is exactly how a full bills list was lost while debts (a
// separate key, unaffected) survived. Now a corrupted or missing primary key
// self-heals from the mirror instead of resetting to empty.
function backupKey(storageKey: string): string {
  return `${storageKey}:backup`;
}

function readAll<T>(storageKey: string): T[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(storageKey);
  if (raw !== null) {
    try {
      return JSON.parse(raw) as T[];
    } catch {
      console.error(`MyMoney: "${storageKey}" contained invalid JSON — recovering from backup.`);
    }
  }

  // Primary is missing or unparsable. A backup mirror only exists once this
  // key has been written at least once, so finding one here means the
  // primary's current state is anomalous, not a legitimate fresh store.
  const backupRaw = window.localStorage.getItem(backupKey(storageKey));
  if (backupRaw !== null) {
    try {
      const recovered = JSON.parse(backupRaw) as T[];
      window.localStorage.setItem(storageKey, backupRaw);
      console.error(
        `MyMoney: "${storageKey}" was missing or corrupted — recovered ${recovered.length} item(s) from backup.`,
      );
      return recovered;
    } catch {
      console.error(`MyMoney: "${storageKey}" backup copy was also corrupted.`);
    }
  }

  return [];
}

function writeAll<T>(storageKey: string, items: T[]): void {
  if (typeof window === "undefined") return;
  const serialized = JSON.stringify(items);
  window.localStorage.setItem(storageKey, serialized);
  window.localStorage.setItem(backupKey(storageKey), serialized);
  bumpLocalChangeClock();
}

export function createLocalStore<T extends Entity>(storageKey: string) {
  const emptySnapshot: T[] = [];
  let cache: T[] | null = null;
  const listeners = new Set<() => void>();

  function getSnapshot(): T[] {
    if (cache === null) cache = readAll<T>(storageKey);
    return cache;
  }

  function getServerSnapshot(): T[] {
    return emptySnapshot;
  }

  function subscribe(callback: () => void): () => void {
    listeners.add(callback);
    return () => listeners.delete(callback);
  }

  function notify(next: T[]): void {
    cache = next;
    listeners.forEach((listener) => listener());
  }

  function getAll(): T[] {
    return getSnapshot();
  }

  function getById(id: string): T | undefined {
    return getAll().find((item) => item.id === id);
  }

  function create(input: Omit<T, "id">): T {
    const item = { ...input, id: crypto.randomUUID() } as T;
    const next = [...getAll(), item];
    writeAll(storageKey, next);
    notify(next);
    return item;
  }

  function update(id: string, updates: Partial<Omit<T, "id">>): T | undefined {
    let updated: T | undefined;
    const next = getAll().map((item) => {
      if (item.id !== id) return item;
      updated = { ...item, ...updates };
      return updated;
    });
    if (updated) {
      writeAll(storageKey, next);
      notify(next);
    }
    return updated;
  }

  function remove(id: string): void {
    const next = getAll().filter((item) => item.id !== id);
    writeAll(storageKey, next);
    notify(next);
  }

  function clear(): void {
    writeAll<T>(storageKey, []);
    notify([]);
  }

  function setAll(items: T[]): void {
    writeAll(storageKey, items);
    notify(items);
  }

  function useAll(): T[] {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  }

  return { getAll, getById, create, update, remove, clear, setAll, useAll };
}
