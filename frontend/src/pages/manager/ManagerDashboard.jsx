import { useEffect, useState, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import toast from "react-hot-toast";
import {
  CheckCircle, XCircle, TrendingUp, Briefcase, Clock, DollarSign,
  Download, ShieldCheck, Package, ClipboardList, Users, AlertTriangle,
  Plus, TrendingDown, Edit2, Trash2, Search, Bell, BarChart2, Wrench,
  Calendar, Car, ShoppingCart, CheckSquare
} from "lucide-react";
import FinancialReportsTab from "./FinancialReportsTab";
import ServicesItemsTab from "./ServicesItemsTab";
import StoreOrdersTab from "./StoreOrdersTab";
import garageBanner from "../../assets/garage_banner.jpg";

const fmt = n => `LKR ${Number(n || 0).toLocaleString("en-LK", { minimumFractionDigits: 2 })}`;

const STATUS_COLORS = {
  pending: "var(--accent)", in_progress: "var(--blue)", qc_check: "var(--purple)",
  completed: "var(--green)", invoiced: "#10b981", cancelled: "var(--red)"
};

const ROLES = ["manager", "advisor", "supervisor", "technician", "qc_inspector", "storekeeper", "cashier", "customer"];
const CATS = ["spare_part", "paint", "consumable", "tool", "other"];
const JOB_STATUSES = ["pending", "in_progress", "qc_check", "completed", "invoiced"];

// ─── Tab: Overview ───────────────────────────────────────────────────────────
function OverviewTab({ data, storeOrders = [], onSelectTab, onApproveOrder, onApprove, onReject }) {
  const { jobStats: j, revenueStats: r, pendingApprovals: pa, inventorySummary: lowStock } = data || {};

  const exportCSV = () => {
    const rows = [
      ["Metric", "Value"],
      ["Total Revenue", r?.total_revenue || 0],
      ["Today Revenue", r?.today_revenue || 0],
      ["Monthly Revenue", r?.month_revenue || 0],
      ["Store Orders", storeOrders.length],
      ["Pending Jobs", j?.pending || 0],
      ["In Progress Jobs", j?.in_progress || 0],
      ["Completed Jobs", j?.completed || 0],
      ["Invoiced Jobs", j?.invoiced || 0],
    ];
    const csv = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `PitStopPro_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast.success("CSV Report downloaded!");
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={exportCSV}><Download size={15} /> Export CSV</button>
      </div>



      {/* Stats Grid */}
      <div className="stats-grid">
        {[
          { label: "Total Revenue", value: fmt(r?.total_revenue), icon: TrendingUp, color: "var(--accent)", glow: "var(--accent-glow)" },
          { label: "Today Revenue", value: fmt(r?.today_revenue), icon: DollarSign, color: "var(--green)", glow: "var(--green-glow)" },
          { label: "Store Orders", value: storeOrders?.length || 0, icon: ShoppingCart, color: "var(--accent)", glow: "var(--accent-glow)" },
          { label: "Active Jobs", value: (j?.in_progress || 0) + (j?.qc_check || 0), icon: Briefcase, color: "var(--purple)", glow: "var(--purple-glow)" },
          { label: "Pending Jobs", value: j?.pending || 0, icon: Clock, color: "var(--accent)", glow: "var(--accent-glow)" },
          { label: "Pending Approvals", value: pa?.length || 0, icon: CheckCircle, color: "var(--red)", glow: "var(--red-glow)" },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-glow" style={{ background: s.glow }}></div>
            <div className="stat-icon" style={{ background: s.glow }}><s.icon size={22} style={{ color: s.color }} /></div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>





      {/* Pending Approvals */}
      {pa?.length > 0 && (
        <div className="card mt-24">
          <div className="card-header">
            <h2 className="card-title">⏳ High-Value Estimates Awaiting Approval (&gt; LKR 5,000)</h2>
            <span className="badge badge-pending">{pa.length} pending</span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Job #</th><th>Customer</th><th>Vehicle</th><th>Estimated Cost</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>
                {pa.map(j => (
                  <tr key={j.id}>
                    <td><strong style={{ color: "var(--accent)" }}>{j.job_number}</strong></td>
                    <td>{j.customer_name}</td>
                    <td>{j.make} {j.model} — <span className="chip">{j.license_plate}</span></td>
                    <td><strong className="text-accent">{fmt(j.estimated_cost)}</strong></td>
                    <td>{new Date(j.intake_date || Date.now()).toLocaleDateString()}</td>
                    <td>
                      <div className="actions">
                        <button className="btn btn-success btn-sm" onClick={() => onApprove(j.id)}><CheckCircle size={14} /> Approve</button>
                        <button className="btn btn-danger btn-sm" onClick={() => onReject(j.id)}><XCircle size={14} /> Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Low Stock Alert */}
      {lowStock?.length > 0 && (
        <div className="card mt-24">
          <div className="card-header">
            <h2 className="card-title"><AlertTriangle size={16} style={{ color: "var(--red)", marginRight: 6 }} />Low Stock Alert</h2>
            <span className="badge badge-cancelled">{lowStock.length} items low</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 12 }}>
            {lowStock.map(i => (
              <div key={i.id} style={{ background: "var(--bg-card)", border: "1px solid rgba(239,68,68,0.3)", borderLeft: "3px solid var(--red)", borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{i.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{i.item_code}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--red)", margin: "8px 0" }}>{i.quantity} <span style={{ fontSize: 12 }}>{i.unit}</span></div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Threshold: {i.low_stock_threshold}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!pa?.length && !lowStock?.length) && (
        <div className="card mt-24">
          <div className="empty-state"><div className="empty-icon">✅</div><p>All clear! No pending approvals or low stock alerts.</p></div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Job Cards ────────────────────────────────────────────────────────────
function JobCardsTab() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/manager/all-jobs");
      setJobs(res.data);
    } catch { toast.error("Failed to load job cards"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      await api.patch(`/manager/jobs/${id}/status`, { status });
      toast.success(`Job status updated to ${status.replace("_", " ")}`);
      load();
    } catch { toast.error("Failed to update status"); }
    finally { setUpdatingId(null); }
  };

  const approveEstimate = async (id) => {
    setUpdatingId(id);
    try {
      await api.patch(`/manager/approvals/${id}/approve`);
      toast.success("Job estimate approved! Customer can now authorize repair.");
      load();
    } catch {
      toast.error("Failed to approve job estimate");
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteJob = async (id, jobNumber) => {
    if (!window.confirm(`Are you sure you want to permanently delete Job Card #${jobNumber}? This cannot be undone.`)) return;
    try {
      await api.delete(`/job-cards/${id}`);
      toast.success("Job card deleted successfully");
      setJobs(prev => prev.filter(j => j.id !== id));
    } catch {
      toast.error("Failed to delete job card");
    }
  };

  const getValidNextStatuses = (j) => {
    if (j.status === "pending") {
      if (j.customer_approval_status !== "approved") {
        return [
          { value: "pending", label: "1. Pending (Awaiting Customer)" }
        ];
      }
      return [
        { value: "pending", label: "1. Pending (Customer Approved)" },
        { value: "in_progress", label: "2. In Progress (Start Repair ➔)" }
      ];
    }
    if (j.status === "in_progress") {
      return [
        { value: "in_progress", label: "2. In Progress (Current)" },
        { value: "qc_check", label: "3. QC Check (Send to QC ➔)" }
      ];
    }
    if (j.status === "qc_check") {
      return [
        { value: "qc_check", label: "3. QC Check (Current)" },
        { value: "completed", label: "4. Completed (Pass QC ➔)" },
        { value: "in_progress", label: "↩ Bay Repair (Rework)" }
      ];
    }
    if (j.status === "completed") {
      return [
        { value: "completed", label: "4. Completed (Current)" },
        { value: "invoiced", label: "5. Invoiced (Finalize ➔)" }
      ];
    }
    if (j.status === "invoiced") {
      return [
        { value: "invoiced", label: "5. Invoiced & Settled (Final)" }
      ];
    }
    return JOB_STATUSES.map(s => ({ value: s, label: s.replace("_", " ") }));
  };

  const filtered = jobs.filter(j => {
    const matchSearch = !search || j.job_number?.toLowerCase().includes(search.toLowerCase()) ||
      j.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      j.license_plate?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || j.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusCounts = JOB_STATUSES.reduce((acc, s) => ({ ...acc, [s]: jobs.filter(j => j.status === s).length }), {});

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <button onClick={() => setStatusFilter("all")} className={`btn btn-sm ${statusFilter === "all" ? "btn-primary" : "btn-secondary"}`}>
          All ({jobs.length})
        </button>
        {JOB_STATUSES.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`btn btn-sm ${statusFilter === s ? "btn-primary" : "btn-secondary"}`}>
            {s.replace("_", " ")} ({statusCounts[s] || 0})
          </button>
        ))}
      </div>
      <div className="card">
        <div className="card-header flex-between" style={{ flexWrap: "wrap", gap: 12 }}>
          <h2 className="card-title">All Job Cards</h2>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div className="search-bar">
              <Search className="search-icon" size={15} />
              <input className="form-control" style={{ width: 260 }} placeholder="Search job #, customer, plate..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button
              className="btn btn-primary"
              onClick={() => navigate("/advisor/new-job", { state: { returnTo: "/manager/jobs" } })}
              style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700 }}
            >
              <Plus size={15} /> New Job Card
            </button>
          </div>
        </div>
        {loading ? <div className="loading">Loading...</div> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Job #</th><th>Customer</th><th>Vehicle</th><th>Plate</th>
                  <th>Status</th><th>Est. Cost</th><th>Date</th><th>Update Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(j => (
                  <tr key={j.id}>
                    <td><strong style={{ color: "var(--accent)" }}>{j.job_number}</strong></td>
                    <td>{j.customer_name}</td>
                    <td>{j.make} {j.model}</td>
                    <td><span className="chip">{j.license_plate}</span></td>
                    <td>
                      <span className="badge" style={{ background: `${STATUS_COLORS[j.status]}22`, color: STATUS_COLORS[j.status], borderColor: `${STATUS_COLORS[j.status]}44`, border: "1px solid" }}>
                        {j.status?.replace("_", " ")}
                      </span>
                    </td>
                    <td>{fmt(j.estimated_cost)}</td>
                    <td>{new Date(j.created_at).toLocaleDateString()}</td>
                    <td>
                      {j.status === "invoiced" ? (
                        <span style={{ color: "var(--green)", fontWeight: 700, fontSize: 12, display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <CheckCircle size={14} /> Settled
                        </span>
                      ) : j.status === "pending" && j.approval_status === "pending" ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <button
                            className="btn btn-warning btn-sm"
                            disabled={updatingId === j.id}
                            onClick={() => approveEstimate(j.id)}
                            style={{ padding: "4px 8px", fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}
                          >
                            <CheckCircle size={12} /> Approve Estimate
                          </button>
                          <span style={{ fontSize: 10, color: "var(--accent)", fontWeight: 600 }}>⏳ Mgr Approval Needed</span>
                        </div>
                      ) : j.status === "pending" && j.customer_approval_status !== "approved" ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          <span style={{
                            background: "rgba(245,158,11,0.12)", color: "var(--accent)", border: "1px solid rgba(245,158,11,0.3)",
                            borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4
                          }}>
                            🔒 Awaiting Customer Approval
                          </span>
                          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Cannot start repair until customer approves</span>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          <select
                            value={j.status}
                            onChange={e => updateStatus(j.id, e.target.value)}
                            disabled={updatingId === j.id}
                            style={{ padding: "4px 8px", borderRadius: 6, background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)", fontSize: 12, cursor: "pointer" }}>
                            {getValidNextStatuses(j).map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => deleteJob(j.id, j.job_number)}
                        title="Permanently Delete Job Card"
                        style={{ padding: "4px 8px" }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
                {!filtered.length && <tr><td colSpan={9}><div className="empty-state"><p>No job cards found</p></div></td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Service Progress Legend */}
      <div className="card mt-24">
        <div className="card-header"><h2 className="card-title">📊 Sequential Service Progress Pipeline</h2></div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", padding: "8px 0" }}>
          {[
            { key: "pending", label: "1. PENDING (Estimate & Approvals)" },
            { key: "in_progress", label: "2. IN PROGRESS (Bay Repair)" },
            { key: "qc_check", label: "3. QC CHECK (Multi-point Testing)" },
            { key: "completed", label: "4. COMPLETED (Ready for Pickup)" },
            { key: "invoiced", label: "5. INVOICED (Settlement & Handover)" }
          ].map((s, i, arr) => (
            <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ background: `${STATUS_COLORS[s.key]}22`, color: STATUS_COLORS[s.key], border: `1px solid ${STATUS_COLORS[s.key]}44`, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>
                {s.label}
              </span>
              {i < arr.length - 1 && <span style={{ color: "var(--text-muted)", fontWeight: 800 }}>➔</span>}
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
          Job cards transition sequentially through each operational stage. When status is set to <strong style={{ color: "var(--green)" }}>completed</strong>, the customer will automatically receive an in-app notification and email.
        </p>
      </div>
    </div>
  );
}

// ─── Tab: Approvals ────────────────────────────────────────────────────────────
function ApprovalsTab() {
  const [jobApprovals, setJobApprovals] = useState([]);
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState("jobs");

  const load = useCallback(async () => {
    try {
      const [jRes, rRes] = await Promise.all([
        api.get("/manager/approvals"),
        api.get("/manager/requisitions"),
      ]);
      setJobApprovals(jRes.data);
      setRequisitions(rRes.data);
    } catch { toast.error("Failed to load approvals"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const approveJob = async id => {
    try { await api.patch(`/manager/approvals/${id}/approve`); toast.success("Job estimate approved & repair authorized"); load(); }
    catch { toast.error("Failed to approve job"); }
  };
  const rejectJob = async id => {
    if (!window.confirm("Are you sure you want to reject this high-value estimate? This will permanently cancel and delete the job card for both customer and workshop.")) return;
    try {
      await api.patch(`/manager/approvals/${id}/reject`);
      toast.success("Job estimate rejected & job card deleted");
      setJobApprovals(prev => prev.filter(j => j.id !== id));
      load();
    }
    catch { toast.error("Failed to reject job"); }
  };
  const approveReq = async id => {
    try { await api.patch(`/manager/requisitions/${id}/approve`); toast.success("Requisition approved"); load(); }
    catch { toast.error("Failed"); }
  };
  const rejectReq = async id => {
    try { await api.patch(`/manager/requisitions/${id}/reject`); toast.success("Requisition rejected"); load(); }
    catch { toast.error("Failed"); }
  };

  const pendingReqs = requisitions.filter(r => r.status === "pending");

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <button onClick={() => setSubTab("jobs")} className={`btn btn-sm ${subTab === "jobs" ? "btn-primary" : "btn-secondary"}`}>
          Job Estimate Approvals ({jobApprovals.length})
        </button>
        <button onClick={() => setSubTab("requisitions")} className={`btn btn-sm ${subTab === "requisitions" ? "btn-primary" : "btn-secondary"}`}>
          Material Requisitions ({pendingReqs.length} pending)
        </button>
      </div>

      {loading ? <div className="loading">Loading...</div> : <>
        {subTab === "jobs" && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">⏳ High-Value Job Estimate Approvals (&gt; LKR 5,000)</h2>
              <span className="badge badge-pending">{jobApprovals.length} pending</span>
            </div>
            {!jobApprovals.length ? (
              <div className="empty-state"><div className="empty-icon">✅</div><p>No pending job approvals</p></div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Job #</th><th>Customer</th><th>Vehicle</th><th>Estimated Cost</th><th>Date</th><th>Actions</th></tr></thead>
                  <tbody>
                    {jobApprovals.map(j => (
                      <tr key={j.id}>
                        <td><strong style={{ color: "var(--accent)" }}>{j.job_number}</strong></td>
                        <td>{j.customer_name}</td>
                        <td>{j.make} {j.model} — <span className="chip">{j.license_plate}</span></td>
                        <td><strong className="text-accent">{fmt(j.estimated_cost)}</strong></td>
                        <td>{new Date(j.intake_date || Date.now()).toLocaleDateString()}</td>
                        <td>
                          <div className="actions">
                            <button className="btn btn-success btn-sm" onClick={() => approveJob(j.id)}><CheckCircle size={14} /> Approve</button>
                            <button className="btn btn-danger btn-sm" onClick={() => rejectJob(j.id)}><XCircle size={14} /> Reject</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {subTab === "requisitions" && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">📦 Material Requisition Requests</h2>
              <span className="badge badge-pending">{pendingReqs.length} pending</span>
            </div>
            {!requisitions.length ? (
              <div className="empty-state"><div className="empty-icon">📦</div><p>No requisitions found</p></div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Job #</th><th>Item</th><th>Qty Needed</th><th>Requested By</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
                  <tbody>
                    {requisitions.map(r => (
                      <tr key={r.id}>
                        <td><span className="chip">{r.job_number}</span></td>
                        <td><strong>{r.item_name}</strong></td>
                        <td>{r.quantity_needed}</td>
                        <td>{r.requested_by_name}</td>
                        <td>
                          <span className={`badge badge-${r.status === "pending" ? "pending" : r.status === "approved" ? "completed" : "cancelled"}`}>
                            {r.status}
                          </span>
                        </td>
                        <td>{new Date(r.created_at).toLocaleDateString()}</td>
                        <td>
                          {r.status === "pending" && (
                            <div className="actions">
                              <button className="btn btn-success btn-sm" onClick={() => approveReq(r.id)}><CheckCircle size={14} /> Approve</button>
                              <button className="btn btn-danger btn-sm" onClick={() => rejectReq(r.id)}><XCircle size={14} /> Reject</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </>}
    </div>
  );
}

// ─── Tab: Inventory ────────────────────────────────────────────────────────────
function InventoryTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [stockModal, setStockModal] = useState(null);
  const [stockType, setStockType] = useState("stock_in");
  const [stockQty, setStockQty] = useState("");
  const [stockRef, setStockRef] = useState("");
  const [form, setForm] = useState({ item_code: "", name: "", category: "spare_part", unit: "piece", unit_price: "", quantity: "0", low_stock_threshold: "5", supplier: "" });

  const load = useCallback(async () => {
    try { const res = await api.get("/inventory"); setItems(res.data); }
    catch { toast.error("Failed to load inventory"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const sf = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const saveItem = async () => {
    try {
      if (editItem) {
        await api.patch(`/inventory/${editItem.id}`, form);
        toast.success("Item updated");
      } else {
        await api.post("/inventory", form);
        toast.success("Item added");
      }
      setShowAdd(false); setEditItem(null);
      setForm({ item_code: "", name: "", category: "spare_part", unit: "piece", unit_price: "", quantity: "0", low_stock_threshold: "5", supplier: "" });
      load();
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ item_code: item.item_code, name: item.name, category: item.category, unit: item.unit, unit_price: item.unit_price, quantity: item.quantity, low_stock_threshold: item.low_stock_threshold, supplier: item.supplier || "" });
    setShowAdd(true);
  };

  const deleteItem = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try { await api.delete(`/inventory/${id}`); toast.success("Item deleted"); load(); }
    catch (err) { toast.error(err.response?.data?.message || "Failed to delete"); }
  };

  const doStock = async () => {
    try {
      const ep = stockType === "stock_in" ? `/inventory/${stockModal.id}/stock-in` : `/inventory/${stockModal.id}/stock-out`;
      await api.post(ep, { quantity: parseFloat(stockQty), reference: stockRef });
      toast.success("Stock updated"); setStockModal(null); setStockQty(""); setStockRef(""); load();
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
  };

  const filtered = items.filter(i => {
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.item_code.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "all" || i.category === catFilter;
    return matchSearch && matchCat;
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["all", ...CATS].map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={`btn btn-sm ${catFilter === c ? "btn-primary" : "btn-secondary"}`}>
              {c === "all" ? `All (${items.length})` : c.replace("_", " ")}
            </button>
          ))}
        </div>
        <button className="btn btn-primary" onClick={() => { setEditItem(null); setForm({ item_code: "", name: "", category: "spare_part", unit: "piece", unit_price: "", quantity: "0", low_stock_threshold: "5", supplier: "" }); setShowAdd(true); }}>
          <Plus size={15} /> Add Item
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">📦 Inventory Items</h2>
          <div className="search-bar">
            <Search className="search-icon" size={15} />
            <input className="form-control" style={{ width: 240 }} placeholder="Search name or code..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        {loading ? <div className="loading">Loading...</div> : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Code</th><th>Name</th><th>Category</th><th>Stock</th><th>Unit Price</th><th>Supplier</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map(i => (
                  <tr key={i.id}>
                    <td><span className="chip">{i.item_code}</span></td>
                    <td><strong>{i.name}</strong></td>
                    <td><span className="badge badge-pending">{i.category.replace("_", " ")}</span></td>
                    <td style={{ color: i.quantity <= i.low_stock_threshold ? "var(--red)" : "var(--green)", fontWeight: 600 }}>
                      {i.quantity} {i.unit}
                      {i.quantity <= i.low_stock_threshold && <span style={{ fontSize: 10, marginLeft: 4 }}>⚠️</span>}
                    </td>
                    <td>{fmt(i.unit_price)}</td>
                    <td style={{ color: "var(--text-muted)" }}>{i.supplier || "—"}</td>
                    <td>
                      <div className="actions">
                        <button className="btn btn-success btn-sm" onClick={() => { setStockModal(i); setStockType("stock_in"); }} title="Stock In"><TrendingUp size={13} /></button>
                        <button className="btn btn-danger btn-sm" onClick={() => { setStockModal(i); setStockType("stock_out"); }} title="Stock Out"><TrendingDown size={13} /></button>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(i)} title="Edit"><Edit2 size={13} /></button>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteItem(i.id, i.name)} title="Delete"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!filtered.length && <tr><td colSpan={7}><div className="empty-state"><p>No inventory items found</p></div></td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editItem ? `Edit — ${editItem.name}` : "Add Inventory Item"}</h2>
              <button className="modal-close" onClick={() => setShowAdd(false)}>×</button>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Item Code</label><input className="form-control" placeholder="OIL-5W30-1L" value={form.item_code} onChange={sf("item_code")} /></div>
              <div className="form-group"><label className="form-label">Name</label><input className="form-control" placeholder="Engine Oil 5W-30 (1L)" value={form.name} onChange={sf("name")} /></div>
            </div>
            <div className="form-row-3">
              <div className="form-group"><label className="form-label">Category</label>
                <select className="form-control" value={form.category} onChange={sf("category")}>
                  {CATS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Unit</label><input className="form-control" placeholder="piece" value={form.unit} onChange={sf("unit")} /></div>
              <div className="form-group"><label className="form-label">Unit Price (LKR)</label><input className="form-control" type="number" value={form.unit_price} onChange={sf("unit_price")} /></div>
            </div>
            <div className="form-row-3">
              <div className="form-group"><label className="form-label">Quantity</label><input className="form-control" type="number" value={form.quantity} onChange={sf("quantity")} /></div>
              <div className="form-group"><label className="form-label">Low Stock Threshold</label><input className="form-control" type="number" value={form.low_stock_threshold} onChange={sf("low_stock_threshold")} /></div>
              <div className="form-group"><label className="form-label">Supplier</label><input className="form-control" value={form.supplier} onChange={sf("supplier")} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveItem}>{editItem ? "Save Changes" : "Add Item"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Adjust Modal */}
      {stockModal && (
        <div className="modal-overlay" onClick={() => setStockModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{stockType === "stock_in" ? "📈 Stock In" : "📉 Stock Out"} — {stockModal.name}</h2>
              <button className="modal-close" onClick={() => setStockModal(null)}>×</button>
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
              Current stock: <strong style={{ color: "var(--text-primary)" }}>{stockModal.quantity} {stockModal.unit}</strong>
            </div>
            <div className="form-group"><label className="form-label">Quantity</label><input className="form-control" type="number" value={stockQty} onChange={e => setStockQty(e.target.value)} placeholder={`Qty in ${stockModal.unit}`} /></div>
            <div className="form-group"><label className="form-label">Reference (PO #, etc.)</label><input className="form-control" value={stockRef} onChange={e => setStockRef(e.target.value)} /></div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setStockModal(null)}>Cancel</button>
              <button className={`btn ${stockType === "stock_in" ? "btn-success" : "btn-danger"}`} onClick={doStock}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Staff Management ───────────────────────────────────────────────────
function StaffTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [form, setForm] = useState({ full_name: "", email: "", password: "", phone: "", role: "advisor" });

  // Edit User Profile Modal State
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ full_name: "", email: "", phone: "", role: "advisor", is_active: 1, password: "" });
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    try { const res = await api.get("/manager/staff"); setUsers(res.data); }
    catch { toast.error("Failed to load staff"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const sf = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const sef = k => e => setEditForm(f => ({ ...f, [k]: e.target.value }));

  const createStaff = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/manager/staff", form);
      toast.success(`Staff member ${form.full_name} created!`);
      setForm({ full_name: "", email: "", password: "", phone: "", role: "advisor" });
      setShowAdd(false); load();
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setEditForm({
      full_name: u.full_name || "",
      email: u.email || "",
      phone: u.phone || "",
      role: u.role || "advisor",
      is_active: u.is_active ? 1 : 0,
      password: ""
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setUpdating(true);
    try {
      const payload = {
        full_name: editForm.full_name,
        email: editForm.email,
        phone: editForm.phone,
        role: editForm.role,
        is_active: Number(editForm.is_active),
      };
      if (editForm.password && editForm.password.trim().length > 0) {
        payload.password = editForm.password.trim();
      }
      await api.put(`/manager/staff/${editingUser.id}`, payload);
      toast.success(`Profile for "${editForm.full_name}" updated successfully!`);
      setEditingUser(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update user profile");
    } finally {
      setUpdating(false);
    }
  };

  const updateRole = async (id, role) => {
    try { await api.put(`/manager/staff/${id}`, { role }); toast.success("Role updated"); load(); }
    catch { toast.error("Failed to update role"); }
  };

  const toggleStatus = async (id, current) => {
    try {
      await api.put(`/manager/staff/${id}`, { is_active: current ? 0 : 1 });
      toast.success(current ? "Access revoked" : "User activated");
      load();
    } catch { toast.error("Failed"); }
  };

  const deleteUser = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"? This action cannot be undone.`)) return;
    try { await api.delete(`/manager/staff/${id}`); toast.success("User deleted"); load(); }
    catch (err) { toast.error(err.response?.data?.message || "Failed"); }
  };

  const filteredUsers = users.filter(u => {
    const matchSearch =
      !search ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.toLowerCase().includes(search.toLowerCase()) ||
      u.role?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div>
      {/* Top Action Bar */}

      {/* Top Action Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button
            className={`btn btn-sm ${roleFilter === "all" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setRoleFilter("all")}
          >
            All Users ({users.length})
          </button>
          {ROLES.map(r => {
            const count = users.filter(u => u.role === r).length;
            if (count === 0 && r !== "customer" && r !== "technician") return null;
            return (
              <button
                key={r}
                className={`btn btn-sm ${roleFilter === r ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setRoleFilter(r)}
              >
                {r.replace("_", " ")} ({count})
              </button>
            );
          })}
        </div>

        <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {showAdd ? "Cancel" : <><Plus size={15} /> Add Garage Staff</>}
        </button>
      </div>

      {/* Add New Staff Form */}
      {showAdd && (
        <form onSubmit={createStaff} className="card fade-in" style={{ marginBottom: 20, border: "1px solid rgba(245,158,11,0.3)" }}>
          <div className="card-header"><h2 className="card-title">➕ Add New Staff Member</h2></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Full Name *</label><input className="form-control" required value={form.full_name} onChange={sf("full_name")} placeholder="Nimal Perera" /></div>
            <div className="form-group"><label className="form-label">Email *</label><input className="form-control" type="email" required value={form.email} onChange={sf("email")} placeholder="nimal@pitstoppro.lk" /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Password *</label><input className="form-control" type="password" required value={form.password} onChange={sf("password")} placeholder="••••••••" /></div>
            <div className="form-group"><label className="form-label">Phone</label><input className="form-control" value={form.phone} onChange={sf("phone")} placeholder="0771234567" /></div>
          </div>
          <div className="form-group"><label className="form-label">Role</label>
            <select className="form-control" value={form.role} onChange={sf("role")}>
              {ROLES.map(r => <option key={r} value={r}>{r.replace("_", " ").toUpperCase()}</option>)}
            </select>
          </div>
          <div className="modal-footer"><button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Create Staff Member"}</button></div>
        </form>
      )}


      {/* Staff & User Table Card */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 className="card-title">🛡️ Garage Staff & User Profile Management</h2>
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0 0 0" }}>
              Manager has full access to edit names, emails, phones, roles, active status & reset passwords
            </p>
          </div>

          <div className="search-bar">
            <Search className="search-icon" size={15} />
            <input
              className="form-control"
              style={{ width: 240 }}
              placeholder="Search by name, email, phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? <div className="loading">Loading staff & users...</div> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>User Profile</th>
                  <th>Contact Details</th>
                  <th>Current Role</th>
                  <th>Account Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{u.full_name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                        Joined: {new Date(u.created_at || Date.now()).toLocaleDateString()}
                        {u.role === "manager" && (
                          <span style={{ marginLeft: 6, background: "rgba(245,158,11,0.2)", color: "#fbbf24", padding: "1px 6px", borderRadius: 4, fontWeight: 700, fontSize: 10 }}>
                            Admin
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13 }}>{u.email}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{u.phone || "No phone"}</div>
                    </td>
                    <td>
                      <select
                        value={u.role}
                        onChange={e => updateRole(u.id, e.target.value)}
                        style={{
                          padding: "5px 10px", borderRadius: 6, background: "var(--bg-card)",
                          border: "1px solid var(--accent)", color: "var(--accent)", fontSize: 12, fontWeight: 700
                        }}
                      >
                        {ROLES.map(r => <option key={r} value={r}>{r.replace("_", " ").toUpperCase()}</option>)}
                      </select>
                    </td>
                    <td>
                      <span className={`badge ${u.is_active ? "badge-completed" : "badge-cancelled"}`}>
                        {u.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="actions" style={{ display: "flex", gap: 6 }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEditModal(u)}
                          title="Edit Full Profile"
                          style={{ display: "flex", alignItems: "center", gap: 4 }}
                        >
                          <Edit2 size={13} /> Edit Profile
                        </button>
                        <button
                          className={`btn btn-sm ${u.is_active ? "btn-danger" : "btn-success"}`}
                          onClick={() => toggleStatus(u.id, u.is_active)}
                        >
                          {u.is_active ? "Revoke" : "Activate"}
                        </button>
                        {u.role !== "manager" && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => deleteUser(u.id, u.full_name)}
                            title="Delete User Account"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit User Profile Modal */}
      {editingUser && (
        <div className="modal-backdrop" style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, padding: 20
        }}>
          <div className="card fade-in" style={{ width: "100%", maxWidth: 540, boxShadow: "0 20px 40px rgba(0,0,0,0.8)", border: "1px solid var(--accent)" }}>
            <div className="card-header" style={{ borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
              <div>
                <h2 className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Edit2 size={18} style={{ color: "var(--accent)" }} /> Edit User Profile
                </h2>
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0 0 0" }}>
                  Updating details for <strong>{editingUser.full_name}</strong> (ID: #{editingUser.id})
                </p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: 18, cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ padding: "16px 0 0 0" }}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    className="form-control"
                    required
                    value={editForm.full_name}
                    onChange={sef("full_name")}
                    placeholder="Full Name"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    className="form-control"
                    type="email"
                    required
                    value={editForm.email}
                    onChange={sef("email")}
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    className="form-control"
                    value={editForm.phone}
                    onChange={sef("phone")}
                    placeholder="0771234567"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Assigned Role</label>
                  <select
                    className="form-control"
                    value={editForm.role}
                    onChange={sef("role")}
                  >
                    {ROLES.map(r => (
                      <option key={r} value={r}>{r.replace("_", " ").toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Account Access Status</label>
                  <select
                    className="form-control"
                    value={editForm.is_active}
                    onChange={sef("is_active")}
                  >
                    <option value={1}>Active (Can Log In)</option>
                    <option value={0}>Revoked / Inactive (Disabled)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Reset Password <span style={{ fontSize: 10, color: "var(--text-muted)" }}>(Optional)</span>
                  </label>
                  <input
                    className="form-control"
                    type="password"
                    value={editForm.password}
                    onChange={sef("password")}
                    placeholder="Leave blank to keep current"
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingUser(null)}
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={updating}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  {updating ? "Saving Changes..." : "Save Profile Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Appointments ────────────────────────────────────────────────────────
function AppointmentsTab() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/appointments");
      setAppointments(res.data || []);
    } catch {
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id) => {
    try {
      await api.patch(`/appointments/${id}/status`, { status: "approved" });
      toast.success("Appointment approved! Waiting for customer confirmation.");
      load();
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
      load();
    } catch {
      toast.error("Failed to delete appointment");
    }
  };

  const handleCheckInAndCreateJob = (apt) => {
    navigate("/advisor/new-job", { state: { fromAppointment: apt, returnTo: "/manager/appointments" } });
  };

  const filtered = appointments.filter(a => {
    const matchSearch =
      a.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.license_plate?.toLowerCase().includes(search.toLowerCase()) ||
      a.customer_phone?.includes(search);
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pendingCount = appointments.filter(a => a.status === "pending").length;

  return (
    <div className="card">
      <div className="card-header flex-between">
        <div>
          <h2 className="card-title">Customer Service Appointments</h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0 0 0" }}>
            Review requested workshop appointments, approve slots, and intake vehicles into Job Cards
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div className="search-bar">
            <Search className="search-icon" size={16} />
            <input
              className="form-control"
              style={{ width: 240 }}
              placeholder="Search customer, plate..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-control"
            style={{ width: 160 }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending Review ({pendingCount})</option>
            <option value="approved">Approved by Garage</option>
            <option value="confirmed">Confirmed by Customer</option>
            <option value="checked_in">Checked In</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {loading ? <div className="loading">Loading appointments...</div> : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Date & Slot</th>
                <th>Customer</th>
                <th>Vehicle</th>
                <th>Requested Services</th>
                <th>Status</th>
                <th>Job Card</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(apt => {
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
                                  {"LKR " + Number(price || 0).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </strong>
                              )}
                            </span>
                          );
                        })}
                      </div>
                      {totalEst > 0 && srvList.length > 1 && (
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                          Total Est: <strong style={{ color: "var(--accent)", fontWeight: 800 }}>{"LKR " + Number(totalEst || 0).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
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
                      {apt.job_number ? (
                        <strong style={{ color: "var(--accent)" }}>{apt.job_number}</strong>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                        {(apt.status === "cancelled" || apt.job_approval_status === "rejected" || apt.job_status === "cancelled") && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleCancelAppointment(apt.id)}
                            title="Delete this cancelled appointment"
                            style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--red)", borderColor: "rgba(239,68,68,0.3)" }}
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        )}
                        {apt.status === "pending" && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleApprove(apt.id)}
                            style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                          >
                            <CheckCircle size={13} /> Approve Appointment
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
                              style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                            >
                              <Car size={13} /> Vehicle Arrived (Intake & Job Card)
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleCancelAppointment(apt.id)}
                              title="Cancel confirmed booking"
                              style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--red)", borderColor: "rgba(239,68,68,0.3)" }}
                            >
                              <XCircle size={13} /> Cancel
                            </button>
                          </div>
                        )}
                        {apt.status === "checked_in" && (
                          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--green)" }}>
                            ✅ Job Card Created
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!filtered.length && (
                <tr><td colSpan={7}><div className="empty-state"><p>No appointments found</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main Manager Dashboard ───────────────────────────────────────────────────
export default function ManagerDashboard() {
  const [data, setData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab from URL path
  const activeTab = useMemo(() => {
    const p = location.pathname.toLowerCase().replace(/\/$/, "");
    if (p.endsWith("/appointments")) return "appointments";
    if (p.endsWith("/orders") || p.endsWith("/store-orders")) return "orders";
    if (p.endsWith("/financial") || p.endsWith("/financial-report")) return "financial";
    if (p.endsWith("/services") || p.endsWith("/services-items")) return "services";
    if (p.endsWith("/approvals")) return "approvals";
    if (p.endsWith("/jobs") || p.endsWith("/jobcards")) return "jobcards";
    if (p.endsWith("/inventory")) return "inventory";
    if (p.endsWith("/staff")) return "staff";
    return "overview";
  }, [location.pathname]);

  const handleTabClick = (tabKey) => {
    if (tabKey === "overview") {
      navigate("/manager");
    } else if (tabKey === "jobcards") {
      navigate("/manager/jobs");
    } else {
      navigate(`/manager/${tabKey}`);
    }
  };

  const [storeOrders, setStoreOrders] = useState([]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [dRes, aRes, oRes] = await Promise.all([
        api.get("/manager/dashboard"),
        api.get("/appointments"),
        api.get("/billing/store-orders")
      ]);
      setData(dRes.data);
      setAppointments(aRes.data || []);
      setStoreOrders(oRes.data || []);
    } catch { toast.error("Failed to load dashboard"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const approve = async id => {
    try { await api.patch(`/manager/approvals/${id}/approve`); toast.success("Job approved & customer notified"); load(); }
    catch { toast.error("Failed"); }
  };
  const reject = async id => {
    try { await api.patch(`/manager/approvals/${id}/reject`); toast.success("Job rejected"); load(); }
    catch { toast.error("Failed"); }
  };

  const approveStoreOrder = async id => {
    try {
      await api.patch(`/billing/store-orders/${id}/approve`);
      toast.success("Store order approved! Receipt is now active.");
      load();
    } catch {
      toast.error("Failed to approve order");
    }
  };

  const pendingCount = data?.pendingApprovals?.length || 0;
  const lowStockCount = data?.inventorySummary?.length || 0;
  const pendingAppointmentsCount = appointments.filter(a => a.status === "pending").length;

  const TABS = [
    { key: "overview", label: "Overview", icon: TrendingUp },
    { key: "appointments", label: "Appointments", icon: Calendar, badge: pendingAppointmentsCount > 0 ? `${pendingAppointmentsCount} new` : null },
    { key: "orders", label: "Store Orders", icon: ShoppingCart, badge: storeOrders.length > 0 ? `${storeOrders.length}` : null },
    { key: "financial", label: "Financial Reports", icon: BarChart2 },
    { key: "services", label: "Services & Items", icon: Wrench },
    { key: "jobcards", label: "Job Cards", icon: ClipboardList },
    { key: "approvals", label: "Approvals", icon: CheckCircle, badge: pendingCount > 0 ? pendingCount : null },
    { key: "inventory", label: "Inventory", icon: Package, badge: lowStockCount > 0 ? `${lowStockCount} low` : null },
    { key: "staff", label: "Staff", icon: Users },
  ];

  return (
    <div className="fade-in">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">Workshop Manager</h1>
          <p className="page-subtitle">Operations overview, appointments, approvals & garage management</p>
        </div>
        {pendingCount > 0 && (
          <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "8px 16px", display: "flex", alignItems: "center", gap: 8 }}>
            <Bell size={16} style={{ color: "var(--red)" }} />
            <span style={{ color: "var(--red)", fontWeight: 700, fontSize: 13 }}>{pendingCount} awaiting approval</span>
          </div>
        )}
      </div>

      {/* Tab Bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 6, flexWrap: "wrap" }}>
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => handleTabClick(tab.key)}
            style={{
              flex: 1, minWidth: 120, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "10px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
              transition: "all 0.2s",
              background: activeTab === tab.key ? "linear-gradient(135deg, var(--accent), #d97706)" : "transparent",
              color: activeTab === tab.key ? "#fff" : "var(--text-secondary)",
            }}>
            <tab.icon size={15} />
            {tab.label}
            {tab.badge ? (
              <span style={{ background: activeTab === tab.key ? "rgba(255,255,255,0.3)" : "var(--red)", color: "#fff", fontSize: 10, fontWeight: 800, padding: "1px 6px", borderRadius: 10 }}>
                {tab.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {loading ? <div className="loading">Loading dashboard...</div> : <>
        {activeTab === "overview" && <OverviewTab data={data} storeOrders={storeOrders} onSelectTab={handleTabClick} onApproveOrder={approveStoreOrder} onApprove={approve} onReject={reject} />}
        {activeTab === "appointments" && <AppointmentsTab />}
        {activeTab === "orders" && <StoreOrdersTab />}
        {activeTab === "financial" && <FinancialReportsTab />}
        {activeTab === "services" && <ServicesItemsTab />}
        {activeTab === "jobcards" && <JobCardsTab />}
        {activeTab === "approvals" && <ApprovalsTab />}
        {activeTab === "inventory" && <InventoryTab />}
        {activeTab === "staff" && <StaffTab />}
      </>}
    </div>
  );
}
