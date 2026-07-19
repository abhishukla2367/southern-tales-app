const express = require("express");
const router = express.Router();
const { sendOTP, verifyOTP, resendOTP } = require("../controllers/otpController");

/**
 * @route   POST /api/otp/send-otp
 * @desc    Task 1: Send OTP to email during registration
 * @access  Public
 */
router.post("/send-otp", sendOTP);

/**
 * @route   POST /api/otp/verify-otp
 * @desc    Task 1: Verify OTP and create user account
 * @access  Public
 */
router.post("/verify-otp", verifyOTP);

/**
 * @route   POST /api/otp/resend-otp
 * @desc    Task 1: Resend OTP if expired or not received
 * @access  Public
 */
router.post("/resend-otp", resendOTP);

module.exports = router;