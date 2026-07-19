import { useState, useEffect, useRef } from "react";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

export default function DatePicker({ value, onChange, error, minDate }) {
  const [open, setOpen]       = useState(false);
  const ref                   = useRef(null);

  const parseVal = (v) => {
    if (!v) return null;
    const [y, m, d] = v.split("-").map(Number);
    return { year: y, month: m - 1, day: d };
  };

  const today    = new Date();
  const todayY   = today.getFullYear();
  const todayM   = today.getMonth();
  const todayD   = today.getDate();
  const minParsed = parseVal(minDate);

  const parsed   = parseVal(value);
  const initYear  = parsed?.year  ?? todayY;
  const initMonth = parsed?.month ?? todayM;

  const [viewYear,  setViewYear]  = useState(initYear);
  const [viewMonth, setViewMonth] = useState(initMonth);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const openPicker = () => {
    const p = parseVal(value);
    setViewYear(p?.year   ?? todayY);
    setViewMonth(p?.month ?? todayM);
    setOpen(true);
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const isPast = (y, m, d) => {
    if (!minParsed) return false;
    if (y < minParsed.year) return true;
    if (y === minParsed.year && m < minParsed.month) return true;
    if (y === minParsed.year && m === minParsed.month && d < minParsed.day) return true;
    return false;
  };

  const isSelected = (y, m, d) =>
    parsed && parsed.year === y && parsed.month === m && parsed.day === d;

  const isToday = (y, m, d) =>
    y === todayY && m === todayM && d === todayD;

  const select = (day) => {
    if (isPast(viewYear, viewMonth, day)) return;
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    onChange(`${viewYear}-${mm}-${dd}`);
    setOpen(false);
  };

  const firstDow   = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const displayLabel = parsed
    ? `${String(parsed.day).padStart(2,"0")} ${MONTHS[parsed.month].slice(0,3)} ${parsed.year}`
    : "Select date";

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={openPicker}
        className={`w-full flex items-center justify-between bg-[#1a1a1a] border rounded-lg px-3 py-2.5 text-sm outline-none transition-colors
          ${error ? "border-red-500" : "border-zinc-800 hover:border-zinc-600 focus:border-[#f5c27a]"}`}
      >
        <span className="flex items-center gap-2.5">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8"  y1="2" x2="8"  y2="6"/>
            <line x1="3"  y1="10" x2="21" y2="10"/>
          </svg>
          <span className={`font-mono tracking-wider ${value ? "text-white" : "text-zinc-500"}`}>
            {displayLabel}
          </span>
        </span>
      </button>

      {/* Calendar popup */}
      {open && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="bg-[#161616] border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden"
            style={{ width: 320 }}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-zinc-800">
              <div>
                <p className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">Pick a date</p>
                <p className="text-xl font-black text-white mt-0.5 tracking-tight">
                  {MONTHS[viewMonth]}
                  <span className="text-orange-400 ml-2 text-base font-bold">{viewYear}</span>
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={prevMonth}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all">
                  ‹
                </button>
                <button onClick={nextMonth}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all">
                  ›
                </button>
                <button onClick={() => setOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-800 text-zinc-600 hover:text-white transition-all text-sm ml-1">
                  ✕
                </button>
              </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 px-4 pt-3 pb-1">
              {DAYS.map((d) => (
                <div key={d} className="text-center text-[10px] font-black text-zinc-600 uppercase tracking-widest py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Date grid */}
            <div className="grid grid-cols-7 px-4 pb-4 gap-y-1">
              {cells.map((day, i) => {
                if (!day) return <div key={`e-${i}`} />;
                const past     = isPast(viewYear, viewMonth, day);
                const selected = isSelected(viewYear, viewMonth, day);
                const tod      = isToday(viewYear, viewMonth, day);

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => select(day)}
                    disabled={past}
                    className={`
                      mx-auto w-9 h-9 rounded-xl text-sm font-bold transition-all flex items-center justify-center
                      ${past    ? "text-zinc-700 cursor-not-allowed"
                      : selected ? "bg-[#f5c27a] text-black shadow-lg shadow-orange-500/20 scale-105"
                      : tod      ? "bg-orange-900/40 text-orange-400 border border-orange-700/50 hover:bg-orange-900/60"
                                 : "text-zinc-300 hover:bg-zinc-800 hover:text-white"}
                    `}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-5 pb-4 pt-1 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  const mm = String(todayM + 1).padStart(2, "0");
                  const dd = String(todayD).padStart(2, "0");
                  onChange(`${todayY}-${mm}-${dd}`);
                  setOpen(false);
                }}
                className="w-full py-2 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 text-xs font-bold tracking-widest uppercase transition-all"
              >
                Today
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}