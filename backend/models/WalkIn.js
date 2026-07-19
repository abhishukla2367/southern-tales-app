const mongoose = require("mongoose");

// Tracks daily walk-in count — one document per date
const WalkInSchema = new mongoose.Schema(
  {
    date: {
      type: String, // Format: "YYYY-MM-DD"
      required: true,
      unique: true,
    },
    count: {
      type: Number,
      default: 0,
      min: [0, "Walk-in count cannot be negative"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WalkIn", WalkInSchema);