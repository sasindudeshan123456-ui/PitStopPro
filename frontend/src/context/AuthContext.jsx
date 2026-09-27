import { createContext, useContext, useState, useEffect } from "react";
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
    const res = await api.post("/auth/login", { email, password });
    const { token, user: u } = res.data;
    sessionStorage.setItem("psp_token", token);
    sessionStorage.setItem("psp_user", JSON.stringify(u));
    // Also store in localStorage as default session
    localStorage.setItem("psp_token", token);
    localStorage.setItem("psp_user", JSON.stringify(u));
    setUser(u);
    return u;
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
