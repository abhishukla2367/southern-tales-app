const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [
        {
            // ✅ FIX: Changed from ObjectId to Mixed to support both standard ObjectIds
            // and custom _id values (e.g. "a2", "a3") that exist in the menu collection
            productId: {
                type: mongoose.Schema.Types.Mixed,
                ref: 'Menu'
            },
            name:     { type: String, required: true },
            price:    { type: Number, required: true },
            quantity: { type: Number, required: true, default: 1 },
            image:    { type: String }
        }
    ],
    totalBill: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// ✅ FIX: Unique index ensures one cart per user — prevents duplicate cart bug
cartSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model('Cart', cartSchema);