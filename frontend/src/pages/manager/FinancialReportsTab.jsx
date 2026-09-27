import { useState, useEffect, useCallback, useMemo } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import {
  DollarSign, TrendingUp, Calendar, CreditCard, PieChart as PieIcon,
  Download, RefreshCw, ArrowUpRight, Search, FileSpreadsheet,
  Layers, CheckCircle2, Clock, CalendarDays, Filter
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip
} from "recharts";

const fmt = n => `LKR ${Number(n || 0).toLocaleString("en-LK", { minimumFractionDigits: 2 })}`;
const fmtShort = n => {
  const num = Number(n || 0);
  if (num >= 1000000) return `LKR ${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `LKR ${(num / 1000).toFixed(1)}k`;
  return `LKR ${num.toFixed(0)}`;
};

const PIE_COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899", "#06b6d4"];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "rgba(15, 23, 42, 0.95)",
        border: "1px solid rgba(255, 255, 255, 0.15)",
        padding: "10px 14px",
        borderRadius: 8,
        boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
        color: "#fff",
        fontSize: 12
      }}>
        <p style={{ fontWeight: 700, margin: "0 0 6px 0", color: "var(--accent, #f59e0b)" }}>{label}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ margin: "2px 0", color: entry.color || "#fff" }}>
            <span style={{ color: "#94a3b8" }}>{entry.name}: </span>
            <strong>{typeof entry.value === "number" && entry.name.toLowerCase().includes("revenue") ? fmt(entry.value) : entry.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function FinancialReportsTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all"); // "day" | "week" | "month" | "year" | "all"
  const [chartView, setChartView] = useState("day"); // "day" | "week" | "month" | "year"

  const loadReport = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/manager/financial-report");
      setData(res.data);
    } catch {
      toast.error("Failed to load financial report");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const summary = data?.summary || {};
  const dailyRevenue = data?.dailyRevenue || [];
  const weeklyRevenue = data?.weeklyRevenue || [];
  const monthlyRevenue = data?.monthlyRevenue || [];
  const yearlyRevenue = data?.yearlyRevenue || [];
  const categoryBreakdown = data?.categoryBreakdown || [];
  const paymentMethods = data?.paymentMethods || [];
  const topItems = data?.topItems || [];
  const recentInvoices = data?.recentInvoices || [];

  // Filter invoices based on search, status, and period (day, week, month, year)
  const filteredInvoices = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    
    // Start of week (Monday)
    const currentDay = now.getDay();
    const diffToMonday = (currentDay === 0 ? -6 : 1) - currentDay;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() + diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return recentInvoices.filter(inv => {
      const matchSearch =
        !search ||
        inv.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
        inv.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
        inv.job_number?.toLowerCase().includes(search.toLowerCase()) ||
        inv.license_plate?.toLowerCase().includes(search.toLowerCase());
      
      const matchStatus = statusFilter === "all" || inv.status === statusFilter;

      let matchPeriod = true;
      if (periodFilter !== "all" && inv.created_at) {
        const invDate = new Date(inv.created_at);
        if (periodFilter === "day") {
          matchPeriod = inv.created_at.slice(0, 10) === todayStr;
        } else if (periodFilter === "week") {
          matchPeriod = invDate >= startOfWeek;
        } else if (periodFilter === "month") {
          matchPeriod = invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
        } else if (periodFilter === "year") {
          matchPeriod = invDate.getFullYear() === currentYear;
        }
      }

      return matchSearch && matchStatus && matchPeriod;
    });
  }, [recentInvoices, search, statusFilter, periodFilter]);

  // Dynamic values depending on active period filter
  const currentPeriodStats = useMemo(() => {
    if (periodFilter === "day") {
      return {
        label: "Today's Revenue (Day)",
        revenue: summary.today_revenue,
        count: summary.today_invoices,
        subtext: "Filtered for Today only"
      };
    } else if (periodFilter === "week") {
      return {
        label: "This Week's Revenue (Week)",
        revenue: summary.week_revenue,
        count: summary.week_invoices,
        subtext: "Filtered for current week (Mon-Sun)"
      };
    } else if (periodFilter === "month") {
      return {
        label: "This Month's Revenue (Month)",
        revenue: summary.month_revenue,
        count: summary.month_invoices,
        subtext: "Filtered for current calendar month"
      };
    } else if (periodFilter === "year") {
      return {
        label: "This Year's Revenue (Year)",
        revenue: summary.year_revenue,
        count: summary.year_invoices,
        subtext: "Filtered for current year"
      };
    }
    return {
      label: "Total Gross Revenue (All Time)",
      revenue: summary.total_revenue,
      count: summary.total_invoices,
      subtext: "All historical invoices"
    };
  }, [periodFilter, summary]);

  // Export full detailed Financial Report CSV
  const exportDetailedCSV = () => {
    if (!filteredInvoices.length) {
      toast.error("No invoices data to export for selected filter");
      return;
    }
    const headers = [
      "Invoice #", "Job #", "Customer Name", "Customer Email",
      "Vehicle", "Plate #", "Subtotal (LKR)", "Discount (LKR)",
      "Tax (LKR)", "Total (LKR)", "Payment Method", "Status", "Date"
    ];
    const rows = filteredInvoices.map(i => [
      i.invoice_number,
      i.job_number || "N/A",
      `"${i.customer_name || ""}"`,
      i.customer_email || "",
      `"${(i.make || "") + " " + (i.model || "")}"`,
      i.license_plate || "",
      Number(i.subtotal || 0).toFixed(2),
      Number(i.discount_amount || 0).toFixed(2),
      Number(i.tax_amount || 0).toFixed(2),
      Number(i.total || 0).toFixed(2),
      i.payment_method || "N/A",
      i.status,
      new Date(i.created_at).toISOString().slice(0, 19).replace("T", " ")
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `PitStopPro_Financial_Report_${periodFilter}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Financial Ledger downloaded!");
  };

  const totalCatAmount = categoryBreakdown.reduce((sum, c) => sum + Number(c.amount || 0), 0);
  const pieCategoryData = categoryBreakdown.map(c => ({
    name: c.type === "labor" ? "Labor Services" : c.type === "part" ? "Spare Parts & Oil" : "Other / Supplies",
    value: Number(c.amount || 0),
    count: c.count
  }));

  const piePaymentData = paymentMethods.map(p => ({
    name: p.method === "cash" ? "Cash" : p.method === "card" ? "Credit / Debit Card" : "Bank Transfer",
    value: Number(p.amount || 0),
    count: p.count
  }));

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <RefreshCw size={28} className="spin" style={{ color: "var(--accent, #f59e0b)", marginBottom: 12 }} />
        <p style={{ color: "var(--text-muted)" }}>Loading financial analytics & charts...</p>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Top Header & Global Period Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <DollarSign style={{ color: "var(--accent, #f59e0b)" }} /> Financial Reports & Revenue Analytics
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: 13, margin: "4px 0 0 0" }}>
            Track workshop earnings across Day, Week, Month & Year
          </p>
        </div>

        {/* Global Period Filter: Day, Week, Monthly, Year, All */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div style={{
            display: "flex",
            background: "var(--bg-surface)",
            padding: 4,
            borderRadius: 10,
            border: "1px solid var(--border)",
            gap: 4
          }}>
            {[
              { key: "day", label: "Day (Today)" },
              { key: "week", label: "Week" },
              { key: "month", label: "Monthly" },
              { key: "year", label: "Year" },
              { key: "all", label: "All Time" }
            ].map(p => (
              <button
                key={p.key}
                onClick={() => {
                  setPeriodFilter(p.key);
                  if (["day", "week", "month", "year"].includes(p.key)) {
                    setChartView(p.key);
                  }
                }}
                className={`btn btn-sm ${periodFilter === p.key ? "btn-primary" : "btn-secondary"}`}
                style={{ padding: "6px 12px", fontSize: 12, fontWeight: periodFilter === p.key ? 700 : 500 }}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button className="btn btn-secondary btn-sm" onClick={loadReport} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="btn btn-primary btn-sm" onClick={exportDetailedCSV} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <FileSpreadsheet size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16 }}>
        {/* Active Period Highlight Card */}
        <div className="stat-card" style={{ borderLeft: "4px solid var(--accent, #f59e0b)" }}>
          <div className="stat-glow" style={{ background: "rgba(245, 158, 11, 0.2)" }}></div>
          <div className="stat-icon" style={{ background: "rgba(245, 158, 11, 0.2)" }}>
            <TrendingUp size={22} style={{ color: "var(--accent, #f59e0b)" }} />
          </div>
          <div className="stat-value">{fmt(currentPeriodStats.revenue)}</div>
          <div className="stat-label">{currentPeriodStats.label} ({currentPeriodStats.count || 0} bills)</div>
        </div>

        <div className="stat-card">
          <div className="stat-glow" style={{ background: "rgba(16, 185, 129, 0.15)" }}></div>
          <div className="stat-icon" style={{ background: "rgba(16, 185, 129, 0.15)" }}>
            <CheckCircle2 size={22} style={{ color: "#10b981" }} />
          </div>
          <div className="stat-value" style={{ color: "#10b981" }}>{fmt(summary.paid_revenue)}</div>
          <div className="stat-label">Collected / Paid ({summary.paid_invoices} invoices)</div>
        </div>

        <div className="stat-card">
          <div className="stat-glow" style={{ background: "rgba(239, 68, 68, 0.15)" }}></div>
          <div className="stat-icon" style={{ background: "rgba(239, 68, 68, 0.15)" }}>
            <Clock size={22} style={{ color: "#ef4444" }} />
          </div>
          <div className="stat-value" style={{ color: "#ef4444" }}>{fmt(summary.pending_revenue)}</div>
          <div className="stat-label">Pending / Unpaid ({summary.pending_invoices} invoices)</div>
        </div>

        <div className="stat-card">
          <div className="stat-glow" style={{ background: "rgba(59, 130, 246, 0.15)" }}></div>
          <div className="stat-icon" style={{ background: "rgba(59, 130, 246, 0.15)" }}>
            <Calendar size={22} style={{ color: "#3b82f6" }} />
          </div>
          <div className="stat-value">{fmt(summary.month_revenue)}</div>
          <div className="stat-label">This Month's Revenue</div>
        </div>

        <div className="stat-card">
          <div className="stat-glow" style={{ background: "rgba(139, 92, 246, 0.15)" }}></div>
          <div className="stat-icon" style={{ background: "rgba(139, 92, 246, 0.15)" }}>
            <DollarSign size={22} style={{ color: "#8b5cf6" }} />
          </div>
          <div className="stat-value">{fmt(summary.avg_invoice_value)}</div>
          <div className="stat-label">Avg. Invoice Ticket</div>
        </div>

        <div className="stat-card">
          <div className="stat-glow" style={{ background: "rgba(6, 182, 212, 0.15)" }}></div>
          <div className="stat-icon" style={{ background: "rgba(6, 182, 212, 0.15)" }}>
            <Layers size={22} style={{ color: "#06b6d4" }} />
          </div>
          <div className="stat-value">{fmt(summary.year_revenue)}</div>
          <div className="stat-label">This Year's Total ({summary.year_invoices || 0} bills)</div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: 20 }}>
        {/* Revenue Trends Chart with Day / Week / Monthly / Year switcher */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>📈 Revenue Analytics by Period</h3>
              <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0 0 0" }}>
                {chartView === "day" && "Daily revenue progression (Last 14 Days)"}
                {chartView === "week" && "Weekly revenue performance (Last 8 Weeks)"}
                {chartView === "month" && "Monthly revenue trend (Last 12 Months)"}
                {chartView === "year" && "Year-over-Year revenue comparison"}
              </p>
            </div>

            {/* Timeframe View Switcher */}
            <div style={{ display: "flex", gap: 4, background: "var(--bg-surface)", padding: 4, borderRadius: 8, border: "1px solid var(--border)" }}>
              {[
                { key: "day", label: "Day" },
                { key: "week", label: "Week" },
                { key: "month", label: "Monthly" },
                { key: "year", label: "Year" }
              ].map(t => (
                <button
                  key={t.key}
                  className={`btn btn-sm ${chartView === t.key ? "btn-primary" : "btn-secondary"}`}
                  style={{ padding: "4px 10px", fontSize: 11, fontWeight: chartView === t.key ? 700 : 500 }}
                  onClick={() => setChartView(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ width: "100%", height: 280 }}>
            {chartView === "day" && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyRevenue} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={fmtShort} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Daily Revenue"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#revenueGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {chartView === "week" && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyRevenue.length ? weeklyRevenue : [{ label: "This Week", revenue: Number(summary.week_revenue || 0) }]} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={fmtShort} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" name="Weekly Revenue" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}

            {chartView === "month" && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRevenue.length ? monthlyRevenue : [{ label: "Current Month", revenue: Number(summary.month_revenue || 0) }]} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={fmtShort} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" name="Monthly Revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}

            {chartView === "year" && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearlyRevenue.length ? yearlyRevenue : [{ label: new Date().getFullYear().toString(), revenue: Number(summary.year_revenue || 0) }]} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={fmtShort} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" name="Yearly Revenue" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Revenue Breakdown (Service vs Materials/Parts) */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
              <PieIcon size={16} style={{ color: "#3b82f6" }} /> Revenue by Service vs Materials (Parts & Oil)
            </h3>
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0 0 0" }}>
              Contribution of labor services compared to parts & lubricants
            </p>
          </div>

          {pieCategoryData.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
              No categorized invoice items recorded yet.
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
              <div style={{ width: "100%", maxWidth: 220, height: 240, margin: "0 auto" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieCategoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend & Breakdown List */}
              <div style={{ flex: 1, minWidth: 200, display: "flex", flexDirection: "column", gap: 10 }}>
                {pieCategoryData.map((item, idx) => {
                  const pct = totalCatAmount > 0 ? ((item.value / totalCatAmount) * 100).toFixed(1) : 0;
                  const color = PIE_COLORS[idx % PIE_COLORS.length];
                  return (
                    <div key={item.name} style={{ background: "var(--bg-surface)", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ width: 10, height: 10, borderRadius: "50%", background: color }}></span>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</span>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 13, color }}>{pct}%</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)" }}>
                        <span>{item.count} items billed</span>
                        <span>{fmt(item.value)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Secondary Row: Payment Methods & Top Performing Items */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 20 }}>
        {/* Payment Methods */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px 0", display: "flex", alignItems: "center", gap: 6 }}>
            <CreditCard size={16} style={{ color: "#10b981" }} /> Payment Channels & Settlement
          </h3>
          {piePaymentData.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 0", color: "var(--text-muted)" }}>
              No payments recorded yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {piePaymentData.map((p, idx) => {
                const totalPaid = piePaymentData.reduce((s, x) => s + x.value, 0);
                const pct = totalPaid > 0 ? ((p.value / totalPaid) * 100).toFixed(1) : 0;
                return (
                  <div key={p.name} style={{ background: "var(--bg-surface)", padding: "12px 14px", borderRadius: 8, border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</span>
                      <span style={{ fontWeight: 700, color: "#10b981" }}>{fmt(p.value)}</span>
                    </div>
                    <div style={{ width: "100%", height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: "#10b981", borderRadius: 3 }}></div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                      <span>{p.count} transactions</span>
                      <span>{pct}% of paid revenue</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Services & Materials */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px 0", display: "flex", alignItems: "center", gap: 6 }}>
            <ArrowUpRight size={16} style={{ color: "var(--accent, #f59e0b)" }} /> Top Revenue Generating Items
          </h3>
          {topItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 0", color: "var(--text-muted)" }}>
              No service or material items sold yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {topItems.map((item, idx) => (
                <div key={idx} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  background: "var(--bg-surface)", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)"
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{item.description}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                      <span className={`badge ${item.type === "labor" ? "badge-pending" : "badge-in_progress"}`} style={{ fontSize: 10, padding: "1px 6px" }}>
                        {item.type === "labor" ? "Labor Service" : "Part / Material"}
                      </span>
                      <span style={{ marginLeft: 8 }}>Qty: {item.total_quantity}</span>
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "var(--accent, #f59e0b)" }}>
                    {fmt(item.total_revenue)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Invoices & Transactions Ledger Table */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: "wrap", gap: 12 }}>
          <div>
            <h3 className="card-title">📜 Invoices & Financial Ledger</h3>
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0 0 0" }}>
              Showing {filteredInvoices.length} invoices for active period filter: <strong style={{ color: "var(--accent, #f59e0b)", textTransform: "capitalize" }}>{periodFilter}</strong>
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <div className="search-bar">
              <Search className="search-icon" size={15} />
              <input
                className="form-control"
                style={{ width: 220 }}
                placeholder="Search invoice #, customer..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              className="form-control"
              style={{ width: 120 }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="issued">Issued</option>
              <option value="draft">Draft</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="empty-state" style={{ padding: "40px 20px" }}>
            <div className="empty-icon">📂</div>
            <p>No invoices found for the selected {periodFilter} filter.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Job #</th>
                  <th>Customer</th>
                  <th>Vehicle</th>
                  <th>Subtotal</th>
                  <th>Discount</th>
                  <th>Tax</th>
                  <th>Total Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map(inv => (
                  <tr key={inv.id}>
                    <td>
                      <strong style={{ color: "var(--accent, #f59e0b)" }}>{inv.invoice_number}</strong>
                    </td>
                    <td>
                      <span className="chip">{inv.job_number || "N/A"}</span>
                    </td>
                    <td>
                      <div>{inv.customer_name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{inv.customer_email}</div>
                    </td>
                    <td>
                      <div>{inv.make} {inv.model}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{inv.license_plate}</div>
                    </td>
                    <td>{fmt(inv.subtotal)}</td>
                    <td style={{ color: Number(inv.discount_amount) > 0 ? "var(--red, #ef4444)" : "var(--text-muted)" }}>
                      {Number(inv.discount_amount) > 0 ? `-${fmt(inv.discount_amount)}` : "LKR 0.00"}
                    </td>
                    <td>{fmt(inv.tax_amount)}</td>
                    <td>
                      <strong style={{ color: inv.status === "paid" ? "#10b981" : "var(--text-primary)" }}>
                        {fmt(inv.total)}
                      </strong>
                    </td>
                    <td>
                      <span style={{ textTransform: "capitalize", fontSize: 12 }}>
                        {inv.payment_method ? inv.payment_method.replace("_", " ") : "Pending"}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${inv.status}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {new Date(inv.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
