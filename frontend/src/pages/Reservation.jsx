import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axiosConfig";
import socket from "../socket";
import TimePicker from "../components/reservations/TimePicker";

// ── Constants ────────────────────────────────────────────────────────────────
const TABLE_IDS = ["T1","T2","T3","T4","T5","T6","T7","T8","T9","T10",
                   "T11","T12","T13","T14","T15","T16","T17","T18","T19","T20"];
const WHATSAPP_NUMBER = "919876543210"; 
const BUSINESS_HOURS = {
  weekday: { open: "07:00", close: "22:30" }, // Mon–Fri
  weekend: { open: "08:00", close: "23:00" }, // Sat–Sun
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const isWithinBusinessHours = (date, time) => {
  if (!date || !time) return true;
  const day = new Date(date).getDay();
  const isWeekend = day === 0 || day === 6;
  const hours = isWeekend ? BUSINESS_HOURS.weekend : BUSINESS_HOURS.weekday;
  return time >= hours.open && time <= hours.close;
};

const today = new Date().toISOString().split("T")[0];

// ── Sub-components ───────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  if (!status) return null;
  return status === "available" ? (
    <span className="inline-flex items-center gap-1 text-emerald-400 text-xs mt-1 font-semibold">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
      Available
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-red-400 text-xs mt-1 font-semibold">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
      Not Available
    </span>
  );
};

