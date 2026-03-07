import React, { useState, useContext, useRef, useEffect } from "react";
import Sidebar from "./Sidebar";
import DashboardCards from "./DashboardCards";
import MenuList from "./menu/MenuList";
import OrdersList from "./orders/OrdersList";
import ReservationsList from "./reservations/ReservationsList";
import ReportsPage from "./reports/ReportsPage";
import { AuthContext } from "../../context/AuthContext";
import {
  ShoppingBag, CalendarCheck, AlertTriangle, CheckCircle,
  ArrowLeft, Filter, Activity, Clock, Wifi, RefreshCw, Download,
} from "lucide-react";

const ALL_ACTIVITY = [
  {
    id: 1, group: "Today", type: "order", icon: ShoppingBag,
    iconColor: "#f5c27a", iconBg: "#2a1f00",
    title: "New Order Received",
    message: "Table 4 placed an order for 3 items worth $68.00",
    detail: "Items: Grilled Salmon, Caesar Salad, Iced Coffee",
    time: "2 min ago", timeAbsolute: "12:43 PM", unread: true,
  },
  {
    id: 2, group: "Today", type: "reservation", icon: CalendarCheck,
    iconColor: "#6ee7b7", iconBg: "#022c22",
    title: "Reservation Confirmed",
    message: "Party of 6 confirmed for tonight at 7:30 PM — James Wilson",
    detail: "Booking ref: #RES-2041 · Phone: +1 555 8820",
    time: "15 min ago", timeAbsolute: "12:30 PM", unread: true,
  },
  {
    id: 3, group: "Today", type: "alert", icon: AlertTriangle,
    iconColor: "#f87171", iconBg: "#2c0000",
    title: "Low Stock Warning",
    message: "Grilled Salmon is running low. Only 3 portions remaining.",
    detail: "Threshold: 5 portions · Supplier: Ocean Fresh Co.",
    time: "1 hr ago", timeAbsolute: "11:45 AM", unread: true,
  },
  {
    id: 4, group: "Today", type: "success", icon: CheckCircle,
    iconColor: "#818cf8", iconBg: "#1e1b4b",
    title: "Daily Report Ready",
    message: "Your sales summary for today has been generated.",
    detail: "Revenue: $3,240 · Orders: 47 · Avg ticket: $68.9",
    time: "2 hr ago", timeAbsolute: "10:55 AM", unread: false,
  },
  {
    id: 5, group: "Today", type: "order", icon: ShoppingBag,
    iconColor: "#f5c27a", iconBg: "#2a1f00",
    title: "Order Completed",
    message: "Order #1042 for Table 2 has been marked as completed.",
    detail: "Duration: 28 min · Server: Maria G.",
    time: "3 hr ago", timeAbsolute: "09:50 AM", unread: false,
  },
  {
    id: 6, group: "Yesterday", type: "reservation", icon: CalendarCheck,
    iconColor: "#6ee7b7", iconBg: "#022c22",
    title: "Reservation Cancelled",
    message: "Booking #RES-2039 cancelled by guest — Sophie Lee",
    detail: "Party of 4 · Originally 8:00 PM",
    time: "Yesterday", timeAbsolute: "07:12 PM", unread: false,
  },
  {
    id: 7, group: "Yesterday", type: "alert", icon: AlertTriangle,
    iconColor: "#f87171", iconBg: "#2c0000",
    title: "Payment Failed",
    message: "Card payment declined for Order #1038 at Table 7.",
    detail: "Amount: $94.50 · Resolved via cash.",
    time: "Yesterday", timeAbsolute: "06:33 PM", unread: false,
  },
  {
    id: 8, group: "Yesterday", type: "success", icon: CheckCircle,
    iconColor: "#818cf8", iconBg: "#1e1b4b",
    title: "Menu Updated",
    message: "3 new items added to the Summer Specials section.",
    detail: "Added by: Admin · Items: Mango Sorbet, Shrimp Tacos, Lemonade",
    time: "Yesterday", timeAbsolute: "02:00 PM", unread: false,
  },
  {
    id: 9, group: "Yesterday", type: "order", icon: ShoppingBag,
    iconColor: "#f5c27a", iconBg: "#2a1f00",
    title: "Peak Hour Surge",
    message: "22 orders processed between 7 PM – 9 PM.",
    detail: "Highest revenue hour: 8 PM · $740 in 60 min",
    time: "Yesterday", timeAbsolute: "09:01 PM", unread: false,
  },
  {
    id: 10, group: "2 Days Ago", type: "success", icon: CheckCircle,
    iconColor: "#818cf8", iconBg: "#1e1b4b",
    title: "Staff Schedule Published",
    message: "Weekly schedule for all front-of-house staff published.",
    detail: "Coverage: Mon – Sun · 12 staff members",
    time: "2 days ago", timeAbsolute: "10:00 AM", unread: false,
  },
  {
    id: 11, group: "2 Days Ago", type: "reservation", icon: CalendarCheck,
    iconColor: "#6ee7b7", iconBg: "#022c22",
    title: "Large Group Booking",
    message: "Party of 18 reserved for Friday 7:00 PM — Nguyen Family",
    detail: "Special request: Birthday setup, vegetarian options",
    time: "2 days ago", timeAbsolute: "03:15 PM", unread: false,
  },
];

