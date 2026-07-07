"use client";

import { useEffect, useRef, useState } from "react";

export interface TabDef {
  id: string;
  label: string;
  count?: number;
}

function maskFor(showLeft: boolean, showRight: boolean): string {
  if (!showLeft && !showRight) return "none";
  const left = showLeft ? "transparent, black 20px" : "black";
  const right = showRight ? "black calc(100% - 20px), transparent" : "black";
  return `linear-gradient(to right, ${left}, ${right})`;
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  function updateFades() {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeftFade(el.scrollLeft > 4);
    setShowRightFade(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  useEffect(() => {
    updateFades();
    window.addEventListener("resize", updateFades);
    return () => window.removeEventListener("resize", updateFades);
  }, [tabs.length]);

  const mask = maskFor(showLeftFade, showRightFade);

  return (
    <div
      ref={scrollRef}
      onScroll={updateFades}
      className="flex min-w-0 gap-1.5 overflow-x-auto rounded-full border border-line bg-paper-raised/70 p-1.5 backdrop-blur-md"
      style={{ maskImage: mask, WebkitMaskImage: mask }}
    >
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
