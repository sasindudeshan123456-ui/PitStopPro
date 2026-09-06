import { useState, useEffect } from "react";
import api from "../api/axios";

export default function ServiceHistoryModal({ vehicleId, licensePlate, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (vehicleId || licensePlate) {
      api.get(`/customers/vehicles/${vehicleId || licensePlate}/history`)
        .then(res => setHistory(res.data))
        .catch(() => setHistory([]))
        .finally(() => setLoading(false));
    }
  }, [vehicleId, licensePlate]);

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
            <span style={{ fontSize: 24 }}>??</span>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Vehicle Diagnostic & Repair History (US04)</h3>
              <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>Complete service timeline for plate: <strong style={{ color: "#fbbf24" }}>{licensePlate || "Selected Vehicle"}</strong></p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#cbd5e1", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontWeight: 700 }}>? Close</button>
        </div>

        {loading ? <p style={{ color: "#94a3b8" }}>Loading service timeline...</p> : history.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>
            <span style={{ fontSize: 32 }}>??</span>
            <p>No previous repair records found for this vehicle. First service intake!</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {history.map(item => (
              <div key={item.id} style={{
                background: "rgba(30,41,59,0.7)", borderRadius: 12, padding: 18, borderLeft: "4px solid #f59e0b", border: "1px solid rgba(255,255,255,0.08)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#fbbf24" }}>Job Card #{item.job_number}</span>
                    <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: 10 }}>{new Date(item.created_at).toLocaleDateString("en-GB")}</span>
                  </div>
                  <span style={{
                    padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 800,
                    background: item.status === "invoiced" ? "rgba(34,197,94,0.2)" : "rgba(245,158,11,0.2)",
                    color: item.status === "invoiced" ? "#4ade80" : "#fbbf24"
                  }}>{item.status.toUpperCase()}</span>
                </div>

                <div style={{ fontSize: 13, color: "#cbd5e1", marginBottom: 8 }}>
                  <strong>Reported Issue:</strong> {item.reported_issue}
                </div>
                {item.diagnosis_notes && (
                  <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8, fontStyle: "italic" }}>
                    Diagnosis: {item.diagnosis_notes}
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: 12, color: "#64748b" }}>
                  <span>Advisor: {item.advisor_name || "Service Advisor"}</span>
                  <strong style={{ color: "#f59e0b", fontSize: 14 }}>Cost: LKR {parseFloat(item.estimated_cost || 0).toLocaleString()}</strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

