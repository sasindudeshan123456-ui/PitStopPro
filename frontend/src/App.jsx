import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import LoginPage from "./pages/auth/LoginPage";
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import AdvisorDashboard from "./pages/advisor/AdvisorDashboard";
import NewJobCard from "./pages/advisor/NewJobCard";
import SupervisorDashboard from "./pages/supervisor/SupervisorDashboard";
import TechnicianDashboard from "./pages/technician/TechnicianDashboard";
import StorekeeperDashboard from "./pages/storekeeper/StorekeeperDashboard";
import CashierDashboard from "./pages/cashier/CashierDashboard";
import CustomerPortal from "./pages/customer/CustomerPortal";

function ProtectedLayout({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />;
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={getHome(user.role)} replace /> : <LoginPage />} />
      <Route path="/manager/*" element={<ProtectedLayout roles={["manager"]}><ManagerDashboard /></ProtectedLayout>} />
      <Route path="/advisor" element={<ProtectedLayout roles={["advisor","manager"]}><AdvisorDashboard /></ProtectedLayout>} />
      <Route path="/advisor/new-job" element={<ProtectedLayout roles={["advisor","manager"]}><NewJobCard /></ProtectedLayout>} />
      <Route path="/advisor/jobs/:id" element={<ProtectedLayout roles={["advisor","manager"]}><JobCardDetail /></ProtectedLayout>} />
      <Route path="/advisor/customers" element={<ProtectedLayout roles={["advisor","manager"]}><CustomersPage /></ProtectedLayout>} />
      <Route path="/supervisor/*" element={<ProtectedLayout roles={["supervisor","manager"]}><SupervisorDashboard /></ProtectedLayout>} />
      <Route path="/technician/*" element={<ProtectedLayout roles={["technician","qc_inspector","manager"]}><TechnicianDashboard /></ProtectedLayout>} />
      <Route path="/storekeeper/*" element={<ProtectedLayout roles={["storekeeper","manager"]}><StorekeeperDashboard /></ProtectedLayout>} />
      <Route path="/cashier/*" element={<ProtectedLayout roles={["cashier","manager"]}><CashierDashboard /></ProtectedLayout>} />
      <Route path="/customer/*" element={<ProtectedLayout roles={["customer"]}><CustomerPortal /></ProtectedLayout>} />
      <Route path="/" element={<Navigate to={user ? getHome(user.role) : "/login"} replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

const getHome = r => ({ manager:"/manager", advisor:"/advisor", supervisor:"/supervisor", technician:"/technician", qc_inspector:"/technician", storekeeper:"/storekeeper", cashier:"/cashier", customer:"/customer" }[r] || "/login");

// Inline simple pages for job detail and customers list
function JobCardDetail() {
  const [jc, setJc] = useState(null);
  const { id } = useParams();
  useEffect(() => { api.get(`/job-cards/${id}`).then(r=>setJc(r.data)).catch(()=>{}); }, [id]);
  if (!jc) return <div className="loading">Loading...</div>;
  return (
    <div className="fade-in">
      <div className="page-header"><h1 className="page-title">Job Card — {jc.job_number}</h1><p className="page-subtitle">{jc.make} {jc.model} {jc.year} · {jc.license_plate}</p></div>
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><h2 className="card-title">Customer & Vehicle</h2></div>
          <div style={{display:"flex",flexDirection:"column",gap:8,fontSize:14}}>
            {[["Customer",jc.customer_name],["Email",jc.customer_email],["Phone",jc.customer_phone],["Plate",jc.license_plate],["Color",jc.color],["Mileage",jc.mileage?`${jc.mileage} km`:"—"],["Advisor",jc.advisor_name]].map(([k,v])=>(
              <div key={k} style={{display:"flex",gap:8}}><span style={{color:"var(--text-muted)",minWidth:80}}>{k}:</span><strong>{v||"—"}</strong></div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h2 className="card-title">Job Details</h2><span className={`badge badge-${jc.status}`}>{jc.status?.replace("_"," ")}</span></div>
          <div style={{fontSize:14,display:"flex",flexDirection:"column",gap:8}}>
            <div><span style={{color:"var(--text-muted)"}}>Reported Issue: </span>{jc.reported_issue}</div>
            {jc.diagnosis_notes && <div><span style={{color:"var(--text-muted)"}}>Diagnosis: </span>{jc.diagnosis_notes}</div>}
            <div><span style={{color:"var(--text-muted)"}}>Estimated Cost: </span><strong style={{color:"var(--accent)"}}>LKR {Number(jc.estimated_cost||0).toLocaleString()}</strong></div>
            {jc.approval_required===1 && <div className={`alert alert-${jc.approval_status==="approved"?"success":jc.approval_status==="rejected"?"danger":"warning"}`}>Manager Approval: {jc.approval_status}</div>}
          </div>
        </div>
      </div>
      {jc.tasks?.length > 0 && (
        <div className="card mt-24">
          <div className="card-header"><h2 className="card-title">Tasks</h2></div>
          <div className="table-wrapper"><table><thead><tr><th>Task</th><th>Bay</th><th>Status</th><th>Technician</th><th>Hours</th></tr></thead>
          <tbody>{jc.tasks.map(t=>(
            <tr key={t.id}><td>{t.task_name}</td><td><span className="chip">{t.bay_type}</span></td><td><span className={`badge badge-${t.status}`}>{t.status}</span></td><td>{t.technician_name||"Unassigned"}</td><td>{t.estimated_hours}h</td></tr>
          ))}</tbody></table></div>
        </div>
      )}
      {jc.images?.length > 0 && (
        <div className="card mt-24">
          <div className="card-header"><h2 className="card-title">Walkaround Photos</h2></div>
          <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
            {jc.images.map(img=>(
              <img key={img.id} src={`http://localhost:5000/uploads/${img.filename}`} alt={img.label||"vehicle"} style={{width:180,height:120,objectFit:"cover",borderRadius:"var(--radius-sm)",border:"1px solid var(--border)"}}/>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const nav = useNavigate();
  useEffect(() => { api.get("/customers").then(r=>setCustomers(r.data)).catch(()=>{}); }, []);
  const filtered = customers.filter(c => c.full_name?.toLowerCase().includes(search.toLowerCase()) || c.email?.includes(search) || c.phone?.includes(search));
  return (
    <div className="fade-in">
      <div className="page-header flex-between"><div><h1 className="page-title">Customers</h1></div>
        <div className="search-bar"><Search className="search-icon" size={16}/><input className="form-control" style={{width:260}} placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
      </div>
      <div className="card">
        <div className="table-wrapper"><table>
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>NIC</th><th>Since</th></tr></thead>
          <tbody>{filtered.map(c=>(
            <tr key={c.id} style={{cursor:"pointer"}} onClick={()=>nav(`/advisor/customers/${c.id}`)}>
              <td><strong>{c.full_name}</strong></td><td>{c.email}</td><td>{c.phone}</td><td>{c.nic||"—"}</td><td>{new Date(c.created_at).toLocaleDateString()}</td>
            </tr>
          ))}</tbody>
        </table></div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import api from "./api/axios";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ style: { background:"#1c2130", color:"#f1f5f9", border:"1px solid rgba(255,255,255,0.1)" } }} />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
