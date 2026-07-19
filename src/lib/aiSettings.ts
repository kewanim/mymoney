// User-chosen AI provider + their own API key(s) for Smart Entry, kept
// entirely on-device (localStorage) — same "no backend" model as the rest
// of the app's data. A key is stored per provider so switching providers
// doesn't lose the others.

import { useSyncExternalStore } from "react";

export type AIProvider = "claude" | "openai" | "gemini";

export interface AISettings {
  provider: AIProvider;
  apiKeys: Partial<Record<AIProvider, string>>;
}

export const PROVIDER_LABEL: Record<AIProvider, string> = {
  claude: "Claude",
  openai: "ChatGPT",
  gemini: "Gemini",
};

export const PROVIDER_KEY_HELP: Record<AIProvider, { url: string; label: string }> = {
  claude: { url: "https://console.anthropic.com/settings/keys", label: "console.anthropic.com" },
  openai: { url: "https://platform.openai.com/api-keys", label: "platform.openai.com" },
  gemini: { url: "https://aistudio.google.com/apikey", label: "aistudio.google.com" },
};

const STORAGE_KEY = "mymoney:ai-settings";
const DEFAULT_SETTINGS: AISettings = { provider: "claude", apiKeys: {} };

let cache: AISettings | null = null;
const listeners = new Set<() => void>();

function read(): AISettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_SETTINGS;
  try {
    const parsed = JSON.parse(raw) as Partial<AISettings>;
    return {
      provider: parsed.provider ?? DEFAULT_SETTINGS.provider,
      apiKeys: parsed.apiKeys ?? {},
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function write(next: AISettings): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  cache = next;
  listeners.forEach((listener) => listener());
}

function getSnapshot(): AISettings {
  if (cache === null) cache = read();
  return cache;
}

function getServerSnapshot(): AISettings {
  return DEFAULT_SETTINGS;
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function useAISettings(): AISettings {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function setProvider(provider: AIProvider): void {
  write({ ...getSnapshot(), provider });
}

export function setApiKey(provider: AIProvider, apiKey: string): void {
  const current = getSnapshot();
  write({ ...current, apiKeys: { ...current.apiKeys, [provider]: apiKey } });
}
