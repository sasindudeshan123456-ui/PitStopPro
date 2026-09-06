import { useState } from "react";

const CAR_ZONES = [
  { id: "front", name: "Front Bumper & Hood", icon: "??" },
  { id: "left", name: "Left Side & Doors", icon: "??" },
  { id: "right", name: "Right Side & Doors", icon: "??" },
  { id: "rear", name: "Rear Bumper & Trunk", icon: "??" },
  { id: "roof", name: "Roof & Windshield", icon: "???" },
];

const DAMAGE_TYPES = ["Scratch", "Dent", "Paint Chip", "Crack", "Rust", "Broken Light"];

export default function WalkaroundDamageLogger({ value, onChange }) {
  const [damages, setDamages] = useState(value || []);
  const [selectedZone, setSelectedZone] = useState("front");
  const [selectedType, setSelectedType] = useState("Scratch");
  const [note, setNote] = useState("");

  const addDamage = () => {
    if (!note.trim() && !selectedType) return;
    const newDamage = {
      id: Date.now(),
      zone: selectedZone,
      type: selectedType,
      note: note.trim() || selectedType,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };
    const updated = [...damages, newDamage];
    setDamages(updated);
    setNote("");
    if (onChange) onChange(updated);
  };

  const removeDamage = (id) => {
    const updated = damages.filter(d => d.id !== id);
    setDamages(updated);
    if (onChange) onChange(updated);
  };

  return (
    <div style={{ background: "rgba(15,23,42,0.6)", borderRadius: 12, padding: 18, border: "1px solid rgba(255,255,255,0.08)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <h4 style={{ fontSize: 15, fontWeight: 700, color: "#f8fafc", display: "flex", alignItems: "baseline", gap: 8 }}>
          <span>??</span> Walkaround Vehicle Exterior Damage Log
        </h4>
        <span style={{ fontSize: 12, color: "#94a3b8" }}>{damages.length} defect(s) recorded</span>
      </div>

      {/* Zone selection grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8, marginBottom: 14 }}>
        {CAR_ZONES.map(z => {
          const count = damages.filter(d => d.zone === z.id).length;
          const active = selectedZone === z.id;
          return (
            <button key={z.id} type="button" onClick={() => setSelectedZone(z.id)} style={{
              padding: "10px 8px", borderRadius: 8, border: active ? "1px solid #f59e0b" : "1px solid rgba(255,255,255,0.1)",
              background: active ? "rgba(245,158,11,0.15)" : "rgba(30,41,59,0.5)",
              color: active ? "#fbbf24" : "#cbd5e1", fontSize: 12, fontWeight: 600, cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4, position: "relative"
            }}>
              <span style={{ fontSize: 18 }}>{z.icon}</span>
              <span>{z.name}</span>
              {count > 0 && (
                <span style={{
                  position: "absolute", top: 4, right: 4, background: "#ef4444", color: "#fff",
                  fontSize: 10, fontWeight: 800, width: 18, height: 18, borderRadius: 9,
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Inputs to log damage */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <select value={selectedType} onChange={e => setSelectedType(e.target.value)} style={{
          padding: "8px 12px", borderRadius: 6, background: "#1e293b", border: "1px solid #334155", color: "#f8fafc", fontSize: 13
        }}>
          {DAMAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <input type="text" placeholder="Describe damage location/details..." value={note} onChange={e => setNote(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: "8px 12px", borderRadius: 6, background: "#1e293b", border: "1px solid #334155", color: "#f8fafc", fontSize: 13 }} />
        <button type="button" onClick={addDamage} style={{
          padding: "8px 16px", borderRadius: 6, background: "linear-gradient(135deg, #f59e0b, #d97706)",
          color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer"
        }}>
          + Add Log
        </button>
      </div>

      {/* Damage items list */}
      {damages.length === 0 ? (
        <p style={{ fontSize: 12, color: "#64748b", fontStyle: "italic", textAlign: "center", margin: "10px 0" }}>
          No pre-existing damages logged. Vehicle intake marked clean.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {damages.map(d => {
            const zInfo = CAR_ZONES.find(z => z.id === d.zone);
            return (
              <div key={d.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "rgba(30,41,59,0.7)", padding: "8px 12px", borderRadius: 6, borderLeft: "3px solid #f59e0b"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <span>{zInfo?.icon}</span>
                  <span style={{ color: "#fbbf24", fontWeight: 600 }}>[{zInfo?.name}]</span>
                  <span style={{ color: "#f8fafc" }}>{d.type} — {d.note}</span>
                </div>
                <button type="button" onClick={() => removeDamage(d.id)} style={{
                  background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 14, fontWeight: 700
                }}>?</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

