const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Reservation = require("../models/Reservation");
const User = require("../models/User");

const { protect, admin } = require("../middleware/protect");

// ✅ FIX: Use existing controller instead of duplicating inline logic
const { getAllOrders } = require("../controllers/orderController");

// NOTE: All reservation routes (fetch, create, update status, delete, walk-in)
// are handled in reservationRoutes.js — /api/reservations/...
// Do NOT add reservation routes here to avoid duplication.

/**
 * @route   GET /api/admin/orders
 * @desc    Get all customer orders for Admin Orders page
 * @access  Private (Admin only)
 */
// ✅ FIX: Replaced inline DB logic with getAllOrders controller
// to avoid duplication and keep logic in one place
router.get("/orders", protect, admin, getAllOrders);

/**
 * @route   GET /api/admin/stats
 * @desc    Summary stats — total counts for orders, reservations, users
 * @access  Private (Admin only)
 */
router.get("/stats", protect, admin, async (req, res) => {
  try {
    const totalOrders       = await Order.countDocuments();
    const totalReservations = await Reservation.countDocuments();
    // ✅ FIX: Renamed totalUsers → totalCustomers for accuracy
    // (only counts role: "user" — admins excluded intentionally)
    const totalCustomers    = await User.countDocuments({ role: "user" });

    res.status(200).json({
      totalOrders,
      totalReservations,
      totalCustomers,
    });
  } catch (err) {
    // ✅ FIX: Added error detail to match all other routes
    res.status(500).json({ message: "Stats fetch failed", error: err.message });
  }
});

/**
 * @route   GET /api/admin/dashboard-stats
 * @desc    Real-time stats for Dashboard Cards (today's data)
 * @access  Private (Admin only)
 */
router.get("/dashboard-stats", protect, admin, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayOrders, pendingOrders, totalReservations, revenueData] =
      await Promise.all([
        Order.countDocuments({ createdAt: { $gte: today } }),
        Order.countDocuments({ status: "Pending" }),
        Reservation.countDocuments(),
        Order.aggregate([
          {
            // ✅ FIX: Only count Paid orders in revenue to avoid inflating
            // numbers with Pending/Unpaid orders
            $match: {
              createdAt: { $gte: today },
              paymentStatus: "Paid",
            },
          },
          { $group: { _id: null, total: { $sum: "$totalAmount" } } },
        ]),
      ]);

    res.status(200).json({
      todayOrders,
      pendingOrders,
      totalReservations,
      todayRevenue: revenueData[0]?.total || 0,
    });
  } catch (err) {
    console.error("❌ Dashboard Stats Error:", err.message);
    res.status(500).json({ message: "Failed to fetch dashboard stats", error: err.message });
  }
});

module.exports = router;