const Order = require("../models/Order");

/**
 * @desc    Get all customer orders for Admin side
 * @route   GET /api/admin/orders
 * @access  Private (Admin Only)
 */
exports.getAdminOrders = async (req, res) => {
    try {
        // ✅ FIXED: populate "userId" to match Order.js schema
        const orders = await Order.find()
            .populate("userId", "name email")
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: orders });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to fetch orders" });
    }
};

