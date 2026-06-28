"use client";

import { ALT_BANDS } from "@/lib/altitude";

// High altitude at the top, ground at the bottom — matches the console design.
const ROWS = [...ALT_BANDS].reverse().map((b) => ({
  color: b.color,
  label: b.label === "Ground" ? "GROUND" : b.label.replace("<", "< ").replace("+", " +").toUpperCase(),
}));

export default function Legend() {
  return (
    <div className="skd-glass rounded-[13px] px-[15px] pb-[14px] pt-[13px]">
      <div style={{ fontFamily: "var(--font-ui)", fontWeight: 600, fontSize: 9.5, letterSpacing: "0.2em", color: "#8a98a8", marginBottom: 11 }}>
        ALTITUDE · FT
      </div>
      <div className="flex flex-col gap-[5px]">
        {ROWS.map((b) => (
          <div key={b.label} className="flex items-center gap-[9px]">
            <span className="rounded-[2px]" style={{ width: 22, height: 9, background: b.color }} />
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500, fontSize: 10, color: "#aab6c4", width: 54 }}>
              {b.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
