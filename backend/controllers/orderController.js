const Order    = require('../models/Order');
const Cart     = require('../models/Cart');
const mongoose = require('mongoose');
const { getIO } = require('../socket');

// ─── Helper: Decrement stock atomically ──────────────────────────────────────
const decrementStock = async (items) => {
  const collection = mongoose.connection.db.collection("menu");
  await Promise.all(
    items.map(({ productId, quantity }) =>
      collection.updateOne(
        { _id: productId },
        [
          { $set: { stock: { $max: [0, { $subtract: ["$stock", quantity] }] } } },
          { $set: { available: { $gt: ["$stock", 0] } } },
        ]
      )
    )
  );
};

// ─── Helper: Validate stock for all items ────────────────────────────────────
const validateStock = async (items) => {
  const collection = mongoose.connection.db.collection("menu");
  const ids        = items.map((i) => i.productId);
  const menuDocs   = await collection.find({ _id: { $in: ids } }).toArray();
  const stockMap   = Object.fromEntries(menuDocs.map((m) => [m._id.toString(), m]));

  for (const { productId, quantity, name } of items) {
    const menuItem = stockMap[productId?.toString()];
    if (!menuItem) throw { status: 404, message: `Menu item not found: ${name || productId}` };
    if (menuItem.stock < quantity) throw {
      status: 400,
      message: `"${menuItem.name}" only has ${menuItem.stock} unit(s) left.`,
      itemId: productId,
      availableStock: menuItem.stock,
    };
  }
};

/**
 * @desc    Place order — supports delivery, pickup, walkin, dinein
 * @route   POST /api/orders
 * @access  Private (delivery/pickup/dinein) | Admin (walkin/dinein)
 */
exports.placeOrder = async (req, res) => {
  try {
    const {
      items, totalAmount, orderType = "delivery",
      deliveryInfo, guestName, tableNumber,
      numberOfGuests, reservationId, paymentMethod, notes,
      scheduledDate, scheduledTime,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0)
      return res.status(400).json({ success: false, message: "Order must contain at least one item." });

    if (!totalAmount || Number(totalAmount) <= 0)
      return res.status(400).json({ success: false, message: "Invalid total amount." });

    if (orderType === "delivery") {
      if (!deliveryInfo?.address?.trim() || !deliveryInfo?.phone?.trim())
        return res.status(400).json({ success: false, message: "Delivery address and phone are required." });
    }

    if (orderType === "walkin" || orderType === "dinein") {
      if (!guestName?.trim())
        return res.status(400).json({ success: false, message: "Guest name is required." });
      if (!tableNumber?.trim())
        return res.status(400).json({ success: false, message: "Table number is required." });
      if (!numberOfGuests || numberOfGuests < 1)
        return res.status(400).json({ success: false, message: "Number of guests is required." });
    }

    await validateStock(items);
    await decrementStock(items);

    const userId = req.user?.id || req.user?._id;

    const orderData = {
      orderType,
      items,
      totalAmount,
      status:        "Pending",
      paymentStatus: "Unpaid",
      paymentMethod: paymentMethod || "Cash",
      notes,
      scheduledDate: scheduledDate || null,
      scheduledTime: scheduledTime || null,
    };

    if (userId) {
      orderData.userId = new mongoose.Types.ObjectId(userId);
    }

    if (orderType === "delivery" || orderType === "pickup") {
      orderData.deliveryInfo = deliveryInfo;
    }

    if (orderType === "walkin" || orderType === "dinein") {
      orderData.guestName      = guestName;
      orderData.tableNumber    = tableNumber;
      orderData.numberOfGuests = numberOfGuests;
      if (orderType === "dinein" && reservationId) {
        orderData.reservationId = reservationId;
      }
    }

    const newOrder = await Order.create(orderData);

    // Populate for socket broadcast
    const populated = await Order.findById(newOrder._id)
      .populate("userId", "name email phone");

    // ── Emit new order to all admin dashboards ──
    try {
      getIO().to("admin_room").emit("new_order", populated);
    } catch (e) {
      console.warn("Socket emit skipped:", e.message);
    }

    // Clear cart for logged-in customers
    if (userId) {
      await Cart.findOneAndDelete({ userId: orderData.userId });
    }

    return res.status(201).json({
      success: true,
      message: "Order placed successfully!",
      order:   newOrder,
    });

  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message, ...err });
    console.error("❌ Order Placement Error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * @desc    Get orders for logged-in user
 * @route   GET /api/orders/my-orders
 * @access  Private
 */
exports.getMyOrders = async (req, res) => {
  try {
    if (!req.user?.id && !req.user?._id)
      return res.status(401).json({ success: false, message: "Not authorized" });

    const currentId = req.user.id || req.user._id;
    const objectId  = new mongoose.Types.ObjectId(currentId);

    const orders = await Order.find({
      userId: { $in: [objectId, currentId.toString()] },
    }).sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: orders.length, orders });
  } catch (err) {
    console.error("❌ getMyOrders Error:", err.message);
    return res.status(500).json({ success: false, error: "Failed to fetch your orders." });
  }
};

