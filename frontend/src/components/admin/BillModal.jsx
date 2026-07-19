import { useState, useEffect, useRef } from "react";
import API from "../../api/axiosConfig";

const LOGO_URL = "https://res.cloudinary.com/db2vju4mv/image/upload/f_auto,q_auto,w_200/v1772560792/southern-tales-logo_knrfgm.jpg";
const RESTAURANT = {
  name: "Southern Tales",
  tagline: "Where Every Bite Tells A Story",
  address: "CBD Belapur, Navi Mumbai, Maharashtra",
  phone: "+91 98765 43210",
  gst: "33AABCU9603R1ZX",
};

const PRINT_STYLE = `
  @media print {
    .bill-no-print {
      display: none !important;
    }
    .bill-total-amount {
      -webkit-text-fill-color: #c87a1a !important;
      color: #c87a1a !important;
      background: none !important;
      -webkit-background-clip: unset !important;
      background-clip: unset !important;
    }
    .bill-restaurant-name {
      -webkit-text-fill-color: #c87a1a !important;
      color: #c87a1a !important;
      background: none !important;
      -webkit-background-clip: unset !important;
      background-clip: unset !important;
    }
  }
`;

function PrintStyleInjector() {
  useEffect(() => {
    const id = "bill-print-styles";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.textContent = PRINT_STYLE;
      document.head.appendChild(style);
    }
  }, []);
  return null;
}

