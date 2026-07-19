const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },

    orderType: {
      type: String,
      default: "delivery",
      enum: ["delivery", "pickup", "walkin", "dinein"],
    },

    guestName:      { type: String },
    tableNumber:    { type: String },
    numberOfGuests: { type: Number, min: [1, "At least 1 guest required"] },

    reservationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reservation",
      required: false,
    },

    // ✅ New — scheduled date & time for future / pre-orders
    scheduledDate: { type: String, default: null }, // "YYYY-MM-DD"
    scheduledTime: { type: String, default: null }, // "HH:MM" or "30–45 minutes"

    items: [
      {
        productId: { type: mongoose.Schema.Types.Mixed, ref: "Menu" },
        name:      { type: String, required: true },
        quantity:  { type: Number, required: true, min: [1, "Quantity cannot be less than 1"] },
        price:     { type: Number, required: true, min: [0, "Price cannot be negative"] },
        unit:      { type: String },
      },
    ],

    deliveryInfo: {
      address: { type: String },
      phone:   { type: String },
    },

    totalAmount: {
      type: Number,
      required: true,
      min: [0, "Total amount cannot be negative"],
    },

    paymentMethod: {
      type: String,
      enum: ["Cash", "UPI", "Card", "Online"],
      default: "Cash",
    },

    paymentStatus: {
      type: String,
      default: "Unpaid",
      enum: ["Unpaid", "Paid", "Refunded"],
    },

    status: {
      type: String,
      default: "Pending",
      enum: {
        values: ["Pending", "Processing", "Preparing", "Delivered", "Completed", "Cancelled"],
        message: "{VALUE} is not a supported order status",
      },
    },

    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", OrderSchema);