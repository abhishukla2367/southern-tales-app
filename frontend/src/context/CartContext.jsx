import React, { createContext, useContext, useState, useEffect } from "react";
import API from "../api/axiosConfig";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [orderType, setOrderType] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("token")) {
      fetchCart();
    }

    // auth:logout fires BEFORE token is removed — so API call still works
    const onLogout = async () => {
      try {
        await API.delete("/cart/clear"); // clears server cart while token still valid
      } catch (e) {
        console.error("Failed to clear server cart on logout:", e.message);
      }
      setCartItems([]);
      setOrderType("");
    };

    const onLogin = () => {
      fetchCart();
    };

    window.addEventListener("auth:logout", onLogout);
    window.addEventListener("auth:login", onLogin);
    return () => {
      window.removeEventListener("auth:logout", onLogout);
      window.removeEventListener("auth:login", onLogin);
    };
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/cart");
      setCartItems(data.items || []);
    } catch (error) {
      console.error("Failed to fetch cart:", error.message);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (newItem) => {
    const productId = newItem._id || newItem.id;
    if (!productId) {
      console.error("addToCart: item is missing an id field", newItem);
      alert("Could not add item — missing product ID. Please refresh and try again.");
      return;
    }
    try {
      const { data } = await API.post("/cart/add", {
        productId,
        name: newItem.name,
        price: newItem.price,
        quantity: 1,
        image: newItem.image,
      });
      setCartItems(data.items || []);
    } catch (error) {
      console.error("Failed to add to cart:", error.message);
      const serverMsg = error.response?.data?.message || error.response?.data?.error;
      if (serverMsg) console.error("Server said:", serverMsg);
      alert("Failed to add item to cart. Please try again.");
    }
  };

  const updateQuantity = async (id, newQuantity) => {
    if (newQuantity < 1) return removeFromCart(id);
    try {
      setCartItems((prev) =>
        prev.map((item) =>
          item.productId === id || item._id === id
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    } catch (error) {
      console.error("Failed to update quantity:", error.message);
    }
  };

  const removeFromCart = async (id) => {
    const previousItems = cartItems;
    setCartItems((prev) =>
      prev.filter((item) => item.productId !== id && item._id !== id)
    );
    try {
      const { data } = await API.delete(`/cart/item/${id}`);
      setCartItems(data.items || []);
    } catch (error) {
      console.error("Failed to remove item:", error.message);
      setCartItems(previousItems);
      alert("Failed to remove item. Please try again.");
    }
  };

  const clearCart = async () => {
    try {
      await API.delete("/cart/clear");
      setCartItems([]);
      setOrderType("");
    } catch (error) {
      console.error("Failed to clear cart:", error.message);
      setCartItems([]);
      setOrderType("");
    }
  };

  const getCartTotal = () =>
    cartItems.reduce((total, item) => total + Number(item.price) * item.quantity, 0);

  const getCartCount = () =>
    cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        getCartTotal,
        getCartCount,
        orderType,
        setOrderType,
        isPlacingOrder,
        loading,
        fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);