const db = require("../config/db");

const findByEmail = async (email) => {
  const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
  return rows[0];
};

const findByEmailOrUsername = async (identifier) => {
  const [rows] = await db.query("SELECT * FROM users WHERE email = ? OR full_name = ?", [identifier, identifier]);
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

const updateUser = async (id, { role, is_active, phone, full_name, email, password }) => {
  const fields = [];
  const values = [];

  if (role !== undefined && role !== null) { fields.push("role = ?"); values.push(role); }
  if (is_active !== undefined && is_active !== null) { fields.push("is_active = ?"); values.push(is_active); }
  if (phone !== undefined) { fields.push("phone = ?"); values.push(phone); }
  if (full_name !== undefined && full_name !== null) { fields.push("full_name = ?"); values.push(full_name); }
  if (email !== undefined && email !== null) { fields.push("email = ?"); values.push(email); }
  if (password !== undefined && password) { fields.push("password = ?"); values.push(password); }

  if (!fields.length) return;
  values.push(id);
  await db.query(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, values);
};

const deleteUser = async (id) => {
  // Nullify FK references before deleting to avoid constraint failures
  try { await db.query("UPDATE job_cards SET advisor_id = 1 WHERE advisor_id = ?", [id]); } catch (e) {}
  try { await db.query("UPDATE job_cards SET approved_by = NULL WHERE approved_by = ?", [id]); } catch (e) {}
  try { await db.query("UPDATE task_assignments SET assigned_by = 1 WHERE assigned_by = ?", [id]); } catch (e) {}
  try { await db.query("UPDATE requisitions SET reviewed_by = NULL WHERE reviewed_by = ?", [id]); } catch (e) {}
  try { await db.query("DELETE FROM task_assignments WHERE technician_id = ?", [id]); } catch (e) {}
  try { await db.query("DELETE FROM labor_logs WHERE technician_id = ?", [id]); } catch (e) {}
  await db.query("DELETE FROM users WHERE id = ?", [id]);
};

module.exports = { findByEmail, findByEmailOrUsername, findById, create, getByRole, getAll, updateUser, deleteUser };

