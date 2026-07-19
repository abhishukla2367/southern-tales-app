const Inventory = require('../models/Inventory');

// @desc    Get all inventory assets
// @route   GET /api/inventory-details
exports.getInventory = async (req, res) => {
    try {
        const items = await Inventory.find().sort({ createdAt: -1 });
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ message: "Accessing Database Failed", error: error.message });
    }
};

// @desc    Add new inventory asset
// @route   POST /api/inventory-details
exports.addInventoryItem = async (req, res) => {
    try {
        const newItem = await Inventory.create(req.body);
        res.status(201).json(newItem);
    } catch (error) {
        res.status(400).json({ message: "Commit to Database Failed", error: error.message });
    }
};

// @desc    Update inventory asset
// @route   PUT /api/inventory-details/:id
exports.updateInventoryItem = async (req, res) => {
    try {
        const item = await Inventory.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!item) return res.status(404).json({ message: "Item not found" });
        res.status(200).json(item);
    } catch (error) {
        res.status(400).json({ message: "Update Failed", error: error.message });
    }
};

// @desc    Delete inventory asset
// @route   DELETE /api/inventory-details/:id
exports.deleteInventoryItem = async (req, res) => {
    try {
        const item = await Inventory.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({ message: "Item not found" });
        res.status(200).json({ message: "Item deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Delete Failed", error: error.message });
    }
};

// @desc    Restock inventory asset (adds qty to currentStock)
// @route   PATCH /api/inventory-details/:id/restock
exports.restockInventoryItem = async (req, res) => {
    try {
        const { qty } = req.body;
        const parsed = parseInt(qty, 10);

        if (!parsed || parsed <= 0) {
            return res.status(400).json({ message: "qty must be a positive number" });
        }

        const item = await Inventory.findByIdAndUpdate(
            req.params.id,
            { $inc: { currentStock: parsed } },  // atomic increment — no race conditions
            { new: true }
        );

        if (!item) return res.status(404).json({ message: "Item not found" });
        res.status(200).json(item);
    } catch (error) {
        res.status(500).json({ message: "Restock Failed", error: error.message });
    }
};