const Cart = require("../models/Cart");

/**
 * @desc    Requirement #8: Added items should appear in Cart
 * @route   GET /api/cart
 * @access  Private
 */
exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });

    // Return empty structure if no cart exists to prevent Frontend .map() crashes
    if (!cart) {
      return res.status(200).json({ items: [], totalBill: 0 });
    }

    res.status(200).json(cart);
  } catch (error) {
    console.error("Fetch Cart Error:", error.message);
    res.status(500).json({ message: "Error fetching cart data" });
  }
};

/**
 * @desc    Requirement #8: Store items in database
 * @route   POST /api/cart/add
 * @access  Private
 */
exports.addToCart = async (req, res) => {
  const { productId, name, price, quantity, image } = req.body;
  const userId = req.user.id;

  try {
    // ✅ FIX: Validate required fields before processing
    if (!productId || !name || !price || !quantity) {
      return res.status(400).json({
        message: "productId, name, price, and quantity are required",
      });
    }

    // ✅ FIX: Prevent zero or negative quantity
    if (Number(quantity) < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    let cart = await Cart.findOne({ userId });

    if (cart) {
      // Check if item already exists to update quantity instead of duplicating
      const itemIndex = cart.items.findIndex(
        (item) => item.productId.toString() === productId.toString()
      );

      if (itemIndex > -1) {
        // Update existing item quantity
        cart.items[itemIndex].quantity += Number(quantity);
      } else {
        // Add new item to existing cart array
        cart.items.push({
          productId,
          name,
          price: Number(price),
          quantity: Number(quantity),
          image,
        });
      }

      // Recalculate total bill
      cart.totalBill = cart.items.reduce(
        (acc, curr) => acc + curr.price * curr.quantity,
        0
      );

      await cart.save();
    } else {
      // Create new cart if none exists
      cart = await Cart.create({
        userId,
        items: [
          {
            productId,
            name,
            price: Number(price),
            quantity: Number(quantity),
            image,
          },
        ],
        totalBill: Number(price) * Number(quantity),
      });
    }

    res.status(201).json(cart);
  } catch (error) {
    console.error("Add to Cart Error:", error.message);
    res.status(500).json({
      message: "Failed to add item to cart",
      error: error.message,
    });
  }
};

/**
 * @desc    Requirement #8.2: User can delete cart items
 * @route   DELETE /api/cart/:productId
 * @access  Private
 *
 * ⚠️  ROUTER NOTE: In your router file, ensure /clear is registered
 *     BEFORE /:productId — otherwise Express treats "clear" as a productId
 *     and clearCart will never be reached:
 *
 *     router.delete("/clear", protect, clearCart);       ← must be first
 *     router.delete("/:productId", protect, removeFromCart);
 */
exports.removeFromCart = async (req, res) => {
  const { productId } = req.params;
  try {
    const cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // ✅ FIX: Check if the item actually exists in the cart before removing
    const originalLength = cart.items.length;
    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId.toString()
    );

    if (cart.items.length === originalLength) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    // Recalculate bill after removal
    cart.totalBill = cart.items.reduce(
      (acc, curr) => acc + curr.price * curr.quantity,
      0
    );

    await cart.save();
    return res.status(200).json(cart);
  } catch (error) {
    console.error("Remove Item Error:", error.message);
    res.status(500).json({ message: "Error deleting item from cart" });
  }
};

/**
 * @desc    Requirement #8.3: Remove items from cart on placing order
 * @route   DELETE /api/cart/clear
 * @access  Private
 *
 * ⚠️  ROUTER NOTE: This route MUST be registered before /:productId
 *     in your router file to avoid Express treating "clear" as a productId.
 */
exports.clearCart = async (req, res) => {
  try {
    await Cart.findOneAndDelete({ userId: req.user.id });
    res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
    });
  } catch (error) {
    console.error("Clear Cart Error:", error.message);
    res.status(500).json({ message: "Could not clear cart" });
  }
};