import { useState, useEffect } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

const ROLES = ["manager", "advisor", "supervisor", "technician", "qc_inspector", "storekeeper", "cashier", "customer"];

export default function UserManagementModal({ onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/manager/staff");
      setUsers(res.data);
    } catch (err) { toast.error("Failed to load staff list"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const updateUserRole = async (id, newRole) => {
    try {
      await api.put(`/manager/staff/${id}`, { role: newRole });
      toast.success("User role updated successfully");
      fetchUsers();
    } catch (err) { toast.error("Failed to update role"); }
  };

  const toggleUserStatus = async (id, currentStatus) => {
    try {
      await api.put(`/manager/staff/${id}`, { is_active: currentStatus ? 0 : 1 });
      toast.success("User status updated");
      fetchUsers();
    } catch (err) { toast.error("Failed to update status"); }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20
    }}>
      <div style={{
        background: "#0f172a", color: "#f8fafc", borderRadius: 16, border: "1px solid rgba(255,255,255,0.15)",
        width: "100%", maxWidth: 800, maxHeight: "85vh", overflowY: "auto", padding: 28
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>???</span>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>User Access & Role Management (US19)</h3>
              <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>Manage system users, assign role-based permissions & access controls</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#cbd5e1", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontWeight: 700 }}>? Close</button>
        </div>

        {loading ? <p style={{ color: "#94a3b8" }}>Loading staff directory...</p> : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#1e293b", color: "#94a3b8", fontSize: 12, textAlign: "left" }}>
                <th style={{ padding: "10px 12px" }}>User Name</th>
                <th style={{ padding: "10px 12px" }}>Email</th>
                <th style={{ padding: "10px 12px" }}>Assigned Role</th>
                <th style={{ padding: "10px 12px" }}>Status</th>
                <th style={{ padding: "10px 12px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 13 }}>
                  <td style={{ padding: "12px", fontWeight: 700, color: "#f8fafc" }}>{u.full_name}</td>
                  <td style={{ padding: "12px", color: "#94a3b8" }}>{u.email}</td>
                  <td style={{ padding: "12px" }}>
                    <select value={u.role} onChange={e => updateUserRole(u.id, e.target.value)} style={{
                      padding: "4px 8px", borderRadius: 6, background: "#1e293b", border: "1px solid #334155",
                      color: "#fbbf24", fontSize: 12, fontWeight: 700, textTransform: "capitalize"
                    }}>
                      {ROLES.map(r => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: "12px" }}>
                    <span style={{
                      padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 800,
                      background: u.is_active ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                      color: u.is_active ? "#4ade80" : "#f87171"
                    }}>
                      {u.is_active ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                  <td style={{ padding: "12px", textAlign: "right" }}>
                    <button onClick={() => toggleUserStatus(u.id, u.is_active)} style={{
                      padding: "4px 10px", borderRadius: 6, border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer",
                      background: u.is_active ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)",
                      color: u.is_active ? "#f87171" : "#4ade80"
                    }}>
                      {u.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

