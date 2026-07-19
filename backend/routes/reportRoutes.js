const express = require("express");
const router  = express.Router();
const { getReport, getTopItems } = require("../controllers/reportController");
const { protect, admin }         = require("../middleware/protect");

/**
 * @route   GET /api/reports/top-items?limit=7
 * @desc    All-time top N selling items — scans all menu items across all orders
 * @access  Private (Admin only)
 *
 * ⚠️  Must be declared BEFORE /:type so Express does not treat
 *     "top-items" as the :type param and return a 400.
 */
router.get("/top-items", protect, admin, getTopItems);

/**
 * @route   GET /api/reports/weekly
 * @route   GET /api/reports/monthly
 * @route   GET /api/reports/annual
 * @desc    Generate period reports for admin dashboard
 * @access  Private (Admin only)
 */
router.get("/:type", protect, admin, getReport);

module.exports = router;