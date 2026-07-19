const Order       = require("../models/Order");
const Reservation = require("../models/Reservation");
const Menu        = require("../models/Menu");

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const REVENUE_STATUSES = ["Delivered", "Completed"];
const ACTIVE_STATUSES  = ["Pending", "Processing", "Preparing", "Delivered", "Completed"];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const getDateRanges = (type) => {
  const now       = new Date();
  const startDate = new Date(now);

  if      (type === "weekly")  startDate.setDate(now.getDate() - 7);
  else if (type === "monthly") startDate.setMonth(now.getMonth() - 1);
  else if (type === "annual")  startDate.setFullYear(now.getFullYear() - 1);

  startDate.setHours(0, 0, 0, 0);

  const prevEnd   = new Date(startDate.getTime() - 1);
  const prevStart = new Date(prevEnd);

  if      (type === "weekly")  prevStart.setDate(prevEnd.getDate() - 7);
  else if (type === "monthly") prevStart.setMonth(prevEnd.getMonth() - 1);
  else if (type === "annual")  prevStart.setFullYear(prevEnd.getFullYear() - 1);

  prevStart.setHours(0, 0, 0, 0);

  return { startDate, endDate: now, prevStart, prevEnd };
};

const formatPeriodLabel = (id, type) => {
  if (type === "weekly") {
    const m = String(id.month).padStart(2, "0");
    const d = String(id.day).padStart(2, "0");
    return {
      sortKey: id.year * 10000 + id.month * 100 + id.day,
      label:   `${d}/${m}/${id.year}`,
    };
  }
  if (type === "monthly") {
    return {
      sortKey: id.year * 100 + id.week,
      label:   `W${id.week}, ${id.year}`,
    };
  }
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return {
    sortKey: id.year * 100 + id.month,
    label:   `${months[id.month - 1]} ${id.year}`,
  };
};

const getGroupBy = (type) => {
  if (type === "weekly") {
    return {
      year:  { $year:       "$createdAt" },
      month: { $month:      "$createdAt" },
      day:   { $dayOfMonth: "$createdAt" },
    };
  }
  if (type === "monthly") {
    return {
      year: { $isoWeekYear: "$createdAt" },
      week: { $isoWeek:     "$createdAt" },
    };
  }
  return {
    year:  { $year:  "$createdAt" },
    month: { $month: "$createdAt" },
  };
};

const calcTrend = (curr, prev) => {
  if (prev == null || prev === 0) return null;
  return Math.round(((curr - prev) / prev) * 100);
};