const TYPE_FILTERS = [
  { key: "all",         label: "All" },
  { key: "order",       label: "Orders" },
  { key: "reservation", label: "Reservations" },
  { key: "alert",       label: "Alerts" },
  { key: "success",     label: "System" },
];

// ─── Live Clock ───────────────────────────────────────────────────────────────
function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const h      = now.getHours();
  const mm     = String(now.getMinutes()).padStart(2, "0");
  const ss     = String(now.getSeconds()).padStart(2, "0");
  const period = h < 12 ? "AM" : "PM";
  const timeStr = `${String(h).padStart(2, "0")}:${mm}:${ss} ${period}`;
  const dateStr = now.toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });

  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-[#141414] border border-[#2a2a2a]">
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6ee7b7] opacity-60" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#6ee7b7]" />
        </span>
        <span className="text-[9px] font-black uppercase tracking-widest text-[#6ee7b7]">Live</span>
      </div>
      <div className="w-px h-6 bg-[#2a2a2a]" />
      <div className="flex items-center gap-2">
        <Clock size={13} className="text-[#f5c27a] flex-shrink-0" />
        <div className="leading-none">
          <p className="text-sm font-black text-[#f1f1f1] tabular-nums tracking-tight">{timeStr}</p>
          <p className="text-[9px] font-bold text-[#aaa] uppercase tracking-widest mt-0.5">{dateStr}</p>
        </div>
      </div>
      <div className="w-px h-6 bg-[#2a2a2a]" />
      <div className="flex items-center gap-1.5">
        <Wifi size={12} className="text-[#818cf8]" />
        <span className="text-[9px] font-black uppercase tracking-widest text-[#818cf8]">Online</span>
      </div>
    </div>
  );
}

