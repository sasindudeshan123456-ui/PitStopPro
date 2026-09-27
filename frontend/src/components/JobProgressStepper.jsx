import { useState } from "react";
import { CheckCircle2, Clock, Wrench, ShieldCheck, Receipt, AlertCircle, ArrowRight, Camera, Eye, X, Image as ImageIcon, Trash2 } from "lucide-react";

export default function JobProgressStepper({ job, onApprove, onReject, onDelete, approving = false }) {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  if (!job) return null;

  // Compute Stages and Approval Flags
  const isManagerPending = job.approval_status === "pending";
  const isManagerRejected = job.approval_status === "rejected";
  const isCustomerPending = (job.approval_status === "approved" || job.approval_status === "not_required") && job.customer_approval_status === "pending";
  const isCustomerApproved = job.customer_approval_status === "approved" || job.status === "in_progress" || job.status === "qc_check" || job.status === "completed" || job.status === "invoiced";
  const isBayWorking = job.status === "in_progress" || job.status === "qc_check" || job.status === "completed" || job.status === "invoiced";
  const isQC = job.status === "qc_check" || job.qc_status === "passed" || job.status === "completed" || job.status === "invoiced";
  const isCompleted = job.status === "completed" || job.status === "invoiced";
  const isInvoiced = job.status === "invoiced";
  const isRejected = isManagerRejected || job.customer_approval_status === "rejected" || job.status === "cancelled";

  let damageList = [];
  try {
    if (job.exterior_damage) {
      damageList = typeof job.exterior_damage === "string" ? JSON.parse(job.exterior_damage) : job.exterior_damage;
    }
  } catch {
    damageList = [];
  }

  const stages = [
    {
      id: 1,
      name: "Intake & Job Card",
      desc: "Inspection & Estimate",
      icon: Clock,
      done: true,
      active: false,
    },
    {
      id: 2,
      name: isManagerPending ? "Manager Review" : "Customer Approval",
      desc: isManagerPending
        ? "Awaiting Manager"
        : isCustomerApproved
        ? "Estimate Approved"
        : isRejected
        ? "Declined / Rejected"
        : "Awaiting Your Approval",
      icon: isCustomerApproved ? CheckCircle2 : isManagerPending ? Clock : AlertCircle,
      done: isCustomerApproved,
      active: (isManagerPending || isCustomerPending) && !isRejected,
      warning: isCustomerPending && !isRejected
    },
    {
      id: 3,
      name: "Workshop Bay Repair",
      desc: "Technicians & Parts",
      icon: Wrench,
      done: isBayWorking && job.status !== "in_progress",
      active: isCustomerApproved && job.status === "in_progress",
    },
    {
      id: 4,
      name: "QC Inspection",
      desc: job.qc_status === "passed" ? "QC Passed & Certified" : "Multi-point Testing",
      icon: ShieldCheck,
      done: isCompleted || job.qc_status === "passed",
      active: job.status === "qc_check",
    },
    {
      id: 5,
      name: "Invoice & Handover",
      desc: isInvoiced ? "Settled & Handed Over" : isCompleted ? "Ready for Collection" : "Billing & Settlement",
      icon: Receipt,
      done: isInvoiced,
      active: isCompleted && !isInvoiced,
    }
  ];

  return (
    <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "20px 24px", marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: "var(--accent)" }}>{job.job_number}</span>
            <span className={`badge badge-${job.status}`}>{job.status?.replace("_", " ")}</span>
            {isManagerPending && !isRejected && (
              <span style={{ background: "rgba(59,130,246,0.15)", color: "var(--blue)", border: "1px solid var(--blue)", fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 10 }}>
                ⏳ Pending Workshop Manager Review
              </span>
            )}
            {isCustomerPending && !isRejected && (
              <span style={{ background: "var(--red)", color: "#fff", fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 10, animation: "pulse 2s infinite" }}>
                ACTION REQUIRED: Customer Approval Pending
              </span>
            )}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
            {job.make} {job.model} · <strong style={{ color: "var(--text-primary)" }}>{job.license_plate}</strong> · Intake: {new Date(job.created_at).toLocaleDateString()}
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Estimate Amount</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>
            LKR {Number(job.estimated_cost || 0).toLocaleString("en-LK", { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Visual Stepper */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8, margin: "20px 0" }}>
        {stages.map((st) => {
          const Icon = st.icon;
          const isCurrent = st.active;
          const isDone = st.done;

          return (
            <div key={st.id} style={{
              position: "relative",
              padding: "12px 10px",
              borderRadius: 10,
              background: isCurrent ? "rgba(245,158,11,0.12)" : isDone ? "rgba(16,185,129,0.08)" : "var(--bg-card)",
              border: `1px solid ${isCurrent ? "var(--accent)" : isDone ? "rgba(16,185,129,0.3)" : "var(--border)"}`,
              transition: "all 0.3s ease",
              textAlign: "center"
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%", margin: "0 auto 8px auto",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: isDone ? "var(--green)" : isCurrent ? "var(--accent)" : "var(--border)",
                color: "#fff", fontWeight: 800, fontSize: 14, boxShadow: isCurrent ? "0 0 10px rgba(245,158,11,0.4)" : "none"
              }}>
                {isDone ? <CheckCircle2 size={18} /> : <Icon size={16} />}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: isCurrent ? "var(--accent)" : isDone ? "var(--green)" : "var(--text-secondary)" }}>
                {st.name}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, lineHeight: 1.2 }}>
                {st.desc}
              </div>
            </div>
          );
        })}
      </div>

      {/* STEP 1: Pending Workshop Manager Estimate Approval Notice */}
      {isManagerPending && !isRejected && (
        <div style={{
          marginTop: 16, padding: "16px 20px", borderRadius: 10,
          background: "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(37,99,235,0.06))",
          border: "1px solid rgba(59,130,246,0.4)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
              <Clock size={18} style={{ color: "var(--blue)" }} />
              Estimate Pending Workshop Manager Review
            </div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
              The Service Advisor has inspected your vehicle and prepared an estimate of <strong>LKR {Number(job.estimated_cost || 0).toLocaleString()}</strong>. The Workshop Manager is reviewing and verifying the estimate. Once accepted, you will be able to authorize the garage repairs.
            </div>
          </div>
          <div style={{ padding: "6px 14px", borderRadius: 8, background: "rgba(59,130,246,0.15)", color: "var(--blue)", fontWeight: 700, fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Clock size={14} /> In Manager Review Queue
          </div>
        </div>
      )}

      {/* STEP 2: Customer Approval Action Box (Enabled ONLY after Manager Approves) */}
      {isCustomerPending && !isRejected && (
        <div style={{
          marginTop: 16, padding: "16px 20px", borderRadius: 10,
          background: "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(217,119,6,0.06))",
          border: "1px solid var(--accent)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
              <AlertCircle size={18} style={{ color: "var(--accent)" }} />
              Customer Estimate Approval Needed
            </div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
              The Workshop Manager has approved the estimate of <strong>LKR {Number(job.estimated_cost || 0).toLocaleString()}</strong>. Please approve below to start repair work in the garage.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              className="btn btn-primary"
              onClick={() => onApprove(job.id)}
              disabled={approving}
              style={{ padding: "8px 24px", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}
            >
              <CheckCircle2 size={16} /> Approve & Start Repair
            </button>
          </div>
        </div>
      )}

      {/* Rejection / Cancellation Notice */}
      {isRejected && (
        <div style={{
          marginTop: 14, padding: "14px 18px", borderRadius: 10,
          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
          display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10
        }}>
          <div>
            <div style={{ color: "var(--red)", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
              <AlertCircle size={16} />
              {isManagerRejected
                ? "Job Card Rejected by Workshop Management"
                : "Job Card Estimate Declined"}
            </div>
            <div style={{ color: "var(--text-secondary)", fontSize: 12, marginTop: 4 }}>
              {isManagerRejected
                ? "The high-value repair estimate (> LKR 5,000) was reviewed and not approved by Workshop Management."
                : (job.customer_rejection_reason ? `Reason: ${job.customer_rejection_reason}` : "You declined this estimate.")}
            </div>
          </div>
          {onDelete && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onDelete(job.id, job.job_number)}
              title="Delete this record"
              style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--red)", borderColor: "rgba(239,68,68,0.3)", padding: "5px 12px" }}
            >
              <Trash2 size={13} /> Delete Record
            </button>
          )}
        </div>
      )}

      {/* Reported issue & diagnosis summary */}
      <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, fontSize: 12 }}>
        <div>
          <span style={{ color: "var(--text-muted)", fontWeight: 700 }}>Reported Issues / Services:</span>
          <p style={{ margin: "3px 0 0 0", color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>{job.reported_issue}</p>
        </div>
        <div>
          <span style={{ color: "var(--text-muted)", fontWeight: 700 }}>Diagnosis Notes:</span>
          <p style={{ margin: "3px 0 0 0", color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>{job.diagnosis_notes || "Multi-point vehicle inspection underway."}</p>
        </div>
      </div>

      {/* Recorded Walkaround Damage Log */}
      {damageList && damageList.length > 0 && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6 }}>
            🔍 Recorded Intake Defects & Walkaround Condition:
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {damageList.map((d, idx) => (
              <span key={idx} style={{ fontSize: 11, background: "rgba(239,68,68,0.08)", color: "var(--text-primary)", border: "1px solid rgba(239,68,68,0.25)", padding: "3px 8px", borderRadius: 6 }}>
                <strong>{d.zone?.toUpperCase()}:</strong> {d.type} {d.note ? `(${d.note})` : ""}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Vehicle Intake & Walkaround Photos Gallery */}
      {job.images && job.images.length > 0 && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8 }}>
            <Camera size={14} style={{ color: "var(--accent)" }} />
            <span>Vehicle Intake Photos ({job.images.length})</span>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {job.images.map(img => (
              <div
                key={img.id}
                onClick={() => setSelectedPhoto(`http://localhost:5000/uploads/${img.filename}`)}
                style={{
                  width: 100, height: 75, borderRadius: 8, overflow: "hidden",
                  border: "1px solid var(--border)", cursor: "pointer", position: "relative",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
                }}
              >
                <img
                  src={`http://localhost:5000/uploads/${img.filename}`}
                  alt={img.label || "vehicle intake photo"}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", opacity: 0, hover: { opacity: 1 }, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Eye size={16} style={{ color: "#fff" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Photo Preview Lightbox */}
      {selectedPhoto && (
        <div className="modal-overlay" onClick={() => setSelectedPhoto(null)} style={{ zIndex: 1100 }}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 700, padding: 14, textAlign: "center", background: "#0f172a" }}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedPhoto(null)}>✕ Close</button>
            </div>
            <img
              src={selectedPhoto}
              alt="Full Vehicle View"
              style={{ width: "100%", maxHeight: "70vh", objectFit: "contain", borderRadius: 8 }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
