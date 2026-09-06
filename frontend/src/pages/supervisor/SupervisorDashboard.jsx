import { useEffect, useState } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Plus, Wrench } from "lucide-react";

const BAY_COLORS = { mechanical:"var(--blue)", tinkering:"var(--purple)", paint:"var(--accent)", welding:"var(--red)" };
const BAY_GLOWS = { mechanical:"var(--blue-glow)", tinkering:"var(--purple-glow)", paint:"var(--accent-glow)", welding:"var(--red-glow)" };

export default function SupervisorDashboard() {
  const [tasks, setTasks] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [assignModal, setAssignModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ job_card_id:"", task_name:"", bay_type:"mechanical", description:"", estimated_hours:"" });
  const [filter, setFilter] = useState("all");

  const load = async () => {
    try {
      setLoading(true);
      const [tRes, techRes] = await Promise.all([api.get("/supervisor/tasks"), api.get("/supervisor/technicians")]);
      setTasks(tRes.data); setTechnicians(techRes.data);
    } catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const createTask = async () => {
    try { await api.post("/supervisor/tasks", form); toast.success("Task created"); setShowModal(false); load(); }
    catch (err) { toast.error(err.response?.data?.message || "Failed"); }
  };

  const assignTask = async (task_id, technician_id) => {
    try { await api.patch(`/supervisor/tasks/${task_id}/assign`, { technician_id }); toast.success("Assigned"); setAssignModal(null); load(); }
    catch { toast.error("Failed"); }
  };

  const filtered = filter==="all" ? tasks : tasks.filter(t=>t.bay_type===filter||t.status===filter);

  return (
    <div className="fade-in">
      <div className="page-header flex-between">
        <div><h1 className="page-title">Workshop Supervisor</h1><p className="page-subtitle">Bay allocation & task management</p></div>
        <button className="btn btn-primary" onClick={()=>setShowModal(true)}><Plus size={16}/> New Task</button>
      </div>

      <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
        {["all","mechanical","tinkering","paint","welding","pending","assigned","in_progress"].map(f => (
          <button key={f} onClick={()=>setFilter(f)} className={`chip ${filter===f?"chip-accent":""}`} style={{cursor:"pointer",border:"none"}}>
            {f.replace("_"," ")}
          </button>
        ))}
      </div>

      {loading ? <div className="loading">Loading tasks...</div> : (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
          {filtered.map(t => (
            <div key={t.id} className="card" style={{borderLeft:`3px solid ${BAY_COLORS[t.bay_type]}`}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <span className="chip" style={{borderColor:BAY_COLORS[t.bay_type],color:BAY_COLORS[t.bay_type],background:BAY_GLOWS[t.bay_type]}}>{t.bay_type}</span>
                <span className={`badge badge-${t.status}`}>{t.status?.replace("_"," ")}</span>
              </div>
              <div style={{fontWeight:600,marginBottom:4}}>{t.task_name}</div>
              <div style={{fontSize:13,color:"var(--text-muted)",marginBottom:8}}>Job: {t.job_number} · {t.make} {t.model} [{t.license_plate}]</div>
              {t.technician_name
                ? <div style={{fontSize:13,color:"var(--green)"}}>👤 {t.technician_name}</div>
                : <div style={{fontSize:13,color:"var(--text-muted)"}}>Unassigned</div>}
              <button className="btn btn-secondary btn-sm" style={{marginTop:12,width:"100%"}} onClick={()=>setAssignModal(t)}>
                <Wrench size={14}/> {t.technician_name ? "Reassign" : "Assign Technician"}
              </button>
            </div>
          ))}
          {!filtered.length && <div className="empty-state" style={{gridColumn:"1/-1"}}><p>No tasks found</p></div>}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={()=>setShowModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">Create Task</h2><button className="modal-close" onClick={()=>setShowModal(false)}>×</button></div>
            {["job_card_id","task_name"].map(k => (
              <div className="form-group" key={k}>
                <label className="form-label">{k.replace("_"," ").replace(/\b\w/g,c=>c.toUpperCase())}</label>
                <input className="form-control" placeholder={k==="job_card_id"?"Job Card ID":"e.g. Engine oil change"} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}/>
              </div>
            ))}
            <div className="form-group"><label className="form-label">Bay Type</label>
              <select className="form-control" value={form.bay_type} onChange={e=>setForm(f=>({...f,bay_type:e.target.value}))}>
                {["mechanical","tinkering","paint","welding"].map(b=><option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Estimated Hours</label><input className="form-control" type="number" value={form.estimated_hours} onChange={e=>setForm(f=>({...f,estimated_hours:e.target.value}))}/></div>
            <div className="form-group"><label className="form-label">Description</label><textarea className="form-control" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/></div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={()=>setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createTask}>Create Task</button>
            </div>
          </div>
        </div>
      )}

      {assignModal && (
        <div className="modal-overlay" onClick={()=>setAssignModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">Assign Technician — {assignModal.task_name}</h2><button className="modal-close" onClick={()=>setAssignModal(null)}>×</button></div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {technicians.map(t => (
                <div key={t.id} onClick={()=>assignTask(assignModal.id,t.id)} style={{padding:"12px 16px",border:"1px solid var(--border)",borderRadius:"var(--radius-sm)",cursor:"pointer",background:"var(--bg-surface)",transition:"0.2s"}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor="var(--accent)"} onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}>
                  <strong>{t.full_name}</strong><span style={{fontSize:12,marginLeft:8,color:"var(--text-muted)"}}>{t.phone}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
