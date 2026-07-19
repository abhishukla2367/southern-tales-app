const express = require("express");
const router  = express.Router();
const Order   = require("../models/Order");

// Safely require Reservation model — adjust path if different
let Reservation;
try { Reservation = require("../models/Reservation"); } catch { Reservation = null; }

// ── Helper: compute live table list ──────────────────────────────────────────
async function computeTables() {
  const FREE_STATUSES = ["Completed", "Cancelled"];

  // 1. Occupied by active Orders (walkin / dinein)
  const occupiedByOrders = await Order.distinct("tableNumber", {
    orderType:   { $in: ["walkin", "dinein"] },
    status:      { $nin: FREE_STATUSES },
    tableNumber: { $exists: true, $ne: null, $ne: "" },
  });

  // 2. Occupied by active Reservations (seated / waiting / confirmed etc.)
  let occupiedByReservations = [];
  if (Reservation) {
    occupiedByReservations = await Reservation.distinct("tableNumber", {
      status:      { $nin: FREE_STATUSES },
      tableNumber: { $exists: true, $ne: null, $ne: "" },
    });
  }

  // 3. Merge — a table is occupied if held by either
  const occupiedSet = new Set([...occupiedByOrders, ...occupiedByReservations]);

  // 4. Build T1–T20 list
  //    If you have a Table model with capacity, swap this block out for a DB query
  const tables = Array.from({ length: 20 }, (_, i) => {
    const tableNumber = `T${i + 1}`;
    return {
      tableNumber,
      capacity: null,          // set real capacity if you have a Tables model
      status: occupiedSet.has(tableNumber) ? "occupied" : "available",
    };
  });

  return tables;
}

// GET /api/tables — fetch live availability
router.get("/", async (req, res) => {
  try {
    const tables = await computeTables();
    res.status(200).json({ tables });
  } catch (err) {
    console.error("❌ Failed to fetch tables:", err.message);
    res.status(500).json({ message: "Failed to fetch tables", error: err.message });
  }
});

// ── Utility exported so orderRoutes & reservationRoutes can trigger a broadcast
// Usage in any route file:
//   const { broadcastTableUpdate } = require("./tableRoutes");
//   await broadcastTableUpdate(req.app.get("io"));
async function broadcastTableUpdate(io) {
  if (!io) return;
  try {
    const tables = await computeTables();
    io.emit("tables:updated", { tables });
    console.log("📡 tables:updated broadcast sent");
  } catch (err) {
    console.error("❌ broadcastTableUpdate error:", err.message);
  }
}

module.exports        = router;
module.exports.broadcastTableUpdate = broadcastTableUpdate;