import { useState, useEffect, useCallback } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import {
  Wrench, Package, Plus, Search, Edit2, Trash2, CheckCircle2,
  AlertTriangle, ArrowRight, Layers, DollarSign, Clock, ShieldAlert,
  Flame, Paintbrush, Cog, RefreshCw, CircleDot
} from "lucide-react";

const fmt = n => `LKR ${Number(n || 0).toLocaleString("en-LK", { minimumFractionDigits: 2 })}`;

const SERVICE_CATEGORIES = [
  { key: "all", label: "All Services" },
  { key: "painting", label: "🎨 Painting & Detailing" },
  { key: "welding", label: "🔥 Welding & Silencers" },
  { key: "mechanical", label: "⚙️ Mechanical & Engine" },
  { key: "periodic_maintenance", label: "🛢️ Periodic & Lube" },
  { key: "wheel_tyre", label: "🛞 Tyres & Wheels" },
  { key: "tinkering", label: "🔨 Tinkering & Dents" },
  { key: "ac_repair", label: "❄️ A/C & Climate" },
  { key: "electrical", label: "⚡ Auto Electrical" }
];

const ITEM_CATEGORIES = [
  { key: "all", label: "All Items" },
  { key: "consumable", label: "🛢️ Oils & Consumables" },
  { key: "spare_part", label: "🛞 Tyres, Wheels & Parts" },
  { key: "paint", label: "🎨 Paints, Primers & 2K" },
  { key: "tool", label: "🔧 Garage Tools" },
  { key: "other", label: "📦 Other Supplies" }
];

