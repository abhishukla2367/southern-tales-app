const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema({
  // ✅ FIX: Explicitly declare _id as String so Mongoose stops casting
  //         values like "a3" or "b4" to ObjectId (which throws a CastError).
  _id: {
    type: String,
  },

  name: {
    type:     String,
    required: [true, "Dish name is required"],
    trim:     true,
  },
  description: {
    type:    String,
    default: "",
  },
  price: {
    type:     Number,
    required: [true, "Price is required"],
    min:      [0, "Price cannot be negative"],
  },
  category: {
    type:     String,
    required: true,
  },
  image: {
    type:    String,
    default: "",
  },
  cloudinaryId: {
    type:    String,
    default: "",
  },
  veg: {
    type:    Boolean,
    default: true,
  },
  vegan: {
    type:    Boolean,
    default: false,
  },
  dietary: {
    type:    Boolean,
    default: false,
  },

  // ─── Quantity Unit ─────────────────────────────────────────────────────────
  unit: {
    type:    String,
    default: "pcs",
    enum:    {
      values:  ["pcs", "plate", "glass", "bowl", "cup"],
      message: "{VALUE} is not a supported unit. Use: pcs | plate | glass | bowl | cup",
    },
  },

  // ─── Stock Management ──────────────────────────────────────────────────────
  stock: {
    type:     Number,
    required: [true, "Stock quantity is required"],
    default:  0,
    min:      [0, "Stock cannot be negative"],
  },

  // ─── Availability ──────────────────────────────────────────────────────────
  // Auto-managed by hooks — do not set this manually.
  available: {
    type:    Boolean,
    default: false,
  },
}, {
  timestamps:  true,
  collection:  "menu",
});

// ─── Pre-save Hook ────────────────────────────────────────────────────────────
// ✅ Use async (no next parameter) — required for Mongoose 7+
// Only used on new item creation — available is derived from stock.
// For updates, available is computed explicitly in the route handler.
menuSchema.pre("save", async function () {
  this.available = this.stock > 0;
});

module.exports = mongoose.model("Menu", menuSchema);