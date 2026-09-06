import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Search, Plus, Upload, ArrowLeft } from "lucide-react";
import WalkaroundDamageLogger from "../../components/WalkaroundDamageLogger";

export default function NewJobCard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [newVehicle, setNewVehicle] = useState({ make:"", model:"", year: new Date().getFullYear(), license_plate:"", color:"", mileage:"", vin:"" });
  const [addingVehicle, setAddingVehicle] = useState(false);
  const [jobForm, setJobForm] = useState({ reported_issue:"", diagnosis_notes:"", estimated_cost:"" });
  const [damageLogs, setDamageLogs] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);


  const searchCustomers = async () => {
    if (!customerSearch.trim()) return;
    try {
      const res = await api.get(`/customers/search?q=${customerSearch}`);
      setCustomers(res.data);
    } catch { toast.error("Search failed"); }
  };

  const selectCustomer = async c => {
    setSelectedCustomer(c);
    const res = await api.get(`/customers/${c.id}`);
    setVehicles(res.data.vehicles || []);
    setStep(2);
  };

  const addVehicle = async () => {
    try {
      setLoading(true);
      const res = await api.post(`/customers/${selectedCustomer.id}/vehicles`, newVehicle);
      const updated = await api.get(`/customers/${selectedCustomer.id}`);
      setVehicles(updated.data.vehicles);
      setAddingVehicle(false);
      toast.success("Vehicle added");
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setLoading(false); }
  };

  const createJobCard = async () => {
    if (!selectedVehicle) return toast.error("Select a vehicle");
    if (!jobForm.reported_issue) return toast.error("Reported issue required");
    setLoading(true);
    try {
      const res = await api.post("/job-cards", {
        vehicle_id: selectedVehicle.id,
        customer_id: selectedCustomer.id,
        exterior_damage: damageLogs.length ? JSON.stringify(damageLogs) : null,
        ...jobForm
      });
      const jobId = res.data.id;

      if (images.length) {
        const fd = new FormData();
        images.forEach(img => fd.append("images", img));
        await api.post(`/job-cards/${jobId}/images`, fd);
      }
      toast.success(`Job card ${res.data.job_number} created!`);
      navigate(`/advisor/jobs/${jobId}`);
    } catch (err) { toast.error(err.response?.data?.message || "Failed to create job card"); }
    finally { setLoading(false); }
  };

  const setVF = k => e => setNewVehicle(f => ({ ...f, [k]: e.target.value }));
  const setJF = k => e => setJobForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="fade-in">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">New Job Card</h1>
          <p className="page-subtitle">Step {step} of 3 — {["","Select Customer","Select Vehicle","Job Details"][step]}</p>
        </div>
        <button className="btn btn-secondary" onClick={() => step > 1 ? setStep(s=>s-1) : navigate("/advisor")}>
          <ArrowLeft size={16}/> Back
        </button>
      </div>

      {/* Step indicators */}
      <div style={{display:"flex",gap:8,marginBottom:24}}>
        {[1,2,3].map(s => (
          <div key={s} style={{flex:1,height:4,borderRadius:2,background:s<=step?"var(--accent)":"var(--border)",transition:"0.3s"}}/>
        ))}
      </div>

      {step === 1 && (
        <div className="card">
          <h2 className="card-title mb-16">Customer Lookup</h2>
          <div style={{display:"flex",gap:8,marginBottom:16}}>
            <div className="search-bar" style={{flex:1}}>
              <Search className="search-icon" size={16}/>
              <input className="form-control" placeholder="Search by name, email, phone or NIC..." value={customerSearch} onChange={e=>setCustomerSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&searchCustomers()} style={{paddingLeft:38}}/>
            </div>
            <button className="btn btn-primary" onClick={searchCustomers}><Search size={16}/> Search</button>
          </div>
          {customers.length > 0 && (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>NIC</th><th></th></tr></thead>
                <tbody>
                  {customers.map(c => (
                    <tr key={c.id}>
                      <td><strong>{c.full_name}</strong></td>
                      <td>{c.email}</td>
                      <td>{c.phone}</td>
                      <td>{c.nic}</td>
                      <td><button className="btn btn-primary btn-sm" onClick={()=>selectCustomer(c)}>Select</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {customers.length === 0 && customerSearch && <div className="empty-state"><p>No customers found. <span className="text-accent" style={{cursor:"pointer"}} onClick={()=>navigate("/advisor/customers")}>Register new customer →</span></p></div>}
        </div>
      )}

      {step === 2 && selectedCustomer && (
        <div className="card">
          <h2 className="card-title mb-16">Select Vehicle for <span className="text-accent">{selectedCustomer.full_name}</span></h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:12,marginBottom:16}}>
            {vehicles.map(v => (
              <div key={v.id} onClick={()=>{setSelectedVehicle(v);setStep(3);}}
                style={{padding:16,border:`1px solid ${selectedVehicle?.id===v.id?"var(--accent)":"var(--border)"}`,borderRadius:"var(--radius-sm)",cursor:"pointer",background:selectedVehicle?.id===v.id?"var(--accent-glow)":"var(--bg-surface)",transition:"0.2s"}}>
                <div style={{fontWeight:600}}>{v.make} {v.model} {v.year}</div>
                <div style={{fontSize:13,color:"var(--text-muted)",marginTop:4}}>{v.license_plate} · {v.color}</div>
                <div style={{fontSize:12,color:"var(--text-muted)"}}>{v.mileage} km</div>
              </div>
            ))}
            <div onClick={()=>setAddingVehicle(true)} style={{padding:16,border:"1px dashed var(--border)",borderRadius:"var(--radius-sm)",cursor:"pointer",display:"flex",alignItems:"center",gap:8,color:"var(--text-muted)"}}>
              <Plus size={20}/> Add New Vehicle
            </div>
          </div>

          {addingVehicle && (
            <div style={{marginTop:16,padding:20,background:"var(--bg-surface)",borderRadius:"var(--radius-sm)",border:"1px solid var(--border)"}}>
              <h3 style={{marginBottom:16,fontSize:15,fontWeight:600}}>Add New Vehicle</h3>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Make</label><input className="form-control" placeholder="Toyota" value={newVehicle.make} onChange={setVF("make")}/></div>
                <div className="form-group"><label className="form-label">Model</label><input className="form-control" placeholder="Corolla" value={newVehicle.model} onChange={setVF("model")}/></div>
              </div>
              <div className="form-row-3">
                <div className="form-group"><label className="form-label">Year</label><input className="form-control" type="number" value={newVehicle.year} onChange={setVF("year")}/></div>
                <div className="form-group"><label className="form-label">License Plate</label><input className="form-control" placeholder="CAR-1234" value={newVehicle.license_plate} onChange={setVF("license_plate")}/></div>
                <div className="form-group"><label className="form-label">Color</label><input className="form-control" placeholder="White" value={newVehicle.color} onChange={setVF("color")}/></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Mileage (km)</label><input className="form-control" type="number" value={newVehicle.mileage} onChange={setVF("mileage")}/></div>
                <div className="form-group"><label className="form-label">VIN (optional)</label><input className="form-control" value={newVehicle.vin} onChange={setVF("vin")}/></div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button className="btn btn-primary" onClick={addVehicle} disabled={loading}>Add Vehicle</button>
                <button className="btn btn-secondary" onClick={()=>setAddingVehicle(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 3 && selectedVehicle && (
        <div className="card">
          <div className="alert alert-info mb-16">
            <span>Vehicle: <strong>{selectedVehicle.make} {selectedVehicle.model} {selectedVehicle.year}</strong> — {selectedVehicle.license_plate}</span>
          </div>
          <h2 className="card-title mb-16">Job Details</h2>
          <div className="form-group">
            <label className="form-label">Reported Issue *</label>
            <textarea className="form-control" rows={3} placeholder="Describe what the customer reported..." value={jobForm.reported_issue} onChange={setJF("reported_issue")}/>
          </div>
          <div className="form-group">
            <label className="form-label">Initial Diagnosis Notes</label>
            <textarea className="form-control" rows={3} placeholder="Advisor's initial assessment..." value={jobForm.diagnosis_notes} onChange={setJF("diagnosis_notes")}/>
          </div>
          <div className="form-group mb-16">
            <WalkaroundDamageLogger value={damageLogs} onChange={setDamageLogs} />
          </div>

          <div className="form-group">
            <label className="form-label">Estimated Cost (LKR)</label>

            <input className="form-control" type="number" placeholder="0.00" value={jobForm.estimated_cost} onChange={setJF("estimated_cost")}/>
            {parseFloat(jobForm.estimated_cost) > 5000 && (
              <div className="alert alert-warning" style={{marginTop:8}}>⚠️ Estimate exceeds LKR 5,000 — Manager approval required</div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Walkaround Photos (optional)</label>
            <input className="form-control" type="file" multiple accept="image/*" onChange={e=>setImages(Array.from(e.target.files))}/>
            {images.length > 0 && <div className="text-muted mt-16">{images.length} photo(s) selected</div>}
          </div>
          <div style={{display:"flex",gap:12,marginTop:8}}>
            <button className="btn btn-primary" onClick={createJobCard} disabled={loading}><Plus size={16}/>{loading?"Creating...":"Create Job Card"}</button>
            <button className="btn btn-secondary" onClick={()=>setStep(2)}>Back</button>
          </div>
        </div>
      )}
    </div>
  );
}
