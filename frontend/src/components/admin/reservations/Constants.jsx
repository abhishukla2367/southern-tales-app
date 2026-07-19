// ─── Status Config ─────────────────────────────────────────────────────────────
export const STATUS_STYLES = {
  Cancelled: { badge: "bg-red-900/40 text-red-400 border border-red-700",         select: "bg-red-900/40 text-red-400 border border-red-700" },
  Completed: { badge: "bg-blue-900/40 text-blue-400 border border-blue-700",       select: "bg-blue-900/40 text-blue-400 border border-blue-700" },
  Waiting:   { badge: "bg-amber-900/40 text-amber-400 border border-amber-700",    select: "bg-amber-900/40 text-amber-400 border border-amber-700" },
  Seated:    { badge: "bg-violet-900/40 text-violet-400 border border-violet-700", select: "bg-violet-900/40 text-violet-400 border border-violet-700" },
};

export const STATUS_OPTIONS = ["Waiting", "Seated", "Completed", "Cancelled"];

// ─── Table Config ──────────────────────────────────────────────────────────────
export const TABLES = [
  { id: "T-01", capacity: 2, type: "Window"   }, { id: "T-02", capacity: 2, type: "Window"   },
  { id: "T-03", capacity: 4, type: "Window"   }, { id: "T-04", capacity: 4, type: "Corner"   },
  { id: "T-05", capacity: 4, type: "Corner"   }, { id: "T-06", capacity: 6, type: "Outdoor"  },
  { id: "T-07", capacity: 6, type: "Outdoor"  }, { id: "T-08", capacity: 4, type: "Booth"    },
  { id: "T-09", capacity: 4, type: "Booth"    }, { id: "T-10", capacity: 2, type: "Bar"      },
  { id: "T-11", capacity: 2, type: "Bar"      }, { id: "T-12", capacity: 4, type: "Standard" },
  { id: "T-13", capacity: 4, type: "Standard" }, { id: "T-14", capacity: 4, type: "Standard" },
  { id: "T-15", capacity: 6, type: "Standard" }, { id: "T-16", capacity: 6, type: "Standard" },
  { id: "T-17", capacity: 8, type: "Standard" }, { id: "T-18", capacity: 8, type: "Corner"   },
  { id: "T-19", capacity: 2, type: "Window"   }, { id: "T-20", capacity: 6, type: "Outdoor"  },
];

export const TABLE_IDS = TABLES.map((t) => t.id);

// ─── Business Hours ────────────────────────────────────────────────────────────
export const isWithinBusinessHours = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return true;

  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const dayOfWeek = date.getDay();

  // Pure 24h format "HH:MM" — also handles legacy "HH:MM AM/PM"
  const match = timeStr.match(/(\d+):(\d+)(?:\s*(AM|PM))?/i);
  if (!match) return true;

  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const period = (match[3] || "").toUpperCase();

  // Normalize legacy AM/PM if present
  if (period === "AM" && h === 12) h = 0;
  if (period === "PM" && h < 12)  h = h + 12;

  const totalMinutes = h * 60 + m;
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  return isWeekend
    ? totalMinutes >= 480 && totalMinutes <= 1380   // 8:00 AM – 11:00 PM
    : totalMinutes >= 420 && totalMinutes <= 1350;  // 7:00 AM – 10:30 PM
};