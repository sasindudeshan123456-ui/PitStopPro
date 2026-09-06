import { useEffect, useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { PlayCircle, StopCircle, CheckCircle, XCircle } from "lucide-react";

export default function TechnicianDashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qcModal, setQcModal] = useState(null);
  const [qcForm, setQcForm] = useState({ qc_passed: true, qc_notes: "" });
  const isQC = user?.role === "qc_inspector";

  const load = async () => {
    try { const res = await api.get("/technician/my-tasks"); setTasks(res.data); }
    catch { toast.error("Failed to load tasks"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const clockIn = async id => {
    try { await api.post(`/technician/tasks/${id}/clock-in`); toast.success("Clocked in!"); load(); }
    catch (err) { toast.error(err.response?.data?.message || "Failed"); }
  };
  const clockOut = async id => {
    try { await api.post(`/technician/tasks/${id}/clock-out`, { notes: "" }); toast.success("Clocked out!"); load(); }
    catch (err) { toast.error(err.response?.data?.message || "Failed"); }
  };
  const submitQC = async () => {
    try { await api.patch(`/technician/tasks/${qcModal.id}/qc`, qcForm); toast.success("QC updated"); setQcModal(null); load(); }
    catch { toast.error("Failed"); }
  };

  const BAY_COLOR = { mechanical:"var(--blue)", tinkering:"var(--purple)", paint:"var(--accent)", welding:"var(--red)" };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">{isQC ? "QC Inspection" : "My Tasks"}</h1>
        <p className="page-subtitle">{isQC ? "Post-service quality inspections" : "Your assigned workshop tasks"}</p>
      </div>
      {loading ? <div className="loading">Loading...</div> : (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:16}}>
          {tasks.map(t => (
            <div key={t.id} className="card" style={{borderTop:`3px solid ${BAY_COLOR[t.bay_type]}`}}>
              <div className="flex-between mb-16" style={{marginBottom:12}}>
                <span className={`badge badge-${t.status}`}>{t.status?.replace("_"," ")}</span>
                <span className="chip">{t.bay_type}</span>
              </div>
              <div style={{fontWeight:700,fontSize:16,marginBottom:4}}>{t.task_name}</div>
              <div style={{fontSize:13,color:"var(--text-muted)",marginBottom:8}}>
                {t.job_number} · {t.make} {t.model} ({t.license_plate})
              </div>
              {t.description && <p style={{fontSize:13,color:"var(--text-secondary)",marginBottom:12}}>{t.description}</p>}
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {!isQC && t.status === "assigned" && (
                  <button className="btn btn-success btn-sm" onClick={()=>clockIn(t.id)}><PlayCircle size={14}/>Clock In</button>
                )}
                {!isQC && t.status === "in_progress" && (
                  <button className="btn btn-danger btn-sm" onClick={()=>clockOut(t.id)}><StopCircle size={14}/>Clock Out</button>
                )}
                {isQC && (t.status==="in_progress"||t.status==="completed") && (
                  <button className="btn btn-primary btn-sm" onClick={()=>setQcModal(t)}><CheckCircle size={14}/>QC Inspect</button>
                )}
              </div>
            </div>
          ))}
          {!tasks.length && <div className="empty-state" style={{gridColumn:"1/-1"}}><div className="empty-icon">✅</div><p>No tasks assigned</p></div>}
        </div>
      )}

      {qcModal && (
        <div className="modal-overlay" onClick={()=>setQcModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">QC Inspection — {qcModal.task_name}</h2><button className="modal-close" onClick={()=>setQcModal(null)}>×</button></div>
            <div className="form-group">
              <label className="form-label">Result</label>
              <div style={{display:"flex",gap:8}}>
                <button className={`btn btn-sm ${qcForm.qc_passed?"btn-success":"btn-secondary"}`} onClick={()=>setQcForm(f=>({...f,qc_passed:true}))}><CheckCircle size={14}/>Pass</button>
                <button className={`btn btn-sm ${!qcForm.qc_passed?"btn-danger":"btn-secondary"}`} onClick={()=>setQcForm(f=>({...f,qc_passed:false}))}><XCircle size={14}/>Fail (Rework)</button>
              </div>
            </div>
            <div className="form-group"><label className="form-label">QC Notes</label><textarea className="form-control" rows={3} value={qcForm.qc_notes} onChange={e=>setQcForm(f=>({...f,qc_notes:e.target.value}))}/></div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={()=>setQcModal(null)}>Cancel</button><button className="btn btn-primary" onClick={submitQC}>Submit QC</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
