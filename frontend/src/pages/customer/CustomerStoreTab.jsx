import { useState, useEffect, useCallback } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import {
  Wrench, Package, ShoppingCart, Check, Plus, Minus,
  Calendar, Car, Trash2, ArrowRight, ShieldCheck, Clock,
  Sparkles, Layers, DollarSign, Search, CheckCircle2, CreditCard,
  Building2, Banknote, AlertCircle, Tag
} from "lucide-react";

const fmt = n => `LKR ${Number(n || 0).toLocaleString("en-LK", { minimumFractionDigits: 2 })}`;

import {
  getServiceImage,
  getItemImage,
  getFallbackSvg
} from "../../utils/imageCatalog";

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

export default function CustomerStoreTab({ vehicles = [], onOrderPlaced }) {
  const [activeCatalog, setActiveCatalog] = useState("services"); // "services" or "parts"
  const [services, setServices] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Service Booking State
  const [selectedServices, setSelectedServices] = useState([]);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [appointmentVehicleId, setAppointmentVehicleId] = useState("");
  const [newVehicle, setNewVehicle] = useState({ license_plate: "", make: "", model: "", year: new Date().getFullYear() });
  const [isNewVehicle, setIsNewVehicle] = useState(false);
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("Morning (08:30 AM - 12:00 PM)");
  const [appointmentNotes, setAppointmentNotes] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  // Store Parts Direct Buy Cart State
  const [cartItems, setCartItems] = useState({});
  const [showDirectBuyModal, setShowDirectBuyModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [purchasingLoading, setPurchasingLoading] = useState(false);

  const loadCatalog = useCallback(async () => {
    try {
      setLoading(true);
      const [sRes, iRes] = await Promise.allSettled([
        api.get("/customers/store/services"),
        api.get("/customers/store/items")
      ]);
      if (sRes.status === "fulfilled") setServices(sRes.value.data || []);
      if (iRes.status === "fulfilled") setItems(iRes.value.data || []);
    } catch {
      toast.error("Failed to load catalog");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    if (vehicles.length > 0 && !appointmentVehicleId) {
      setAppointmentVehicleId(vehicles[0].id);
    }
  }, [vehicles, appointmentVehicleId]);

  // --- SERVICE BOOKING HANDLERS ---
  const toggleService = (service) => {
    setSelectedServices(prev => {
      const exists = prev.some(s => s.id === service.id);
      if (exists) {
        toast("Service removed from booking");
        return prev.filter(s => s.id !== service.id);
      } else {
        toast.success(`Selected "${service.name}"`);
        return [...prev, service];
      }
    });
  };

  const handleQuickBookInspection = () => {
    const inspectSrv = services.find(s => s.service_code === "SRV-CHK-001") || services.find(s => s.name.toLowerCase().includes("inspection")) || services[0];
    if (inspectSrv) {
      setSelectedServices([inspectSrv]);
      setShowAppointmentModal(true);
      toast.success("Selected Full Vehicle Inspection & Diagnosis!");
    } else {
      setShowAppointmentModal(true);
    }
  };

  const handleQuickBookCustomIssue = () => {
    const customSrv = services.find(s => s.service_code === "SRV-OTH-001") || services.find(s => s.name.toLowerCase().includes("other")) || services[0];
    if (customSrv) {
      setSelectedServices([customSrv]);
      setShowAppointmentModal(true);
      toast.success("Selected Custom / Other Vehicle Issue!");
    } else {
      setShowAppointmentModal(true);
    }
  };

  // Service Booking Payment State
  const [aptPayNow, setAptPayNow] = useState(false);
  const [aptPaymentMethod, setAptPaymentMethod] = useState("card");
  const [aptCardData, setAptCardData] = useState({ number: "4532 8900 1234 8842", expiry: "12/28", cvc: "742", name: "Sasindu Deshan" });

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!selectedServices.length) {
      return toast.error("Please select at least one service.");
    }
    if (!appointmentVehicleId && (!isNewVehicle || !newVehicle.license_plate)) {
      return toast.error("Please select or register a vehicle for your appointment.");
    }
    if (!preferredDate) {
      return toast.error("Please choose your preferred appointment date.");
    }

    setBookingLoading(true);
    try {
      const payload = {
        vehicle_id: isNewVehicle ? null : appointmentVehicleId,
        new_vehicle: isNewVehicle ? newVehicle : null,
        services: selectedServices.map(s => ({ id: s.id, name: s.name, price: s.base_price, bay_type: s.bay_type })),
        preferred_date: preferredDate,
        preferred_time: preferredTime,
        customer_notes: appointmentNotes,
        pay_now: aptPayNow,
        payment_method: aptPaymentMethod,
        payment_details: aptPayNow ? aptCardData : null
      };

      const res = await api.post("/appointments", payload);
      toast.success(res.data.message || (aptPayNow ? "Payment received & Appointment confirmed!" : "Appointment booked successfully!"));
      setSelectedServices([]);
      setShowAppointmentModal(false);
      setAptPayNow(false);
      if (onOrderPlaced) onOrderPlaced(aptPayNow ? "invoices" : "appointments");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to book appointment");
    } finally {
      setBookingLoading(false);
    }
  };

  // --- DIRECT STORE PURCHASE HANDLERS ---
  const addItemQty = (item) => {
    setCartItems(prev => {
      const currentQty = prev[item.id]?.qty || 0;
      if (currentQty >= Number(item.quantity)) {
        toast.error(`Only ${item.quantity} ${item.unit} available in stock!`);
        return prev;
      }
      return {
        ...prev,
        [item.id]: { item, qty: currentQty + 1 }
      };
    });
  };

  const removeItemQty = (item) => {
    setCartItems(prev => {
      const currentQty = prev[item.id]?.qty || 0;
      if (currentQty <= 1) {
        const next = { ...prev };
        delete next[item.id];
        return next;
      }
      return {
        ...prev,
        [item.id]: { item, qty: currentQty - 1 }
      };
    });
  };

  const deleteItemFromCart = (itemId) => {
    setCartItems(prev => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  };

  const directCartItemsList = Object.values(cartItems);
  const directCartTotal = directCartItemsList.reduce((sum, { item, qty }) => sum + (parseFloat(item.unit_price || 0) * qty), 0);
  const directCartItemCount = directCartItemsList.reduce((sum, i) => sum + i.qty, 0);

  const handleDirectBuySubmit = async (e) => {
    e.preventDefault();
    if (!directCartItemsList.length) {
      return toast.error("Cart is empty.");
    }

    setPurchasingLoading(true);
    try {
      const payload = {
        items: directCartItemsList.map(({ item, qty }) => ({
          item_id: item.id,
          quantity: qty
        })),
        payment_method: paymentMethod
      };

      const res = await api.post("/customers/store/direct-buy", payload);
      toast.success(res.data.message || "Purchase completed! Invoice generated.");
      setCartItems({});
      setShowDirectBuyModal(false);
      loadCatalog();
      if (onOrderPlaced) onOrderPlaced("invoices");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to complete purchase");
    } finally {
      setPurchasingLoading(false);
    }
  };

  // Filtered Services & Items
  const filteredServices = services.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || (s.description && s.description.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredItems = items.filter(it => {
    const matchesSearch = it.name.toLowerCase().includes(search.toLowerCase()) || it.item_code.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "all" || it.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box", overflowX: "hidden" }}>
      {/* Primary Toggle: Services (Book Appointment) vs Store Parts (Instant Buy) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, marginBottom: 20 }}>
        <button
          onClick={() => { setActiveCatalog("services"); setSelectedCategory("all"); setSearch(""); }}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
            padding: "16px 20px", borderRadius: 14, border: "none", cursor: "pointer",
            background: activeCatalog === "services" ? "linear-gradient(135deg, var(--accent), #d97706)" : "var(--bg-surface)",
            color: activeCatalog === "services" ? "#fff" : "var(--text-primary)",
            boxShadow: activeCatalog === "services" ? "0 8px 24px rgba(245,158,11,0.35)" : "none",
            border: `1px solid ${activeCatalog === "services" ? "transparent" : "var(--border)"}`,
            transition: "all 0.25s"
          }}
        >
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: activeCatalog === "services" ? "rgba(255,255,255,0.2)" : "rgba(245,158,11,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
          }}>
            <Wrench size={20} style={{ color: activeCatalog === "services" ? "#fff" : "var(--accent)" }} />
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontWeight: 800, fontSize: 15 }}>Workshop Services & Repairs</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>Book an Appointment for Vehicle Inspection & Repair</div>
          </div>
        </button>

        <button
          onClick={() => { setActiveCatalog("parts"); setSelectedCategory("all"); setSearch(""); }}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
            padding: "16px 20px", borderRadius: 14, border: "none", cursor: "pointer",
            background: activeCatalog === "parts" ? "linear-gradient(135deg, #2563eb, #1d4ed8)" : "var(--bg-surface)",
            color: activeCatalog === "parts" ? "#fff" : "var(--text-primary)",
            boxShadow: activeCatalog === "parts" ? "0 8px 24px rgba(37,99,235,0.35)" : "none",
            border: `1px solid ${activeCatalog === "parts" ? "transparent" : "var(--border)"}`,
            transition: "all 0.25s"
          }}
        >
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: activeCatalog === "parts" ? "rgba(255,255,255,0.2)" : "rgba(37,99,235,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
          }}>
            <Package size={20} style={{ color: activeCatalog === "parts" ? "#fff" : "#2563eb" }} />
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontWeight: 800, fontSize: 15 }}>Store & Spare Parts</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>Buy Parts, Oils & Consumables with Instant Invoice</div>
          </div>
        </button>
      </div>

      {/* Search & Action Bar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", maxWidth: "100%" }}>
        <div className="search-bar" style={{ flex: "1 1 260px" }}>
          <Search className="search-icon" size={16} />
          <input
            className="form-control"
            placeholder={activeCatalog === "services" ? "Search workshop services (e.g. Paint, AC, Brakes, Engine)..." : "Search spare parts, engine oils, filters, tyres..."}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Action Button to Open Checkout Modal */}
        {activeCatalog === "services" && (
          <button
            className="btn btn-primary"
            onClick={() => setShowAppointmentModal(true)}
            disabled={selectedServices.length === 0}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", fontSize: 13, fontWeight: 700 }}
          >
            <Calendar size={16} /> Book Appointment ({selectedServices.length} selected)
          </button>
        )}

        {activeCatalog === "parts" && (
          <button
            className="btn btn-primary"
            onClick={() => setShowDirectBuyModal(true)}
            disabled={directCartItemCount === 0}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", fontSize: 13, fontWeight: 700,
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)"
            }}
          >
            <ShoppingCart size={16} /> Instant Checkout ({directCartItemCount} items · {fmt(directCartTotal)})
          </button>
        )}
      </div>

      {/* Category Pills Bar */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 10, marginBottom: 20, maxWidth: "100%" }}>
        {(activeCatalog === "services" ? SERVICE_CATEGORIES : ITEM_CATEGORIES).map(cat => {
          const isActive = selectedCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              style={{
                padding: "7px 14px", borderRadius: 20, border: "none", cursor: "pointer",
                whiteSpace: "nowrap", fontSize: 12, fontWeight: 600,
                background: isActive ? (activeCatalog === "services" ? "var(--accent)" : "#2563eb") : "var(--bg-surface)",
                color: isActive ? "#fff" : "var(--text-secondary)",
                border: `1px solid ${isActive ? "transparent" : "var(--border)"}`,
                transition: "all 0.2s",
                boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.15)" : "none"
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* --- SERVICES CATALOG VIEW --- */}
      {activeCatalog === "services" && (
        <>
          {/* Quick-Assist Hero Banner for Beginner & Non-technical Vehicle Owners */}
          <div style={{
            background: "linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(37, 99, 235, 0.08) 100%)",
            border: "1px solid rgba(245, 158, 11, 0.35)",
            borderRadius: 14,
            padding: "16px 20px",
            marginBottom: 20,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 14,
            maxWidth: "100%",
            boxSizing: "border-box"
          }}>
            <div style={{ flex: "1 1 260px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <Sparkles size={17} style={{ color: "var(--accent)" }} />
                <span style={{ fontWeight: 800, fontSize: 15, color: "var(--text-primary)" }}>
                  Not sure what your vehicle needs?
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.45 }}>
                No technical knowledge needed! Bring your vehicle directly to our garage. Our certified service advisor & technician will perform a comprehensive 50-point inspection, diagnose any faults, and advise you with an upfront estimate.
              </p>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                className="btn btn-primary"
                onClick={handleQuickBookInspection}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "9px 15px", fontSize: 12, fontWeight: 700,
                  boxShadow: "0 4px 14px rgba(245, 158, 11, 0.3)"
                }}
              >
                <Search size={14} /> 🔍 Full Vehicle Inspection & Diagnosis
              </button>

              <button
                className="btn btn-secondary"
                onClick={handleQuickBookCustomIssue}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "9px 15px", fontSize: 12, fontWeight: 700,
                  border: "1px solid var(--border)"
                }}
              >
                <AlertCircle size={14} /> ❓ Other / Custom Issue
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 20 }}>
            {filteredServices.map(srv => {
              const isSelected = selectedServices.some(s => s.id === srv.id);
              const imgSrc = srv.image_url || getServiceImage(srv.service_code, srv.category, srv.name);
              const fallbackSvg = getFallbackSvg(srv.name, srv.category, "#f59e0b", "🔧");

              return (
                <div
                  key={srv.id}
                  className="card"
                  style={{
                    display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 0, overflow: "hidden",
                    border: `1px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
                    background: isSelected ? "rgba(245,158,11,0.06)" : "var(--bg-card)",
                    boxShadow: isSelected ? "0 8px 24px rgba(245,158,11,0.25)" : "var(--shadow)",
                    transition: "all 0.25s"
                  }}
                >
                  {/* Photo Header */}
                  <div style={{ position: "relative", height: 140, overflow: "hidden", background: "#0f172a" }}>
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
                      background: "linear-gradient(to top, rgba(15,23,42,0.9) 0%, rgba(15,23,42,0.2) 60%, transparent 100%)"
                    }} />

                    <div style={{ position: "absolute", top: 10, left: 10 }}>
                      <span className="chip" style={{ background: "rgba(15,23,42,0.85)", color: "#fff", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.2)", fontSize: 10 }}>
                        {srv.bay_type || srv.category || "Service"}
                      </span>
                    </div>

                    <div style={{ position: "absolute", top: 10, right: 10 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 10,
                        background: "rgba(245,158,11,0.9)", color: "#fff", display: "inline-flex", alignItems: "center", gap: 3
                      }}>
                        <Clock size={11} /> ~{srv.estimated_hours || 1} hrs
                      </span>
                    </div>

                    <div style={{ position: "absolute", bottom: 10, left: 12 }}>
                      <span style={{ fontSize: 18, fontWeight: 900, color: "#f59e0b", textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>
                        {fmt(srv.base_price)}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", marginBottom: 4, lineHeight: 1.3 }}>
                        {srv.name}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace", marginBottom: 12 }}>
                        Code: {srv.service_code || "SRV-001"}
                      </div>
                    </div>

                    <button
                      className={`btn ${isSelected ? "btn-secondary" : "btn-primary"}`}
                      onClick={() => toggleService(srv)}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 12px",
                        background: isSelected ? "var(--green)" : undefined, color: isSelected ? "#fff" : undefined,
                        fontWeight: 600, fontSize: 13
                      }}
                    >
                      {isSelected ? <><Check size={14} /> Selected</> : <><Plus size={14} /> Select Service</>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {!filteredServices.length && !loading && (
            <div className="empty-state">
              <div className="empty-icon">🔧</div>
              <p>No workshop services found matching your search</p>
            </div>
          )}
        </>
      )}

      {/* --- STORE & SPARE PARTS CATALOG VIEW --- */}
      {activeCatalog === "parts" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 20 }}>
            {filteredItems.map(it => {
              const inStock = Number(it.quantity) > 0;
              const cartQty = cartItems[it.id]?.qty || 0;
              const itemImg = it.image_url || getItemImage(it.item_code, it.category, it.name);
              const fallbackSvg = getFallbackSvg(it.name, it.category, "#3b82f6", "📦");

              return (
                <div
                  key={it.id}
                  className="card"
                  style={{
                    display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 0, overflow: "hidden",
                    border: `1px solid ${cartQty > 0 ? "#2563eb" : "var(--border)"}`,
                    background: cartQty > 0 ? "rgba(37,99,235,0.06)" : "var(--bg-card)",
                    boxShadow: cartQty > 0 ? "0 8px 24px rgba(37,99,235,0.25)" : "var(--shadow)",
                    transition: "all 0.25s"
                  }}
                >
                  {/* Photo Header */}
                  <div style={{ position: "relative", height: 140, overflow: "hidden", background: "#0f172a" }}>
                    <img
                      src={itemImg}
                      alt={it.name}
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = fallbackSvg; }}
                      style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s ease" }}
                      onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
                      onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                    />
                    <div style={{
                      position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                      background: "linear-gradient(to top, rgba(15,23,42,0.9) 0%, rgba(15,23,42,0.2) 60%, transparent 100%)"
                    }} />

                    <div style={{ position: "absolute", top: 10, left: 10 }}>
                      <span className="chip" style={{ background: "rgba(15,23,42,0.85)", color: "#fff", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.2)", fontSize: 10 }}>
                        {it.category || "Part"}
                      </span>
                    </div>

                    <div style={{ position: "absolute", top: 10, right: 10 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 10,
                        background: inStock ? "rgba(16,185,129,0.9)" : "rgba(239,68,68,0.9)", color: "#fff"
                      }}>
                        {inStock ? `In Stock (${it.quantity} ${it.unit})` : "Out of Stock"}
                      </span>
                    </div>

                    <div style={{ position: "absolute", bottom: 10, left: 12 }}>
                      <span style={{ fontSize: 18, fontWeight: 900, color: "#60a5fa", textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>
                        {fmt(it.unit_price)} <span style={{ fontSize: 11, color: "#cbd5e1", fontWeight: 400 }}>/ {it.unit}</span>
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", marginBottom: 4, lineHeight: 1.3 }}>
                        {it.name}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace", marginBottom: 12 }}>
                        Code: {it.item_code}
                      </div>
                    </div>

                    {inStock ? (
                      cartQty > 0 ? (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-surface)", padding: "4px 8px", borderRadius: 8, border: "1px solid #2563eb" }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => removeItemQty(it)} style={{ padding: "4px 8px" }}><Minus size={14} /></button>
                          <span style={{ fontWeight: 800, fontSize: 14, color: "#2563eb" }}>{cartQty} {it.unit}</span>
                          <button className="btn btn-secondary btn-sm" onClick={() => addItemQty(it)} style={{ padding: "4px 8px" }}><Plus size={14} /></button>
                        </div>
                      ) : (
                        <button
                          className="btn btn-secondary"
                          onClick={() => addItemQty(it)}
                          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontWeight: 600, fontSize: 13 }}
                        >
                          <Plus size={14} /> Add to Direct Buy
                        </button>
                      )
                    ) : (
                      <button className="btn btn-secondary" disabled style={{ width: "100%", opacity: 0.5, fontSize: 13 }}>Out of Stock</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {!filteredItems.length && !loading && (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <p>No store items or spare parts found</p>
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* --- MODAL 1: BOOK SERVICE APPOINTMENT --- */}
      {/* ========================================================================= */}
      {showAppointmentModal && (
        <div className="modal-overlay" style={{ zIndex: 999 }}>
          <div className="modal-card" style={{ maxWidth: 580 }}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Calendar size={20} style={{ color: "var(--accent)" }} />
                <h2 className="modal-title">Book Service Appointment</h2>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAppointmentModal(false)}>✕</button>
            </div>

            <form onSubmit={handleBookAppointment}>
              {/* Selected Services Summary with Delete Option */}
              <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 14, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Selected Services ({selectedServices.length})
                  </span>
                  {selectedServices.length > 0 && (
                    <button
                      type="button"
                      onClick={() => { setSelectedServices([]); toast("Cleared all selected services"); }}
                      style={{ background: "none", border: "none", color: "var(--red, #ef4444)", fontSize: 11, cursor: "pointer", fontWeight: 600 }}
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {selectedServices.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 160, overflowY: "auto", paddingRight: 4 }}>
                    {selectedServices.map(s => (
                      <div
                        key={s.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "8px 10px",
                          borderRadius: 6,
                          background: "var(--bg-card)",
                          border: "1px solid var(--border)",
                          gap: 10
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {s.name}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>
                            {s.service_code || "SRV-GEN"} · {s.bay_type || "General Bay"}
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                          <span style={{ color: "var(--accent)", fontWeight: 700, fontSize: 13 }}>
                            {fmt(s.base_price)}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedServices(prev => prev.filter(item => item.id !== s.id));
                              toast(`Removed "${s.name}" from booking`);
                            }}
                            style={{
                              width: 26, height: 26, borderRadius: 6, border: "1px solid rgba(239, 68, 68, 0.3)",
                              background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", display: "flex",
                              alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0
                            }}
                            title="Remove this service"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: "12px", textAlign: "center", color: "var(--text-muted)", fontSize: 12, background: "var(--bg-card)", borderRadius: 6 }}>
                    No services selected yet. Select a service below to proceed.
                  </div>
                )}

                {/* Quick Add Another Service Dropdown */}
                <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
                  <select
                    className="form-control"
                    style={{ fontSize: 12, padding: "6px 10px", flex: 1 }}
                    onChange={e => {
                      if (!e.target.value) return;
                      const srvToAdd = services.find(s => String(s.id) === e.target.value);
                      if (srvToAdd && !selectedServices.some(s => s.id === srvToAdd.id)) {
                        setSelectedServices(prev => [...prev, srvToAdd]);
                        toast.success(`Added "${srvToAdd.name}"`);
                      }
                      e.target.value = "";
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>+ Add another service to appointment...</option>
                    {services
                      .filter(s => !selectedServices.some(sel => sel.id === s.id))
                      .map(s => (
                        <option key={s.id} value={s.id}>
                          + {s.name} ({fmt(s.base_price)})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Total Estimated Cost */}
                {selectedServices.length > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingTop: 8, borderTop: "1px dashed var(--border)", fontSize: 13 }}>
                    <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>Total Estimated Cost:</span>
                    <strong style={{ fontSize: 15, color: "var(--accent)" }}>
                      {fmt(selectedServices.reduce((sum, s) => sum + parseFloat(s.base_price || 0), 0))}
                    </strong>
                  </div>
                )}
              </div>

              {/* Vehicle Selection */}
              <div className="form-group mb-16">
                <label className="form-label">Vehicle for Service</label>
                {vehicles.length > 0 && !isNewVehicle ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <select
                      className="form-control"
                      value={appointmentVehicleId}
                      onChange={e => setAppointmentVehicleId(e.target.value)}
                      required
                    >
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.make} {v.model} ({v.license_plate}) - {v.year}
                        </option>
                      ))}
                    </select>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      Need to book for another vehicle?{" "}
                      <span className="text-accent" style={{ cursor: "pointer", fontWeight: 600 }} onClick={() => setIsNewVehicle(true)}>
                        + Enter new vehicle details
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, background: "var(--bg-surface)", padding: 12, borderRadius: 8, border: "1px solid var(--border)" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <input className="form-control" placeholder="License Plate (WP CA-1234)" value={newVehicle.license_plate} onChange={e => setNewVehicle(v => ({ ...v, license_plate: e.target.value }))} required />
                      <input className="form-control" placeholder="Make (e.g. Toyota)" value={newVehicle.make} onChange={e => setNewVehicle(v => ({ ...v, make: e.target.value }))} required />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <input className="form-control" placeholder="Model (e.g. Premio)" value={newVehicle.model} onChange={e => setNewVehicle(v => ({ ...v, model: e.target.value }))} required />
                      <input className="form-control" type="number" placeholder="Year" value={newVehicle.year} onChange={e => setNewVehicle(v => ({ ...v, year: e.target.value }))} />
                    </div>
                    {vehicles.length > 0 && (
                      <span className="text-accent" style={{ cursor: "pointer", fontSize: 12, fontWeight: 600 }} onClick={() => setIsNewVehicle(false)}>
                        ← Select from registered vehicles
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Preferred Date & Time */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label">Preferred Date</label>
                  <input
                    type="date"
                    className="form-control"
                    min={new Date().toISOString().split("T")[0]}
                    value={preferredDate}
                    onChange={e => setPreferredDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Preferred Time Slot</label>
                  <select
                    className="form-control"
                    value={preferredTime}
                    onChange={e => setPreferredTime(e.target.value)}
                  >
                    <option value="Morning (08:30 AM - 12:00 PM)">Morning (08:30 AM - 12:00 PM)</option>
                    <option value="Afternoon (01:00 PM - 05:00 PM)">Afternoon (01:00 PM - 05:00 PM)</option>
                  </select>
                </div>
              </div>

              {/* Quick Symptom Chips for Non-Technical Users */}
              <div style={{ marginBottom: 14 }}>
                <label className="form-label" style={{ fontSize: 12, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                  <Sparkles size={13} style={{ color: "var(--accent)" }} /> Quick Issue / Symptom Selector (Click to add symptoms):
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {[
                    "🔊 Strange noise or vibration",
                    "⚠️ Dashboard warning indicator light is ON",
                    "🛑 Soft brakes or vehicle pulls to side",
                    "❄️ A/C is not cooling properly",
                    "⚙️ Hard gear shifting or clutch issue",
                    "🛢️ Periodic oil & filter service",
                    "🔍 Full bumper-to-bumper vehicle inspection"
                  ].map((chipText, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setAppointmentNotes(prev => prev ? `${prev} | ${chipText}` : chipText);
                        toast.success("Added symptom to notes!");
                      }}
                      style={{
                        padding: "5px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                        background: "var(--bg-surface)", border: "1px solid var(--border)",
                        color: "var(--text-secondary)", cursor: "pointer", transition: "all 0.15s"
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                    >
                      + {chipText}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="form-group mb-16">
                <label className="form-label">Additional Issue Description / Notes</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Describe any specific noises, symptoms, or requests for the Service Advisor..."
                  value={appointmentNotes}
                  onChange={e => setAppointmentNotes(e.target.value)}
                />
              </div>

              {/* Payment Option Card */}
              <div style={{
                background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10,
                padding: 14, marginBottom: 20
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6, color: "var(--text-primary)" }}>
                    <CreditCard size={16} style={{ color: "var(--accent)" }} /> Payment Option
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>
                    Amount: {fmt(selectedServices.reduce((sum, s) => sum + parseFloat(s.base_price || 0), 0))}
                  </span>
                </div>

                {/* Switch between Pay at Workshop vs Pay Online Now */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: aptPayNow ? 12 : 0 }}>
                  <button
                    type="button"
                    onClick={() => setAptPayNow(false)}
                    style={{
                      padding: "8px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                      background: !aptPayNow ? "rgba(245,158,11,0.15)" : "var(--bg-card)",
                      border: `1px solid ${!aptPayNow ? "var(--accent)" : "var(--border)"}`,
                      color: !aptPayNow ? "var(--accent)" : "var(--text-secondary)",
                      cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, textAlign: "center"
                    }}
                  >
                    <span>🏢 Pay at Workshop</span>
                    <span style={{ fontSize: 10, opacity: 0.8 }}>Cash/card upon arrival</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAptPayNow(true)}
                    style={{
                      padding: "8px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                      background: aptPayNow ? "rgba(16,185,129,0.15)" : "var(--bg-card)",
                      border: `1px solid ${aptPayNow ? "var(--green)" : "var(--border)"}`,
                      color: aptPayNow ? "var(--green)" : "var(--text-secondary)",
                      cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, textAlign: "center"
                    }}
                  >
                    <span>💳 Pay Online Now</span>
                    <span style={{ fontSize: 10, opacity: 0.8 }}>Instant confirmed receipt</span>
                  </button>
                </div>

                {/* Online Payment Details when Pay Online is active */}
                {aptPayNow && (
                  <div style={{
                    marginTop: 12, paddingTop: 12, borderTop: "1px dashed var(--border)",
                    display: "flex", flexDirection: "column", gap: 10
                  }}>
                    <div style={{ display: "flex", gap: 14 }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
                        <input
                          type="radio"
                          name="aptPaymentMethod"
                          value="card"
                          checked={aptPaymentMethod === "card"}
                          onChange={() => setAptPaymentMethod("card")}
                        />
                        💳 Card Payment
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
                        <input
                          type="radio"
                          name="aptPaymentMethod"
                          value="bank_transfer"
                          checked={aptPaymentMethod === "bank_transfer"}
                          onChange={() => setAptPaymentMethod("bank_transfer")}
                        />
                        🏦 Bank Transfer
                      </label>
                    </div>

                    {aptPaymentMethod === "card" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, background: "var(--bg-card)", padding: 12, borderRadius: 8, border: "1px solid var(--border)" }}>
                        <div>
                          <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 3 }}>Card Number</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="4532 8900 1234 5678"
                            value={aptCardData.number}
                            onChange={e => setAptCardData(c => ({ ...c, number: e.target.value }))}
                            style={{ fontSize: 12 }}
                            required={aptPayNow}
                          />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          <div>
                            <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 3 }}>Expiry Date</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="MM/YY"
                              value={aptCardData.expiry}
                              onChange={e => setAptCardData(c => ({ ...c, expiry: e.target.value }))}
                              style={{ fontSize: 12 }}
                              required={aptPayNow}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 3 }}>CVC / CVV</label>
                            <input
                              type="password"
                              maxLength={4}
                              className="form-control"
                              placeholder="•••"
                              value={aptCardData.cvc}
                              onChange={e => setAptCardData(c => ({ ...c, cvc: e.target.value }))}
                              style={{ fontSize: 12 }}
                              required={aptPayNow}
                            />
                          </div>
                        </div>
                        <div>
                          <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 3 }}>Cardholder Name</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Name on card"
                            value={aptCardData.name}
                            onChange={e => setAptCardData(c => ({ ...c, name: e.target.value }))}
                            style={{ fontSize: 12 }}
                            required={aptPayNow}
                          />
                        </div>
                      </div>
                    )}

                    {aptPaymentMethod === "bank_transfer" && (
                      <div style={{ background: "var(--bg-card)", padding: 12, borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }}>
                        <div style={{ fontWeight: 700, color: "var(--accent)", marginBottom: 4 }}>🏦 Bank Deposit / Transfer Details:</div>
                        <div style={{ color: "var(--text-secondary)" }}>Bank: <strong>Commercial Bank PLC</strong></div>
                        <div style={{ color: "var(--text-secondary)" }}>Account: <strong>1000 4589 2310 (PitStop Performance)</strong></div>
                        <div style={{ color: "var(--text-secondary)" }}>Branch: <strong>Maharagama (042)</strong></div>
                        <div style={{ fontSize: 11, color: "var(--green)", marginTop: 6 }}>
                          ✓ Your appointment and verified receipt will be generated automatically upon checkout.
                        </div>
                      </div>
                    )}

                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-muted)" }}>
                      <ShieldCheck size={14} style={{ color: "var(--green)" }} />
                      <span>256-bit Secure Encrypted Checkout · Instant Verified Receipt</span>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAppointmentModal(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={bookingLoading}
                  style={aptPayNow ? { background: "linear-gradient(135deg, #10b981, #059669)", borderColor: "#059669" } : {}}
                >
                  {bookingLoading
                    ? (aptPayNow ? "Processing Payment..." : "Booking...")
                    : aptPayNow
                    ? `Pay ${fmt(selectedServices.reduce((sum, s) => sum + parseFloat(s.base_price || 0), 0))} & Book Now 🔒`
                    : "Confirm & Book Appointment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* --- MODAL 2: INSTANT STORE PARTS DIRECT CHECKOUT --- */}
      {/* ========================================================================= */}
      {showDirectBuyModal && (
        <div className="modal-overlay" style={{ zIndex: 999 }}>
          <div className="modal-card" style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CreditCard size={20} style={{ color: "#2563eb" }} />
                <h2 className="modal-title">Direct Purchase Checkout</h2>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowDirectBuyModal(false)}>✕</button>
            </div>

            <form onSubmit={handleDirectBuySubmit}>
              {/* Order Items Table */}
              <div style={{ maxHeight: 200, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 8, padding: 10, marginBottom: 16 }}>
                {directCartItemsList.map(({ item, qty }) => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--border-light)" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{fmt(item.unit_price)} × {qty} {item.unit}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{fmt(item.unit_price * qty)}</span>
                      <button type="button" onClick={() => deleteItemFromCart(item.id)} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer" }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Calculation */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "rgba(37,99,235,0.08)", borderRadius: 8, marginBottom: 16 }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>Total Amount to Pay:</span>
                <span style={{ fontWeight: 900, fontSize: 18, color: "#2563eb" }}>{fmt(directCartTotal)}</span>
              </div>

              {/* Payment Method Selector */}
              <div className="form-group mb-20">
                <label className="form-label">Select Payment Method</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  {[
                    { id: "card", label: "Credit/Debit Card", icon: CreditCard },
                    { id: "cash", label: "Cash on Counter", icon: Banknote },
                    { id: "bank_transfer", label: "Bank Transfer", icon: Building2 },
                  ].map(pm => {
                    const Icon = pm.icon;
                    const isSel = paymentMethod === pm.id;
                    return (
                      <div
                        key={pm.id}
                        onClick={() => setPaymentMethod(pm.id)}
                        style={{
                          border: `1px solid ${isSel ? "#2563eb" : "var(--border)"}`,
                          background: isSel ? "rgba(37,99,235,0.1)" : "var(--bg-surface)",
                          borderRadius: 8, padding: "10px 8px", textAlign: "center", cursor: "pointer",
                          transition: "0.2s"
                        }}
                      >
                        <Icon size={18} style={{ color: isSel ? "#2563eb" : "var(--text-muted)", margin: "0 auto 4px auto" }} />
                        <div style={{ fontSize: 11, fontWeight: 700, color: isSel ? "#2563eb" : "var(--text-primary)" }}>{pm.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowDirectBuyModal(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={purchasingLoading}
                  style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
                >
                  {purchasingLoading ? "Processing..." : `Pay & Get Invoice (${fmt(directCartTotal)})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
