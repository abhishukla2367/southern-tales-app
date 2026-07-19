import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import LiveTrackingMap from "../components/LiveTrackingMap";
import { FaMapMarkerAlt, FaClock, FaCalendarAlt, FaCreditCard, FaChevronLeft, FaPhoneAlt, FaCheckCircle, FaUtensils, FaUsers } from "react-icons/fa";
import API from "../api/axiosConfig";

// Format "YYYY-MM-DD" → "Mon, 10 Mar 2025"
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
};

const OrderSummaryPage = () => {
  const { state }  = useLocation();
  const navigate   = useNavigate();
  const { cartItems, clearCart } = useCart();

  const details    = state?.details || {};
  const orderType  = details.type || "delivery";
  const isDelivery = orderType === "delivery";
  const isDineIn   = orderType === "dinein";
  const isPickup   = orderType === "pickup";

  const [address,        setAddress]        = useState(details.address        || "");
  const [phone,          setPhone]          = useState(details.phone          || "");
  const [time,           setTime]           = useState(details.time           || "");
  const [date,           setDate]           = useState(details.date           || ""); // ✅ date state
  const [paymentMethod,  setPaymentMethod]  = useState("");
  const [orderConfirmed, setOrderConfirmed] = useState(false);

  // Dine-in fields — pre-filled from CartDrawer
  const [guestName,      setGuestName]      = useState(details.guestName      || "");
  const [tableNumber,    setTableNumber]    = useState(details.tableNumber    || "");
  const [numberOfGuests, setNumberOfGuests] = useState(details.numberOfGuests || "");

  const trackingRef = useRef(null);

  useEffect(() => { window.scrollTo(0, 0); }, []);
  useEffect(() => {
    if (orderConfirmed) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [orderConfirmed]);

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity, 0
  );

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);

  const handleConfirmOrder = async () => {
    if (!paymentMethod)
      return alert("Please select a payment method!");
    if (isDelivery && !address.trim())
      return alert("Please enter your delivery address!");
    if (isDineIn) {
      if (!guestName.trim())   return alert("Please enter your name!");
      if (!tableNumber.trim()) return alert("Please enter your table number!");
      if (!numberOfGuests || numberOfGuests < 1)
        return alert("Please enter number of guests!");
    }

    // ── Build order payload ───────────────────────────────────────
    const orderData = {
      orderType,
      items: cartItems.map((item) => ({
        productId: item.productId,
        name:      item.name,
        quantity:  item.quantity,
        price:     item.price,
        unit:      item.unit,
      })),
      totalAmount,
      paymentMethod,
      notes:        details.notes || "",
      scheduledDate: date  || null,   // ✅ send date to backend
      scheduledTime: time || null,   // ✅ already "H:MM AM/PM" from TimePicker
    };

    if (isDelivery || isPickup) {
      orderData.deliveryInfo = {
        address:  isDelivery ? address : "Pickup at store",
        phone,
      };
    }

    if (isDineIn) {
      orderData.guestName      = guestName;
      orderData.tableNumber    = tableNumber;
      orderData.numberOfGuests = parseInt(numberOfGuests);
    }

    try {
      // ✅ Explicitly attach auth token so order is linked to the user
      const token = localStorage.getItem("token");
      await API.post("/orders", orderData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      clearCart();
      setOrderConfirmed(true);
      if (!isDineIn) alert("Order Placed Successfully!");
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Something went wrong";
      alert(`Order Failed: ${msg}`);
    }
  };

  // ── Post-order confirmation screens ──────────────────────────────
  if (orderConfirmed) {
    if (isDineIn) {
      return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-white">
          <FaCheckCircle className="text-green-500 text-6xl mb-6" />
          <h2 className="text-3xl font-black mb-2">Order Confirmed!</h2>
          <p className="text-gray-400 mb-1">
            Table <span className="text-yellow-400 font-bold">{tableNumber}</span> ·{" "}
            <span className="text-yellow-400 font-bold">{numberOfGuests}</span> guest{numberOfGuests !== 1 ? "s" : ""}
          </p>
          {date && (
            <p className="text-gray-500 text-sm mt-1">
              📅 {formatDate(date)}{time ? ` at ${time}` : ""}
            </p>
          )}
          <p className="text-gray-500 text-sm mt-2">Our staff will be with you shortly.</p>
          <button onClick={() => navigate("/")}
            className="mt-8 px-8 py-3 bg-yellow-400 text-black rounded-xl font-bold hover:bg-yellow-500 transition">
            Back to Home
          </button>
        </div>
      );
    }

    if (isDelivery) {
      return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-white">
          <div className="w-full max-w-2xl bg-black/90 border-2 border-yellow-500 rounded-2xl p-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="h-3 w-3 bg-yellow-400 rounded-full animate-ping"></span> Live Tracking
            </h2>
            <div className="rounded-xl overflow-hidden border border-gray-800">
              <LiveTrackingMap />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-white">
        <FaCheckCircle className="text-green-500 text-6xl mb-6" />
        <h2 className="text-3xl font-black mb-2">Order Confirmed!</h2>
        <p className="text-gray-400">
          Please arrive at the store in{" "}
          <span className="text-yellow-400 font-bold">{time}</span>.
        </p>
        {date && (
          <p className="text-gray-500 text-sm mt-1">📅 {formatDate(date)}</p>
        )}
        <p className="text-xs text-gray-500 mt-2">
          Order ID: #EAT-{Math.floor(1000 + Math.random() * 9000)}
        </p>
        <button onClick={() => navigate("/")}
          className="mt-8 px-8 py-3 bg-yellow-400 text-black rounded-xl font-bold hover:bg-yellow-500 transition">
          Back to Home
        </button>
      </div>
    );
  }

  // ── Main Order Summary Form ───────────────────────────────────────
  const inputCls    = "w-full bg-gray-900 border border-gray-700 p-3 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none text-white transition";
  const readonlyCls = "w-full bg-gray-900 border border-gray-700 p-3 rounded-xl outline-none text-white transition cursor-default";
  const labelCls = "flex items-center gap-2 text-xs font-bold text-gray-500 uppercase";

  return (
    <div
      className="min-h-screen relative flex flex-col items-center p-6 pt-28 bg-fixed bg-cover bg-center"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=1470&q=80')" }}
    >
      <div className="absolute inset-0 bg-black/70 z-0" />

      <div className="relative z-10 w-full max-w-2xl">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-6">
          <FaChevronLeft /> Back to Cart
        </button>

        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-white">Order Summary</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="px-3 py-1 bg-yellow-400 text-black text-xs font-bold rounded-full uppercase">
              {orderType}
            </span>
            <p className="text-gray-300 italic">Finalize your {orderType} details</p>
          </div>
        </div>

        <div className="space-y-6">

          {/* 1. ITEMS LIST */}
          <div className="bg-black/80 backdrop-blur-md border border-gray-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Your Selections</h3>
            <div className="space-y-4 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
              {cartItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center border-b border-gray-800 pb-4">
                  <div className="flex items-center gap-4">
                    <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover border border-gray-700" />
                    <div>
                      <h2 className="font-semibold text-gray-100">{item.name}</h2>
                      <p className="text-gray-500 text-sm">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-bold text-gray-100">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 2. FORM FIELDS */}
          <div className="bg-black/80 backdrop-blur-md border border-gray-800 rounded-2xl p-6 shadow-xl space-y-5">

            {/* ── Delivery fields ── */}
            {isDelivery && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className={labelCls}><FaMapMarkerAlt /> Delivery Address</label>
                  <input type="text" placeholder="Enter your delivery address"
                    value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls} />
                </div>
                <div className="space-y-2">
                  <label className={labelCls}><FaPhoneAlt /> Phone Number</label>
                  <input type="text" placeholder="10-digit phone number"
                    value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
                </div>
                {/* ✅ Scheduled date — read-only if pre-filled, editable if not */}
                <div className="space-y-2">
                  <label className={labelCls}><FaCalendarAlt /> Scheduled Date</label>
                  <input type="text" placeholder="Not scheduled"
                    value={date ? formatDate(date) : ""}
                    readOnly
                    className={readonlyCls} />
                </div>
                <div className="space-y-2">
                  <label className={labelCls}><FaClock /> Preferred Time</label>
                  <input type="text" placeholder="e.g. 30–45 minutes"
                    value={time} onChange={(e) => setTime(e.target.value)} className={inputCls} />
                </div>
              </div>
            )}

            {/* ── Pickup fields ── */}
            {isPickup && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className={labelCls}><FaMapMarkerAlt /> Pickup Location</label>
                  <div className="w-full bg-gray-900/50 border border-dashed border-gray-700 p-3 rounded-xl text-white text-sm">
                    Sector 15, CBD Belapur, Navi Mumbai, Maharashtra 400614
                  </div>
                </div>
                {/* ✅ Scheduled date */}
                <div className="space-y-2">
                  <label className={labelCls}><FaCalendarAlt /> Scheduled Date</label>
                  <input type="text" placeholder="Not scheduled"
                    value={date ? formatDate(date) : ""}
                    readOnly
                    className={readonlyCls} />
                </div>
                <div className="space-y-2">
                  <label className={labelCls}><FaClock /> Preferred Pickup Time</label>
                  <input type="text" placeholder="e.g. 40–50 minutes"
                    value={time} onChange={(e) => setTime(e.target.value)} className={inputCls} />
                </div>
              </div>
            )}

            {/* ── Dine-in fields ── */}
            {isDineIn && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className={labelCls}><FaUtensils /> Your Name</label>
                  <input type="text" placeholder="Guest name"
                    value={guestName} onChange={(e) => setGuestName(e.target.value)} className={inputCls} />
                </div>
                <div className="space-y-2">
                  <label className={labelCls}><FaMapMarkerAlt /> Table Number</label>
                  <input type="text" placeholder="e.g. T4"
                    value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} className={inputCls} />
                </div>
                <div className="space-y-2">
                  <label className={labelCls}><FaUsers /> Number of Guests</label>
                  <input type="number" placeholder="e.g. 2" min="1"
                    value={numberOfGuests} onChange={(e) => setNumberOfGuests(e.target.value)} className={inputCls} />
                </div>
                {/* ✅ Scheduled date */}
                <div className="space-y-2">
                  <label className={labelCls}><FaCalendarAlt /> Dining Date</label>
                  <input type="text" placeholder="Not scheduled"
                    value={date ? formatDate(date) : ""}
                    readOnly
                    className={readonlyCls} />
                </div>
                <div className="space-y-2">
                  <label className={labelCls}><FaClock /> Dining Time</label>
                  <input type="text" placeholder="Not set"
                    value={time} readOnly
                    className={readonlyCls} />
                </div>
              </div>
            )}

            {/* ── Payment method ── */}
            <div className="space-y-2">
              <label className={labelCls}><FaCreditCard /> Payment Method</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={inputCls}>
                <option value="">Select Method</option>
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="Card">Credit / Debit Card</option>
                <option value="Cash">
                  {isDelivery ? "Cash on Delivery" : isDineIn ? "Pay at Table" : "Pay at Store"}
                </option>
              </select>
            </div>
          </div>

          {/* 3. TOTAL & ACTIONS */}
          <div className="bg-black/90 backdrop-blur-lg border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-lg">Payable Amount</span>
              <span className="text-3xl font-black text-yellow-500">{formatCurrency(totalAmount)}</span>
            </div>
            <div className="flex gap-4">
              <button onClick={() => { clearCart(); navigate("/"); }}
                className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all">
                Cancel
              </button>
              <button onClick={handleConfirmOrder}
                className="flex-1 py-4 bg-yellow-400 hover:bg-yellow-500 text-black rounded-xl font-black transition-all">
                Confirm Order
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OrderSummaryPage;