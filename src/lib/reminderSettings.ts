// User preference for bill/debt reminder notifications, kept on-device like
// everything else. daysBefore=0 means "only remind on the due date."

import { useSyncExternalStore } from "react";

export interface ReminderSettings {
  enabled: boolean;
  daysBefore: number;
}

const STORAGE_KEY = "mymoney:reminder-settings";
const DEFAULT_SETTINGS: ReminderSettings = { enabled: true, daysBefore: 2 };

let cache: ReminderSettings | null = null;
const listeners = new Set<() => void>();

function read(): ReminderSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_SETTINGS;
  try {
    const parsed = JSON.parse(raw) as Partial<ReminderSettings>;
    return {
      enabled: parsed.enabled ?? DEFAULT_SETTINGS.enabled,
      daysBefore: parsed.daysBefore ?? DEFAULT_SETTINGS.daysBefore,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function write(next: ReminderSettings): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  cache = next;
  listeners.forEach((listener) => listener());
}

function getSnapshot(): ReminderSettings {
  if (cache === null) cache = read();
  return cache;
}

function getServerSnapshot(): ReminderSettings {
  return DEFAULT_SETTINGS;
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function useReminderSettings(): ReminderSettings {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function setReminderEnabled(enabled: boolean): void {
  write({ ...getSnapshot(), enabled });
}

export function setReminderDaysBefore(daysBefore: number): void {
  write({ ...getSnapshot(), daysBefore: Math.max(0, Math.min(14, daysBefore)) });
}
