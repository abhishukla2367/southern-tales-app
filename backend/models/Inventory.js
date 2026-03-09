const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
    itemName: {
        type: String,
        required: [true, 'Asset description is required'],
        trim: true
    },
    category: {
        type: String,
        required: [true, 'Classification is required'],
        trim: true
    },
    currentStock: {
        type: Number,
        required: [true, 'Volume level is required'],
        default: 0
    },
    minRequired: {
        type: Number,
        required: [true, 'Threshold is required'],
        default: 10
    },
    unit: {
        type: String,
        default: 'kg'
    }
}, {
    timestamps: true,
    collection: 'inventory-details' // Explicitly naming your collection
});

module.exports = mongoose.model('Inventory', InventorySchema);