const db = require("../config/db");

const findByEmail = async (email) => {
  const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
  return rows[0];
};

const findById = async (id) => {
  const [rows] = await db.query("SELECT id, full_name, email, role, phone, is_active, created_at FROM users WHERE id = ?", [id]);
  return rows[0];
};

const create = async ({ full_name, email, password, role, phone, is_active }) => {
  const [result] = await db.query(
    "INSERT INTO users (full_name, email, password, role, phone, is_active) VALUES (?, ?, ?, ?, ?, ?)",
    [full_name, email, password, role || "customer", phone || null, is_active !== undefined ? is_active : 0]
  );
  return result.insertId;
};


const getByRole = async (role) => {
  const [rows] = await db.query(
    "SELECT id, full_name, email, role, phone, is_active FROM users WHERE role = ? ORDER BY full_name",
    [role]
  );
  return rows;
};

const getAll = async () => {
  const [rows] = await db.query(
    "SELECT id, full_name, email, role, phone, is_active, created_at FROM users ORDER BY created_at DESC"
  );
  return rows;
};

const updateUser = async (id, { role, is_active, phone, full_name }) => {
  await db.query(
    "UPDATE users SET role = COALESCE(?, role), is_active = COALESCE(?, is_active), phone = COALESCE(?, phone), full_name = COALESCE(?, full_name) WHERE id = ?",
    [role||null, is_active!==undefined?is_active:null, phone||null, full_name||null, id]
  );
};

module.exports = { findByEmail, findById, create, getByRole, getAll, updateUser };

