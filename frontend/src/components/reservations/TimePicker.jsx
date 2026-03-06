import { useState } from "react";
import DrumColumn from "./Drumcolumn";

const pad = (n) => String(n).padStart(2, "0");

const MINUTES  = Array.from({ length: 12 }, (_, i) => pad(i * 5));           // "00","05"..."55"
const AM_HOURS = Array.from({ length: 12 }, (_, i) => pad(i + 1));           // "01"–"12"
const PM_HOURS = [...Array.from({ length: 11 }, (_, i) => pad(i + 13)), "00"]; // "13"–"23","00"

export default function TimePicker({ value, onChange, error }) {
  const [open, setOpen] = useState(false);

  // Parse "HH:MM AM/PM" → { hour: "09", minute: "00", period: "AM" }
  const parse = (val) => {
    if (!val) return { hour: "09", minute: "00", period: "AM" };
    const match = val.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (match) {
      const rawMin = parseInt(match[2], 10);
      return {
        hour:   pad(parseInt(match[1], 10)),
        minute: pad(Math.round(rawMin / 5) * 5 % 60),
        period: match[3].toUpperCase(),
      };
    }
    return { hour: "09", minute: "00", period: "AM" };
  };

  const parsed = parse(value);
  const [tempHour,   setTempHour]   = useState(parsed.hour);
  const [tempMinute, setTempMinute] = useState(parsed.minute);
  const [tempPeriod, setTempPeriod] = useState(parsed.period);

  const openPicker = () => {
    const p = parse(value);
    setTempHour(p.hour);
    setTempMinute(p.minute);
    setTempPeriod(p.period);
    setOpen(true);
  };

  // Switch drum when AM/PM changes — shift hour accordingly
  const handlePeriodChange = (p) => {
    setTempPeriod(p);
    const h = parseInt(tempHour, 10);
    if (p === "AM" && h > 12) {
      setTempHour(pad(h - 12));
    } else if (p === "PM" && h > 0 && h <= 12) {
      setTempHour(pad(h + 12));
    } else if (p === "PM" && h === 0) {
      setTempHour("13");
    }
  };

  // Output "21:00 PM"
  const confirm = () => {
    onChange(`${tempHour}:${tempMinute} ${tempPeriod}`);
    setOpen(false);
  };

  const { hour, minute, period } = parsed;
  const displayLabel = value ? `${hour}:${minute} ${period}` : "Select time";
  const hourList = tempPeriod === "AM" ? AM_HOURS : PM_HOURS;

  return (
    <>
      {/* Trigger */}
      <button type="button" onClick={openPicker}
        className={`w-full flex items-center justify-between bg-[#1a1a1a] border rounded-lg px-3 py-2.5 text-sm outline-none transition-colors
          ${error ? "border-red-500" : "border-zinc-800 hover:border-zinc-600 focus:border-[#f5c27a]"}`}>
        <span className="flex items-center gap-2.5">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <span className="font-mono tracking-wider text-white">{displayLabel}</span>
        </span>
        {value && (
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md tracking-widest
            ${period === "AM"
              ? "bg-sky-900/60 text-sky-400 border border-sky-800"
              : "bg-orange-900/60 text-orange-400 border border-orange-800"}`}>
            {period}
          </span>
        )}
      </button>

      {/* Dialog */}
      {open && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="bg-[#161616] border border-zinc-700/80 rounded-2xl shadow-2xl" style={{ width: 300 }}>

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

            {/* Drums */}
            <div className="flex items-center justify-center gap-1 px-4 py-3">
              <DrumColumn items={hourList} selected={tempHour}   onSelect={setTempHour}   label="Hour" />
              <span className="text-[#f5c27a]/40 font-black text-2xl mt-4">:</span>
              <DrumColumn items={MINUTES}  selected={tempMinute} onSelect={setTempMinute} label="Min"  />

              {/* AM/PM */}
              <div className="flex flex-col gap-2 mt-5 ml-2">
                {["AM", "PM"].map((p) => (
                  <button key={p} type="button" onClick={() => handlePeriodChange(p)}
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