const CATEGORY_BADGES = {
  painting: { bg: "rgba(236, 72, 153, 0.15)", color: "#ec4899", border: "rgba(236, 72, 153, 0.3)", label: "Painting" },
  welding: { bg: "rgba(239, 68, 68, 0.15)", color: "#ef4444", border: "rgba(239, 68, 68, 0.3)", label: "Welding" },
  mechanical: { bg: "rgba(59, 130, 246, 0.15)", color: "#3b82f6", border: "rgba(59, 130, 246, 0.3)", label: "Mechanical" },
  periodic_maintenance: { bg: "rgba(16, 185, 129, 0.15)", color: "#10b981", border: "rgba(16, 185, 129, 0.3)", label: "Periodic Lube" },
  wheel_tyre: { bg: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", border: "rgba(245, 158, 11, 0.3)", label: "Tyre & Wheel" },
  tinkering: { bg: "rgba(139, 92, 246, 0.15)", color: "#8b5cf6", border: "rgba(139, 92, 246, 0.3)", label: "Tinkering" },
  ac_repair: { bg: "rgba(6, 182, 212, 0.15)", color: "#06b6d4", border: "rgba(6, 182, 212, 0.3)", label: "A/C & Climate" },
  electrical: { bg: "rgba(234, 179, 8, 0.15)", color: "#eab308", border: "rgba(234, 179, 8, 0.3)", label: "Electrical" }
};

import {
  getServiceImage,
  getItemImage,
  getFallbackSvg,
  SERVICE_PHOTO_PRESETS,
  ITEM_PHOTO_PRESETS
} from "../../utils/imageCatalog";

const CATEGORY_CODE_PREFIX = {
  painting: "SRV-PNT-",
  welding: "SRV-WLD-",
  mechanical: "SRV-ENG-",
  periodic_maintenance: "SRV-MNT-",
  wheel_tyre: "SRV-TYR-",
  tinkering: "SRV-TNK-",
  ac_repair: "SRV-AC-",
  electrical: "SRV-ELC-"
};

const getNextServiceCode = (category, existingServices = []) => {
  const prefix = CATEGORY_CODE_PREFIX[category] || "SRV-GEN-";
  const numbers = existingServices
    .map(s => s.service_code || "")
    .filter(code => code.toUpperCase().startsWith(prefix.toUpperCase()))
    .map(code => {
      const match = code.match(/(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    });

  const maxNum = numbers.length > 0 ? Math.max(...numbers, 0) : 0;
  const nextNum = maxNum + 1;
  return `${prefix}${String(nextNum).padStart(3, "0")}`;
};

const ITEM_CATEGORY_PREFIX = {
  spare_part: "PRT-",
  consumable: "CSM-",
  paint: "PNT-",
  tool: "TOL-",
  other: "OTH-"
};

const getNextItemCode = (category, existingItems = []) => {
  const prefix = ITEM_CATEGORY_PREFIX[category] || "ITM-";
  const numbers = existingItems
    .map(it => it.item_code || "")
    .filter(code => code.toUpperCase().startsWith(prefix.toUpperCase()))
    .map(code => {
      const match = code.match(/(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    });

  const maxNum = numbers.length > 0 ? Math.max(...numbers, 0) : 0;
  const nextNum = maxNum + 1;
  return `${prefix}${String(nextNum).padStart(3, "0")}`;
};

export default function ServicesItemsTab() {
  const [subTab, setSubTab] = useState("services"); // "services" | "items" | "matrix"
  const [services, setServices] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [srvSearch, setSrvSearch] = useState("");
  const [srvCategory, setSrvCategory] = useState("all");
  const [itemSearch, setItemSearch] = useState("");
  const [itemCategory, setItemCategory] = useState("all");

  // Service Modals State
  const [showAddService, setShowAddService] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    service_code: "", name: "", category: "painting", description: "",
    base_price: "", estimated_hours: "", bay_type: "paint", required_items_text: "",
    image_url: ""
  });
  const [savingService, setSavingService] = useState(false);

  // Inventory Item Modals State
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [stockModal, setStockModal] = useState(null);
  const [stockQty, setStockQty] = useState("");
  const [stockType, setStockType] = useState("stock_in");
  const [itemForm, setItemForm] = useState({
    item_code: "", name: "", category: "spare_part", unit: "piece",
    unit_price: "", quantity: "", low_stock_threshold: "", supplier: "", description: "",
    image_url: ""
  });
  const [savingItem, setSavingItem] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [sRes, iRes] = await Promise.all([
        api.get("/manager/services"),
        api.get("/manager/inventory")
      ]);
      setServices(sRes.data || []);
      setItems(iRes.data.items || []);
    } catch {
      toast.error("Failed to load services and items");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Service Form Handlers ──────────────────────────────────────────────────
  const openCreateService = (cat = "painting") => {
    const nextCode = getNextServiceCode(cat, services);
    const defaultBay = cat === "painting" ? "paint" : cat === "welding" ? "welding" : cat === "tinkering" ? "tinkering" : "mechanical";
    setServiceForm({
      service_code: nextCode,
      name: "",
      category: cat,
      description: "",
      base_price: "",
      estimated_hours: "",
      bay_type: defaultBay,
      required_items_text: "",
      image_url: ""
    });
    setEditingService(null);
    setShowAddService(true);
  };

  const handleServiceCategoryChange = (newCat) => {
    const nextCode = editingService ? serviceForm.service_code : getNextServiceCode(newCat, services);
    const defaultBay = newCat === "painting" ? "paint" : newCat === "welding" ? "welding" : newCat === "tinkering" ? "tinkering" : "mechanical";
    setServiceForm(f => ({
      ...f,
      category: newCat,
      service_code: nextCode,
      bay_type: f.bay_type === "general" || !editingService ? defaultBay : f.bay_type
    }));
  };

  const handleSelectServicePreset = (p) => {
    const newCat = p.category || serviceForm.category;
    const nextCode = editingService ? serviceForm.service_code : getNextServiceCode(newCat, services);
    const defaultBay = newCat === "painting" ? "paint" : newCat === "welding" ? "welding" : newCat === "tinkering" ? "tinkering" : "mechanical";
    setServiceForm(f => ({
      ...f,
      image_url: p.url,
      category: newCat,
      service_code: nextCode,
      bay_type: f.bay_type === "general" || !editingService ? defaultBay : f.bay_type
    }));
  };

  const openEditService = (srv) => {
    setEditingService(srv);
    setServiceForm({
      service_code: srv.service_code,
      name: srv.name,
      category: srv.category,
      description: srv.description || "",
      base_price: srv.base_price,
      estimated_hours: srv.estimated_hours,
      bay_type: srv.bay_type,
      required_items_text: Array.isArray(srv.required_items) ? srv.required_items.join(", ") : (srv.required_items || ""),
      image_url: srv.image_url || getServiceImage(srv.service_code, srv.category, srv.name)
    });
    setShowAddService(true);
  };

  const saveService = async (e) => {
    e.preventDefault();

    const priceNum = parseFloat(serviceForm.base_price);
    const hoursNum = parseFloat(serviceForm.estimated_hours);

    if (isNaN(priceNum) || priceNum < 0) {
      return toast.error("Base Labor Price cannot be a negative value (Minus numbers not allowed)");
    }
    if (isNaN(hoursNum) || hoursNum <= 0) {
      return toast.error("Estimated Hours must be greater than 0 (Minus numbers not allowed)");
    }

    setSavingService(true);
    try {
      const itemsList = serviceForm.required_items_text
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

      const payload = {
        service_code: serviceForm.service_code,
        name: serviceForm.name,
        category: serviceForm.category,
        description: serviceForm.description,
        base_price: priceNum,
        estimated_hours: hoursNum,
        bay_type: serviceForm.bay_type,
        required_items: itemsList,
        image_url: serviceForm.image_url
      };

      if (editingService) {
        await api.put(`/manager/services/${editingService.id}`, payload);
        toast.success(`Service "${serviceForm.name}" updated!`);
      } else {
        await api.post("/manager/services", payload);
        toast.success(`Service "${serviceForm.name}" added successfully!`);
      }
      setShowAddService(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save service");
    } finally {
      setSavingService(false);
    }
  };

  const deleteService = async (srv) => {
    if (!window.confirm(`Are you sure you want to delete service "${srv.name}"?`)) return;
    try {
      await api.delete(`/manager/services/${srv.id}`);
      toast.success(`Service deleted`);
      loadData();
    } catch {
      toast.error("Failed to delete service");
    }
  };

  // ─── Item Form Handlers ────────────────────────────────────────────────────
  const openCreateItem = (cat = "spare_part") => {
    const nextCode = getNextItemCode(cat, items);
    setItemForm({
      item_code: nextCode, name: "", category: cat, unit: "piece",
      unit_price: "", quantity: "", low_stock_threshold: "5", supplier: "", description: "",
      image_url: ""
    });
    setEditingItem(null);
    setShowAddItem(true);
  };

  const handleItemCategoryChange = (newCat) => {
    const nextCode = editingItem ? itemForm.item_code : getNextItemCode(newCat, items);
    setItemForm(f => ({
      ...f,
      category: newCat,
      item_code: nextCode
    }));
  };

  const handleSelectItemPreset = (p) => {
    const newCat = p.category || itemForm.category;
    const nextCode = editingItem ? itemForm.item_code : getNextItemCode(newCat, items);
    setItemForm(f => ({
      ...f,
      image_url: p.url,
      category: newCat,
      item_code: nextCode
    }));
  };

  const openEditItem = (it) => {
    setEditingItem(it);
    setItemForm({
      item_code: it.item_code,
      name: it.name,
      category: it.category,
      unit: it.unit,
      unit_price: it.unit_price,
      quantity: it.quantity,
      low_stock_threshold: it.low_stock_threshold,
      supplier: it.supplier || "",
      description: it.description || "",
      image_url: it.image_url || getItemImage(it.item_code, it.category, it.name)
    });
    setShowAddItem(true);
  };

  const saveItem = async (e) => {
    e.preventDefault();

    const itemPriceNum = parseFloat(itemForm.unit_price);
    const itemQtyNum = parseFloat(itemForm.quantity);
    const itemLowStockNum = parseFloat(itemForm.low_stock_threshold);

    if (isNaN(itemPriceNum) || itemPriceNum < 0) {
      return toast.error("Unit Price cannot be negative (Minus numbers not allowed)");
    }
    if (isNaN(itemQtyNum) || itemQtyNum < 0) {
      return toast.error("Quantity cannot be negative (Minus numbers not allowed)");
    }
    if (isNaN(itemLowStockNum) || itemLowStockNum < 0) {
      return toast.error("Low Stock Threshold cannot be negative");
    }

    setSavingItem(true);
    try {
      if (editingItem) {
        await api.put(`/inventory/${editingItem.id}`, itemForm);
        toast.success(`Item "${itemForm.name}" updated!`);
      } else {
        await api.post("/inventory", itemForm);
        toast.success(`Item "${itemForm.name}" added to inventory!`);
      }
      setShowAddItem(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save item");
    } finally {
      setSavingItem(false);
    }
  };

  const deleteItem = async (it) => {
    if (!window.confirm(`Delete item "${it.name}" from inventory?`)) return;
    try {
      await api.delete(`/inventory/${it.id}`);
      toast.success("Item deleted");
      loadData();
    } catch {
      toast.error("Failed to delete item");
    }
  };

  const handleStockUpdate = async (e) => {
    e.preventDefault();
    if (!stockModal || !stockQty) return;
    try {
      const endpoint = stockType === "stock_in" ? `/inventory/${stockModal.id}/stock-in` : `/inventory/${stockModal.id}/stock-out`;
      await api.post(endpoint, { quantity: parseFloat(stockQty), reference: `Manager Adjust` });
      toast.success(`Stock updated for ${stockModal.name}`);
      setStockModal(null);
      setStockQty("");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Stock update failed");
    }
  };

  // Filtered Services
  const filteredServices = services.filter(s => {
    const matchSearch = !srvSearch ||
      s.name.toLowerCase().includes(srvSearch.toLowerCase()) ||
      s.service_code.toLowerCase().includes(srvSearch.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(srvSearch.toLowerCase()));
    const matchCat = srvCategory === "all" || s.category === srvCategory;
    return matchSearch && matchCat;
  });

  // Filtered Items
  const filteredItems = items.filter(i => {
    const matchSearch = !itemSearch ||
      i.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
      i.item_code.toLowerCase().includes(itemSearch.toLowerCase()) ||
      (i.supplier && i.supplier.toLowerCase().includes(itemSearch.toLowerCase()));
    const matchCat = itemCategory === "all" || i.category === itemCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Sub Header & Navigation Toggle */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <Wrench style={{ color: "var(--accent, #f59e0b)" }} /> Workshop Services & Materials Catalog
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: 13, margin: "4px 0 0 0" }}>
            Manage Painting, Welding, Lube Services, Spare Wheels, Oils and required consumables
          </p>
        </div>

        {/* SubTab Switcher Buttons */}
        <div style={{ display: "flex", background: "var(--bg-surface)", padding: 4, borderRadius: 10, border: "1px solid var(--border)", gap: 4 }}>
          <button
            onClick={() => setSubTab("services")}
            className={`btn btn-sm ${subTab === "services" ? "btn-primary" : "btn-secondary"}`}
            style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600, padding: "6px 14px" }}
          >
            <Wrench size={14} /> Garage Services ({services.length})
          </button>
          <button
            onClick={() => setSubTab("items")}
            className={`btn btn-sm ${subTab === "items" ? "btn-primary" : "btn-secondary"}`}
            style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600, padding: "6px 14px" }}
          >
            <Package size={14} /> Items, Oils & Tyres ({items.length})
          </button>
          <button
            onClick={() => setSubTab("matrix")}
            className={`btn btn-sm ${subTab === "matrix" ? "btn-primary" : "btn-secondary"}`}
            style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600, padding: "6px 14px" }}
          >
            <Layers size={14} /> Service ⇄ Material Map
          </button>
        </div>
      </div>

      {/* ─── TAB 1: GARAGE SERVICES ────────────────────────────────────────────── */}
      {subTab === "services" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Action Bar & Category Chips */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {SERVICE_CATEGORIES.map(c => (
                <button
                  key={c.key}
                  onClick={() => setSrvCategory(c.key)}
                  className={`btn btn-sm ${srvCategory === c.key ? "btn-primary" : "btn-secondary"}`}
                  style={{ fontSize: 11, padding: "5px 10px" }}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <div className="search-bar">
                <Search className="search-icon" size={15} />
                <input
                  className="form-control"
                  style={{ width: 220 }}
                  placeholder="Search painting, welding..."
                  value={srvSearch}
                  onChange={e => setSrvSearch(e.target.value)}
                />
              </div>
              <button className="btn btn-primary btn-sm" onClick={openCreateService} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Plus size={15} /> Add New Service
              </button>
            </div>
          </div>

          {/* Services Grid */}
          {loading ? (
            <div className="loading">Loading services...</div>
          ) : filteredServices.length === 0 ? (
            <div className="card empty-state" style={{ padding: 40 }}>
              <div className="empty-icon">🛠️</div>
              <p>No services found matching your search or category.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
              {filteredServices.map(srv => {
                const badge = CATEGORY_BADGES[srv.category] || { bg: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "rgba(245,158,11,0.3)", label: srv.category };
                const imgSrc = srv.image_url || getServiceImage(srv.service_code, srv.category, srv.name);
                const fallbackSvg = getFallbackSvg(srv.name, srv.category, "#f59e0b", "🛠️");

                return (
                  <div key={srv.id} className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 0, overflow: "hidden", borderLeft: `4px solid ${badge.color}` }}>
                    {/* Photo Banner with Overlay */}
                    <div style={{ position: "relative", height: 160, overflow: "hidden", background: "#0f172a" }}>
                      <img
                        src={imgSrc}
                        alt={srv.name}
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = fallbackSvg; }}
                        style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s ease" }}
                        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
                        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                      />
                      <div style={{
                        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                        background: "linear-gradient(to top, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.2) 60%, transparent 100%)"
                      }} />

                      <div style={{ position: "absolute", top: 12, left: 12 }}>
                        <span style={{
                          background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`,
                          fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6, backdropFilter: "blur(6px)"
                        }}>
                          {badge.label}
                        </span>
                      </div>

                      <div style={{ position: "absolute", top: 12, right: 12 }}>
                        <span style={{ background: "rgba(15,23,42,0.85)", color: "var(--accent)", fontFamily: "monospace", fontWeight: 800, fontSize: 11, padding: "3px 8px", borderRadius: 6, border: "1px solid rgba(245,158,11,0.3)" }}>
                          {srv.service_code}
                        </span>
                      </div>

                      <div style={{ position: "absolute", bottom: 12, left: 14, right: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                        <span style={{ fontSize: 18, fontWeight: 900, color: "#f59e0b", textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>
                          {fmt(srv.base_price)}
                        </span>
                        <span style={{ fontSize: 11, color: "#cbd5e1", background: "rgba(0,0,0,0.6)", padding: "2px 8px", borderRadius: 4, display: "flex", alignItems: "center", gap: 4 }}>
                          <Clock size={12} /> ~{srv.estimated_hours} hrs
                        </span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 6px 0", color: "var(--text-primary)", lineHeight: 1.3 }}>
                          {srv.name}
                        </h3>
                        <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.4, margin: "0 0 14px 0" }}>
                          {srv.description || "Professional garage service performed by trained technicians."}
                        </p>

                        {/* Required / Used Materials */}
                        <div style={{ background: "var(--bg-surface)", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", marginBottom: 14 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent, #f59e0b)", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                            <Package size={12} /> Required Items & Consumables:
                          </div>
                          {Array.isArray(srv.required_items) && srv.required_items.length > 0 ? (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                              {srv.required_items.map((item, idx) => (
                                <span key={idx} style={{
                                  background: "rgba(255,255,255,0.06)", color: "#e2e8f0", fontSize: 10,
                                  padding: "2px 6px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.1)"
                                }}>
                                  • {item}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>No specific items assigned</span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          Bay: <strong>{srv.bay_type}</strong>
                        </div>

                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => openEditService(srv)}
                            style={{ padding: "5px 10px", display: "inline-flex", alignItems: "center", gap: 4 }}
                            title="Edit Service"
                          >
                            <Edit2 size={13} /> Edit
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => deleteService(srv)}
                            style={{ padding: "5px 10px" }}
                            title="Delete Service"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: ITEMS, OILS & SPARE WHEELS ─────────────────────────────────── */}
      {subTab === "items" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {ITEM_CATEGORIES.map(c => (
                <button
                  key={c.key}
                  onClick={() => setItemCategory(c.key)}
                  className={`btn btn-sm ${itemCategory === c.key ? "btn-primary" : "btn-secondary"}`}
                  style={{ fontSize: 11, padding: "5px 10px" }}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <div className="search-bar">
                <Search className="search-icon" size={15} />
                <input
                  className="form-control"
                  style={{ width: 220 }}
                  placeholder="Search oil, tyre, parts..."
                  value={itemSearch}
                  onChange={e => setItemSearch(e.target.value)}
                />
              </div>
              <button className="btn btn-primary btn-sm" onClick={openCreateItem} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Plus size={15} /> Add Inventory Item
              </button>
            </div>
          </div>

          <div className="card">
            {loading ? (
              <div className="loading">Loading items...</div>
            ) : filteredItems.length === 0 ? (
              <div className="empty-state" style={{ padding: 40 }}>
                <div className="empty-icon">📦</div>
                <p>No materials or spare parts found.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: 60 }}>Photo</th>
                      <th>Item Code</th>
                      <th>Item Name</th>
                      <th>Category</th>
                      <th>Unit Price</th>
                      <th>Available Qty</th>
                      <th>Supplier</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map(it => {
                      const isLow = Number(it.quantity) <= Number(it.low_stock_threshold);
                      const itemImg = it.image_url || getItemImage(it.item_code, it.category, it.name);
                      const fallbackSvg = getFallbackSvg(it.name, it.category, "#3b82f6", "📦");

                      return (
                        <tr key={it.id}>
                          <td>
                            <div style={{ width: 44, height: 44, borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)", background: "#0f172a" }}>
                              <img
                                src={itemImg}
                                alt={it.name}
                                referrerPolicy="no-referrer"
                                crossOrigin="anonymous"
                                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = fallbackSvg; }}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            </div>
                          </td>
                          <td>
                            <strong style={{ color: "var(--accent, #f59e0b)", fontFamily: "monospace" }}>
                              {it.item_code}
                            </strong>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{it.name}</div>
                          </td>
                          <td>
                            <span className="chip" style={{ textTransform: "capitalize" }}>
                              {it.category.replace("_", " ")}
                            </span>
                          </td>
                          <td>
                            <strong>{fmt(it.unit_price)}</strong> / {it.unit}
                          </td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{
                                fontWeight: 800, fontSize: 14,
                                color: isLow ? "var(--red, #ef4444)" : "#10b981"
                              }}>
                                {it.quantity} {it.unit}
                              </span>
                              {isLow && (
                                <span className="badge badge-cancelled" style={{ fontSize: 10, padding: "1px 5px" }}>
                                  Low
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{it.supplier || "—"}</span>
                          </td>
                          <td>
                            <div className="actions" style={{ display: "flex", gap: 6 }}>
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => { setStockModal(it); setStockType("stock_in"); setStockQty(""); }}
                                title="Adjust Stock In / Out"
                                style={{ padding: "4px 8px", fontSize: 11 }}
                              >
                                Stock ±
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => openEditItem(it)}
                                style={{ padding: "4px 8px" }}
                                title="Edit Item"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => deleteItem(it)}
                                style={{ padding: "4px 8px" }}
                                title="Delete Item"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 3: SERVICE ⇄ MATERIAL MATRIX ─────────────────────────────────── */}
      {subTab === "matrix" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card" style={{ padding: 18, borderLeft: "4px solid var(--accent, #f59e0b)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 6px 0", display: "flex", alignItems: "center", gap: 6 }}>
              <Layers size={18} style={{ color: "var(--accent)" }} /> Service to Materials Consumption Matrix
            </h3>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
              Quick reference showing garage services mapped against required lubricants, tyres, paints, and spare parts.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 16 }}>
            {services.map(srv => (
              <div key={srv.id} className="card" style={{ padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <strong style={{ fontSize: 15, color: "var(--text-primary)" }}>{srv.name}</strong>
                  <span className="chip">{srv.category}</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>
                  Standard Rate: <strong style={{ color: "var(--accent)" }}>{fmt(srv.base_price)}</strong> · Bay: <strong>{srv.bay_type}</strong>
                </div>

                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: "#94a3b8" }}>
                  📦 Required Parts, Oils & Materials:
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {Array.isArray(srv.required_items) && srv.required_items.length > 0 ? (
                    srv.required_items.map((item, idx) => (
                      <div key={idx} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        background: "var(--bg-surface)", padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border)"
                      }}>
                        <span style={{ fontSize: 12 }}>🔹 {item}</span>
                        <span style={{ fontSize: 10, color: "#10b981", fontWeight: 700 }}>Catalog Ready</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>General labor only (no materials linked)</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── MODAL: ADD / EDIT SERVICE (WITH PHOTO EDITING & SCROLL) ─────────────────────────── */}
      {showAddService && (
        <div className="modal-overlay" onClick={() => setShowAddService(false)} style={{ zIndex: 1100 }}>
          <div className="modal-card fade-in" onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 640, border: "1px solid var(--accent)" }}>
            <div className="modal-header" style={{ borderBottom: "1px solid var(--border)", paddingBottom: 14 }}>
              <h2 className="modal-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Wrench size={18} style={{ color: "var(--accent)" }} />
                {editingService ? "Edit Garage Service & Photo" : "Add New Garage Service & Photo"}
              </h2>
              <button className="modal-close" onClick={() => setShowAddService(false)}>✕</button>
            </div>

            <form onSubmit={saveService} style={{ paddingTop: 10 }}>
              {/* Photo Editor & Live Preview Section */}
              <div style={{ marginBottom: 18, padding: 14, background: "var(--bg-surface)", borderRadius: 10, border: "1px solid var(--border)" }}>
                <label className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span>🖼️ Service Photo / Banner Image</span>
                  <span style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700 }}>Live Preview</span>
                </label>
                
                <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 12 }}>
                  <div style={{ width: 110, height: 75, borderRadius: 8, overflow: "hidden", border: "2px solid var(--accent)", flexShrink: 0, background: "#0f172a" }}>
                    <img
                      src={serviceForm.image_url || getServiceImage(serviceForm.service_code, serviceForm.category, serviceForm.name)}
                      alt="Service Preview"
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = getFallbackSvg(serviceForm.name || "Service", serviceForm.category, "#f59e0b", "🛠️"); }}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <input
                      className="form-control"
                      placeholder="Paste custom image URL (e.g. https://...)"
                      value={serviceForm.image_url}
                      onChange={e => setServiceForm(f => ({ ...f, image_url: e.target.value }))}
                      style={{ fontSize: 12, fontFamily: "monospace" }}
                    />
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                      Enter an image link or click a preset below:
                    </div>
                  </div>
                </div>

                {/* Quick Presets */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6 }}>
                    Quick Service Photo Presets:
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {SERVICE_PHOTO_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectServicePreset(p)}
                        style={{
                          padding: "4px 8px", fontSize: 11, borderRadius: 6, cursor: "pointer",
                          background: serviceForm.image_url === p.url ? "var(--accent)" : "rgba(255,255,255,0.06)",
                          color: serviceForm.image_url === p.url ? "#000" : "var(--text-primary)",
                          border: `1px solid ${serviceForm.image_url === p.url ? "var(--accent)" : "var(--border)"}`,
                          fontWeight: 600, transition: "all 0.15s"
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Service Code *</label>
                  <input className="form-control" required value={serviceForm.service_code} onChange={e => setServiceForm(f => ({ ...f, service_code: e.target.value }))} placeholder="SRV-PNT-001" />
                </div>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select className="form-control" value={serviceForm.category} onChange={e => handleServiceCategoryChange(e.target.value)}>
                    <option value="painting">🎨 Painting & 2K Coating</option>
                    <option value="welding">🔥 Welding & Silencers</option>
                    <option value="mechanical">⚙️ Mechanical & Engine</option>
                    <option value="periodic_maintenance">🛢️ Periodic & Lube</option>
                    <option value="wheel_tyre">🛞 Tyres & Wheels</option>
                    <option value="tinkering">🔨 Tinkering & Dents</option>
                    <option value="ac_repair">❄️ A/C & Climate</option>
                    <option value="electrical">⚡ Auto Electrical</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Service Name *</label>
                <input className="form-control" required value={serviceForm.name} onChange={e => setServiceForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Full Body 2K Paint, Welding Reinforcement" />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Base Labor Price (LKR) *</span>
                    {serviceForm.base_price !== "" && parseFloat(serviceForm.base_price) < 0 && (
                      <span style={{ color: "var(--red, #ef4444)", fontSize: 11, fontWeight: 700 }}>⚠️ Minus values not allowed</span>
                    )}
                  </label>
                  <input
                    className="form-control"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    style={{
                      borderColor: serviceForm.base_price !== "" && parseFloat(serviceForm.base_price) < 0 ? "var(--red, #ef4444)" : undefined
                    }}
                    value={serviceForm.base_price}
                    onChange={e => setServiceForm(f => ({ ...f, base_price: e.target.value }))}
                    placeholder="e.g. 5000.00"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Estimated Hours *</span>
                    {serviceForm.estimated_hours !== "" && parseFloat(serviceForm.estimated_hours) <= 0 && (
                      <span style={{ color: "var(--red, #ef4444)", fontSize: 11, fontWeight: 700 }}>⚠️ Must be &gt; 0 (No minus)</span>
                    )}
                  </label>
                  <input
                    className="form-control"
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    style={{
                      borderColor: serviceForm.estimated_hours !== "" && parseFloat(serviceForm.estimated_hours) <= 0 ? "var(--red, #ef4444)" : undefined
                    }}
                    value={serviceForm.estimated_hours}
                    onChange={e => setServiceForm(f => ({ ...f, estimated_hours: e.target.value }))}
                    placeholder="e.g. 2.0"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Assigned Bay</label>
                  <select className="form-control" value={serviceForm.bay_type} onChange={e => setServiceForm(f => ({ ...f, bay_type: e.target.value }))}>
                    <option value="paint">Paint Booth</option>
                    <option value="welding">Welding Bay</option>
                    <option value="mechanical">Mechanical Bay</option>
                    <option value="tinkering">Tinkering Bay</option>
                    <option value="general">General</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Required Materials, Oils & Parts <span style={{ fontSize: 11, color: "var(--text-muted)" }}>(Comma separated list)</span>
                </label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={serviceForm.required_items_text}
                  onChange={e => setServiceForm(f => ({ ...f, required_items_text: e.target.value }))}
                  placeholder="e.g. Engine Oil 5W-30 (1L), Oil Filter, Brake Pads, Paint Can, Welding Rods"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Service Description</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={serviceForm.description}
                  onChange={e => setServiceForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Details regarding procedure, quality checks and deliverables..."
                />
              </div>

              <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddService(false)} disabled={savingService}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={savingService}>{savingService ? "Saving..." : (editingService ? "Save Changes" : "Create Service")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: ADD / EDIT INVENTORY ITEM (WITH PHOTO EDITING & SCROLL) ────────────────────────── */}
      {showAddItem && (
        <div className="modal-overlay" onClick={() => setShowAddItem(false)} style={{ zIndex: 1100 }}>
          <div className="modal-card fade-in" onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 620, border: "1px solid var(--accent)" }}>
            <div className="modal-header" style={{ borderBottom: "1px solid var(--border)", paddingBottom: 14 }}>
              <h2 className="modal-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Package size={18} style={{ color: "var(--accent)" }} />
                {editingItem ? "Edit Material / Part & Photo" : "Add New Material / Part & Photo"}
              </h2>
              <button className="modal-close" onClick={() => setShowAddItem(false)}>✕</button>
            </div>

            <form onSubmit={saveItem} style={{ paddingTop: 10 }}>
              {/* Item Photo & Live Preview Section */}
              <div style={{ marginBottom: 18, padding: 14, background: "var(--bg-surface)", borderRadius: 10, border: "1px solid var(--border)" }}>
                <label className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span>🖼️ Spare Part / Material Photo</span>
                  <span style={{ fontSize: 11, color: "#3b82f6", fontWeight: 700 }}>Live Preview</span>
                </label>
                
                <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 12 }}>
                  <div style={{ width: 80, height: 70, borderRadius: 8, overflow: "hidden", border: "2px solid #3b82f6", flexShrink: 0, background: "#0f172a" }}>
                    <img
                      src={itemForm.image_url || getItemImage(itemForm.item_code, itemForm.category, itemForm.name)}
                      alt="Part Preview"
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = getFallbackSvg(itemForm.name || "Part", itemForm.category, "#3b82f6", "📦"); }}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <input
                      className="form-control"
                      placeholder="Paste custom image URL (e.g. https://...)"
                      value={itemForm.image_url}
                      onChange={e => setItemForm(f => ({ ...f, image_url: e.target.value }))}
                      style={{ fontSize: 12, fontFamily: "monospace" }}
                    />
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                      Enter custom photo link or pick from curated presets:
                    </div>
                  </div>
                </div>

                {/* Quick Presets */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6 }}>
                    Quick Part Photo Presets:
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {ITEM_PHOTO_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectItemPreset(p)}
                        style={{
                          padding: "4px 8px", fontSize: 11, borderRadius: 6, cursor: "pointer",
                          background: itemForm.image_url === p.url ? "#3b82f6" : "rgba(255,255,255,0.06)",
                          color: itemForm.image_url === p.url ? "#fff" : "var(--text-primary)",
                          border: `1px solid ${itemForm.image_url === p.url ? "#3b82f6" : "var(--border)"}`,
                          fontWeight: 600, transition: "all 0.15s"
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Item Code *</label>
                  <input className="form-control" required value={itemForm.item_code} onChange={e => setItemForm(f => ({ ...f, item_code: e.target.value }))} placeholder="OIL-5W30, TYR-195-65" />
                </div>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select className="form-control" value={itemForm.category} onChange={e => handleItemCategoryChange(e.target.value)}>
                    <option value="consumable">🛢️ Consumable (Oils, Grease, Fluids)</option>
                    <option value="spare_part">🛞 Spare Part (Tyres, Wheels, Belts, Plugs)</option>
                    <option value="paint">🎨 Paint, Primer & Clear Coat</option>
                    <option value="tool">🔧 Tool & Equipment</option>
                    <option value="other">📦 Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Item Name *</label>
                <input className="form-control" required value={itemForm.name} onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))} placeholder="Engine Oil 5W-30 (1L), Tyre 195/65 R15, Welding Rod" />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Unit Price (LKR) *</span>
                    {itemForm.unit_price !== "" && parseFloat(itemForm.unit_price) < 0 && (
                      <span style={{ color: "var(--red, #ef4444)", fontSize: 11, fontWeight: 700 }}>⚠️ No minus values</span>
                    )}
                  </label>
                  <input
                    className="form-control"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    style={{
                      borderColor: itemForm.unit_price !== "" && parseFloat(itemForm.unit_price) < 0 ? "var(--red, #ef4444)" : undefined
                    }}
                    value={itemForm.unit_price}
                    onChange={e => setItemForm(f => ({ ...f, unit_price: e.target.value }))}
                    placeholder="1850.00"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Initial Quantity *</span>
                    {itemForm.quantity !== "" && parseFloat(itemForm.quantity) < 0 && (
                      <span style={{ color: "var(--red, #ef4444)", fontSize: 11, fontWeight: 700 }}>⚠️ No minus values</span>
                    )}
                  </label>
                  <input
                    className="form-control"
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    style={{
                      borderColor: itemForm.quantity !== "" && parseFloat(itemForm.quantity) < 0 ? "var(--red, #ef4444)" : undefined
                    }}
                    value={itemForm.quantity}
                    onChange={e => setItemForm(f => ({ ...f, quantity: e.target.value }))}
                    placeholder="20"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit</label>
                  <select className="form-control" value={itemForm.unit} onChange={e => setItemForm(f => ({ ...f, unit: e.target.value }))}>
                    <option value="piece">Piece</option>
                    <option value="bottle">Bottle (1L)</option>
                    <option value="can">Can (Paint)</option>
                    <option value="pack">Pack / Set</option>
                    <option value="kg">Kg</option>
                    <option value="liter">Liter</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Low Stock Alert Threshold</span>
                    {itemForm.low_stock_threshold !== "" && parseFloat(itemForm.low_stock_threshold) < 0 && (
                      <span style={{ color: "var(--red, #ef4444)", fontSize: 11, fontWeight: 700 }}>⚠️ No minus values</span>
                    )}
                  </label>
                  <input
                    className="form-control"
                    type="number"
                    min="0"
                    style={{
                      borderColor: itemForm.low_stock_threshold !== "" && parseFloat(itemForm.low_stock_threshold) < 0 ? "var(--red, #ef4444)" : undefined
                    }}
                    value={itemForm.low_stock_threshold}
                    onChange={e => setItemForm(f => ({ ...f, low_stock_threshold: e.target.value }))}
                    placeholder="5"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Supplier Name</label>
                  <input className="form-control" value={itemForm.supplier} onChange={e => setItemForm(f => ({ ...f, supplier: e.target.value }))} placeholder="e.g. Lanka Lubricants, Bridgestone" />
                </div>
              </div>

              <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddItem(false)} disabled={savingItem}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={savingItem}>{savingItem ? "Saving..." : (editingItem ? "Save Changes" : "Add Item")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: STOCK ADJUST (IN / OUT) ────────────────────────────────────── */}
      {stockModal && (
        <div className="modal-overlay" onClick={() => setStockModal(null)} style={{ zIndex: 1100 }}>
          <div className="modal-card fade-in" onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 460, border: "1px solid var(--accent)" }}>
            <div className="modal-header" style={{ borderBottom: "1px solid var(--border)", paddingBottom: 10 }}>
              <h3 className="modal-title">📦 Adjust Stock Level</h3>
              <button className="modal-close" onClick={() => setStockModal(null)}>✕</button>
            </div>
            <form onSubmit={handleStockUpdate} style={{ padding: "14px 0 0 0" }}>
              <div style={{ marginBottom: 12 }}>
                <strong>{stockModal.name}</strong> ({stockModal.item_code})
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Current In Stock: <strong>{stockModal.quantity} {stockModal.unit}</strong></div>
              </div>

              <div className="form-group">
                <label className="form-label">Transaction Type</label>
                <select className="form-control" value={stockType} onChange={e => setStockType(e.target.value)}>
                  <option value="stock_in">➕ Stock IN (Received New Stock / Supplier Delivery)</option>
                  <option value="stock_out">➖ Stock OUT (Used in Service / Write-Off)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Quantity ({stockModal.unit})</label>
                <input className="form-control" type="number" step="0.5" required min="0.5" value={stockQty} onChange={e => setStockQty(e.target.value)} placeholder="e.g. 5" />
              </div>

              <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setStockModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Confirm Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
