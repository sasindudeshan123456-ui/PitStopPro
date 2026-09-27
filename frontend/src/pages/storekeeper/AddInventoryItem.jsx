import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import toast from "react-hot-toast";
import {
  ArrowLeft, Package, Palette, Flame, ChevronRight,
  Tag, DollarSign, Hash, Layers, AlertCircle, Truck,
  FileText, CheckCircle2, Wrench
} from "lucide-react";

const ITEM_TYPES = [
  {
    id: "spare_part",
    label: "Spare Part",
    icon: Wrench,
    color: "#3b82f6",
    glow: "rgba(59,130,246,0.18)",
    border: "rgba(59,130,246,0.35)",
    desc: "Vehicle spare parts & components",
    emoji: "🔧",
  },
  {
    id: "paint",
    label: "Paint Material",
    icon: Palette,
    color: "#8b5cf6",
    glow: "rgba(139,92,246,0.18)",
    border: "rgba(139,92,246,0.35)",
    desc: "Paints, primers & finishing materials",
    emoji: "🎨",
  },
  {
    id: "consumable",
    label: "Welding Consumable",
    icon: Flame,
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.18)",
    border: "rgba(245,158,11,0.35)",
    desc: "Welding rods, wires & consumables",
    emoji: "🔥",
  },
];

const UNITS_BY_TYPE = {
  spare_part: ["piece", "set", "pair", "kit", "box"],
  paint:      ["litre", "ml", "can", "gallon", "kg"],
  consumable: ["kg", "roll", "piece", "box", "metre"],
};

const PAINT_GRADES = ["Premium", "Standard", "Economy", "OEM", "Custom"];
const PAINT_TYPES  = ["Topcoat", "Primer", "Clear Coat", "Base Coat", "Filler", "Hardener"];
const WELD_TYPES   = ["MIG Wire", "TIG Rod", "Stick Electrode", "Flux", "Gas", "Tip", "Nozzle"];
const WELD_SIZES   = ["0.6mm", "0.8mm", "1.0mm", "1.2mm", "1.6mm", "2.0mm", "2.5mm", "3.2mm", "4.0mm"];

