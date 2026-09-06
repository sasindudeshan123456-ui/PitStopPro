import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import toast from "react-hot-toast";

const roleRedirects = { manager:"/manager", advisor:"/advisor", supervisor:"/supervisor", technician:"/technician", qc_inspector:"/technician", storekeeper:"/storekeeper", cashier:"/cashier", customer:"/customer" };

export default function LoginPage() {
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ email:"", password:"", full_name:"", phone:"", nic:"", address:"" });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleLogin = async e => {
    e.preventDefault(); setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(roleRedirects[user.role] || "/");
    } catch (err) { toast.error(err.response?.data?.message || "Login failed"); }
    finally { setLoading(false); }
  };

  const handleRegister = async e => {
    e.preventDefault(); setLoading(true);
    try {
      await api.post("/auth/register", form);
      toast.success("Account created! Please log in.");
      setTab("login");
    } catch (err) { toast.error(err.response?.data?.message || "Registration failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-badge">🔧</div>
          <h1>PitStop<span style={{color:"var(--accent)"}}>Pro</span></h1>
          <p>Vehicle Workshop Management System</p>
        </div>
        <div className="auth-tabs">
          <button className={"auth-tab" + (tab==="login" ? " active" : "")} onClick={() => setTab("login")}>Sign In</button>
          <button className={"auth-tab" + (tab==="register" ? " active" : "")} onClick={() => setTab("register")}>Register</button>
        </div>

        {tab === "login" ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-control" type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-control" type="password" placeholder="••••••••" value={form.password} onChange={set("password")} required />
            </div>
            <button className="btn btn-primary" style={{width:"100%",justifyContent:"center"}} disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
            <div className="auth-footer" style={{marginTop:16}}>
              <span style={{fontSize:12, color:"var(--text-muted)"}}>Staff accounts are created by the manager</span>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-control" placeholder="Saman Perera" value={form.full_name} onChange={set("full_name")} required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-control" placeholder="0771234567" value={form.phone} onChange={set("phone")} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-control" type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-control" type="password" placeholder="Min. 6 characters" value={form.password} onChange={set("password")} required minLength={6} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">NIC Number</label>
                <input className="form-control" placeholder="990123456V" value={form.nic} onChange={set("nic")} />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input className="form-control" placeholder="Colombo 07" value={form.address} onChange={set("address")} />
              </div>
            </div>
            <button className="btn btn-primary" style={{width:"100%",justifyContent:"center"}} disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        )}

        <div style={{marginTop:24, padding:"12px 16px", background:"var(--bg-surface)", borderRadius:"var(--radius-sm)", fontSize:12, color:"var(--text-muted)"}}>
          <strong style={{color:"var(--text-secondary)"}}>Staff Demo Logins (password: Admin@1234)</strong>
          <div style={{marginTop:8, display:"flex", flexDirection:"column", gap:2}}>
            {[["Manager","manager@pitstoppro.lk"],["Advisor","advisor@pitstoppro.lk"],["Supervisor","supervisor@pitstoppro.lk"],["Technician","tech@pitstoppro.lk"],["Storekeeper","store@pitstoppro.lk"],["Cashier","cashier@pitstoppro.lk"]].map(([role, email]) => (
              <span key={email} onClick={() => setForm(f=>({...f, email, password:"Admin@1234"}))} style={{cursor:"pointer", padding:"2px 6px", borderRadius:4, transition:"0.15s"}}
                onMouseEnter={e=>e.target.style.background="var(--bg-card)"} onMouseLeave={e=>e.target.style.background="transparent"}>
                <span style={{color:"var(--accent)"}}>{role}</span> — {email}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
