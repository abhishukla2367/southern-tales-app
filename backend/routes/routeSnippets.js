// ─────────────────────────────────────────────────────────────────────────────
// HOW TO BROADCAST TABLE UPDATES FROM YOUR EXISTING ROUTE FILES
//
// Add ONE line after any status/table change in:
//   - routes/orderRoutes.js
//   - routes/reservationRoutes.js
//   - routes/walkinRoutes.js
// ─────────────────────────────────────────────────────────────────────────────

const { broadcastTableUpdate } = require("./tableRoutes");

// ── Example: PATCH /orders/:id/status ────────────────────────────────────────
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: "Order not found" });

    // ✅ Add this one line — broadcasts to ALL connected clients instantly
    await broadcastTableUpdate(req.app.get("io"));

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Example: POST /orders/admin/place (new walkin order) ─────────────────────
router.post("/admin/place", async (req, res) => {
  try {
    const order = await Order.create({ ...req.body });

    // ✅ Broadcast after new order placed
    await broadcastTableUpdate(req.app.get("io"));

    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Example: PATCH /reservations/:id/status ──────────────────────────────────
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const reservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });

    // ✅ Broadcast
    await broadcastTableUpdate(req.app.get("io"));

    res.json({ success: true, reservation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Example: PATCH /reservations/:id/table ───────────────────────────────────
router.patch("/:id/table", async (req, res) => {
  try {
    const { tableNumber } = req.body;
    const reservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      { tableNumber },
      { new: true }
    );

    // ✅ Broadcast
    await broadcastTableUpdate(req.app.get("io"));

    res.json({ success: true, reservation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Example: POST /reservations/walkin (new walk-in) ─────────────────────────
router.post("/walkin", async (req, res) => {
  try {
    const reservation = await Reservation.create({ ...req.body, type: "walk-in" });

    // ✅ Broadcast
    await broadcastTableUpdate(req.app.get("io"));

    res.status(201).json(reservation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});