export default function AddInventoryItem() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [form, setForm] = useState({
    item_code: "", name: "", unit: "piece", unit_price: "",
    quantity: "0", low_stock_threshold: "5", supplier: "", description: "",
    part_number: "", warranty_period: "",
    color_type: "", paint_grade: "", paint_type: "",
    consumable_type: "", weld_size: "",
  });

  const sf = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const typeConfig = ITEM_TYPES.find((t) => t.id === selectedType);

  const handleTypeSelect = (typeId) => {
    setSelectedType(typeId);
    setForm((f) => ({ ...f, unit: UNITS_BY_TYPE[typeId]?.[0] || "piece" }));
    setStep(2);
  };

  const generateCode = () => {
    if (!form.name) { toast.error("Enter item name first"); return; }
    const prefix = { spare_part: "SP", paint: "PM", consumable: "WC" }[selectedType] || "IT";
    const slug = form.name.toUpperCase().replace(/[^A-Z0-9]/g, "-").slice(0, 8);
    const num = Math.floor(Math.random() * 9000) + 1000;
    setForm((f) => ({ ...f, item_code: `${prefix}-${slug}-${num}` }));
  };

  const handleSubmit = async () => {
    if (!form.item_code || !form.name) { toast.error("Item code and name are required"); return; }
    if (!form.unit_price || isNaN(form.unit_price)) { toast.error("Enter a valid unit price"); return; }
    setSaving(true);
    try {
      const extra = {};
      if (selectedType === "spare_part") {
        if (form.part_number) extra.part_number = form.part_number;
        if (form.warranty_period) extra.warranty_period = form.warranty_period;
      } else if (selectedType === "paint") {
        if (form.color_type) extra.color_type = form.color_type;
        if (form.paint_grade) extra.paint_grade = form.paint_grade;
        if (form.paint_type) extra.paint_type = form.paint_type;
      } else if (selectedType === "consumable") {
        if (form.consumable_type) extra.consumable_type = form.consumable_type;
        if (form.weld_size) extra.size = form.weld_size;
      }
      const descParts = [];
      if (form.description) descParts.push(form.description);
      if (Object.keys(extra).length) descParts.push(JSON.stringify(extra));

      await api.post("/inventory", {
        item_code: form.item_code, name: form.name, category: selectedType,
        unit: form.unit, unit_price: parseFloat(form.unit_price),
        quantity: parseInt(form.quantity) || 0,
        low_stock_threshold: parseInt(form.low_stock_threshold) || 5,
        supplier: form.supplier || null,
        description: descParts.join(" | ") || null,
      });
      toast.success(`✅ ${form.name} added to inventory!`);
      navigate("/storekeeper");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add item");
    } finally { setSaving(false); }
  };

  const STEPS = ["Select Type", "Item Details", "Stock & Submit"];

  return (
    <div className="fade-in" style={{ maxWidth: 860, margin: "0 auto" }}>
      {/* Header */}
      <div className="page-header flex-between">
        <div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => step === 1 ? navigate("/storekeeper") : setStep(step - 1)}
            style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}
          >
            <ArrowLeft size={14} /> {step === 1 ? "Back to Inventory" : "Back"}
          </button>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Package size={26} style={{ color: "var(--accent)" }} /> Add Inventory Item
          </h1>
          <p className="page-subtitle">Fill in the details to register a new item in the store</p>
        </div>
      </div>

      {/* Step Indicator */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 36 }}>
        {STEPS.map((s, i) => {
          const num = i + 1;
          const done = step > num;
          const active = step === num;
          return (
            <div key={s} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: done ? "var(--green)" : active ? "var(--accent)" : "var(--bg-card)",
                  border: `2px solid ${done ? "var(--green)" : active ? "var(--accent)" : "var(--border)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: 13,
                  color: (done || active) ? "#000" : "var(--text-muted)",
                  transition: "all 0.3s ease",
                  boxShadow: active ? "0 0 18px var(--accent-glow)" : done ? "0 0 12px var(--green-glow)" : "none",
                  flexShrink: 0,
                }}>
                  {done ? <CheckCircle2 size={17} /> : num}
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 600, whiteSpace: "nowrap",
                  color: active ? "var(--accent)" : done ? "var(--green)" : "var(--text-muted)",
                }}>{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{
                  flex: 1, height: 2, margin: "0 12px", marginBottom: 22,
                  background: done ? "var(--green)" : "var(--border)",
                  transition: "background 0.3s ease",
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* ═══ STEP 1: Type Selection ═══ */}
      {step === 1 && (
        <div>
          <p style={{ color: "var(--text-secondary)", marginBottom: 24, fontSize: 15 }}>
            What type of inventory item do you want to add?
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
            {ITEM_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => handleTypeSelect(type.id)}
                style={{
                  background: "var(--bg-card)", border: "1.5px solid var(--border)",
                  borderRadius: 16, padding: "28px 24px", cursor: "pointer",
                  textAlign: "left", transition: "all 0.25s ease", position: "relative", overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.border = `1.5px solid ${type.border}`;
                  e.currentTarget.style.boxShadow = `0 8px 32px ${type.glow}`;
                  e.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.border = "1.5px solid var(--border)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={{
                  position: "absolute", top: -30, right: -30, width: 100, height: 100,
                  borderRadius: "50%", background: type.glow, filter: "blur(30px)", pointerEvents: "none",
                }} />
                <div style={{
                  width: 52, height: 52, borderRadius: 12, background: type.glow,
                  border: `1px solid ${type.border}`, display: "flex", alignItems: "center",
                  justifyContent: "center", marginBottom: 16, fontSize: 26,
                }}>{type.emoji}</div>
                <div style={{ fontWeight: 700, fontSize: 17, color: "var(--text-primary)", marginBottom: 6 }}>{type.label}</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>{type.desc}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: type.color }}>
                  Select <ChevronRight size={14} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ═══ STEP 2: Item Details ═══ */}
      {step === 2 && typeConfig && (
        <div>
          {/* Type badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px",
            borderRadius: 20, background: typeConfig.glow, border: `1px solid ${typeConfig.border}`,
            color: typeConfig.color, fontWeight: 600, fontSize: 13, marginBottom: 24,
          }}>
            <span style={{ fontSize: 16 }}>{typeConfig.emoji}</span> {typeConfig.label}
          </div>

          {/* Basic Info */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <h2 className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Tag size={16} style={{ color: "var(--accent)" }} /> Basic Information
              </h2>
            </div>

            <div className="form-row" style={{ marginBottom: 16 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Item Name *</label>
                <input className="form-control"
                  placeholder={typeConfig.id === "spare_part" ? "e.g. Brake Pad Set" : typeConfig.id === "paint" ? "e.g. White Base Coat" : "e.g. MIG Wire 0.8mm"}
                  value={form.name} onChange={sf("name")} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Item Code *</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input className="form-control" placeholder="e.g. SP-BRAKE-1001"
                    value={form.item_code} onChange={sf("item_code")} style={{ flex: 1 }} />
                  <button className="btn btn-secondary btn-sm" onClick={generateCode}
                    title="Auto-generate from name" style={{ whiteSpace: "nowrap", flexShrink: 0 }}>
                    <Hash size={13} /> Auto
                  </button>
                </div>
              </div>
            </div>

            <div className="form-row-3" style={{ marginBottom: 16 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Unit</label>
                <select className="form-control" value={form.unit} onChange={sf("unit")}>
                  {(UNITS_BY_TYPE[selectedType] || ["piece"]).map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Unit Price (LKR) *</label>
                <input className="form-control" type="number" min="0" step="0.01"
                  placeholder="0.00" value={form.unit_price} onChange={sf("unit_price")} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Supplier</label>
                <input className="form-control" placeholder="Supplier name"
                  value={form.supplier} onChange={sf("supplier")} />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Description (optional)</label>
              <textarea className="form-control" rows={2}
                placeholder="Additional notes about this item..."
                value={form.description} onChange={sf("description")} />
            </div>
          </div>

          {/* Category-specific fields */}
          <div className="card" style={{ marginBottom: 24, borderColor: typeConfig.border }}>
            <div className="card-header">
              <h2 className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>{typeConfig.emoji}</span> {typeConfig.label} Specific Details
              </h2>
            </div>

            {selectedType === "spare_part" && (
              <div className="form-row">
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Part Number</label>
                  <input className="form-control" placeholder="e.g. TY-04465-02220"
                    value={form.part_number} onChange={sf("part_number")} />
                  <span style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, display: "block" }}>OEM or aftermarket part number</span>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Warranty Period</label>
                  <input className="form-control" placeholder="e.g. 12 months / 20,000 km"
                    value={form.warranty_period} onChange={sf("warranty_period")} />
                  <span style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, display: "block" }}>Leave blank if no warranty applies</span>
                </div>
              </div>
            )}

            {selectedType === "paint" && (
              <>
                <div className="form-row" style={{ marginBottom: 16 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Paint Type</label>
                    <select className="form-control" value={form.paint_type} onChange={sf("paint_type")}>
                      <option value="">— Select type —</option>
                      {PAINT_TYPES.map((p) => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Paint Grade</label>
                    <select className="form-control" value={form.paint_grade} onChange={sf("paint_grade")}>
                      <option value="">— Select grade —</option>
                      {PAINT_GRADES.map((g) => <option key={g}>{g}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Color Type / Description</label>
                  <input className="form-control"
                    placeholder="e.g. Pearl White, Metallic Silver, #FFFFFF"
                    value={form.color_type} onChange={sf("color_type")} />
                </div>
              </>
            )}

            {selectedType === "consumable" && (
              <div className="form-row">
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Consumable Type</label>
                  <select className="form-control" value={form.consumable_type} onChange={sf("consumable_type")}>
                    <option value="">— Select type —</option>
                    {WELD_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Size / Diameter</label>
                  <select className="form-control" value={form.weld_size} onChange={sf("weld_size")}>
                    <option value="">— Select size —</option>
                    {WELD_SIZES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <button className="btn btn-secondary" onClick={() => setStep(1)}>
              <ArrowLeft size={14} /> Back
            </button>
            <button className="btn btn-primary" onClick={() => {
              if (!form.name || !form.item_code) { toast.error("Name and Item Code are required"); return; }
              if (!form.unit_price) { toast.error("Unit price is required"); return; }
              setStep(3);
            }}>
              Next: Stock Info <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ═══ STEP 3: Stock & Submit ═══ */}
      {step === 3 && typeConfig && (
        <div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px",
            borderRadius: 20, background: typeConfig.glow, border: `1px solid ${typeConfig.border}`,
            color: typeConfig.color, fontWeight: 600, fontSize: 13, marginBottom: 24,
          }}>
            <span style={{ fontSize: 16 }}>{typeConfig.emoji}</span> {typeConfig.label}
          </div>

          {/* Stock config */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <h2 className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Layers size={16} style={{ color: "var(--accent)" }} /> Stock Configuration
              </h2>
            </div>
            <div className="form-row">
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Opening Stock Quantity</label>
                <input className="form-control" type="number" min="0" placeholder="0"
                  value={form.quantity} onChange={sf("quantity")} />
                <span style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, display: "block" }}>
                  Current quantity in store (can be 0 for new arrivals)
                </span>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <AlertCircle size={13} style={{ color: "var(--red)" }} /> Low Stock Alert At
                </label>
                <input className="form-control" type="number" min="1" placeholder="5"
                  value={form.low_stock_threshold} onChange={sf("low_stock_threshold")} />
                <span style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, display: "block" }}>
                  Alert triggers when stock drops to or below this level
                </span>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="card" style={{
            marginBottom: 24, borderColor: typeConfig.border,
            background: `linear-gradient(135deg, var(--bg-card) 0%, ${typeConfig.glow.replace("0.18", "0.06")} 100%)`,
          }}>
            <div className="card-header">
              <h2 className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <FileText size={16} style={{ color: "var(--accent)" }} /> Review Summary
              </h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 0" }}>
              {[
                ["Item Code", form.item_code],
                ["Name", form.name],
                ["Type", typeConfig.label],
                ["Unit", form.unit],
                ["Unit Price", form.unit_price ? `LKR ${Number(form.unit_price).toLocaleString()}` : "—"],
                ["Opening Stock", `${form.quantity || 0} ${form.unit}`],
                ["Low Stock Alert", form.low_stock_threshold],
                ["Supplier", form.supplier || "—"],
                ...(selectedType === "spare_part"
                  ? [["Part Number", form.part_number || "—"], ["Warranty", form.warranty_period || "—"]]
                  : []),
                ...(selectedType === "paint"
                  ? [["Paint Type", form.paint_type || "—"], ["Grade", form.paint_grade || "—"], ["Color", form.color_type || "—"]]
                  : []),
                ...(selectedType === "consumable"
                  ? [["Consumable Type", form.consumable_type || "—"], ["Size", form.weld_size || "—"]]
                  : []),
              ].map(([k, v]) => (
                <div key={k} style={{
                  display: "flex", gap: 8, fontSize: 14, padding: "8px 0",
                  borderBottom: "1px solid var(--border)",
                }}>
                  <span style={{ color: "var(--text-muted)", minWidth: 130, flexShrink: 0 }}>{k}</span>
                  <strong style={{ color: "var(--text-primary)" }}>{v}</strong>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <button className="btn btn-secondary" onClick={() => setStep(2)}>
              <ArrowLeft size={14} /> Back
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={saving}
              style={{ minWidth: 170, justifyContent: "center" }}
            >
              {saving ? (
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    width: 14, height: 14, borderRadius: "50%",
                    border: "2px solid transparent", borderTopColor: "#000",
                    animation: "inv-spin 0.8s linear infinite", display: "inline-block",
                  }} />
                  Adding...
                </span>
              ) : (
                <><CheckCircle2 size={16} /> Add to Inventory</>
              )}
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes inv-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
