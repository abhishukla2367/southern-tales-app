import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaFacebookF, FaInstagram } from "react-icons/fa";
import { SiX } from "react-icons/si";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNav = (path) => {
    window.scrollTo({ top: 0, behavior: "instant" });
    if (location.pathname === path) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate(path);
    }
  };

  const links = [
    { label: "Home",        path: "/" },
    { label: "Menu",        path: "/menu" },
    { label: "About Us",    path: "/about" },
    { label: "Gallery",     path: "/gallery" },
    { label: "Reservation", path: "/reservation" },
    { label: "Contact",     path: "/contactus" },
  ];

  const socialLinks = [
    { icon: <FaFacebookF aria-hidden="true" />, href: "https://facebook.com", label: "Follow us on Facebook" },
    { icon: <FaInstagram aria-hidden="true" />, href: "https://instagram.com", label: "Follow us on Instagram" },
    { icon: <SiX         aria-hidden="true" />, href: "https://x.com",         label: "Follow us on X (Twitter)" },
  ];

  const contactInfo = [
    { Icon: MapPin, text: "CBD Belapur, Navi Mumbai, Maharashtra", href: null },
    { Icon: Phone,  text: "+91 98765 43210",       href: "tel:+919876543210" },
    { Icon: Mail,   text: "hello@southerntales.in", href: "mailto:hello@southerntales.in" },
    { Icon: Clock,  text: "Mon – Fri: 7 AM – 10:30 PM\nSat – Sun: 8 AM – 11 PM", href: null },
  ];

  const services = ["Dine In", "Takeaway", "Online Order", "Reservation", "Catering", "Events"];

  return (
    <footer className="bg-[#0a0a0a] border-t border-white/10 pt-20 pb-8 px-6">
      <div className="max-w-6xl mx-auto">

        {/* ── Top Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

          {/* Brand */}
          <div>
            <div className="mb-5">
              <h3 className="text-2xl font-bold text-white">
                Southern <span className="text-orange-500">Tales</span>
              </h3>
              <p className="text-xs tracking-[3px] uppercase text-[#C9A84C] mt-1">
                Authentic Southern Cuisine
              </p>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              An authentic South Indian dining experience crafted with heritage recipes and the finest spices from across the Deccan.
            </p>
            <div className="flex gap-3">
              {socialLinks.map(({ icon, href, label }, i) => (
                <a key={i} href={href} target="_blank" rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-gray-400 text-sm hover:border-orange-500 hover:text-orange-500 transition-all duration-300"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm tracking-[3px] uppercase text-white font-semibold mb-6">
              Quick Links
            </h4>
            <ul className="flex flex-col gap-4">
              {links.map(({ label, path }) => (
                <li key={label}>
                  <button onClick={() => handleNav(path)}
                    className="group flex items-center gap-2 text-gray-400 text-base hover:text-orange-500 transition-colors duration-200 text-left bg-transparent border-none cursor-pointer p-0 w-full"
                  >
                    <span className="w-0 h-px bg-orange-500 group-hover:w-4 transition-all duration-300 flex-shrink-0" />
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-sm tracking-[3px] uppercase text-white font-semibold mb-6">
              Services
            </h4>
            <ul className="flex flex-col gap-4">
              {services.map((s) => (
                <li key={s} className="text-gray-400 text-base">{s}</li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-sm tracking-[3px] uppercase text-white font-semibold mb-6">
              Contact Us
            </h4>
            <div className="flex flex-col gap-5">
              {contactInfo.map(({ Icon, text, href }) => (
                <div key={text} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon size={15} className="text-orange-500" aria-hidden="true" />
                  </div>
                  {href ? (
                    <a
                      href={href}
                      className="text-gray-400 text-sm leading-relaxed hover:text-orange-500 transition-colors duration-200"
                    >
                      {text}
                    </a>
                  ) : (
                    <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">{text}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Bottom Bar ── */}
        <div className="border-t border-white/10 pt-8 text-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()}{" "}
            <span className="text-orange-500">Southern Tales</span>. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;