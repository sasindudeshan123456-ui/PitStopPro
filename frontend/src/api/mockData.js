// Mock Data for offline/Vercel fallback when local backend is unreachable

export const mockUsers = [
  { id: 1, name: "Workshop Manager", email: "manager@pitstoppro.lk", role: "manager", phone: "0771234001", is_active: 1 },
  { id: 2, name: "Service Advisor", email: "advisor@pitstoppro.lk", role: "advisor", phone: "0771234002", is_active: 1 },
  { id: 3, name: "Workshop Supervisor", email: "supervisor@pitstoppro.lk", role: "supervisor", phone: "0771234003", is_active: 1 },
  { id: 4, name: "Senior Technician", email: "technician@pitstoppro.lk", role: "technician", phone: "0771234004", is_active: 1 },
  { id: 5, name: "Inventory Storekeeper", email: "storekeeper@pitstoppro.lk", role: "storekeeper", phone: "0771234005", is_active: 1 },
  { id: 6, name: "Billing Cashier", email: "cashier@pitstoppro.lk", role: "cashier", phone: "0771234006", is_active: 1 },
  { id: 7, name: "Sasindu Deshan", email: "sasindu@gmail.com", role: "customer", phone: "0760840228", is_active: 1, customer_id: 1 },
  { id: 8, name: "Kelum Sampath", email: "kelumsampath@gmail.com", role: "customer", phone: "0912233789", is_active: 1, customer_id: 2 }
];

export const mockInventory = [
  { id: 1, item_code: "OIL-5W30-1L", name: "Engine Oil 5W-30 (1L)", category: "consumable", unit: "bottle", unit_price: 1850.00, quantity: 45, low_stock_threshold: 10, supplier: "Lanka Lubricants" },
  { id: 2, item_code: "FLT-OIL-001", name: "Oil Filter - Universal", category: "spare_part", unit: "piece", unit_price: 450.00, quantity: 4, low_stock_threshold: 10, supplier: "AutoParts Lanka" },
  { id: 3, item_code: "FLT-AIR-001", name: "Air Filter - Standard", category: "spare_part", unit: "piece", unit_price: 650.00, quantity: 18, low_stock_threshold: 5, supplier: "AutoParts Lanka" },
  { id: 4, item_code: "BRK-PAD-F001", name: "Front Brake Pads (set)", category: "spare_part", unit: "set", unit_price: 2800.00, quantity: 2, low_stock_threshold: 5, supplier: "Brake Masters" },
  { id: 5, item_code: "BRK-DSC-F001", name: "Front Brake Disc", category: "spare_part", unit: "piece", unit_price: 4500.00, quantity: 8, low_stock_threshold: 3, supplier: "Brake Masters" },
  { id: 6, item_code: "SPRK-NGK-B6S", name: "Spark Plug NGK B6S", category: "spare_part", unit: "piece", unit_price: 380.00, quantity: 35, low_stock_threshold: 8, supplier: "NGK Lanka" },
  { id: 7, item_code: "COOLANT-1L", name: "Coolant / Antifreeze (1L)", category: "consumable", unit: "bottle", unit_price: 750.00, quantity: 22, low_stock_threshold: 5, supplier: "Lanka Lubricants" }
];

export const mockJobCards = [
  {
    id: 1,
    job_number: "JOB-2026-001",
    vehicle_id: 1,
    customer_id: 1,
    advisor_id: 2,
    customer_name: "Sasindu Deshan",
    customer_phone: "0760840228",
    make: "Toyota",
    model: "Corolla Axio",
    license_plate: "CAB-1234",
    mileage: 45200,
    reported_issue: "Full engine tune-up, oil change and brake pad check",
    diagnosis_notes: "Engine oil dirty, front brake pads worn out.",
    estimated_cost: 12500.00,
    status: "in_progress",
    approval_required: 0,
    approval_status: "not_required",
    intake_date: new Date().toISOString()
  },
  {
    id: 2,
    job_number: "JOB-2026-002",
    vehicle_id: 2,
    customer_id: 2,
    advisor_id: 2,
    customer_name: "Kelum Sampath",
    customer_phone: "0771234567",
    make: "Honda",
    model: "Vezel Hybrid",
    license_plate: "WP CA-5678",
    mileage: 62000,
    reported_issue: "AC cooling issue & battery check",
    diagnosis_notes: "AC gas refill required, cabin filter replacement.",
    estimated_cost: 18500.00,
    status: "pending",
    approval_required: 1,
    approval_status: "pending",
    intake_date: new Date().toISOString()
  }
];

export const mockInvoices = [
  {
    id: 1,
    invoice_number: "INV-2026-001",
    job_card_id: 1,
    customer_id: 1,
    customer_name: "Sasindu Deshan",
    customer_phone: "0760840228",
    subtotal: 12500.00,
    discount_pct: 0,
    discount_amount: 0,
    tax_pct: 0,
    tax_amount: 0,
    total: 12500.00,
    status: "paid",
    created_at: new Date().toISOString(),
    items: [
      { id: 1, description: "Engine Oil 5W-30 (4L)", type: "part", quantity: 4, unit_price: 1850.00 },
      { id: 2, description: "Oil Filter", type: "part", quantity: 1, unit_price: 450.00 },
      { id: 3, description: "Full Service Labor", type: "labor", quantity: 1, unit_price: 4650.00 }
    ]
  }
];

