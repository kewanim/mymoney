import { describe, expect, it, beforeEach } from "vitest";
import { createLocalStore } from "./createLocalStore";

// vitest runs these in a plain Node environment (no jsdom), so `window` and
// `localStorage` don't exist yet — createLocalStore only needs the small
// slice of the Web Storage API it actually calls.
class MemoryStorage {
  private data = new Map<string, string>();
  getItem(key: string): string | null {
    return this.data.has(key) ? this.data.get(key)! : null;
  }
  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
  clear(): void {
    this.data.clear();
  }
}

(globalThis as unknown as { window: { localStorage: MemoryStorage } }).window = {
  localStorage: new MemoryStorage(),
};

interface Thing {
  id: string;
  name: string;
}

const KEY = "test:things";

beforeEach(() => {
  window.localStorage.clear();
});

describe("createLocalStore", () => {
  it("starts empty on a genuinely fresh key", () => {
    expect(createLocalStore<Thing>(KEY).getAll()).toEqual([]);
  });

  it("persists writes across separate store instances", () => {
    createLocalStore<Thing>(KEY).create({ name: "Rent" });
    expect(createLocalStore<Thing>(KEY).getAll()).toMatchObject([{ name: "Rent" }]);
  });

  // Regression: a corrupted primary key used to read as [] indistinguishably
  // from a real empty store, and the next write then persisted that [] over
  // the primary — permanently destroying whatever was there.
  it("recovers from a corrupted primary key instead of silently going empty", () => {
    createLocalStore<Thing>(KEY).create({ name: "Rent" });
    window.localStorage.setItem(KEY, "{not valid json");

    const recovered = createLocalStore<Thing>(KEY).getAll();

    expect(recovered).toMatchObject([{ name: "Rent" }]);
    // Self-healed: the primary key itself is repaired, not just the in-memory read.
    expect(JSON.parse(window.localStorage.getItem(KEY)!)).toMatchObject([{ name: "Rent" }]);
  });

  it("recovers when the primary key is missing but the backup mirror survives", () => {
    createLocalStore<Thing>(KEY).create({ name: "Rent" });
    window.localStorage.removeItem(KEY);

    expect(createLocalStore<Thing>(KEY).getAll()).toMatchObject([{ name: "Rent" }]);
  });

  it("does not resurrect data after an intentional clear", () => {
    const store = createLocalStore<Thing>(KEY);
    store.create({ name: "Rent" });
    store.clear();

    expect(createLocalStore<Thing>(KEY).getAll()).toEqual([]);
  });

  it("falls back to empty when both primary and backup are corrupted", () => {
    window.localStorage.setItem(KEY, "{bad");
    window.localStorage.setItem(`${KEY}:backup`, "{also bad");

    expect(createLocalStore<Thing>(KEY).getAll()).toEqual([]);
  });
});
