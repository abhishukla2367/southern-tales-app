const express = require("express");
const router = express.Router();

const {
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
} = require("../controllers/cartController");

const { protect } = require("../middleware/protect");

/**
 * @route   GET /api/cart
 * @desc    Get current user's cart
 * @access  Private
 */
router.get("/", protect, getCart);

/**
 * @route   POST /api/cart/add
 * @desc    Add item to cart
 * @access  Private
 */
router.post("/add", protect, addToCart);

/**
 * @route   DELETE /api/cart/clear
 * @desc    Clear entire cart on order placement
 * @access  Private
 * ⚠️ Must be defined BEFORE /:productId to avoid Express treating "clear" as a productId
 */
router.delete("/clear", protect, clearCart);

/**
 * @route   DELETE /api/cart/item/:productId
 * @desc    Remove a single item from cart (matches frontend: DELETE /cart/item/${id})
 * @access  Private
 * ⚠️ Must be defined BEFORE /:productId to avoid route collision
 */
router.delete("/item/:productId", protect, removeFromCart);

/**
 * @route   DELETE /api/cart/:productId
 * @desc    Remove a single item from cart (legacy / direct route)
 * @access  Private
 */
router.delete("/:productId", protect, removeFromCart);

module.exports = router;