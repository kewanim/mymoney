import type { ReactNode } from "react";

export function Card({ children }: { children: ReactNode }) {
  return (
    <div className="glass overflow-hidden rounded-[28px] p-5 backdrop-blur-2xl backdrop-saturate-150">
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
        <h2 className="text-[19px] font-semibold tracking-tight text-nowrap">{title}</h2>
        <span className="rounded-full bg-field px-2 py-0.5 font-mono text-xs text-ink-soft">
          {count}
        </span>
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ label }: { label: string }) {
  return (
    <p className="rounded-2xl border border-dashed border-line px-4 py-6 text-center text-sm text-ink-soft">
      {label}
    </p>
  );
}

const badgeTones = {
  neutral: "bg-field text-ink-soft",
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
      className={`rounded-full px-2 py-0.5 text-xs font-semibold tracking-wide uppercase ${badgeTones[tone]}`}
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
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-soft transition-colors active:scale-90 hover:bg-field hover:text-ink"
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
      className="rounded-full bg-gradient-to-br from-teal to-violet px-4 py-1.5 text-sm font-semibold text-teal-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_8px_20px_-8px_var(--glow)] transition-transform duration-150 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
    >
      {children}
    </button>
  );
}

export function GroupedList({ children }: { children: ReactNode }) {
  return (
    <ul className="divide-field-border divide-y overflow-hidden rounded-2xl bg-field">{children}</ul>
  );
}

export function GroupedRow({ children }: { children: ReactNode }) {
  return <li className="flex items-center justify-between gap-3 px-4 py-3">{children}</li>;
}

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="flex shrink-0 items-center justify-center p-[9px]"
    >
      <span
        className={`relative h-[26px] w-[44px] rounded-full transition-colors duration-200 ${
          checked ? "bg-gradient-to-r from-teal to-violet" : "bg-field"
        }`}
      >
        <span
          className={`absolute top-[3px] h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
            checked ? "translate-x-[21px]" : "translate-x-[3px]"
          }`}
        />
      </span>
    </button>
  );
}

export function FieldInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`rounded-xl border border-field-border bg-field px-3 py-1.5 text-sm outline-none focus:border-teal/50 ${props.className ?? ""}`}
    />
  );
}

export function FieldSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`rounded-xl border border-field-border bg-field px-3 py-1.5 text-sm outline-none focus:border-teal/50 ${props.className ?? ""}`}
    />
  );
}
