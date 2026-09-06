import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import toast from "react-hot-toast";
import garageHero from "../../assets/garage_hero.jpg";
import logoImg from "../../assets/logo.png";

const roleRedirects = { manager:"/manager", advisor:"/advisor", supervisor:"/supervisor", technician:"/technician", qc_inspector:"/technician", storekeeper:"/storekeeper", cashier:"/cashier", customer:"/customer" };

const labelStyle = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "#374151",
  marginBottom: 5,
};

const inputStyle = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  fontSize: 13,
  color: "#1f2937",
  outline: "none",
  transition: "0.2s",
  boxSizing: "border-box",
};

const btnPrimary = {
  width: "100%",
  padding: "10px",
  borderRadius: 6,
  background: "linear-gradient(135deg, #f59e0b, #d97706)",
  color: "#fff",
  border: "none",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 3px 10px rgba(245,158,11,0.3)",
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
    <div style={{ display:"flex", height:"100vh", overflow:"hidden", background:"#fff" }}>

      {/* ── LEFT PANEL — Perfectly Scaled Form ── */}
      <div style={{
        flex: "0 0 440px", display:"flex", flexDirection:"column", justifyContent:"center",
        padding:"32px 48px", background:"#fff", boxSizing:"border-box", overflowY:"auto"
      }}>
        <div style={{ width:"100%" }}>

          {/* Official Logo */}
          <div style={{ display:"flex", justifyContent:"center", marginBottom:24 }}>
            <img src={logoImg} alt="PitStop Performance Logo" style={{ height:65, maxWidth:"100%", objectFit:"contain" }} />
          </div>



          <h1 style={{ fontSize:22, fontWeight:800, color:"#0f172a", marginBottom:4, lineHeight:1.2 }}>
            {tab === "login" ? "Welcome back" : "Get Started Now"}
          </h1>
          <p style={{ fontSize:13, color:"#64748b", marginBottom:20 }}>
            {tab === "login"
              ? "Sign in to your workshop dashboard"
              : "Create your customer account today"}
          </p>

          {/* ── LOGIN FORM ── */}
          {tab === "login" ? (
            <form onSubmit={handleLogin} style={{ display:"flex", flexDirection:"column", gap:0 }}>

              <div style={{ marginBottom:14 }}>
                <label style={labelStyle}>Email address</label>
                <input style={inputStyle} type="email" placeholder="Enter your email"
                  value={form.email} onChange={set("email")} required
                  onFocus={e=>{e.target.style.borderColor="#f59e0b";e.target.style.boxShadow="0 0 0 3px rgba(245,158,11,0.15)";}}
                  onBlur={e=>{e.target.style.borderColor="#d1d5db";e.target.style.boxShadow="none";}} />
              </div>

              <div style={{ marginBottom:18 }}>
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

              <p style={{ textAlign:"center", marginTop:16, fontSize:12, color:"#64748b" }}>
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

              <div style={{ marginBottom:12 }}>
                <label style={labelStyle}>Full Name</label>
                <input style={inputStyle} placeholder="Saman Perera"
                  value={form.full_name} onChange={set("full_name")} required
                  onFocus={e=>{e.target.style.borderColor="#f59e0b";e.target.style.boxShadow="0 0 0 3px rgba(245,158,11,0.15)";}}
                  onBlur={e=>{e.target.style.borderColor="#d1d5db";e.target.style.boxShadow="none";}} />
              </div>

              <div style={{ marginBottom:12 }}>
                <label style={labelStyle}>Email address</label>
                <input style={inputStyle} type="email" placeholder="Enter your email"
                  value={form.email} onChange={set("email")} required
                  onFocus={e=>{e.target.style.borderColor="#f59e0b";e.target.style.boxShadow="0 0 0 3px rgba(245,158,11,0.15)";}}
                  onBlur={e=>{e.target.style.borderColor="#d1d5db";e.target.style.boxShadow="none";}} />
              </div>

              <div style={{ marginBottom:12 }}>
                <label style={labelStyle}>Phone</label>
                <input style={inputStyle} placeholder="0771234567"
                  value={form.phone} onChange={set("phone")}
                  onFocus={e=>{e.target.style.borderColor="#f59e0b";e.target.style.boxShadow="0 0 0 3px rgba(245,158,11,0.15)";}}
                  onBlur={e=>{e.target.style.borderColor="#d1d5db";e.target.style.boxShadow="none";}} />
              </div>

              <div style={{ marginBottom:12 }}>
                <label style={labelStyle}>Password</label>
                <input style={inputStyle} type="password" placeholder="Min. 6 characters"
                  value={form.password} onChange={set("password")} required minLength={6}
                  onFocus={e=>{e.target.style.borderColor="#f59e0b";e.target.style.boxShadow="0 0 0 3px rgba(245,158,11,0.15)";}}
                  onBlur={e=>{e.target.style.borderColor="#d1d5db";e.target.style.boxShadow="none";}} />
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
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

              <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:"#475569", marginBottom:14, cursor:"pointer" }}>
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                  style={{ width:14, height:14, accentColor:"#f59e0b" }} />
                I agree to the{" "}
                <span style={{ color:"#f59e0b", textDecoration:"underline" }}>terms & policy</span>
              </label>

              <button type="submit" style={btnPrimary} disabled={loading}
                onMouseEnter={e=>e.currentTarget.style.opacity="0.9"}
                onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                {loading ? "Creating account…" : "Create Account"}
              </button>

              <p style={{ textAlign:"center", marginTop:14, fontSize:12, color:"#64748b" }}>
                Have an account?{" "}
                <span onClick={() => setTab("register")}
                  style={{ color:"#f59e0b", fontWeight:600, cursor:"pointer", textDecoration:"underline" }}>
                  Sign In
                </span>
              </p>
            </form>
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL — Garage Image ── */}
      <div style={{ flex:1, height:"100vh", overflow:"hidden" }}>
        <img src={garageHero} alt="PitStopPro Workshop"
          style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center" }} />
      </div>
    </div>
  );
}