function StatusPill({ status }) {
  const paid = status === "Paid";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border ${
        paid
          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
          : "bg-orange-500/10 text-orange-400 border-orange-500/30"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${paid ? "bg-emerald-400 animate-pulse" : "bg-orange-400"}`} />
      {status}
    </span>
  );
}

function Skeleton({ className = "" }) {
  return <div className={`bg-[#2a2318] rounded animate-pulse ${className}`} />;
}

const ORDER_TYPE_INFO = {
  walkin:   { label: "Walk-in",  style: { background: "rgba(200,122,26,0.14)", color: "#d48a28", border: "1px solid rgba(200,122,26,0.3)" } },
  dinein:   { label: "Dine-in",  style: { background: "rgba(52,211,153,0.1)",  color: "#34d399", border: "1px solid rgba(52,211,153,0.25)" } },
  delivery: { label: "Delivery", style: { background: "rgba(96,165,250,0.1)",  color: "#7ab8fa", border: "1px solid rgba(96,165,250,0.25)" } },
  pickup:   { label: "Pickup",   style: { background: "rgba(167,139,250,0.1)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.25)" } },
};

export default function BillModal({ orderId, onClose, onPaid }) {
  const [bill, setBill]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying]   = useState(false);
  const [visible, setVisible] = useState(false);
  const [printed, setPrinted] = useState(false);
  const overlayRef            = useRef(null);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const fetchBill = async () => {
      setBill(null);
      setLoading(true);
      try {
        const { data } = await API.get(`/bill/${orderId}`, {
          signal: controller.signal,
        });
        setBill(data);
      } catch (err) {
        if (err.name !== "AbortError" && err.code !== "ERR_CANCELED") {
          alert("Failed to load bill");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchBill();
    return () => controller.abort();
  }, [orderId]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) handleClose();
  };

  const handlePrint = () => {
    window.print();
    setPrinted(true);
  };

  const handleMarkPaid = async () => {
    if (paying || bill?.paymentStatus === "Paid") return;
    setPaying(true);
    try {
      // ✅ FIX: Pass an empty object as the body so Axios sets Content-Type: application/json
      //    Without a body, Axios omits the header and Express leaves req.body undefined.
      await API.patch(`/bill/${orderId}/pay`, {});
      setBill((prev) => ({ ...prev, paymentStatus: "Paid" }));
      onPaid?.(orderId);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to mark as paid");
    } finally {
      setPaying(false);
    }
  };

  const typeInfo = ORDER_TYPE_INFO[bill?.orderType] ?? ORDER_TYPE_INFO.walkin;

  return (
    <>
      <PrintStyleInjector />
      <div
        ref={overlayRef}
        onClick={handleOverlayClick}
        className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 overflow-y-auto"
        style={{
          backgroundColor: visible ? "rgba(10,8,4,0.90)" : "rgba(10,8,4,0)",
          backdropFilter: visible ? "blur(12px)" : "blur(0px)",
          transition: "background-color 0.35s ease, backdrop-filter 0.35s ease",
        }}
      >
        <div
          className="relative w-full max-w-[430px]"
          style={{
            transform: visible ? "translateY(0) scale(1)" : "translateY(28px) scale(0.96)",
            opacity: visible ? 1 : 0,
            transition: "transform 0.4s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease",
          }}
        >
          <div
            className="relative rounded-3xl overflow-hidden border"
            style={{
              background: "linear-gradient(160deg, #181208 0%, #120e06 50%, #0e0a04 100%)",
              borderColor: "#2e2210",
              boxShadow: "0 40px 100px rgba(0,0,0,0.9), 0 0 0 1px rgba(230,130,30,0.07) inset",
            }}
          >
            {/* Ambient glow */}
            <div
              className="absolute inset-x-0 top-0 h-64 pointer-events-none"
              style={{ background: "radial-gradient(ellipse 90% 55% at 50% -5%, rgba(200,122,26,0.14) 0%, transparent 70%)" }}
            />

            {/* ── RESTAURANT HEADER ── */}
            <div className="relative px-8 pt-8 pb-6 text-center" style={{ borderBottom: "1px solid #2e1f08" }}>
              <div className="flex justify-center mb-4">
                <img src={LOGO_URL} alt={RESTAURANT.name}
                  className="w-20 h-20 rounded-full object-cover"
                  style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.5)" }}
                />
              </div>

              <h1
                className="bill-restaurant-name text-[24px] font-black leading-none mb-1"
                style={{
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  background: "linear-gradient(135deg, #e8a83a 0%, #c87a1a 50%, #e8a83a 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  letterSpacing: "0.04em",
                }}
              >
                {RESTAURANT.name}
              </h1>
              <p className="text-[10px] tracking-[0.22em] uppercase mb-3 font-semibold" style={{ color: "#b07830" }}>
                {RESTAURANT.tagline}
              </p>
              <p className="text-[11px] font-medium" style={{ color: "#9a6e3a" }}>{RESTAURANT.address}</p>
              <p className="text-[11px] font-medium mt-0.5" style={{ color: "#9a6e3a" }}>
                {RESTAURANT.phone} · GST: {RESTAURANT.gst}
              </p>

              <div className="flex items-center gap-3 mt-5">
                <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, transparent, #3e2a0e)" }} />
                <svg viewBox="0 0 24 12" className="w-6 h-3" style={{ opacity: 0.6 }}>
                  <path d="M0 6 Q6 0 12 6 Q18 12 24 6" stroke="#c87a1a" strokeWidth="1" fill="none" />
                </svg>
                <div className="flex-1 h-px" style={{ background: "linear-gradient(to left, transparent, #3e2a0e)" }} />
              </div>

              {/* Close button */}
              <button
                onClick={handleClose}
                className="bill-no-print absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
                style={{ border: "1px solid #2a1a08", color: "#7a5520" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(200,122,26,0.45)"; e.currentTarget.style.color = "#e8a83a"; e.currentTarget.style.background = "rgba(200,122,26,0.07)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2a1a08"; e.currentTarget.style.color = "#7a5520"; e.currentTarget.style.background = "transparent"; }}
              >
                <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3">
                  <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* ── BODY ── */}
            <div className="px-7 py-6">
              {loading ? (
                <div className="space-y-3 py-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                  <div className="h-px w-full my-4" style={{ background: "#201808" }} />
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
                  <div className="h-px w-full" style={{ background: "#201808" }} />
                  <Skeleton className="h-6 w-1/3 ml-auto" />
                </div>
              ) : bill ? (
                <>
                  {/* Order Meta */}
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.22em] mb-1 font-bold" style={{ color: "#9a6e3a" }}>
                        Bill #{orderId}
                      </p>
                      <p className="text-[15px] font-black" style={{ color: "#f0e6cc", fontFamily: "'Georgia', serif" }}>
                        {bill.customer.name}
                      </p>
                      <p className="text-[12px] mt-0.5 font-medium" style={{ color: "#9a6e3a" }}>
                        {bill.customer.email}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusPill status={bill.paymentStatus} />
                      <span className="text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider" style={typeInfo.style}>
                        {typeInfo.label}
                      </span>
                    </div>
                  </div>

                  {/* Table / Guests strip */}
                  {(bill.tableNumber || bill.numberOfGuests) && (
                    <div className="flex gap-5 mb-4 text-[12px]" style={{ color: "#9a6e3a" }}>
                      {bill.tableNumber    && <span>🪑 Table <strong style={{ color: "#d4a860" }}>{bill.tableNumber}</strong></span>}
                      {bill.numberOfGuests && <span>👥 <strong style={{ color: "#d4a860" }}>{bill.numberOfGuests}</strong> guest{bill.numberOfGuests !== 1 ? "s" : ""}</span>}
                    </div>
                  )}

                  <div className="w-full border-t border-dashed mb-4" style={{ borderColor: "#3a2610" }} />

                  {/* Items Table */}
                  <div className="mb-2">
                    <div className="grid grid-cols-12 text-[10px] uppercase tracking-[0.18em] pb-2.5 font-bold" style={{ color: "#9a6e3a" }}>
                      <span className="col-span-6">Item</span>
                      <span className="col-span-2 text-center">Qty</span>
                      <span className="col-span-2 text-right">Rate</span>
                      <span className="col-span-2 text-right">Amt</span>
                    </div>
                    {bill.items.map((item, i) => (
                      <div key={i} className="grid grid-cols-12 py-2.5 border-t" style={{ borderColor: "#261a08" }}>
                        <span className="col-span-6 text-[13px] font-semibold pr-2 leading-snug" style={{ color: "#e8d8b0", fontFamily: "'Georgia', serif" }}>
                          {item.name}
                        </span>
                        <span className="col-span-2 text-[13px] text-center font-medium" style={{ color: "#9a6e3a" }}>{item.quantity}</span>
                        <span className="col-span-2 text-[13px] text-right font-medium" style={{ color: "#9a6e3a" }}>₹{item.price}</span>
                        <span className="col-span-2 text-[13px] text-right font-bold" style={{ color: "#d4a860" }}>₹{item.subtotal}</span>
                      </div>
                    ))}
                  </div>

                  <div className="w-full border-t my-3" style={{ borderColor: "#2e1f08" }} />

                  {/* Subtotals */}
                  <div className="space-y-2 mb-1">
                    <div className="flex justify-between text-[13px] font-medium" style={{ color: "#9a6e3a" }}>
                      <span>Subtotal</span><span>₹{bill.subtotal}</span>
                    </div>
                    <div className="flex justify-between text-[13px] font-medium" style={{ color: "#9a6e3a" }}>
                      <span>GST (5%)</span><span>₹{bill.tax}</span>
                    </div>
                  </div>

                  {/* Grand Total */}
                  <div
                    className="flex justify-between items-center rounded-2xl px-4 py-3 mt-3 mb-1"
                    style={{
                      background: "linear-gradient(135deg, rgba(200,122,26,0.15) 0%, rgba(200,122,26,0.07) 100%)",
                      border: "1px solid rgba(200,122,26,0.25)",
                    }}
                  >
                    <span className="text-[12px] font-black uppercase tracking-[0.18em]" style={{ color: "#b07830" }}>Grand Total</span>
                    <span
                      className="bill-total-amount text-[28px] font-black leading-none"
                      style={{
                        fontFamily: "'Georgia', serif",
                        background: "linear-gradient(135deg, #e8a83a, #c87a1a)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      ₹{bill.total}
                    </span>
                  </div>

                  <div className="w-full border-t border-dashed my-4" style={{ borderColor: "#3a2610" }} />

                  <p className="text-center text-[10px] uppercase tracking-[0.25em] mb-5 font-semibold" style={{ color: "#6b4e1a" }}>
                    Heritage recipes · Finest spices · Timeless flavours
                  </p>

                  {/* Action Buttons */}
                  {(!printed || bill.paymentStatus !== "Paid") && (
                    <div className="bill-no-print flex gap-3">
                      {!printed && (
                        <button
                          onClick={handlePrint}
                          className="flex-1 h-11 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200"
                          style={{ border: "1px solid #3a2610", color: "#9a6e3a" }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(200,122,26,0.4)"; e.currentTarget.style.color = "#c87a1a"; e.currentTarget.style.background = "rgba(200,122,26,0.07)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#3a2610"; e.currentTarget.style.color = "#9a6e3a"; e.currentTarget.style.background = "transparent"; }}
                        >
                          <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
                            <path d="M4 5V2h8v3M4 11H2V7h12v4h-2M4 9h8v5H4V9z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Print Bill
                        </button>
                      )}

                      {bill.paymentStatus !== "Paid" && (
                        <button
                          onClick={handleMarkPaid}
                          disabled={paying || bill.paymentStatus === "Paid"}
                          className="flex-1 h-11 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                          style={{
                            background: "linear-gradient(135deg, rgba(245,90,30,0.18), rgba(230,120,20,0.12))",
                            border: "1px solid rgba(230,100,20,0.35)",
                            color: "#f0843a",
                          }}
                          onMouseEnter={(e) => { if (!paying) e.currentTarget.style.background = "linear-gradient(135deg, rgba(245,90,30,0.28), rgba(230,120,20,0.2))"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(245,90,30,0.18), rgba(230,120,20,0.12))"; }}
                        >
                          {paying ? (
                            <>
                              <span className="w-3.5 h-3.5 rounded-full border-2 border-orange-400/30 border-t-orange-400 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
                                <path d="M2 8l4 4 8-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              Mark Paid
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center py-10 gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ border: "1px solid #2a1a08" }}>
                    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" style={{ color: "#7a5520" }}>
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium" style={{ color: "#7a5520" }}>Bill not found</p>
                </div>
              )}
            </div>

            {/* Receipt tear edge */}
            <div className="bill-no-print flex overflow-hidden" style={{ height: "16px" }}>
              {Array.from({ length: 28 }).map((_, i) => (
                <div key={i} className="flex-1" style={{
                  height: "16px",
                  background: i % 2 === 0 ? "#0e0a04" : "transparent",
                  borderRadius: i % 2 === 0 ? "0 0 50% 50%" : "0",
                  borderTop: i % 2 === 1 ? "1px solid #201808" : "none",
                }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}