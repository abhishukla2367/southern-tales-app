const mongoose = require("mongoose");

const ReservationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,          // ✅ optional — walk-ins have no account
    },
    customerName: {
      type: String,
      required: true
    },
    customerEmail: {
      type: String,
      required: false,          // ✅ FIXED: was required:true — breaks walk-in creation
      default: ""
    },
    phone: {
      type: String,
      default: ""
    },
    date: {
      type: Date,
      required: true
    },
    time: {
      type: String,
      required: true
    },
    guests: {
      type: Number,
      required: true,
      min: [1, "Must have at least 1 guest"]
    },
    tableNumber: {
      type: String,
      default: "TBD"
    },
    // ✅ FIX: Added "Confirmed" to VALID_STATUSES in reservationController.js as well
    // to match this default — without it, admin cannot update online reservations
    status: {
      type: String,
      default: "Confirmed",
      enum: ["Confirmed", "Waiting", "Seated", "Completed", "Cancelled"],
    },
    specialRequests: {
      type: String,
      trim: true,
      default: ""
    },
    type: {
      type: String,
      enum: ["online", "walk-in"],
      default: "online",        // ✅ walk-ins set this to "walk-in"
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Reservation", ReservationSchema);