const StepIndicator = ({ current }) => {
  const steps = ["Your Info", "Table & Time", "Done"];
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {steps.map((label, i) => {
        const idx = i + 1;
        const done = current > idx;
        const active = current === idx;
        return (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center">
              <div className={`
                w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300
                ${done    ? "bg-amber-500 border-amber-500 text-black" :
                  active  ? "bg-transparent border-amber-500 text-amber-500 shadow-[0_0_12px_rgba(245,194,122,0.4)]" :
                            "bg-transparent border-zinc-700 text-zinc-600"}
              `}>
                {done ? "✓" : idx}
              </div>
              <span className={`text-[10px] mt-1 font-medium tracking-wider uppercase ${active ? "text-amber-400" : done ? "text-amber-600" : "text-zinc-600"}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-px w-12 mx-1 mb-5 transition-all duration-500 ${current > idx ? "bg-amber-500" : "bg-zinc-700"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const OutOfHoursPopup = ({ onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
    <div className="bg-[#111] border border-zinc-800 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
      <div className="text-4xl mb-3">🕐</div>
      <h3 className="text-xl font-bold text-white mb-2">Outside Business Hours</h3>
      <p className="text-zinc-400 text-sm mb-1">Mon–Fri: 7:00 AM – 10:30 PM</p>
      <p className="text-zinc-400 text-sm mb-6">Sat–Sun: 8:00 AM – 11:00 PM</p>
      <p className="text-zinc-300 text-sm mb-6">Please select a time within our operating hours.</p>
      <button onClick={onClose}
        className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-2.5 rounded-xl transition-all">
        Got it
      </button>
    </div>
  </div>
);

const ConfirmationModal = ({ form, onConfirm, onCancel, submitting }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
    <div className="bg-[#111] border border-zinc-800 rounded-2xl p-8 max-w-sm w-full shadow-2xl">
      <h3 className="text-xl font-bold text-white mb-5 text-center">Confirm Reservation</h3>
      <div className="space-y-3 mb-6">
        {[
          ["👤 Name",    form.customerName],
          ["📧 Email",   form.customerEmail],
          ["📱 Phone",   form.phone],
          ["📅 Date",    form.date],
          ["🕐 Time",    form.time],
          ["👥 Guests",  `${form.guests} ${form.guests == 1 ? "Person" : "People"}`],
          ["🪑 Table",   form.tableNumber || "No preference"],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between items-center border-b border-zinc-800 pb-2">
            <span className="text-zinc-400 text-sm">{label}</span>
            <span className="text-white text-sm font-semibold">{value}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <button onClick={onCancel} disabled={submitting}
          className="flex-1 border border-zinc-700 text-zinc-300 hover:border-zinc-500 py-2.5 rounded-xl text-sm font-bold transition-all">
          Edit
        </button>
        <button onClick={onConfirm} disabled={submitting}
          className="flex-1 bg-amber-500 hover:bg-amber-400 text-black py-2.5 rounded-xl text-sm font-bold transition-all">
          {submitting ? "Booking..." : "Confirm ✓"}
        </button>
      </div>
    </div>
  </div>
);

const SuccessScreen = ({ onDone }) => (
  <div className="text-center py-10 px-4 animate-fade-in">
    <div className="text-6xl mb-4">🎉</div>
    <h3 className="text-3xl font-bold text-white mb-2">You're all set!</h3>
    <p className="text-zinc-400 mb-8">Your table has been successfully reserved.</p>
    <button onClick={onDone}
      className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-8 py-3 rounded-xl transition-all">
      Back to Home
    </button>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────
export default function Reservation() {
  const navigate = useNavigate();

  // ── Force TimePicker dialog to stay fully visible ─────────────────────────
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "timepicker-fix";
    style.innerHTML = `
      .rc-time-picker-panel,
      [class*="timepicker"],
      [class*="TimePicker"],
      [class*="time-picker"],
      [role="dialog"] {
        position: fixed !important;
        top: 160px !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        z-index: 99999 !important;
        max-height: 80vh !important;
        overflow-y: auto !important;
      }
    `;
    document.head.appendChild(style);
    return () => document.getElementById("timepicker-fix")?.remove();
  }, []);
  const [step, setStep]                       = useState(1);
  const [form, setForm]                       = useState({
    customerName: "", customerEmail: "", phone: "",
    date: "", time: "", guests: "", tableNumber: "",
  });
  const [errors, setErrors]                   = useState({});
  const [submitting, setSubmitting]           = useState(false);
  const [success, setSuccess]                 = useState(false);
  const [occupiedTables, setOccupiedTables]   = useState([]);
  const [tableWarning, setTableWarning]       = useState("");
  const [showHoursPopup, setShowHoursPopup]   = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [bookedSlots, setBookedSlots]         = useState([]);
  const [fullyBookedDates, setFullyBookedDates] = useState([]);
  const [dateStatus, setDateStatus]           = useState(null);
  const [timeStatus, setTimeStatus]           = useState(null);
  const [loadingAvail, setLoadingAvail]       = useState(false);

  // ── Fetch occupied tables + live socket updates ───────────────────────────
  useEffect(() => {
    API.get("/tables")
      .then((res) => {
        const tables = res.data?.tables || res.data || [];
        setOccupiedTables(tables.filter(t => t.status === "occupied").map(t => t.tableNumber));
      })
      .catch(() => {});

    // ✅ Only join once — check before emitting
    if (!socket.hasListeners || !socket._callbacks?.["tables:updated"]) {
      socket.emit("join_tables_room");
    }

    const handleTablesUpdate = ({ tables }) => {
      setOccupiedTables(tables.filter(t => t.status === "occupied").map(t => t.tableNumber));
    };

    socket.on("tables:updated", handleTablesUpdate);
    return () => {
      socket.off("tables:updated", handleTablesUpdate); // ✅ remove specific handler
    };
  }, []); // ✅ empty deps — runs once only

  // ── Fetch availability when table/date/time changes ──────────────────────
  useEffect(() => {
    if (!form.tableNumber) {
      setBookedSlots([]); setFullyBookedDates([]);
      setDateStatus(null); setTimeStatus(null);
      return;
    }
    setLoadingAvail(true);
    API.get("/reservations/availability", { params: { tableNumber: form.tableNumber } })
      .then((res) => {
        const { bookedSlots: slots = [], fullyBookedDates: fbd = [] } = res.data || {};
        setBookedSlots(slots);
        setFullyBookedDates(fbd);
        if (form.date) {
          setDateStatus(fbd.includes(form.date) ? "unavailable" : "available");
          if (form.time) {
            setTimeStatus(slots.some(s => s.date === form.date && s.time === form.time) ? "unavailable" : "available");
          }
        }
      })
      .catch(() => { setBookedSlots([]); setFullyBookedDates([]); })
      .finally(() => setLoadingAvail(false));
  }, [form.tableNumber, form.date, form.time]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const nameMap = {
    ux_user_fullname: "customerName",
    ux_user_contact_email: "customerEmail",
    ux_user_phone_num: "phone",
    ux_guest_count: "guests",
  };

  const handleChange = (e) => {
    const key = nameMap[e.target.name] || e.target.name;
    setForm(f => ({ ...f, [key]: e.target.value }));
    setErrors(err => ({ ...err, [key]: undefined }));
  };

  const handleTableChange = (value) => {
    setForm(f => ({ ...f, tableNumber: value, date: "", time: "" }));
    setDateStatus(null); setTimeStatus(null);
    setTableWarning(value && occupiedTables.includes(value)
      ? "This table is currently occupied. Please choose another." : "");
  };

  const handleDateChange = (e) => {
    const date = e.target.value;
    setForm(f => ({ ...f, date, time: "" }));
    setTimeStatus(null);
    setErrors(err => ({ ...err, date: undefined }));
    if (!date) { setDateStatus(null); return; }
    setDateStatus(form.tableNumber && fullyBookedDates.includes(date) ? "unavailable" : "available");
  };

  const handleTimeChange = (e) => {
    const time = e.target.value;
    setForm(f => ({ ...f, time }));
    setErrors(err => ({ ...err, time: undefined }));
    if (!time || !form.date) { setTimeStatus(null); return; }
    setTimeStatus(form.tableNumber && bookedSlots.some(s => s.date === form.date && s.time === time)
      ? "unavailable" : "available");
  };

  // ── Validation per step ───────────────────────────────────────────────────
  const validateStep1 = () => {
    const e = {};
    if (!form.customerName)  e.customerName  = "Name is required";
    if (!form.customerEmail || !/^\S+@\S+\.\S+$/.test(form.customerEmail))
      e.customerEmail = "Valid email required";
    if (!form.phone || !/^\d{10}$/.test(form.phone))
      e.phone = "10-digit phone number required";
    if (!form.guests) e.guests = "Select number of guests";
    return e;
  };

  const validateStep2 = () => {
    const e = {};
    if (!form.date) e.date = "Date is required";
    else if (dateStatus === "unavailable") e.date = "Fully booked for this table";
    if (!form.time) e.time = "Time is required";
    else if (timeStatus === "unavailable") e.time = "Slot already booked";
    if (!isWithinBusinessHours(form.date, form.time)) {
      setShowHoursPopup(true);
      e.time = "Outside business hours";
    }
    if (tableWarning) e.tableNumber = tableWarning;
    return e;
  };

  const nextStep = () => {
    const errs = step === 1 ? validateStep1() : validateStep2();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    if (step === 2) { setShowConfirm(true); return; }
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem("token");
    if (!token) { alert("Login required to reserve a table"); navigate("/login"); return; }
    try {
      setSubmitting(true);
      await API.post("/reservations", form);
      setShowConfirm(false);
      setStep(4);
      window.scrollTo({ top: 0, behavior: "smooth" });
      setSuccess(true);
    } catch (err) {
      setShowConfirm(false);
      alert(err.response?.data?.message || "Failed to book table.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(`Hi! I'd like to make a table reservation for ${form.guests || "some"} guests.`);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
  };

  // ── Styles ────────────────────────────────────────────────────────────────
  const inputCls = (hasError) => `
    w-full bg-[#0d0d0d] border ${hasError ? "border-red-500/70" : "border-zinc-800"}
    text-white px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50
    outline-none transition-all placeholder:text-zinc-700 text-sm
  `;
  const labelCls = "block text-xs font-bold mb-1.5 text-amber-400 uppercase tracking-widest";

  const isSubmitDisabled = submitting || !!tableWarning
    || dateStatus === "unavailable" || timeStatus === "unavailable";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .res-font-body    { font-family: 'DM Sans', sans-serif; }
        @keyframes fade-in { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .animate-fade-in  { animation: fade-in 0.4s ease forwards; }
        @keyframes slide-up { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .animate-slide-up { animation: slide-up 0.35s ease forwards; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.5); cursor:pointer; }
      `}</style>

      {showHoursPopup  && <OutOfHoursPopup onClose={() => setShowHoursPopup(false)} />}
      {showConfirm     && (
        <ConfirmationModal
          form={form}
          onConfirm={handleSubmit}
          onCancel={() => setShowConfirm(false)}
          submitting={submitting}
        />
      )}

      <section className="res-font-body min-h-screen bg-[#080808] py-24 px-4 relative">

        {/* Background decorative elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[300px] h-[300px] rounded-full bg-orange-600/5 blur-[100px]" />
          <div className="absolute top-20 left-10 text-zinc-900 text-[180px] font-serif leading-none select-none hidden xl:block">✦</div>
        </div>

        <div className="relative max-w-lg mx-auto">
          {/* Header */}
          <div className="text-center mb-10 animate-slide-up">
            <h1 className="text-5xl font-black mb-3 leading-tight flex items-center justify-center gap-3">
              <span style={{ color: "#ffffff" }}>Reserve</span>
              <span style={{ color: "#a1a1aa" }}>Your</span>
              <span style={{ color: "#f97316" }}>Table</span>
            </h1>
            <p className="text-zinc-500 text-sm">
              Mon–Fri 7:00 AM–10:30 PM &nbsp;·&nbsp; Sat–Sun 8:00 AM–11:00 PM
            </p>
          </div>

          {/* Card */}
          <div className="bg-[#0e0e0e] border border-zinc-800/60 rounded-3xl shadow-2xl overflow-hidden">

            {/* Step bar */}
            <div className="px-8 pt-8">
              <StepIndicator current={step} />
            </div>

            {success ? (
              <div className="px-8 pb-8"><SuccessScreen onDone={() => navigate("/")} /></div>
            ) : (
              <div className="px-8 pb-8 animate-fade-in" key={step}>

                {/* ── STEP 1 — Personal Info ── */}
                {step === 1 && (
                  <div className="space-y-4">
                    {/* Hidden honeypot */}
                    <input type="text"  name="name"  style={{ display:"none" }} tabIndex="-1" autoComplete="off" />
                    <input type="email" name="email" style={{ display:"none" }} tabIndex="-1" autoComplete="off" />

                    <div>
                      <label htmlFor="res-name" className={labelCls}>Full Name</label>
                      <input id="res-name" type="text" name="ux_user_fullname" autoComplete="new-password"
                        value={form.customerName} onChange={handleChange}
                        className={inputCls(errors.customerName)} placeholder="Your full name" />
                      {errors.customerName && <p className="text-red-400 text-xs mt-1">{errors.customerName}</p>}
                    </div>

                    <div>
                      <label htmlFor="res-email" className={labelCls}>Email Address</label>
                      <input id="res-email" type="email" name="ux_user_contact_email" autoComplete="new-password"
                        value={form.customerEmail} onChange={handleChange}
                        className={inputCls(errors.customerEmail)} placeholder="hello@example.com" />
                      {errors.customerEmail && <p className="text-red-400 text-xs mt-1">{errors.customerEmail}</p>}
                    </div>

                    <div>
                      <label htmlFor="res-phone" className={labelCls}>Phone Number</label>
                      <input id="res-phone" type="tel" name="ux_user_phone_num" autoComplete="new-password"
                        value={form.phone} onChange={handleChange}
                        className={inputCls(errors.phone)} placeholder="9876543210" />
                      {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
                    </div>

                    <div>
                      <label htmlFor="res-guests" className={labelCls}>Number of Guests</label>
                      <select id="res-guests" name="ux_guest_count" value={form.guests} onChange={handleChange}
                        className={inputCls(errors.guests)}>
                        <option value="">Select guests</option>
                        {[1,2,3,4,5,6,7,8].map(n => (
                          <option key={n} value={n}>{n} {n === 1 ? "Person" : "People"}</option>
                        ))}
                      </select>
                      {errors.guests && <p className="text-red-400 text-xs mt-1">{errors.guests}</p>}
                    </div>
                  </div>
                )}

                {/* ── STEP 2 — Table & Time ── */}
                {step === 2 && (
                  <div className="space-y-4">
                    {/* Table picker */}
                    <div>
                      <label htmlFor="res-table" className={labelCls}>
                        Preferred Table
                        <span className="normal-case text-zinc-600 font-normal ml-1">(optional)</span>
                        {loadingAvail && <span className="ml-2 text-amber-500 text-[10px] animate-pulse">checking...</span>}
                      </label>
                      <select id="res-table" name="tableNumber" value={form.tableNumber}
                        onChange={(e) => handleTableChange(e.target.value)}
                        className={inputCls(tableWarning)}>
                        <option value="">— No preference —</option>
                        {TABLE_IDS.map(t => (
                          <option key={t} value={t}>
                            {t} {occupiedTables.includes(t) ? "🔴 Occupied" : "🟢 Available"}
                          </option>
                        ))}
                      </select>
                      {tableWarning && (
                        <div className="flex items-center gap-2 bg-red-950/40 border border-red-800/40 rounded-lg px-3 py-2 mt-2">
                          <span>⚠️</span>
                          <p className="text-red-400 text-xs font-semibold">{tableWarning}</p>
                        </div>
                      )}
                    </div>

                    {/* Date */}
                    <div>
                      <label htmlFor="res-date" className={labelCls}>Date</label>
                      <input id="res-date" type="date" value={form.date} min={today}
                        onChange={handleDateChange}
                        className={`${inputCls(errors.date)} [color-scheme:dark]`} />
                      {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date}</p>}
                    </div>

                    {/* Time */}
                    <div>
                      <label className={labelCls}>Time</label>
                      <TimePicker
                        value={form.time}
                        onChange={(t) => {
                          handleTimeChange({ target: { value: t } });
                          setErrors(err => ({ ...err, time: undefined }));
                        }}
                        error={errors.time}
                      />
                      {errors.time && <p className="text-red-400 text-xs mt-1">{errors.time}</p>}
                    </div>
                  </div>
                )}

                {/* ── Navigation ── */}
                <div className={`flex gap-3 mt-6 ${step > 1 ? "flex-row" : "flex-col"}`}>
                  {step > 1 && (
                    <button onClick={() => setStep(s => s - 1)}
                      className="flex-1 border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white py-3 rounded-xl text-sm font-bold transition-all">
                      ← Back
                    </button>
                  )}
                  <button
                    onClick={nextStep}
                    disabled={isSubmitDisabled && step === 2}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold tracking-wider uppercase transition-all
                      ${isSubmitDisabled && step === 2
                        ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                        : "bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20 active:scale-[0.98]"
                      }`}>
                    {step === 1 ? "Continue →" : "Review Booking →"}
                  </button>
                </div>

                {/* WhatsApp */}
                <button onClick={handleWhatsApp} type="button"
                  className="w-full mt-3 flex items-center justify-center gap-2 border border-zinc-800 hover:border-[#25D366]/50 text-zinc-500 hover:text-[#25D366] py-2.5 rounded-xl text-sm font-medium transition-all">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  Have a query? Chat on WhatsApp
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}