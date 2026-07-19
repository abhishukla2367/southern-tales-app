const express = require("express");
const router  = express.Router();
const { generateBill, markAsPaid } = require("../controllers/billController");
const { protect, admin }           = require("../middleware/protect");

// All routes prefixed with /api/bill

/**
 * @route   GET /api/bill/:orderId
 * @desc    Generate bill for an order (includes tableNumber, guests, paymentMethod)
 * @access  Private (Admin only)
 */
router.get("/:orderId", protect, admin, generateBill);

/**
 * @route   PATCH /api/bill/:orderId/pay
 * @desc    Mark order as paid — optionally pass { paymentMethod: "Cash"|"UPI"|"Card"|"Online" }
 * @access  Private (Admin only)
 */
router.patch("/:orderId/pay", protect, admin, markAsPaid);

module.exports = router;