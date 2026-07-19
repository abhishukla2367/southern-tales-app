const express = require("express");
const router  = express.Router();
const Order   = require("./Order"); // adjust path if needed

router.get("/", async (req, res) => {
  try {
    // Find all table numbers currently occupied by active walkin/dinein orders
    const occupiedTables = await Order.distinct("tableNumber", {
      orderType: { $in: ["walkin", "dinein"] },
      status:    { $nin: ["Completed", "Cancelled"] },
      tableNumber: { $exists: true, $ne: null },
    });

    // Generate T1–T20 and mark each as available or occupied
    const tables = Array.from({ length: 20 }, (_, i) => {
      const tableNumber = `T${i + 1}`;
      return {
        tableNumber,
        status: occupiedTables.includes(tableNumber) ? "occupied" : "available",
      };
    });

    res.json({ tables });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch tables", error: err.message });
  }
});

module.exports = router;