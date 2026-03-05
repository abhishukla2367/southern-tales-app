import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import LiveTrackingMap from "../components/LiveTrackingMap";
import { FaMapMarkerAlt, FaClock, FaCreditCard, FaChevronLeft, FaPhoneAlt, FaCheckCircle, FaUtensils, FaUsers } from "react-icons/fa";
import API from "../api/axiosConfig";

const OrderSummaryPage = () => {
  const { state }  = useLocation();
  const navigate   = useNavigate();
  const { cartItems, clearCart } = useCart();

  const details    = state?.details || {};
  const orderType  = details.type || "delivery";
  const isDelivery = orderType === "delivery";
  const isDineIn   = orderType === "dinein";
  const isPickup   = orderType === "pickup";

  const [address,       setAddress]       = useState(details.address       || "");
  const [phone,         setPhone]         = useState(details.phone         || "");
  const [time,          setTime]          = useState(details.time          || "");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [orderConfirmed, setOrderConfirmed] = useState(false);

  // ✅ Dine-in fields — pre-filled from CartDrawer state
  const [guestName,      setGuestName]      = useState(details.guestName      || "");
  const [tableNumber,    setTableNumber]    = useState(details.tableNumber    || "");
  const [numberOfGuests, setNumberOfGuests] = useState(details.numberOfGuests || "");

  const trackingRef = useRef(null);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  // ✅ Scroll to top when order is confirmed
  useEffect(() => {
    if (orderConfirmed) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [orderConfirmed]);

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity, 0
  );

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);

  const handleConfirmOrder = async () => {
    // ── Validation ───────────────────────────────────────────────
    if (!paymentMethod)
      return alert("Please select a payment method!");

    if (isDelivery && !address.trim())
      return alert("Please enter your delivery address!");

    if (isDineIn) {
      if (!guestName.trim())    return alert("Please enter your name!");
      if (!tableNumber.trim())  return alert("Please enter your table number!");
      if (!numberOfGuests || numberOfGuests < 1)
        return alert("Please enter number of guests!");
    }

    // ── Build order payload ──────────────────────────────────────
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
      notes: details.notes || "",
    };

    // Delivery / Pickup
    if (isDelivery || isPickup) {
      orderData.deliveryInfo = {
        address: isDelivery ? address : "Pickup at store",
        phone,
      };
    }

    // ✅ Dine-in — send table/guest info to backend
    if (isDineIn) {
      orderData.guestName      = guestName;
      orderData.tableNumber    = tableNumber;
      orderData.numberOfGuests = parseInt(numberOfGuests);
    }

    try {
      await API.post("/orders", orderData);
      clearCart();
      setOrderConfirmed(true);
      if (!isDineIn) alert("Order Placed Successfully!");
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Something went wrong";
      alert(`Order Failed: ${msg}`);
    }
  };

  // ── Post-order confirmation screens ─────────────────────────────
  if (orderConfirmed) {
    // Dine-in success
    if (isDineIn) {
      return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-white">
          <FaCheckCircle className="text-green-500 text-6xl mb-6" />
          <h2 className="text-3xl font-black mb-2">Order Confirmed!</h2>
          <p className="text-gray-400 mb-1">
            Table <span className="text-yellow-400 font-bold">{tableNumber}</span> ·{" "}
            <span className="text-yellow-400 font-bold">{numberOfGuests}</span> guest{numberOfGuests !== 1 ? "s" : ""}
          </p>
          <p className="text-gray-500 text-sm mt-2">Our staff will be with you shortly.</p>
          <button
            onClick={() => navigate("/")}
            className="mt-8 px-8 py-3 bg-yellow-400 text-black rounded-xl font-bold hover:bg-yellow-500 transition"
          >
            Back to Home
          </button>
        </div>
      );
    }

    // Delivery — live tracking
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

    // Pickup success
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-white">
        <FaCheckCircle className="text-green-500 text-6xl mb-6" />
        <h2 className="text-3xl font-black mb-2">Order Confirmed!</h2>
        <p className="text-gray-400">
          Please arrive at the store in{" "}
          <span className="text-yellow-400 font-bold">{time}</span>.
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Order ID: #EAT-{Math.floor(1000 + Math.random() * 9000)}
        </p>
        <button
          onClick={() => navigate("/")}
          className="mt-8 px-8 py-3 bg-yellow-400 text-black rounded-xl font-bold hover:bg-yellow-500 transition"
        >
          Back to Home
        </button>
      </div>
    );
  }

  // ── Main Order Summary Form ──────────────────────────────────────
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
                  <label htmlFor="delivery-address" className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase">
                    <FaMapMarkerAlt aria-hidden="true" /> Delivery Address
                  </label>
                  <input
                    id="delivery-address"
                    type="text"
                    placeholder="Enter your delivery address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 p-3 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none text-white transition"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="delivery-phone" className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase">
                    <FaPhoneAlt aria-hidden="true" /> Phone Number
                  </label>
                  <input
                    id="delivery-phone"
                    type="text"
                    placeholder="10-digit phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 p-3 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none text-white transition"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="delivery-time" className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase">
                    <FaClock aria-hidden="true" /> Preferred Time
                  </label>
                  <input
                    id="delivery-time"
                    type="text"
                    placeholder="e.g. 30–45 minutes"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 p-3 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none text-white transition"
                  />
                </div>
              </div>
            )}

            {/* ── Pickup fields ── */}
            {isPickup && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase">
                    <FaMapMarkerAlt aria-hidden="true" /> Pickup Location
                  </label>
                  <div className="w-full bg-gray-900/50 border border-dashed border-gray-700 p-3 rounded-xl text-yellow-500 text-sm">
                    Sector 15, CBD Belapur, Navi Mumbai, Maharashtra 400614
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="pickup-time" className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase">
                    <FaClock aria-hidden="true" /> Preferred Pickup Time
                  </label>
                  <input
                    id="pickup-time"
                    type="text"
                    placeholder="e.g. 40–50 minutes"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 p-3 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none text-white transition"
                  />
                </div>
              </div>
            )}

            {/* ── Dine-in fields ✅ ── */}
            {isDineIn && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label htmlFor="dinein-name" className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase">
                    <FaUtensils aria-hidden="true" /> Your Name
                  </label>
                  <input
                    id="dinein-name"
                    type="text"
                    placeholder="Guest name"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 p-3 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none text-white transition"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="dinein-table" className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase">
                    <FaMapMarkerAlt aria-hidden="true" /> Table Number
                  </label>
                  <input
                    id="dinein-table"
                    type="text"
                    placeholder="e.g. T4"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 p-3 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none text-white transition"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="dinein-guests" className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase">
                    <FaUsers aria-hidden="true" /> Number of Guests
                  </label>
                  <input
                    id="dinein-guests"
                    type="number"
                    placeholder="e.g. 2"
                    min="1"
                    value={numberOfGuests}
                    onChange={(e) => setNumberOfGuests(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 p-3 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none text-white transition"
                  />
                </div>
              </div>
            )}

            {/* ── Payment method (all order types) ── */}
            <div className="space-y-2">
              <label htmlFor="payment-method" className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase">
                <FaCreditCard aria-hidden="true" /> Payment Method
              </label>
              <select
                id="payment-method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 p-3 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none text-white transition"
              >
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
              <button
                onClick={() => { clearCart(); navigate("/"); }}
                className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmOrder}
                className="flex-1 py-4 bg-yellow-400 hover:bg-yellow-500 text-black rounded-xl font-black transition-all"
              >
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