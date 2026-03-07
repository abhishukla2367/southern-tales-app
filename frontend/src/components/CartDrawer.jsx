import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import API from "../api/axiosConfig";
import socket from "../socket";
import TimePicker from "./admin/reservations/TimePicker";
import DatePicker from "./admin/reservations/DatePicker";
import OutOfHoursPopup from "./admin/reservations/OutOfHoursPopup";

const EATSURE_LOGO = "https://res.cloudinary.com/db2vju4mv/image/upload/v1772896571/eat-sure-logo_wsbtia.jpg";
const EMPTY_CART_IMG = "https://res.cloudinary.com/db2vju4mv/image/upload/v1772896571/empty-cart_sbolaw.jpg";

const TABLE_IDS = [
  "T1","T2","T3","T4","T5","T6","T7","T8","T9","T10",
  "T11","T12","T13","T14","T15","T16","T17","T18","T19","T20",
];

const GUEST_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

const toDateStr = (d) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

// ── Convert "HH:MM" (24h) → "06:00 PM" (12h with AM/PM) ─────────────────────
const fmt24hTo12h = (timeStr) => {
  if (!timeStr) return "";
  const match = timeStr.match(/(\d+):(\d+)(?:\s*(AM|PM))?/i);
  if (!match) return timeStr;
  let h = parseInt(match[1], 10);
  const m = match[2];
  if (match[3]) return timeStr; // already has AM/PM
  const period = h >= 12 ? "PM" : "AM";
  if (h === 0)     h = 12;
  else if (h > 12) h = h - 12;
  return `${String(h).padStart(2, "0")}:${m} ${period}`;
};

// ── Parse pure 24h "HH:MM" OR "HH:MM AM/PM" → total minutes ─────────────────
const timeToMins = (val) => {
  if (!val) return null;
  const match = val.match(/(\d+):(\d+)(?:\s*(AM|PM))?/i);
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const period = (match[3] || "").toUpperCase();
  if (period === "AM" && h === 12) h = 0;
  if (period === "PM" && h < 12)  h = h + 12;
  return h * 60 + m;
};

const getHoursForDate = (dateStr) => {
  const d = dateStr ? new Date(dateStr + "T00:00:00") : new Date();
  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
  return isWeekend
    ? { openH: 8,  openM: 0, closeH: 23, closeM: 0  }
    : { openH: 7,  openM: 0, closeH: 22, closeM: 30 };
};

// ── Fixed: handles both "HH:MM" and "HH:MM AM/PM" ───────────────────────────
const isWithinBusinessHours = (val, dateStr) => {
  if (!val) return true;
  const totalMins = timeToMins(val);
  if (totalMins === null) return true;
  const { openH, openM, closeH, closeM } = getHoursForDate(dateStr);
  return totalMins >= openH * 60 + openM && totalMins <= closeH * 60 + closeM;
};

const getDineinStatus = (todayStr, selectedDate) => {
  const checkingToday = !selectedDate || selectedDate === todayStr;
  const { openH, openM, closeH, closeM } = getHoursForDate(selectedDate || todayStr);
  const openMins  = openH  * 60 + openM;
  const closeMins = closeH * 60 + closeM;

  let isDineinOpen = true;
  let reopenLabel  = "";

  if (checkingToday) {
    const now     = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    isDineinOpen  = nowMins >= openMins && nowMins <= closeMins;

    if (!isDineinOpen) {
      if (nowMins < openMins) {
        reopenLabel = `Opens today at ${openH % 12 || 12}:${String(openM).padStart(2,"0")} ${openH < 12 ? "AM" : "PM"}`;
      } else {
        const tomorrow        = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowWeekend = tomorrow.getDay() === 0 || tomorrow.getDay() === 6;
        const [tH, tM]        = tomorrowWeekend ? [8, 0] : [7, 0];
        reopenLabel = `Opens tomorrow at ${tH % 12 || 12}:${String(tM).padStart(2,"0")} ${tH < 12 ? "AM" : "PM"}`;
      }
    }
  }

  return { isDineinOpen, reopenLabel };
};

