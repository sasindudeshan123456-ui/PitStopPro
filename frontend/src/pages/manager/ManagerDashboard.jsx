import { useEffect, useState } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { CheckCircle, XCircle, TrendingUp, Briefcase, Clock, DollarSign, Users } from "lucide-react";

const fmt = n => `LKR ${Number(n||0).toLocaleString("en-LK",{minimumFractionDigits:2})}`;

export default function ManagerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="loading">Loading dashboard...</div>;
  const { jobStats: j, revenueStats: r, pendingApprovals: pa } = data || {};

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Manager Dashboard</h1>
        <p className="page-subtitle">Workshop overview & approvals</p>
      </div>

      <div className="stats-grid">
        {[
          { label:"Total Revenue", value: fmt(r?.total_revenue), icon: TrendingUp, color:"var(--accent)", glow:"var(--accent-glow)" },
          { label:"Today Revenue", value: fmt(r?.today_revenue), icon: DollarSign, color:"var(--green)", glow:"var(--green-glow)" },
          { label:"Monthly Revenue", value: fmt(r?.month_revenue), icon: DollarSign, color:"var(--blue)", glow:"var(--blue-glow)" },
          { label:"Active Jobs", value: (j?.in_progress||0)+(j?.qc_check||0), icon: Briefcase, color:"var(--purple)", glow:"var(--purple-glow)" },
          { label:"Pending Jobs", value: j?.pending||0, icon: Clock, color:"var(--accent)", glow:"var(--accent-glow)" },
          { label:"Pending Approvals", value: pa?.length||0, icon: CheckCircle, color:"var(--red)", glow:"var(--red-glow)" },
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
          <h2 className="card-title">⏳ Pending Approvals — Estimates &gt; LKR 5,000</h2>
          <span className="badge badge-pending">{pa?.length || 0} pending</span>
        </div>
        {!pa?.length ? (
          <div className="empty-state"><div className="empty-icon">✅</div><p>No pending approvals</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Job #</th><th>Customer</th><th>Vehicle</th><th>Estimated Cost</th><th>Intake Date</th><th>Actions</th></tr></thead>
              <tbody>
                {pa.map(j => (
                  <tr key={j.id}>
                    <td><strong>{j.job_number}</strong></td>
                    <td>{j.customer_name}</td>
                    <td>{j.make} {j.model} — {j.license_plate}</td>
                    <td className="text-accent"><strong>{fmt(j.estimated_cost)}</strong></td>
                    <td>{new Date(j.intake_date).toLocaleDateString()}</td>
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

      <div className="card mt-24">
        <div className="card-header"><h2 className="card-title">📊 Job Status Summary</h2></div>
        <div className="stats-grid" style={{margin:0}}>
          {[["Pending","pending","badge-pending"],["In Progress","in_progress","badge-in_progress"],["QC Check","qc_check","badge-qc_check"],["Completed","completed","badge-completed"],["Invoiced","invoiced","badge-invoiced"]].map(([label,key,cls]) => (
            <div key={key} style={{textAlign:"center",padding:"16px",background:"var(--bg-surface)",borderRadius:"var(--radius-sm)"}}>
              <div style={{fontSize:28,fontWeight:700}}>{j?.[key]||0}</div>
              <span className={`badge ${cls}`} style={{marginTop:6}}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
