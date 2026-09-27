import { useEffect, useState, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import {
  Bell, CheckCheck, ShoppingCart, Car, ClipboardList, Receipt,
  Calendar, Eye, Printer, Plus, ShieldCheck, Pencil, Trash2, X,
  Clock, CheckCircle2, AlertTriangle, Edit2, User, UserX, Lock, Shield,
  Mail, Phone, MapPin, KeyRound, Save
} from "lucide-react";
import CustomerStoreTab from "./CustomerStoreTab";
import JobProgressStepper from "../../components/JobProgressStepper";
import InvoicePrintModal from "../../components/InvoicePrintModal";
import { getVehicleImage, getFallbackSvg } from "../../utils/imageCatalog";

const fmt = n => `LKR ${Number(n || 0).toLocaleString("en-LK", { minimumFractionDigits: 2 })}`;

function NotificationsPanel({ userId }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch { toast.error("Failed"); }
  };

  const TYPE_ICONS = {
    job_update: "🏁",
    approval: "✅",
    material: "📦",
    system: "🔔",
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Bell size={18} style={{ color: "var(--accent)" }} />
          <span style={{ fontWeight: 700, fontSize: 15 }}>Notifications</span>
          {unreadCount > 0 && (
            <span style={{ background: "var(--red)", color: "#fff", fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 10 }}>
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={markAllRead}>
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      {loading ? <div className="loading">Loading...</div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {notifications.length === 0 && (
            <div className="empty-state"><div className="empty-icon">🔔</div><p>No notifications yet</p></div>
          )}
          {notifications.map(n => (
            <div
              key={n.id}
              onClick={() => !n.is_read && markRead(n.id)}
              style={{
                background: n.is_read ? "var(--bg-card)" : "rgba(245,158,11,0.08)",
                border: `1px solid ${n.is_read ? "var(--border)" : "rgba(245,158,11,0.3)"}`,
                borderLeft: `3px solid ${n.is_read ? "var(--border)" : "var(--accent)"}`,
                borderRadius: 10, padding: "14px 16px",
                cursor: n.is_read ? "default" : "pointer",
                transition: "all 0.2s",
              }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 20 }}>{TYPE_ICONS[n.type] || "🔔"}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: n.is_read ? "var(--text-secondary)" : "var(--text-primary)" }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>{n.message}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
                      {new Date(n.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                {!n.is_read && (
                  <span style={{ width: 10, height: 10, background: "var(--accent)", borderRadius: "50%", flexShrink: 0, marginTop: 4 }} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CustomerPortal() {
  const { user, updateUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [approvingId, setApprovingId] = useState(null);
  const [printInvoice, setPrintInvoice] = useState(null);

  // Add Vehicle Modal State
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [newVehForm, setNewVehForm] = useState({ make: "", model: "", year: new Date().getFullYear(), license_plate: "", color: "", mileage: "", vin: "" });
  const [addingVehicleLoading, setAddingVehicleLoading] = useState(false);

  // Edit Appointment State
  const [catalogServices, setCatalogServices] = useState([]);
  const [showEditAptModal, setShowEditAptModal] = useState(false);
  const [editAptForm, setEditAptForm] = useState({
    id: null,
    vehicle_id: "",
    preferred_date: "",
    preferred_time: "Morning (08:30 AM - 12:00 PM)",
    services: [],
    customer_notes: ""
  });
  const [editAptLoading, setEditAptLoading] = useState(false);

  // Profile & Account Management State
  const [profileForm, setProfileForm] = useState({
    full_name: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
    nic: user?.nic || "",
    address: user?.address || "",
    password: "",
    confirmPassword: ""
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [profileLoading, setProfileLoading] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);

  // Sync tab with URL
  const activeTab = useMemo(() => {
    const p = location.pathname.toLowerCase().replace(/\/$/, "");
    if (p.endsWith("/vehicles") || p.endsWith("/my-vehicles")) return "vehicles";
    if (p.endsWith("/appointments") || p.endsWith("/bookings")) return "appointments";
    if (p.endsWith("/history") || p.endsWith("/jobs")) return "history";
    if (p.endsWith("/invoices") || p.endsWith("/billing")) return "invoices";
    if (p.endsWith("/notifications")) return "notifications";
    if (p.endsWith("/profile") || p.endsWith("/account")) return "profile";
    if (p.endsWith("/store") || p.endsWith("/shop") || p.endsWith("/services")) return "store";
    return "store";
  }, [location.pathname]);

  const handleTabClick = (tabKey) => {
    navigate(`/customer/${tabKey}`);
  };

  const loadData = useCallback(() => {
    if (!user?.customer_id) {
      setLoading(false);
      return;
    }
    Promise.allSettled([
      api.get(`/customers/${user.customer_id}`),
      api.get(`/job-cards/customer/${user.customer_id}`),
      api.get("/appointments/my"),
      api.get(`/billing/customer/${user.customer_id}`),
      api.get("/notifications"),
      api.get("/customers/store/services")
    ]).then(([cRes, jRes, aRes, iRes, nRes, sRes]) => {
      if (cRes.status === "fulfilled") {
        const cust = cRes.value.data;
        setVehicles(cust.vehicles || []);
        setProfileForm(prev => ({
          ...prev,
          full_name: user?.name || cust.full_name || prev.full_name,
          phone: user?.phone || cust.phone || prev.phone,
          email: user?.email || cust.email || prev.email,
          nic: cust.nic || prev.nic || "",
          address: cust.address || prev.address || ""
        }));
      }
      if (jRes.status === "fulfilled") setJobs(jRes.value.data || []);
      if (aRes.status === "fulfilled") setAppointments(aRes.value.data || []);
      if (iRes.status === "fulfilled") setInvoices(iRes.value.data || []);
      if (nRes.status === "fulfilled") setUnreadCount(nRes.value.data.unreadCount || 0);
      if (sRes.status === "fulfilled") setCatalogServices(sRes.value.data || []);
    }).catch(() => toast.error("Failed to load customer data"))
      .finally(() => setLoading(false));
  }, [user]);

  const validateProfile = () => {
    const errs = {};
    const full_name = profileForm.full_name?.trim() || "";
    const email = profileForm.email?.trim() || "";
    const phone = profileForm.phone?.trim() || "";
    const address = profileForm.address?.trim() || "";
    const password = profileForm.password || "";
    const confirmPassword = profileForm.confirmPassword || "";

    // 1. Full Name
    if (!full_name) {
      errs.full_name = "Full Name is required";
    }

    // 2. Email Validation: Must end with .com or .lk
    const emailLower = email.toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      errs.email = "Email address is required";
    } else if (!emailRegex.test(emailLower) || !(emailLower.endsWith(".com") || emailLower.endsWith(".lk"))) {
      errs.email = "Email must be valid (e.g. name@gmail.com or ending with .com / .lk)";
    }

    // 3. Phone Validation: Must be 10 digits starting with 0
    if (!phone) {
      errs.phone = "Phone number is required";
    } else if (!/^0\d{9}$/.test(phone)) {
      errs.phone = "Phone must be 10 digits starting with 0 (e.g. 0771234567)";
    }

    // 4. Address
    if (!address) {
      errs.address = "Address is required";
    }

    // 5. Password Validation (Optional, but if filled must be min 6 chars & match)
    if (password) {
      if (password.length < 6) {
        errs.password = "Password must be at least 6 characters";
      }
      if (password !== confirmPassword) {
        errs.confirmPassword = "New passwords do not match";
      }
    }

    return errs;
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const errs = validateProfile();
    setProfileErrors(errs);

    if (Object.keys(errs).length > 0) {
      const firstErrKey = Object.keys(errs)[0];
      toast.error(errs[firstErrKey]);
      return;
    }

    setProfileLoading(true);
    try {
      const res = await api.put("/customers/profile/me", {
        full_name: profileForm.full_name.trim(),
        email: profileForm.email.trim(),
        phone: profileForm.phone.trim(),
        address: profileForm.address.trim(),
        nic: profileForm.nic ? profileForm.nic.trim() : "",
        password: profileForm.password || undefined
      });

      toast.success(res.data.message || "Profile updated successfully!");
      if (res.data.user && updateUser) {
        updateUser(res.data.user);
      }
      setProfileForm(prev => ({ ...prev, password: "", confirmPassword: "" }));
      setProfileErrors({});
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteAccountLoading(true);
    try {
      await api.delete("/customers/profile/me");
      toast.success("Your account has been deactivated and removed successfully.");
      if (logout) logout();
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to deactivate account");
    } finally {
      setDeleteAccountLoading(false);
      setShowDeleteConfirmModal(false);
    }
  };

  const sortedAppointments = useMemo(() => {
    if (!Array.isArray(appointments)) return [];
    return [...appointments].sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : (a.id || 0);
      const timeB = b.created_at ? new Date(b.created_at).getTime() : (b.id || 0);
      if (timeB !== timeA) return timeB - timeA;
      return (b.id || 0) - (a.id || 0);
    });
  }, [appointments]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOrderPlaced = (destinationTab = "history") => {
    loadData();
    navigate(`/customer/${destinationTab}`);
  };

  const handleCustomerApprove = async (jobId) => {
    setApprovingId(jobId);
    try {
      const res = await api.patch(`/job-cards/${jobId}/customer-approve`);
      toast.success(res.data.message || "Job Card approved!");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve job card");
    } finally {
      setApprovingId(null);
    }
  };

  const handleCustomerReject = async (jobId) => {
    const reason = window.prompt("Please state your reason for declining or requesting changes:");
    if (reason === null) return;
    setApprovingId(jobId);
    try {
      const res = await api.patch(`/job-cards/${jobId}/customer-reject`, { reason });
      toast.success(res.data.message || "Job Card rejected/declined");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject job card");
    } finally {
      setApprovingId(null);
    }
  };

  const handleAddVehicleSubmit = async (e) => {
    e.preventDefault();
    if (!newVehForm.license_plate || !newVehForm.make || !newVehForm.model) {
      return toast.error("Please fill make, model and license plate.");
    }
    setAddingVehicleLoading(true);
    try {
      await api.post(`/customers/${user.customer_id}/vehicles`, newVehForm);
      toast.success("Vehicle registered successfully!");
      setShowAddVehicleModal(false);
      setNewVehForm({ make: "", model: "", year: new Date().getFullYear(), license_plate: "", color: "", mileage: "", vin: "" });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add vehicle");
    } finally {
      setAddingVehicleLoading(false);
    }
  };

  // Appointment Editing Handlers
  const handleOpenEditApt = (apt) => {
    let srvList = [];
    try {
      srvList = typeof apt.services === "string" ? JSON.parse(apt.services) : (apt.services || []);
    } catch {
      srvList = [{ name: apt.services }];
    }

    let dateStr = "";
    if (apt.preferred_date) {
      if (typeof apt.preferred_date === "string" && apt.preferred_date.includes("T")) {
        dateStr = apt.preferred_date.split("T")[0];
      } else {
        const d = new Date(apt.preferred_date);
        dateStr = !isNaN(d.getTime()) ? d.toISOString().split("T")[0] : apt.preferred_date;
      }
    }

    setEditAptForm({
      id: apt.id,
      vehicle_id: apt.vehicle_id || (vehicles[0]?.id || ""),
      preferred_date: dateStr,
      preferred_time: apt.preferred_time || "Morning (08:30 AM - 12:00 PM)",
      services: srvList,
      customer_notes: apt.customer_notes || ""
    });
    setShowEditAptModal(true);
  };

  const toggleEditAptService = (srv) => {
    setEditAptForm(prev => {
      const exists = prev.services.some(s => (s.id && s.id === srv.id) || (s.code && s.code === srv.code) || s.name === srv.name || s === srv.name);
      if (exists) {
        return {
          ...prev,
          services: prev.services.filter(s => (s.id ? s.id !== srv.id : (s.name ? s.name !== srv.name : s !== srv.name)))
        };
      } else {
        return {
          ...prev,
          services: [...prev.services, { id: srv.id, code: srv.code, name: srv.name, base_price: srv.base_price }]
        };
      }
    });
  };

  const isServiceSelectedInEdit = (srv) => {
    return editAptForm.services.some(s => (s.id && s.id === srv.id) || (s.code && s.code === srv.code) || s.name === srv.name || s === srv.name);
  };

  const handleSaveEditApt = async (e) => {
    e.preventDefault();
    if (!editAptForm.preferred_date) {
      return toast.error("Please choose a preferred appointment date.");
    }
    if (!editAptForm.services || editAptForm.services.length === 0) {
      return toast.error("Please select at least one workshop service.");
    }
    setEditAptLoading(true);
    try {
      const res = await api.put(`/appointments/${editAptForm.id}`, {
        vehicle_id: editAptForm.vehicle_id,
        preferred_date: editAptForm.preferred_date,
        preferred_time: editAptForm.preferred_time,
        services: editAptForm.services,
        customer_notes: editAptForm.customer_notes
      });
      toast.success(res.data?.message || "Appointment updated successfully!");
      setShowEditAptModal(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update appointment");
    } finally {
      setEditAptLoading(false);
    }
  };

  const handleCancelApt = async (aptId) => {
    if (!window.confirm("Are you sure you want to cancel and delete this appointment?")) return;
    try {
      const res = await api.delete(`/appointments/${aptId}`);
      toast.success(res.data?.message || "Appointment deleted.");
      setAppointments(prev => prev.filter(a => a.id !== aptId));
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel appointment");
    }
  };

  const handleCustomerConfirmApt = async (aptId) => {
    try {
      await api.patch(`/appointments/${aptId}/status`, { status: "confirmed" });
      toast.success("Appointment confirmed! We look forward to receiving your vehicle.");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to confirm appointment");
    }
  };

  const handleDeleteJob = async (jobId, jobNum) => {
    if (!window.confirm(`Are you sure you want to delete Job Record #${jobNum}?`)) return;
    try {
      await api.delete(`/job-cards/${jobId}`);
      toast.success("Job record deleted successfully.");
      setJobs(prev => prev.filter(j => j.id !== jobId));
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete job record");
    }
  };

  const pendingApprovalJobs = jobs.filter(j => j.customer_approval_status === "pending" && j.status !== "cancelled");

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Customer Portal</h1>
        <p className="page-subtitle">Welcome back, {user?.name} · Book services, track live garage repair progress & shop parts</p>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 24, background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 6, flexWrap: "wrap" }}>
        {[
          { key: "store", label: "Book Services & Buy Parts", emoji: "🛒" },
          { key: "appointments", label: "My Appointments", emoji: "📅", badge: appointments.filter(a => a.status === "pending" || a.status === "confirmed").length },
          { key: "history", label: "Live Job Tracking", emoji: "📋", badge: pendingApprovalJobs.length },
          { key: "vehicles", label: "My Vehicles", emoji: "🚗", badge: vehicles.length },
          { key: "invoices", label: "Bookings & Receipts", emoji: "🧾" },
          { key: "notifications", label: "Notifications", emoji: "🔔", badge: unreadCount },
          { key: "profile", label: "My Profile & Account", emoji: "👤" },
        ].map(t => (
          <button key={t.key} onClick={() => handleTabClick(t.key)}
            style={{
              flex: 1, minWidth: 140, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
              transition: "all 0.2s",
              background: activeTab === t.key ? "linear-gradient(135deg, var(--accent), #d97706)" : "transparent",
              color: activeTab === t.key ? "#fff" : "var(--text-secondary)",
            }}>
            {t.emoji} {t.label}
            {t.badge > 0 && (
              <span style={{
                background: activeTab === t.key ? "rgba(255,255,255,0.3)" : "var(--red)",
                color: "#fff", fontSize: 10, fontWeight: 800, padding: "1px 6px", borderRadius: 10
              }}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="portal-content">
        {loading ? <div className="loading">Loading customer data...</div> : <>
        {/* --- TAB 1: STORE & BOOKING --- */}
        {activeTab === "store" && (
          <CustomerStoreTab vehicles={vehicles} onOrderPlaced={handleOrderPlaced} />
        )}

        {/* --- TAB 2: MY APPOINTMENTS --- */}
        {activeTab === "appointments" && (
          <div className="card">
            <div className="card-header flex-between">
              <div>
                <h2 className="card-title">My Booked Appointments</h2>
                <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0 0 0" }}>
                  Track your appointment confirmation status & bringing vehicle to workshop
                </p>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => handleTabClick("store")}>
                + Book New Appointment
              </button>
            </div>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Vehicle</th>
                      <th>Selected Services</th>
                      <th>Status</th>
                      <th>Linked Job Card</th>
                      <th style={{ textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAppointments.map(apt => {
                      let srvList = [];
                      let totalEst = 0;
                      try {
                        srvList = typeof apt.services === "string" ? JSON.parse(apt.services) : (apt.services || []);
                        if (!Array.isArray(srvList)) srvList = [srvList];
                        totalEst = srvList.reduce((sum, s) => sum + (parseFloat(s.price || s.base_price || 0)), 0);
                      } catch {
                        srvList = [{ name: apt.services }];
                      }

                      return (
                        <tr key={apt.id}>
                          <td>
                            <div style={{ fontWeight: 700, color: "var(--accent)" }}>
                              {new Date(apt.preferred_date).toLocaleDateString("en-LK", { dateStyle: "medium" })}
                            </div>
                            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{apt.preferred_time}</div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{apt.make} {apt.model}</div>
                            <span className="chip" style={{ fontSize: 11 }}>{apt.license_plate}</span>
                          </td>
                          <td>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                              {srvList.map((s, idx) => {
                                const name = typeof s === "string" ? s : (s.name || s);
                                const price = typeof s === "object" ? (s.price || s.base_price) : null;
                                return (
                                  <span key={idx} style={{
                                    fontSize: 11, background: "var(--bg-surface)", border: "1px solid var(--border)",
                                    padding: "3px 8px", borderRadius: 6, display: "inline-flex", alignItems: "center", gap: 6
                                  }}>
                                    <span style={{ fontWeight: 600 }}>{name}</span>
                                    {price && (
                                      <strong style={{ color: "var(--accent)", fontSize: 11, background: "rgba(245,158,11,0.12)", padding: "1px 6px", borderRadius: 4 }}>
                                        {fmt(price)}
                                      </strong>
                                    )}
                                  </span>
                                );
                              })}
                            </div>
                            {totalEst > 0 && srvList.length > 1 && (
                              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                                Total Services Estimate: <strong style={{ color: "var(--accent)", fontWeight: 800 }}>{fmt(totalEst)}</strong>
                              </div>
                            )}
                            {apt.customer_notes && (
                              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                                Note: {apt.customer_notes}
                              </div>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${
                              apt.job_approval_status === "rejected" || apt.job_status === "cancelled" || apt.status === "cancelled"
                                ? "badge-cancelled"
                                : apt.job_status === "invoiced" || apt.status === "invoiced"
                                ? "badge-completed"
                                : apt.job_status === "completed" || apt.status === "completed"
                                ? "badge-completed"
                                : apt.job_status === "qc_check"
                                ? "badge-qc"
                                : apt.job_status === "in_progress"
                                ? "badge-in_progress"
                                : `badge-${apt.status}`
                            }`}>
                              {apt.job_approval_status === "rejected" || apt.job_status === "cancelled" || apt.status === "cancelled"
                                ? "❌ Estimate Rejected by Garage"
                                : apt.job_status === "invoiced" || apt.status === "invoiced"
                                ? "🧾 Invoiced & Ready"
                                : apt.job_status === "completed" || apt.status === "completed"
                                ? "🏁 Repair Completed"
                                : apt.job_status === "qc_check"
                                ? "🔍 QC Inspection"
                                : apt.job_status === "in_progress"
                                ? "⚡ Repair In Progress"
                                : apt.status === "pending"
                                ? "⏳ Pending Review"
                                : apt.status === "approved"
                                ? "🕒 Garage Approved (Please Confirm Slot)"
                                : apt.status === "confirmed"
                                ? "📅 Confirmed — Bring on Date"
                                : apt.status === "checked_in"
                                ? "🚗 Vehicle in Workshop"
                                : apt.status}
                            </span>
                          </td>
                          <td>
                            {apt.job_number ? (
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleTabClick("history")}
                                title="Click to track this live job"
                                style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 8px", fontSize: 12, fontWeight: 700, color: "var(--accent)" }}
                              >
                                📋 {apt.job_number}
                              </button>
                            ) : (
                              <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>
                            )}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            {apt.job_number || apt.job_status ? (
                              <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "center" }}>
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleTabClick("history")}
                                  style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 12px", fontSize: 12, fontWeight: 700 }}
                                >
                                  <ClipboardList size={13} /> Track Job ({apt.job_status ? apt.job_status.replace("_", " ") : "In Garage"})
                                </button>
                                {(apt.job_status === "invoiced" || apt.status === "invoiced") && (
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => {
                                      const matched = invoices.find(inv => 
                                        (apt.job_card_id && inv.job_card_id === apt.job_card_id) ||
                                        (apt.job_number && inv.job_number === apt.job_number)
                                      );
                                      if (matched) {
                                        setPrintInvoice(matched);
                                      } else {
                                        handleTabClick("invoices");
                                      }
                                    }}
                                    style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 10px", fontSize: 12 }}
                                  >
                                    <Receipt size={13} /> View Invoice
                                  </button>
                                )}
                              </div>
                            ) : apt.status === "cancelled" || apt.job_approval_status === "rejected" || apt.job_status === "cancelled" ? (
                              <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "center" }}>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => handleCancelApt(apt.id)}
                                  title="Delete this rejected record"
                                  style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 10px", fontSize: 12, color: "var(--red)", borderColor: "rgba(239,68,68,0.3)" }}
                                >
                                  <Trash2 size={13} /> Delete Record
                                </button>
                              </div>
                            ) : apt.status === "pending" ? (
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleCancelApt(apt.id)}
                                title="Cancel appointment request"
                                style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 10px", fontSize: 12, color: "var(--red)", borderColor: "rgba(239,68,68,0.3)" }}
                              >
                                <Trash2 size={13} /> Cancel
                              </button>
                            ) : apt.status === "approved" ? (
                              <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "center" }}>
                                <button
                                  className="btn btn-success btn-sm"
                                  onClick={() => handleCustomerConfirmApt(apt.id)}
                                  style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 12px", fontSize: 12 }}
                                >
                                  <CheckCircle2 size={13} /> Confirm Slot
                                </button>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => handleOpenEditApt(apt)}
                                  style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 10px", fontSize: 12 }}
                                >
                                  <Edit2 size={13} /> Reschedule
                                </button>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => handleCancelApt(apt.id)}
                                  style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 10px", fontSize: 12, color: "var(--red)", borderColor: "rgba(239,68,68,0.3)" }}
                                >
                                  <Trash2 size={13} /> Cancel
                                </button>
                              </div>
                            ) : apt.status === "confirmed" ? (
                              <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "center" }}>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => handleOpenEditApt(apt)}
                                  style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 10px", fontSize: 12 }}
                                >
                                  <Edit2 size={13} /> Reschedule
                                </button>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => handleCancelApt(apt.id)}
                                  style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 10px", fontSize: 12, color: "var(--red)", borderColor: "rgba(239,68,68,0.3)" }}
                                >
                                  <Trash2 size={12} /> Cancel Booking
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: 12, color: "var(--accent)", display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
                                🚗 In Garage
                              </span>
                            )}
                          </td>
                      </tr>
                    );
                  })}
                  {!sortedAppointments.length && (
                    <tr>
                      <td colSpan={6}>
                        <div className="empty-state">
                          <div className="empty-icon">📅</div>
                          <p>No active appointments booked yet. Browse our workshop services to book an appointment.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- TAB 3: LIVE JOB TRACKING & SERVICE HISTORY --- */}
        {activeTab === "history" && (
          <div>
            {/* Active Stepper Section for Live Jobs */}
            {jobs.map(job => (
              <JobProgressStepper
                key={job.id}
                job={job}
                onApprove={handleCustomerApprove}
                onReject={handleCustomerReject}
                onDelete={handleDeleteJob}
                approving={approvingId === job.id}
              />
            ))}

            <div className="card" style={{ marginTop: 24 }}>
              <div className="card-header">
                <h2 className="card-title">All Service Job Records</h2>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Job #</th>
                      <th>Vehicle</th>
                      <th>Reported Issue</th>
                      <th>Estimate</th>
                      <th>Approval Status</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map(j => (
                      <tr key={j.id}>
                        <td><strong style={{ color: "var(--accent)" }}>{j.job_number}</strong></td>
                        <td>{j.make} {j.model} — <span className="chip">{j.license_plate}</span></td>
                        <td style={{ maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis" }}>{j.reported_issue}</td>
                        <td><strong>{fmt(j.estimated_cost)}</strong></td>
                        <td>
                          <span style={{
                            padding: "3px 8px", borderRadius: 10, fontSize: 11, fontWeight: 700,
                            background: j.approval_status === "rejected" ? "rgba(239,68,68,0.15)" : j.customer_approval_status === "approved" ? "rgba(16,185,129,0.15)" : j.customer_approval_status === "rejected" ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)",
                            color: j.approval_status === "rejected" ? "var(--red)" : j.customer_approval_status === "approved" ? "var(--green)" : j.customer_approval_status === "rejected" ? "var(--red)" : "var(--accent)"
                          }}>
                            {j.approval_status === "rejected"
                              ? "❌ Rejected by Manager"
                              : j.customer_approval_status === "approved"
                              ? "✅ Approved"
                              : j.customer_approval_status === "rejected"
                              ? "❌ Declined"
                              : "⏳ Pending Approval"}
                          </span>
                        </td>
                        <td><span className={`badge badge-${j.status}`}>{j.status?.replace("_", " ")}</span></td>
                        <td>{new Date(j.created_at).toLocaleDateString()}</td>
                        <td>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteJob(j.id, j.job_number)}
                            title="Delete this job card record"
                            style={{ padding: "4px 8px" }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!jobs.length && <tr><td colSpan={8}><div className="empty-state"><p>No service history found</p></div></td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 4: MY VEHICLES (FIXED & FULLY FUNCTIONAL) --- */}
        {activeTab === "vehicles" && (
          <div>
            <div className="card-header flex-between mb-16" style={{ background: "var(--bg-surface)", padding: "16px 20px", borderRadius: 12, border: "1px solid var(--border)" }}>
              <div>
                <h2 className="card-title" style={{ fontSize: 18 }}>My Registered Vehicles</h2>
                <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0 0 0" }}>
                  Manage vehicles linked to your PitStopPro account
                </p>
              </div>
              <button className="btn btn-primary" onClick={() => setShowAddVehicleModal(true)} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Plus size={16} /> + Register New Vehicle
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
              {vehicles.map(v => {
                const vehImg = getVehicleImage(v.make, v.model);
                const svgFallback = getFallbackSvg(`${v.make} ${v.model}`, v.license_plate, "#f59e0b", "🚗");

                return (
                  <div key={v.id} className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 0, overflow: "hidden", border: "1px solid var(--border)" }}>
                    {/* Vehicle Photo Banner */}
                    <div style={{ position: "relative", height: 160, background: "#0f172a", overflow: "hidden" }}>
                      <img
                        src={vehImg}
                        alt={`${v.make} ${v.model}`}
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = svgFallback; }}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <div style={{
                        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                        background: "linear-gradient(to top, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.2) 60%, transparent 100%)"
                      }} />
                      <div style={{ position: "absolute", top: 12, right: 12 }}>
                        <span className="chip" style={{ background: "rgba(15,23,42,0.85)", color: "var(--accent)", fontWeight: 800, fontSize: 11, backdropFilter: "blur(6px)", border: "1px solid rgba(245,158,11,0.3)" }}>
                          {v.license_plate}
                        </span>
                      </div>
                      <div style={{ position: "absolute", bottom: 12, left: 14 }}>
                        <div style={{ fontWeight: 800, fontSize: 18, color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>
                          {v.make} {v.model}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--accent)", fontWeight: 700 }}>
                          Model Year: {v.year}
                        </div>
                      </div>
                    </div>

                    {/* Vehicle Details */}
                    <div style={{ padding: "16px", display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13, color: "var(--text-muted)", background: "var(--bg-surface)", padding: 12, borderRadius: 8, border: "1px solid var(--border)", marginBottom: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span>🎨 <strong>Color:</strong></span>
                          <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{v.color || "Standard"}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span>📍 <strong>Mileage:</strong></span>
                          <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{v.mileage ? `${Number(v.mileage).toLocaleString()} km` : "Not recorded"}</span>
                        </div>
                        {v.vin && (
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>🔢 <strong>VIN:</strong></span>
                            <span style={{ fontFamily: "monospace", color: "var(--text-primary)" }}>{v.vin}</span>
                          </div>
                        )}
                      </div>

                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleTabClick("store")}
                        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontWeight: 700 }}
                      >
                        <Calendar size={14} /> Book Service for this Car
                      </button>
                    </div>
                  </div>
                );
              })}
              {!vehicles.length && (
                <div className="empty-state" style={{ gridColumn: "1/-1" }}>
                  <div className="empty-icon">🚗</div>
                  <p>No vehicles registered yet.</p>
                  <button className="btn btn-primary btn-sm mt-16" onClick={() => setShowAddVehicleModal(true)}>
                    + Register Your First Vehicle
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- TAB 5: BOOKINGS & RECEIPTS --- */}
        {activeTab === "invoices" && (
          <div className="card">
            <div className="card-header flex-between">
              <div>
                <h2 className="card-title">My Bookings & Receipts</h2>
                <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0 0 0" }}>
                  Official invoices, verified receipts, and direct store order payments
                </p>
              </div>
            </div>
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Invoice / Order #</th><th>Type</th><th>Vehicle / Details</th><th>Total</th><th>Status</th><th>Date</th><th style={{ textAlign: "center" }}>Actions</th></tr></thead>
                <tbody>
                  {invoices.map(inv => {
                    const isPending = inv.status === "pending" || inv.status === "draft";
                    const isApproved = inv.status === "paid" || inv.status === "approved" || inv.status === "issued";
                    const isCancelled = inv.status === "cancelled";

                    return (
                      <tr key={inv.id}>
                        <td><strong style={{ color: "var(--accent)" }}>{inv.invoice_number}</strong></td>
                        <td>
                          <span className="chip" style={{ fontSize: 11 }}>
                            {inv.type === "direct_sale" ? "Store Direct Purchase" : "Workshop Repair"}
                          </span>
                        </td>
                        <td>{inv.make ? `${inv.make} ${inv.model} — ${inv.license_plate}` : "Direct Store Order"}</td>
                        <td><strong>{fmt(inv.total)}</strong></td>
                        <td>
                          {isPending ? (
                            <span className="badge" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.4)" }}>
                              ⏳ Booking Pending
                            </span>
                          ) : isCancelled ? (
                            <span className="badge badge-cancelled">❌ Cancelled</span>
                          ) : (
                            <span className="badge badge-completed">✅ Approved & Paid</span>
                          )}
                        </td>
                        <td>{new Date(inv.created_at).toLocaleDateString()}</td>
                        <td style={{ textAlign: "center" }}>
                          {isPending ? (
                            <span
                              className="chip"
                              style={{ fontSize: 11, color: "var(--text-muted)", background: "var(--bg-surface)", border: "1px solid var(--border)", display: "inline-flex", alignItems: "center", gap: 4 }}
                              title="Official receipt will be available once approved by garage"
                            >
                              <Clock size={12} style={{ color: "var(--accent)" }} /> Awaiting Approval
                            </span>
                          ) : (
                            <button className="btn btn-secondary btn-sm" onClick={() => setPrintInvoice(inv)}>
                              <Printer size={14} /> Receipt
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {!invoices.length && <tr><td colSpan={7}><div className="empty-state"><p>No bookings or receipts available</p></div></td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- TAB 6: NOTIFICATIONS --- */}
        {activeTab === "notifications" && (
          <div className="card">
            <NotificationsPanel userId={user?.id} />
          </div>
        )}

        {/* --- TAB 7: MY PROFILE & ACCOUNT MANAGEMENT --- */}
        {activeTab === "profile" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Customer Profile Banner Card */}
            <div className="card" style={{
              background: "linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(15, 23, 42, 0.6) 100%)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              borderRadius: 14,
              padding: 24
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                <div style={{
                  width: 72, height: 72, borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--accent), #d97706)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 28, fontWeight: 800, color: "#fff",
                  boxShadow: "0 4px 14px rgba(245,158,11,0.4)"
                }}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>{user?.name || profileForm.full_name}</h2>
                    <span className="badge badge-completed" style={{ fontSize: 12, padding: "3px 10px", borderRadius: 12 }}>
                      <ShieldCheck size={13} style={{ marginRight: 4 }} /> Verified Customer
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap", fontSize: 13, color: "var(--text-muted)" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Mail size={14} style={{ color: "var(--accent)" }} /> {user?.email || profileForm.email}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Phone size={14} style={{ color: "var(--accent)" }} /> {user?.phone || profileForm.phone || "Not specified"}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Car size={14} style={{ color: "var(--accent)" }} /> {vehicles.length} Vehicle(s) Registered
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Profile & Security Form Card */}
            <div className="card">
              <div className="card-header" style={{ borderBottom: "1px solid var(--border)", paddingBottom: 14, marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <User size={20} style={{ color: "var(--accent)" }} />
                  <div>
                    <h2 className="card-title" style={{ margin: 0, fontSize: 18 }}>Personal Profile & Security Settings</h2>
                    <p style={{ margin: "2px 0 0 0", fontSize: 13, color: "var(--text-muted)" }}>
                      Update your contact information, delivery address, NIC, and account password
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} noValidate>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 16 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                      <User size={14} style={{ color: "var(--accent)" }} /> Full Name *
                    </label>
                    <input
                      className="form-control"
                      type="text"
                      placeholder="e.g. Anura Perera"
                      value={profileForm.full_name}
                      onChange={e => {
                        setProfileForm(f => ({ ...f, full_name: e.target.value }));
                        if (profileErrors.full_name) setProfileErrors(p => ({ ...p, full_name: null }));
                      }}
                      style={{ borderColor: profileErrors.full_name ? "#dc2626" : undefined }}
                    />
                    {profileErrors.full_name && (
                      <span style={{ fontSize: 11, color: "#dc2626", marginTop: 4, display: "block", fontWeight: 600 }}>
                        ⚠️ {profileErrors.full_name}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                      <Mail size={14} style={{ color: "var(--accent)" }} /> Email Address *
                    </label>
                    <input
                      className="form-control"
                      type="email"
                      placeholder="kasunperera@gmail.com"
                      value={profileForm.email}
                      onChange={e => {
                        setProfileForm(f => ({ ...f, email: e.target.value }));
                        if (profileErrors.email) setProfileErrors(p => ({ ...p, email: null }));
                      }}
                      style={{ borderColor: profileErrors.email ? "#dc2626" : undefined }}
                    />
                    {profileErrors.email ? (
                      <span style={{ fontSize: 11, color: "#dc2626", marginTop: 4, display: "block", fontWeight: 600 }}>
                        ⚠️ {profileErrors.email}
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, display: "block" }}>
                        Email must be valid (e.g. ending with @gmail.com, .com or .lk)
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                      <Phone size={14} style={{ color: "var(--accent)" }} /> Phone Number *
                    </label>
                    <input
                      className="form-control"
                      type="text"
                      placeholder="e.g. 0771234567"
                      value={profileForm.phone}
                      onChange={e => {
                        setProfileForm(f => ({ ...f, phone: e.target.value }));
                        if (profileErrors.phone) setProfileErrors(p => ({ ...p, phone: null }));
                      }}
                      style={{ borderColor: profileErrors.phone ? "#dc2626" : undefined }}
                    />
                    {profileErrors.phone && (
                      <span style={{ fontSize: 11, color: "#dc2626", marginTop: 4, display: "block", fontWeight: 600 }}>
                        ⚠️ {profileErrors.phone}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 20 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                      <Shield size={14} style={{ color: "var(--accent)" }} /> NIC / Identity Card Number
                    </label>
                    <input
                      className="form-control"
                      type="text"
                      placeholder="e.g. 199012345678 / 901234567V"
                      value={profileForm.nic}
                      onChange={e => {
                        setProfileForm(f => ({ ...f, nic: e.target.value }));
                        if (profileErrors.nic) setProfileErrors(p => ({ ...p, nic: null }));
                      }}
                      style={{ borderColor: profileErrors.nic ? "#dc2626" : undefined }}
                    />
                    {profileErrors.nic && (
                      <span style={{ fontSize: 11, color: "#dc2626", marginTop: 4, display: "block", fontWeight: 600 }}>
                        ⚠️ {profileErrors.nic}
                      </span>
                    )}
                  </div>

                  <div className="form-group" style={{ gridColumn: "span 2" }}>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                      <MapPin size={14} style={{ color: "var(--accent)" }} /> Home / Billing & Delivery Address *
                    </label>
                    <input
                      className="form-control"
                      type="text"
                      placeholder="e.g. No. 45, Kandy Road, Malabe"
                      value={profileForm.address}
                      onChange={e => {
                        setProfileForm(f => ({ ...f, address: e.target.value }));
                        if (profileErrors.address) setProfileErrors(p => ({ ...p, address: null }));
                      }}
                      style={{ borderColor: profileErrors.address ? "#dc2626" : undefined }}
                    />
                    {profileErrors.address && (
                      <span style={{ fontSize: 11, color: "#dc2626", marginTop: 4, display: "block", fontWeight: 600 }}>
                        ⚠️ {profileErrors.address}
                      </span>
                    )}
                  </div>
                </div>

                {/* Password Change Section */}
                <div style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  padding: 16,
                  marginBottom: 20
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <KeyRound size={16} style={{ color: "var(--accent)" }} />
                    <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>Change Password (Optional)</h3>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: 12 }}>New Password</label>
                      <input
                        className="form-control"
                        type="password"
                        placeholder="Leave blank to keep current password"
                        value={profileForm.password}
                        onChange={e => {
                          setProfileForm(f => ({ ...f, password: e.target.value }));
                          if (profileErrors.password) setProfileErrors(p => ({ ...p, password: null }));
                        }}
                        style={{ borderColor: profileErrors.password ? "#dc2626" : undefined }}
                      />
                      {profileErrors.password && (
                        <span style={{ fontSize: 11, color: "#dc2626", marginTop: 4, display: "block", fontWeight: 600 }}>
                          ⚠️ {profileErrors.password}
                        </span>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: 12 }}>Confirm New Password</label>
                      <input
                        className="form-control"
                        type="password"
                        placeholder="Re-enter new password"
                        value={profileForm.confirmPassword}
                        onChange={e => {
                          setProfileForm(f => ({ ...f, confirmPassword: e.target.value }));
                          if (profileErrors.confirmPassword) setProfileErrors(p => ({ ...p, confirmPassword: null }));
                        }}
                        style={{ borderColor: profileErrors.confirmPassword ? "#dc2626" : undefined }}
                      />
                      {profileErrors.confirmPassword && (
                        <span style={{ fontSize: 11, color: "#dc2626", marginTop: 4, display: "block", fontWeight: 600 }}>
                          ⚠️ {profileErrors.confirmPassword}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button type="submit" className="btn btn-primary" disabled={profileLoading} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 24px" }}>
                    <Save size={16} /> {profileLoading ? "Saving Changes..." : "Save Profile Changes"}
                  </button>
                </div>
              </form>
            </div>

            {/* Danger Zone: Account Deactivation & Removal */}
            <div className="card" style={{ border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.03)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 10, background: "rgba(239,68,68,0.12)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                  }}>
                    <UserX size={22} style={{ color: "var(--red)" }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--red)" }}>Account Removal & Danger Zone</h3>
                    <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "var(--text-muted)", maxWidth: 640 }}>
                      Deactivating your profile will disable future portal access. Your past vehicle service logs, invoices, and payment receipts will remain archived safely for legal and warranty protection.
                    </p>
                  </div>
                </div>

                <button
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteConfirmModal(true)}
                  style={{
                    color: "var(--red)",
                    borderColor: "rgba(239,68,68,0.4)",
                    background: "rgba(239,68,68,0.1)",
                    fontWeight: 700,
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "10px 18px"
                  }}
                >
                  <Trash2 size={16} /> Deactivate & Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
      </>}
      </div>

      {/* Modal: Account Deactivation Confirmation */}
      {showDeleteConfirmModal && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-card" style={{ maxWidth: 480, border: "1px solid rgba(239,68,68,0.4)" }}>
            <div className="modal-header" style={{ borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <AlertTriangle size={22} style={{ color: "var(--red)" }} />
                <h2 className="modal-title" style={{ color: "var(--red)" }}>Confirm Account Deactivation</h2>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowDeleteConfirmModal(false)}>✕</button>
            </div>

            <div style={{ padding: "16px 0", fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              <p style={{ margin: "0 0 12px 0" }}>
                Are you sure you want to deactivate and remove your account <strong>({user?.email})</strong>?
              </p>
              <ul style={{ margin: 0, paddingLeft: 20, color: "var(--text-muted)", fontSize: 13 }}>
                <li>Your active portal session will end immediately.</li>
                <li>You will no longer be able to log in with this email or phone.</li>
                <li>Vehicle repair histories will be preserved in our garage records for warranty reference.</li>
              </ul>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 12, borderTop: "1px solid var(--border)" }}>
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirmModal(false)} disabled={deleteAccountLoading}>
                Cancel
              </button>
              <button className="btn btn-secondary" onClick={handleDeleteAccount} disabled={deleteAccountLoading} style={{ background: "var(--red)", color: "#fff", borderColor: "var(--red)", fontWeight: 700 }}>
                {deleteAccountLoading ? "Deactivating..." : "Yes, Deactivate My Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: REGISTER NEW VEHICLE --- */}
      {showAddVehicleModal && (
        <div className="modal-overlay" style={{ zIndex: 999 }}>
          <div className="modal-card" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Car size={20} style={{ color: "var(--accent)" }} />
                <h2 className="modal-title">Register New Vehicle</h2>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAddVehicleModal(false)}>✕</button>
            </div>

            <form onSubmit={handleAddVehicleSubmit}>
              <div className="form-group mb-12">
                <label className="form-label">License Plate *</label>
                <input
                  className="form-control"
                  placeholder="e.g. WP CA-1234 / CAR-5678"
                  value={newVehForm.license_plate}
                  onChange={e => setNewVehForm(f => ({ ...f, license_plate: e.target.value }))}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div className="form-group">
                  <label className="form-label">Make *</label>
                  <input
                    className="form-control"
                    placeholder="e.g. Toyota"
                    value={newVehForm.make}
                    onChange={e => setNewVehForm(f => ({ ...f, make: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Model *</label>
                  <input
                    className="form-control"
                    placeholder="e.g. Premio / Axio"
                    value={newVehForm.model}
                    onChange={e => setNewVehForm(f => ({ ...f, model: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div className="form-group">
                  <label className="form-label">Manufacture Year</label>
                  <input
                    className="form-control"
                    type="number"
                    placeholder="2018"
                    value={newVehForm.year}
                    onChange={e => setNewVehForm(f => ({ ...f, year: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Color</label>
                  <input
                    className="form-control"
                    placeholder="e.g. Pearl White"
                    value={newVehForm.color}
                    onChange={e => setNewVehForm(f => ({ ...f, color: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                <div className="form-group">
                  <label className="form-label">Odometer (km)</label>
                  <input
                    className="form-control"
                    type="number"
                    placeholder="45000"
                    value={newVehForm.mileage}
                    onChange={e => setNewVehForm(f => ({ ...f, mileage: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Chassis / VIN (Optional)</label>
                  <input
                    className="form-control"
                    placeholder="NZE161-XXXX"
                    value={newVehForm.vin}
                    onChange={e => setNewVehForm(f => ({ ...f, vin: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddVehicleModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={addingVehicleLoading}>
                  {addingVehicleLoading ? "Saving..." : "Save & Register Vehicle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Appointment Modal */}
      {showEditAptModal && (
        <div className="modal-overlay" onClick={() => setShowEditAptModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 620, width: "100%", maxHeight: "90vh", overflowY: "auto", borderRadius: 14, background: "var(--bg-card)", color: "var(--text-primary)" }}>
            <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 14, borderBottom: "1px solid var(--border)", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(245,158,11,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Pencil size={18} style={{ color: "var(--accent)" }} />
                </div>
                <div>
                  <h2 className="modal-title" style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>Edit Service Appointment</h2>
                  <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "var(--text-muted)" }}>Update your booking details before garage confirmation</p>
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowEditAptModal(false)} style={{ padding: "6px 10px", fontSize: 13, borderRadius: 6 }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditApt}>
              {/* Vehicle Selection */}
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>Select Vehicle</label>
                <select
                  className="form-control"
                  value={editAptForm.vehicle_id}
                  onChange={e => setEditAptForm(f => ({ ...f, vehicle_id: Number(e.target.value) }))}
                  style={{ fontWeight: 600, color: "var(--text-primary)" }}
                >
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.make} {v.model} ({v.license_plate}) - {v.year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date and Time Slot */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>Appointment Date</label>
                  <input
                    type="date"
                    className="form-control"
                    min={new Date().toISOString().split("T")[0]}
                    value={editAptForm.preferred_date}
                    onChange={e => setEditAptForm(f => ({ ...f, preferred_date: e.target.value }))}
                    style={{ fontWeight: 600, color: "var(--text-primary)" }}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>Preferred Time Slot</label>
                  <select
                    className="form-control"
                    value={editAptForm.preferred_time}
                    onChange={e => setEditAptForm(f => ({ ...f, preferred_time: e.target.value }))}
                    style={{ fontWeight: 600, color: "var(--text-primary)" }}
                  >
                    <option value="Morning (08:30 AM - 12:00 PM)">Morning (08:30 AM - 12:00 PM)</option>
                    <option value="Afternoon (01:00 PM - 04:30 PM)">Afternoon (01:00 PM - 04:30 PM)</option>
                    <option value="Evening (04:30 PM - 06:30 PM)">Evening (04:30 PM - 06:30 PM)</option>
                  </select>
                </div>
              </div>

              {/* Services Selection */}
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>
                  <span>Requested Workshop Services ({editAptForm.services.length} selected)</span>
                  <span style={{ fontSize: 11, color: "var(--accent)", fontWeight: 600 }}>Click to select/unselect</span>
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 8, maxHeight: 180, overflowY: "auto", padding: 10, background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 8 }}>
                  {catalogServices.map(srv => {
                    const selected = isServiceSelectedInEdit(srv);
                    return (
                      <div
                        key={srv.id}
                        onClick={() => toggleEditAptService(srv)}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 6,
                          border: `1px solid ${selected ? "var(--accent)" : "var(--border)"}`,
                          background: selected ? "rgba(245, 158, 11, 0.15)" : "var(--bg-card)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 8,
                          fontSize: 12,
                          transition: "all 0.15s"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
                          <div style={{
                            width: 18, height: 18, borderRadius: 4,
                            border: `1px solid ${selected ? "var(--accent)" : "var(--border)"}`,
                            background: selected ? "var(--accent)" : "transparent",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#fff", fontSize: 11, fontWeight: "bold", flexShrink: 0
                          }}>
                            {selected ? "✓" : ""}
                          </div>
                          <span style={{ fontWeight: selected ? 700 : 500, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {srv.name}
                          </span>
                        </div>
                        <span style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700, flexShrink: 0 }}>
                          {fmt(srv.base_price)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Symptom Chips */}
              <div style={{ marginBottom: 14 }}>
                <label className="form-label" style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                  Quick Symptom Selector (Click to add symptoms):
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {[
                    "🔊 Strange noise or vibration",
                    "⚠️ Dashboard warning indicator is ON",
                    "🛑 Soft brakes or pull to side",
                    "❄️ A/C is not cooling properly",
                    "🛢️ Periodic oil & filter service",
                    "🔍 Full vehicle inspection & diagnosis"
                  ].map((chipText, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setEditAptForm(f => ({
                          ...f,
                          customer_notes: f.customer_notes ? `${f.customer_notes} | ${chipText}` : chipText
                        }));
                        toast.success("Added symptom to notes!");
                      }}
                      style={{
                        padding: "4px 8px", borderRadius: 16, fontSize: 11, fontWeight: 600,
                        background: "var(--bg-card)", border: "1px solid var(--border)",
                        color: "var(--text-secondary)", cursor: "pointer"
                      }}
                    >
                      + {chipText}
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer Notes / Issues */}
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>Symptoms or Special Instructions (Optional)</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="e.g. Engine noise during cold start, check brake pads..."
                  value={editAptForm.customer_notes}
                  onChange={e => setEditAptForm(f => ({ ...f, customer_notes: e.target.value }))}
                  style={{ color: "var(--text-primary)" }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditAptModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={editAptLoading}>
                  {editAptLoading ? "Saving Changes..." : "Update Appointment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Print Modal */}
      {printInvoice && (
        <InvoicePrintModal
          invoice={printInvoice}
          jobCard={{ job_number: printInvoice.job_number, customer_name: user?.name, customer_phone: user?.phone }}
          onClose={() => setPrintInvoice(null)}
        />
      )}
    </div>
  );
}
