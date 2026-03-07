import React, { useState, useEffect, useCallback, useRef } from "react";
import { ShoppingBag, Timer, Calendar, IndianRupee, RefreshCw } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, LineChart, Line,
} from "recharts";
import * as XLSX from "xlsx";
import API from "../../api/axiosConfig";

const REFRESH_INTERVAL = 15000;
const CHART_HEIGHT = 240;

function extractArray(responseData, ...keys) {
  if (Array.isArray(responseData)) return responseData;
  for (const key of keys) {
    if (Array.isArray(responseData?.[key])) return responseData[key];
  }
  return [];
}

function ChartBox({ children }) {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!ref.current) return;
    setWidth(ref.current.offsetWidth);
    const ro = new ResizeObserver(() => {
      if (ref.current) setWidth(ref.current.offsetWidth);
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className="w-full" style={{ height: CHART_HEIGHT }}>
      {width > 0 ? children(width) : null}
    </div>
  );
}

export default function DashboardCards({ downloadReportRef }) {
  const [data, setData]               = useState({ todayOrders: 0, pendingOrders: 0, reservations: 0, revenue: 0 });
  const [history, setHistory]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLive, setIsLive]           = useState(true);
  const [error, setError]             = useState(null);

  const fetchDashboardData = useCallback(async () => {
    setError(null);
    try {
      const [ordersRes, reservationsRes] = await Promise.allSettled([
        API.get("/orders/admin/all"),
        API.get("/reservations/admin/all"),
      ]);

      let todayOrders = 0, pendingOrders = 0, revenue = 0;
      if (ordersRes.status === "fulfilled") {
        const orders = extractArray(ordersRes.value.data, "data", "orders", "items");
        const today  = new Date().toDateString();
        todayOrders   = orders.filter((o) => new Date(o.createdAt).toDateString() === today).length;
        pendingOrders = orders.filter((o) => ["Pending", "pending", "Processing", "processing"].includes(o.status)).length;
        revenue       = orders
          .filter((o) => new Date(o.createdAt).toDateString() === today)
          .reduce((sum, o) => sum + (o.totalAmount || o.total || 0), 0);
      }

      let reservations = 0;
      if (reservationsRes.status === "fulfilled") {
        const res        = extractArray(reservationsRes.value.data, "data", "reservations", "items");
        const todayStr   = new Date().toLocaleDateString("en-CA");
        const IST_OFFSET = 5.5 * 60 * 60 * 1000;
        reservations = res.filter((r) => {
          const d       = new Date(r.date || r.createdAt);
          const istDate = new Date(d.getTime() + IST_OFFSET);
          return istDate.toISOString().split("T")[0] === todayStr;
        }).length;
      }

      const newData = { todayOrders, pendingOrders, reservations, revenue };
      setData(newData);

      const _n = new Date();
      const _h = _n.getHours();
      const timestamp = `${String(_h).padStart(2,"0")}:${String(_n.getMinutes()).padStart(2,"0")}:${String(_n.getSeconds()).padStart(2,"0")} ${_h < 12 ? "AM" : "PM"}`;
      setHistory((prev) => [...prev, { time: timestamp, ...newData }].slice(-10));
      setLastUpdated(new Date());
      setIsLive(true);
    } catch (err) {
      setError("Could not reach server — showing last known data");
      setIsLive(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);
  useEffect(() => {
    const interval = setInterval(() => fetchDashboardData(), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // ── Register Download Report handler ──────────────────────────────────────
  const exportToExcel = useCallback(() => {
    const today = new Date().toLocaleDateString("en-IN");
    const dateSlug = new Date().toISOString().slice(0, 10);

    // Sheet 1: Summary
    const summaryRows = [
      { "Metric": "Today's Orders",       "Value": data.todayOrders },
      { "Metric": "Pending Orders",       "Value": data.pendingOrders },
      { "Metric": "Today's Reservations", "Value": data.reservations },
      { "Metric": "Today's Revenue (₹)",  "Value": data.revenue },
      { "Metric": "Report Generated",     "Value": today },
    ];

    // Sheet 2: Activity Trend history snapshots
    const trendRows = history.map((h) => ({
      "Timestamp":    h.time,
      "Orders":       h.todayOrders,
      "Pending":      h.pendingOrders,
      "Reservations": h.reservations,
      "Revenue (₹)":  h.revenue,
    }));

    const wb = XLSX.utils.book_new();

    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    wsSummary["!cols"] = [{ wch: 28 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, "Dashboard Summary");

    if (trendRows.length > 0) {
      const wsTrend = XLSX.utils.json_to_sheet(trendRows);
      wsTrend["!cols"] = [{ wch: 16 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, wsTrend, "Activity Trend");
    }

    XLSX.writeFile(wb, `SouthernTales_Dashboard_${dateSlug}.xlsx`);
  }, [data, history]);

  useEffect(() => {
    if (downloadReportRef) downloadReportRef.current = exportToExcel;
  }, [exportToExcel, downloadReportRef]);

  const stats = [
    { label: "Today's Orders",       value: data.todayOrders,   icon: ShoppingBag,  color: "text-blue-400",   iconBg: "bg-blue-400/10 border border-blue-400/20",    accent: "bg-blue-400",   hover: "hover:border-blue-400/40"   },
    { label: "Pending Orders",       value: data.pendingOrders, icon: Timer,        color: "text-amber-400",  iconBg: "bg-amber-400/10 border border-amber-400/20",  accent: "bg-amber-400",  hover: "hover:border-amber-400/40"  },
    { label: "Today's Reservations", value: data.reservations,  icon: Calendar,     color: "text-violet-400", iconBg: "bg-violet-400/10 border border-violet-400/20", accent: "bg-violet-400", hover: "hover:border-violet-400/40" },
    { label: "Today's Revenue",      value: `₹${data.revenue.toLocaleString("en-IN")}`, icon: IndianRupee, color: "text-emerald-400", iconBg: "bg-emerald-400/10 border border-emerald-400/20", accent: "bg-emerald-400", hover: "hover:border-emerald-400/40" },
  ];

  const barData = [{ name: "Live", Orders: data.todayOrders, Pending: data.pendingOrders, Reservations: data.reservations }];

  const tooltipStyle = {
    contentStyle: { backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px", color: "#f4f4f5" },
    itemStyle: { color: "#f4f4f5" },
  };

  // ── Skeleton ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="space-y-8">
      <div className="h-11 rounded-xl bg-zinc-900 border border-zinc-800 animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 animate-pulse">
            <div className="flex justify-between items-start">
              <div className="space-y-3">
                <div className="h-3 w-24 bg-zinc-800 rounded" />
                <div className="h-8 w-16 bg-zinc-800 rounded" />
              </div>
              <div className="h-11 w-11 bg-zinc-800 rounded-xl" />
            </div>
            <div className="mt-5 h-[2px] w-1/3 bg-zinc-800 rounded" />
          </div>
        ))}
      </div>
      <div className="h-80 rounded-2xl bg-zinc-900 border border-zinc-800 animate-pulse" />
    </div>
  );

  return (
    <div className="space-y-8">
      <style>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .stat-card { animation: cardIn 0.4s ease both; }

        @keyframes livePing {
          0%, 100% { box-shadow: 0 0 0 0   rgba(52,211,153,0.55); }
          65%      { box-shadow: 0 0 0 6px rgba(52,211,153,0);    }
        }
        .live-ring { animation: livePing 1.8s ease-in-out infinite; }

        .recharts-tooltip-wrapper { outline: none !important; }
      `}</style>

      {/* ── Status Bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
        <div className="flex items-center gap-2">
          <span className={`live-ring w-1.5 h-1.5 rounded-full flex-shrink-0 ${isLive ? "bg-emerald-400" : "bg-red-400"}`} />
          {lastUpdated ? (
            <span className="text-sm font-mono text-zinc-400">
              Last updated{" "}
              <span className="text-zinc-100 font-bold text-base">
                {(() => { const h = lastUpdated.getHours(); return `${String(h).padStart(2,"0")}:${String(lastUpdated.getMinutes()).padStart(2,"0")}:${String(lastUpdated.getSeconds()).padStart(2,"0")} ${h < 12 ? "AM" : "PM"}`; })()}
              </span>
            </span>
          ) : (
            <span className="text-sm font-mono text-zinc-500">Fetching data…</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-600">
          <RefreshCw size={11} className={isLive ? "text-zinc-600" : "text-red-400 animate-spin"} />
          <span>auto-refresh · 15s</span>
        </div>
      </div>

      {/* ── Error Banner ───────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}

      {/* ── Stat Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" role="list">
        {stats.map((item, i) => (
          <div
            key={item.label}
            role="listitem"
            tabIndex={0}
            className={`stat-card relative overflow-hidden p-6 rounded-2xl cursor-default bg-zinc-900 border border-zinc-800 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 focus-visible:outline-offset-2 ${item.hover}`}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.025] to-transparent" />
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">{item.label}</p>
                <p className="text-3xl font-black mt-3 tabular-nums text-zinc-100 tracking-tight">{item.value}</p>
              </div>
              <div className={`p-2.5 rounded-xl flex-shrink-0 ${item.iconBg}`}>
                <item.icon size={18} className={item.color} aria-hidden="true" />
              </div>
            </div>
            <div className={`mt-5 h-[2px] rounded-full w-8 opacity-50 ${item.accent}`} />
          </div>
        ))}
      </div>

      {/* ── Charts ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
          <h3 className="text-sm font-bold text-zinc-100">Live Snapshot</h3>
          <p className="text-xs font-mono text-zinc-500 mt-1 mb-5">Current counts right now</p>
          <ChartBox>
            {(w) => (
              <BarChart width={w} height={CHART_HEIGHT} data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#52525b" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                <YAxis stroke="#52525b" tick={{ fill: "#a1a1aa", fontSize: 12 }} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ paddingTop: "16px", fontSize: "12px", color: "#d4d4d8" }} />
                <Bar dataKey="Orders"       fill="#60a5fa" radius={[4,4,0,0]} maxBarSize={56} />
                <Bar dataKey="Pending"      fill="#fbbf24" radius={[4,4,0,0]} maxBarSize={56} />
                <Bar dataKey="Reservations" fill="#a78bfa" radius={[4,4,0,0]} maxBarSize={56} />
              </BarChart>
            )}
          </ChartBox>
        </div>

        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
          <h3 className="text-sm font-bold text-zinc-100">Activity Trend</h3>
          <p className="text-xs font-mono text-zinc-500 mt-1 mb-5">Last {history.length} snapshots</p>
          <ChartBox>
            {(w) =>
              history.length < 2 ? (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-zinc-500">
                  <RefreshCw size={20} className="animate-spin opacity-40" />
                  <p className="text-sm">Collecting trend data…</p>
                  <p className="text-xs font-mono">auto-refreshes every 15s</p>
                </div>
              ) : (
                <LineChart width={w} height={CHART_HEIGHT} data={history} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="time" stroke="#52525b" tick={{ fill: "#a1a1aa", fontSize: 9 }} />
                  <YAxis stroke="#52525b" tick={{ fill: "#a1a1aa", fontSize: 12 }} allowDecimals={false} />
                  <Tooltip {...tooltipStyle} />
                  <Legend wrapperStyle={{ paddingTop: "16px", fontSize: "12px", color: "#d4d4d8" }} />
                  <Line type="monotone" dataKey="todayOrders"   stroke="#60a5fa" strokeWidth={2} dot={false} name="Orders"       activeDot={{ r: 4, fill: "#60a5fa" }} />
                  <Line type="monotone" dataKey="pendingOrders" stroke="#fbbf24" strokeWidth={2} dot={false} name="Pending"      activeDot={{ r: 4, fill: "#fbbf24" }} />
                  <Line type="monotone" dataKey="reservations"  stroke="#a78bfa" strokeWidth={2} dot={false} name="Reservations" activeDot={{ r: 4, fill: "#a78bfa" }} />
                </LineChart>
              )
            }
          </ChartBox>
        </div>
      </div>

      {/* ── Revenue Panel ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-bold text-zinc-100">Today's Revenue</h3>
          <span className="text-[10px] font-bold font-mono tracking-widest text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-3 py-1 rounded-full animate-pulse">
            ● LIVE
          </span>
        </div>
        <p className="text-xs font-mono text-zinc-500 mb-5">From today's completed orders</p>
        <p className="text-5xl font-black text-emerald-400 tabular-nums tracking-tight leading-none">
          ₹{data.revenue.toLocaleString("en-IN")}
        </p>
        <div className="mt-5 h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${Math.min((data.revenue / 50000) * 100, 100)}%`,
              boxShadow: "0 0 10px rgba(52,211,153,0.4)",
            }}
          />
        </div>
        <div className="flex justify-between items-center mt-2.5 text-xs font-mono">
          <span className="text-zinc-500">
            {Math.min(Math.round((data.revenue / 50000) * 100), 100)}% of daily target
          </span>
          <span className="text-zinc-600">₹50,000 goal</span>
        </div>
      </div>
    </div>
  );
}