const db = require("../config/db");

const getAll = async () => {
  const [rows] = await db.query("SELECT * FROM inventory_items ORDER BY name");
  return rows;
};

const findById = async (id) => {
  const [rows] = await db.query("SELECT * FROM inventory_items WHERE id = ?", [id]);
  return rows[0];
};

const create = async ({ item_code, name, category, unit, unit_price, quantity, low_stock_threshold, description, supplier }) => {
  const [r] = await db.query(
    "INSERT INTO inventory_items (item_code, name, category, unit, unit_price, quantity, low_stock_threshold, description, supplier) VALUES (?,?,?,?,?,?,?,?,?)",
    [item_code, name, category, unit||"piece", unit_price, quantity||0, low_stock_threshold||5, description||null, supplier||null]);
  return r.insertId;
};

const update = async (id, fields) => {
  const sets = Object.keys(fields).map(k => `${k}=?`).join(",");
  await db.query(`UPDATE inventory_items SET ${sets} WHERE id = ?`, [...Object.values(fields), id]);
};

const adjustStock = async (id, delta, type, reference, notes, performed_by) => {
  await db.query("UPDATE inventory_items SET quantity = quantity + ? WHERE id = ?", [delta, id]);
  await db.query(
    "INSERT INTO stock_transactions (item_id, type, quantity, reference, notes, performed_by) VALUES (?,?,?,?,?,?)",
    [id, type, Math.abs(delta), reference||null, notes||null, performed_by]);
};

const getLowStock = async () => {
  const [rows] = await db.query("SELECT * FROM inventory_items WHERE quantity <= low_stock_threshold ORDER BY quantity");
  return rows;
};

const getTransactions = async (item_id) => {
  const [rows] = await db.query(
    `SELECT st.*, u.full_name FROM stock_transactions st JOIN users u ON u.id = st.performed_by
     WHERE st.item_id = ? ORDER BY st.created_at DESC`, [item_id]);
  return rows;
};

const getAllTransactions = async () => {
  const [rows] = await db.query(
    `SELECT st.*, ii.name AS item_name, u.full_name FROM stock_transactions st
     JOIN inventory_items ii ON ii.id = st.item_id
     JOIN users u ON u.id = st.performed_by
     ORDER BY st.created_at DESC LIMIT 100`);
  return rows;
};

const getRequisitions = async (status) => {
  const base = `SELECT r.*, ii.name AS item_name, jc.job_number, u.full_name AS requested_by_name
    FROM requisitions r JOIN inventory_items ii ON ii.id = r.item_id
    JOIN job_cards jc ON jc.id = r.job_card_id
    JOIN users u ON u.id = r.requested_by`;
  const [rows] = status
    ? await db.query(base + " WHERE r.status = ? ORDER BY r.created_at DESC", [status])
    : await db.query(base + " ORDER BY r.created_at DESC");
  return rows;
};

const createRequisition = async ({ job_card_id, item_id, quantity_needed, requested_by, notes }) => {
  const [r] = await db.query(
    "INSERT INTO requisitions (job_card_id, item_id, quantity_needed, requested_by, notes) VALUES (?,?,?,?,?)",
    [job_card_id, item_id, quantity_needed, requested_by, notes||null]);
  return r.insertId;
};

const updateRequisition = async (id, status, reviewed_by) => {
  await db.query("UPDATE requisitions SET status = ?, reviewed_by = ? WHERE id = ?", [status, reviewed_by, id]);
};

module.exports = { getAll, findById, create, update, adjustStock, getLowStock, getTransactions, getAllTransactions, getRequisitions, createRequisition, updateRequisition };
