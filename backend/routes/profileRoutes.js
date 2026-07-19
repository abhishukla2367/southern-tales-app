const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/User");
const Order = require("../models/Order");
const Reservation = require("../models/Reservation");
const { protect } = require("../middleware/protect");

/**
 * @route   GET /api/profile
 * @desc    Task 6: Fetch User Details, My Orders, and My Reservations
 * @access  Private
 */
router.get("/", protect, async (req, res) => {
  try {
    // 1. Get the current user ID (Checking both ._id and .id for safety)
    const userIdRaw = req.user._id || req.user.id;

    // STRICT FIX: Convert the string ID into a formal MongoDB ObjectId
    // This ensures the query matches the "userId" field in your database exactly.
    const currentUserId = new mongoose.Types.ObjectId(userIdRaw);

    // 2. Parallel fetching for high performance
    const [user, orders, reservations] = await Promise.all([
      // Fetch user and exclude password
      User.findById(currentUserId).select("-password"),

      // ✅ UPDATED: Searching the "userId" field (per your new Order Schema)
      Order.find({ userId: currentUserId }).sort({ createdAt: -1 }),

      // ✅ UPDATED: Searching the "userId" field for reservations to keep it consistent
      Reservation.find({ userId: currentUserId }).sort({ date: 1 })
    ]);

    // 3. Validation: If user doesn't exist
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // --- CRITICAL DEBUG LOGS ---
    // Check your VS Code terminal after you refresh the profile page
    console.log(`-------------------------------------------`);
    console.log(`DEBUG: Logged in User ID: ${currentUserId}`);
    console.log(`DEBUG: Orders found in DB: ${orders.length}`);
    console.log(`DEBUG: Reservations found: ${reservations.length}`);
    console.log(`-------------------------------------------`);

    // 4. Final Response
    res.status(200).json({ 
      success: true,
      user, 
      orders: orders || [], 
      reservations: reservations || [] 
    });

  } catch (err) {
    console.error("Profile Router Error:", err.message);
    res.status(500).json({ 
      success: false,
      message: "Could not load profile data.", 
      error: err.message 
    });
  }
});

/**
 * @route   PUT /api/profile/update
 * @desc    Update user details
 * @access  Private
 */
router.put("/update", protect, async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const userId = req.user._id || req.user.id;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { name, phone, address } },
      { new: true, runValidators: true } 
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      user: updatedUser
    });
  } catch (err) {
    console.error("Update Profile Error:", err.message);
    res.status(500).json({ success: false, message: "Update failed", error: err.message });
  }
});

module.exports = router;