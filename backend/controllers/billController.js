const Order    = require("../models/Order");
const mongoose = require("mongoose");

const TAX_RATE = 0.05; // 5% GST

// GET /api/bill/:orderId — Generate bill for an order
const generateBill = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.orderId)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const order = await Order.findById(req.params.orderId)
      .populate("userId", "name email phone")
      .populate("reservationId", "date time guests");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const subtotal = order.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const tax   = parseFloat((subtotal * TAX_RATE).toFixed(2));
    const total = parseFloat((subtotal + tax).toFixed(2));

    const isInHouse = ["walkin", "dinein"].includes(order.orderType);

    const customer = {
      name:  order.userId?.name  || order.guestName || "Walk-in Guest",
      email: order.userId?.email || "—",
      phone: order.userId?.phone || order.deliveryInfo?.phone || "—",
    };

    const bill = {
      orderId:       order._id,
      orderType:     order.orderType,
      customer,
      items: order.items.map((item) => ({
        name:     item.name,
        unit:     item.unit || "pcs",
        quantity: item.quantity,
        price:    item.price,
        subtotal: parseFloat((item.price * item.quantity).toFixed(2)),
      })),
      subtotal:     parseFloat(subtotal.toFixed(2)),
      tax,
      total,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod || "Cash",
      status:        order.status,
      notes:         order.notes || "",
      createdAt:     order.createdAt,
    };

    if (order.orderType === "delivery") {
      bill.deliveryInfo = {
        address: order.deliveryInfo?.address || "—",
        phone:   order.deliveryInfo?.phone   || "—",
      };
    }

    if (isInHouse) {
      bill.tableNumber    = order.tableNumber    || "—";
      bill.numberOfGuests = order.numberOfGuests || "—";
    }

    if (order.orderType === "dinein" && order.reservationId) {
      bill.reservation = {
        id:     order.reservationId._id,
        date:   order.reservationId.date,
        time:   order.reservationId.time,
        guests: order.reservationId.guests,
      };
    }

    res.json(bill);
  } catch (err) {
    console.error("❌ generateBill Error:", err);
    res.status(500).json({ message: "Failed to generate bill", error: err.message });
  }
};

// PATCH /api/bill/:orderId/pay — Mark order as paid
const markAsPaid = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.orderId)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.paymentStatus === "Paid") {
      return res.status(400).json({ message: "Order is already marked as paid" });
    }

    // ✅ FIX: Guard against undefined req.body (sent without Content-Type: application/json)
    const { paymentMethod } = req.body ?? {};
    const validMethods = ["Cash", "UPI", "Card", "Online"];

    order.paymentStatus = "Paid";
    if (paymentMethod && validMethods.includes(paymentMethod)) {
      order.paymentMethod = paymentMethod;
    }
    await order.save();

    res.json({
      message:       "Order marked as paid",
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
    });
  } catch (err) {
    console.error("❌ markAsPaid Error:", err);
    res.status(500).json({ message: "Failed to update payment status", error: err.message });
  }
};

module.exports = { generateBill, markAsPaid };