// ─── Activity Drawer ──────────────────────────────────────────────────────────
function ActivityDrawer({ open, onClose, activity }) {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? activity : activity.filter((a) => a.type === filter);
  const groups = filtered.reduce((acc, item) => {
    (acc[item.group] = acc[item.group] || []).push(item);
    return acc;
  }, {});

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }}
      />
      <div
        className="fixed top-0 right-0 h-full w-full max-w-[520px] z-50 flex flex-col bg-[#0f0f0f] border-l border-[#1f1f1f] shadow-2xl transition-transform duration-300 ease-out"
        style={{ transform: open ? "translateX(0)" : "translateX(100%)" }}
      >
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-5 border-b border-[#1f1f1f]">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 rounded-xl bg-[#181818] border border-[#2a2a2a] hover:border-[#f5c27a] transition-colors">
              <ArrowLeft size={15} className="text-[#d0d0d0]" />
            </button>
            <div>
              <h2 className="text-base font-black text-[#f1f1f1] flex items-center gap-2">
                <Activity size={16} className="text-[#f5c27a]" />
                All Activity
              </h2>
              <p className="text-[10px] text-[#bbb] font-bold uppercase tracking-widest mt-0.5">
                {filtered.length} event{filtered.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center gap-2 px-6 py-4 border-b border-[#1a1a1a] overflow-x-auto">
          <Filter size={13} className="text-[#bbb] flex-shrink-0" />
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all"
              style={
                filter === f.key
                  ? { background: "#f5c27a", color: "#0a0a0a" }
                  : { background: "#1a1a1a", color: "#d0d0d0", border: "1px solid #2a2a2a" }
              }
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8">
          {Object.keys(groups).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <Activity size={36} className="text-[#2a2a2a]" />
              <p className="text-sm text-[#bbb]">No activity for this filter</p>
            </div>
          ) : (
            Object.entries(groups).map(([groupLabel, items]) => (
              <div key={groupLabel}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ccc]">{groupLabel}</span>
                  <div className="flex-1 h-px bg-[#1f1f1f]" />
                </div>
                <div className="relative pl-5 space-y-0">
                  <div className="absolute left-[7px] top-3 bottom-3 w-px bg-[#1f1f1f]" />
                  {items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.id} className="relative flex gap-4 pb-5 group">
                        <div
                          className="absolute -left-[13px] top-1 w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 z-10 transition-transform group-hover:scale-110"
                          style={{ borderColor: item.iconColor, backgroundColor: item.iconBg }}
                        />
                        <div className="flex-1 bg-[#141414] border border-[#1f1f1f] rounded-2xl p-4 hover:border-[#2a2a2a] transition-colors">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: item.iconBg }}>
                              <Icon size={14} style={{ color: item.iconColor }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-[13px] font-bold text-[#f1f1f1] leading-tight">
                                  {item.title}
                                  {item.unread && <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#f5c27a] ml-2 mb-0.5 align-middle" />}
                                </p>
                                <span className="text-[10px] text-[#ccc] font-bold whitespace-nowrap flex-shrink-0 flex items-center gap-1">
                                  <Clock size={9} />
                                  {item.timeAbsolute}
                                </span>
                              </div>
                              <p className="text-[12px] text-[#ccc] mt-1 leading-snug">{item.message}</p>
                              {item.detail && (
                                <p className="text-[11px] text-[#bbb] mt-2 pt-2 border-t border-[#1f1f1f] leading-snug">{item.detail}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex-shrink-0 px-6 py-4 border-t border-[#1f1f1f] bg-[#0d0d0d]">
          <p className="text-center text-[10px] text-[#bbb] font-bold uppercase tracking-widest">
            Showing last 30 days of activity
          </p>
        </div>
      </div>
    </>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [activeTab, setActiveTab]       = useState("dashboard");
  const [activityOpen, setActivityOpen] = useState(false);
  const [refreshing, setRefreshing]     = useState(false);
  const [scrolled, setScrolled]         = useState(false);

  const { user, loading } = useContext(AuthContext);
  const mainRef           = useRef(null);
  const downloadReportRef = useRef(null);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 8);
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Clear the download ref on tab switch so stale handlers don't linger
  useEffect(() => {
    downloadReportRef.current = null;
  }, [activeTab]);

  const getInitials = (name = "") =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const handleRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    const current = activeTab;
    setActiveTab("__refresh__");
    setTimeout(() => { setActiveTab(current); setRefreshing(false); }, 600);
  };

  const handleDownloadReport = () => {
    if (typeof downloadReportRef.current === "function") {
      downloadReportRef.current();
    } else {
      alert("No report available for this tab yet.");
    }
  };

  if (loading)
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-[#0a0a0a]">
        <div className="w-10 h-10 rounded-full border-2 border-[#f5c27a] border-t-transparent animate-spin" />
        <p className="text-sm font-bold text-[#f1f1f1]">Loading dashboard...</p>
      </div>
    );

  const renderContent = () => {
    switch (activeTab) {
      case "menu":         return <MenuList         downloadReportRef={downloadReportRef} />;
      case "orders":       return <OrdersList       downloadReportRef={downloadReportRef} />;
      case "reservations": return <ReservationsList downloadReportRef={downloadReportRef} />;
      case "reports":      return <ReportsPage      downloadReportRef={downloadReportRef} />;
      case "__refresh__":  return null;
      default:             return <DashboardCards   downloadReportRef={downloadReportRef} />;
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case "menu":         return "Menu Management";
      case "orders":       return "Orders Overview";
      case "reservations": return "Reservations Overview";
      case "reports":      return "Reports & Analytics";
      default:             return "Dashboard Overview";
    }
  };

  return (
    <div className="flex h-screen font-sans bg-[#0a0a0a] text-[#f1f1f1] overflow-hidden">

      <ActivityDrawer
        open={activityOpen}
        onClose={() => setActivityOpen(false)}
        activity={ALL_ACTIVITY}
      />

      {/* Sidebar */}
      <div className="bg-[#111111] border-r border-[#1f1f1f] min-w-[260px] flex-shrink-0 h-full overflow-y-auto">
        <Sidebar active={activeTab} onChange={(tab) => setActiveTab(tab)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">

        {/* STICKY HEADER */}
        <header
          className="flex-shrink-0 h-20 px-6 md:px-10 flex items-center justify-between z-30 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-[#1f1f1f] transition-shadow duration-300"
          style={{
            boxShadow: scrolled
              ? "0 6px 40px rgba(0,0,0,0.6), inset 0 -1px 0 rgba(245,194,122,0.07)"
              : "none",
          }}
        >
          <div className="flex items-center gap-6 flex-1 min-w-0">
            {/* Logo */}
            <div className="flex items-center gap-3 pr-6 border-r border-[#1f1f1f] flex-shrink-0">
              <div className="h-11 w-11 rounded-full overflow-hidden flex-shrink-0">
                <img
                  src="/southern-tales-logo.jpeg"
                  alt="Logo"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.parentNode.innerHTML =
                      '<div class="w-full h-full flex items-center justify-center bg-[#1a1a1a] text-[#f5c27a] font-black text-sm">ST</div>';
                  }}
                />
              </div>
              <div className="hidden sm:block leading-none">
                <span className="font-black text-base tracking-tight block text-[#f1f1f1]">Southern Tales</span>
                <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#f5c27a]">Management</span>
              </div>
            </div>

            {/* Live Clock */}
            <LiveClock />
          </div>

          {/* User pill */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-2.5 pl-3 pr-3 py-1.5 rounded-xl bg-[#181818] border border-[#2a2a2a]">
              <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 bg-[#f5c27a] text-[#0a0a0a]">
                {user ? getInitials(user.name) : "AD"}
              </div>
              <div className="hidden lg:block leading-none">
                <p className="text-xs font-bold text-[#f1f1f1]">{user?.name || "Admin"}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest mt-1 text-[#ccc]">Owner / Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* SCROLLABLE MAIN */}
        <main ref={mainRef} className="flex-1 p-6 md:p-10 overflow-y-auto bg-[#0a0a0a]">

          {/* Title row */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] mb-2 text-[#f5c27a]">
                <span className="w-5 h-[2px] bg-[#f5c27a] inline-block" />
                Admin Management
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#f1f1f1]">
                {getPageTitle()}
              </h1>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">

              {/* Download Report — only on Orders, Reservations, Reports tabs */}
              {["orders", "reservations", "reports"].includes(activeTab) && (
                <button
                  onClick={handleDownloadReport}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-[#181818] border border-[#2a2a2a] text-[#aaa] hover:border-[#6ee7b7] hover:text-[#6ee7b7] hover:bg-[#1a1a1a] active:scale-95 transition-all"
                >
                  <Download size={15} />
                  Download Report
                </button>
              )}

              {/* Refresh Now */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-[#181818] border border-[#2a2a2a] text-[#aaa] hover:border-[#f5c27a] hover:text-[#f5c27a] hover:bg-[#1a1a1a] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw size={15} className={refreshing ? "animate-spin text-[#f5c27a]" : ""} />
                {refreshing ? "Refreshing..." : "Refresh Now"}
              </button>

            </div>
          </div>

          <div>{renderContent()}</div>
        </main>
      </div>
    </div>
  );
}