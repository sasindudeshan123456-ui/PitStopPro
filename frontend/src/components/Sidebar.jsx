import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LayoutDashboard, Users, Car, ClipboardList, Package, Receipt, Settings, LogOut, Wrench, ShieldCheck, BarChart3, CheckSquare } from "lucide-react";

const roleNav = {
  manager: [
    { label: "Dashboard", to: "/manager", icon: LayoutDashboard },
    { label: "Approvals", to: "/manager/approvals", icon: CheckSquare },
    { label: "Job Cards", to: "/manager/jobs", icon: ClipboardList },
    { label: "Staff", to: "/manager/staff", icon: Users },
  ],
  advisor: [
    { label: "Dashboard", to: "/advisor", icon: LayoutDashboard },
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
    { label: "My Vehicles", to: "/customer", icon: Car },
    { label: "Service History", to: "/customer/history", icon: ClipboardList },
    { label: "Invoices", to: "/customer/invoices", icon: Receipt },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const nav = roleNav[user?.role] || [];
  const initials = user?.name?.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase() || "?";

  const doLogout = () => { logout(); navigate("/login"); };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">🔧</div>
        <div>
          <div className="logo-text">PitStop<span style={{color:"var(--accent)"}}>Pro</span></div>
          <div className="logo-sub">Workshop Management</div>
        </div>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {nav.map(item => (
          <NavLink key={item.to} to={item.to} end={item.to.split("/").length <= 2} className={({isActive}) => "nav-item" + (isActive ? " active" : "")}>
            <item.icon className="nav-icon" size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
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
