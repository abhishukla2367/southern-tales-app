import { useState, useEffect, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import API    from "../../../api/axiosConfig";
import socket from "../../../socketclient";
import EmptyState from "../../admin/EmptyState";
import ErrorState from "../../admin/ErrorState";
import BillModal  from "../../admin/BillModal";

const STATUS_STYLES = {
  Pending:    "bg-[#f5c27a]/10 text-[#f5c27a] border border-[#f5c27a]/30",
  Processing: "bg-blue-400/10 text-blue-400 border border-blue-400/30",
  Preparing:  "bg-blue-400/10 text-blue-400 border border-blue-400/30",
  Delivered:  "bg-emerald-400/10 text-emerald-400 border border-emerald-400/30",
  Completed:  "bg-emerald-400/10 text-emerald-400 border border-emerald-400/30",
  Cancelled:  "bg-red-400/10 text-red-400 border border-red-400/30",
};

const STATUS_OPTIONS = ["Pending", "Processing", "Preparing", "Delivered", "Completed", "Cancelled"];

const ORDER_TYPE_STYLES = {
  delivery: "bg-blue-400/10 text-blue-400 border border-blue-400/30",
  pickup:   "bg-violet-400/10 text-violet-400 border border-violet-400/30",
  walkin:   "bg-[#f5c27a]/10 text-[#f5c27a] border border-[#f5c27a]/30",
  dinein:   "bg-emerald-400/10 text-emerald-400 border border-emerald-400/30",
};

const ORDER_TYPE_LABELS = {
  delivery: "Delivery",
  pickup:   "Pickup",
  walkin:   "Walk-in",
  dinein:   "Dine-in",
};

const FILTER_TABS = [
  { label: "All",      value: "" },
  { label: "Delivery", value: "delivery" },
  { label: "Pickup",   value: "pickup" },
  { label: "Walk-in",  value: "walkin" },
  { label: "Dine-in",  value: "dinein" },
];

const LOCKED_STATUSES = ["Completed", "Cancelled"];

function isWithinBusinessHoursNow() {
  const now  = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const isWeekend = now.getDay() === 0 || now.getDay() === 6;
  return isWeekend ? (mins >= 480 && mins < 1380) : (mins >= 420 && mins < 1350);
}

// ─── Notification chime ───────────────────────────────────────────────────────
function playOrderChime() {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
    gain.connect(ctx.destination);
    [880, 1100, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.connect(gain);
      osc.start(ctx.currentTime + i * 0.1);
      osc.stop(ctx.currentTime + i * 0.1 + 0.4);
    });
  } catch { /* ignore */ }
}

