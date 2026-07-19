const Reservation = require('../models/Reservation');
const mongoose    = require('mongoose');
const { getIO }   = require('../socket');

const VALID_STATUSES = ["Confirmed", "Waiting", "Seated", "Completed", "Cancelled"];

/**
 * @desc    Create a new table reservation (Customer side)
 * @route   POST /api/reservations
 * @access  Private (Logged-in users only)
 */
exports.createReservation = async (req, res) => {
    try {
        const { date, time, guests, tableNumber, specialRequests, customerName, customerEmail } = req.body;

        if (!date || !time || !guests)
            return res.status(400).json({ error: "Date, time, and guest count are required." });

        if (!customerName || !customerEmail)
            return res.status(400).json({ error: "Customer name and email are required." });

        if (tableNumber && tableNumber !== "TBD") {
            const occupied = await Reservation.findOne({
                tableNumber,
                status: { $in: ["Waiting", "Seated"] },
            });
            if (occupied)
                return res.status(400).json({ error: "This table is occupied, please choose another table." });
        }

        const newReservation = await Reservation.create({
            userId:           req.user.id,
            customerName,
            customerEmail,
            date,
            time,
            guests,
            tableNumber:      tableNumber || "TBD",
            specialRequests,
            type:             "online",
        });

        // ── Emit new reservation to admin room ──
        try {
            getIO().to("admin_room").emit("new_reservation", newReservation);
        } catch (e) {
            console.warn("Socket emit skipped:", e.message);
        }

        res.status(201).json({ success: true, message: "Table reserved successfully!", data: newReservation });

    } catch (err) {
        console.error("Create Reservation Error:", err.message);
        res.status(500).json({ error: "Server could not process reservation", details: err.message });
    }
};

/**
 * @desc    Get currently occupied table numbers
 * @route   GET /api/reservations/occupied-tables
 * @access  Private
 */
exports.getOccupiedTables = async (req, res) => {
    try {
        const occupied = await Reservation.find(
            { status: { $in: ["Waiting", "Seated"] }, tableNumber: { $ne: "TBD" } },
            { tableNumber: 1, _id: 0 }
        );
        const occupiedTables = [...new Set(occupied.map((r) => r.tableNumber))];
        res.status(200).json({ success: true, occupiedTables });
    } catch (err) {
        console.error("Occupied Tables Error:", err.message);
        res.status(500).json({ error: "Failed to fetch occupied tables" });
    }
};

/**
 * @desc    Get reservations for the logged-in user's profile
 * @route   GET /api/reservations/my-reservations
 * @access  Private
 */
exports.getMyReservations = async (req, res) => {
    try {
        const reservations = await Reservation.find({ userId: req.user.id }).sort({ date: -1 });
        res.status(200).json({ success: true, count: reservations.length, reservations });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch your reservations" });
    }
};

/**
 * @desc    Get all reservations for the Admin dashboard
 * @route   GET /api/reservations/admin/all
 * @access  Private/Admin
 */
exports.getAllAdminReservations = async (req, res) => {
    try {
        const reservations = await Reservation.find()
            .populate('userId', 'name email')
            .sort({ date: -1 });
        res.status(200).json({ success: true, data: reservations });
    } catch (err) {
        console.error("Admin Fetch Error:", err.message);
        res.status(500).json({ error: "Admin fetch failed", details: err.message });
    }
};

/**
 * @desc    Get all walk-in reservations
 * @route   GET /api/reservations/walkin
 * @access  Private/Admin
 */
exports.getWalkIns = async (req, res) => {
    try {
        const walkIns = await Reservation.find({ type: "walk-in" }).sort({ createdAt: -1 });
        res.status(200).json(walkIns);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch walk-ins" });
    }
};

/**
 * @desc    Create a walk-in reservation
 * @route   POST /api/reservations/walkin
 * @access  Private/Admin
 */
exports.createWalkIn = async (req, res) => {
    try {
        const { customerName, phone, guests, tableNumber, date, time, status, specialRequests } = req.body;

        if (!customerName || !guests || !date || !time)
            return res.status(400).json({ error: "Name, guests, date and time are required." });

        if (tableNumber && tableNumber !== "TBD") {
            const occupied = await Reservation.findOne({
                tableNumber,
                status: { $in: ["Waiting", "Seated"] },
            });
            if (occupied)
                return res.status(400).json({ error: "This table is occupied, please choose another table number." });
        }

        const reservation = await Reservation.create({
            customerName,
            customerEmail:   "",
            phone:           phone || "",
            guests,
            tableNumber:     tableNumber || "TBD",
            date,
            time,
            status:          status || "Waiting",
            specialRequests: specialRequests || "",
            type:            "walk-in",
        });

        // ── Emit new walk-in to admin room ──
        try {
            getIO().to("admin_room").emit("new_reservation", reservation);
        } catch (e) {
            console.warn("Socket emit skipped:", e.message);
        }

        res.status(201).json({ success: true, data: reservation });

    } catch (err) {
        console.error("Create Walk-in Error:", err.message);
        res.status(500).json({ error: "Failed to create walk-in", details: err.message });
    }
};

