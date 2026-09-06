import { useEffect, useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { Car, ClipboardList, Receipt } from "lucide-react";

const fmt = n => `LKR ${Number(n||0).toLocaleString("en-LK",{minimumFractionDigits:2})}`;

export default function CustomerPortal() {
  const { user } = useAuth();
  const [tab, setTab] = useState("vehicles");
  const [vehicles, setVehicles] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.customer_id) return;
    Promise.all([
      api.get(`/customers/${user.customer_id}`),
      api.get(`/job-cards/customer/${user.customer_id}`),
      api.get(`/billing/customer/${user.customer_id}`),
    ]).then(([cRes, jRes, iRes]) => {
      setVehicles(cRes.data.vehicles || []);
      setJobs(jRes.data);
      setInvoices(iRes.data);
    }).catch(() => toast.error("Failed to load"))
    .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">My Account</h1>
        <p className="page-subtitle">Welcome back, {user?.name}</p>
      </div>
      <div className="auth-tabs" style={{maxWidth:400,marginBottom:24}}>
        {[["vehicles","Vehicles"],["history","Service History"],["invoices","Invoices"]].map(([k,l]) => (
          <button key={k} className={`auth-tab${tab===k?" active":""}`} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      {loading ? <div className="loading">Loading...</div> : <>
        {tab === "vehicles" && (
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:16}}>
            {vehicles.map(v => (
              <div key={v.id} className="card">
                <div style={{fontSize:32,marginBottom:8}}>🚗</div>
                <div style={{fontWeight:700,fontSize:17}}>{v.make} {v.model} {v.year}</div>
                <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:4,fontSize:13,color:"var(--text-muted)"}}>
                  <span>🔖 {v.license_plate}</span>
                  <span>🎨 {v.color||"—"}</span>
                  <span>📍 {v.mileage ? `${v.mileage.toLocaleString()} km` : "—"}</span>
                  {v.vin && <span>🔢 VIN: {v.vin}</span>}
                </div>
              </div>
            ))}
            {!vehicles.length && <div className="empty-state" style={{gridColumn:"1/-1"}}><div className="empty-icon">🚗</div><p>No vehicles registered</p></div>}
          </div>
        )}
        {tab === "history" && (
          <div className="card">
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Job #</th><th>Vehicle</th><th>Issue</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {jobs.map(j => (
                    <tr key={j.id}>
                      <td><strong style={{color:"var(--accent)"}}>{j.job_number}</strong></td>
                      <td>{j.make} {j.model} — {j.license_plate}</td>
                      <td style={{maxWidth:200,overflow:"hidden",textOverflow:"ellipsis"}}>{j.reported_issue}</td>
                      <td><span className={`badge badge-${j.status}`}>{j.status?.replace("_"," ")}</span></td>
                      <td>{new Date(j.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {!jobs.length && <tr><td colSpan={5}><div className="empty-state"><p>No service history</p></div></td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {tab === "invoices" && (
          <div className="card">
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Invoice #</th><th>Vehicle</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv.id}>
                      <td><strong style={{color:"var(--accent)"}}>{inv.invoice_number}</strong></td>
                      <td>{inv.make} {inv.model} — {inv.license_plate}</td>
                      <td><strong>{fmt(inv.total)}</strong></td>
                      <td><span className={`badge badge-${inv.status}`}>{inv.status}</span></td>
                      <td>{new Date(inv.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {!invoices.length && <tr><td colSpan={5}><div className="empty-state"><p>No invoices</p></div></td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </>}
    </div>
  );
}
