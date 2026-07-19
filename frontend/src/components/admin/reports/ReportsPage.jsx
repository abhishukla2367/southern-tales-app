import { useState, useEffect, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import API from "../../../api/axiosConfig";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Area, AreaChart,
} from "recharts";
import {
  TrendingUp, TrendingDown, ShoppingBag, CalendarCheck,
  IndianRupee, Award, BarChart2, ChevronRight, Minus, Package,
} from "lucide-react";

const TABS = ["Weekly", "Monthly", "Annual"];

function ChartBox({ height = 220, children }) {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    setWidth(ref.current.offsetWidth);
    const ro = new ResizeObserver(() => ref.current && setWidth(ref.current.offsetWidth));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ width: "100%", height }}>
      {width > 0 && children(width)}
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-[10px] font-black uppercase tracking-widest text-[#888] mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-xs font-bold">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-[#aaa]">{p.name}:</span>
          <span className="text-[#f1f1f1]">
            {p.name === "Revenue" ? `₹${Number(p.value).toLocaleString("en-IN")}` : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, color, bg, border, delay = 0, trend }) {
  return (
    <div className="relative rounded-2xl p-5 border overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
      style={{ background: bg, borderColor: border, animation: `cardIn 0.5s ease both`, animationDelay: `${delay}ms` }}>
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20 blur-2xl pointer-events-none" style={{ background: color }} />
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#666] mb-3">{label}</p>
          <p className="text-2xl md:text-3xl font-black tabular-nums leading-none" style={{ color }}>{value}</p>
          <p className="text-[11px] text-[#555] mt-2 font-medium">{sub}</p>
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-4 flex items-center gap-1.5">
          {trend === null ? (
            <><Minus size={11} className="text-[#444]" /><span className="text-[10px] font-black text-[#444]">No prior data</span></>
          ) : trend > 0 ? (
            <><TrendingUp size={11} className="text-emerald-400" /><span className="text-[10px] font-black text-emerald-400">+{trend}% vs last period</span></>
          ) : trend < 0 ? (
            <><TrendingDown size={11} className="text-red-400" /><span className="text-[10px] font-black text-red-400">{trend}% vs last period</span></>
          ) : (
            <><Minus size={11} className="text-[#555]" /><span className="text-[10px] font-black text-[#555]">0% vs last period</span></>
          )}
        </div>
      )}
      <div className="absolute bottom-0 left-0 h-[2px] w-full opacity-40"
        style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
    </div>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-[#1f1f1f] bg-[#0d0d0d]">
      <div className="px-6 py-4 border-b border-[#1a1a1a]">
        <h3 className="text-sm font-black text-[#f1f1f1]">{title}</h3>
        {subtitle && <p className="text-[10px] text-[#555] mt-0.5 font-medium uppercase tracking-widest">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-[#111] border border-[#1f1f1f]" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="h-64 rounded-2xl bg-[#111] border border-[#1f1f1f]" />
        <div className="h-64 rounded-2xl bg-[#111] border border-[#1f1f1f]" />
      </div>
      <div className="h-72 rounded-2xl bg-[#111] border border-[#1f1f1f]" />
    </div>
  );
}

function TH({ children, align = "left" }) {
  return <th className={`px-5 py-3.5 text-[9px] font-black uppercase tracking-[0.25em] text-[#444] text-${align}`}>{children}</th>;
}

function TD({ children, align = "left", className = "" }) {
  return <td className={`px-5 py-4 text-${align} ${className}`}>{children}</td>;
}

function EmptyChartState({ message = "No data for this period" }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center mb-4">
        <BarChart2 size={20} className="text-[#333]" />
      </div>
      <p className="text-sm font-black text-[#333]">{message}</p>
    </div>
  );
}

