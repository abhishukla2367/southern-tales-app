import API from "../api/axiosConfig";

// --- PUBLIC: FETCH ALL ITEMS ---
export const getMenuItems = () => API.get("/menu");

// --- ADMIN: CREATE ITEM ---
// Axios auto-sets multipart/form-data + boundary when body is FormData
export const createMenuItem = (data) =>
  API.post("/menu", data, { headers: { "Content-Type": undefined } });

// --- ADMIN: UPDATE ITEM ---
// Same here — never manually set Content-Type for FormData uploads
export const updateMenuItem = (id, data) =>
  API.put(`/menu/${id}`, data, { headers: { "Content-Type": undefined } });

// --- ADMIN: DELETE ITEM ---
export const deleteMenuItem = (id) => API.delete(`/menu/${id}`);