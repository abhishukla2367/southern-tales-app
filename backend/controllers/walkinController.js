const WalkIn = require("../models/WalkIn");

// Helper: get today's date as "YYYY-MM-DD"
const today = () => new Date().toISOString().split("T")[0];

// GET /api/walkin — Get today's walk-in count
// @access  Private/Admin
const getWalkInCount = async (req, res) => {
  try {
    // ✅ FIX: Capture date once to avoid midnight edge case across two calls
    const date = today();
    const record = await WalkIn.findOne({ date });
    res.json({ count: record?.count || 0, date });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch walk-in count", error: err.message });
  }
};

// POST /api/walkin/increment — Add a walk-in member
// @access  Private/Admin
const incrementWalkIn = async (req, res) => {
  try {
    // ✅ FIX: Capture date once to avoid midnight edge case across two calls
    const date = today();

    // ✅ FIX: Use `new: true` instead of `returnDocument: 'after'` (Mongoose syntax)
    const record = await WalkIn.findOneAndUpdate(
      { date },
      { $inc: { count: 1 } },
      { upsert: true, new: true }
    );

    // ✅ FIX: Fallback for first-time upsert where record may be null
    res.json({ count: record?.count ?? 1, date });
  } catch (err) {
    res.status(500).json({ message: "Failed to increment walk-in count", error: err.message });
  }
};

// POST /api/walkin/decrement — Remove a walk-in member
// @access  Private/Admin
const decrementWalkIn = async (req, res) => {
  try {
    // ✅ FIX: Capture date once to avoid midnight edge case across two calls
    const date = today();

    const record = await WalkIn.findOne({ date });
    if (!record || record.count <= 0) {
      return res.status(400).json({ message: "Walk-in count is already 0" });
    }

    record.count -= 1;
    await record.save();

    res.json({ count: record.count, date });
  } catch (err) {
    res.status(500).json({ message: "Failed to decrement walk-in count", error: err.message });
  }
};

module.exports = { getWalkInCount, incrementWalkIn, decrementWalkIn };