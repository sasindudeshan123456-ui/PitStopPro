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
  const [showAddForm, setShowAddForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    role: "advisor"
  });

  const fetchUsers = async () => {
    try {
      const res = await api.get("/manager/staff");
      setUsers(res.data);
    } catch (err) { toast.error("Failed to load staff list"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const setField = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.password) {
      return toast.error("Name, Email, and Password are required");
    }
    setCreateLoading(true);
    try {
      await api.post("/manager/staff", form);
      toast.success(`Staff user ${form.full_name} created successfully!`);
      setForm({ full_name: "", email: "", password: "", phone: "", role: "advisor" });
      setShowAddForm(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create staff member");
    } finally {
      setCreateLoading(false);
    }
  };

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

  const deleteUser = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete staff user "${name}"?`)) return;
    try {
      await api.delete(`/manager/staff/${id}`);
      toast.success(`User "${name}" deleted`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete user");
    }
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
        width: "100%", maxWidth: 900, maxHeight: "88vh", overflowY: "auto", padding: 28
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>🛡️</span>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Garage Staff & User Management</h3>
              <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>Create new staff members, assign roles, and manage permissions</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#cbd5e1", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontWeight: 700 }}>✕ Close</button>
        </div>

        {/* Action Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setFilterPending(false)} style={{
              padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer",
              border: !filterPending ? "1px solid #f59e0b" : "1px solid #334155",
              background: !filterPending ? "rgba(245,158,11,0.2)" : "#1e293b",
              color: !filterPending ? "#fbbf24" : "#cbd5e1"
            }}>All Staff ({users.length})</button>
            {pendingCount > 0 && (
              <button onClick={() => setFilterPending(true)} style={{
                padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer",
                border: filterPending ? "1px solid #ef4444" : "1px solid #334155",
                background: filterPending ? "rgba(239,68,68,0.2)" : "#1e293b",
                color: filterPending ? "#f87171" : "#cbd5e1"
              }}>
                Pending Approvals ({pendingCount})
              </button>
            )}
          </div>
          <button onClick={() => setShowAddForm(!showAddForm)} style={{
            padding: "7px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer",
            background: showAddForm ? "#334155" : "linear-gradient(135deg, #f59e0b, #d97706)",
            color: "#ffffff", border: "none", boxShadow: showAddForm ? "none" : "0 3px 10px rgba(245,158,11,0.3)"
          }}>
            {showAddForm ? "Cancel" : "+ Add Garage Staff Member"}
          </button>
        </div>

        {/* Add Staff Form */}
        {showAddForm && (
          <form onSubmit={handleCreateStaff} style={{
            background: "#1e293b", borderRadius: 12, padding: 20, marginBottom: 20,
            border: "1px solid rgba(245,158,11,0.3)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12
          }}>
            <h4 style={{ gridColumn: "1 / -1", margin: 0, fontSize: 14, fontWeight: 700, color: "#f59e0b" }}>
              ➕ Add New Staff Account
            </h4>
            <div>
              <label style={{ display: "block", fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>Full Name *</label>
              <input value={form.full_name} onChange={setField("full_name")} required placeholder="e.g. Nimal Perera" style={{
                width: "100%", padding: "7px 10px", borderRadius: 6, background: "#0f172a", border: "1px solid #334155", color: "#f8fafc", fontSize: 12
              }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>Email Address *</label>
              <input type="email" value={form.email} onChange={setField("email")} required placeholder="advisor@pitstoppro.lk" style={{
                width: "100%", padding: "7px 10px", borderRadius: 6, background: "#0f172a", border: "1px solid #334155", color: "#f8fafc", fontSize: 12
              }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>Password *</label>
              <input type="password" value={form.password} onChange={setField("password")} required placeholder="••••••••" style={{
                width: "100%", padding: "7px 10px", borderRadius: 6, background: "#0f172a", border: "1px solid #334155", color: "#f8fafc", fontSize: 12
              }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>Phone</label>
              <input value={form.phone} onChange={setField("phone")} placeholder="0771234567" style={{
                width: "100%", padding: "7px 10px", borderRadius: 6, background: "#0f172a", border: "1px solid #334155", color: "#f8fafc", fontSize: 12
              }} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>Assigned Role *</label>
              <select value={form.role} onChange={setField("role")} style={{
                width: "100%", padding: "7px 10px", borderRadius: 6, background: "#0f172a", border: "1px solid #f59e0b", color: "#fbbf24", fontSize: 12, fontWeight: 700
              }}>
                {ROLES.map(r => <option key={r} value={r}>{r.replace("_", " ").toUpperCase()}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1", textAlign: "right" }}>
              <button type="submit" disabled={createLoading} style={{
                padding: "8px 16px", borderRadius: 6, border: "none", background: "linear-gradient(135deg, #22c55e, #16a34a)",
                color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer"
              }}>
                {createLoading ? "Creating..." : "Save Staff Member"}
              </button>
            </div>
          </form>
        )}

        {loading ? <p style={{ color: "#94a3b8" }}>Loading user directory...</p> : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#1e293b", color: "#94a3b8", fontSize: 12, textAlign: "left" }}>
                <th style={{ padding: "10px 12px" }}>User Name</th>
                <th style={{ padding: "10px 12px" }}>Email / Contact</th>
                <th style={{ padding: "10px 12px" }}>Assign Role</th>
                <th style={{ padding: "10px 12px" }}>Status</th>
                <th style={{ padding: "10px 12px", textAlign: "right" }}>Admin Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedUsers.map(u => (
                <tr key={u.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 13 }}>
                  <td style={{ padding: "12px", fontWeight: 700, color: "#f8fafc" }}>
                    {u.full_name}
                    {u.role === "manager" && <span style={{ marginLeft: 6, fontSize: 10, background: "rgba(245,158,11,0.2)", color: "#fbbf24", padding: "2px 6px", borderRadius: 4 }}>Default Admin</span>}
                  </td>
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
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <button onClick={() => toggleUserStatus(u.id, u.is_active)} style={{
                        padding: "5px 10px", borderRadius: 6, border: "none", fontSize: 11, fontWeight: 800, cursor: "pointer",
                        background: u.is_active ? "rgba(239,68,68,0.2)" : "linear-gradient(135deg, #22c55e, #16a34a)",
                        color: u.is_active ? "#f87171" : "#ffffff"
                      }}>
                        {u.is_active ? "Revoke" : "Approve"}
                      </button>
                      {u.role !== "manager" && (
                        <button onClick={() => deleteUser(u.id, u.full_name)} style={{
                          padding: "5px 10px", borderRadius: 6, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.1)",
                          color: "#f87171", fontSize: 11, fontWeight: 700, cursor: "pointer"
                        }} title="Delete User">
                          🗑️ Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!displayedUsers.length && (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>No users found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}