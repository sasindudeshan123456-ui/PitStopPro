import { useEffect, useState } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Plus, Printer, CreditCard } from "lucide-react";

const fmt = n => `LKR ${Number(n||0).toLocaleString("en-LK",{minimumFractionDigits:2})}`;

export default function CashierDashboard() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [payModal, setPayModal] = useState(null);
  const [payForm, setPayForm] = useState({ amount:"", method:"cash", reference:"" });
  const [newInvModal, setNewInvModal] = useState(false);
  const [invForm, setInvForm] = useState({ job_card_id:"", items:[{description:"",type:"labor",quantity:1,unit_price:""}], discount_pct:0, tax_pct:0 });

  const load = async () => {
    try { const res = await api.get("/billing"); setInvoices(res.data); }
    catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const viewInvoice = async id => {
    try { const res = await api.get(`/billing/${id}`); setDetail(res.data); setSelected(id); }
    catch { toast.error("Failed"); }
  };

  const pay = async () => {
    try {
      await api.post(`/billing/${payModal}/payment`, payForm);
      toast.success("Payment recorded"); setPayModal(null); viewInvoice(payModal); load();
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
  };

  const addItem = () => setInvForm(f => ({...f, items:[...f.items,{description:"",type:"labor",quantity:1,unit_price:""}]}));
  const removeItem = i => setInvForm(f => ({...f, items:f.items.filter((_,idx)=>idx!==i)}));
  const setItem = (i,k,v) => setInvForm(f => ({...f, items:f.items.map((item,idx)=>idx===i?{...item,[k]:v}:item)}));

  const createInvoice = async () => {
    try {
      const res = await api.post("/billing", invForm);
      toast.success(`Invoice ${res.data.invoice_number} created`); setNewInvModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
  };

  const subtotal = (invForm.items||[]).reduce((sum,i)=>sum+(i.quantity*(parseFloat(i.unit_price)||0)),0);

  return (
    <div className="fade-in">
      <div className="page-header flex-between">
        <div><h1 className="page-title">Billing & Cashier</h1><p className="page-subtitle">Invoice management & payment collection</p></div>
        <button className="btn btn-primary" onClick={()=>setNewInvModal(true)}><Plus size={16}/> New Invoice</button>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header"><h2 className="card-title">All Invoices</h2></div>
          {loading ? <div className="loading">Loading...</div> : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Invoice #</th><th>Customer</th><th>Total</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv.id} style={{cursor:"pointer"}} onClick={()=>viewInvoice(inv.id)}>
                      <td><strong style={{color:"var(--accent)"}}>{inv.invoice_number}</strong></td>
                      <td>{inv.customer_name}</td>
                      <td><strong>{fmt(inv.total)}</strong></td>
                      <td><span className={`badge badge-${inv.status}`}>{inv.status}</span></td>
                      <td>{new Date(inv.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {!invoices.length && <tr><td colSpan={5}><div className="empty-state"><p>No invoices yet</p></div></td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          {!detail ? (
            <div className="empty-state"><div className="empty-icon">🧾</div><p>Select an invoice to view details</p></div>
          ) : (
            <div className="fade-in">
              <div className="flex-between mb-16">
                <div><div style={{fontWeight:700,fontSize:18}}>{detail.invoice_number}</div><div style={{fontSize:13,color:"var(--text-muted)"}}>Job: {detail.job_number}</div></div>
                <span className={`badge badge-${detail.status}`}>{detail.status}</span>
              </div>
              <div style={{fontSize:13,marginBottom:16,padding:"12px",background:"var(--bg-surface)",borderRadius:"var(--radius-sm)"}}>
                <div><strong>{detail.customer_name}</strong></div>
                <div style={{color:"var(--text-muted)"}}>{detail.customer_email} · {detail.customer_phone}</div>
                <div style={{marginTop:4}}>{detail.make} {detail.model} — {detail.license_plate}</div>
              </div>
              <div className="table-wrapper" style={{marginBottom:12}}>
                <table>
                  <thead><tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
                  <tbody>
                    {detail.items?.map((item,i) => (
                      <tr key={i}>
                        <td>{item.description} <span className={`badge badge-${item.type==="labor"?"active":"pending"}`} style={{marginLeft:4}}>{item.type}</span></td>
                        <td>{item.quantity}</td>
                        <td>{fmt(item.unit_price)}</td>
                        <td>{fmt(item.quantity*item.unit_price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{textAlign:"right",fontSize:14}}>
                <div>Subtotal: {fmt(detail.subtotal)}</div>
                {detail.discount_pct > 0 && <div style={{color:"var(--green)"}}>Discount ({detail.discount_pct}%): -{fmt(detail.discount_amount)}</div>}
                {detail.tax_pct > 0 && <div>Tax ({detail.tax_pct}%): {fmt(detail.tax_amount)}</div>}
                <div style={{fontWeight:700,fontSize:18,marginTop:8,color:"var(--accent)"}}>Total: {fmt(detail.total)}</div>
              </div>
              {detail.status !== "paid" && detail.status !== "cancelled" && (
                <button className="btn btn-primary" style={{width:"100%",justifyContent:"center",marginTop:16}} onClick={()=>{setPayModal(selected);setPayForm({amount:detail.total,method:"cash",reference:""})}}>
                  <CreditCard size={16}/> Record Payment
                </button>
              )}
              {detail.status === "paid" && <div className="alert alert-success" style={{marginTop:12}}>✅ Payment received</div>}
            </div>
          )}
        </div>
      </div>

      {payModal && (
        <div className="modal-overlay" onClick={()=>setPayModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">Record Payment</h2><button className="modal-close" onClick={()=>setPayModal(null)}>×</button></div>
            <div className="form-group"><label className="form-label">Amount (LKR)</label><input className="form-control" type="number" value={payForm.amount} onChange={e=>setPayForm(f=>({...f,amount:e.target.value}))}/></div>
            <div className="form-group"><label className="form-label">Payment Method</label>
              <select className="form-control" value={payForm.method} onChange={e=>setPayForm(f=>({...f,method:e.target.value}))}>
                <option value="cash">Cash</option><option value="card">Card</option><option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>
            <div className="form-group"><label className="form-label">Reference (optional)</label><input className="form-control" value={payForm.reference} onChange={e=>setPayForm(f=>({...f,reference:e.target.value}))}/></div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={()=>setPayModal(null)}>Cancel</button><button className="btn btn-primary" onClick={pay}><CreditCard size={14}/>Confirm Payment</button></div>
          </div>
        </div>
      )}

      {newInvModal && (
        <div className="modal-overlay" onClick={()=>setNewInvModal(false)}>
          <div className="modal modal-lg" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">Create Invoice</h2><button className="modal-close" onClick={()=>setNewInvModal(false)}>×</button></div>
            <div className="form-group"><label className="form-label">Job Card ID</label><input className="form-control" type="number" value={invForm.job_card_id} onChange={e=>setInvForm(f=>({...f,job_card_id:e.target.value}))}/></div>
            <div style={{marginBottom:12}}>
              <div className="flex-between mb-16" style={{marginBottom:8}}><span style={{fontWeight:600}}>Line Items</span><button className="btn btn-secondary btn-sm" onClick={addItem}><Plus size={13}/>Add Item</button></div>
              {invForm.items.map((item,i) => (
                <div key={i} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr auto",gap:8,marginBottom:8,alignItems:"flex-end"}}>
                  <div className="form-group" style={{margin:0}}><input className="form-control" placeholder="Description" value={item.description} onChange={e=>setItem(i,"description",e.target.value)}/></div>
                  <div className="form-group" style={{margin:0}}><select className="form-control" value={item.type} onChange={e=>setItem(i,"type",e.target.value)}><option value="labor">Labor</option><option value="part">Part</option><option value="other">Other</option></select></div>
                  <div className="form-group" style={{margin:0}}><input className="form-control" type="number" placeholder="Qty" value={item.quantity} onChange={e=>setItem(i,"quantity",e.target.value)}/></div>
                  <div className="form-group" style={{margin:0}}><input className="form-control" type="number" placeholder="Unit Price" value={item.unit_price} onChange={e=>setItem(i,"unit_price",e.target.value)}/></div>
                  <button className="btn btn-danger btn-sm btn-icon" onClick={()=>removeItem(i)}>×</button>
                </div>
              ))}
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Discount %</label><input className="form-control" type="number" value={invForm.discount_pct} onChange={e=>setInvForm(f=>({...f,discount_pct:e.target.value}))}/></div>
              <div className="form-group"><label className="form-label">Tax %</label><input className="form-control" type="number" value={invForm.tax_pct} onChange={e=>setInvForm(f=>({...f,tax_pct:e.target.value}))}/></div>
            </div>
            <div style={{textAlign:"right",fontWeight:600,fontSize:16,marginBottom:16}}>Subtotal: {fmt(subtotal)}</div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={()=>setNewInvModal(false)}>Cancel</button><button className="btn btn-primary" onClick={createInvoice}>Create Invoice</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
