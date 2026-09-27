import { useRef } from "react";
import { Printer, X, Shield, Calendar, Car, User, Wrench, CheckCircle, FileText } from "lucide-react";

export default function JobCardPrintModal({ jobCard, onClose }) {
  const printRef = useRef();

  if (!jobCard) return null;

  const handlePrint = () => {
    window.print();
  };

  const damageList = (() => {
    try {
      if (!jobCard.exterior_damage) return [];
      return typeof jobCard.exterior_damage === "string"
        ? JSON.parse(jobCard.exterior_damage)
        : jobCard.exterior_damage;
    } catch {
      return [];
    }
  })();

  return (
    <div className="modal-overlay" style={{ zIndex: 9999, overflowY: "auto", padding: "20px 0" }}>
      <div className="modal-card" style={{ maxWidth: 850, width: "95%", margin: "auto", background: "#fff", color: "#1e293b", padding: 0 }}>
        
        {/* Action Header (Hidden on Print) */}
        <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", background: "#0f172a", color: "#fff", borderRadius: "12px 12px 0 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FileText size={20} style={{ color: "#f59e0b" }} />
            <span style={{ fontWeight: 700, fontSize: 16 }}>Official Workshop Job Card — #{jobCard.job_number}</span>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-primary btn-sm" onClick={handlePrint} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Printer size={15} /> Print Job Card
            </button>
            <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ color: "#fff", borderColor: "#475569" }}>
              <X size={15} /> Close
            </button>
          </div>
        </div>

        {/* Printable Document Content */}
        <div ref={printRef} className="printable-job-card" style={{ padding: "36px 40px", background: "#fff", fontFamily: "'Inter', sans-serif" }}>
          
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "3px solid #0f172a", paddingBottom: 20, marginBottom: 24 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 26, fontWeight: 900, color: "#d97706", letterSpacing: "-0.5px" }}>PITSTOP<span style={{ color: "#0f172a" }}>PRO</span></span>
                <span style={{ fontSize: 11, background: "#0f172a", color: "#f59e0b", fontWeight: 800, padding: "2px 8px", borderRadius: 4 }}>PERFORMANCE WORKSHOP</span>
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 6, lineHeight: 1.4 }}>
                124/B Industrial Zone, High Level Road, Colombo, Sri Lanka<br />
                Hotline: +94 11 234 5678 · Email: service@pitstoppro.lk · Web: pitstoppro.lk
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>WORKSHOP JOB CARD</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", fontFamily: "monospace", marginTop: 2 }}>{jobCard.job_number}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                <strong>Date:</strong> {new Date(jobCard.created_at || Date.now()).toLocaleDateString("en-LK", { dateStyle: "long" })}
              </div>
              <div style={{ fontSize: 12, color: "#64748b" }}>
                <strong>Intake Advisor:</strong> {jobCard.advisor_name || "Workshop Manager"}
              </div>
            </div>
          </div>

          {/* Customer & Vehicle 2-Column Box */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
            
            {/* Customer Box */}
            <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: "14px 16px", background: "#f8fafc" }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a", textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <User size={14} style={{ color: "#d97706" }} /> Customer Details
              </div>
              <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ color: "#64748b", padding: "3px 0", width: 90 }}><strong>Name:</strong></td>
                    <td style={{ color: "#0f172a", fontWeight: 600 }}>{jobCard.customer_name || "Valued Customer"}</td>
                  </tr>
                  <tr>
                    <td style={{ color: "#64748b", padding: "3px 0" }}><strong>Phone:</strong></td>
                    <td style={{ color: "#0f172a" }}>{jobCard.customer_phone || "—"}</td>
                  </tr>
                  <tr>
                    <td style={{ color: "#64748b", padding: "3px 0" }}><strong>Email:</strong></td>
                    <td style={{ color: "#0f172a" }}>{jobCard.customer_email || "—"}</td>
                  </tr>
                  <tr>
                    <td style={{ color: "#64748b", padding: "3px 0" }}><strong>NIC / ID:</strong></td>
                    <td style={{ color: "#0f172a" }}>{jobCard.customer_nic || "—"}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Vehicle Box */}
            <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: "14px 16px", background: "#f8fafc" }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a", textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <Car size={14} style={{ color: "#d97706" }} /> Vehicle Information
              </div>
              <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ color: "#64748b", padding: "3px 0", width: 100 }}><strong>License Plate:</strong></td>
                    <td style={{ color: "#0f172a", fontWeight: 800, fontSize: 14 }}>{jobCard.license_plate}</td>
                  </tr>
                  <tr>
                    <td style={{ color: "#64748b", padding: "3px 0" }}><strong>Make & Model:</strong></td>
                    <td style={{ color: "#0f172a", fontWeight: 600 }}>{jobCard.make} {jobCard.model} ({jobCard.year})</td>
                  </tr>
                  <tr>
                    <td style={{ color: "#64748b", padding: "3px 0" }}><strong>Color & Odo:</strong></td>
                    <td style={{ color: "#0f172a" }}>{jobCard.color || "Standard"} · {jobCard.mileage ? `${jobCard.mileage.toLocaleString()} km` : "—"}</td>
                  </tr>
                  <tr>
                    <td style={{ color: "#64748b", padding: "3px 0" }}><strong>VIN / Chassis:</strong></td>
                    <td style={{ color: "#0f172a", fontFamily: "monospace", fontSize: 12 }}>{jobCard.vin || "—"}</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>

          {/* Reported Issues & Services Requested */}
          <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: "14px 16px", marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a", textTransform: "uppercase", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
              <Wrench size={14} style={{ color: "#d97706" }} /> Customer Reported Issues & Services Requested
            </div>
            <div style={{ fontSize: 13, color: "#334155", background: "#f1f5f9", padding: "10px 14px", borderRadius: 6, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
              {jobCard.reported_issue || "General service and multi-point workshop inspection"}
            </div>
          </div>

          {/* Diagnosis & Advisor Notes */}
          {jobCard.diagnosis_notes && (
            <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: "14px 16px", marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a", textTransform: "uppercase", marginBottom: 6 }}>
                🔍 Intake Diagnosis & Technical Notes
              </div>
              <div style={{ fontSize: 13, color: "#334155", background: "#f8fafc", padding: "10px 14px", borderRadius: 6, lineHeight: 1.5 }}>
                {jobCard.diagnosis_notes}
              </div>
            </div>
          )}

          {/* Exterior Damage Logged */}
          {damageList.length > 0 && (
            <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: "14px 16px", marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a", textTransform: "uppercase", marginBottom: 6 }}>
                ⚠️ Vehicle Walkaround Pre-Existing Damage Log
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
                {damageList.map((d, i) => (
                  <div key={i} style={{ fontSize: 12, padding: "6px 10px", background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 6, color: "#92400e" }}>
                    <strong>{d.panel || "Panel"}:</strong> {d.damage_type || d.type || "Scratch/Dent"} {d.notes ? `(${d.notes})` : ""}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cost Estimate & Approvals */}
          <div style={{ border: "2px solid #0f172a", borderRadius: 8, padding: "16px 20px", marginBottom: 28, background: "#fffbeb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#92400e", textTransform: "uppercase" }}>Estimated Total Cost</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", marginTop: 2 }}>
                LKR {Number(jobCard.estimated_cost || 0).toLocaleString("en-LK", { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: 11, color: "#78350f", marginTop: 4 }}>
                * Estimate includes initial diagnostics, standard workshop labor and identified parts. Final billing may vary upon customer-approved additional work.
              </div>
            </div>
            <div style={{ textAlign: "right", minWidth: 160 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Customer Approval Status</div>
              <span style={{
                display: "inline-block", marginTop: 4, padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 800,
                background: jobCard.customer_approval_status === "approved" ? "#dcfce7" : "#fef3c7",
                color: jobCard.customer_approval_status === "approved" ? "#166534" : "#92400e"
              }}>
                {jobCard.customer_approval_status === "approved" ? "✅ APPROVED" : "⏳ PENDING APPROVAL"}
              </span>
            </div>
          </div>

          {/* Signatures */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, marginTop: 40, paddingTop: 20, borderTop: "1px dashed #cbd5e1" }}>
            <div>
              <div style={{ borderBottom: "1px solid #0f172a", height: 50 }}></div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", marginTop: 6 }}>Customer Signature & Consent</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>I authorize the diagnosis & repair work described above.</div>
            </div>
            <div>
              <div style={{ borderBottom: "1px solid #0f172a", height: 50 }}></div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", marginTop: 6 }}>Service Advisor / Workshop Seal</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>PitStop Performance Workshop Authorization</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
