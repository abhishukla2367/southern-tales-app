import React, { lazy, Suspense, useEffect, useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";

// ─── Always-loaded components (small, used on every page) ─────────────────
import Header from "./components/Header";
import Footer from "./components/Footer";
import CartDrawer from "./components/CartDrawer";
import ProtectedRoute from "./components/ProtectedRoute";
import { CartProvider } from "./context/CartContext";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import AllReviews from "./pages/AllReviews";

// ─── Lazy-loaded pages (code-split per route) ────────────────────────────
const Home              = lazy(() => import("./pages/Home"));
const Menu              = lazy(() => import("./pages/Menu"));
const OrderSummaryPage  = lazy(() => import("./pages/OrderSummaryPage"));
const AboutUs           = lazy(() => import("./pages/AboutUs"));
const ContactUs         = lazy(() => import("./pages/ContactUs"));

const Reservation       = lazy(() => import("./pages/Reservation"));
const Gallery           = lazy(() => import("./pages/Gallery"));
const Login             = lazy(() => import("./pages/Login"));
const Register          = lazy(() => import("./pages/Register"));
const OTPVerification   = lazy(() => import("./pages/otpVerification"));
const ForgotPassword    = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword     = lazy(() => import("./pages/ResetPassword"));
const Profile           = lazy(() => import("./pages/Profile"));

// ─── Admin pages (heavy — only loaded if admin visits) ───────────────────
const AdminDashboard    = lazy(() => import("./components/admin/AdminDashboard"));
const MenuList          = lazy(() => import("./components/admin/menu/MenuList"));
const OrdersList        = lazy(() => import("./components/orders/OrdersList"));
const ReservationsList  = lazy(() => import("./components/reservations/ReservationsList"));
const ReportsPage       = lazy(() => import("./pages/admin/ReportsPage"));
const LiveOrders        = lazy(() => import("./pages/Liveorders"));

// ─── Minimal full-page loading fallback ──────────────────────────────────
const PageLoader = () => (
  <div
    role="status"
    aria-label="Loading page"
    className="h-screen flex items-center justify-center bg-neutral-950"
  >
    <div className="w-10 h-10 rounded-full border-2 border-orange-500/20 border-t-orange-500 animate-spin" />
  </div>
);

/* ── Admin Route Protector ── */
const AdminRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        Loading...
      </div>
    );
  return user && user.role === "admin" ? children : <Navigate to="/login" />;
};

/* ── Scroll to top on every route change ── */
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
};

/* ── Main Layout ── */
const Layout = ({ children }) => {
  const { pathname } = useLocation();
  const isAdminRoute = pathname.startsWith("/admin");

  return (
    <div
      className={
        isAdminRoute ? "min-h-screen bg-gray-100" : "min-h-screen bg-black text-white"
      }
    >
      {!isAdminRoute && <Header />}
      <main className={isAdminRoute ? "" : "min-h-screen"}>{children}</main>
      {!isAdminRoute && <Footer />}
    </div>
  );
};

export default function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <CartProvider>
          <ScrollToTop />
          <Layout>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* PUBLIC ROUTES */}
                <Route path="/"          element={<Home />} />
                <Route path="/menu"      element={<Menu />} />
                <Route path="/about"     element={<AboutUs />} />
                <Route path="/contactus" element={<ContactUs />} />
                <Route path="/reviews" element={<AllReviews />} />
                <Route path="/gallery"   element={<Gallery />} />
                <Route path="/cart"      element={<CartDrawer />} />

                {/* AUTH ROUTES */}
                <Route path="/login"                 element={<Login />} />
                <Route path="/register"              element={<Register />} />
                <Route path="/verify-otp"            element={<OTPVerification />} />
                <Route path="/forgot-password"       element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />

                {/* PROTECTED USER ROUTES */}
                <Route path="/reservation"   element={<ProtectedRoute><Reservation /></ProtectedRoute>} />
                <Route path="/order-summary" element={<ProtectedRoute><OrderSummaryPage /></ProtectedRoute>} />
                <Route path="/profile"       element={<ProtectedRoute><Profile /></ProtectedRoute>} />

                {/* PROTECTED ADMIN ROUTES */}
                <Route path="/admin"              element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/admin/menu"         element={<AdminRoute><MenuList /></AdminRoute>} />
                <Route path="/admin/orders"       element={<AdminRoute><OrdersList /></AdminRoute>} />
                <Route path="/admin/reservations" element={<AdminRoute><ReservationsList /></AdminRoute>} />
                <Route path="/admin/reports"      element={<AdminRoute><ReportsPage /></AdminRoute>} />
                <Route path="/admin/live-orders"  element={<AdminRoute><LiveOrders /></AdminRoute>} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Suspense>
          </Layout>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}
