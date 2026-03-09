// src/hooks/useTableAvailability.js
// ─────────────────────────────────────────────────────────────────────────────
// Shared hook — use this in EVERY component that needs live table status:
//   ReservationsList, WalkInModal, OrdersList, WalkInOrderModal, etc.
//
// Returns the same `tables` array to all consumers, kept in sync via:
//   1. Socket.io "tables:updated" event (instant, server-pushed)
//   2. 60-second polling fallback (safety net if socket drops)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from "react";
import API    from "../api/axiosConfig";
import socket from "../socketclient";

export function useTableAvailability() {
  const [tables, setTables]   = useState([]);
  const [loading, setLoading] = useState(true);
  const mountedRef            = useRef(true);

  // ── HTTP fetch ──────────────────────────────────────────────────────────────
  const fetchTables = useCallback(async () => {
    try {
      const { data } = await API.get("/tables");
      if (mountedRef.current) setTables(data.tables || data || []);
    } catch {
      // silent — socket will keep it fresh
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  // ── Initial fetch + 60 s polling fallback ───────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    fetchTables();
    const interval = setInterval(fetchTables, 60_000);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchTables]);

  // ── Socket.io — instant push from server ────────────────────────────────────
  useEffect(() => {
    const handler = ({ tables: incoming }) => {
      if (mountedRef.current && Array.isArray(incoming)) {
        setTables(incoming);
        setLoading(false);
      }
    };
    socket.on("tables:updated", handler);
    return () => socket.off("tables:updated", handler);
  }, []);

  // ── Optimistic helpers (for immediate local feedback before server confirms) ─

  /** Swap old → available, new → occupied immediately */
  const swapTableStatus = useCallback((oldTableNumber, newTableNumber) => {
    setTables((prev) =>
      prev.map((t) => {
        if (t.tableNumber === oldTableNumber) return { ...t, status: "available" };
        if (t.tableNumber === newTableNumber) return { ...t, status: "occupied"  };
        return t;
      })
    );
  }, []);

  /** Mark one table occupied immediately */
  const markOccupied = useCallback((tableNumber) => {
    if (!tableNumber) return;
    setTables((prev) =>
      prev.map((t) => t.tableNumber === tableNumber ? { ...t, status: "occupied" } : t)
    );
  }, []);

  /** Mark one table available immediately */
  const markAvailable = useCallback((tableNumber) => {
    if (!tableNumber) return;
    setTables((prev) =>
      prev.map((t) => t.tableNumber === tableNumber ? { ...t, status: "available" } : t)
    );
  }, []);

  return {
    tables,
    loading,
    refresh: fetchTables,
    swapTableStatus,
    markOccupied,
    markAvailable,
  };
}