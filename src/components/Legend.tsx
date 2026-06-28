"use client";

import { ALT_BANDS } from "@/lib/altitude";

// High altitude at the top, ground at the bottom — matches the console design.
const ROWS = [...ALT_BANDS].reverse().map((b) => ({
  color: b.color,
  label: b.label === "Ground" ? "Ground" : b.label.replace("<", "< ").replace("+", " +"),
}));

export default function Legend() {
  return (
    <div className="skd-glass rounded-[16px] px-[17px] pb-4 pt-[15px]">
      <div style={{ fontWeight: 600, fontSize: 9.5, letterSpacing: "0.14em", color: "#8a8178", marginBottom: 12 }}>ALTITUDE · FT</div>
      <div className="flex flex-col gap-[7px]">
        {ROWS.map((b) => (
          <div key={b.label} className="flex items-center gap-2.5">
            <span className="rounded-full" style={{ width: 10, height: 10, background: b.color }} />
            <span className="tnum" style={{ fontWeight: 500, fontSize: 10.5, color: "#5a5247", width: 52 }}>
              {b.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
