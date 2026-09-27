import { useState, useEffect } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import {
  ShoppingCart, Search, Printer, Package, User, Phone,
  Calendar, DollarSign, CheckCircle2, Download, Eye, X,
  Trash2, XCircle, Clock
} from "lucide-react";

const fmt = n => `LKR ${Number(n || 0).toLocaleString("en-LK", { minimumFractionDigits: 2 })}`;

export default function StoreOrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingReceipt, setViewingReceipt] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get("/billing/store-orders");
      setOrders(res.data || []);
    } catch {
      toast.error("Failed to load store orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleApprove = async (id) => {
    setActionLoadingId(id);
    try {
      const res = await api.patch(`/billing/store-orders/${id}/approve`);
      toast.success(res.data.message || "Store order approved! Receipt is now available.");
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve store order");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm("Are you sure you want to decline / reject this store order?")) return;
    setActionLoadingId(id);
    try {
      const res = await api.patch(`/billing/store-orders/${id}/reject`);
      toast.success(res.data.message || "Store order rejected");
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject store order");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id, invNum) => {
    if (!window.confirm(`Permanently delete record for ${invNum}?`)) return;
    setActionLoadingId(id);
    try {
      const res = await api.delete(`/billing/store-orders/${id}`);
      toast.success(res.data.message || "Store order record deleted");
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete record");
    } finally {
      setActionLoadingId(null);
    }
  };

  const filtered = orders;

  const pendingCount = orders.filter(o => o.status === "pending" || o.status === "draft").length;
  const paidCount = orders.filter(o => o.status === "paid" || o.status === "approved" || o.status === "issued").length;
  const totalRevenue = orders
    .filter(o => o.status === "paid" || o.status === "approved" || o.status === "issued")
    .reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
  const totalItemsCount = orders.reduce((sum, o) => sum + (o.items || []).reduce((isum, it) => isum + parseFloat(it.quantity || 1), 0), 0);

  const exportCSV = () => {
    if (!filtered.length) return toast.error("No store orders to export");
    const rows = [
      ["Invoice Number", "Customer Name", "Phone", "Items Purchased", "Total Amount (LKR)", "Status", "Payment Method", "Date"],
      ...filtered.map(o => [
        o.invoice_number,
        o.customer_name,
        o.customer_phone || "N/A",
        (o.items || []).map(i => `${i.description} x${i.quantity}`).join("; "),
        o.total,
        o.status,
        o.payment_method || "Card",
        new Date(o.created_at).toLocaleString()
      ])
    ];
    const csv = "data:text/csv;charset=utf-8," + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `Store_Orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast.success("Store Orders exported as CSV!");
  };

  return (
    <div className="fade-in">
      {/* Header & Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-glow" style={{ background: "var(--accent-glow)" }} />
          <div className="stat-icon" style={{ background: "var(--accent-glow)" }}><ShoppingCart size={22} style={{ color: "var(--accent)" }} /></div>
          <div className="stat-value">{orders.length}</div>
          <div className="stat-label">Total Store Orders</div>
        </div>
        <div className="stat-card">
          <div className="stat-glow" style={{ background: "rgba(245,158,11,0.15)" }} />
          <div className="stat-icon" style={{ background: "rgba(245,158,11,0.15)" }}><Clock size={22} style={{ color: "#f59e0b" }} /></div>
          <div className="stat-value" style={{ color: "#f59e0b" }}>{pendingCount}</div>
          <div className="stat-label">Pending Garage Approval</div>
        </div>
        <div className="stat-card">
          <div className="stat-glow" style={{ background: "var(--green-glow)" }} />
          <div className="stat-icon" style={{ background: "var(--green-glow)" }}><DollarSign size={22} style={{ color: "var(--green)" }} /></div>
          <div className="stat-value">{fmt(totalRevenue)}</div>
          <div className="stat-label">Approved & Collected Revenue</div>
        </div>
        <div className="stat-card">
          <div className="stat-glow" style={{ background: "var(--blue-glow)" }} />
          <div className="stat-icon" style={{ background: "var(--blue-glow)" }}><Package size={22} style={{ color: "var(--blue)" }} /></div>
          <div className="stat-value">{totalItemsCount} units</div>
          <div className="stat-label">Parts & Items Sold</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header flex-between" style={{ flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ShoppingCart size={20} style={{ color: "var(--accent)" }} />
              Direct Store & Spare Parts Purchases
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0 0 0" }}>
              Review customer parts transactions, approve verified bookings, and generate official receipts
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button className="btn btn-secondary btn-sm" onClick={exportCSV}>
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading store orders...</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Order / Invoice #</th>
                  <th>Customer</th>
                  <th>Items Purchased</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Date & Time</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => {
                  const isPending = order.status === "pending" || order.status === "draft";
                  const isPaid = order.status === "paid" || order.status === "approved" || order.status === "issued";
                  const isCancelled = order.status === "cancelled";
                  const busy = actionLoadingId === order.id;

                  return (
                    <tr key={order.id}>
                      <td>
                        <div style={{ fontWeight: 800, color: "var(--accent)", fontSize: 14 }}>
                          {order.invoice_number}
                        </div>
                        <span className="chip" style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 700 }}>
                          💳 {order.payment_method || "Card"}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                          {order.customer_name || "Direct Customer"}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                          <Phone size={11} /> {order.customer_phone || "No phone"}
                        </div>
                        {order.customer_email && (
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{order.customer_email}</div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4, maxWidth: 360 }}>
                          {(order.items || []).map((it, idx) => (
                            <div
                              key={idx}
                              style={{
                                display: "flex", justifyContent: "space-between", alignItems: "center",
                                background: "var(--bg-surface)", border: "1px solid var(--border)",
                                padding: "4px 8px", borderRadius: 6, fontSize: 12
                              }}
                            >
                              <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                                {it.description}
                              </span>
                              <span style={{ color: "var(--accent)", fontWeight: 700, fontSize: 11, marginLeft: 8 }}>
                                {it.quantity} × {fmt(it.unit_price)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 800, fontSize: 15, color: "var(--accent)" }}>
                          {fmt(order.total)}
                        </div>
                      </td>
                      <td>
                        {isPending ? (
                          <span className="badge" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.4)" }}>
                            ⏳ Booking Pending
                          </span>
                        ) : isCancelled ? (
                          <span className="badge badge-cancelled">❌ Cancelled</span>
                        ) : (
                          <span className="badge badge-completed">✅ Approved & Paid</span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 12 }}>
                          {new Date(order.created_at).toLocaleDateString("en-LK", { dateStyle: "medium" })}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          {new Date(order.created_at).toLocaleTimeString("en-LK", { timeStyle: "short" })}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6, justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
                          {isPending && (
                            <>
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => handleApprove(order.id)}
                                disabled={busy}
                                style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 12px", fontWeight: 700 }}
                                title="Verify transaction and approve store order"
                              >
                                <CheckCircle2 size={14} /> Approve Order
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleReject(order.id)}
                                disabled={busy}
                                style={{ padding: "5px 8px" }}
                                title="Reject this order"
                              >
                                <XCircle size={14} />
                              </button>
                            </>
                          )}

                          {isPaid && (
                            <>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => setViewingReceipt(order)}
                                style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 10px" }}
                                title="View and Print Invoice Receipt"
                              >
                                <Printer size={13} /> View Receipt
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleDelete(order.id, order.invoice_number)}
                                disabled={busy}
                                style={{ color: "var(--red)", borderColor: "rgba(239,68,68,0.3)", padding: "5px 8px" }}
                                title="Delete record"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}

                          {isCancelled && (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleDelete(order.id, order.invoice_number)}
                              disabled={busy}
                              style={{ color: "var(--red)", borderColor: "rgba(239,68,68,0.3)", padding: "5px 8px" }}
                              title="Delete cancelled record"
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!filtered.length && (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <ShoppingCart size={40} style={{ color: "var(--text-muted)", marginBottom: 8 }} />
                        <p style={{ fontWeight: 600 }}>No store orders found</p>
                        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          When customers purchase parts or consumables from the Store tab, their orders will appear here for garage verification.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- RECEIPT MODAL --- */}
      {viewingReceipt && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-card" style={{ maxWidth: 520, background: "#fff", color: "#1e293b" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px dashed #cbd5e1", paddingBottom: 14, marginBottom: 14 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#0f172a" }}>🏁 PitStopPro Garage</h2>
                <div style={{ fontSize: 11, color: "#64748b" }}>Official Store Sale Receipt (Verified)</div>
              </div>
              <button
                onClick={() => setViewingReceipt(null)}
                style={{ background: "#f1f5f9", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontWeight: 700 }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 14 }}>
              <div>
                <div><strong>Invoice #:</strong> {viewingReceipt.invoice_number}</div>
                <div><strong>Customer:</strong> {viewingReceipt.customer_name}</div>
                <div><strong>Phone:</strong> {viewingReceipt.customer_phone || "N/A"}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div><strong>Date:</strong> {new Date(viewingReceipt.created_at).toLocaleDateString()}</div>
                <div><strong>Status:</strong> <span style={{ color: "#16a34a", fontWeight: 800 }}>APPROVED & PAID</span></div>
                <div><strong>Payment:</strong> {(viewingReceipt.payment_method || "Card").toUpperCase()}</div>
              </div>
            </div>

            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse", marginBottom: 16 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e2e8f0", background: "#f8fafc", textAlign: "left" }}>
                  <th style={{ padding: "6px 8px" }}>Item</th>
                  <th style={{ padding: "6px 8px", textAlign: "center" }}>Qty</th>
                  <th style={{ padding: "6px 8px", textAlign: "right" }}>Price</th>
                  <th style={{ padding: "6px 8px", textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {(viewingReceipt.items || []).map((it, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "8px" }}>{it.description}</td>
                    <td style={{ padding: "8px", textAlign: "center" }}>{it.quantity}</td>
                    <td style={{ padding: "8px", textAlign: "right" }}>{fmt(it.unit_price)}</td>
                    <td style={{ padding: "8px", textAlign: "right", fontWeight: 700 }}>
                      {fmt(parseFloat(it.quantity) * parseFloat(it.unit_price))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ borderTop: "2px dashed #cbd5e1", paddingTop: 10, marginBottom: 16, textAlign: "right" }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#0f172a" }}>
                Total Paid: {fmt(viewingReceipt.total)}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                className="btn btn-primary"
                onClick={() => window.print()}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <Printer size={15} /> Print Official Receipt
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setViewingReceipt(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
