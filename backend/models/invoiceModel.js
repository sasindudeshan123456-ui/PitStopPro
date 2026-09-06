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
     JOIN job_cards jc ON jc.id = inv.job_card_id
     JOIN vehicles v ON v.id = jc.vehicle_id
     WHERE inv.id = ?`, [id]);
  return rows[0];
};

const getItems = async (invoice_id) => {
  const [rows] = await db.query("SELECT * FROM invoice_items WHERE invoice_id = ?", [invoice_id]);
  return rows;
};

const getAll = async () => {
  const [rows] = await db.query(
    `SELECT inv.*, u.full_name AS customer_name, jc.job_number
     FROM invoices inv
     JOIN customers c ON c.id = inv.customer_id
     JOIN users u ON u.id = c.user_id
     JOIN job_cards jc ON jc.id = inv.job_card_id
     ORDER BY inv.created_at DESC`);
  return rows;
};

const getByCustomer = async (customer_id) => {
  const [rows] = await db.query(
    `SELECT inv.*, jc.job_number, v.license_plate, v.make, v.model
     FROM invoices inv
     JOIN job_cards jc ON jc.id = inv.job_card_id
     JOIN vehicles v ON v.id = jc.vehicle_id
     WHERE inv.customer_id = ? ORDER BY inv.created_at DESC`, [customer_id]);
  return rows;
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
      SUM(total) AS total_revenue,
      SUM(CASE WHEN DATE(created_at) = CURDATE() THEN total ELSE 0 END) AS today_revenue,
      SUM(CASE WHEN MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW()) THEN total ELSE 0 END) AS month_revenue,
      COUNT(*) AS total_invoices,
      SUM(status = "paid") AS paid_count
    FROM invoices WHERE status != "cancelled"`);
  return rows[0];
};

module.exports = { create, addItem, findById, getItems, getAll, getByCustomer, updateStatus, recordPayment, getRevenueStats };
