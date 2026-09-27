import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Search, Plus, Upload, ArrowLeft, Calendar, Car, User, CheckCircle2 } from "lucide-react";
import WalkaroundDamageLogger from "../../components/WalkaroundDamageLogger";

export default function NewJobCard({ initialAppointment = null, onComplete = null, onCancel = null }) {
  const navigate = useNavigate();
  const location = useLocation();

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
  const [includeWalkaround, setIncludeWalkaround] = useState(false);
  const [images, setImages] = useState([]);
  const [appointmentId, setAppointmentId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Auto-fill from incoming Appointment
  useEffect(() => {
    const apt = initialAppointment || location.state?.fromAppointment;
    if (apt) {
      setAppointmentId(apt.id);
      setSelectedCustomer({
        id: apt.customer_id,
        full_name: apt.customer_name,
        email: apt.customer_email,
        phone: apt.customer_phone
      });
      setSelectedVehicle({
        id: apt.vehicle_id,
        make: apt.make,
        model: apt.model,
        year: apt.vehicle_year || new Date().getFullYear(),
        license_plate: apt.license_plate
      });

      let srvSummary = "";
      let totalEst = 0;
      try {
        const sList = typeof apt.services === "string" ? JSON.parse(apt.services) : apt.services;
        srvSummary = sList.map(s => s.name || s).join(", ");
        totalEst = sList.reduce((sum, s) => sum + (parseFloat(s.price || s.base_price || 0)), 0);
      } catch {
        srvSummary = apt.services;
      }

      setJobForm({
        reported_issue: `Appointment Booking: ${srvSummary}${apt.customer_notes ? ` | Notes: ${apt.customer_notes}` : ""}`,
        diagnosis_notes: `Scheduled appointment intake on ${new Date(apt.preferred_date).toLocaleDateString()} (${apt.preferred_time}). Multi-point check underway.`,
        estimated_cost: totalEst ? totalEst.toString() : ""
      });

      setStep(3); // Jump directly to inspection & job details
      toast.success(`Pre-filled details from Appointment for ${apt.license_plate}`);
    }
  }, [initialAppointment, location.state]);

  const loadInitialCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/customers");
      setCustomers(res.data || []);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step === 1 && !appointmentId) {
      loadInitialCustomers();
    }
  }, [step, appointmentId]);

  const handleSearchChange = (val) => {
    setCustomerSearch(val);
    if (!val.trim()) {
      loadInitialCustomers();
      return;
    }
    api.get(`/customers/search?q=${encodeURIComponent(val.trim())}`)
      .then(res => setCustomers(res.data || []))
      .catch(() => {});
  };

  const searchCustomers = async () => {
    if (!customerSearch.trim()) {
      loadInitialCustomers();
      return;
    }
    try {
      const res = await api.get(`/customers/search?q=${encodeURIComponent(customerSearch.trim())}`);
      setCustomers(res.data || []);
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
        appointment_id: appointmentId,
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
      if (onComplete) {
        onComplete(res.data);
      } else if (location.state?.returnTo) {
        navigate(location.state.returnTo);
      } else if (appointmentId) {
        navigate("/manager/appointments");
      } else {
        navigate(`/advisor/jobs/${jobId}`);
      }
    } catch (err) { toast.error(err.response?.data?.message || "Failed to create job card"); }
    finally { setLoading(false); }
  };

  const setVF = k => e => setNewVehicle(f => ({ ...f, [k]: e.target.value }));
  const setJF = k => e => setJobForm(f => ({ ...f, [k]: e.target.value }));

  const handleCancelOrBack = () => {
    if (step > 1 && !appointmentId) {
      setStep(s => s - 1);
    } else if (onCancel) {
      onCancel();
    } else if (location.state?.returnTo) {
      navigate(location.state.returnTo);
    } else if (appointmentId) {
      navigate("/manager/appointments");
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">New Job Card & Vehicle Intake</h1>
          <p className="page-subtitle">
            {appointmentId ? "Converting Appointment to Job Card" : `Step ${step} of 3 — ${["","Select Customer","Select Vehicle","Vehicle Inspection & Job Details"][step]}`}
          </p>
        </div>
        <button className="btn btn-secondary" onClick={handleCancelOrBack} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <ArrowLeft size={16}/> Back
        </button>
      </div>

      {/* Step indicators */}
      <div style={{ display:"flex", gap:8, marginBottom:24 }}>
        {[1,2,3].map(s => (
          <div key={s} style={{ flex:1, height:4, borderRadius:2, background:s<=step?"var(--accent)":"var(--border)", transition:"0.3s" }}/>
        ))}
      </div>

      {step === 1 && (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 className="card-title" style={{ margin: 0 }}>Customer Lookup & Auto-Suggest</h2>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate("/advisor/customers")} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Plus size={14} /> Register New Customer
            </button>
          </div>

          <div style={{ display:"flex", gap:8, marginBottom:16 }}>
            <div className="search-bar" style={{ flex:1 }}>
              <Search className="search-icon" size={16}/>
              <input
                className="form-control"
                placeholder="Type customer name, email, phone, NIC, or vehicle plate (e.g. Sasindu, WP CAX-9988)..."
                value={customerSearch}
                onChange={e => handleSearchChange(e.target.value)}
                onKeyDown={e => e.key === "Enter" && searchCustomers()}
                style={{ paddingLeft:38 }}
                autoFocus
              />
            </div>
            <button className="btn btn-primary" onClick={searchCustomers} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Search size={16}/> Search
            </button>
          </div>

          {customers.length > 0 && (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Contact Info</th>
                    <th>NIC</th>
                    <th>Registered Vehicles</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map(c => (
                    <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => selectCustomer(c)}>
                      <td>
                        <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{c.full_name}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>ID: #{c.id}</div>
                      </td>
                      <td>
                        <div>{c.email}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{c.phone || "No phone"}</div>
                      </td>
                      <td>
                        <span className="chip" style={{ fontFamily: "monospace" }}>{c.nic || "—"}</span>
                      </td>
                      <td>
                        {c.vehicles_summary ? (
                          <span style={{ fontSize: 13, color: "var(--accent)", fontWeight: 600 }}>
                            🚗 {c.vehicles_summary}
                          </span>
                        ) : (
                          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>No vehicles linked</span>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={(e) => { e.stopPropagation(); selectCustomer(c); }}
                          style={{ fontWeight: 700 }}
                        >
                          Select Customer →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {customers.length === 0 && !loading && (
            <div className="empty-state" style={{ padding: 40 }}>
              <div className="empty-icon">🔍</div>
              <p>No customers found matching "{customerSearch}".</p>
              <button className="btn btn-primary btn-sm mt-12" onClick={() => navigate("/advisor/customers")}>
                + Register New Customer
              </button>
            </div>
          )}
        </div>
      )}

      {step === 2 && selectedCustomer && (
        <div className="card">
          <h2 className="card-title mb-16">Select Vehicle for <span className="text-accent">{selectedCustomer.full_name}</span></h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:12, marginBottom:16 }}>
            {vehicles.map(v => (
              <div key={v.id} onClick={()=>{ setSelectedVehicle(v); setStep(3); }}
                style={{
                  padding:16, border:`1px solid ${selectedVehicle?.id===v.id?"var(--accent)":"var(--border)"}`,
                  borderRadius:"var(--radius-sm)", cursor:"pointer",
                  background:selectedVehicle?.id===v.id?"var(--accent-glow)":"var(--bg-surface)", transition:"0.2s"
                }}>
                <div style={{ fontWeight:600 }}>{v.make} {v.model} {v.year}</div>
                <div style={{ fontSize:13, color:"var(--text-muted)", marginTop:4 }}>{v.license_plate} · {v.color}</div>
                <div style={{ fontSize:12, color:"var(--text-muted)" }}>{v.mileage} km</div>
              </div>
            ))}
            <div onClick={()=>setAddingVehicle(true)} style={{ padding:16, border:"1px dashed var(--border)", borderRadius:"var(--radius-sm)", cursor:"pointer", display:"flex", alignItems:"center", gap:8, color:"var(--text-muted)" }}>
              <Plus size={20}/> Add New Vehicle
            </div>
          </div>

          {addingVehicle && (
            <div style={{ marginTop:16, padding:20, background:"var(--bg-surface)", borderRadius:"var(--radius-sm)", border:"1px solid var(--border)" }}>
              <h3 style={{ marginBottom:16, fontSize:15, fontWeight:600 }}>Add New Vehicle</h3>
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
              <div style={{ display:"flex", gap:8 }}>
                <button className="btn btn-primary" onClick={addVehicle} disabled={loading}>Add Vehicle</button>
                <button className="btn btn-secondary" onClick={()=>setAddingVehicle(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 3 && selectedVehicle && (
        <div className="card">
          <div className="alert alert-info mb-16" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span>Customer: <strong>{selectedCustomer?.full_name}</strong> ({selectedCustomer?.phone || selectedCustomer?.email})</span><br />
              <span>Vehicle: <strong>{selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.year})</strong> — {selectedVehicle.license_plate}</span>
            </div>
            {appointmentId && (
              <span className="chip" style={{ background: "var(--accent)", color: "#fff", fontWeight: 800 }}>
                From Service Appointment #{appointmentId}
              </span>
            )}
          </div>

          <h2 className="card-title mb-16">Vehicle Intake, Diagnosis & Walkaround</h2>

          <div className="form-group">
            <label className="form-label">Customer Reported Issue & Requested Services *</label>
            <textarea className="form-control" rows={3} placeholder="Describe what the customer reported..." value={jobForm.reported_issue} onChange={setJF("reported_issue")}/>
          </div>

          <div className="form-group">
            <label className="form-label">Advisor Intake Diagnosis & Technical Notes</label>
            <textarea className="form-control" rows={3} placeholder="Advisor's initial technical assessment & recommended bay tasks..." value={jobForm.diagnosis_notes} onChange={setJF("diagnosis_notes")}/>
          </div>

          <div className="form-group mb-16" style={{ background: "var(--bg-surface)", padding: 14, borderRadius: 10, border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: includeWalkaround ? 12 : 0 }}>
              <div>
                <strong style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                  🚗 Physical Walkaround & Exterior Damage Inspection
                </strong>
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0 0 0" }}>
                  Perform this check only when the vehicle is physically present at the workshop.
                </p>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, color: "var(--accent)" }}>
                <input
                  type="checkbox"
                  checked={includeWalkaround}
                  onChange={e => setIncludeWalkaround(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: "var(--accent)" }}
                />
                Vehicle Present (Log Damages)
              </label>
            </div>

            {includeWalkaround ? (
              <WalkaroundDamageLogger value={damageLogs} onChange={setDamageLogs} />
            ) : (
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6, fontStyle: "italic" }}>
                ℹ️ Exterior damage log skipped (Vehicle not inspected yet or marked clean without pre-existing scratches).
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Initial Estimated Cost (LKR)</label>
            <input className="form-control" type="number" placeholder="0.00" value={jobForm.estimated_cost} onChange={setJF("estimated_cost")}/>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
              * This estimate will be presented to the Customer for approval before garage repair starts.
            </div>
          </div>

          <div style={{ display:"flex", gap:12, marginTop:20 }}>
            <button className="btn btn-primary" onClick={createJobCard} disabled={loading} style={{ padding: "10px 24px", fontWeight: 700 }}>
              <Plus size={16}/> {loading ? "Creating Job Card..." : "Generate & Save Job Card"}
            </button>
            {!appointmentId && (
              <button className="btn btn-secondary" onClick={()=>setStep(2)}>Back</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
