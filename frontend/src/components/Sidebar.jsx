import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  LayoutDashboard, Users, Car, ClipboardList, Package, Receipt,
  Settings, LogOut, Wrench, ShieldCheck, BarChart3, CheckSquare,
  AlertTriangle, Bell, Sun, Moon, ShoppingCart, Calendar
} from "lucide-react";
import logoImg from "../assets/logo.png";

const roleNav = {
  manager: [
    { label: "Dashboard", to: "/manager", icon: LayoutDashboard },
    { label: "Appointments", to: "/manager/appointments", icon: Calendar },
    { label: "Store Orders", to: "/manager/orders", icon: ShoppingCart },
    { label: "Financial Reports", to: "/manager/financial", icon: BarChart3 },
    { label: "Services & Items", to: "/manager/services", icon: Wrench },
    { label: "Job Cards", to: "/manager/jobs", icon: ClipboardList },
    { label: "Approvals", to: "/manager/approvals", icon: CheckSquare },
    { label: "Inventory", to: "/manager/inventory", icon: Package },
    { label: "Staff", to: "/manager/staff", icon: Users },
  ],
  advisor: [
    { label: "Dashboard", to: "/advisor", icon: LayoutDashboard },
    { label: "Store Orders", to: "/advisor/orders", icon: ShoppingCart },
    { label: "Customers", to: "/advisor/customers", icon: Users },
    { label: "Job Cards", to: "/advisor/jobs", icon: ClipboardList },
    { label: "New Job Card", to: "/advisor/new-job", icon: Car },
  ],
  supervisor: [
    { label: "Dashboard", to: "/supervisor", icon: LayoutDashboard },
    { label: "Task Board", to: "/supervisor/tasks", icon: ClipboardList },
    { label: "Requisitions", to: "/supervisor/requisitions", icon: Package },
  ],
  technician: [
    { label: "My Tasks", to: "/technician", icon: Wrench },
  ],
  qc_inspector: [
    { label: "QC Inspections", to: "/technician", icon: ShieldCheck },
  ],
  storekeeper: [
    { label: "Dashboard", to: "/storekeeper", icon: LayoutDashboard },
    { label: "Inventory", to: "/storekeeper/inventory", icon: Package },
    { label: "Transactions", to: "/storekeeper/transactions", icon: BarChart3 },
    { label: "Requisitions", to: "/storekeeper/requisitions", icon: ClipboardList },
  ],
  cashier: [
    { label: "Dashboard", to: "/cashier", icon: LayoutDashboard },
    { label: "Invoices", to: "/cashier/invoices", icon: Receipt },
    { label: "New Invoice", to: "/cashier/new-invoice", icon: ClipboardList },
  ],
  customer: [
    { label: "Book Services & Parts", to: "/customer/store", icon: ShoppingCart },
    { label: "My Appointments", to: "/customer/appointments", icon: Calendar },
    { label: "Live Job Tracking", to: "/customer/history", icon: ClipboardList },
    { label: "My Vehicles", to: "/customer/vehicles", icon: Car },
    { label: "Bookings & Receipts", to: "/customer/invoices", icon: Receipt },
    { label: "Notifications", to: "/customer/notifications", icon: Bell },
    { label: "My Profile & Account", to: "/customer/profile", icon: Settings },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const nav = roleNav[user?.role] || [];
  const initials = user?.name?.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase() || "?";

  const doLogout = () => { logout(); navigate("/login"); };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo" style={{ padding: "16px 20px", display: "flex", alignItems: "center" }}>
        <img src={logoImg} alt="PitStop Performance Logo" style={{ maxHeight: 40, maxWidth: "100%", objectFit: "contain", filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.4))" }} />
      </div>
      <nav className="sidebar-nav">

        <div className="nav-section-label">Navigation</div>
        {nav.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/manager" || item.to === "/advisor" || item.to === "/supervisor" || item.to === "/technician" || item.to === "/storekeeper" || item.to === "/cashier" || item.to === "/customer"}
            className={({isActive}) => "nav-item" + (isActive ? " active" : "")}
          >
            <item.icon className="nav-icon" size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          type="button"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 12px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
          title="Toggle Light / Dark Mode"
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {isDark ? <Moon size={15} style={{ color: "var(--accent)" }} /> : <Sun size={15} style={{ color: "#f59e0b" }} />}
            <span>{isDark ? "Dark Theme" : "Light Theme"}</span>
          </div>
          <span style={{
            fontSize: 10,
            padding: "2px 6px",
            borderRadius: 6,
            background: isDark ? "rgba(245,158,11,0.2)" : "rgba(0,0,0,0.06)",
            color: isDark ? "var(--accent)" : "#475569",
            fontWeight: 700
          }}>
            {isDark ? "🌙 Dark" : "☀️ Light"}
          </span>
        </button>

        <div className="sidebar-user">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{user?.role?.replace("_"," ")}</div>
          </div>
          <button className="logout-btn" onClick={doLogout} title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
