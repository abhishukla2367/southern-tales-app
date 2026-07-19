const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middleware/protect");

const {
  createReservation,
  getMyReservations,
  getOccupiedTables,
  getAvailability,
  getAllAdminReservations,
  getWalkIns,
  createWalkIn,
  updateStatus,
  updateTable,
  deleteReservation,
} = require("../controllers/reservationController");

// USER SIDE: CREATE RESERVATION
router.post("/", protect, createReservation);

// USER SIDE: MY RESERVATIONS (Profile Page)
// ⚠️ Must be before /:id
router.get("/my-reservations", protect, getMyReservations);

// USER SIDE: OCCUPIED TABLES (Table Picker)
// ⚠️ Must be before /:id
router.get("/occupied-tables", protect, getOccupiedTables);

// USER SIDE: AVAILABILITY — booked slots + fully booked dates for a table
// Used by Reservation page step 2 to show date/time availability
// ⚠️ Must be before /:id
router.get("/availability", protect, getAvailability);

// ADMIN SIDE: ALL RESERVATIONS
// ⚠️ Must be before /:id
router.get("/admin/all", protect, admin, getAllAdminReservations);

// ADMIN SIDE: WALK-IN RESERVATIONS
// ⚠️ Must be before /:id
router.get("/walkin", protect, admin, getWalkIns);
router.post("/walkin", protect, admin, createWalkIn);

// ADMIN SIDE: UPDATE STATUS
router.patch("/:id/status", protect, admin, updateStatus);

// ADMIN SIDE: UPDATE TABLE
router.patch("/:id/table", protect, admin, updateTable);

// ADMIN SIDE: DELETE RESERVATION
router.delete("/:id", protect, admin, deleteReservation);

module.exports = router;