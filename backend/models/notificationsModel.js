const pool = require("../config/db");

const getByUser = async (user_id) => {
  const [rows] = await pool.query(
    "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
    [user_id]
  );
  return rows;
};

const getUnreadCount = async (user_id) => {
  const [rows] = await pool.query(
    "SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0",
    [user_id]
  );
  return rows[0].count;
};

const create = async ({ user_id, title, message, type, job_card_id }) => {
  const [r] = await pool.query(
    "INSERT INTO notifications (user_id, title, message, type, job_card_id) VALUES (?,?,?,?,?)",
    [user_id, title, message, type || "system", job_card_id || null]
  );
  return r.insertId;
};

const markRead = async (id, user_id) => {
  await pool.query(
    "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?",
    [id, user_id]
  );
};

const markAllRead = async (user_id) => {
  await pool.query(
    "UPDATE notifications SET is_read = 1 WHERE user_id = ?",
    [user_id]
  );
};

module.exports = { getByUser, getUnreadCount, create, markRead, markAllRead };
