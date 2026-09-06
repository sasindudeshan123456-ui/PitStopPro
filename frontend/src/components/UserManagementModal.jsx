import { useState, useEffect } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

const ROLES = [
  "manager",
  "advisor",
  "supervisor",
  "technician",
  "qc_inspector",
  "storekeeper",
  "cashier",
  "customer"
];

export default function UserManagementModal({ onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPending, setFilterPending] = useState(false);

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
      toast.success("User role assigned successfully");
      fetchUsers();
    } catch (err) { toast.error("Failed to update role"); }
  };

  const toggleUserStatus = async (id, currentStatus) => {
    try {
      await api.put(`/manager/staff/${id}`, { is_active: currentStatus ? 0 : 1 });
      toast.success(currentStatus ? "User access revoked" : "User approved & activated!");
      fetchUsers();
    } catch (err) { toast.error("Failed to update status"); }
  };

  const displayedUsers = filterPending ? users.filter(u => !u.is_active) : users;
  const pendingCount = users.filter(u => !u.is_active).length;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20
    }}>
      <div style={{
        background: "#0f172a", color: "#f8fafc", borderRadius: 16, border: "1px solid rgba(255,255,255,0.15)",
        width: "100%", maxWidth: 850, maxHeight: "85vh", overflowY: "auto", padding: 28
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>🛡️</span>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Admin Role Assignment & User Approvals</h3>
              <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>Review new registrations, assign staff roles, and authorize login permissions</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#cbd5e1", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontWeight: 700 }}>✕ Close</button>
        </div>

        {/* Filter bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setFilterPending(false)} style={{
              padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer",
              border: !filterPending ? "1px solid #f59e0b" : "1px solid #334155",
              background: !filterPending ? "rgba(245,158,11,0.2)" : "#1e293b",
              color: !filterPending ? "#fbbf24" : "#cbd5e1"
            }}>All Users ({users.length})</button>
            <button onClick={() => setFilterPending(true)} style={{
              padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer",
              border: filterPending ? "1px solid #ef4444" : "1px solid #334155",
              background: filterPending ? "rgba(239,68,68,0.2)" : "#1e293b",
              color: filterPending ? "#f87171" : "#cbd5e1"
            }}>
              Pending Approvals ({pendingCount})
            </button>
          </div>
        </div>

        {loading ? <p style={{ color: "#94a3b8" }}>Loading user directory...</p> : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#1e293b", color: "#94a3b8", fontSize: 12, textAlign: "left" }}>
                <th style={{ padding: "10px 12px" }}>User Name</th>
                <th style={{ padding: "10px 12px" }}>Email / Contact</th>
                <th style={{ padding: "10px 12px" }}>Assign Role</th>
                <th style={{ padding: "10px 12px" }}>Status</th>
                <th style={{ padding: "10px 12px", textAlign: "right" }}>Admin Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedUsers.map(u => (
                <tr key={u.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 13 }}>
                  <td style={{ padding: "12px", fontWeight: 700, color: "#f8fafc" }}>{u.full_name}</td>
                  <td style={{ padding: "12px", color: "#94a3b8" }}>
                    <div>{u.email}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{u.phone || "No phone"}</div>
                  </td>
                  <td style={{ padding: "12px" }}>
                    <select value={u.role} onChange={e => updateUserRole(u.id, e.target.value)} style={{
                      padding: "4px 10px", borderRadius: 6, background: "#1e293b", border: "1px solid #f59e0b",
                      color: "#fbbf24", fontSize: 12, fontWeight: 700, textTransform: "capitalize"
                    }}>
                      {ROLES.map(r => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: "12px" }}>
                    <span style={{
                      padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 800,
                      background: u.is_active ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                      color: u.is_active ? "#4ade80" : "#f87171"
                    }}>
                      {u.is_active ? "APPROVED" : "PENDING"}
                    </span>
                  </td>
                  <td style={{ padding: "12px", textAlign: "right" }}>
                    <button onClick={() => toggleUserStatus(u.id, u.is_active)} style={{
                      padding: "6px 12px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 800, cursor: "pointer",
                      background: u.is_active ? "rgba(239,68,68,0.2)" : "linear-gradient(135deg, #22c55e, #16a34a)",
                      color: u.is_active ? "#f87171" : "#ffffff", boxShadow: u.is_active ? "none" : "0 4px 12px rgba(34,197,94,0.3)"
                    }}>
                      {u.is_active ? "Revoke Access" : "✓ Approve & Activate"}
                    </button>
                  </td>
                </tr>
              ))}
              {!displayedUsers.length && (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>No users found for selected filter</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}