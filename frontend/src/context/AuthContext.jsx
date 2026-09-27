import { createContext, useContext, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    let saved = sessionStorage.getItem("psp_user");
    if (!saved) {
      saved = localStorage.getItem("psp_user");
      const savedToken = localStorage.getItem("psp_token");
      if (saved && savedToken) {
        try {
          sessionStorage.setItem("psp_user", saved);
          sessionStorage.setItem("psp_token", savedToken);
        } catch {}
      }
    }
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      const { token, user: u } = res.data;
      sessionStorage.setItem("psp_token", token);
      sessionStorage.setItem("psp_user", JSON.stringify(u));
      localStorage.setItem("psp_token", token);
      localStorage.setItem("psp_user", JSON.stringify(u));
      setUser(u);
      return u;
    } catch (err) {
      // Fallback Demo Authentication when Backend API is unreachable (e.g. Vercel deployment without live backend server)
      const isNetworkOrError = !err.response || 
        err.message === "Network Error" || 
        err.code === "ERR_NETWORK" || 
        err.code === "ECONNREFUSED" || 
        err.response?.status === 404 || 
        err.response?.status === 500;

      if (isNetworkOrError) {
        console.warn("Backend API unreachable. Falling back to Demo Authentication mode.");
        const fallbackUsers = {
          "manager@pitstoppro.lk": { id: 1, name: "Workshop Manager", email: "manager@pitstoppro.lk", role: "manager", phone: "0771234001" },
          "advisor@pitstoppro.lk": { id: 18, name: "Service Advisor", email: "advisor@pitstoppro.lk", role: "advisor", phone: "0771234002" },
          "supervisor@pitstoppro.lk": { id: 19, name: "Workshop Supervisor", email: "supervisor@pitstoppro.lk", role: "supervisor", phone: "0771234003" },
          "technician@pitstoppro.lk": { id: 20, name: "Senior Technician", email: "technician@pitstoppro.lk", role: "technician", phone: "0771234004" },
          "storekeeper@pitstoppro.lk": { id: 21, name: "Inventory Storekeeper", email: "storekeeper@pitstoppro.lk", role: "storekeeper", phone: "0771234005" },
          "cashier@pitstoppro.lk": { id: 22, name: "Billing Cashier", email: "cashier@pitstoppro.lk", role: "cashier", phone: "0771234006" },
          "sasindu@gmail.com": { id: 17, name: "Sasindu Deshan", email: "sasindu@gmail.com", role: "customer", phone: "0760840228" },
          "kelumsampath@gmail.com": { id: 23, name: "Kelum Sampath", email: "kelumsampath@gmail.com", role: "customer", phone: "0912233789" }
        };

        const cleanEmail = (email || "").toLowerCase().trim();
        let u = fallbackUsers[cleanEmail];
        
        if (!u) {
          let role = "customer";
          if (cleanEmail.includes("manager")) role = "manager";
          else if (cleanEmail.includes("advisor")) role = "advisor";
          else if (cleanEmail.includes("cashier")) role = "cashier";
          else if (cleanEmail.includes("storekeeper")) role = "storekeeper";
          else if (cleanEmail.includes("tech") || cleanEmail.includes("supervisor")) role = "technician";
          
          u = {
            id: Date.now(),
            name: cleanEmail ? cleanEmail.split("@")[0].toUpperCase() : "DEMO USER",
            email: cleanEmail || "demo@pitstoppro.lk",
            role: role,
            phone: "0771234001"
          };
        }

        const fakeToken = "demo_token_" + Date.now();
        sessionStorage.setItem("psp_token", fakeToken);
        sessionStorage.setItem("psp_user", JSON.stringify(u));
        localStorage.setItem("psp_token", fakeToken);
        localStorage.setItem("psp_user", JSON.stringify(u));
        setUser(u);
        return u;
      }
      throw err;
    }
  };

  const logout = () => {
    sessionStorage.removeItem("psp_token");
    sessionStorage.removeItem("psp_user");
    localStorage.removeItem("psp_token");
    localStorage.removeItem("psp_user");
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    const newUser = { ...user, ...updatedUser };
    sessionStorage.setItem("psp_user", JSON.stringify(newUser));
    localStorage.setItem("psp_user", JSON.stringify(newUser));
    setUser(newUser);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
