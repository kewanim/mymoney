import type { ComponentType } from "react";
import { HomeIcon, DocIcon, WarningIcon, CardIcon, DollarIcon, ReceiptIcon } from "./icons";

export interface TabDef {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string; filled?: boolean }>;
}

export const DASHBOARD_TABS: TabDef[] = [
  { id: "overview", label: "Overview", icon: HomeIcon },
  { id: "bills", label: "Bills", icon: DocIcon },
  { id: "debts", label: "Debts", icon: WarningIcon },
  { id: "accounts", label: "Accounts", icon: CardIcon },
  { id: "income", label: "Income", icon: DollarIcon },
  { id: "receipts", label: "Receipts", icon: ReceiptIcon },
];

export function BottomTabBar({
  active,
  onChange,
}: {
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-3"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 14px)" }}
    >
      <div className="glass flex w-full max-w-md items-center gap-0.5 rounded-[28px] p-1.5 backdrop-blur-2xl backdrop-saturate-150">
        {DASHBOARD_TABS.map((tab) => {
          const isActive = tab.id === active;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-[20px] py-1.5 transition-all duration-200 active:scale-95 ${
                isActive
                  ? "bg-gradient-to-b from-teal/30 to-violet/25 text-teal shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]"
                  : "text-ink-soft"
              }`}
            >
              <Icon className="h-6 w-6" filled={isActive} />
              <span className={`w-full truncate px-0.5 text-center text-[10px] ${isActive ? "font-semibold text-ink" : "font-medium"}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
