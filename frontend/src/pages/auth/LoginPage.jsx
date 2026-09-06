import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import toast from "react-hot-toast";
import garageHero from "../../assets/garage_hero.jpg";

const roleRedirects = { manager:"/manager", advisor:"/advisor", supervisor:"/supervisor", technician:"/technician", qc_inspector:"/technician", storekeeper:"/storekeeper", cashier:"/cashier", customer:"/customer" };

const labelStyle = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "#374151",
  marginBottom: 6,
};

const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  fontSize: 14,
  color: "#1f2937",
  outline: "none",
  transition: "0.2s",
  boxSizing: "border-box",
};

const btnPrimary = {
  width: "100%",
  padding: "12px",
  borderRadius: 8,
  background: "linear-gradient(135deg, #f59e0b, #d97706)",
  color: "#fff",
  border: "none",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 4px 14px rgba(245,158,11,0.35)",
  transition: "opacity 0.2s",
};


export default function LoginPage() {
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ email:"", password:"", full_name:"", phone:"", nic:"", address:"" });
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
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
    e.preventDefault();
    if (!agreed) return toast.error("Please agree to the terms & policy");
    setLoading(true);
    try {
      await api.post("/auth/register", form);
      toast.success("Account created! Please log in.");
      setTab("login");
    } catch (err) { toast.error(err.response?.data?.message || "Registration failed"); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#fff" }}>

      {/* ── LEFT PANEL ── */}
      <div style={{
        flex: "0 0 460px", display:"flex", flexDirection:"column", justifyContent:"center",
        padding:"48px 56px", background:"#fff", overflowY:"auto"
      }}>

        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:40 }}>
          <div style={{
            width:38, height:38, borderRadius:10,
            background:"linear-gradient(135deg,#f59e0b,#d97706)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:20, boxShadow:"0 4px 14px rgba(245,158,11,0.35)"
          }}>🔧</div>
          <span style={{ fontSize:20, fontWeight:800, color:"#111", letterSpacing:"-0.5px" }}>
            PitStop<span style={{ color:"#f59e0b" }}>Pro</span>
          </span>
        </div>

        <h1 style={{ fontSize:28, fontWeight:800, color:"#0f172a", marginBottom:8, lineHeight:1.2 }}>
          {tab === "login" ? "Welcome back" : "Get Started Now"}
        </h1>
        <p style={{ fontSize:14, color:"#64748b", marginBottom:32 }}>
          {tab === "login"
            ? "Sign in to your workshop dashboard"
            : "Create your customer account today"}
        </p>

        {/* ── LOGIN FORM ── */}
        {tab === "login" ? (
          <form onSubmit={handleLogin} style={{ display:"flex", flexDirection:"column", gap:0 }}>

            <div style={{ marginBottom:18 }}>
              <label style={labelStyle}>Email address</label>
              <input style={inputStyle} type="email" placeholder="Enter your email"
                value={form.email} onChange={set("email")} required
                onFocus={e=>{e.target.style.borderColor="#f59e0b";e.target.style.boxShadow="0 0 0 3px rgba(245,158,11,0.15)";}}
                onBlur={e=>{e.target.style.borderColor="#d1d5db";e.target.style.boxShadow="none";}} />
            </div>

            <div style={{ marginBottom:24 }}>
              <label style={labelStyle}>Password</label>
              <input style={inputStyle} type="password" placeholder="••••••••"
                value={form.password} onChange={set("password")} required
                onFocus={e=>{e.target.style.borderColor="#f59e0b";e.target.style.boxShadow="0 0 0 3px rgba(245,158,11,0.15)";}}
                onBlur={e=>{e.target.style.borderColor="#d1d5db";e.target.style.boxShadow="none";}} />
            </div>

            <button type="submit" style={btnPrimary} disabled={loading}
              onMouseEnter={e=>e.currentTarget.style.opacity="0.9"}
              onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
              {loading ? "Signing in…" : "Sign In"}
            </button>

            <div style={{ textAlign:"center", margin:"20px 0", color:"#94a3b8", fontSize:13 }}>or</div>

            {/* Quick-fill demo logins */}
            <div style={{ background:"#f8fafc", borderRadius:10, padding:"14px 16px", border:"1px solid #e2e8f0" }}>
              <p style={{ fontSize:12, fontWeight:600, color:"#64748b", marginBottom:8 }}>
                🔑 Staff demo logins <span style={{ fontWeight:400 }}>(click to fill)</span>
              </p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {[["Manager","manager@pitstoppro.lk"],["Advisor","advisor@pitstoppro.lk"],
                  ["Supervisor","supervisor@pitstoppro.lk"],["Technician","tech@pitstoppro.lk"],
                  ["Storekeeper","store@pitstoppro.lk"],["Cashier","cashier@pitstoppro.lk"]
                ].map(([role, email]) => (
                  <button key={email} type="button"
                    onClick={() => setForm(f => ({ ...f, email, password:"Admin@1234" }))}
                    style={{
                      padding:"4px 10px", borderRadius:20, fontSize:12, fontWeight:500,
                      border:"1px solid #e2e8f0", background:"#fff", color:"#374151",
                      cursor:"pointer", transition:"0.15s"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background="#f59e0b"; e.currentTarget.style.color="#fff"; e.currentTarget.style.borderColor="#f59e0b"; }}
                    onMouseLeave={e => { e.currentTarget.style.background="#fff"; e.currentTarget.style.color="#374151"; e.currentTarget.style.borderColor="#e2e8f0"; }}>
                    {role}
                  </button>
                ))}
              </div>
              <p style={{ fontSize:11, color:"#94a3b8", marginTop:8 }}>Password: Admin@1234</p>
            </div>

            <p style={{ textAlign:"center", marginTop:24, fontSize:13, color:"#64748b" }}>
              Don't have an account?{" "}
              <span onClick={() => setTab("register")}
                style={{ color:"#f59e0b", fontWeight:600, cursor:"pointer", textDecoration:"underline" }}>
                Register
              </span>
            </p>
          </form>

        ) : (

        /* ── REGISTER FORM ── */
          <form onSubmit={handleRegister} style={{ display:"flex", flexDirection:"column", gap:0 }}>

            <div style={{ marginBottom:16 }}>
              <label style={labelStyle}>Full Name</label>
              <input style={inputStyle} placeholder="Saman Perera"
                value={form.full_name} onChange={set("full_name")} required
                onFocus={e=>{e.target.style.borderColor="#f59e0b";e.target.style.boxShadow="0 0 0 3px rgba(245,158,11,0.15)";}}
                onBlur={e=>{e.target.style.borderColor="#d1d5db";e.target.style.boxShadow="none";}} />
            </div>

            <div style={{ marginBottom:16 }}>
              <label style={labelStyle}>Email address</label>
              <input style={inputStyle} type="email" placeholder="Enter your email"
                value={form.email} onChange={set("email")} required
                onFocus={e=>{e.target.style.borderColor="#f59e0b";e.target.style.boxShadow="0 0 0 3px rgba(245,158,11,0.15)";}}
                onBlur={e=>{e.target.style.borderColor="#d1d5db";e.target.style.boxShadow="none";}} />
            </div>

            <div style={{ marginBottom:16 }}>
              <label style={labelStyle}>Phone</label>
              <input style={inputStyle} placeholder="0771234567"
                value={form.phone} onChange={set("phone")}
                onFocus={e=>{e.target.style.borderColor="#f59e0b";e.target.style.boxShadow="0 0 0 3px rgba(245,158,11,0.15)";}}
                onBlur={e=>{e.target.style.borderColor="#d1d5db";e.target.style.boxShadow="none";}} />
            </div>

            <div style={{ marginBottom:16 }}>
              <label style={labelStyle}>Password</label>
              <input style={inputStyle} type="password" placeholder="Min. 6 characters"
                value={form.password} onChange={set("password")} required minLength={6}
                onFocus={e=>{e.target.style.borderColor="#f59e0b";e.target.style.boxShadow="0 0 0 3px rgba(245,158,11,0.15)";}}
                onBlur={e=>{e.target.style.borderColor="#d1d5db";e.target.style.boxShadow="none";}} />
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
              <div>
                <label style={labelStyle}>NIC Number</label>
                <input style={inputStyle} placeholder="990123456V"
                  value={form.nic} onChange={set("nic")}
                  onFocus={e=>{e.target.style.borderColor="#f59e0b";e.target.style.boxShadow="0 0 0 3px rgba(245,158,11,0.15)";}}
                  onBlur={e=>{e.target.style.borderColor="#d1d5db";e.target.style.boxShadow="none";}} />
              </div>
              <div>
                <label style={labelStyle}>Address</label>
                <input style={inputStyle} placeholder="Colombo 07"
                  value={form.address} onChange={set("address")}
                  onFocus={e=>{e.target.style.borderColor="#f59e0b";e.target.style.boxShadow="0 0 0 3px rgba(245,158,11,0.15)";}}
                  onBlur={e=>{e.target.style.borderColor="#d1d5db";e.target.style.boxShadow="none";}} />
              </div>
            </div>

            <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:"#475569", marginBottom:20, cursor:"pointer" }}>
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                style={{ width:16, height:16, accentColor:"#f59e0b" }} />
              I agree to the{" "}
              <span style={{ color:"#f59e0b", textDecoration:"underline" }}>terms & policy</span>
            </label>

            <button type="submit" style={btnPrimary} disabled={loading}
              onMouseEnter={e=>e.currentTarget.style.opacity="0.9"}
              onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
              {loading ? "Creating account…" : "Create Account"}
            </button>

            <p style={{ textAlign:"center", marginTop:20, fontSize:13, color:"#64748b" }}>
              Have an account?{" "}
              <span onClick={() => setTab("login")}
                style={{ color:"#f59e0b", fontWeight:600, cursor:"pointer", textDecoration:"underline" }}>
                Sign In
              </span>
            </p>
          </form>
        )}
      </div>

      {/* ── RIGHT PANEL — Garage Image ── */}
      <div style={{ flex:1, position:"relative", overflow:"hidden", minHeight:"100vh" }}>
        <img src={garageHero} alt="PitStopPro Workshop"
          style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center" }} />

        {/* Dark gradient overlay */}
        <div style={{
          position:"absolute", inset:0,
          background:"linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)"
        }} />

        {/* Overlay badge */}
        <div style={{
          position:"absolute", bottom:40, left:40, right:40,
          background:"rgba(0,0,0,0.5)", backdropFilter:"blur(16px)",
          borderRadius:16, padding:"22px 26px",
          border:"1px solid rgba(255,255,255,0.12)"
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
            <span style={{ fontSize:22 }}>🏎️</span>
            <p style={{ fontSize:17, fontWeight:700, color:"#fff" }}>
              Professional Vehicle Workshop Management
            </p>
          </div>
          <p style={{ fontSize:13, color:"rgba(255,255,255,0.65)", lineHeight:1.7 }}>
            From customer intake to final invoice — manage every bay, every technician,
            and every repair in one powerful platform.
          </p>
          <div style={{ display:"flex", gap:20, marginTop:16 }}>
            {[["7","User Roles"],["14","DB Tables"],["8","Modules"]].map(([n,l]) => (
              <div key={l}>
                <div style={{ fontSize:22, fontWeight:800, color:"#f59e0b" }}>{n}</div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
