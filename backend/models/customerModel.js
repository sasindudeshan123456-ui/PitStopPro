const db = require("../config/db");

const create = async ({ user_id, address, nic }) => {
  const [r] = await db.query("INSERT INTO customers (user_id, address, nic) VALUES (?,?,?)", [user_id, address||null, nic||null]);
  return r.insertId;
};

const findByUserId = async (user_id) => {
  const [rows] = await db.query(
    `SELECT c.*, u.full_name, u.email, u.phone FROM customers c
     JOIN users u ON u.id = c.user_id WHERE c.user_id = ?`, [user_id]);
  return rows[0];
};

const findById = async (id) => {
  const [rows] = await db.query(
    `SELECT c.*, u.full_name, u.email, u.phone FROM customers c
     JOIN users u ON u.id = c.user_id WHERE c.id = ?`, [id]);
  return rows[0];
};

const search = async (query) => {
  const q = `%${query}%`;
  const [rows] = await db.query(
    `SELECT c.id, u.full_name, u.email, u.phone, c.nic FROM customers c
     JOIN users u ON u.id = c.user_id
     WHERE u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR c.nic LIKE ?
     ORDER BY u.full_name LIMIT 20`, [q,q,q,q]);
  return rows;
};

const getAll = async () => {
  const [rows] = await db.query(
    `SELECT c.id, u.full_name, u.email, u.phone, c.nic, c.created_at FROM customers c
     JOIN users u ON u.id = c.user_id ORDER BY u.full_name`);
  return rows;
};

module.exports = { create, findByUserId, findById, search, getAll };
