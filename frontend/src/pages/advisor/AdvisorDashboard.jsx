import { useEffect, useState } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Plus, Search, Eye, ClipboardList, Users, Car, Clock, Calendar, CheckCircle2, ArrowRight, Printer, X, ShieldCheck, Trash2, ShoppingCart } from "lucide-react";
import NewJobCard from "./NewJobCard";
import JobCardPrintModal from "../../components/JobCardPrintModal";
import StoreOrdersTab from "../manager/StoreOrdersTab";

const statusBadge = s => <span className={`badge badge-${s}`}>{s?.replace("_"," ")}</span>;
const fmt = n => `LKR ${Number(n || 0).toLocaleString("en-LK", { minimumFractionDigits: 2 })}`;

export default function AdvisorDashboard() {
  const [activeTab, setActiveTab] = useState("jobs"); // "jobs" | "appointments" | "new-job"
  const [jobs, setJobs] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Appointment to pre-fill in New Job Card
  const [intakeAppointment, setIntakeAppointment] = useState(null);

  // View / Print Job Card Modal State
  const [viewingJob, setViewingJob] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.get("/job-cards"),
      api.get("/job-cards/stats"),
      api.get("/appointments")
    ])
      .then(([jRes, sRes, aRes]) => {
        setJobs(jRes.data || []);
        setStats(sRes.data || {});
        setAppointments(aRes.data || []);
      })
      .catch(() => toast.error("Failed to load data"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApproveAppointment = async (id) => {
    try {
      await api.patch(`/appointments/${id}/status`, { status: "approved" });
      toast.success("Appointment approved! Waiting for customer confirmation.");
      loadData();
    } catch {
      toast.error("Failed to approve appointment");
    }
  };

  const handleCancelAppointment = async (id) => {
    if (!window.confirm("Are you sure you want to cancel and delete this appointment?")) return;
    try {
      await api.delete(`/appointments/${id}`);
      toast.success("Appointment deleted successfully");
      setAppointments(prev => prev.filter(a => a.id !== id));
      loadData();
    } catch {
      toast.error("Failed to delete appointment");
    }
  };

  const handleCheckInAndCreateJob = (apt) => {
    setIntakeAppointment(apt);
    setActiveTab("new-job");
  };

  const handleOpenNewJobTab = () => {
    setIntakeAppointment(null);
    setActiveTab("new-job");
  };

  const handleViewJobDetails = async (jobId) => {
    try {
      const res = await api.get(`/job-cards/${jobId}`);
      setViewingJob(res.data);
    } catch {
      toast.error("Failed to load job card details");
    }
  };

  const handleDeleteJob = async (id, jobNumber) => {
    if (!window.confirm(`Are you sure you want to permanently delete Job Card #${jobNumber}? This cannot be undone.`)) return;
    try {
      await api.delete(`/job-cards/${id}`);
      toast.success("Job card deleted successfully");
      setJobs(prev => prev.filter(j => j.id !== id));
      loadData();
    } catch {
      toast.error("Failed to delete job card");
    }
  };

  const filteredJobs = jobs.filter(j =>
    j.job_number?.toLowerCase().includes(search.toLowerCase()) ||
    j.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    j.license_plate?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredAppointments = appointments.filter(a =>
    a.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.license_plate?.toLowerCase().includes(search.toLowerCase()) ||
    a.customer_phone?.includes(search)
  );

  const pendingAppointmentsCount = appointments.filter(a => a.status === "pending").length;

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">Service Advisor Portal</h1>
          <p className="page-subtitle">Manage customer appointments, vehicle intake & official job cards</p>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="stats-grid">
        {[
          { label: "Appointments", value: appointments.length, icon: Calendar, color: "var(--accent)", glow: "var(--accent-glow)" },
          { label: "Total Jobs", value: stats.total || 0, icon: ClipboardList, color: "var(--accent)", glow: "var(--accent-glow)" },
          { label: "In Progress", value: stats.in_progress || 0, icon: Car, color: "var(--blue)", glow: "var(--blue-glow)" },
          { label: "Completed", value: stats.completed || 0, icon: Users, color: "var(--green)", glow: "var(--green-glow)" },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-glow" style={{ background: s.glow }}></div>
            <div className="stat-icon" style={{ background: s.glow }}><s.icon size={22} style={{ color: s.color }} /></div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Main Tab Switcher */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <button
          onClick={() => { setActiveTab("jobs"); setIntakeAppointment(null); }}
          className={`btn ${activeTab === "jobs" ? "btn-primary" : "btn-secondary"}`}
          style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}
        >
          <ClipboardList size={16} /> Workshop Job Cards ({jobs.length})
        </button>
        <button
          onClick={() => { setActiveTab("appointments"); setIntakeAppointment(null); }}
          className={`btn ${activeTab === "appointments" ? "btn-primary" : "btn-secondary"}`}
          style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}
        >
          <Calendar size={16} /> Service Appointments ({appointments.length})
          {pendingAppointmentsCount > 0 && (
            <span style={{ background: "var(--red)", color: "#fff", fontSize: 10, fontWeight: 800, padding: "1px 6px", borderRadius: 10 }}>
              {pendingAppointmentsCount} new
            </span>
          )}
        </button>
        <button
          onClick={() => { setActiveTab("orders"); setIntakeAppointment(null); }}
          className={`btn ${activeTab === "orders" ? "btn-primary" : "btn-secondary"}`}
          style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}
        >
          <ShoppingCart size={16} /> Store Orders
        </button>
        <button
          onClick={handleOpenNewJobTab}
          className={`btn ${activeTab === "new-job" ? "btn-primary" : "btn-secondary"}`}
          style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}
        >
          <Plus size={16} /> + New Job Card & Intake
        </button>
      </div>

      {/* ─── TAB 1: WORKSHOP JOB CARDS ────────────────────────────────────────── */}
      {activeTab === "jobs" && (
        <div className="card">
          <div className="card-header flex-between" style={{ flexWrap: "wrap", gap: 12 }}>
            <h2 className="card-title">All Job Cards</h2>
            
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <div className="search-bar">
                <Search className="search-icon" size={16}/>
                <input
                  className="form-control"
                  style={{ width: 240 }}
                  placeholder="Search job #, customer, plate..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              {/* In-Tab Primary Action Button */}
              <button
                className="btn btn-primary"
                onClick={handleOpenNewJobTab}
                style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700 }}
              >
                <Plus size={16}/> New Job Card
              </button>
            </div>
          </div>

          {loading ? <div className="loading">Loading...</div> : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Job #</th>
                    <th>Customer</th>
                    <th>Vehicle</th>
                    <th>Plate</th>
                    <th>Customer Approval</th>
                    <th>Status</th>
                    <th>Est. Cost</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map(j => (
                    <tr key={j.id}>
                      <td><strong style={{ color: "var(--accent)" }}>{j.job_number}</strong></td>
                      <td>{j.customer_name}</td>
                      <td>{j.make} {j.model}</td>
                      <td><span className="chip">{j.license_plate}</span></td>
                      <td>
                        <span style={{
                          padding: "3px 10px", borderRadius: 10, fontSize: 11, fontWeight: 700,
                          background: j.customer_approval_status === "approved" ? "rgba(16,185,129,0.15)" : j.customer_approval_status === "rejected" ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)",
                          color: j.customer_approval_status === "approved" ? "var(--green)" : j.customer_approval_status === "rejected" ? "var(--red)" : "var(--accent)"
                        }}>
                          {j.customer_approval_status === "approved" ? "✅ Approved" : j.customer_approval_status === "rejected" ? "❌ Declined" : "⏳ Pending"}
                        </span>
                      </td>
                      <td>{statusBadge(j.status)}</td>
                      <td><strong>LKR {Number(j.estimated_cost||0).toLocaleString()}</strong></td>
                      <td>{new Date(j.created_at).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleViewJobDetails(j.id)} style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
                            <Eye size={14}/> View & Print
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteJob(j.id, j.job_number)}
                            title="Permanently Delete Job Card"
                            style={{ padding: "4px 8px" }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!filteredJobs.length && <tr><td colSpan={9}><div className="empty-state"><p>No job cards found</p></div></td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: SERVICE APPOINTMENTS & INTAKE ─────────────────────────────── */}
      {activeTab === "appointments" && (
        <div className="card">
          <div className="card-header flex-between" style={{ flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 className="card-title">Incoming Customer Service Appointments</h2>
              <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0 0 0" }}>
                Confirm bookings and convert to official Job Cards upon vehicle arrival
              </p>
            </div>
            <div className="search-bar">
              <Search className="search-icon" size={16}/>
              <input
                className="form-control"
                style={{ width: 260 }}
                placeholder="Search customer, phone, plate..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading ? <div className="loading">Loading appointments...</div> : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Preferred Date & Slot</th>
                    <th>Customer</th>
                    <th>Vehicle</th>
                    <th>Requested Services</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map(apt => {
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
                          <div style={{ fontWeight: 600 }}>{apt.customer_name}</div>
                          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{apt.customer_phone}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{apt.make} {apt.model} ({apt.vehicle_year})</div>
                          <span className="chip">{apt.license_plate}</span>
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
                              Total Est: <strong style={{ color: "var(--accent)", fontWeight: 800 }}>{fmt(totalEst)}</strong>
                            </div>
                          )}
                          {apt.customer_notes && (
                            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                              Note: {apt.customer_notes}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${apt.status === "cancelled" || apt.job_approval_status === "rejected" || apt.job_status === "cancelled" ? "badge-cancelled" : `badge-${apt.status}`}`}>
                            {apt.job_approval_status === "rejected" || apt.job_status === "cancelled" || apt.status === "cancelled"
                              ? "❌ Estimate Rejected"
                              : apt.status === "pending"
                              ? "⏳ Pending Review"
                              : apt.status === "approved"
                              ? "🕒 Garage Approved (Awaiting Customer)"
                              : apt.status === "confirmed"
                              ? "📅 Confirmed (Awaiting Vehicle)"
                              : apt.status === "checked_in"
                              ? "🚗 Checked In"
                              : apt.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            {(apt.status === "cancelled" || apt.job_approval_status === "rejected" || apt.job_status === "cancelled") && (
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleCancelAppointment(apt.id)}
                                title="Delete this cancelled appointment"
                                style={{ color: "var(--red)", borderColor: "rgba(239,68,68,0.3)" }}
                              >
                                <Trash2 size={14} /> Delete
                              </button>
                            )}
                            {apt.status === "pending" && (
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => handleApproveAppointment(apt.id)}
                                title="Approve Booking Slot"
                              >
                                <CheckCircle2 size={14} /> Approve Appointment
                              </button>
                            )}
                            {apt.status === "approved" && (
                              <span style={{ fontSize: 12, color: "var(--accent)", fontStyle: "italic", fontWeight: 600 }}>
                                ⏳ Waiting for Customer Confirmation
                              </span>
                            )}
                            {apt.status === "confirmed" && (
                              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleCheckInAndCreateJob(apt)}
                                  title="Vehicle Arrived - Inspect & Create Job Card"
                                >
                                  <Car size={14} /> Vehicle Arrived (Intake & Job Card)
                                </button>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => handleCancelAppointment(apt.id)}
                                  title="Cancel confirmed booking"
                                  style={{ color: "var(--red)", borderColor: "rgba(239,68,68,0.3)" }}
                                >
                                  <XCircle size={14} /> Cancel
                                </button>
                              </div>
                            )}
                            {apt.status === "checked_in" && (
                              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--green)" }}>
                                ✅ Job #{apt.job_number || "Active"}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!filteredAppointments.length && <tr><td colSpan={6}><div className="empty-state"><p>No service appointments found</p></div></td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB: STORE ORDERS ─────────────────────────────────────────────────── */}
      {activeTab === "orders" && <StoreOrdersTab />}

      {/* ─── TAB 3: NEW JOB CARD & VEHICLE INTAKE (INTEGRATED IN-TAB) ───────────── */}
      {activeTab === "new-job" && (
        <NewJobCard
          initialAppointment={intakeAppointment}
          onComplete={(newJob) => {
            setActiveTab("jobs");
            setIntakeAppointment(null);
            loadData();
            if (newJob && newJob.id) {
              handleViewJobDetails(newJob.id);
            }
          }}
          onCancel={() => {
            setActiveTab("jobs");
            setIntakeAppointment(null);
          }}
        />
      )}

      {/* ─── EMBEDDED JOB CARD DETAIL & PRINT MODAL ────────────────────────────── */}
      {viewingJob && (
        <div className="modal-overlay" onClick={() => setViewingJob(null)} style={{ zIndex: 1100 }}>
          <div className="modal-card fade-in" onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 850, maxHeight: "90vh", overflowY: "auto" }}>
            <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: 14 }}>
              <div>
                <h2 className="modal-title" style={{ fontSize: 20, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                  <ClipboardList size={22} style={{ color: "var(--accent)" }} />
                  Job Card — {viewingJob.job_number}
                </h2>
                <p style={{ margin: "3px 0 0 0", fontSize: 13, color: "var(--text-muted)" }}>
                  {viewingJob.make} {viewingJob.model} ({viewingJob.year}) · {viewingJob.license_plate}
                </p>
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowPrintModal(true)}
                  style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700 }}
                >
                  <Printer size={15} /> Print Official Job Card
                </button>
                <button className="modal-close" onClick={() => setViewingJob(null)}>✕</button>
              </div>
            </div>

            <div style={{ padding: "16px 0", display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Customer & Vehicle Details Grid */}
              <div className="grid-2" style={{ gap: 14 }}>
                <div className="card" style={{ padding: 14 }}>
                  <div className="card-header" style={{ marginBottom: 8 }}><h3 className="card-title" style={{ fontSize: 14 }}>Customer & Vehicle</h3></div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
                    <div><span style={{ color: "var(--text-muted)" }}>Customer:</span> <strong>{viewingJob.customer_name}</strong></div>
                    <div><span style={{ color: "var(--text-muted)" }}>Email:</span> {viewingJob.customer_email || "—"}</div>
                    <div><span style={{ color: "var(--text-muted)" }}>Phone:</span> <strong>{viewingJob.customer_phone || "—"}</strong></div>
                    <div><span style={{ color: "var(--text-muted)" }}>License Plate:</span> <span className="chip" style={{ fontWeight: 800 }}>{viewingJob.license_plate}</span></div>
                    <div><span style={{ color: "var(--text-muted)" }}>Vehicle:</span> {viewingJob.make} {viewingJob.model} ({viewingJob.year}) · {viewingJob.color || "Standard"}</div>
                    <div><span style={{ color: "var(--text-muted)" }}>Mileage:</span> {viewingJob.mileage ? `${Number(viewingJob.mileage).toLocaleString()} km` : "Not recorded"}</div>
                  </div>
                </div>

                <div className="card" style={{ padding: 14 }}>
                  <div className="card-header" style={{ marginBottom: 8 }}><h3 className="card-title" style={{ fontSize: 14 }}>Job Status & Approvals</h3></div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>Status:</span>
                      {statusBadge(viewingJob.status)}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>Customer Approval:</span>
                      <span style={{
                        padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 700,
                        background: viewingJob.customer_approval_status === "approved" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
                        color: viewingJob.customer_approval_status === "approved" ? "var(--green)" : "var(--accent)"
                      }}>
                        {viewingJob.customer_approval_status === "approved" ? "✅ Approved" : "⏳ Pending Customer Approval"}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>Estimated Cost:</span>
                      <strong style={{ color: "var(--accent)", fontSize: 15 }}>LKR {Number(viewingJob.estimated_cost||0).toLocaleString()}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>Created At:</span>
                      <span>{new Date(viewingJob.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reported Issue & Diagnosis */}
              <div className="card" style={{ padding: 14 }}>
                <h3 className="card-title" style={{ fontSize: 14, marginBottom: 8 }}>Reported Issues & Technical Diagnosis</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase" }}>Reported Issue:</div>
                    <div style={{ padding: "8px 12px", background: "var(--bg-surface)", borderRadius: 6, border: "1px solid var(--border)", marginTop: 4 }}>
                      {viewingJob.reported_issue || "No specific issue recorded"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase" }}>Advisor Diagnosis Notes:</div>
                    <div style={{ padding: "8px 12px", background: "var(--bg-surface)", borderRadius: 6, border: "1px solid var(--border)", marginTop: 4 }}>
                      {viewingJob.diagnosis_notes || "Multi-point check & general service assessment"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
              <button className="btn btn-secondary" onClick={() => setViewingJob(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => setShowPrintModal(true)} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Printer size={15} /> Print Official Job Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Print Modal */}
      {showPrintModal && viewingJob && (
        <JobCardPrintModal
          jobCard={viewingJob}
          tasks={viewingJob.tasks || []}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
}