export default function ReportsPage({ downloadReportRef }) {
  const [activeTab, setActiveTab] = useState("Weekly");
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      setError(false);
      setData(null);
      try {
        const { data: res } = await API.get(`/reports/${activeTab.toLowerCase()}`);
        if (res.success === false) throw new Error(res.message || "Report failed");
        setData(res);
      } catch (err) {
        console.error("Failed to fetch report:", err.message);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [activeTab]);

  // ── Register Download Report handler ──────────────────────────────────────
  const exportToExcel = useCallback(() => {
    if (!data) return alert("Report data not loaded yet. Please wait.");

    const dateSlug = new Date().toISOString().slice(0, 10);
    const wb = XLSX.utils.book_new();

    // Sheet 1: Summary
    const summaryRows = [
      { "Metric": "Period",           "Value": activeTab },
      { "Metric": "Total Revenue (₹)", "Value": data.totalRevenue || 0 },
      { "Metric": "Total Orders",     "Value": data.totalOrders || 0 },
      { "Metric": "Reservations",     "Value": data.totalReservations || 0 },
      { "Metric": "Avg Order Value (₹)", "Value": data.avgOrderValue || 0 },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    wsSummary["!cols"] = [{ wch: 24 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    // Sheet 2: Breakdown
    if (data.breakdown?.length > 0) {
      const breakdownRows = data.breakdown.map((row) => ({
        "Period":        row.period,
        "Orders":        row.orders,
        "Reservations":  row.reservations,
        "Revenue (₹)":   row.revenue,
        "Avg / Order (₹)": row.orders > 0 ? Math.round(row.revenue / row.orders) : 0,
      }));
      const wsBreakdown = XLSX.utils.json_to_sheet(breakdownRows);
      wsBreakdown["!cols"] = Object.keys(breakdownRows[0]).map((k) => ({
        wch: Math.max(k.length, ...breakdownRows.map((r) => String(r[k] ?? "").length)) + 2,
      }));
      XLSX.utils.book_append_sheet(wb, wsBreakdown, "Breakdown");
    }

    // Sheet 3: Top Items
    if (data.topItems?.length > 0) {
      const itemRows = data.topItems.map((item, idx) => ({
        "Rank":         idx + 1,
        "Item":         item.name,
        "Category":     item.category || "—",
        "Qty Sold":     item.totalQty,
        "Revenue (₹)":  item.totalRevenue,
      }));
      const wsItems = XLSX.utils.json_to_sheet(itemRows);
      wsItems["!cols"] = Object.keys(itemRows[0]).map((k) => ({
        wch: Math.max(k.length, ...itemRows.map((r) => String(r[k] ?? "").length)) + 2,
      }));
      XLSX.utils.book_append_sheet(wb, wsItems, "Top Items");
    }

    XLSX.writeFile(wb, `SouthernTales_Report_${activeTab}_${dateSlug}.xlsx`);
  }, [data, activeTab]);

  useEffect(() => {
    if (downloadReportRef) downloadReportRef.current = exportToExcel;
  }, [exportToExcel, downloadReportRef]);

  const BAR_COLORS = ["#f5c27a", "#60a5fa", "#a78bfa", "#34d399", "#f87171", "#fb923c", "#38bdf8"];

  const stats = data ? [
    { label: "Total Revenue", icon: IndianRupee, value: `₹${(data.totalRevenue || 0).toLocaleString("en-IN")}`, sub: "from confirmed orders", color: "#34d399", bg: "#0d1f18", border: "#1a3a2a", trend: data.revenueTrend },
    { label: "Total Orders",  icon: ShoppingBag, value: data.totalOrders || 0, sub: "orders placed", color: "#f5c27a", bg: "#1a1400", border: "#2e2200", trend: data.ordersTrend },
    { label: "Reservations",  icon: CalendarCheck, value: data.totalReservations || 0, sub: "tables booked", color: "#60a5fa", bg: "#0d1829", border: "#1a2e4a", trend: data.reservationsTrend },
    { label: "Avg Order Value", icon: Award, value: `₹${(data.avgOrderValue || 0).toLocaleString("en-IN")}`, sub: "per order", color: "#a78bfa", bg: "#150d29", border: "#2a1a4a", trend: data.avgTrend },
  ] : [];

  return (
    <>
      <style>{`
        @keyframes cardIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .report-fade { animation: fadeIn 0.4s ease both; }
      `}</style>

      <div className="space-y-7">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#111] border border-[#1f1f1f] w-fit">
          {TABS.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="px-5 py-2 text-[11px] font-black uppercase tracking-[0.15em] rounded-lg transition-all duration-200"
              style={activeTab === tab ? { background: "#f5c27a", color: "#0a0a0a" } : { color: "#555" }}>
              {tab}
            </button>
          ))}
        </div>

        {loading && <Skeleton />}

        {error && !loading && (
          <div className="rounded-2xl p-10 text-center bg-[#0d0d0d] border border-[#2a1a1a]">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
              <BarChart2 size={20} className="text-red-400" />
            </div>
            <p className="text-sm font-black text-[#f1f1f1] mb-1">Failed to load report</p>
            <p className="text-xs text-[#555]">Make sure the backend is running and try again.</p>
          </div>
        )}

        {!loading && !error && data && (
          <div className="space-y-6 report-fade">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((s, i) => <StatCard key={s.label} {...s} delay={i * 80} />)}
            </div>

            {data.breakdown?.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Section title="Revenue Trend" subtitle={`${activeTab} breakdown`}>
                  <div className="p-5">
                    <ChartBox height={210}>
                      {(w) => (
                        <AreaChart width={w} height={210} data={data.breakdown} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%"  stopColor="#34d399" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                          <XAxis dataKey="period" stroke="#2a2a2a" tick={{ fill: "#555", fontSize: 10 }} />
                          <YAxis stroke="#2a2a2a" tick={{ fill: "#555", fontSize: 10 }} width={50}
                            tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                          <Tooltip content={<CustomTooltip />} />
                          <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#34d399" strokeWidth={2}
                            fill="url(#revGrad)" dot={{ r: 3, fill: "#34d399", strokeWidth: 0 }} activeDot={{ r: 5, fill: "#34d399" }} />
                        </AreaChart>
                      )}
                    </ChartBox>
                  </div>
                </Section>

                <Section title="Orders & Reservations" subtitle="side by side">
                  <div className="p-5">
                    <ChartBox height={210}>
                      {(w) => (
                        <BarChart width={w} height={210} data={data.breakdown} margin={{ top: 5, right: 5, left: 0, bottom: 0 }} barGap={4}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                          <XAxis dataKey="period" stroke="#2a2a2a" tick={{ fill: "#555", fontSize: 10 }} />
                          <YAxis stroke="#2a2a2a" tick={{ fill: "#555", fontSize: 10 }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="orders"       name="Orders"       fill="#f5c27a" radius={[4, 4, 0, 0]} maxBarSize={28} />
                          <Bar dataKey="reservations" name="Reservations" fill="#60a5fa" radius={[4, 4, 0, 0]} maxBarSize={28} />
                        </BarChart>
                      )}
                    </ChartBox>
                  </div>
                </Section>
              </div>
            ) : (
              <Section title="Revenue & Orders" subtitle="breakdown">
                <EmptyChartState message="No order data for this period" />
              </Section>
            )}

            <Section title="Top Selling Items" subtitle={`best performers this ${activeTab.toLowerCase()} period`}>
              {data.topItems?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#1a1a1a]">
                        <TH align="center">#</TH>
                        <TH align="center">Image</TH>
                        <TH align="left">Item Name</TH>
                        <TH align="center">Qty Sold</TH>
                        <TH align="right">Revenue</TH>
                        <TH align="right">Share</TH>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topItems.map((item, idx) => {
                        const maxRev = Math.max(...data.topItems.map((i) => i.totalRevenue));
                        const pct    = maxRev > 0 ? Math.round((item.totalRevenue / maxRev) * 100) : 0;
                        const unit   = item.unit || "pcs";
                        return (
                          <tr key={idx} className="border-b border-[#131313] hover:bg-[#111] transition-colors group"
                            style={{ animation: `cardIn 0.4s ease both`, animationDelay: `${idx * 60}ms` }}>
                            <TD align="center">
                              <div className="flex justify-center">
                                <span className="w-6 h-6 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-[10px] font-black text-[#555]">{idx + 1}</span>
                              </div>
                            </TD>
                            <TD align="center">
                              <div className="flex justify-center">
                                <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#1f1f1f] bg-[#111] flex items-center justify-center">
                                  {item.image ? (
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                  ) : (
                                    <Package size={14} className="text-[#333]" />
                                  )}
                                </div>
                              </div>
                            </TD>
                            <TD align="left">
                              <div className="flex items-center gap-3">
                                <div className="w-1.5 h-8 rounded-full flex-shrink-0" style={{ background: BAR_COLORS[idx % BAR_COLORS.length] }} />
                                <div>
                                  <span className="text-sm font-bold text-[#f1f1f1] group-hover:text-white transition-colors block">{item.name}</span>
                                  {item.category && <span className="text-[9px] font-black uppercase tracking-widest text-[#444] mt-0.5 block">{item.category}</span>}
                                  {item.description && <span className="text-[10px] text-[#3a3a3a] mt-0.5 block leading-tight max-w-[200px] truncate group-hover:text-[#555] transition-colors">{item.description}</span>}
                                </div>
                              </div>
                            </TD>
                            <TD align="center">
                              <span className="text-sm font-bold text-[#f5c27a]">{item.totalQty}</span>
                              <span className="text-[10px] text-[#444] ml-1">{unit}</span>
                            </TD>
                            <TD align="right">
                              <span className="text-sm font-black text-emerald-400">₹{item.totalRevenue.toLocaleString("en-IN")}</span>
                            </TD>
                            <TD align="right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-16 h-1.5 rounded-full bg-[#1a1a1a] overflow-hidden">
                                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: BAR_COLORS[idx % BAR_COLORS.length] }} />
                                </div>
                                <span className="text-[10px] font-black text-[#555] w-8 text-right">{pct}%</span>
                              </div>
                            </TD>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyChartState message="No items sold in this period" />
              )}
            </Section>

            {data.breakdown?.length > 0 && (
              <Section
                title={activeTab === "Weekly" ? "Daily Breakdown" : activeTab === "Monthly" ? "Weekly Breakdown" : "Monthly Breakdown"}
                subtitle={`detailed ${activeTab.toLowerCase()} data`}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#1a1a1a]">
                        <TH align="left">Period</TH>
                        <TH align="center">Orders</TH>
                        <TH align="center">Reservations</TH>
                        <TH align="right">Revenue</TH>
                        <TH align="right">Avg / Order</TH>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const maxOrders = Math.max(...data.breakdown.map((r) => r.orders), 1);
                        return data.breakdown.map((row, idx) => {
                          const avg = row.orders > 0 ? Math.round(row.revenue / row.orders) : 0;
                          return (
                            <tr key={idx} className="border-b border-[#131313] hover:bg-[#111] transition-colors group"
                              style={{ animation: `cardIn 0.4s ease both`, animationDelay: `${idx * 50}ms` }}>
                              <TD align="left">
                                <div className="flex items-center gap-2">
                                  <ChevronRight size={12} className="text-[#2a2a2a] group-hover:text-[#f5c27a] transition-colors flex-shrink-0" />
                                  <span className="text-sm font-bold text-[#f1f1f1]">{row.period}</span>
                                </div>
                              </TD>
                              <TD align="center">
                                <div className="flex items-center justify-center gap-2">
                                  <span className="text-sm font-bold text-[#f5c27a]">{row.orders}</span>
                                  <div className="w-10 h-1 rounded-full bg-[#1a1a1a] overflow-hidden">
                                    <div className="h-full bg-[#f5c27a] rounded-full" style={{ width: `${maxOrders > 0 ? Math.round((row.orders / maxOrders) * 100) : 0}%` }} />
                                  </div>
                                </div>
                              </TD>
                              <TD align="center"><span className="text-sm font-bold text-blue-400">{row.reservations}</span></TD>
                              <TD align="right"><span className="text-sm font-black text-emerald-400">₹{row.revenue.toLocaleString("en-IN")}</span></TD>
                              <TD align="right"><span className="text-xs font-bold text-[#888]">{avg > 0 ? `₹${avg.toLocaleString("en-IN")}` : "—"}</span></TD>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-[#2a2a2a] bg-[#0a0a0a]">
                        <td className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-[#444]">Total</td>
                        <td className="px-5 py-4 text-center"><span className="text-sm font-black text-[#f5c27a]">{data.breakdown.reduce((s, r) => s + r.orders, 0)}</span></td>
                        <td className="px-5 py-4 text-center"><span className="text-sm font-black text-blue-400">{data.breakdown.reduce((s, r) => s + r.reservations, 0)}</span></td>
                        <td className="px-5 py-4 text-right"><span className="text-sm font-black text-emerald-400">₹{data.breakdown.reduce((s, r) => s + r.revenue, 0).toLocaleString("en-IN")}</span></td>
                        <td className="px-5 py-4 text-right">
                          <span className="text-xs font-black text-[#888]">
                            {(() => {
                              const to = data.breakdown.reduce((s, r) => s + r.orders, 0);
                              const tr = data.breakdown.reduce((s, r) => s + r.revenue, 0);
                              return to > 0 ? `₹${Math.round(tr / to).toLocaleString("en-IN")}` : "—";
                            })()}
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </Section>
            )}

            <div className="flex items-center justify-between py-2">
              <p className="text-[10px] text-[#333] font-bold uppercase tracking-widest">
                {activeTab} Report · Generated {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-[#333] uppercase tracking-widest">Live Data</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}