import { useState, useEffect, useCallback } from "react";
import API from "../api/axiosConfig";

const ENDPOINT = "/inventory-details";

export default function useInventory() {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await API.get(ENDPOINT);
      setInventoryItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch inventory:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Save (add or edit)
  const saveItem = async (formData, editItem = null) => {
    if (editItem) {
      const { data } = await API.put(`${ENDPOINT}/${editItem._id}`, formData);
      setInventoryItems(prev => prev.map(i => (i._id === data._id ? data : i)));
    } else {
      const { data } = await API.post(ENDPOINT, formData);
      setInventoryItems(prev => [...prev, data]);
    }
  };

  // Delete
  const removeItem = async (item) => {
    await API.delete(`${ENDPOINT}/${item._id}`);
    setInventoryItems(prev => prev.filter(i => i._id !== item._id));
  };

  // Restock — adds qty to currentStock
  const restockItem = async (item, qty) => {
    const { data } = await API.patch(`${ENDPOINT}/${item._id}/restock`, { qty });
    setInventoryItems(prev => prev.map(i => (i._id === data._id ? data : i)));
  };

  return {
    inventoryItems,
    loading,
    error,
    saveItem,
    removeItem,
    restockItem,
    fetchInventory,
  };
}