/**
 * @desc    Get all orders (Admin)
 * @route   GET /api/orders/admin/all
 * @access  Private — Admin only
 */
exports.getAllOrders = async (req, res) => {
  try {
    const { type } = req.query;
    const filter   = type ? { orderType: type } : {};

    const orders = await Order.find(filter)
      .populate("userId", "name email phone")
      .populate("reservationId", "date time guests")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: orders.length, orders });
  } catch (err) {
    console.error("❌ Admin Fetch Error:", err.message);
    return res.status(500).json({ success: false, error: "Failed to fetch orders." });
  }
};

/**
 * @desc    Update order status (Admin)
 * @route   PATCH /api/orders/:id/status
 * @access  Private — Admin only
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id }     = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: "Invalid order ID." });

    const validStatuses = ["Pending", "Processing", "Preparing", "Delivered", "Completed", "Cancelled"];
    if (!status || !validStatuses.includes(status))
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });

    const order = await Order.findById(id);
    if (!order)
      return res.status(404).json({ success: false, message: "Order not found." });

    order.status = status;
    await order.save();

    // ── Emit status update to admin room + customer's order room ──
    try {
      const io = getIO();
      io.to("admin_room").emit("order_status_updated", { orderId: id, status });
      io.to(`order_${id}`).emit("order_status_updated", { orderId: id, status });
    } catch (e) {
      console.warn("Socket emit skipped:", e.message);
    }

    return res.status(200).json({ success: true, message: "Order status updated.", order });
  } catch (err) {
    console.error("❌ updateOrderStatus Error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * @desc    Update order payment status (Admin)
 * @route   PATCH /api/orders/:id/payment-status
 * @access  Private — Admin only
 */
exports.updateOrderPayment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: "Invalid order ID." });

    const { paymentStatus, paymentMethod } = req.body;
    const validPaymentStatuses = ["Unpaid", "Paid", "Refunded"];

    if (!paymentStatus || !validPaymentStatuses.includes(paymentStatus))
      return res.status(400).json({ success: false, message: "Invalid payment status." });

    const order = await Order.findById(id);
    if (!order)
      return res.status(404).json({ success: false, message: "Order not found." });

    order.paymentStatus = paymentStatus;
    if (paymentMethod) order.paymentMethod = paymentMethod;
    await order.save();

    // ── Emit payment update to admin room ──
    try {
      getIO().to("admin_room").emit("order_payment_updated", { orderId: id, paymentStatus });
    } catch (e) {
      console.warn("Socket emit skipped:", e.message);
    }

    return res.status(200).json({ success: true, order });
  } catch (err) {
    console.error("❌ updateOrderPayment Error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * @desc    Restock a menu item (Admin)
 * @route   PATCH /api/menu/:id/restock
 * @access  Private — Admin only
 */
exports.restockItem = async (req, res) => {
  const { id }       = req.params;
  const { quantity } = req.body;

  if (!quantity || Number(quantity) <= 0)
    return res.status(400).json({ success: false, message: "Quantity must be a positive number." });

  try {
    const collection = mongoose.connection.db.collection("menu");

    const objectId = mongoose.Types.ObjectId.isValid(id)
      ? new mongoose.Types.ObjectId(id)
      : null;

    const result = await collection.findOneAndUpdate(
      { _id: { $in: objectId ? [objectId, id] : [id] } },
      [
        { $set: { stock: { $add: ["$stock", Number(quantity)] } } },
        { $set: { available: { $gt: ["$stock", 0] } } },
      ],
      { returnDocument: "after" }
    );

    if (!result)
      return res.status(404).json({ success: false, message: "Menu item not found." });

    return res.status(200).json({
      success: true,
      message: `Restocked "${result.name}" by ${quantity} units.`,
      item:    result,
    });
  } catch (err) {
    console.error("❌ Restock Error:", err.message);
    return res.status(500).json({ success: false, error: "Failed to restock item." });
  }
};