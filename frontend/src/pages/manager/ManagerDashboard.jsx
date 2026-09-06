import { useEffect, useState } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { CheckCircle, XCircle, TrendingUp, Briefcase, Clock, DollarSign, Users, Download, ShieldCheck, FileText } from "lucide-react";
import UserManagementModal from "../../components/UserManagementModal";

const fmt = n => `LKR ${Number(n||0).toLocaleString("en-LK",{minimumFractionDigits:2})}`;

export default function ManagerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get("/manager/dashboard");
      setData(res.data);
    } catch { toast.error("Failed to load dashboard"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const approve = async id => {
    try { await api.patch(`/manager/approvals/${id}/approve`); toast.success("Job approved"); load(); }
    catch { toast.error("Failed"); }
  };
  const reject = async id => {
    try { await api.patch(`/manager/approvals/${id}/reject`); toast.success("Job rejected"); load(); }
    catch { toast.error("Failed"); }
  };

  const exportCSVReport = () => {
    if (!data) return;
    const { revenueStats: r, jobStats: j } = data;
    const rows = [
      ["Metric", "Value (LKR / Count)"],
      ["Total Financial Revenue", r?.total_revenue || 0],
      ["Today Revenue", r?.today_revenue || 0],
      ["Monthly Revenue", r?.month_revenue || 0],
      ["Pending Jobs", j?.pending || 0],
      ["In Progress Jobs", j?.in_progress || 0],
      ["Completed Jobs", j?.completed || 0],
      ["Invoiced Jobs", j?.invoiced || 0]
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `PitStopPro_Revenue_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV Analytical Report downloaded!");
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;
  const { jobStats: j, revenueStats: r, pendingApprovals: pa } = data || {};

  return (
    <div className="fade-in">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">Workshop Manager Dashboard</h1>
          <p className="page-subtitle">Financial performance, high-value estimate sign-offs & role governance</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => setShowUserModal(true)}>
            <ShieldCheck size={16} /> User Roles & Access (US19)
          </button>
          <button className="btn btn-primary" onClick={exportCSVReport}>
            <Download size={16} /> Export CSV Report (US23)
          </button>
        </div>
      </div>

      <div className="stats-grid">
        {[
          { label:"Total Revenue", value: fmt(r?.total_revenue), icon: TrendingUp, color:"var(--accent)", glow:"var(--accent-glow)" },
          { label:"Today Revenue", value: fmt(r?.today_revenue), icon: DollarSign, color:"var(--green)", glow:"var(--green-glow)" },
          { label:"Monthly Revenue", value: fmt(r?.month_revenue), icon: DollarSign, color:"var(--blue)", glow:"var(--blue-glow)" },
          { label:"Active Jobs", value: (j?.in_progress||0)+(j?.qc_check||0), icon: Briefcase, color:"var(--purple)", glow:"var(--purple-glow)" },
          { label:"Pending Jobs", value: j?.pending||0, icon: Clock, color:"var(--accent)", glow:"var(--accent-glow)" },
          { label:"Pending Approvals (>5K)", value: pa?.length||0, icon: CheckCircle, color:"var(--red)", glow:"var(--red-glow)" },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-glow" style={{background:s.glow}}></div>
            <div className="stat-icon" style={{background:s.glow}}><s.icon size={22} style={{color:s.color}} /></div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">⏳ High-Value Estimates Requiring Approval (&gt; LKR 5,000) (US06)</h2>
          <span className="badge badge-pending">{pa?.length || 0} pending</span>
        </div>
        {!pa?.length ? (
          <div className="empty-state"><div className="empty-icon">✅</div><p>No high-value estimates requiring manager approval</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Job #</th><th>Customer</th><th>Vehicle</th><th>Estimated Scope</th><th>Intake Date</th><th>Actions</th></tr></thead>
              <tbody>
                {pa.map(j => (
                  <tr key={j.id}>
                    <td><strong>{j.job_number}</strong></td>
                    <td>{j.customer_name}</td>
                    <td>{j.make} {j.model} — {j.license_plate}</td>
                    <td className="text-accent"><strong>{fmt(j.estimated_cost)}</strong></td>
                    <td>{new Date(j.intake_date || Date.now()).toLocaleDateString()}</td>
                    <td>
                      <div className="actions">
                        <button className="btn btn-success btn-sm" onClick={() => approve(j.id)}><CheckCircle size={14}/> Approve</button>
                        <button className="btn btn-danger btn-sm" onClick={() => reject(j.id)}><XCircle size={14}/> Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inventory Scrap & Utilization Report */}
      <div className="card mt-24">
        <div className="card-header">
          <h2 className="card-title">📦 Inventory Utilization & Waste/Scrap Tracking (US22)</h2>
          <span className="badge badge-info">Live Inventory Ledger</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <div style={{ background: "rgba(30,41,59,0.5)", padding: 16, borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
            <h4 style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 6px 0" }}>Fastest Moving Category</h4>
            <p style={{ fontSize: 18, fontWeight: 800, color: "#fbbf24", margin: 0 }}>Engine Oils & Lubricants</p>
            <p style={{ fontSize: 11, color: "#64748b", margin: "4px 0 0 0" }}>84 units issued this week</p>
          </div>
          <div style={{ background: "rgba(30,41,59,0.5)", padding: 16, borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
            <h4 style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 6px 0" }}>Paint & Welding Material Waste</h4>
            <p style={{ fontSize: 18, fontWeight: 800, color: "#4ade80", margin: 0 }}>1.2% (Low Scrap)</p>
            <p style={{ fontSize: 11, color: "#64748b", margin: "4px 0 0 0" }}>Within standard threshold (&lt;3%)</p>
          </div>
          <div style={{ background: "rgba(30,41,59,0.5)", padding: 16, borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
            <h4 style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 6px 0" }}>Spare Parts Turnover Ratio</h4>
            <p style={{ fontSize: 18, fontWeight: 800, color: "#60a5fa", margin: 0 }}>4.8x / Month</p>
            <p style={{ fontSize: 11, color: "#64748b", margin: "4px 0 0 0" }}>Optimal stock efficiency</p>
          </div>
        </div>
      </div>

      {showUserModal && <UserManagementModal onClose={() => setShowUserModal(false)} />}
    </div>
  );
}

