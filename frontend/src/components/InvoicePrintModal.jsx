import { useState } from "react";

export default function InvoicePrintModal({ invoice, onClose, onRecordPayment, onRequestDiscount, isManager }) {
  const [payMethod, setPayMethod] = useState("cash");
  const [discountInput, setDiscountInput] = useState(invoice?.discount_amount || 0);
  const [discountReason, setDiscountReason] = useState("");
  const [loading, setLoading] = useState(false);

  if (!invoice) return null;

  const partsTotal = invoice.parts?.reduce((sum, p) => sum + (p.unit_price * p.quantity), 0) || 0;
  const laborTotal = invoice.tasks?.reduce((sum, t) => sum + (parseFloat(t.cost) || 0), 0) || 0;
  const subtotal = partsTotal + laborTotal;
  const discount = parseFloat(invoice.discount_amount) || 0;
  const taxable = Math.max(0, subtotal - discount);
  const vat = taxable * 0.18; // 18% VAT in Sri Lanka
  const grandTotal = taxable + vat;

  const handlePrint = () => {
    window.print();
  };

  const submitPayment = async () => {
    setLoading(true);
    try {
      await onRecordPayment(invoice.id, payMethod, grandTotal);
    } finally { setLoading(false); }
  };

  const submitDiscount = async () => {
    if (parseFloat(discountInput) > 2000 && !isManager) {
      alert("Discounts above LKR 2,000 require Workshop Manager approval sign-off.");
    }
    setLoading(true);
    try {
      await onRequestDiscount(invoice.id, discountInput, discountReason);
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20
    }}>
      <div style={{
        background: "#0f172a", color: "#f8fafc", borderRadius: 16, border: "1px solid rgba(255,255,255,0.15)",
        width: "100%", maxWidth: 850, maxHeight: "90vh", overflowY: "auto", padding: 32, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)"
      }}>
        {/* Modal Top Actions bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>??</span>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Official Tax Invoice & Receipt</h3>
              <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>Invoice #{invoice.invoice_number || `INV-${invoice.id}`}</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handlePrint} style={{
              padding: "8px 16px", borderRadius: 8, background: "linear-gradient(135deg, #f59e0b, #d97706)",
              color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6
            }}>
              ??? Print / Save PDF
            </button>
            <button onClick={onClose} style={{
              padding: "8px 14px", borderRadius: 8, background: "rgba(255,255,255,0.1)",
              color: "#cbd5e1", border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer"
            }}>? Close</button>
          </div>
        </div>

        {/* PRINTABLE AREA */}
        <div id="printable-invoice" style={{ background: "#ffffff", color: "#0f172a", padding: 32, borderRadius: 12 }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 28, borderBottom: "2px solid #f1f5f9", paddingBottom: 20 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <div style={{ width: 28, height: 28, background: "#f59e0b", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900 }}>??</div>
                <span style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.5px" }}>PitStop<span style={{ color: "#d97706" }}>Pro</span></span>
              </div>
              <p style={{ fontSize: 12, color: "#475569", margin: 0, lineHeight: 1.5 }}>
                Premier Vehicle Workshop & Service Center<br />
                124 High Level Road, Maharagama, Colombo, Sri Lanka<br />
                Hotline: +94 11 234 5678 | Email: billing@pitstoppro.lk
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{
                display: "inline-block", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 800,
                background: invoice.status === "paid" ? "#dcfce7" : "#fef3c7",
                color: invoice.status === "paid" ? "#166534" : "#92400e", textTransform: "uppercase"
              }}>
                {invoice.status || "UNPAID"}
              </span>
              <p style={{ fontSize: 12, color: "#64748b", marginTop: 8, marginBottom: 0 }}>
                Date: <strong>{new Date(invoice.created_at || Date.now()).toLocaleDateString("en-GB")}</strong><br />
                Job Card #: <strong>{invoice.job_number}</strong>
              </p>
            </div>
          </div>

          {/* Customer & Vehicle Info */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, background: "#f8fafc", padding: 16, borderRadius: 8, marginBottom: 24, border: "1px solid #e2e8f0" }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>Customer Details</p>
              <p style={{ fontSize: 14, fontWeight: 700, margin: 0, color: "#0f172a" }}>{invoice.customer_name}</p>
              <p style={{ fontSize: 12, color: "#475569", margin: 0 }}>Phone: {invoice.customer_phone || "N/A"}</p>
              <p style={{ fontSize: 12, color: "#475569", margin: 0 }}>Email: {invoice.customer_email || "N/A"}</p>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>Vehicle Specs</p>
              <p style={{ fontSize: 14, fontWeight: 700, margin: 0, color: "#0f172a" }}>
                {invoice.license_plate} — <span style={{ color: "#d97706" }}>{invoice.make} {invoice.model}</span>
              </p>
              <p style={{ fontSize: 12, color: "#475569", margin: 0 }}>Mileage: {invoice.mileage ? `${invoice.mileage.toLocaleString()} km` : "N/A"}</p>
              <p style={{ fontSize: 12, color: "#475569", margin: 0 }}>Year / Color: {invoice.year || "-"} ({invoice.color || "-"})</p>
            </div>
          </div>

          {/* Line Items Table */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24 }}>
            <thead>
              <tr style={{ background: "#0f172a", color: "#fff", fontSize: 12, textAlign: "left" }}>
                <th style={{ padding: "10px 12px", borderRadius: "6px 0 0 6px" }}>Category / Item Description</th>
                <th style={{ padding: "10px 12px", textAlign: "center" }}>Qty / Hrs</th>
                <th style={{ padding: "10px 12px", textAlign: "right" }}>Unit Rate (LKR)</th>
                <th style={{ padding: "10px 12px", textAlign: "right", borderRadius: "0 6px 6px 0" }}>Amount (LKR)</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: 13, color: "#1e293b" }}>
              {/* Labor Tasks */}
              {invoice.tasks?.map((t, idx) => (
                <tr key={`task-${idx}`} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ fontWeight: 600 }}>??? [Labor] {t.task_name}</span>
                    <span style={{ fontSize: 11, color: "#64748b", display: "block" }}>Bay: {t.bay_type || "Mechanical"}</span>
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "center" }}>1</td>
                  <td style={{ padding: "10px 12px", textAlign: "right" }}>{parseFloat(t.cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600 }}>{parseFloat(t.cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
              {/* Spare Parts & Materials */}
              {invoice.parts?.map((p, idx) => (
                <tr key={`part-${idx}`} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ fontWeight: 600 }}>?? [Part/Material] {p.item_name}</span>
                    <span style={{ fontSize: 11, color: "#64748b", display: "block" }}>Part #: {p.part_number || "GEN-01"}</span>
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "center" }}>{p.quantity}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right" }}>{parseFloat(p.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600 }}>{(p.unit_price * p.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals & Tax Calculations */}
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: "2px solid #e2e8f0", paddingTop: 16 }}>
            <div style={{ fontSize: 11, color: "#64748b", maxWidth: 300 }}>
              <p style={{ margin: 0, fontWeight: 700, color: "#0f172a" }}>Terms & Conditions:</p>
              <p style={{ margin: 0 }}>1. All repair work carries a 3-month / 5,000 km warranty.</p>
              <p style={{ margin: 0 }}>2. Electrical components are non-refundable.</p>
              <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 50, height: 50, background: "#f1f5f9", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>??</div>
                <span style={{ fontSize: 10, color: "#94a3b8" }}>PitStopPro Official Digital Signature Verified</span>
              </div>
            </div>

            <div style={{ minWidth: 260 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6, color: "#475569" }}>
                <span>Subtotal (Parts & Labor):</span>
                <span>LKR {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              {discount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6, color: "#dc2626", fontWeight: 600 }}>
                  <span>Discount Authorized:</span>
                  <span>- LKR {discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6, color: "#475569" }}>
                <span>Sri Lanka VAT (18%):</span>
                <span>LKR {vat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 17, fontWeight: 900, color: "#0f172a", borderTop: "2px solid #0f172a", paddingTop: 10, marginTop: 6 }}>
                <span>Grand Total:</span>
                <span style={{ color: "#d97706" }}>LKR {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cashier Payment & Discount Action Section */}
        {invoice.status !== "paid" && (
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.1)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Discount Request */}
            <div style={{ background: "rgba(30,41,59,0.5)", padding: 16, borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)" }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 10px 0", color: "#fbbf24" }}>??? Manager Discount Sign-Off (US11)</h4>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input type="number" placeholder="Discount (LKR)" value={discountInput} onChange={e => setDiscountInput(e.target.value)}
                  style={{ width: 140, padding: "8px 10px", borderRadius: 6, background: "#1e293b", border: "1px solid #334155", color: "#fff", fontSize: 13 }} />
                <input type="text" placeholder="Reason for discount" value={discountReason} onChange={e => setDiscountReason(e.target.value)}
                  style={{ flex: 1, padding: "8px 10px", borderRadius: 6, background: "#1e293b", border: "1px solid #334155", color: "#fff", fontSize: 13 }} />
              </div>
              <button onClick={submitDiscount} disabled={loading} style={{
                width: "100%", padding: "8px", borderRadius: 6, background: "rgba(245,158,11,0.2)", border: "1px solid #f59e0b",
                color: "#fbbf24", fontWeight: 700, fontSize: 12, cursor: "pointer"
              }}>
                Apply / Request Manager Discount Sign-Off
              </button>
            </div>

            {/* Payment Recording */}
            <div style={{ background: "rgba(30,41,59,0.5)", padding: 16, borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)" }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 10px 0", color: "#4ade80" }}>?? Record Payment (US13)</h4>
              <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                {["cash", "card", "bank_transfer"].map(m => (
                  <button key={m} type="button" onClick={() => setPayMethod(m)} style={{
                    flex: 1, padding: "8px", borderRadius: 6, fontSize: 12, fontWeight: 700, textTransform: "capitalize",
                    border: payMethod === m ? "1px solid #4ade80" : "1px solid #334155",
                    background: payMethod === m ? "rgba(74,222,128,0.2)" : "#1e293b",
                    color: payMethod === m ? "#4ade80" : "#cbd5e1", cursor: "pointer"
                  }}>{m.replace("_", " ")}</button>
                ))}
              </div>
              <button onClick={submitPayment} disabled={loading} style={{
                width: "100%", padding: "10px", borderRadius: 8, background: "linear-gradient(135deg, #22c55e, #16a34a)",
                color: "#fff", border: "none", fontWeight: 800, fontSize: 13, cursor: "pointer"
              }}>
                {loading ? "Processing..." : `Confirm Payment (LKR ${grandTotal.toLocaleString()})`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

