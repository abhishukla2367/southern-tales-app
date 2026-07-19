import { useState, useEffect } from "react";
import DrumColumn from "./Drumcolumn";

const pad = (n) => String(n).padStart(2, "0");

const MINUTES  = Array.from({ length: 12 }, (_, i) => pad(i * 5));
const H12_LIST = ["12", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11"];

// Parse "HH:MM" (24h) or "HH:MM AM/PM" → { hour12, minute, period }
const parse = (val) => {
  if (!val) return { hour12: "12", minute: "00", period: "AM" };
  const match = val.match(/(\d+):(\d+)(?:\s*(AM|PM))?/i);
  if (!match) return { hour12: "12", minute: "00", period: "AM" };
  let h = parseInt(match[1], 10);
  const m = Math.round(parseInt(match[2], 10) / 5) * 5 % 60;
  const period = match[3] ? match[3].toUpperCase() : (h < 12 ? "AM" : "PM");
  if (match[3]) {
    if (period === "AM" && h === 12) h = 0;
    if (period === "PM" && h < 12)  h = h + 12;
  }
  const h12 = h % 12 || 12;
  return { hour12: pad(h12), minute: pad(m), period };
};

const to24h = (hour12str, period) => {
  let h = parseInt(hour12str, 10);
  if (period === "AM") return h === 12 ? 0 : h;
  return h === 12 ? 12 : h + 12;
};

export default function TimePicker({ value, onChange, error }) {
  const [open, setOpen] = useState(false);
  const [tempHour,   setTempHour]   = useState("12");
  const [tempMinute, setTempMinute] = useState("00");
  const [tempPeriod, setTempPeriod] = useState("AM");

  // Sync drum state whenever value changes (fixes "0:00 AM" on first open)
  useEffect(() => {
    const p = parse(value);
    setTempHour(p.hour12);
    setTempMinute(p.minute);
    setTempPeriod(p.period);
  }, [value]);

  const openPicker = () => {
    const p = parse(value);
    setTempHour(p.hour12);
    setTempMinute(p.minute);
    setTempPeriod(p.period);
    setOpen(true);
  };

  const confirm = () => {
    const h24 = to24h(tempHour, tempPeriod);
    onChange(`${pad(h24)}:${tempMinute}`);
    setOpen(false);
  };

  // Trigger shows "HH:MM" only — no AM/PM badge
  const parsed = parse(value);
  const displayLabel = value ? `${parsed.hour12}:${parsed.minute} ${parsed.period}` : "Select time";

  return (
    <>
      {/* Trigger */}
      <button type="button" onClick={openPicker}
        className={`w-full flex items-center bg-[#1a1a1a] border rounded-lg px-3 py-2.5 text-sm outline-none transition-colors
          ${error ? "border-red-500" : "border-zinc-800 hover:border-zinc-600"}`}>
        <span className="flex items-center gap-2.5">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400 shrink-0">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <span className="font-mono tracking-wider text-white">{displayLabel}</span>
        </span>
      </button>

      {/* Dialog */}
      {open && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="bg-[#161616] border border-zinc-700/80 rounded-2xl shadow-2xl" style={{ width: 280 }}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-zinc-800">
              <div>
                <p className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">Pick a time</p>
                <p className="text-2xl font-black font-mono text-white mt-0.5 tracking-tight">
                  {tempHour}
                  <span className="text-zinc-600 mx-1">:</span>
                  {tempMinute}
                  <span className={`ml-2 text-sm font-bold ${tempPeriod === "AM" ? "text-sky-400" : "text-orange-400"}`}>
                    {tempPeriod}
                  </span>
                </p>
              </div>
              <button onClick={() => setOpen(false)}
                className="text-zinc-600 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-800 transition-all text-sm">
                ✕
              </button>
            </div>

            {/* Drums + AM/PM */}
            <div className="flex items-center justify-center gap-1 px-4 py-3">
              <DrumColumn items={H12_LIST} selected={tempHour}   onSelect={setTempHour}   label="Hour" />
              <span className="text-[#f5c27a]/40 font-black text-2xl mt-4">:</span>
              <DrumColumn items={MINUTES}  selected={tempMinute} onSelect={setTempMinute} label="Min"  />
              <div className="flex flex-col gap-2 mt-5 ml-2">
                {["AM", "PM"].map((p) => (
                  <button key={p} type="button" onClick={() => setTempPeriod(p)}
                    className={`px-3 py-2 rounded-xl text-xs font-black tracking-widest transition-all
                      ${tempPeriod === p
                        ? p === "AM"
                          ? "bg-sky-500 text-white shadow-lg shadow-sky-500/25"
                          : "bg-orange-500 text-white shadow-lg shadow-orange-500/25"
                        : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-white"}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-5 pb-4 pt-2">
              <button type="button" onClick={() => setOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 text-sm font-bold transition-all">
                Cancel
              </button>
              <button type="button" onClick={confirm}
                className="flex-1 py-2.5 rounded-xl bg-[#f5c27a] hover:bg-[#e0a84a] text-black text-sm font-black tracking-wide transition-all active:scale-95">
                ✔ Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}