import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

const createSocket = () =>
  io(SOCKET_URL, {
    withCredentials: true,
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    pingTimeout: 300000,
    pingInterval: 60000,
    transports: ["websocket"],
    upgrade: false,
    // ── Send JWT on every connection/reconnection ─────────────────────────
    auth: (cb) => cb({ token: localStorage.getItem("token") || "" }),
  });

const socket = globalThis._socket ?? createSocket();
if (!globalThis._socket) globalThis._socket = socket;

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    socket.disconnect();
    delete globalThis._socket;
  });
}

socket.on("connect",           () => console.log("🔌 Socket connected:", socket.id));
socket.on("disconnect",        (r) => console.warn("⚠️  Disconnected:", r));
socket.on("connect_error",     (e) => console.warn("❌ Socket error:", e.message));
socket.on("reconnect",         (n) => console.log(`🔄 Reconnected after ${n} attempt(s)`));
socket.on("reconnect_attempt", (n) => console.log(`🔁 Attempt #${n}`));

// Warn if backend rejects admin auth
socket.on("admin_auth_error",  (e) => console.error("🔒 Admin auth rejected:", e.message));

// ⚠️ Do NOT auto-connect here.
// Call socket.connect() manually AFTER saving the token in your login handler.
// Call socket.disconnect() in your logout handler.

export default socket;