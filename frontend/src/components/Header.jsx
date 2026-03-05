import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ShoppingCart, Phone, Menu, X,
  UserCircle, LogOut, Clock, MapPin, PhoneCall,
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

// ─── CLOUDINARY LOGO CONFIG ──────────────────────────────────────────────────
const LOGO_URL = "https://res.cloudinary.com/db2vju4mv/image/upload/f_auto,q_auto,w_200/v1772560792/southern-tales-logo_knrfgm.jpg";

const PHONE = "+919876543210";
const dial = () => window.open(`tel:${PHONE}`, "_self");

// ─── Single source of truth for all nav links ──────────────────────────────
const NAV_LINKS = [
  ["Home", "/"],
  ["Menu", "/menu"],
  ["About Us", "/about"],
  ["Gallery", "/gallery"],
  ["Reservation", "/reservation"],
  ["Contact", "/contactus"],
];

// ─── Call Modal ────────────────────────────────────────────────────────────────
function CallModal({ onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Contact information"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#1f1b16] border border-[#f5c27a]/20 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        {/* Top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-[#f5c27a] to-[#e3922a]" aria-hidden="true" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#f5c27a]/10 border border-[#f5c27a]/30 flex items-center justify-center" aria-hidden="true">
              <PhoneCall size={18} className="text-[#f5c27a]" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f5c27a]/70">Contact Us</p>
              <h2 className="text-lg font-black text-white tracking-tight">Get in Touch</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close contact modal"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="mx-6 h-px bg-white/5" aria-hidden="true" />

        {/* Content */}
        <div className="px-6 py-5 space-y-4">
          <button
            onClick={dial}
            aria-label={`Call us at ${PHONE}`}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#f5c27a]/10 border border-[#f5c27a]/20 hover:bg-[#f5c27a]/20 transition-all group text-left"
          >
            <div className="w-10 h-10 rounded-full bg-[#f5c27a] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform" aria-hidden="true">
              <Phone size={18} className="text-black" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#f5c27a]/60">
                Reservations &amp; Enquiries
              </p>
              <p className="text-lg font-black text-white tracking-wide">{PHONE}</p>
            </div>
          </button>

          <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0" aria-hidden="true">
              <Clock size={16} className="text-[#f5c27a]" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Hours of Operation</p>
              <p className="text-sm font-bold text-white">Mon – Fri &nbsp; 11:00 AM – 10:00 PM</p>
              <p className="text-sm font-bold text-white">Sat – Sun &nbsp; 10:00 AM – 11:00 PM</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0" aria-hidden="true">
              <MapPin size={16} className="text-[#f5c27a]" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Location</p>
              <p className="text-sm font-bold text-white">Southern Tales Restaurant</p>
              <p className="text-xs text-gray-400 mt-0.5">CBD Belapur, Navi Mumbai, Maharashtra</p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={dial}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#f5c27a] hover:bg-[#e3b26a] text-black font-black text-sm transition-all active:scale-95"
          >
            <Phone size={16} aria-hidden="true" />
            Call Now
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);

  const { isLoggedIn, user, logout } = useContext(AuthContext);
  const { cartItems } = useCart();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const goTo = (path) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <>
      {showCallModal && <CallModal onClose={() => setShowCallModal(false)} />}

      <header className="fixed top-0 left-0 w-full z-50">
        {/* ── Main bar ── */}
        <div className="relative flex items-center justify-between px-6 lg:px-12 py-5 bg-[#1f1b16] shadow-lg">

          {/* LOGO SECTION */}
          <Link to="/" className="flex items-center gap-3 no-underline" aria-label="Southern Tales – Home">
            <img
              src={LOGO_URL}
              alt="Southern Tales Restaurant logo"
              width={56}
              height={56}
              loading="eager"
              fetchpriority="high"
              className="w-14 h-14 rounded-full object-cover ring-2 ring-[#f5c27a]/30"
            />
            <div className="flex flex-col leading-tight">
              <span className="text-2xl font-black text-white tracking-tight">
                Southern <span className="text-[#f5c27a]">Tales</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f5c27a]/70">
                Authentic Southern Cuisine
              </span>
            </div>
          </Link>

          {/* DESKTOP NAV — absolutely centered */}
          <nav className="hidden lg:flex items-center gap-7 absolute left-1/2 -translate-x-1/2" aria-label="Main navigation">
            {NAV_LINKS.map(([label, path]) => (
              <Link
                key={path}
                to={path}
                aria-current={pathname === path ? "page" : undefined}
                className={`font-medium transition-colors duration-200 no-underline relative group ${
                  pathname === path
                    ? "text-[#f5c27a] font-bold"
                    : "text-gray-300 hover:text-[#f5c27a]"
                }`}
              >
                {label}
                <span
                  className={`absolute -bottom-1 left-0 h-px bg-[#f5c27a] transition-all duration-300 ${
                    pathname === path ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                  aria-hidden="true"
                />
              </Link>
            ))}
          </nav>

          {/* DESKTOP ACTIONS */}
          <div className="hidden lg:flex items-center gap-4 text-white">
            <button
              onClick={() => setShowCallModal(true)}
              aria-label="Open contact information"
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/30 bg-transparent text-white text-sm font-semibold hover:border-white/70 hover:text-white/80 transition-all duration-200"
            >
              <Phone size={15} aria-hidden="true" />
              <span>Call Now</span>
            </button>

            <button
              onClick={() => goTo("/cart")}
              aria-label={`Shopping cart – ${cartCount} item${cartCount !== 1 ? "s" : ""}`}
              className="relative group p-2 rounded-full hover:bg-white/5 transition-colors"
            >
              <ShoppingCart size={22} className="group-hover:text-[#f5c27a] transition-colors" aria-hidden="true" />
              <span
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#f5c27a] text-black text-[10px] font-black flex items-center justify-center"
                aria-hidden="true"
              >
                {cartCount}
              </span>
            </button>

            <div className="flex items-center gap-3 border-l border-white/10 pl-4">
              {!isLoggedIn ? (
                <>
                  <button
                    onClick={() => goTo("/login")}
                    className="px-5 py-2 rounded-full border border-white/30 bg-transparent text-white text-sm font-bold hover:border-white/70 hover:text-white/80 transition-all duration-200"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => goTo("/register")}
                    className="px-5 py-2 rounded-full bg-[#f5c27a] text-black hover:bg-[#e3b26a] transition-all text-sm font-bold shadow-md"
                  >
                    Register
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => goTo("/profile")}
                    className="flex items-center gap-2 text-white hover:text-[#f5c27a] transition-colors"
                    aria-label={`View profile for ${user?.name || "user"}`}
                  >
                    <UserCircle size={32} className="text-[#f5c27a]" aria-hidden="true" />
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-5 py-2 rounded-full border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-all text-sm font-semibold"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>

          {/* MOBILE — Cart + Hamburger */}
          <div className="lg:hidden flex items-center gap-3">
            <button
              onClick={() => goTo("/cart")}
              aria-label={`Shopping cart – ${cartCount} item${cartCount !== 1 ? "s" : ""}`}
              className="relative p-2 text-white"
            >
              <ShoppingCart size={22} aria-hidden="true" />
              <span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#f5c27a] text-black text-[9px] font-black flex items-center justify-center"
                aria-hidden="true"
              >
                {cartCount}
              </span>
            </button>

            <button
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
              className="text-white hover:text-[#f5c27a] p-1 transition-colors"
            >
              <div className={`transition-transform duration-200 ${isOpen ? "rotate-90" : "rotate-0"}`} aria-hidden="true">
                {isOpen ? <X size={26} /> : <Menu size={26} />}
              </div>
            </button>
          </div>
        </div>

        {/* ── MOBILE MENU ── */}
        <nav
          id="mobile-menu"
          aria-label="Mobile navigation"
          aria-hidden={!isOpen}
          className={`fixed inset-0 top-[80px] z-40 lg:hidden bg-[#1a1208]/98 backdrop-blur-md transition-transform duration-300 ease-in-out overflow-y-auto ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="px-6 py-8 space-y-1">
            {NAV_LINKS.map(([label, path]) => (
              <Link
                key={path}
                to={path}
                tabIndex={isOpen ? 0 : -1}
                aria-current={pathname === path ? "page" : undefined}
                className={`flex items-center justify-between py-4 text-lg font-medium border-b border-white/5 no-underline transition-colors duration-200 ${
                  pathname === path ? "text-[#f5c27a]" : "text-gray-200 hover:text-[#f5c27a]"
                }`}
              >
                {label}
                {pathname === path && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f5c27a]" aria-hidden="true" />
                )}
              </Link>
            ))}

            <div className="pt-6 space-y-3">
              <button
                onClick={() => { setShowCallModal(true); setIsOpen(false); }}
                tabIndex={isOpen ? 0 : -1}
                aria-label="Open contact information"
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-[#f5c27a]/30 text-[#f5c27a] font-bold text-sm hover:bg-[#f5c27a]/10 transition-all"
              >
                <Phone size={16} aria-hidden="true" />
                Call Now
              </button>

              <div className="pt-2 border-t border-white/10">
                {!isLoggedIn ? (
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => goTo("/login")}
                      tabIndex={isOpen ? 0 : -1}
                      className="w-full py-3 rounded-xl border border-white/20 text-white font-semibold hover:border-[#f5c27a]/40 transition-all"
                    >
                      Login
                    </button>
                    <button
                      onClick={() => goTo("/register")}
                      tabIndex={isOpen ? 0 : -1}
                      className="w-full py-3 rounded-xl bg-[#f5c27a] text-black font-black hover:bg-[#e3b26a] transition-all"
                    >
                      Register
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => goTo("/profile")}
                      tabIndex={isOpen ? 0 : -1}
                      className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-white/5 border border-white/10 font-bold text-white hover:bg-white/10 transition-all"
                      aria-label={`View profile for ${user?.name || "user"}`}
                    >
                      <UserCircle size={22} className="text-[#f5c27a]" aria-hidden="true" />
                      {user?.name || "My Profile"}
                    </button>
                    <button
                      onClick={() => { handleLogout(); setIsOpen(false); }}
                      tabIndex={isOpen ? 0 : -1}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-500/30 text-red-400 font-semibold text-sm hover:bg-red-500/10 transition-all"
                    >
                      <LogOut size={16} aria-hidden="true" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>
      </header>
    </>
  );
};

export default Header;
