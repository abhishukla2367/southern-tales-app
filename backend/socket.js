// server/socket.js
const { Server } = require("socket.io");
const jwt        = require("jsonwebtoken");
let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || ["http://localhost:5173", "http://localhost:5174"],
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 300000,
    pingInterval: 60000,
    allowUpgrades: false,
  });

  // ── JWT Auth Middleware ────────────────────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      socket.user = null; // guest — customer order tracking still works
      return next();
    }
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch {
      socket.user = null; // invalid token — still allow as guest
      next();
    }
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id} | role: ${socket.user?.role || "guest"}`);

    // ── Admin room — JWT-verified admins only ─────────────────────────────
    socket.on("join_admin", () => {
      if (!socket.user || socket.user.role !== "admin") {
        console.warn(`⛔ Unauthorized join_admin from socket ${socket.id}`);
        socket.emit("admin_auth_error", { message: "Unauthorized" });
        return;
      }
      socket.join("admin_room");
      console.log(`🛡️  ${socket.user.name || socket.user.id} joined admin_room`);
    });

    socket.on("leave_admin", () => socket.leave("admin_room"));

    // ── Per-order rooms (customer tracking) ──────────────────────────────
    socket.on("join_order_room",  (id) => socket.join(`order_${id}`));
    socket.on("leave_order_room", (id) => socket.leave(`order_${id}`));

    // ── Per-reservation rooms ─────────────────────────────────────────────
    socket.on("join_reservation_room",  (id) => socket.join(`reservation_${id}`));
    socket.on("leave_reservation_room", (id) => socket.leave(`reservation_${id}`));

    // ── Tables room ───────────────────────────────────────────────────────
    socket.on("join_tables_room", () => {
      if (!socket.rooms.has("tables_room")) socket.join("tables_room");
    });

    socket.on("disconnect", (reason) => {
      console.log(`🔌 Disconnected: ${socket.id} | ${reason}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error("❌ Socket.io not initialized!");
  return io;
};

module.exports = { initSocket, getIO };