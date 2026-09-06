import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Plus, Search, Eye, ClipboardList, Users, Car, Clock } from "lucide-react";

const statusBadge = s => <span className={`badge badge-${s}`}>{s?.replace("_"," ")}</span>;

export default function AdvisorDashboard() {
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([api.get("/job-cards"), api.get("/job-cards/stats")])
      .then(([jRes, sRes]) => { setJobs(jRes.data); setStats(sRes.data); })
      .catch(() => toast.error("Failed to load data"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = jobs.filter(j =>
    j.job_number.toLowerCase().includes(search.toLowerCase()) ||
    j.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    j.license_plate?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fade-in">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">Service Advisor</h1>
          <p className="page-subtitle">Manage customer intake & job cards</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate("/advisor/new-job")}>
          <Plus size={16}/> New Job Card
        </button>
      </div>

      <div className="stats-grid">
        {[
          { label:"Total Jobs", value:stats.total||0, icon:ClipboardList, color:"var(--accent)", glow:"var(--accent-glow)" },
          { label:"Pending", value:stats.pending||0, icon:Clock, color:"var(--accent)", glow:"var(--accent-glow)" },
          { label:"In Progress", value:stats.in_progress||0, icon:Car, color:"var(--blue)", glow:"var(--blue-glow)" },
          { label:"Completed", value:stats.completed||0, icon:Users, color:"var(--green)", glow:"var(--green-glow)" },
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
          <h2 className="card-title">All Job Cards</h2>
          <div className="search-bar">
            <Search className="search-icon" size={16}/>
            <input className="form-control" style={{width:260}} placeholder="Search job #, customer, plate..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
        </div>
        {loading ? <div className="loading">Loading...</div> : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Job #</th><th>Customer</th><th>Vehicle</th><th>Plate</th><th>Status</th><th>Est. Cost</th><th>Date</th><th></th></tr></thead>
              <tbody>
                {filtered.map(j => (
                  <tr key={j.id}>
                    <td><strong style={{color:"var(--accent)"}}>{j.job_number}</strong></td>
                    <td>{j.customer_name}</td>
                    <td>{j.make} {j.model}</td>
                    <td><span className="chip">{j.license_plate}</span></td>
                    <td>{statusBadge(j.status)}</td>
                    <td>LKR {Number(j.estimated_cost||0).toLocaleString()}</td>
                    <td>{new Date(j.created_at).toLocaleDateString()}</td>
                    <td><button className="btn btn-secondary btn-sm" onClick={() => navigate(`/advisor/jobs/${j.id}`)}><Eye size={14}/></button></td>
                  </tr>
                ))}
                {!filtered.length && <tr><td colSpan={8}><div className="empty-state"><p>No job cards found</p></div></td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