// ─── New Order Toast ──────────────────────────────────────────────────────────
function NewOrderToast({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed top-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-3 bg-[#111] border border-[#f5c27a]/50 rounded-2xl px-5 py-4 shadow-2xl shadow-black/60 animate-in slide-in-from-right-4 duration-300"
        >
          <span className="text-2xl">🛎️</span>
          <div className="leading-none">
            <p className="text-[10px] font-black text-[#f5c27a] uppercase tracking-widest mb-1">New Order</p>
            <p className="text-sm font-bold text-white">{t.typeLabel}</p>
            <p className="text-xs text-zinc-400 mt-0.5">{t.customer} · <span className="text-emerald-400 font-bold">₹{t.amount}</span></p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Live Badge ───────────────────────────────────────────────────────────────
function LiveBadge({ connected }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="relative flex h-2 w-2">
        {connected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${connected ? "bg-emerald-400" : "bg-red-400"}`} />
      </span>
      <span className={`text-[9px] font-black uppercase tracking-widest ${connected ? "text-emerald-400" : "text-red-400"}`}>
        {connected ? "Live" : "Reconnecting"}
      </span>
    </div>
  );
}

// ─── Outside Hours Confirm ────────────────────────────────────────────────────
function OutOfHoursConfirm({ onCancel, onProceed }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">⚠️</span>
          <h3 className="text-base font-black text-white">Outside Business Hours</h3>
        </div>
        <p className="text-sm text-[#aaa] mb-1">You're creating an order outside operating hours:</p>
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 my-3 text-xs text-[#aaa] space-y-1">
          <p><span className="text-white font-bold">Mon–Fri:</span> 7:00 AM – 10:30 PM</p>
          <p><span className="text-white font-bold">Sat–Sun:</span> 8:00 AM – 11:00 PM</p>
        </div>
        <p className="text-sm text-[#aaa] mb-5">Do you want to proceed anyway?</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-[#2a2a2a] text-[#aaa] text-sm font-bold hover:border-zinc-600 hover:text-white transition-all">Cancel</button>
          <button onClick={onProceed} className="flex-1 py-2.5 rounded-xl bg-[#f5c27a] text-[#111] text-sm font-black hover:bg-[#e0a84a] transition-all">Proceed Anyway</button>
        </div>
      </div>
    </div>
  );
}

// ─── Walk-in Modal ────────────────────────────────────────────────────────────
function WalkInModal({ onClose, onOrderPlaced }) {
  const [step, setStep]               = useState(1);
  const [guestName, setGuestName]     = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [numGuests, setNumGuests]     = useState("");
  const [menuItems, setMenuItems]     = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [search, setSearch]           = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [placing, setPlacing]         = useState(false);
  const [tables, setTables]               = useState([]);
  const [tablesLoading, setTablesLoading] = useState(true);
  const [tablesError, setTablesError]     = useState(false);

  useEffect(() => {
    const load = async () => {
      setTablesLoading(true);
      try {
        const { data } = await API.get("/tables");
        setTables(data.tables || data || []);
      } catch {
        setTables(Array.from({ length: 20 }, (_, i) => ({ tableNumber: `T${i + 1}`, status: "available" })));
        setTablesError(true);
      } finally { setTablesLoading(false); }
    };
    load();
  }, []);

  useEffect(() => {
    if (step !== 2) return;
    const load = async () => {
      setMenuLoading(true);
      try {
        const { data } = await API.get("/menu");
        setMenuItems(data.menuItems || data || []);
      } catch { alert("Failed to load menu."); }
      finally { setMenuLoading(false); }
    };
    load();
  }, [step]);

  const addItem = (item) => setSelectedItems((prev) => {
    const e = prev.find((i) => i._id === item._id);
    if (e) return prev.map((i) => i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i);
    return [...prev, { ...item, quantity: 1 }];
  });

  const removeItem = (id) => setSelectedItems((prev) => {
    const e = prev.find((i) => i._id === id);
    if (!e) return prev;
    if (e.quantity === 1) return prev.filter((i) => i._id !== id);
    return prev.map((i) => i._id === id ? { ...i, quantity: i.quantity - 1 } : i);
  });

  const getQty      = (id) => selectedItems.find((i) => i._id === id)?.quantity || 0;
  const totalAmount = selectedItems.reduce((s, i) => s + i.price * i.quantity, 0);

  const handlePlaceOrder = async () => {
    if (!selectedItems.length) return alert("Please add at least one item.");
    setPlacing(true);
    try {
      await API.post("/orders/admin/place", {
        orderType: "walkin", guestName, tableNumber,
        numberOfGuests: parseInt(numGuests),
        items: selectedItems.map((i) => ({ productId: i._id, name: i.name, quantity: i.quantity, price: i.price, unit: i.unit || "pcs" })),
        totalAmount, paymentMethod: "Cash",
      });
      onOrderPlaced();
      onClose();
    } catch (err) { alert(err.response?.data?.message || "Failed to place order."); }
    finally { setPlacing(false); }
  };

  const filtered        = menuItems.filter((m) => m.name?.toLowerCase().includes(search.toLowerCase()));
  const availableTables = tables.filter((t) => t.status === "available");
  const occupiedTables  = tables.filter((t) => t.status !== "available");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-[#111] border border-[#222] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f1f1f]">
          <div>
            <h2 className="text-base font-black text-white">New Walk-in Order</h2>
            <p className="text-xs text-[#555] mt-0.5">Step {step} of 2 — {step === 1 ? "Guest Details" : "Select Items"}</p>
          </div>
          <button onClick={onClose} className="text-[#555] hover:text-white text-xl font-bold transition">✕</button>
        </div>

        {step === 1 && (
          <div className="p-6 space-y-4">
            <div>
              <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest block mb-1">Guest Name</label>
              <input type="text" placeholder="e.g. Rahul Sharma" value={guestName} onChange={(e) => setGuestName(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white p-3 rounded-lg outline-none focus:border-[#f5c27a] transition text-sm" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest">Table Number</label>
                <button type="button" onClick={async () => { setTablesLoading(true); try { const { data } = await API.get("/tables"); setTables(data.tables || data || []); } catch { setTablesError(true); } finally { setTablesLoading(false); }}} disabled={tablesLoading} className="text-[10px] text-[#f5c27a] hover:underline disabled:opacity-40">
                  {tablesLoading ? "Refreshing..." : "↻ Refresh"}
                </button>
              </div>
              {tablesError && <p className="text-[10px] text-amber-400 mb-1.5">⚠ Could not load live table data.</p>}
              <div className="relative">
                <select value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} disabled={tablesLoading}
                  className="w-full appearance-none bg-[#1a1a1a] border border-[#2a2a2a] text-white p-3 pr-10 rounded-lg outline-none focus:border-[#f5c27a] transition text-sm cursor-pointer disabled:opacity-50">
                  <option value="" disabled className="bg-[#111] text-[#555]">{tablesLoading ? "Loading..." : "Select a table..."}</option>
                  {availableTables.length > 0 && <optgroup label="✅ Available">{availableTables.map((t) => <option key={t.tableNumber} value={t.tableNumber} className="bg-[#111] text-white">{t.tableNumber} — Available</option>)}</optgroup>}
                  {occupiedTables.length > 0  && <optgroup label="🔴 Occupied">{occupiedTables.map((t) => <option key={t.tableNumber} value={t.tableNumber} disabled className="bg-[#111] text-[#555]">{t.tableNumber} — Occupied</option>)}</optgroup>}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#555]">▾</span>
              </div>
              {!tablesLoading && tables.length > 0 && (
                <div className="flex gap-3 mt-2">
                  <span className="text-[10px] font-bold text-emerald-400">● {availableTables.length} available</span>
                  <span className="text-[10px] font-bold text-red-400">● {occupiedTables.length} occupied</span>
                </div>
              )}
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest block mb-1">Number of Guests</label>
              <div className="relative">
                <select value={numGuests} onChange={(e) => setNumGuests(e.target.value)}
                  className="w-full appearance-none bg-[#1a1a1a] border border-[#2a2a2a] text-white p-3 pr-10 rounded-lg outline-none focus:border-[#f5c27a] transition text-sm cursor-pointer">
                  <option value="" disabled className="bg-[#111] text-[#555]">Select number of guests...</option>
                  {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => <option key={n} value={n} className="bg-[#111] text-white">{n} {n === 1 ? "Guest" : "Guests"}</option>)}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#555]">▾</span>
              </div>
            </div>
            <button onClick={() => { if (!guestName.trim()) return alert("Please enter guest name."); if (!tableNumber) return alert("Please select a table."); if (!numGuests) return alert("Please select number of guests."); setStep(2); }}
              className="w-full py-3 bg-[#f5c27a] text-[#111] rounded-lg font-black text-sm uppercase tracking-widest hover:bg-[#f0b85a] transition mt-2">
              Next → Select Items
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col" style={{ maxHeight: "75vh" }}>
            <div className="px-6 py-3 bg-[#161616] border-b border-[#1f1f1f] flex gap-4 text-xs text-[#aaa]">
              <span>👤 <span className="text-white font-bold">{guestName}</span></span>
              <span>🪑 Table <span className="text-white font-bold">{tableNumber}</span></span>
              <span>👥 <span className="text-white font-bold">{numGuests}</span> guests</span>
            </div>
            <div className="px-6 py-3 border-b border-[#1f1f1f]">
              <input type="text" placeholder="Search menu..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white p-2.5 rounded-lg outline-none focus:border-[#f5c27a] transition text-sm" />
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-3 space-y-2">
              {menuLoading ? (
                <div className="flex justify-center py-10"><div className="w-8 h-8 rounded-full border-2 border-[#f5c27a] border-t-transparent animate-spin" /></div>
              ) : filtered.length === 0 ? (
                <p className="text-center text-[#555] text-sm py-10">No items found.</p>
              ) : filtered.map((item) => {
                const qty = getQty(item._id);
                return (
                  <div key={item._id} className="flex items-center justify-between bg-[#161616] border border-[#1f1f1f] rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      {item.image && <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover border border-[#2a2a2a]" />}
                      <div>
                        <p className="text-sm font-bold text-white">{item.name}</p>
                        <p className="text-xs text-emerald-400 font-bold">₹{item.price}</p>
                      </div>
                    </div>
                    {qty === 0 ? (
                      <button onClick={() => addItem(item)} className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[#f5c27a]/40 text-[#f5c27a] hover:bg-[#f5c27a]/10 transition">+ Add</button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button onClick={() => removeItem(item._id)} className="w-7 h-7 rounded-lg bg-[#2a2a2a] text-white font-bold hover:bg-[#333] transition flex items-center justify-center">−</button>
                        <span className="text-sm font-black text-white w-4 text-center">{qty}</span>
                        <button onClick={() => addItem(item)} className="w-7 h-7 rounded-lg bg-[#f5c27a] text-[#111] font-bold hover:bg-[#f0b85a] transition flex items-center justify-center">+</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="px-6 py-4 border-t border-[#1f1f1f] bg-[#111]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-[#aaa]">{selectedItems.reduce((s, i) => s + i.quantity, 0)} item(s)</span>
                <span className="text-base font-black text-emerald-400">Total: ₹{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-lg border border-[#2a2a2a] text-[#aaa] text-xs font-bold hover:border-[#f5c27a]/40 hover:text-[#f5c27a] transition">← Back</button>
                <button onClick={handlePlaceOrder} disabled={placing || !selectedItems.length}
                  className="flex-1 py-2.5 rounded-lg bg-[#f5c27a] text-[#111] text-xs font-black uppercase tracking-widest hover:bg-[#f0b85a] transition disabled:opacity-50 disabled:cursor-not-allowed">
                  {placing ? "Placing..." : "Place Walk-in Order"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main OrdersList ──────────────────────────────────────────────────────────
export default function OrdersList({ downloadReportRef }) {
  const [orders, setOrders]                     = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState(false);
  const [selectedOrderId, setSelectedOrderId]   = useState(null);
  const [activeFilter, setActiveFilter]         = useState("");
  const [showWalkInModal, setShowWalkInModal]   = useState(false);
  const [showHoursConfirm, setShowHoursConfirm] = useState(false);
  const [socketConnected, setSocketConnected]   = useState(socket.connected);
  const [toasts, setToasts]                     = useState([]);
  const activeFilterRef = useRef(activeFilter);

  useEffect(() => { activeFilterRef.current = activeFilter; }, [activeFilter]);

  const pushToast = useCallback((order) => {
    const id        = Date.now();
    const typeLabel = ORDER_TYPE_LABELS[order.orderType] || "Order";
    const customer  = order.guestName || order.userId?.name || "Customer";
    const amount    = order.totalAmount;
    setToasts((prev) => [...prev, { id, typeLabel, customer, amount }]);
    playOrderChime();
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params   = activeFilter ? `?type=${activeFilter}` : "";
      const { data } = await API.get(`/orders/admin/all${params}`);
      setOrders(data.orders || data);
    } catch (err) {
      console.error("Failed to fetch orders:", err.message);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // ── Socket ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    socket.emit("join_admin");
    setSocketConnected(socket.connected);

    const onConnect    = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);

    const onNewOrder = (order) => {
      const filter = activeFilterRef.current;
      if (filter && order.orderType !== filter) return;
      setOrders((prev) => {
        if (prev.find((o) => o._id === order._id)) return prev;
        return [order, ...prev];
      });
      pushToast(order);
    };

    const onStatusUpdated = ({ orderId, status }) => {
      setOrders((prev) => prev.map((o) => o._id === orderId ? { ...o, status } : o));
    };

    const onPaymentUpdated = ({ orderId, paymentStatus }) => {
      setOrders((prev) => prev.map((o) => o._id === orderId ? { ...o, paymentStatus } : o));
    };

    socket.on("connect",               onConnect);
    socket.on("disconnect",            onDisconnect);
    socket.on("new_order",             onNewOrder);
    socket.on("order_status_updated",  onStatusUpdated);
    socket.on("order_payment_updated", onPaymentUpdated);

    return () => {
      socket.emit("leave_admin");
      socket.off("connect",              onConnect);
      socket.off("disconnect",           onDisconnect);
      socket.off("new_order",            onNewOrder);
      socket.off("order_status_updated", onStatusUpdated);
      socket.off("order_payment_updated",onPaymentUpdated);
    };
  }, [pushToast]);

  const exportToExcel = useCallback(() => {
    const label = FILTER_TABS.find((t) => t.value === activeFilter)?.label || "All";
    const rows = orders.map((order) => {
      const isInHouse = ["walkin", "dinein"].includes(order.orderType);
      return {
        "Order ID":  `#${order._id?.slice(-6).toUpperCase()}`,
        "Type":      ORDER_TYPE_LABELS[order.orderType] || order.orderType || "—",
        "Customer":  isInHouse ? (order.guestName || "Walk-in Guest") : (order.userId?.name || "Guest"),
        "Email":     order.userId?.email || "—",
        "Table":     order.tableNumber || "—",
        "Guests":    order.numberOfGuests || "—",
        "Items":     order.items?.length || 0,
        "Total (₹)": order.totalAmount,
        "Payment":   order.paymentStatus || "—",
        "Status":    order.status || "—",
        "Date":      new Date(order.createdAt).toLocaleDateString("en-IN"),
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = Object.keys(rows[0] || {}).map((k) => ({ wch: Math.max(k.length, ...rows.map((r) => String(r[k] ?? "").length)) + 2 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, label);
    XLSX.writeFile(wb, `SouthernTales_Orders_${label}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }, [orders, activeFilter]);

  useEffect(() => {
    if (downloadReportRef) downloadReportRef.current = exportToExcel;
  }, [exportToExcel, downloadReportRef]);

  const updateStatus = async (id, status) => {
    setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, status } : o)));
    try {
      await API.patch(`/orders/${id}/status`, { status });
    } catch {
      alert("Failed to update order status.");
      fetchOrders();
    }
  };

  const handlePaid = (orderId) => {
    setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, paymentStatus: "Paid" } : o)));
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-[#f5c27a] border-t-transparent animate-spin" />
        <p className="text-sm font-bold text-[#aaa]">Loading orders...</p>
      </div>
    );

  if (error) return <ErrorState />;

  return (
    <>
      <NewOrderToast toasts={toasts} />

      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {FILTER_TABS.map((tab) => (
              <button key={tab.value} onClick={() => setActiveFilter(tab.value)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all border ${
                  activeFilter === tab.value
                    ? "bg-[#f5c27a] text-[#111] border-[#f5c27a]"
                    : "bg-transparent text-[#aaa] border-[#2a2a2a] hover:border-[#f5c27a]/40 hover:text-[#f5c27a]"
                }`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => isWithinBusinessHoursNow() ? setShowWalkInModal(true) : setShowHoursConfirm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all bg-[#f5c27a] text-[#111] hover:bg-[#f0b85a] shadow-lg shadow-[#f5c27a]/10"
        >
          + New Walk-in Order
        </button>
      </div>

      {!orders.length ? (
        <EmptyState />
      ) : (
        <div className="rounded-2xl overflow-hidden bg-[#111111] border border-[#1f1f1f]">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.2em] font-black bg-[#161616] text-[#aaa] border-b border-[#1f1f1f]">
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Table</th>
                  <th className="px-6 py-4">Items</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Payment</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Bill</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const currentStatus = order.status || "Pending";
                  const isLocked      = LOCKED_STATUSES.includes(currentStatus);
                  const statusClass   = STATUS_STYLES[currentStatus]       || "bg-zinc-800 text-zinc-400 border border-zinc-600";
                  const typeClass     = ORDER_TYPE_STYLES[order.orderType] || "bg-zinc-800 text-zinc-400 border border-zinc-600";
                  const typeLabel     = ORDER_TYPE_LABELS[order.orderType] || order.orderType || "—";
                  const isInHouse     = ["walkin", "dinein"].includes(order.orderType);

                  return (
                    <tr key={order._id} className="border-b border-[#1a1a1a] hover:bg-[#161616] transition-colors">
                      <td className="px-6 py-4 text-xs font-black text-[#f5c27a]">#{order._id?.slice(-6).toUpperCase()}</td>
                      <td className="px-6 py-4"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${typeClass}`}>{typeLabel}</span></td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-[#f1f1f1]">{isInHouse ? (order.guestName || "Walk-in Guest") : (order.userId?.name || "Guest")}</p>
                        {isInHouse
                          ? <p className="text-xs mt-0.5 text-[#555]">{order.numberOfGuests || "—"} guest{order.numberOfGuests !== 1 ? "s" : ""}</p>
                          : <p className="text-xs mt-0.5 text-[#555]">{order.userId?.email || "—"}</p>}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#aaa]">
                        {isInHouse ? <span className="font-bold text-white">{order.tableNumber || "—"}</span> : <span className="text-[#333]">—</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#aaa]">{order.items?.length || 0} item{order.items?.length !== 1 ? "s" : ""}</td>
                      <td className="px-6 py-4 font-black text-sm text-emerald-400">₹{order.totalAmount}</td>
                      <td className="px-6 py-4">
                        {["delivery", "pickup"].includes(order.orderType) ? (
                          <button
                            onClick={async () => {
                              const newStatus = order.paymentStatus === "Paid" ? "Unpaid" : "Paid";
                              setOrders((prev) => prev.map((o) => o._id === order._id ? { ...o, paymentStatus: newStatus } : o));
                              try { await API.patch(`/orders/${order._id}/payment-status`, { paymentStatus: newStatus }); }
                              catch { alert("Failed to update payment status."); fetchOrders(); }
                            }}
                            className={`text-sm font-black px-2.5 py-1 rounded-md border transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                              order.paymentStatus === "Paid"
                                ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/30 hover:bg-emerald-400/20"
                                : "bg-red-400/10 text-red-400 border-red-400/30 hover:bg-red-400/20"
                            }`}>
                            {order.paymentStatus === "Paid" ? "✓ Paid" : "✗ Unpaid"}
                          </button>
                        ) : (
                          <span className={`text-sm font-black px-2 py-0.5 rounded-md ${order.paymentStatus === "Paid" ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400"}`}>
                            {order.paymentStatus === "Paid" ? "✓ Paid" : "✗ Unpaid"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isLocked ? (
                          <span className={`${statusClass} rounded-lg px-2.5 py-1 text-xs font-bold cursor-not-allowed opacity-70`}>{currentStatus}</span>
                        ) : (
                          <select className={`${statusClass} rounded-lg px-2.5 py-1 text-xs font-bold outline-none cursor-pointer bg-transparent`}
                            value={currentStatus} onChange={(e) => updateStatus(order._id, e.target.value)}>
                            {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="bg-[#111111] text-white">{s}</option>)}
                          </select>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-[#555]">
                        <p className="text-white font-bold">
                          {order.scheduledDate
                            ? new Date(order.scheduledDate + "T00:00:00").toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })
                            : new Date(order.createdAt).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })}
                        </p>
                        <p className="text-[#555] mt-0.5">{order.scheduledTime || "—"}</p>
                        <p className="text-[#333] text-[10px] mt-0.5">placed {new Date(order.createdAt).toLocaleDateString("en-IN", { day:"2-digit", month:"short" })}</p>
                      </td>
                      <td className="px-6 py-4">
                        {isInHouse && order.status !== "Cancelled" ? (
                          <button onClick={() => setSelectedOrderId(order._id)}
                            className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border border-[#f5c27a]/30 text-[#f5c27a] hover:bg-[#f5c27a]/10 transition-all">
                            Bill
                          </button>
                        ) : <span className="text-[10px] text-[#333]">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showHoursConfirm && (
        <OutOfHoursConfirm onCancel={() => setShowHoursConfirm(false)} onProceed={() => { setShowHoursConfirm(false); setShowWalkInModal(true); }} />
      )}
      {showWalkInModal && (
        <WalkInModal onClose={() => setShowWalkInModal(false)} onOrderPlaced={() => setActiveFilter("walkin")} />
      )}
      {selectedOrderId && (
        <BillModal key={selectedOrderId} orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} onPaid={handlePaid} />
      )}
    </>
  );
}