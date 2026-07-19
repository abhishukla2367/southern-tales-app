import React, { useState, useContext, useRef, useEffect, useCallback } from "react";
import Sidebar from "./Sidebar";
import DashboardCards from "./DashboardCards";
import MenuList from "./menu/MenuList";
import OrdersList from "./orders/OrdersList";
import ReservationsList from "./reservations/ReservationsList";
import ReportsPage from "./reports/ReportsPage";
import InventoryManagement from "./inventory/InventoryManagement";
import { AuthContext } from "../../context/AuthContext";
import API from "../../api/axiosConfig";
import {
  Clock, Wifi, RefreshCw, Download, Package,
} from "lucide-react";

// ─── COMPONENT: LIVE CLOCK ────────────────────────────────────────────────────
function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const h       = now.getHours();
  const mm      = String(now.getMinutes()).padStart(2, "0");
  const ss      = String(now.getSeconds()).padStart(2, "0");
  const period  = h < 12 ? "AM" : "PM";
  const timeStr = `${String(h % 12 || 12).padStart(2, "0")}:${mm}:${ss} ${period}`;
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

// ─── COMPONENT: INVENTORY HEADER PILL ────────────────────────────────────────
function InventoryHeaderPill({ onNavigate, alertCount }) {
  const hasAlerts = alertCount > 0;
  return (
    <button
      onClick={() => onNavigate("inventory")}
      className="flex items-center gap-3 px-4 py-2 rounded-xl bg-[#141414] border border-[#2a2a2a] hover:border-[#f87171]/50 transition-all group"
    >
      <Package size={14} className="text-[#aaa] group-hover:text-[#f87171] transition-colors flex-shrink-0" />
      <div className="leading-none text-left">
        <p className="text-[10px] font-black text-[#f1f1f1]">Inventory</p>
        {hasAlerts ? (
          <p className="text-[8px] font-bold text-[#f87171] uppercase tracking-wider mt-0.5 animate-pulse">
            {alertCount} Stock Alert{alertCount !== 1 ? "s" : ""}
          </p>
        ) : (
          <p className="text-[8px] font-bold text-[#6ee7b7] uppercase tracking-wider mt-0.5">
            All Optimal
          </p>
        )}
      </div>
    </button>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [activeTab, setActiveTab]   = useState("dashboard");
  const [refreshing, setRefreshing] = useState(false);
  const [scrolled, setScrolled]     = useState(false);
  const [stockAlertCount, setStockAlertCount] = useState(0);

  const { user, loading } = useContext(AuthContext);
  const mainRef           = useRef(null);
  const downloadReportRef = useRef(null);

  // ── Fetch inventory alert count ──────────────────────────────────────────
  const fetchAlertCount = useCallback(async () => {
    try {
      const { data } = await API.get("/inventory-details");
      const alerts = data.filter(
        (item) => typeof item.currentStock === "number" && item.currentStock <= (item.minRequired || 0)
      ).length;
      setStockAlertCount(alerts);
    } catch {
      // silently fail — don't break the dashboard
    }
  }, []);

  // Fetch on mount, then poll every 60 seconds
  useEffect(() => {
    fetchAlertCount();
    const id = setInterval(fetchAlertCount, 60_000);
    return () => clearInterval(id);
  }, [fetchAlertCount]);

  // Re-fetch whenever user navigates away from inventory (counts may have changed)
  useEffect(() => {
    if (activeTab !== "inventory") {
      fetchAlertCount();
    }
  }, [activeTab, fetchAlertCount]);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 8);
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Clear download ref on tab switch so stale handlers don't linger
  useEffect(() => {
    downloadReportRef.current = null;
  }, [activeTab]);

  const getInitials = (name = "") =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const handleRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    fetchAlertCount(); // also refresh alert count on manual refresh
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

  const getPageTitle = () => {
    switch (activeTab) {
      case "menu":         return "Menu Management";
      case "orders":       return "Orders Overview";
      case "reservations": return "Reservations Overview";
      case "reports":      return "Reports & Analytics";
      case "inventory":    return "Inventory Management";
      default:             return "Dashboard Overview";
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "menu":         return <MenuList          downloadReportRef={downloadReportRef} />;
      case "orders":       return <OrdersList        downloadReportRef={downloadReportRef} />;
      case "reservations": return <ReservationsList  downloadReportRef={downloadReportRef} />;
      case "reports":      return <ReportsPage       downloadReportRef={downloadReportRef} />;
      case "inventory":    return <InventoryManagement onStockChange={fetchAlertCount} />;
      case "__refresh__":  return null;
      default:             return <DashboardCards    downloadReportRef={downloadReportRef} />;
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-[#0a0a0a]">
        <div className="w-10 h-10 rounded-full border-2 border-[#f5c27a] border-t-transparent animate-spin" />
        <p className="text-sm font-bold text-[#f1f1f1]">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen font-sans bg-[#0a0a0a] text-[#f1f1f1] overflow-hidden">

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
          <div className="flex items-center gap-4 flex-1 min-w-0">

            {/* Logo */}
            <div className="flex items-center gap-3 pr-6 border-r border-[#1f1f1f] flex-shrink-0">
              <div className="h-11 w-11 rounded-full overflow-hidden flex-shrink-0">
                <img
                  src="/southern-tales-logo.jpeg"
                  alt="Southern Tales Logo"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.parentNode.innerHTML =
                      '<div class="w-full h-full flex items-center justify-center bg-[#1a1a1a] text-[#f5c27a] font-black text-sm">ST</div>';
                  }}
                />
              </div>
              <div className="hidden sm:block leading-none">
                <span className="font-black text-base tracking-tight block text-[#f1f1f1]">
                  Southern Tales
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#f5c27a]">
                  Management
                </span>
              </div>
            </div>

            {/* Live Clock */}
            <LiveClock />

            {/* Inventory Pill — hidden on small screens */}
            <div className="hidden lg:block">
              <InventoryHeaderPill
                onNavigate={(tab) => setActiveTab(tab)}
                alertCount={stockAlertCount}
              />
            </div>
          </div>

          {/* User Pill */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-2.5 pl-3 pr-3 py-1.5 rounded-xl bg-[#181818] border border-[#2a2a2a]">
              <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 bg-[#f5c27a] text-[#0a0a0a]">
                {user ? getInitials(user.name) : "AD"}
              </div>
              <div className="hidden lg:block leading-none">
                <p className="text-xs font-bold text-[#f1f1f1]">{user?.name || "Admin"}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest mt-1 text-[#ccc]">
                  Owner / Admin
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* SCROLLABLE MAIN */}
        <main ref={mainRef} className="flex-1 p-6 md:p-10 overflow-y-auto bg-[#0a0a0a]">

          {/* Page title row */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] mb-2 text-[#f5c27a]">
                <span className="w-5 h-[2px] bg-[#f5c27a] inline-block" />
                Admin Console
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#f1f1f1]">
                {getPageTitle()}
              </h1>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">

              {/* Download Report — only on relevant tabs */}
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

          {/* Page Content */}
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}