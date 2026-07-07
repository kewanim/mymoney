import type { ReactNode } from "react";

export function Card({ children }: { children: ReactNode }) {
  return (
    <div
      className="rounded-2xl border border-line bg-paper-raised/90 p-5 backdrop-blur-md transition-shadow duration-300"
      style={{ boxShadow: "0 12px 40px -20px var(--glow)" }}
    >
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
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex shrink-0 items-baseline gap-2">
        <h2 className="text-lg font-semibold tracking-tight text-nowrap">{title}</h2>
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
  accent: "bg-violet-bg text-violet",
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

export function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="rounded-md bg-gradient-to-r from-teal to-violet px-3 py-1.5 text-sm font-medium text-teal-ink shadow-[0_0_16px_-4px_var(--glow)] transition-transform duration-150 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
    >
      {children}
    </button>
  );
}
