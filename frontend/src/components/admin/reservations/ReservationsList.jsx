import { useState, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import API from "../../../api/axiosConfig";
import socket from "../../../socketclient";
import EmptyState from "../../admin/EmptyState";
import ErrorState from "../../admin/ErrorState";
import WalkInModal from "./WalkInModal";
import { STATUS_STYLES, STATUS_OPTIONS, isWithinBusinessHours } from "./Constants";
import { useTableAvailability } from "../../../hooks/useTableAvailability";

const formatDate = (raw) => {
  if (!raw) return "—";
  const d = new Date(raw);
  if (isNaN(d)) return raw;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const formatTime = (timeField, dateField) => {
  if (timeField) return timeField;
  if (dateField) {
    const d = new Date(dateField);
    if (!isNaN(d))
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
  return "—";
};

function isBusinessHoursNow() {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return isWithinBusinessHours(dateStr, timeStr);
}

// ─── Outside Hours Confirmation Dialog ───────────────────────────────────────
function OutOfHoursConfirm({ onCancel, onProceed }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">⚠️</span>
          <h3 className="text-base font-black text-white">Outside Business Hours</h3>
        </div>
        <p className="text-sm text-[#aaa] mb-1">You're creating a reservation outside operating hours:</p>
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 my-3 text-xs text-[#aaa] space-y-1">
          <p><span className="text-white font-bold">Mon–Fri:</span> 7:00 AM – 10:30 PM</p>
          <p><span className="text-white font-bold">Sat–Sun:</span> 8:00 AM – 11:00 PM</p>
        </div>
        <p className="text-sm text-[#aaa] mb-5">Do you want to proceed anyway?</p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-[#2a2a2a] text-[#aaa] text-sm font-bold hover:border-zinc-600 hover:text-white transition-all">
            Cancel
          </button>
          <button onClick={onProceed}
            className="flex-1 py-2.5 rounded-xl bg-[#f5c27a] text-[#111] text-sm font-black hover:bg-[#e0a84a] transition-all">
            Proceed Anyway
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Live indicator ───────────────────────────────────────────────────────────
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

export default function ReservationsList({ downloadReportRef }) {
  const [reservations, setReservations]         = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState(false);
  const [showModal, setShowModal]               = useState(false);
  const [showHoursConfirm, setShowHoursConfirm] = useState(false);
  const [search, setSearch]                     = useState("");
  const [filterStatus, setFilterStatus]         = useState("all");
  const [filterType, setFilterType]             = useState("all");
  const [toast, setToast]                       = useState(null);
  const [socketConnected, setSocketConnected]   = useState(socket.connected);

  const {
    tables,
    loading: tablesLoading,
    refresh: refreshTables,
    swapTableStatus,
    markOccupied,
    markAvailable,
  } = useTableAvailability();

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [resRes, walkinRes] = await Promise.all([
        API.get("/reservations/admin/all"),
        API.get("/reservations/walkin"),
      ]);
      const regular = (resRes.data.data || []).filter((r) => r.type !== "walk-in");
      const walkins = walkinRes.data || [];
      const merged  = [...regular, ...walkins].sort(
        (a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
      );
      setReservations(merged.filter((r) => r._id));
    } catch (err) {
      console.error("Failed to fetch:", err.message);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Socket setup ─────────────────────────────────────────────────────────────
  useEffect(() => {
    socket.emit("join_admin");
    setSocketConnected(socket.connected);

    const onConnect    = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);

    const onNewReservation = (reservation) => {
      if (!reservation?._id) return;
      setReservations((prev) => {
        if (prev.find((r) => r._id === reservation._id)) return prev;
        return [reservation, ...prev];
      });
      showToast(`New ${reservation.type === "walk-in" ? "walk-in" : "reservation"}: ${reservation.customerName || "Guest"}`);
    };

    const onStatusUpdated = ({ reservationId, status }) => {
      setReservations((prev) =>
        prev.map((r) => r._id === reservationId ? { ...r, status } : r)
      );
    };

    const onTableUpdated = ({ reservationId, tableNumber }) => {
      setReservations((prev) =>
        prev.map((r) => r._id === reservationId ? { ...r, tableNumber } : r)
      );
    };

    const onDeleted = ({ reservationId }) => {
      setReservations((prev) => prev.filter((r) => r._id !== reservationId));
    };

    socket.on("connect",                      onConnect);
    socket.on("disconnect",                   onDisconnect);
    socket.on("new_reservation",              onNewReservation);
    socket.on("reservation_status_updated",   onStatusUpdated);
    socket.on("reservation_table_updated",    onTableUpdated);
    socket.on("reservation_deleted",          onDeleted);

    return () => {
      socket.emit("leave_admin");
      socket.off("connect",                     onConnect);
      socket.off("disconnect",                  onDisconnect);
      socket.off("new_reservation",             onNewReservation);
      socket.off("reservation_status_updated",  onStatusUpdated);
      socket.off("reservation_table_updated",   onTableUpdated);
      socket.off("reservation_deleted",         onDeleted);
    };
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const updateStatus = async (id, status) => {
    const res = reservations.find((r) => r._id === id);
    setReservations((prev) => prev.map((r) => (r._id === id ? { ...r, status } : r)));
    try {
      await API.patch(`/reservations/${id}/status`, { status });
      if ((status === "Completed" || status === "Cancelled") && res?.tableNumber) {
        markAvailable(res.tableNumber);
      }
    } catch {
      alert("Failed to update status. Please try again.");
      fetchAll();
    }
  };

  const updateTable = async (id, newTableNumber) => {
    const res = reservations.find((r) => r._id === id);
    const oldTableNumber = res?.tableNumber || null;
    swapTableStatus(oldTableNumber, newTableNumber);
    try {
      await API.patch(`/reservations/${id}/table`, { tableNumber: newTableNumber });
      setReservations((prev) =>
        prev.map((r) => (r._id === id ? { ...r, tableNumber: newTableNumber } : r))
      );
    } catch {
      swapTableStatus(newTableNumber, oldTableNumber);
      alert("Table is already occupied. Please choose another table.");
    }
  };

  const handleDelete = async (id) => {
    const record = reservations.find((r) => r._id === id);
    if (record?.status === "Completed") {
      showToast("Completed records cannot be deleted.", "error");
      return;
    }
    if (!window.confirm("Delete this record?")) return;
    try {
      await API.delete(`/reservations/${id}`);
      if (record?.tableNumber) markAvailable(record.tableNumber);
      setReservations((prev) => prev.filter((r) => r._id !== id));
      showToast("Record deleted.");
    } catch {
      showToast("Failed to delete.", "error");
    }
  };

  const handleWalkinSave = (record) => {
    const newRecord = record?.data || record;
    if (!newRecord?._id) {
      showToast("Walk-in saved but failed to display. Please refresh.", "error");
      return;
    }
    setReservations((prev) => [newRecord, ...prev]);
    const name = newRecord.customerName || newRecord.name || "Guest";
    showToast(`Walk-in created for ${name}`);
    if (newRecord.tableNumber) markOccupied(newRecord.tableNumber);
  };

  const handleWalkInClick = () => {
    if (isBusinessHoursNow()) {
      setShowModal(true);
    } else {
      setShowHoursConfirm(true);
    }
  };

  const filtered = reservations.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      (r.customerName  || "").toLowerCase().includes(q) ||
      (r.customerEmail || "").toLowerCase().includes(q) ||
      (r.phone         || "").toLowerCase().includes(q) ||
      (r._id           || "").toLowerCase().includes(q) ||
      (r.tableNumber   || "").toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    const matchType   =
      filterType === "all" ||
      (filterType === "walk-in" ? r.type === "walk-in" : r.type !== "walk-in");
    return matchSearch && matchStatus && matchType;
  });

  const exportToExcel = useCallback(() => {
    const typeLabel =
      filterType === "walk-in" ? "WalkIn" :
      filterType === "reserved" ? "Online" : "All";
    const statusLabel = filterStatus === "all" ? "" : `_${filterStatus}`;

    const rows = filtered.map((r) => ({
      "Customer":  r.customerName || r.name || "—",
      "Email":     r.customerEmail || "—",
      "Phone":     r.phone || "—",
      "Guests":    r.guests ?? "—",
      "Date":      formatDate(r.date),
      "Time":      formatTime(r.time, r.date),
      "Table":     r.tableNumber || "Unassigned",
      "Status":    r.status || "—",
      "Type":      r.type === "walk-in" ? "Walk-in" : "Online",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = Object.keys(rows[0] || {}).map((k) => ({
      wch: Math.max(k.length, ...rows.map((r) => String(r[k] ?? "").length)) + 2,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Reservations_${typeLabel}`);
    XLSX.writeFile(wb, `SouthernTales_Reservations_${typeLabel}${statusLabel}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }, [filtered, filterType, filterStatus]);

  useEffect(() => {
    if (downloadReportRef) downloadReportRef.current = exportToExcel;
  }, [exportToExcel, downloadReportRef]);

  const selectBase =
    "bg-[#111111] border border-[#1f1f1f] hover:border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-[#f5c27a] transition-colors cursor-pointer";

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-[#f5c27a] border-t-transparent animate-spin" />
        <p className="text-sm font-bold text-[#aaa]">Loading reservations…</p>
      </div>
    );

  if (error) return <ErrorState />;

  return (
    <div>
      {toast && (
        <div className={`fixed top-6 right-6 z-50 border rounded-xl px-5 py-3 text-sm font-bold shadow-xl
          ${toast.type === "error" ? "bg-red-900 border-red-600 text-red-300" : "bg-green-900 border-green-600 text-green-300"}`}>
          {toast.type === "error" ? "⚠️" : "✔"} {toast.msg}
        </div>
      )}

      {/* ── Filters row ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          id="reservations-search"
          name="reservations-search"
          type="text"
          autoComplete="off"
          className="flex-1 bg-[#111111] border border-[#1f1f1f] hover:border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-[#f5c27a] transition-colors"
          placeholder="🔍  Search by name, email, phone or table…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          id="reservations-filter-type"
          name="reservations-filter-type"
          className={selectBase}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="reserved">🌐 Online</option>
          <option value="walk-in">🚶 Walk-in</option>
        </select>
        <select
          id="reservations-filter-status"
          name="reservations-filter-status"
          className={selectBase}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s} className="bg-[#111111]">{s}</option>
          ))}
        </select>
        <button
          onClick={handleWalkInClick}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black whitespace-nowrap transition-all bg-[#f5c27a] hover:bg-[#e0a84a] text-black"
        >
          + Walk-in
        </button>
      </div>

      {!filtered.length ? (
        <EmptyState />
      ) : (
        <div className="rounded-2xl overflow-hidden bg-[#111111] border border-[#1f1f1f]">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.2em] font-black bg-[#161616] text-[#aaa] border-b border-[#1f1f1f]">
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Guests</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Table</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((res) => {
                  if (!res._id) return null;

                  const styles = STATUS_STYLES[res.status] || {
                    badge:  "bg-zinc-800 text-zinc-400 border border-zinc-600",
                    select: "bg-zinc-800 text-zinc-400 border border-zinc-600",
                  };

                  const isStatusLocked = res.status === "Completed" || res.status === "Cancelled";
                  const isFullyLocked  = res.status === "Completed";
                  const isWalkin       = res.type === "walk-in";
                  const displayDate    = formatDate(res.date);
                  const displayTime    = formatTime(res.time, res.date);
                  const [h]            = (displayTime || "0:0").split(":").map(Number);
                  const period         = h < 12 ? "AM" : "PM";
                  const displayName    = res.customerName || res.name || "—";

                  // Unique ids per row using the reservation's _id
                  const tableSelectId  = `res-table-${res._id}`;
                  const statusSelectId = `res-status-${res._id}`;

                  return (
                    <tr
                      key={res._id}
                      className="border-b border-[#1a1a1a] hover:bg-[#161616] transition-colors"
                      style={{ opacity: isFullyLocked ? 0.6 : 1 }}
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-[#f1f1f1]">{displayName}</p>
                      </td>
                      <td className="px-6 py-4">
                        {res.customerEmail ? (
                          <p className="text-xs text-[#aaa]">{res.customerEmail}</p>
                        ) : res.phone ? (
                          <p className="text-xs text-[#aaa] font-mono">{res.phone}</p>
                        ) : (
                          <p className="text-xs italic text-[#444]">No contact</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-black text-white bg-zinc-800/50 px-2.5 py-1 rounded-lg border border-zinc-700/50">
                          {res.guests ?? "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-[#f1f1f1]">{displayDate}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] font-mono font-black text-[#f5c27a]">{displayTime}</span>
                          <span className={`text-[8px] px-1 rounded-sm font-black ${period === "AM" ? "bg-sky-900/40 text-sky-400" : "bg-orange-900/40 text-orange-400"}`}>
                            {period}
                          </span>
                        </div>
                      </td>

                      {/* Table select */}
                      <td className="px-6 py-4">
                        <select
                          id={tableSelectId}
                          name={tableSelectId}
                          disabled={isFullyLocked}
                          className={`text-xs font-bold rounded-lg px-2 py-1.5 bg-transparent border border-zinc-800 outline-none transition-colors text-zinc-300
                            ${isFullyLocked ? "opacity-50 cursor-not-allowed" : "focus:border-zinc-500 cursor-pointer"}`}
                          value={res.tableNumber || ""}
                          onChange={(e) => updateTable(res._id, e.target.value)}
                        >
                          <option value="" className="bg-[#111111] text-zinc-400">Unassigned</option>
                          {tables.map((t) => {
                            const isOccupied  = t.status === "occupied";
                            const isThisTable = t.tableNumber === res.tableNumber;
                            const dot         = isOccupied ? "🔴" : "🟢";
                            const cap         = t.capacity ? ` · ${t.capacity}p` : "";
                            return (
                              <option
                                key={t.tableNumber}
                                value={t.tableNumber}
                                disabled={isOccupied && !isThisTable}
                                className="bg-[#111111] text-white"
                              >
                                {t.tableNumber}{cap} · {dot}
                              </option>
                            );
                          })}
                        </select>
                      </td>

                      {/* Status select */}
                      <td className="px-6 py-4">
                        {isStatusLocked ? (
                          <span className={`text-[10px] font-black uppercase tracking-wider rounded-lg px-2.5 py-1.5 cursor-not-allowed ${styles.select}`}>
                            {res.status}
                          </span>
                        ) : (
                          <select
                            id={statusSelectId}
                            name={statusSelectId}
                            className={`text-[10px] font-black uppercase tracking-wider rounded-lg px-2 py-1.5 outline-none transition-all cursor-pointer ${styles.select}`}
                            value={res.status}
                            onChange={(e) => updateStatus(res._id, e.target.value)}
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt} value={opt} className="bg-[#111111]">{opt.toUpperCase()}</option>
                            ))}
                          </select>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border whitespace-nowrap
                          ${isWalkin ? "bg-orange-900/30 text-orange-400 border-orange-700/50" : "bg-sky-900/30 text-sky-400 border-sky-700/50"}`}>
                          {isWalkin ? "Walk-in" : "Online"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(res._id)}
                          disabled={isFullyLocked}
                          className={`p-2 rounded-lg transition-all ${isFullyLocked ? "opacity-30 cursor-not-allowed text-zinc-600" : "text-zinc-600 hover:text-red-400 hover:bg-red-400/10"}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
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
        <OutOfHoursConfirm
          onCancel={() => setShowHoursConfirm(false)}
          onProceed={() => { setShowHoursConfirm(false); setShowModal(true); }}
        />
      )}

      <WalkInModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleWalkinSave}
        tables={tables}
        tablesLoading={tablesLoading}
        onRefreshTables={refreshTables}
      />
    </div>
  );
}