/**
 * @desc    Update reservation status
 * @route   PATCH /api/reservations/:id/status
 * @access  Private/Admin
 */
exports.updateStatus = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id))
            return res.status(400).json({ error: "Invalid reservation ID" });

        if (!req.body.status || !VALID_STATUSES.includes(req.body.status))
            return res.status(400).json({ error: `Status must be one of: ${VALID_STATUSES.join(", ")}` });

        const reservation = await Reservation.findById(req.params.id);
        if (!reservation)
            return res.status(404).json({ error: "Reservation not found." });

        if (reservation.status === "Completed")
            return res.status(403).json({ error: "Completed reservations cannot be modified." });

        reservation.status = req.body.status;
        await reservation.save();

        // ── Emit status update to admin room + per-reservation room ──
        try {
            const io = getIO();
            io.to("admin_room").emit("reservation_status_updated", {
                reservationId: req.params.id,
                status: req.body.status,
            });
            io.to(`reservation_${req.params.id}`).emit("reservation_status_updated", {
                reservationId: req.params.id,
                status: req.body.status,
            });
        } catch (e) {
            console.warn("Socket emit skipped:", e.message);
        }

        res.status(200).json({ success: true, data: reservation });

    } catch (err) {
        console.error("Update Status Error:", err.message);
        res.status(500).json({ error: "Failed to update status", details: err.message });
    }
};

/**
 * @desc    Update reservation table number
 * @route   PATCH /api/reservations/:id/table
 * @access  Private/Admin
 */
exports.updateTable = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id))
            return res.status(400).json({ error: "Invalid reservation ID" });

        const reservation = await Reservation.findById(req.params.id);
        if (!reservation)
            return res.status(404).json({ error: "Reservation not found." });

        if (reservation.status === "Completed")
            return res.status(403).json({ error: "Completed reservations cannot be modified." });

        const newTable = req.body.tableNumber || "TBD";
        if (newTable !== "TBD" && newTable !== reservation.tableNumber) {
            const occupied = await Reservation.findOne({
                _id:         { $ne: req.params.id },
                tableNumber: newTable,
                status:      { $in: ["Waiting", "Seated"] },
            });
            if (occupied)
                return res.status(400).json({ error: "This table is occupied, please choose another table." });
        }

        reservation.tableNumber = newTable;
        await reservation.save();

        // ── Emit table update to admin room ──
        try {
            getIO().to("admin_room").emit("reservation_table_updated", {
                reservationId: req.params.id,
                tableNumber: newTable,
            });
        } catch (e) {
            console.warn("Socket emit skipped:", e.message);
        }

        res.status(200).json({ success: true, data: reservation });

    } catch (err) {
        console.error("Update Table Error:", err.message);
        res.status(500).json({ error: "Failed to update table", details: err.message });
    }
};

/**
 * @desc    Delete a reservation
 * @route   DELETE /api/reservations/:id
 * @access  Private/Admin
 */
exports.deleteReservation = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id))
            return res.status(400).json({ error: "Invalid reservation ID" });

        const reservation = await Reservation.findById(req.params.id);
        if (!reservation)
            return res.status(404).json({ error: "Reservation not found." });

        if (reservation.status === "Completed")
            return res.status(403).json({ error: "Completed reservations cannot be deleted." });

        await reservation.deleteOne();

        // ── Emit deletion to admin room ──
        try {
            getIO().to("admin_room").emit("reservation_deleted", { reservationId: req.params.id });
        } catch (e) {
            console.warn("Socket emit skipped:", e.message);
        }

        res.status(200).json({ success: true, message: "Reservation deleted successfully." });

    } catch (err) {
        console.error("Delete Reservation Error:", err.message);
        res.status(500).json({ error: "Failed to delete reservation", details: err.message });
    }
};

/**
 * @desc    Get booked slots + fully booked dates for a specific table
 * @route   GET /api/reservations/availability?tableNumber=T4
 * @access  Private
 */
exports.getAvailability = async (req, res) => {
  try {
    const { tableNumber } = req.query;
    if (!tableNumber)
      return res.status(400).json({ message: "tableNumber query param is required" });

    const reservations = await Reservation.find({
      tableNumber,
      status: { $nin: ["Cancelled"] },
    }).select("date time");

    const bookedSlots = reservations
      .filter((r) => r.date && r.time)
      .map((r) => ({
        date: typeof r.date === "string" ? r.date.slice(0, 10) : r.date.toISOString().slice(0, 10),
        time: r.time,
      }));

    const dateCounts = {};
    bookedSlots.forEach(({ date }) => { dateCounts[date] = (dateCounts[date] || 0) + 1; });
    const fullyBookedDates = Object.entries(dateCounts)
      .filter(([, count]) => count >= 3)
      .map(([date]) => date);

    res.json({ bookedSlots, fullyBookedDates });
  } catch (err) {
    console.error("getAvailability error:", err);
    res.status(500).json({ message: "Server error" });
  }
};