import axios from "axios";
import socket from "../socketclient";

const API = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

/**
 * REQUEST INTERCEPTOR
 * - Attaches JWT for protected routes
 * - Removes Content-Type for FormData so browser sets multipart/form-data + boundary automatically
 */
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * RESPONSE INTERCEPTOR
 * Handles session expiration and automatic logout.
 * Dispatches a CustomEvent with reason "session_expired" so CartContext
 * (and other listeners) can skip API calls that would fail with 401.
 */
let isLoggingOut = false; // prevent duplicate logout triggers

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401 && !isLoggingOut) {
      const token = localStorage.getItem("token");
      if (!token) return Promise.reject(error); // no token — ignore silently

      isLoggingOut = true;
      console.warn("Session expired. Logging out...");

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      socket.disconnect();

      // Notify all listeners (e.g. CartContext) that this is a session expiry logout
      window.dispatchEvent(
        new CustomEvent("auth:logout", { detail: { reason: "session_expired" } })
      );

      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }

      // Reset flag after a short delay to allow future logouts
      setTimeout(() => { isLoggingOut = false; }, 2000);
    }
    return Promise.reject(error);
  }
);

export default API;