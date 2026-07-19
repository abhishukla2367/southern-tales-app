const express = require("express");
const router = express.Router();

// ✅ FIX: Import controller functions instead of duplicating logic inline
const {
  register,
  login,
  getProfile,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

// ✅ FIX: Use existing protect middleware instead of duplicating verifyToken here
const { protect } = require("../middleware/protect");

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post("/register", register);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post("/login", login);

/**
 * @route   GET /api/auth/profile
 * @desc    Get user profile with orders and reservations
 * @access  Private
 */
router.get("/profile", protect, getProfile);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset link to email
 * @access  Public
 */
router.post("/forgot-password", forgotPassword);

/**
 * @route   POST /api/auth/reset-password/:token
 * @desc    Validate token & reset password
 * @access  Public
 */
router.post("/reset-password/:token", resetPassword);

module.exports = router;