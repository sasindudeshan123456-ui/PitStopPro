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
    `SELECT c.id, u.full_name, u.email, u.phone, c.nic,
            GROUP_CONCAT(DISTINCT CONCAT(v.make, ' ', v.model, ' (', v.license_plate, ')') SEPARATOR ', ') AS vehicles_summary
     FROM customers c
     JOIN users u ON u.id = c.user_id
     LEFT JOIN vehicles v ON v.customer_id = c.id
     WHERE u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR c.nic LIKE ? OR v.license_plate LIKE ? OR v.make LIKE ? OR v.model LIKE ?
     GROUP BY c.id, u.full_name, u.email, u.phone, c.nic
     ORDER BY u.full_name LIMIT 20`,
    [q, q, q, q, q, q, q]
  );
  return rows;
};

const getAll = async () => {
  const [rows] = await db.query(
    `SELECT c.id, u.full_name, u.email, u.phone, c.nic, c.created_at,
            GROUP_CONCAT(DISTINCT CONCAT(v.make, ' ', v.model, ' (', v.license_plate, ')') SEPARATOR ', ') AS vehicles_summary
     FROM customers c
     JOIN users u ON u.id = c.user_id
     LEFT JOIN vehicles v ON v.customer_id = c.id
     GROUP BY c.id, u.full_name, u.email, u.phone, c.nic, c.created_at
     ORDER BY u.full_name`
  );
  return rows;
};

const updateCustomer = async (user_id, { address, nic }) => {
  await db.query("UPDATE customers SET address = ?, nic = ? WHERE user_id = ?", [address || null, nic || null, user_id]);
};

module.exports = { create, findByUserId, findById, search, getAll, updateCustomer };
