import React, { createContext, useContext, useState, useEffect } from "react";

const MenuContext = createContext();

export const MenuProvider = ({ children }) => {
  // Task #2: Start with an empty array; data will come from MongoDB
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch Menu from MongoDB Atlas on load
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "";
        const response = await fetch(`${apiUrl}/menu`);
        const data = await response.json();
        setMenuItems(data);
      } catch (error) {
        console.error("Error fetching menu:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

 // Admin Task: Update availability in MongoDB so it PERSISTS
  const toggleAvailability = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem("token");
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const response = await fetch(`${apiUrl}/menu/${id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ available: !currentStatus }),
      });

      if (response.ok) {
        setMenuItems((prev) =>
          prev.map((item) =>
            item._id === id ? { ...item, available: !currentStatus } : item
          )
        );
      }
    } catch (error) {
      alert("Failed to update status in Database");
    }
  };

  return (
    <MenuContext.Provider value={{ menuItems, toggleAvailability, loading }}>
      {children}
    </MenuContext.Provider>
  );
};

export const useMenu = () => useContext(MenuContext);
