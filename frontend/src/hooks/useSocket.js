// client/src/hooks/useSocket.js
import { useEffect } from "react";
import socket from "../socket";

const useSocket = (eventHandlers = {}) => {

  useEffect(() => {
    // ── Register all event listeners ──────────────────
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    // ── Cleanup on unmount ────────────────────────────
    return () => {
      Object.entries(eventHandlers).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
    };
  }, []); // ✅ runs once — no re-registration on re-render

  return socket;
};

export default useSocket;