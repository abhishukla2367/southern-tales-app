const express  = require("express");
const router   = express.Router();
const { protect, admin } = require("../middleware/protect");
const {
  placeOrder,
  getMyOrders,
  getAllOrders,
  restockItem,
  updateOrderStatus,
  updateOrderPayment,
} = require("../controllers/orderController");

// Customer — place order (delivery / pickup)
router.post("/", protect, placeOrder);

// Admin — place walkin / dinein order directly
router.post("/admin/place", protect, admin, placeOrder);

// Customer — my orders
router.get("/my-orders", protect, getMyOrders);

// Admin — all orders (optional ?type=walkin filter)
router.get("/admin/all", protect, admin, getAllOrders);

// ✅ FIX: Moved inline handlers to controller (had deprecated { new: true })
// Admin — update order status
router.patch("/:id/status", protect, admin, updateOrderStatus);

// Admin — update payment status
router.patch("/:id/payment", protect, admin, updateOrderPayment);

module.exports = router;