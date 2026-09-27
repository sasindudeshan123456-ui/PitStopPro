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

const quickBtnStyle = {
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid #cbd5e1",
  background: "#f8fafc",
  color: "#334155",
  fontSize: 11,
  fontWeight: 600,
  cursor: "pointer",
  textAlign: "center",
  transition: "all 0.2s",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 4
};

// Tab labels
const TABS = [
  { key: "login",           label: "Sign In" },
  { key: "register",        label: "Customer Register" },
  { key: "staff_register",  label: "Staff Register" },
];

export default function LoginPage() {
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ email:"", password:"", full_name:"", phone:"", nic:"", address:"" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const set = k => e => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: null }));
  };

  // Focus/blur helpers for input highlight
  const focusStyle = (e, field) => {
    e.target.style.borderColor = errors[field] ? "#dc2626" : "#f59e0b";
    e.target.style.boxShadow = errors[field] ? "0 0 0 3px rgba(220,38,38,0.15)" : "0 0 0 3px rgba(245,158,11,0.15)";
  };
  const blurStyle = (e, field) => {
    e.target.style.borderColor = errors[field] ? "#dc2626" : "#d1d5db";
    e.target.style.boxShadow = "none";
  };

  const handleLogin = async e => {
    e.preventDefault(); setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(roleRedirects[user.role] || "/");
    } catch (err) { toast.error(err.response?.data?.message || "Login failed"); }
    finally { setLoading(false); }
  };

  const fillAndLogin = async (email, password) => {
    setForm({ email, password, full_name: "", phone: "", nic: "", address: "" });
    setLoading(true);
    try {
      const u = await login(email, password);
      toast.success(`Welcome back, ${u.name}!`);
      navigate(roleRedirects[u.role] || "/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const validateRegister = () => {
    const errs = {};
    const full_name = form.full_name?.trim() || "";
    const email = form.email?.trim() || "";
    const phone = form.phone?.trim() || "";
    const password = form.password || "";
    const address = form.address?.trim() || "";

    if (!full_name) errs.full_name = "Full Name is required";
    const emailLower = email.toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      errs.email = "Email address is required";
    } else if (!emailRegex.test(emailLower) || !(emailLower.endsWith(".com") || emailLower.endsWith(".lk"))) {
      errs.email = "Email must be valid (e.g. name@gmail.com or ending with .com / .lk)";
    }
    const cleanPhone = phone.replace(/[\s-]/g, "");
    if (!phone) {
      errs.phone = "Phone number is required";
    } else if (!/^(07\d{8}|0\d{8,9}|\+94\d{9})$/.test(cleanPhone)) {
      errs.phone = "Phone number must be a valid Sri Lankan phone number (e.g. 0771234567)";
    }
    if (!password) {
      errs.password = "Password is required";
    } else if (password.length < 6) {
      errs.password = "Password must be at least 6 characters long";
    }
    if (!address) errs.address = "Address is required";
    if (!agreed) errs.agreed = "You must agree to terms & policy";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async e => {
    e.preventDefault();
    if (!validateRegister()) return;
    setLoading(true);
    try {
      await api.post("/auth/register", form);
      toast.success("Account created successfully! Logging in...");
      const u = await login(form.email, form.password);
      navigate(roleRedirects[u.role] || "/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#0f172a", fontFamily:"'Inter', sans-serif" }}>
      {/* ── LEFT PANEL — Login Form ── */}
      <div style={{ flex:"0 0 460px", background:"#ffffff", display:"flex", flexDirection:"column", justifyContent:"center", padding:"40px 48px", boxShadow:"5px 0 25px rgba(0,0,0,0.15)", zIndex:10 }}>
        
        {/* Brand Header */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:28 }}>
          <img src={logoImg} alt="PitStop Performance" style={{ height:46, objectFit:"contain" }} />
          <div>
            <h1 style={{ margin:0, fontSize:20, fontWeight:800, color:"#0f172a", letterSpacing:"-0.5px" }}>PitStop Performance</h1>
            <p style={{ margin:0, fontSize:11, color:"#64748b", fontWeight:500 }}>Workshop Management System</p>
          </div>
        </div>

        {/* Tab Selector */}
        <div style={{ display:"flex", background:"#f1f5f9", borderRadius:8, padding:3, marginBottom:24 }}>
          {TABS.map(t => (
            <button key={t.key} type="button" onClick={() => { setTab(t.key); setErrors({}); }} style={{
              flex:1, padding:"7px 0", border:"none", borderRadius:6, fontSize:12, fontWeight:600, cursor:"pointer", transition:"0.2s",
              background: tab === t.key ? "#ffffff" : "transparent",
              color: tab === t.key ? "#0f172a" : "#64748b",
              boxShadow: tab === t.key ? "0 1px 4px rgba(0,0,0,0.1)" : "none"
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div>
          {/* ── SIGN IN FORM ── */}
          {tab === "login" && (
            <form onSubmit={handleLogin} style={{ display:"flex", flexDirection:"column", gap:0 }}>
              <div style={{ marginBottom:14 }}>
                <label style={labelStyle}>Email Address or Username</label>
                <input id="login-email" style={inputStyle} type="text" placeholder="e.g. manager@pitstoppro.lk or kelumsampath@gmail.com"
                  value={form.email} onChange={set("email")} required
                  onFocus={e => focusStyle(e, "email")} onBlur={e => blurStyle(e, "email")} />
              </div>
              <div style={{ marginBottom:18 }}>
                <label style={labelStyle}>Password</label>
                <input id="login-password" style={inputStyle} type="password" placeholder="••••••••"
                  value={form.password} onChange={set("password")} required
                  onFocus={e => focusStyle(e, "password")} onBlur={e => blurStyle(e, "password")} />
              </div>
              <button id="login-submit" type="submit" style={btnPrimary} disabled={loading}
                onMouseEnter={e=>e.currentTarget.style.opacity="0.9"}
                onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                {loading ? "Signing in…" : "Sign In"}
              </button>

              {/* Quick Demo Buttons for Easy 1-Click Testing */}
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px dashed #e2e8f0" }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "#64748b", marginBottom: 10, textAlign: "center" }}>
                  ⚡ Quick Demo Accounts (Click to Test)
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <button type="button" onClick={() => fillAndLogin("manager@pitstoppro.lk", "Admin@1234")} style={quickBtnStyle}>
                    🛠️ Manager
                  </button>
                  <button type="button" onClick={() => fillAndLogin("kelumsampath@gmail.com", "Admin@1234")} style={quickBtnStyle}>
                    👤 Customer (Kelum)
                  </button>
                  <button type="button" onClick={() => fillAndLogin("advisor@pitstoppro.lk", "Admin@1234")} style={quickBtnStyle}>
                    📋 Service Advisor
                  </button>
                  <button type="button" onClick={() => fillAndLogin("storekeeper@pitstoppro.lk", "Admin@1234")} style={quickBtnStyle}>
                    📦 Storekeeper
                  </button>
                  <button type="button" onClick={() => fillAndLogin("cashier@pitstoppro.lk", "Admin@1234")} style={quickBtnStyle}>
                    💳 Cashier
                  </button>
                  <button type="button" onClick={() => fillAndLogin("sasindu@gmail.com", "Admin@1234")} style={quickBtnStyle}>
                    👤 Customer (Sasindu)
                  </button>
                </div>
              </div>

              <div style={{ textAlign:"center", marginTop:18, fontSize:12, color:"#64748b" }}>
                <p style={{ margin:0 }}>
                  New customer?{" "}
                  <span onClick={() => { setTab("register"); setErrors({}); }} style={{ color:"#f59e0b", fontWeight:600, cursor:"pointer", textDecoration:"underline" }}>Register here</span>
                </p>
              </div>
            </form>
          )}

          {/* ── CUSTOMER REGISTER FORM ── */}
          {tab === "register" && (
            <form onSubmit={handleRegister} noValidate style={{ display:"flex", flexDirection:"column", gap:0 }}>
              <div style={{ marginBottom:12 }}>
                <label style={labelStyle}>Full Name *</label>
                <input
                  style={{ ...inputStyle, borderColor: errors.full_name ? "#dc2626" : "#d1d5db" }}
                  placeholder="Kasun Perera"
                  value={form.full_name} onChange={set("full_name")}
                  onFocus={e => focusStyle(e, "full_name")} onBlur={e => blurStyle(e, "full_name")} />
                {errors.full_name && <span style={{ fontSize:11, color:"#dc2626", marginTop:3, display:"block", fontWeight:600 }}>⚠️ {errors.full_name}</span>}
              </div>

              <div style={{ marginBottom:12 }}>
                <label style={labelStyle}>Email address *</label>
                <input
                  style={{ ...inputStyle, borderColor: errors.email ? "#dc2626" : "#d1d5db" }}
                  type="email" placeholder="kasunperera@gmail.com"
                  value={form.email} onChange={set("email")}
                  onFocus={e => focusStyle(e, "email")} onBlur={e => blurStyle(e, "email")} />
                {errors.email && <span style={{ fontSize:11, color:"#dc2626", marginTop:3, display:"block", fontWeight:600 }}>⚠️ {errors.email}</span>}
              </div>

              <div style={{ marginBottom:12 }}>
                <label style={labelStyle}>Phone *</label>
                <input
                  style={{ ...inputStyle, borderColor: errors.phone ? "#dc2626" : "#d1d5db" }}
                  placeholder="0771234567"
                  value={form.phone} onChange={set("phone")}
                  onFocus={e => focusStyle(e, "phone")} onBlur={e => blurStyle(e, "phone")} />
                {errors.phone && <span style={{ fontSize:11, color:"#dc2626", marginTop:3, display:"block", fontWeight:600 }}>⚠️ {errors.phone}</span>}
              </div>

              <div style={{ marginBottom:12 }}>
                <label style={labelStyle}>Password *</label>
                <input
                  style={{ ...inputStyle, borderColor: errors.password ? "#dc2626" : "#d1d5db" }}
                  type="password" placeholder="Min. 6 characters"
                  value={form.password} onChange={set("password")}
                  onFocus={e => focusStyle(e, "password")} onBlur={e => blurStyle(e, "password")} />
                {errors.password && <span style={{ fontSize:11, color:"#dc2626", marginTop:3, display:"block", fontWeight:600 }}>⚠️ {errors.password}</span>}
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
                <div>
                  <label style={labelStyle}>NIC Number</label>
                  <input
                    style={inputStyle}
                    placeholder="990123456V"
                    value={form.nic} onChange={set("nic")}
                    onFocus={e => focusStyle(e, "nic")} onBlur={e => blurStyle(e, "nic")} />
                </div>

                <div>
                  <label style={labelStyle}>Address *</label>
                  <input
                    style={{ ...inputStyle, borderColor: errors.address ? "#dc2626" : "#d1d5db" }}
                    placeholder="Colombo 07"
                    value={form.address} onChange={set("address")}
                    onFocus={e => focusStyle(e, "address")} onBlur={e => blurStyle(e, "address")} />
                  {errors.address && <span style={{ fontSize:11, color:"#dc2626", marginTop:3, display:"block", fontWeight:600 }}>⚠️ {errors.address}</span>}
                </div>
              </div>

              <div style={{ marginBottom:14 }}>
                <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:"#475569", cursor:"pointer" }}>
                  <input type="checkbox" checked={agreed} onChange={e => {
                    setAgreed(e.target.checked);
                    if (errors.agreed) setErrors(prev => ({ ...prev, agreed: null }));
                  }}
                    style={{ width:14, height:14, accentColor:"#f59e0b" }} />
                  I agree to the{" "}<span style={{ color:"#f59e0b", textDecoration:"underline" }}>terms & policy</span>
                </label>
                {errors.agreed && <span style={{ fontSize:11, color:"#dc2626", marginTop:4, display:"block", fontWeight:600 }}>⚠️ {errors.agreed}</span>}
              </div>

              <button type="submit" style={btnPrimary} disabled={loading}
                onMouseEnter={e=>e.currentTarget.style.opacity="0.9"}
                onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                {loading ? "Creating account…" : "Create Customer Account"}
              </button>

              <p style={{ textAlign:"center", marginTop:12, fontSize:12, color:"#64748b" }}>
                Already have an account?{" "}
                <span onClick={() => { setTab("login"); setErrors({}); }} style={{ color:"#f59e0b", fontWeight:600, cursor:"pointer", textDecoration:"underline" }}>Sign In</span>
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