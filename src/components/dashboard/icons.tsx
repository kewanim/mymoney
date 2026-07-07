interface IconProps {
  className?: string;
  filled?: boolean;
}

const base = "stroke-current";

export function HomeIcon({ className, filled }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M4 11.5 12 4l8 7.5"
        className={base}
        strokeWidth={filled ? 0 : 1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={filled ? "currentColor" : "none"}
      />
      <path
        d="M6 10v8.2c0 .44.36.8.8.8H10v-4.4c0-.44.36-.8.8-.8h2.4c.44 0 .8.36.8.8V19h3.2c.44 0 .8-.36.8-.8V10"
        className={base}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={filled ? "currentColor" : "none"}
        fillOpacity={filled ? 0.18 : 0}
      />
    </svg>
  );
}

export function DocIcon({ className, filled }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect
        x="5.5"
        y="3.5"
        width="13"
        height="17"
        rx="2.2"
        className={base}
        strokeWidth={1.8}
        fill={filled ? "currentColor" : "none"}
        fillOpacity={filled ? 0.18 : 0}
      />
      <path d="M8.5 8h7M8.5 12h7M8.5 16h4" className={base} strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  );
}

export function WarningIcon({ className, filled }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 4.2 20.8 19H3.2Z"
        className={base}
        strokeWidth={1.8}
        strokeLinejoin="round"
        fill={filled ? "currentColor" : "none"}
        fillOpacity={filled ? 0.18 : 0}
      />
      <path d="M12 10v3.3" className={base} strokeWidth={1.8} strokeLinecap="round" />
      <circle cx="12" cy="16.2" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function CardIcon({ className, filled }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect
        x="3.5"
        y="5.5"
        width="17"
        height="13"
        rx="2.2"
        className={base}
        strokeWidth={1.8}
        fill={filled ? "currentColor" : "none"}
        fillOpacity={filled ? 0.18 : 0}
      />
      <path d="M3.5 9.5h17" className={base} strokeWidth={1.8} />
      <path d="M6.5 14.5h4" className={base} strokeWidth={1.8} strokeLinecap="round" />
    </svg>
  );
}

export function DollarIcon({ className, filled }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle
        cx="12"
        cy="12"
        r="8.3"
        className={base}
        strokeWidth={1.8}
        fill={filled ? "currentColor" : "none"}
        fillOpacity={filled ? 0.18 : 0}
      />
      <path
        d="M14.2 9.3c-.3-.7-1.1-1.2-2.2-1.2-1.3 0-2.4.7-2.4 1.9 0 1.1 1 1.5 2.4 1.9s2.4.8 2.4 1.9c0 1.2-1.1 1.9-2.4 1.9-1.1 0-1.9-.5-2.2-1.2M12 6.8v1.1M12 16.1v1.1"
        className={base}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
