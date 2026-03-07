import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Utensils,
  ClipboardList,
  CalendarDays,
  BarChart2,
  LogOut,
} from "lucide-react";
import { AuthContext } from "../../context/AuthContext";

const menuItems = [
  { id: "dashboard",    label: "Dashboard",           icon: LayoutDashboard },
  { id: "menu",         label: "Menu Management",     icon: Utensils },
  { id: "orders",       label: "Live Orders",         icon: ClipboardList },
  { id: "reservations", label: "Reservations",        icon: CalendarDays },
  { id: "reports",      label: "Reports & Analytics", icon: BarChart2 },
];

export default function Sidebar({ active, onChange }) {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  const handleLogout = () => {
    navigate("/", { replace: true });
    logout();
  };

  const handleKeyDown = (e, action) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      action();
    }
  };

  return (
    <>
      <style>{`
        @keyframes sidebarIn {
          from { opacity: 0; transform: translateX(-10px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .nav-item {
          position: relative;
          transition: background 0.18s ease, color 0.18s ease, padding-left 0.18s ease;
        }
        .nav-item::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 0;
          background: #f5c27a;
          border-radius: 0 2px 2px 0;
          transition: height 0.2s ease;
        }
        .nav-item.active::before,
        .nav-item:focus-visible::before {
          height: 60%;
        }
        .nav-item:focus-visible {
          outline: 2px solid #f5c27a;
          outline-offset: -2px;
        }
        .logout-btn {
          transition: background 0.18s ease, color 0.18s ease;
        }
        .logout-btn:focus-visible {
          outline: 2px solid #ef4444;
          outline-offset: -2px;
        }
      `}</style>

      <aside
        className="w-64 hidden lg:flex flex-col h-screen sticky top-0"
        style={{
          background: "#111111",
          borderRight: "1px solid #1f1f1f",
          animation: "sidebarIn 0.3s ease",
        }}
        aria-label="Admin navigation"
      >
        {/* Brand */}
        <div
          className="p-7 flex flex-col items-center"
          style={{ borderBottom: "1px solid #1f1f1f" }}
        >
          <h1
            className="font-black text-base tracking-tighter uppercase"
            style={{ color: "#f1f1f1" }}
          >
            Southern Tales
          </h1>
          <p
            className="text-[9px] font-bold uppercase tracking-[0.25em] mt-1"
            style={{ color: "#f5c27a" }}
          >
            Management Suite
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Main navigation">
          {menuItems.map((item, i) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChange(item.id)}
                onKeyDown={(e) => handleKeyDown(e, () => onChange(item.id))}
                aria-current={isActive ? "page" : undefined}
                aria-label={item.label}
                className={`nav-item ${isActive ? "active" : ""} w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm`}
                style={{
                  background: isActive ? "rgba(245,194,122,0.10)" : "transparent",
                  color: isActive ? "#f5c27a" : "#aaa",
                  border: isActive
                    ? "1px solid rgba(245,194,122,0.15)"
                    : "1px solid transparent",
                  animationDelay: `${i * 60}ms`,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "#1a1a1a";
                    e.currentTarget.style.color = "#f1f1f1";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#aaa";
                  }
                }}
              >
                <Icon
                  size={17}
                  strokeWidth={isActive ? 2.5 : 2}
                  aria-hidden="true"
                />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3" style={{ borderTop: "1px solid #1f1f1f" }}>
          <button
            onClick={handleLogout}
            onKeyDown={(e) => handleKeyDown(e, handleLogout)}
            aria-label="Log out of admin dashboard"
            className="logout-btn flex items-center gap-3 w-full px-4 py-3 rounded-xl font-bold text-sm"
            style={{ color: "#aaa" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239,68,68,0.08)";
              e.currentTarget.style.color = "#ef4444";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#aaa";
            }}
          >
            <LogOut size={17} aria-hidden="true" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}