import { useEffect, useState, useRef, useCallback } from "react";
import {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "../services/menuService";

const POLL_INTERVAL_MS = 5000;

// ✅ Extracts a clean plain string ID, stripping any ":suffix" artifacts
const getId = (item) => {
  const raw = item?._id ?? item?.id;
  if (!raw) return null;
  return raw.toString().split(":")[0];
};

// ✅ Ensures every item entering React state has a clean plain-string _id
const normalizeItem = (item) => {
  if (!item) return item;
  return { ...item, _id: getId(item) };
};

export default function useMenu() {
  const [menuItems, setMenuItems]   = useState([]);
  const [categories, setCategories] = useState(["All"]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(false);
  const timerRef                    = useRef(null);
  const deletingRef                 = useRef(false); // 🔒 blocks polling during delete

  // ─── Fetch & sync categories ──────────────────────────────────────────────
  const fetchMenu = useCallback(async (showLoader = false) => {
    // 🔒 Don't overwrite state while a delete is in progress
    if (deletingRef.current) return;

    try {
      if (showLoader) setLoading(true);
      const { data } = await getMenuItems();
      const menuData = Array.isArray(data) ? data : [];

      const normalized = menuData.map(normalizeItem);
      setMenuItems(normalized);
      setCategories(["All", ...new Set(normalized.map((i) => i.category).filter(Boolean))]);
      setError(false);
    } catch (err) {
      console.error("Failed to fetch menu:", err.message);
      setError(true);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  // ─── Polling ──────────────────────────────────────────────────────────────
  const startPolling = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      if (document.visibilityState === "visible") fetchMenu();
    }, POLL_INTERVAL_MS);
  }, [fetchMenu]);

  const stopPolling = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  useEffect(() => {
    fetchMenu(true);
    startPolling();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchMenu();
        startPolling();
      } else {
        stopPolling();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchMenu, startPolling, stopPolling]);

  // ─── Create or Update ─────────────────────────────────────────────────────
  const saveItem = async (formData, editItem) => {
    try {
      if (editItem) {
        const id = getId(editItem);
        console.log("✏️ Updating item ID:", id, "| raw _id:", editItem._id); // debug
        if (!id) throw new Error("Cannot update: item has no valid ID");

        const { data } = await updateMenuItem(id, formData);
        const clean    = normalizeItem(data);

        setMenuItems((prev) =>
          prev.map((i) => (getId(i) === id ? clean : i))
        );
      } else {
        const { data } = await createMenuItem(formData);
        const clean    = normalizeItem(data);

        setMenuItems((prev) => [clean, ...prev]);
        if (clean.category && !categories.includes(clean.category)) {
          setCategories((prev) => [...prev, clean.category]);
        }
      }
    } catch (err) {
      console.error("Save item error:", err);
      throw err;
    }
  };

  // ─── Delete ───────────────────────────────────────────────────────────────
  const removeItem = async (item) => {
    const id = getId(item);
    console.log("🗑️ Deleting item ID:", id, "| raw _id:", item._id); // debug

    if (!id) return alert("Cannot delete: item has no valid ID");

    // Confirm BEFORE touching state or locking polling
    const confirmed = window.confirm(`Delete "${item.name}"? This will also remove the image from the cloud.`);
    if (!confirmed) return;

    // ✅ OPTIMISTIC DELETE — remove from UI immediately, restore on failure
    deletingRef.current = true;
    setMenuItems((prev) => prev.filter((i) => getId(i) !== id));

    try {
      await deleteMenuItem(id);
    } catch (err) {
      console.error("Delete failed:", err);
      // ✅ Restore the item if the API call failed
      setMenuItems((prev) => [normalizeItem(item), ...prev]);
      alert("Failed to delete item.");
    } finally {
      deletingRef.current = false;
    }
  };

  // ─── Restock ──────────────────────────────────────────────────────────────
  const restockItem = async (item, quantity) => {
    const id = getId(item);
    if (!id) return alert("Cannot restock: item has no valid ID");

    try {
      // ✅ Read token from localStorage and attach as Bearer header
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/menu/${id}/restock`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ quantity }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { item: updated } = await res.json();

      setMenuItems((prev) =>
        prev.map((i) => (getId(i) === id ? normalizeItem(updated) : i))
      );
    } catch (err) {
      console.error("Restock failed:", err);
      alert("Failed to restock item.");
    }
  };

  return {
    menuItems,
    categories,
    loading,
    error,
    saveItem,
    removeItem,
    restockItem,
    refetch: fetchMenu,
  };
}