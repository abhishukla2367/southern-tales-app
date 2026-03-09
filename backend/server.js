// server/server.js
require("dotenv").config();
const express    = require("express");
const mongoose   = require("mongoose");
const cors       = require("cors");
const dns        = require("node:dns");
const http       = require("http");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const app    = express();
const server = http.createServer(app);

// ── Socket.io setup ──────────────────────────────────────────────────────────
const { initSocket } = require("./socket");         // ✅ import from socket.js
const io = initSocket(server);                       // ✅ initialize with server
app.set("io", io);                                   // ✅ accessible via req.app.get("io")

// --- 1. MIDDLEWARE CONFIGURATION ---

app.use(cors({
  origin: process.env.CLIENT_URL || ["http://localhost:5173", "http://localhost:5174"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json({ limit: "10mb" }));

// ✅ Skip urlencoded parsing for multipart/form-data requests (let multer handle those)
app.use((req, res, next) => {
  if (req.is("multipart/form-data")) return next();
  express.urlencoded({ extended: true })(req, res, next);
});

app.use((req, res, next) => {
  console.log(`📩 [${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// --- 2. DATABASE CONNECTION ---

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Atlas: Connection Established Successfully."))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1);
  });

// --- 3. ROUTES ---

const otpRoutes         = require("./routes/otpRoutes");
const authRoutes        = require("./routes/authRoutes");
const cartRoutes        = require("./routes/cartRoutes");
const menuRoutes        = require("./routes/menuRoutes");
const orderRoutes       = require("./routes/orderRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const adminRoutes       = require("./routes/adminRoutes");
const reportRoutes      = require("./routes/reportRoutes");
const walkinRoutes      = require("./routes/walkinRoutes");
const billRoutes        = require("./routes/billRoutes");
const tableRoutes       = require("./routes/tableRoutes");
const inventoryRoutes   = require("./routes/inventoryRoutes");

app.use("/api/otp",              otpRoutes);
app.use("/api/auth",             authRoutes);
app.use("/api/cart",             cartRoutes);
app.use("/api/menu",             menuRoutes);
app.use("/api/orders",           orderRoutes);
app.use("/api/reservations",     reservationRoutes);
app.use("/api/admin",            adminRoutes);
app.use("/api/reports",          reportRoutes);
app.use("/api/walkin",           walkinRoutes);
app.use("/api/bill",             billRoutes);
app.use("/api/tables",           tableRoutes);
app.use("/api/inventory-details", inventoryRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "Active",
    database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
  });
});

// --- 4. GLOBAL ERROR HANDLING ---

app.use((err, req, res, next) => {
  console.error("🔥 Server Error Stack:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  });
});

// --- 5. START SERVER ---

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server successfully deployed on port ${PORT}`);
  console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🔌 Socket.io: ready`);
});

// Graceful Error Handling for EADDRINUSE
server.on("error", (e) => {
  if (e.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} is already in use.`);
    console.log("💡 Try these steps:");
    console.log(`   1. Run: 'npx kill-port ${PORT}' in your terminal.`);
    console.log(`   2. Change the PORT in your .env file to something else (e.g., 5001).`);
    process.exit(1);
  } else {
    console.error("🔥 Server Error:", e);
  }
});