export const mockAppointments = [
  {
    id: 1,
    customer_name: "Sasindu Deshan",
    phone: "0760840228",
    vehicle_no: "CAB-1234",
    make_model: "Toyota Corolla Axio",
    service_type: "Full Service & Oil Change",
    preferred_date: "2026-09-30",
    preferred_time: "09:00 AM",
    notes: "Please check front brake noise",
    status: "confirmed"
  }
];

export const mockManagerDashboard = {
  jobStats: { pending: 3, in_progress: 5, qc_check: 2, completed: 8, invoiced: 12 },
  revenueStats: { total_revenue: 145000.00, today_revenue: 28500.00, month_revenue: 145000.00 },
  pendingApprovals: [
    { id: 2, job_number: "JOB-2026-002", make: "Honda", model: "Vezel Hybrid", license_plate: "WP CA-5678", estimated_cost: 18500.00, reported_issue: "AC cooling issue & battery check" }
  ],
  inventorySummary: [
    { id: 2, item_code: "FLT-OIL-001", name: "Oil Filter - Universal", quantity: 4, low_stock_threshold: 10, unit: "piece", unit_price: 450.00 },
    { id: 4, item_code: "BRK-PAD-F001", name: "Front Brake Pads (set)", quantity: 2, low_stock_threshold: 5, unit: "set", unit_price: 2800.00 }
  ]
};

export function getMockResponse(url, method = "get", body = {}) {
  const cleanUrl = url.replace("/api", "");

  if (cleanUrl.startsWith("/auth/login")) {
    const emailInput = (body.email || body.username || "").toLowerCase().trim();
    const passwordInput = (body.password || "").trim();

    // Find exact user matching email
    let matchedUser = mockUsers.find(u => u.email.toLowerCase() === emailInput);
    
    // If not exact match, check role keywords
    if (!matchedUser) {
      if (emailInput.includes("manager")) matchedUser = mockUsers.find(u => u.role === "manager");
      else if (emailInput.includes("advisor")) matchedUser = mockUsers.find(u => u.role === "advisor");
      else if (emailInput.includes("supervisor")) matchedUser = mockUsers.find(u => u.role === "supervisor");
      else if (emailInput.includes("tech")) matchedUser = mockUsers.find(u => u.role === "technician");
      else if (emailInput.includes("store")) matchedUser = mockUsers.find(u => u.role === "storekeeper");
      else if (emailInput.includes("cashier")) matchedUser = mockUsers.find(u => u.role === "cashier");
      else if (emailInput.includes("kelum")) matchedUser = mockUsers.find(u => u.email === "kelumsampath@gmail.com");
      else if (emailInput.includes("sasindu")) matchedUser = mockUsers.find(u => u.email === "sasindu@gmail.com");
    }

    // If still no user found or password is provided and completely blank/invalid
    if (!matchedUser) {
      return { error: "Invalid email or password", status: 401 };
    }

    return {
      token: `demo_mock_jwt_token_${matchedUser.role}_2026`,
      user: {
        id: matchedUser.id,
        name: matchedUser.name,
        email: matchedUser.email,
        role: matchedUser.role,
        phone: matchedUser.phone,
        customer_id: matchedUser.customer_id || null
      }
    };
  }

  if (cleanUrl.startsWith("/auth/me")) {
    const storedUser = sessionStorage.getItem("psp_user") || localStorage.getItem("psp_user");
    return storedUser ? JSON.parse(storedUser) : mockUsers[0];
  }

  if (cleanUrl.startsWith("/manager/dashboard")) {
    return mockManagerDashboard;
  }

  if (cleanUrl.startsWith("/manager/staff") || cleanUrl.startsWith("/manager/users")) {
    return mockUsers;
  }

  if (cleanUrl.startsWith("/inventory")) {
    return mockInventory;
  }

  if (cleanUrl.startsWith("/job-cards")) {
    return mockJobCards;
  }

  if (cleanUrl.startsWith("/billing")) {
    return mockInvoices;
  }

  if (cleanUrl.startsWith("/appointments")) {
    return mockAppointments;
  }

  if (cleanUrl.startsWith("/customers")) {
    return [
      { id: 1, full_name: "Sasindu Deshan", email: "sasindu@gmail.com", phone: "0760840228", nic: "982345678V", address: "Colombo, Sri Lanka" },
      { id: 2, full_name: "Kelum Sampath", email: "kelumsampath@gmail.com", phone: "0912233789", nic: "200313000970", address: "66, Galle, Sri Lanka" }
    ];
  }

  if (cleanUrl.startsWith("/notifications")) {
    return [
      { id: 1, title: "Low Stock Alert", message: "Oil Filter stock is below minimum threshold (4 left).", created_at: new Date().toISOString() },
      { id: 2, title: "New Job Card", message: "Job JOB-2026-001 created by Advisor.", created_at: new Date().toISOString() }
    ];
  }

  return [];
}
