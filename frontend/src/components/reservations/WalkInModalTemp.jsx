import { useState, useEffect, useRef } from "react";
import API from "../../api/axiosConfig";
import TimePicker from "./TimePicker";
import OutOfHoursPopup from "./OutOfHoursPopup";
import { STATUS_OPTIONS, isWithinBusinessHours } from "./Constants";

const BLANK_FORM = {
  customerName: "", phone: "", guests: "", tableNumber: "",
  date: "", time: "", status: "Waiting", specialRequests: "",
};

export default function WalkInModal({
  open,
  onClose,
  onSave,
  tables        = [],
  tablesLoading = false,
  onRefreshTables,
}) {
  const [form, setForm]                     = useState(BLANK_FORM);
  const [errors, setErrors]                 = useState({});
  const [saving, setSaving]                 = useState(false);
  const [tableWarning, setTableWarning]     = useState("");
  const [showHoursPopup, setShowHoursPopup] = useState(false);
  const firstRef = useRef();

  useEffect(() => {
    if (open) {
      const now = new Date();
      setForm({ ...BLANK_FORM, date: now.toISOString().split("T")[0], time: now.toTimeString().slice(0, 5) });
      setErrors({});
      setTableWarning("");
      setShowHoursPopup(false);
      onRefreshTables?.();
      setTimeout(() => firstRef.current?.focus(), 80);
    }
  }, [open]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleTableChange = (value) => {
    set("tableNumber", value);
    if (!value) { setTableWarning(""); return; }
    const t = tables.find((t) => t.tableNumber === value);
    setTableWarning(t?.status === "occupied" ? "This table is occupied, please choose another." : "");
  };

  const validate = () => {
    const e = {};
    if (!form.customerName.trim())       e.customerName = "Guest name is required";
    if (!form.guests || form.guests < 1) e.guests       = "Select number of guests";
    if (!form.date)                      e.date         = "Date is required";
    if (!form.time)                      e.time         = "Time is required";
    if (tableWarning)                    e.tableNumber  = tableWarning;
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) return setErrors(e);
    if (!isWithinBusinessHours(form.date, form.time)) { setShowHoursPopup(true); return; }
    setSaving(true);
    try {
      const res = await API.post("/reservations/walkin", {
        customerName: form.customerName, phone: form.phone, guests: form.guests,
        tableNumber: form.tableNumber, date: form.date, time: form.time,
        status: form.status, specialRequests: form.specialRequests, type: "walk-in",
      });

      // ✅ FIXED: backend returns { success: true, data: { _id, customerName, ... } }
      // Must pass res.data.data (the actual record) — not res.data (the wrapper)
      const record = res.data?.data || res.data;
      onSave(record);
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create reservation.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const inputBase = "bg-[#1a1a1a] border rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-[#f5c27a] transition-colors placeholder-zinc-600 w-full";
  const labelBase = "text-xs font-bold uppercase tracking-widest text-[#f5c27a]";

  const availableCount = tables.filter((t) => t.status === "available").length;
  const occupiedCount  = tables.filter((t) => t.status !== "available").length;

  return (
    <>
      {showHoursPopup && <OutOfHoursPopup onClose={() => setShowHoursPopup(false)} />}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="bg-[#111111] border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl">

          {/* Header */}
          <div className="flex justify-between items-start px-7 pt-6 pb-5 border-b border-zinc-800">
            <div>
              <p className="text-xs tracking-widest text-[#f5c27a] font-mono uppercase">Walk-in</p>
              <h2 className="text-2xl font-black text-white mt-1 tracking-tight">New Reservation</h2>
            </div>
            <button onClick={onClose} className="text-zinc-500 hover:text-white text-xl leading-none mt-1 transition-colors">✕</button>
          </div>

          <div className="px-7 py-6 grid grid-cols-2 gap-4">

            {/* Guest Name */}
            <div className="col-span-2 flex flex-col gap-1.5">
              <label className={labelBase}>Guest Name <span className="text-red-400">*</span></label>
              <input
                ref={firstRef}
                className={`${inputBase} ${errors.customerName ? "border-red-500" : "border-zinc-800"}`}
                placeholder="Full name"
                value={form.customerName}
                onChange={(e) => set("customerName", e.target.value)}
              />
              {errors.customerName && <span className="text-red-400 text-xs">{errors.customerName}</span>}
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <label className={labelBase}>Phone</label>
              <input
                className={`${inputBase} border-zinc-800`}
                placeholder="9876543210 (optional)"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </div>

            {/* Guests */}
            <div className="flex flex-col gap-1.5">
              <label className={labelBase}>Guests <span className="text-red-400">*</span></label>
              <select
                className={`${inputBase} ${errors.guests ? "border-red-500" : "border-zinc-800"}`}
                value={form.guests}
                onChange={(e) => set("guests", e.target.value)}
              >
                <option value="">Select people</option>
                {[1,2,3,4,5,6,7,8].map((n) => (
                  <option key={n} value={n} className="bg-[#111111]">{n} {n === 1 ? "Person" : "People"}</option>
                ))}
              </select>
              {errors.guests && <span className="text-red-400 text-xs">{errors.guests}</span>}
            </div>

            {/* Table */}
            <div className="col-span-2 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className={labelBase}>Table</label>
                <div className="flex items-center gap-3">
                  {!tablesLoading && tables.length > 0 && (
                    <span className="text-[10px] font-bold text-zinc-500">
                      <span className="text-emerald-400">🟢 {availableCount}</span>
                      <span className="mx-1.5 text-zinc-700">·</span>
                      <span className="text-red-400">🔴 {occupiedCount}</span>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onRefreshTables?.()}
                    disabled={tablesLoading}
                    className="text-[10px] text-[#f5c27a] hover:underline disabled:opacity-40 transition"
                  >
                    {tablesLoading ? "Refreshing…" : "↻ Refresh"}
                  </button>
                </div>
              </div>

              <select
                disabled={tablesLoading}
                className={`${inputBase} ${tableWarning ? "border-red-500" : "border-zinc-800"} ${tablesLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                value={form.tableNumber}
                onChange={(e) => handleTableChange(e.target.value)}
              >
                <option value="">— Assign later —</option>

                {tablesLoading ? (
                  <option disabled className="bg-[#111111] text-zinc-500">Loading tables…</option>
                ) : tables.length > 0 ? (
                  <>
                    {tables.filter((t) => t.status === "available").length > 0 && (
                      <optgroup label="🟢 Available">
                        {tables.filter((t) => t.status === "available").map((t) => {
                          const cap = t.capacity ? ` · ${t.capacity}p` : "";
                          return (
                            <option key={t.tableNumber} value={t.tableNumber} className="bg-[#111111] text-white">
                              {t.tableNumber}{cap} · 🟢
                            </option>
                          );
                        })}
                      </optgroup>
                    )}
                    {tables.filter((t) => t.status !== "available").length > 0 && (
                      <optgroup label="🔴 Occupied">
                        {tables.filter((t) => t.status !== "available").map((t) => {
                          const cap = t.capacity ? ` · ${t.capacity}p` : "";
                          return (
                            <option key={t.tableNumber} value={t.tableNumber} disabled className="bg-[#111111] text-zinc-500">
                              {t.tableNumber}{cap} · 🔴
                            </option>
                          );
                        })}
                      </optgroup>
                    )}
                  </>
                ) : (
                  Array.from({ length: 20 }, (_, i) => (
                    <option key={i} value={`T${i + 1}`} className="bg-[#111111] text-white">T{i + 1}</option>
                  ))
                )}
              </select>

              {tableWarning && (
                <div className="flex items-center gap-2 bg-red-900/30 border border-red-700/50 rounded-lg px-3 py-2 mt-1">
                  <span className="text-red-400">⚠️</span>
                  <p className="text-red-400 text-xs font-bold">{tableWarning}</p>
                </div>
              )}
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1.5">
              <label className={labelBase}>Status</label>
              <select className={`${inputBase} border-zinc-800`} value={form.status} onChange={(e) => set("status", e.target.value)}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s} className="bg-[#111111]">{s}</option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div className="flex flex-col gap-1.5">
              <label className={labelBase}>Date <span className="text-red-400">*</span></label>
              <input
                type="date"
                className={`${inputBase} [color-scheme:dark] ${errors.date ? "border-red-500" : "border-zinc-800"}`}
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
              />
              {errors.date && <span className="text-red-400 text-xs">{errors.date}</span>}
            </div>

            {/* Time */}
            <div className="col-span-2 flex flex-col gap-1.5">
              <label className={labelBase}>Time <span className="text-red-400">*</span></label>
              <TimePicker
                value={form.time}
                onChange={(t) => { set("time", t); setErrors((e) => ({ ...e, time: undefined })); }}
                error={errors.time}
              />
              {errors.time && <span className="text-red-400 text-xs">{errors.time}</span>}
              <p className="text-[11px] text-zinc-600 font-mono mt-0.5">
                Mon–Fri: 7:00 AM – 10:30 PM · Sat–Sun: 8:00 AM – 11:00 PM
              </p>
            </div>

            {/* Notes */}
            <div className="col-span-2 flex flex-col gap-1.5">
              <label className={labelBase}>Notes</label>
              <textarea
                rows={3}
                className={`${inputBase} border-zinc-800 resize-none`}
                placeholder="Special requests, allergies, preferences…"
                value={form.specialRequests}
                onChange={(e) => set("specialRequests", e.target.value)}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-7 pb-6 pt-2 border-t border-zinc-800">
            <button onClick={onClose} className="px-5 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-400 text-sm font-bold transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !!tableWarning}
              className="px-6 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-black transition-colors"
            >
              {saving ? "Saving…" : "✔ Create Reservation"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}