export interface TabDef {
  id: string;
  label: string;
  count?: number;
}

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: TabDef[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-1.5 overflow-x-auto rounded-full border border-line bg-paper-raised/70 p-1.5 backdrop-blur-md">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-200 ${
              isActive
                ? "bg-gradient-to-r from-teal to-violet text-teal-ink shadow-[0_0_18px_-4px_var(--glow)]"
                : "text-ink-soft hover:bg-line/60 hover:text-ink"
            }`}
          >
            {tab.label}
            {tab.count != null && (
              <span
                className={`rounded-full px-1.5 py-0.5 font-mono text-xs ${
                  isActive ? "bg-black/15" : "bg-line/60"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
