import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

/**
 * Tasks 3-6 Protected Route Logic:
 * This component acts as a wrapper for any route that requires a login.
 */
const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, loading } = useContext(AuthContext); // State from Task 3
  const location = useLocation();

  // TASK 1 & 3: Prevent UI "flicker"
  // While the app is reading the token from MongoDB/LocalStorage, show a loader
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#1f1b16]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#f5c27a] border-t-transparent"></div>
        <p className="ml-3 text-[#f5c27a] font-semibold">Verifying Session...</p>
      </div>
    );
  }

  // TASK 4: Access Control
  // If not logged in, redirect to /login but SAVE the current location in 'state'
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // TASK 6: If logged in, grant access to Profile, Orders, or Reservations
  return children;
};

export default ProtectedRoute;
