const express = require("express");
const router = express.Router();
const {
  getWalkInCount,
  incrementWalkIn,
  decrementWalkIn,
} = require("../controllers/walkinController");

// ✅ FIX: Added protect and admin middleware to secure all routes
const { protect, admin } = require("../middleware/protect");

// All routes prefixed with /api/walkin

/**
 * @route   GET /api/walkin
 * @desc    Get today's walk-in count
 * @access  Private (Admin only)
 */
router.get("/", protect, admin, getWalkInCount);

/**
 * @route   POST /api/walkin/increment
 * @desc    Add a walk-in member
 * @access  Private (Admin only)
 */
router.post("/increment", protect, admin, incrementWalkIn);

/**
 * @route   POST /api/walkin/decrement
 * @desc    Remove a walk-in member
 * @access  Private (Admin only)
 */
router.post("/decrement", protect, admin, decrementWalkIn);

module.exports = router;