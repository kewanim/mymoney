import type { ReactNode } from "react";

export function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-paper-raised p-5 shadow-sm">
      {children}
    </div>
  );
}

export function SectionHeading({
  title,
  count,
  action,
}: {
  title: string;
  count: number;
  action: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-baseline gap-2">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <span className="rounded-full bg-line/60 px-2 py-0.5 font-mono text-xs text-ink-soft">
          {count}
        </span>
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ label }: { label: string }) {
  return (
    <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-sm text-ink-soft">
      {label}
    </p>
  );
}

const badgeTones = {
  neutral: "bg-line/60 text-ink-soft",
  good: "bg-good-bg text-good",
  warn: "bg-warn-bg text-warn",
  critical: "bg-critical-bg text-critical",
} as const;

export function Badge({
  children,
  tone,
}: {
  children: ReactNode;
  tone: keyof typeof badgeTones;
}) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${badgeTones[tone]}`}
    >
      {children}
    </span>
  );
}

export function IconButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="rounded-md px-1.5 py-0.5 text-ink-soft transition-colors hover:bg-line/50 hover:text-ink"
    >
      {children}
    </button>
  );
}
