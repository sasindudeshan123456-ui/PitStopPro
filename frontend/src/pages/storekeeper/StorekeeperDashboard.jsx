import { useEffect, useState } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Plus, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

export default function StorekeeperDashboard() {
  const [items, setItems] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [tab, setTab] = useState("inventory");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [stockModal, setStockModal] = useState(null);
  const [stockType, setStockType] = useState("stock_in");
  const [stockQty, setStockQty] = useState("");
  const [stockRef, setStockRef] = useState("");
  const [form, setForm] = useState({ item_code:"", name:"", category:"spare_part", unit:"piece", unit_price:"", quantity:"", low_stock_threshold:"5", supplier:"" });

  const load = async () => {
    try {
      setLoading(true);
      const [iRes, lRes, tRes] = await Promise.all([api.get("/inventory"), api.get("/inventory/low-stock"), api.get("/inventory/transactions")]);
      setItems(iRes.data); setLowStock(lRes.data); setTransactions(tRes.data);
    } catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const addItem = async () => {
    try { await api.post("/inventory", form); toast.success("Item added"); setShowAdd(false); load(); }
    catch (err) { toast.error(err.response?.data?.message || "Failed"); }
  };

  const doStock = async () => {
    try {
      const endpoint = stockType === "stock_in" ? `/inventory/${stockModal.id}/stock-in` : `/inventory/${stockModal.id}/stock-out`;
      await api.post(endpoint, { quantity: parseFloat(stockQty), reference: stockRef });
      toast.success("Stock updated"); setStockModal(null); setStockQty(""); setStockRef(""); load();
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
  };

  const sf = k => e => setForm(f => ({...f, [k]: e.target.value}));
  const CATS = ["spare_part","paint","consumable","tool","other"];

  return (
    <div className="fade-in">
      <div className="page-header flex-between">
        <div><h1 className="page-title">Storekeeper</h1><p className="page-subtitle">Parts & consumables inventory</p></div>
        <button className="btn btn-primary" onClick={()=>setShowAdd(true)}><Plus size={16}/> Add Item</button>
      </div>

      {lowStock.length > 0 && (
        <div className="alert alert-warning mb-16"><AlertTriangle size={16}/><strong>{lowStock.length} items</strong> are below minimum stock level</div>
      )}

      <div className="auth-tabs" style={{maxWidth:400,marginBottom:20}}>
        {["inventory","transactions","low-stock"].map(t => (
          <button key={t} className={`auth-tab${tab===t?" active":""}`} onClick={()=>setTab(t)}>{t.replace("-"," ").replace(/\b\w/g,c=>c.toUpperCase())}</button>
        ))}
      </div>

      {loading ? <div className="loading">Loading...</div> : <>
        {tab === "inventory" && (
          <div className="card">
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Code</th><th>Name</th><th>Category</th><th>Stock</th><th>Unit Price</th><th>Low Stock At</th><th>Actions</th></tr></thead>
                <tbody>
                  {items.map(i => (
                    <tr key={i.id}>
                      <td><span className="chip">{i.item_code}</span></td>
                      <td><strong>{i.name}</strong></td>
                      <td><span className="badge badge-pending">{i.category}</span></td>
                      <td style={{color: i.quantity<=i.low_stock_threshold?"var(--red)":"var(--green)", fontWeight:600}}>{i.quantity} {i.unit}</td>
                      <td>LKR {Number(i.unit_price).toLocaleString()}</td>
                      <td>{i.low_stock_threshold}</td>
                      <td>
                        <div className="actions">
                          <button className="btn btn-success btn-sm" onClick={()=>{setStockModal(i);setStockType("stock_in");}}><TrendingUp size={13}/>In</button>
                          <button className="btn btn-danger btn-sm" onClick={()=>{setStockModal(i);setStockType("stock_out");}}><TrendingDown size={13}/>Out</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {tab === "transactions" && (
          <div className="card">
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Item</th><th>Type</th><th>Qty</th><th>Reference</th><th>By</th><th>Date</th></tr></thead>
                <tbody>
                  {transactions.map(t => (
                    <tr key={t.id}>
                      <td>{t.item_name}</td>
                      <td><span className={`badge ${t.type==="stock_in"?"badge-completed":"badge-cancelled"}`}>{t.type.replace("_"," ")}</span></td>
                      <td>{t.quantity}</td>
                      <td>{t.reference||"—"}</td>
                      <td>{t.full_name}</td>
                      <td>{new Date(t.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {tab === "low-stock" && (
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:16}}>
            {lowStock.map(i => (
              <div key={i.id} className="card" style={{borderLeft:"3px solid var(--red)"}}>
                <div style={{fontWeight:600,marginBottom:4}}>{i.name}</div>
                <div style={{fontSize:13,color:"var(--text-muted)"}}>{i.item_code}</div>
                <div style={{fontSize:24,fontWeight:700,color:"var(--red)",margin:"8px 0"}}>{i.quantity} <span style={{fontSize:13}}>{i.unit}</span></div>
                <div style={{fontSize:12,color:"var(--text-muted)"}}>Threshold: {i.low_stock_threshold}</div>
              </div>
            ))}
            {!lowStock.length && <div className="empty-state" style={{gridColumn:"1/-1"}}><div className="empty-icon">✅</div><p>All stock levels are healthy</p></div>}
          </div>
        )}
      </>}

      {showAdd && (
        <div className="modal-overlay" onClick={()=>setShowAdd(false)}>
          <div className="modal modal-lg" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">Add Inventory Item</h2><button className="modal-close" onClick={()=>setShowAdd(false)}>×</button></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Item Code</label><input className="form-control" placeholder="OIL-5W30-1L" value={form.item_code} onChange={sf("item_code")}/></div>
              <div className="form-group"><label className="form-label">Name</label><input className="form-control" placeholder="Engine Oil 5W-30 (1L)" value={form.name} onChange={sf("name")}/></div>
            </div>
            <div className="form-row-3">
              <div className="form-group"><label className="form-label">Category</label><select className="form-control" value={form.category} onChange={sf("category")}>{CATS.map(c=><option key={c}>{c}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Unit</label><input className="form-control" placeholder="piece" value={form.unit} onChange={sf("unit")}/></div>
              <div className="form-group"><label className="form-label">Unit Price (LKR)</label><input className="form-control" type="number" value={form.unit_price} onChange={sf("unit_price")}/></div>
            </div>
            <div className="form-row-3">
              <div className="form-group"><label className="form-label">Initial Quantity</label><input className="form-control" type="number" value={form.quantity} onChange={sf("quantity")}/></div>
              <div className="form-group"><label className="form-label">Low Stock Threshold</label><input className="form-control" type="number" value={form.low_stock_threshold} onChange={sf("low_stock_threshold")}/></div>
              <div className="form-group"><label className="form-label">Supplier</label><input className="form-control" value={form.supplier} onChange={sf("supplier")}/></div>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={()=>setShowAdd(false)}>Cancel</button><button className="btn btn-primary" onClick={addItem}>Add Item</button></div>
          </div>
        </div>
      )}

      {stockModal && (
        <div className="modal-overlay" onClick={()=>setStockModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">{stockType==="stock_in"?"Stock In":"Stock Out"} — {stockModal.name}</h2><button className="modal-close" onClick={()=>setStockModal(null)}>×</button></div>
            <div style={{fontSize:13,color:"var(--text-muted)",marginBottom:16}}>Current stock: <strong style={{color:"var(--text-primary)"}}>{stockModal.quantity} {stockModal.unit}</strong></div>
            <div className="form-group"><label className="form-label">Quantity</label><input className="form-control" type="number" value={stockQty} onChange={e=>setStockQty(e.target.value)} placeholder={`Enter qty in ${stockModal.unit}`}/></div>
            <div className="form-group"><label className="form-label">Reference (e.g. PO number)</label><input className="form-control" value={stockRef} onChange={e=>setStockRef(e.target.value)}/></div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={()=>setStockModal(null)}>Cancel</button><button className={`btn ${stockType==="stock_in"?"btn-success":"btn-danger"}`} onClick={doStock}>Confirm</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