const normalizeName = (name = "") =>
  name
    .toLowerCase()
    .replace(/\s*\(\d+\s*pcs?\)\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();

const buildMenuMap = (menuDocs) => {
  const map = {};
  menuDocs.forEach((m) => {
    const meta = {
      image:       m.image       || null,
      category:    m.category    || null,
      description: m.description || null,
      unit:        m.unit        || "pcs",
    };
    map[m.name.toLowerCase().trim()] = meta;
    map[normalizeName(m.name)]        = meta;
  });
  return map;
};

const lookupMenu = (menuMap, rawName = "") => {
  const exact      = rawName.toLowerCase().trim();
  const normalized = normalizeName(rawName);
  return menuMap[exact] || menuMap[normalized] || {};
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Generate period report  (weekly / monthly / annual)
// @route   GET /api/reports/:type
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────────────────────────
exports.getReport = async (req, res) => {
  try {
    const { type } = req.params;

    if (!["weekly", "monthly", "annual"].includes(type)) {
      return res.status(400).json({ success: false, message: "Invalid report type. Use weekly | monthly | annual." });
    }

    const { startDate, endDate, prevStart, prevEnd } = getDateRanges(type);
    const groupBy = getGroupBy(type);

    const revenueFilter     = { createdAt: { $gte: startDate, $lte: endDate  }, status: { $in: REVENUE_STATUSES } };
    const prevRevenueFilter = { createdAt: { $gte: prevStart, $lte: prevEnd  }, status: { $in: REVENUE_STATUSES } };
    const activeFilter      = { createdAt: { $gte: startDate, $lte: endDate  }, status: { $in: ACTIVE_STATUSES  } };
    const prevActiveFilter  = { createdAt: { $gte: prevStart, $lte: prevEnd  }, status: { $in: ACTIVE_STATUSES  } };

    // ── 1. Stats ─────────────────────────────────────────────────────────────
    const [
      revenueStats, orderCountStats,
      prevRevenueStats, prevOrderCountStats,
      reservationStats, prevReservationStats,
      // ✅ NEW: per-orderType breakdown for current period
      orderTypeStats,
    ] = await Promise.all([
      Order.aggregate([
        { $match: revenueFilter },
        { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" }, avgOrderValue: { $avg: "$totalAmount" } } },
      ]),
      Order.aggregate([
        { $match: activeFilter },
        { $group: { _id: null, totalOrders: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: prevRevenueFilter },
        { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" }, avgOrderValue: { $avg: "$totalAmount" } } },
      ]),
      Order.aggregate([
        { $match: prevActiveFilter },
        { $group: { _id: null, totalOrders: { $sum: 1 } } },
      ]),
      Reservation.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, totalReservations: { $sum: 1 } } },
      ]),
      Reservation.aggregate([
        { $match: { createdAt: { $gte: prevStart, $lte: prevEnd } } },
        { $group: { _id: null, totalReservations: { $sum: 1 } } },
      ]),
      // ✅ NEW: group orders by orderType (delivery / pickup / walkin / dinein)
      Order.aggregate([
        { $match: activeFilter },
        {
          $group: {
            _id:     "$orderType",
            count:   { $sum: 1 },
            revenue: {
              $sum: {
                $cond: [{ $in: ["$status", REVENUE_STATUSES] }, "$totalAmount", 0],
              },
            },
          },
        },
      ]),
    ]);

    // ── 2. Top 7 Selling Items ────────────────────────────────────────────────
    const [topItemsRaw, allMenuItems] = await Promise.all([
      Order.aggregate([
        { $match: revenueFilter },
        { $unwind: "$items" },
        {
          $group: {
            _id:          "$items.name",
            totalQty:     { $sum: "$items.quantity" },
            totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
          },
        },
        { $sort: { totalQty: -1, totalRevenue: -1, _id: 1 } },
        { $limit: 7 },
      ]),
      Menu.find({}).select("name image category description unit").lean(),
    ]);

    const menuMap  = buildMenuMap(allMenuItems);
    const topItems = topItemsRaw.map((item) => {
      const meta = lookupMenu(menuMap, item._id || "");
      return {
        name:         item._id,
        totalQty:     item.totalQty,
        totalRevenue: Math.round(item.totalRevenue),
        image:        meta.image        || null,
        category:     meta.category     || null,
        description:  meta.description  || null,
        unit:         meta.unit         || "pcs",
      };
    });

    // ── 3. Period Breakdown ───────────────────────────────────────────────────
    const [orderBreakdown, reservationBreakdown] = await Promise.all([
      Order.aggregate([
        { $match: activeFilter },
        {
          $group: {
            _id:     groupBy,
            orders:  { $sum: 1 },
            revenue: {
              $sum: {
                $cond: [
                  { $in: ["$status", REVENUE_STATUSES] },
                  "$totalAmount",
                  0,
                ],
              },
            },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.week": 1 } },
      ]),
      Reservation.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: groupBy, reservations: { $sum: 1 } } },
      ]),
    ]);

    const breakdownMap = {};

    orderBreakdown.forEach((row) => {
      const { sortKey, label } = formatPeriodLabel(row._id, type);
      breakdownMap[sortKey] = {
        period:       label,
        sortKey,
        orders:       row.orders,
        revenue:      Math.round(row.revenue),
        reservations: 0,
      };
    });

    reservationBreakdown.forEach((row) => {
      const { sortKey, label } = formatPeriodLabel(row._id, type);
      if (breakdownMap[sortKey]) {
        breakdownMap[sortKey].reservations = row.reservations;
      } else {
        breakdownMap[sortKey] = { period: label, sortKey, orders: 0, revenue: 0, reservations: row.reservations };
      }
    });

    const breakdown = Object.values(breakdownMap)
      .sort((a, b) => a.sortKey - b.sortKey)
      .map(({ sortKey: _sk, ...rest }) => rest);

    // ── 4. Build ordersByType map ─────────────────────────────────────────────
    // ✅ NEW: { delivery: { count, revenue }, pickup: {...}, walkin: {...}, dinein: {...} }
    const ORDER_TYPES   = ["delivery", "pickup", "walkin", "dinein"];
    const ordersByType  = Object.fromEntries(
      ORDER_TYPES.map((t) => [t, { count: 0, revenue: 0 }])
    );
    orderTypeStats.forEach(({ _id, count, revenue }) => {
      if (_id && ordersByType[_id] !== undefined) {
        ordersByType[_id] = { count, revenue: Math.round(revenue) };
      }
    });

    // ── 5. Response ───────────────────────────────────────────────────────────
    const curr    = revenueStats[0]         || {};
    const currCnt = orderCountStats[0]      || {};
    const prev    = prevRevenueStats[0]     || {};
    const prevCnt = prevOrderCountStats[0]  || {};
    const currRes = reservationStats[0]     || {};
    const prevRes = prevReservationStats[0] || {};

    return res.status(200).json({
      success:           true,
      type,
      totalOrders:       currCnt.totalOrders              || 0,
      totalRevenue:      Math.round(curr.totalRevenue     || 0),
      avgOrderValue:     Math.round(curr.avgOrderValue    || 0),
      totalReservations: currRes.totalReservations        || 0,
      revenueTrend:      calcTrend(curr.totalRevenue      || 0, prev.totalRevenue      || 0),
      ordersTrend:       calcTrend(currCnt.totalOrders    || 0, prevCnt.totalOrders    || 0),
      reservationsTrend: calcTrend(currRes.totalReservations || 0, prevRes.totalReservations || 0),
      avgTrend:          calcTrend(curr.avgOrderValue     || 0, prev.avgOrderValue     || 0),
      // ✅ NEW: per-type breakdown for charts/cards
      ordersByType,
      topItems,
      breakdown,
    });

  } catch (err) {
    console.error("❌ Report Error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to generate report." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    All-time top N selling items across every completed order
// @route   GET /api/reports/top-items?limit=7
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────────────────────────
exports.getTopItems = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 7, 20);

    const [topItemsRaw, allMenuItems, totalMenuItems] = await Promise.all([
      Order.aggregate([
        { $match: { status: { $in: REVENUE_STATUSES } } },
        { $unwind: "$items" },
        {
          $group: {
            _id:          "$items.name",
            totalQty:     { $sum: "$items.quantity" },
            totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
            latestPrice:  { $last: "$items.price" },
          },
        },
        { $sort: { totalQty: -1, totalRevenue: -1, _id: 1 } },
        { $limit: limit },
      ]),
      Menu.find({}).select("name image category description unit").lean(),
      Menu.countDocuments(),
    ]);

    const menuMap = buildMenuMap(allMenuItems);

    const results = topItemsRaw.map((item, idx) => {
      const meta = lookupMenu(menuMap, item._id || "");
      return {
        rank:         idx + 1,
        name:         item._id,
        image:        meta.image        || null,
        category:     meta.category     || null,
        description:  meta.description  || null,
        unit:         meta.unit         || "pcs",
        totalQty:     item.totalQty,
        totalRevenue: Math.round(item.totalRevenue),
        latestPrice:  Math.round(item.latestPrice || 0),
        totalMenuItems,
      };
    });

    return res.status(200).json(results);

  } catch (err) {
    console.error("❌ getTopItems Error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to fetch top items.", error: err.message });
  }
};