const CartDrawer = () => {
  const navigate = useNavigate();

  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    orderType,
    setOrderType,
  } = useCart();

  const [todayStr, setTodayStr] = useState(() => toDateStr(new Date()));

  useEffect(() => {
    const id = setInterval(() => {
      const newToday = toDateStr(new Date());
      setTodayStr((prev) => (prev !== newToday ? newToday : prev));
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const [platform,         setPlatform]        = useState("");
  const [userAddressState, setUserAddressState] = useState("");
  const [userPhoneState,   setUserPhoneState]   = useState("");

  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [pickupDate,   setPickupDate]   = useState("");
  const [pickupTime,   setPickupTime]   = useState("");
  const [dineinDate,   setDineinDate]   = useState("");
  const [dineinTime,   setDineinTime]   = useState("");

  const [showOutOfHours, setShowOutOfHours] = useState(false);

  const [guestName,      setGuestName]      = useState("");
  const [tableNumber,    setTableNumber]    = useState("");
  const [numberOfGuests, setNumberOfGuests] = useState("");
  const [occupiedTables, setOccupiedTables] = useState([]);
  const [tableWarning,   setTableWarning]   = useState("");

  const totalPrice = getCartTotal();
  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    API.get("/tables")
      .then((res) => {
        const tables = res.data?.tables || res.data || [];
        setOccupiedTables(
          tables.filter((t) => t.status === "occupied").map((t) => t.tableNumber)
        );
      })
      .catch(() => {});

    socket.emit("join_tables_room");
    const handleTablesUpdate = ({ tables }) => {
      setOccupiedTables(
        tables.filter((t) => t.status === "occupied").map((t) => t.tableNumber)
      );
    };
    socket.on("tables:updated", handleTablesUpdate);
    return () => socket.off("tables:updated", handleTablesUpdate);
  }, []);

  const handleDineinTimeChange = (hhmm) => {
    setDineinTime(hhmm);
    if (hhmm && !isWithinBusinessHours(hhmm, dineinDate || todayStr)) {
      setShowOutOfHours(true);
    }
  };

  const handleDineinDateChange = (val) => {
    setDineinDate(val);
    if (dineinTime && !isWithinBusinessHours(dineinTime, val)) {
      setShowOutOfHours(true);
    }
  };

  const handlePickupTimeBlur = () => {
    if (!pickupTime) return;
    const numbers = pickupTime.match(/\d+/g);
    if (!numbers) return;
    const minutesFromNow = Math.max(...numbers.map(Number));
    const selectedDate = pickupDate && pickupDate > todayStr ? pickupDate : null;
    let base;
    if (selectedDate) {
      const { openH, openM } = getHoursForDate(selectedDate);
      base = new Date(selectedDate + "T00:00:00");
      base.setHours(openH, openM, 0, 0);
    } else {
      base = new Date();
    }
    const estimated  = new Date(base.getTime() + minutesFromNow * 60 * 1000);
    const { closeH, closeM } = getHoursForDate(pickupDate || todayStr);
    const estimatedMins = estimated.getHours() * 60 + estimated.getMinutes();
    const closeMins     = closeH * 60 + closeM;
    if (estimatedMins > closeMins) setShowOutOfHours(true);
  };

  const { isDineinOpen, reopenLabel } = getDineinStatus(todayStr, dineinDate);

  const deliveryPlatforms = [
    { name: "Zomato",  logo: "https://upload.wikimedia.org/wikipedia/commons/7/75/Zomato_logo.png" },
    { name: "Swiggy",  logo: "https://upload.wikimedia.org/wikipedia/commons/1/13/Swiggy_logo.png" },
    { name: "Dominos", logo: "https://upload.wikimedia.org/wikipedia/commons/7/74/Dominos_pizza_logo.svg" },
    { name: "EatSure", logo: EATSURE_LOGO },
  ];

  // isTimeInvalid now works correctly with 24h format
  const isTimeInvalid =
    orderType === "dinein" && dineinTime && !isWithinBusinessHours(dineinTime, dineinDate || todayStr);

  const handleCheckout = () => {
    if (isTimeInvalid) { setShowOutOfHours(true); return; }
    if (orderType === "delivery" && (!platform || !userAddressState)) {
      alert("Please select a delivery platform and enter your address.");
      return;
    }
    if (orderType === "dinein" && (!guestName.trim() || !tableNumber.trim() || !numberOfGuests || tableWarning)) {
      alert("Please enter your name, select an available table, and number of guests.");
      return;
    }

    const dateByType = { delivery: deliveryDate, pickup: pickupDate, dinein: dineinDate };
    const timeByType = { delivery: deliveryTime, pickup: pickupTime, dinein: dineinTime };

    // Convert 24h → 12h before passing to OrderSummary
    const rawTime    = timeByType[orderType];
    const displayTime = fmt24hTo12h(rawTime);

    navigate("/order-summary", {
      state: {
        items: cartItems,
        total: totalPrice,
        details: {
          type:           orderType,
          platform,
          address:        userAddressState,
          phone:          userPhoneState,
          date:           dateByType[orderType],
          time:           displayTime,   // ← "06:00 PM" not "18:00"
          guestName,
          tableNumber,
          numberOfGuests: numberOfGuests ? parseInt(numberOfGuests) : undefined,
        },
      },
    });
  };

  const fieldCls = "w-full p-3 bg-[#1a1a1a] border border-zinc-800 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none text-white hover:border-zinc-600 transition-colors";
  const labelCls = "text-xs text-gray-500 mb-1.5 block uppercase tracking-widest";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">

      {showOutOfHours && (
        <OutOfHoursPopup
          onClose={() => {
            setShowOutOfHours(false);
            if (orderType === "pickup") setPickupTime("");
            else setDineinTime("");
          }}
        />
      )}

      <div className="flex-1 pt-28 flex flex-col items-center px-4">
        <h1 className="text-4xl font-extrabold text-orange-600 mb-2 text-center">Your Cart</h1>
        <p className="text-gray-400 mb-10 text-center text-lg">Review Your Delicious Selections</p>

        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center gap-6 mt-20">
            <img src={EMPTY_CART_IMG} alt="Empty Cart" className="w-40 h-40 grayscale" />
            <h2 className="text-xl font-semibold text-gray-300">Your cart is empty</h2>
            <button onClick={() => navigate("/menu")}
              className="bg-orange-600 hover:bg-orange-700 text-white font-medium px-6 py-3 rounded-md mt-4">
              Browse Menu
            </button>
          </div>
        ) : (
          <div className="w-full max-w-3xl flex flex-col gap-6 mb-20">

            {/* ── CART ITEMS ── */}
            {cartItems.map((item, index) => (
              <div key={item._id || item.id || index}
                className="bg-[#141414] border border-gray-800 rounded-xl shadow p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img src={item.image} alt={item.name}
                    className="w-20 h-20 object-cover rounded-lg border border-gray-700" />
                  <div>
                    <h3 className="font-semibold text-lg text-gray-100">{item.name}</h3>
                    <p className="text-orange-500 font-bold">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item.productId || item._id, item.quantity - 1)}
                    className="bg-gray-800 px-2 rounded hover:bg-gray-700 text-white">-</button>
                  <span className="px-2">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId || item._id, item.quantity + 1)}
                    className="bg-gray-800 px-2 rounded hover:bg-gray-700 text-white">+</button>
                  <button onClick={() => removeFromCart(item.productId || item._id)}
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 ml-2 text-sm">Remove</button>
                </div>
              </div>
            ))}

            {/* ── ORDER TYPE ── */}
            <div className="bg-[#141414] border border-gray-800 rounded-xl shadow p-4">
              <h3 className="font-semibold text-gray-300 mb-3 uppercase text-sm tracking-widest">Order Type</h3>

              <div className="flex gap-4">
                <button onClick={() => setOrderType("delivery")}
                  className={`flex-1 py-2 rounded-lg font-semibold transition ${
                    orderType === "delivery" ? "bg-orange-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}>
                  Delivery
                </button>

                <button onClick={() => setOrderType("pickup")}
                  className={`flex-1 py-2 rounded-lg font-semibold transition ${
                    orderType === "pickup" ? "bg-orange-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}>
                  Pickup
                </button>

                <button
                  onClick={() => { if (isDineinOpen) setOrderType("dinein"); }}
                  disabled={!isDineinOpen}
                  className={`relative flex-1 py-2 rounded-lg font-semibold transition
                    ${!isDineinOpen
                      ? "bg-gray-900 border border-gray-700 text-gray-600 cursor-not-allowed"
                      : orderType === "dinein" ? "bg-orange-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                    }`}>
                  Dine-in
                  {!isDineinOpen && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-red-700 text-white text-[9px] font-black px-2 py-0.5 rounded-full tracking-widest whitespace-nowrap">
                      CLOSED
                    </span>
                  )}
                </button>
              </div>

              {!isDineinOpen && (
                <p className="mt-3 text-center text-xs text-amber-400 font-semibold tracking-wide">
                  🕐 {reopenLabel} — Delivery & Pickup are available 24/7
                </p>
              )}

              {/* ── Delivery fields ── */}
              {orderType === "delivery" && (
                <div className="mt-6 space-y-5">
                  <h4 className="font-semibold text-gray-300 mb-4">Choose Delivery Partner</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {deliveryPlatforms.map((p) => (
                      <button key={p.name} onClick={() => setPlatform(p.name)}
                        className={`flex items-center gap-3 px-4 py-2 rounded-xl border font-semibold transition-all ${
                          platform === p.name
                            ? "bg-orange-900/30 border-orange-500 text-white shadow-lg"
                            : "bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800"
                        }`}>
                        <img src={p.logo} alt={p.name} className="w-6 h-6 object-contain" />
                        <span>{p.name}</span>
                      </button>
                    ))}
                  </div>
                  <div className="space-y-3">
                    <input type="text"
                      placeholder="Delivery address (e.g. CBD Belapur, Navi Mumbai)"
                      value={userAddressState}
                      onChange={(e) => setUserAddressState(e.target.value)}
                      className={fieldCls} />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Delivery Date</label>
                        <DatePicker value={deliveryDate} onChange={setDeliveryDate} minDate={todayStr} />
                      </div>
                      <div>
                        <label className={labelCls}>Delivery Time</label>
                        <input type="text" placeholder="e.g. 30–45 minutes"
                          value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)}
                          className={fieldCls} />
                      </div>
                    </div>
                    <input type="text" placeholder="10-digit phone number"
                      value={userPhoneState} onChange={(e) => setUserPhoneState(e.target.value)}
                      className={fieldCls} />
                  </div>
                </div>
              )}

              {/* ── Pickup fields ── */}
              {orderType === "pickup" && (
                <div className="mt-5 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Pickup Date</label>
                      <DatePicker value={pickupDate} onChange={setPickupDate} minDate={todayStr} />
                    </div>
                    <div>
                      <label className={labelCls}>Pickup Time</label>
                      <input type="text" placeholder="e.g. 40–50 minutes"
                        value={pickupTime} onChange={(e) => setPickupTime(e.target.value)}
                        onBlur={handlePickupTimeBlur} className={fieldCls} />
                    </div>
                  </div>
                </div>
              )}

              {/* ── Dine-in fields ── */}
              {orderType === "dinein" && (
                <div className="mt-5 space-y-3">

                  <input type="text" placeholder="Your name"
                    value={guestName} onChange={(e) => setGuestName(e.target.value)}
                    className={fieldCls} />

                  <div>
                    <select value={tableNumber}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTableNumber(val);
                        setTableWarning(val && occupiedTables.includes(val)
                          ? "This table is currently occupied. Please choose another." : "");
                      }}
                      className={fieldCls}>
                      <option value="">— Select a table —</option>
                      {TABLE_IDS.map((t) => (
                        <option key={t} value={t}>
                          {t} {occupiedTables.includes(t) ? "🔴 Occupied" : "🟢 Available"}
                        </option>
                      ))}
                    </select>
                    {tableWarning && (
                      <p className="text-red-400 text-xs mt-1.5 font-semibold flex items-center gap-1">
                        ⚠️ {tableWarning}
                      </p>
                    )}
                  </div>

                  <select value={numberOfGuests}
                    onChange={(e) => setNumberOfGuests(e.target.value)}
                    className={fieldCls}>
                    <option value="">— Number of guests —</option>
                    {GUEST_OPTIONS.map((n) => (
                      <option key={n} value={n}>{n} {n === 1 ? "Guest" : "Guests"}</option>
                    ))}
                  </select>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Dining Date</label>
                      <DatePicker value={dineinDate} onChange={handleDineinDateChange} minDate={todayStr} />
                    </div>
                    <div>
                      <label className={labelCls}>Dining Time</label>
                      <TimePicker value={dineinTime} onChange={handleDineinTimeChange} error={isTimeInvalid} />
                    </div>
                  </div>

                  {/* Inline warning shown while time is invalid */}
                  {isTimeInvalid && (
                    <div className="flex items-center gap-2 bg-amber-900/20 border border-amber-700/40 rounded-lg px-3 py-2">
                      <span className="text-amber-400 text-sm">⚠</span>
                      <p className="text-amber-400 text-xs font-bold">
                        Selected time is outside business hours
                        <span className="text-amber-500/70 font-normal ml-1">(Mon–Fri: 7:00 AM – 10:30 PM · Sat–Sun: 8:00 AM – 11:00 PM)</span>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── TOTAL ── */}
            <div className="flex justify-between items-center px-2">
              <span className="text-xl font-semibold text-gray-300">Total:</span>
              <span className="text-2xl font-bold text-orange-500">{formatCurrency(totalPrice)}</span>
            </div>

            {/* ── ACTION BUTTONS ── */}
            <div className="flex flex-row gap-4 w-full">
              <button onClick={clearCart}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-red-900/20">
                Clear Cart
              </button>
              <button
                onClick={handleCheckout}
                disabled={(orderType === "dinein" && !!tableWarning) || !!isTimeInvalid}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${
                  (orderType === "dinein" && tableWarning) || isTimeInvalid
                    ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                    : "bg-yellow-400 hover:bg-yellow-500 text-black shadow-yellow-900/20"
                }`}>
                Proceed to Checkout
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;