"use client";

import { LEGEND } from "@/lib/altitude";

export default function Legend() {
  return (
    <div className="rounded-lg bg-neutral-950/80 px-3 py-2 backdrop-blur ring-1 ring-white/10">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
        Altitude
      </div>
      <div className="flex flex-col gap-0.5">
        {LEGEND.slice(1).map((b) => (
          <div key={b.label} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: b.color }} />
            <span className="text-[10px] text-neutral-300">{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
