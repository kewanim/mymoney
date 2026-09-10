// A single shared "when did any local store last change" timestamp, bumped
// by createLocalStore on every write. Kept separate from any one store so
// other layers (cloud sync) can ask "is my remote copy stale?" without the
// storage layer needing to know anything about syncing.
const KEY = "mymoney:last-local-change";

export function bumpLocalChangeClock(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, new Date().toISOString());
}

export function getLastLocalChangeAt(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(KEY);
}
