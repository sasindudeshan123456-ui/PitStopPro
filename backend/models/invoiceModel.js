const db = require("../config/db");

const genInvoiceNumber = () => {
  const d = new Date();
  return `INV-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}-${Date.now().toString().slice(-5)}`;
};

const create = async ({ job_card_id, customer_id, subtotal, discount_pct, tax_pct, created_by, discount_authorized_by }) => {
  const invoice_number = genInvoiceNumber();
  const discount_amount = subtotal * (discount_pct / 100);
  const tax_amount = (subtotal - discount_amount) * (tax_pct / 100);
  const total = subtotal - discount_amount + tax_amount;
  const [r] = await db.query(
    `INSERT INTO invoices (invoice_number, job_card_id, customer_id, subtotal, discount_pct, discount_amount, tax_pct, tax_amount, total, discount_authorized_by, created_by)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [invoice_number, job_card_id, customer_id, subtotal, discount_pct||0, discount_amount, tax_pct||0, tax_amount, total, discount_authorized_by||null, created_by]);
  return { id: r.insertId, invoice_number };
};

const addItem = async (invoice_id, { description, type, quantity, unit_price }) => {
  await db.query("INSERT INTO invoice_items (invoice_id, description, type, quantity, unit_price) VALUES (?,?,?,?,?)",
    [invoice_id, description, type||"other", quantity||1, unit_price]);
};

const findById = async (id) => {
  const [rows] = await db.query(
    `SELECT inv.*, u.full_name AS customer_name, u.email AS customer_email, u.phone AS customer_phone,
            jc.job_number, v.license_plate, v.make, v.model
     FROM invoices inv
     JOIN customers c ON c.id = inv.customer_id
     JOIN users u ON u.id = c.user_id
     LEFT JOIN job_cards jc ON jc.id = inv.job_card_id
     LEFT JOIN vehicles v ON v.id = jc.vehicle_id
     WHERE inv.id = ?`, [id]);
  return rows[0];
};

const getItems = async (invoice_id) => {
  const [rows] = await db.query("SELECT * FROM invoice_items WHERE invoice_id = ?", [invoice_id]);
  return rows;
};

const getAll = async () => {
  const [rows] = await db.query(
    `SELECT inv.*, u.full_name AS customer_name, u.phone AS customer_phone, u.email AS customer_email, jc.job_number
     FROM invoices inv
     JOIN customers c ON c.id = inv.customer_id
     JOIN users u ON u.id = c.user_id
     LEFT JOIN job_cards jc ON jc.id = inv.job_card_id
     ORDER BY inv.created_at DESC`);
  return rows;
};

const getByCustomer = async (customer_id) => {
  const [rows] = await db.query(
    `SELECT inv.*, jc.job_number, v.license_plate, v.make, v.model
     FROM invoices inv
     LEFT JOIN job_cards jc ON jc.id = inv.job_card_id
     LEFT JOIN vehicles v ON v.id = jc.vehicle_id
     WHERE inv.customer_id = ? ORDER BY inv.created_at DESC`, [customer_id]);
  return rows;
};

const getStoreOrders = async () => {
  const [rows] = await db.query(`
    SELECT inv.*,
           u.full_name AS customer_name,
           u.phone AS customer_phone,
           u.email AS customer_email,
           p.method AS payment_method,
           p.reference AS payment_ref,
           p.paid_at AS payment_date
    FROM invoices inv
    JOIN customers c ON c.id = inv.customer_id
    JOIN users u ON u.id = c.user_id
    LEFT JOIN payments p ON p.invoice_id = inv.id
    WHERE (inv.type = 'direct_sale' OR (inv.job_card_id IS NULL AND inv.type IS NULL) OR inv.type = 'store')
    ORDER BY inv.created_at DESC
  `);

  const enriched = await Promise.all(rows.map(async (order) => {
    const [items] = await db.query(
      "SELECT * FROM invoice_items WHERE invoice_id = ?",
      [order.id]
    );
    return { ...order, items };
  }));

  return enriched;
};

const updateStatus = async (id, status) => {
  await db.query("UPDATE invoices SET status = ? WHERE id = ?", [status, id]);
};

const recordPayment = async ({ invoice_id, amount, method, reference, received_by }) => {
  await db.query("INSERT INTO payments (invoice_id, amount, method, reference, received_by) VALUES (?,?,?,?,?)",
    [invoice_id, amount, method, reference||null, received_by]);
  await db.query("UPDATE invoices SET status = 'paid' WHERE id = ?", [invoice_id]);
};

const getRevenueStats = async () => {
  const [rows] = await db.query(`
    SELECT
      COALESCE(SUM(total), 0) AS total_revenue,
      COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() THEN total ELSE 0 END), 0) AS today_revenue,
      COALESCE(SUM(CASE WHEN MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW()) THEN total ELSE 0 END), 0) AS month_revenue,
      COUNT(*) AS total_invoices,
      COALESCE(SUM(status = "paid"), 0) AS paid_count
    FROM invoices WHERE status != "cancelled"`);
  return rows[0];
};

const getDetailedFinancialReport = async () => {
  // Summary
  const [[summary]] = await db.query(`
    SELECT
      COALESCE(SUM(total), 0) AS total_revenue,
      COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() THEN total ELSE 0 END), 0) AS today_revenue,
      COALESCE(SUM(CASE WHEN YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1) THEN total ELSE 0 END), 0) AS week_revenue,
      COALESCE(SUM(CASE WHEN MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW()) THEN total ELSE 0 END), 0) AS month_revenue,
      COALESCE(SUM(CASE WHEN YEAR(created_at) = YEAR(NOW()) THEN total ELSE 0 END), 0) AS year_revenue,
      COALESCE(SUM(subtotal), 0) AS total_subtotal,
      COALESCE(SUM(discount_amount), 0) AS total_discount,
      COALESCE(SUM(tax_amount), 0) AS total_tax,
      COALESCE(SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END), 0) AS paid_revenue,
      COALESCE(SUM(CASE WHEN status IN ('draft', 'issued') THEN total ELSE 0 END), 0) AS pending_revenue,
      COUNT(*) AS total_invoices,
      COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END), 0) AS today_invoices,
      COALESCE(SUM(CASE WHEN YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1) THEN 1 ELSE 0 END), 0) AS week_invoices,
      COALESCE(SUM(CASE WHEN MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW()) THEN 1 ELSE 0 END), 0) AS month_invoices,
      COALESCE(SUM(CASE WHEN YEAR(created_at) = YEAR(NOW()) THEN 1 ELSE 0 END), 0) AS year_invoices,
      COALESCE(SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END), 0) AS paid_invoices,
      COALESCE(SUM(CASE WHEN status IN ('draft', 'issued') THEN 1 ELSE 0 END), 0) AS pending_invoices,
      COALESCE(AVG(total), 0) AS avg_invoice_value
    FROM invoices
    WHERE status != 'cancelled'
  `);

  // Daily revenue for last 14 days
  const [dailyRows] = await db.query(`
    SELECT
      DATE_FORMAT(d.dt, '%Y-%m-%d') AS date,
      DATE_FORMAT(d.dt, '%d %b') AS label,
      COALESCE(SUM(i.total), 0) AS revenue,
      COUNT(i.id) AS count
    FROM (
      SELECT CURDATE() - INTERVAL (a.a + (10 * b.a)) DAY AS dt
      FROM (SELECT 0 AS a UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) AS a
      CROSS JOIN (SELECT 0 AS a UNION SELECT 1 UNION SELECT 2 UNION SELECT 3) AS b
      WHERE (a.a + (10 * b.a)) < 14
    ) d
    LEFT JOIN invoices i ON DATE(i.created_at) = d.dt AND i.status != 'cancelled'
    GROUP BY d.dt
    ORDER BY d.dt ASC
  `);

  // Weekly revenue for last 8 weeks
  const [weeklyRows] = await db.query(`
    SELECT
      YEARWEEK(created_at, 1) AS week_key,
      CONCAT('Wk ', WEEK(created_at, 1)) AS label,
      COALESCE(SUM(total), 0) AS revenue,
      COUNT(id) AS count
    FROM invoices
    WHERE status != 'cancelled' AND created_at >= DATE_SUB(NOW(), INTERVAL 8 WEEK)
    GROUP BY YEARWEEK(created_at, 1), CONCAT('Wk ', WEEK(created_at, 1))
    ORDER BY week_key ASC
  `);

  // Monthly revenue for last 12 months
  const [monthlyRows] = await db.query(`
    SELECT
      DATE_FORMAT(created_at, '%Y-%m') AS month_key,
      DATE_FORMAT(created_at, '%b %Y') AS label,
      COALESCE(SUM(total), 0) AS revenue,
      COUNT(id) AS count
    FROM invoices
    WHERE status != 'cancelled' AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
    GROUP BY DATE_FORMAT(created_at, '%Y-%m'), DATE_FORMAT(created_at, '%b %Y')
    ORDER BY month_key ASC
  `);

  // Yearly revenue
  const [yearlyRows] = await db.query(`
    SELECT
      YEAR(created_at) AS year_key,
      CAST(YEAR(created_at) AS CHAR) AS label,
      COALESCE(SUM(total), 0) AS revenue,
      COUNT(id) AS count
    FROM invoices
    WHERE status != 'cancelled'
    GROUP BY YEAR(created_at)
    ORDER BY year_key ASC
  `);

  // Category breakdown (labor vs part vs other)
  const [categoryRows] = await db.query(`
    SELECT
      ii.type,
      COALESCE(SUM(ii.quantity * ii.unit_price), 0) AS amount,
      COUNT(ii.id) AS count
    FROM invoice_items ii
    JOIN invoices inv ON inv.id = ii.invoice_id
    WHERE inv.status != 'cancelled'
    GROUP BY ii.type
  `);

  // Payment methods breakdown
  const [paymentRows] = await db.query(`
    SELECT
      p.method,
      COALESCE(SUM(p.amount), 0) AS amount,
      COUNT(p.id) AS count
    FROM payments p
    GROUP BY p.method
  `);

  // Top Items / Services
  const [topItems] = await db.query(`
    SELECT
      ii.description,
      ii.type,
      COALESCE(SUM(ii.quantity), 0) AS total_quantity,
      COALESCE(SUM(ii.quantity * ii.unit_price), 0) AS total_revenue
    FROM invoice_items ii
    JOIN invoices inv ON inv.id = ii.invoice_id
    WHERE inv.status != 'cancelled'
    GROUP BY ii.description, ii.type
    ORDER BY total_revenue DESC
    LIMIT 6
  `);

  // Recent Invoices list
  const [recentInvoices] = await db.query(`
    SELECT
      inv.id,
      inv.invoice_number,
      inv.type,
      inv.subtotal,
      inv.discount_amount,
      inv.tax_amount,
      inv.total,
      inv.status,
      inv.created_at,
      u.full_name AS customer_name,
      u.email AS customer_email,
      u.phone AS customer_phone,
      jc.job_number,
      v.license_plate,
      v.make,
      v.model,
      p.method AS payment_method
    FROM invoices inv
    JOIN customers c ON c.id = inv.customer_id
    JOIN users u ON u.id = c.user_id
    LEFT JOIN job_cards jc ON jc.id = inv.job_card_id
    LEFT JOIN vehicles v ON v.id = jc.vehicle_id
    LEFT JOIN payments p ON p.invoice_id = inv.id
    ORDER BY inv.created_at DESC
  `);

  return {
    summary: summary || {},
    dailyRevenue: dailyRows || [],
    weeklyRevenue: weeklyRows || [],
    monthlyRevenue: monthlyRows || [],
    yearlyRevenue: yearlyRows || [],
    categoryBreakdown: categoryRows || [],
    paymentMethods: paymentRows || [],
    topItems: topItems || [],
    recentInvoices: recentInvoices || []
  };
};

module.exports = {
  create, addItem, findById, getItems, getAll, getByCustomer, getStoreOrders,
  updateStatus, recordPayment, getRevenueStats, getDetailedFinancialReport
};

