const db = require("../config/db");

const genJobNumber = () => {
  const d = new Date();
  return `JC-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}-${Date.now().toString().slice(-4)}`;
};

const create = async ({ vehicle_id, customer_id, advisor_id, reported_issue, diagnosis_notes, estimated_cost, exterior_damage }) => {
  const job_number = genJobNumber();
  const approval_required = estimated_cost && parseFloat(estimated_cost) > 5000 ? 1 : 0;
  const approval_status = approval_required ? "pending" : "not_required";
  const [r] = await db.query(
    `INSERT INTO job_cards (job_number, vehicle_id, customer_id, advisor_id, reported_issue, diagnosis_notes, estimated_cost, approval_required, approval_status, exterior_damage)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [job_number, vehicle_id, customer_id, advisor_id, reported_issue, diagnosis_notes||null, estimated_cost||0, approval_required, approval_status, exterior_damage||null]);
  return { id: r.insertId, job_number };
};


const getAll = async () => {
  const [rows] = await db.query(
    `SELECT jc.*, u.full_name AS customer_name, v.license_plate, v.make, v.model,
            a.full_name AS advisor_name
     FROM job_cards jc
     JOIN customers c ON c.id = jc.customer_id
     JOIN users u ON u.id = c.user_id
     JOIN vehicles v ON v.id = jc.vehicle_id
     JOIN users a ON a.id = jc.advisor_id
     ORDER BY jc.created_at DESC`);
  return rows;
};

const findById = async (id) => {
  const [rows] = await db.query(
    `SELECT jc.*, u.full_name AS customer_name, u.email AS customer_email, u.phone AS customer_phone,
            v.license_plate, v.make, v.model, v.year, v.color, v.mileage,
            a.full_name AS advisor_name
     FROM job_cards jc
     JOIN customers c ON c.id = jc.customer_id
     JOIN users u ON u.id = c.user_id
     JOIN vehicles v ON v.id = jc.vehicle_id
     JOIN users a ON a.id = jc.advisor_id
     WHERE jc.id = ?`, [id]);
  return rows[0];
};

const getByCustomer = async (customer_id) => {
  const [rows] = await db.query(
    `SELECT jc.*, v.license_plate, v.make, v.model FROM job_cards jc
     JOIN vehicles v ON v.id = jc.vehicle_id
     WHERE jc.customer_id = ? ORDER BY jc.created_at DESC`, [customer_id]);
  return rows;
};

const updateStatus = async (id, status) => {
  await db.query("UPDATE job_cards SET status = ? WHERE id = ?", [status, id]);
};

const approve = async (id, approved_by) => {
  await db.query(
    "UPDATE job_cards SET approval_status = 'approved', approved_by = ?, approved_at = NOW() WHERE id = ?",
    [approved_by, id]);
};

const reject = async (id, approved_by) => {
  await db.query(
    "UPDATE job_cards SET approval_status = 'rejected', approved_by = ?, approved_at = NOW() WHERE id = ?",
    [approved_by, id]);
};

const getPendingApprovals = async () => {
  const [rows] = await db.query(
    `SELECT jc.*, u.full_name AS customer_name, v.license_plate, v.make, v.model
     FROM job_cards jc
     JOIN customers c ON c.id = jc.customer_id
     JOIN users u ON u.id = c.user_id
     JOIN vehicles v ON v.id = jc.vehicle_id
     WHERE jc.approval_status = "pending" ORDER BY jc.created_at DESC`);
  return rows;
};

const addImage = async (job_card_id, filename, label) => {
  await db.query("INSERT INTO vehicle_images (job_card_id, filename, label) VALUES (?,?,?)", [job_card_id, filename, label||null]);
};

const getImages = async (job_card_id) => {
  const [rows] = await db.query("SELECT * FROM vehicle_images WHERE job_card_id = ?", [job_card_id]);
  return rows;
};

const getStats = async () => {
  const [rows] = await db.query(`
    SELECT
      COUNT(*) AS total,
      SUM(status = "pending") AS pending,
      SUM(status = "in_progress") AS in_progress,
      SUM(status = "qc_check") AS qc_check,
      SUM(status = "completed") AS completed,
      SUM(status = "invoiced") AS invoiced
    FROM job_cards`);
  return rows[0];
};

const updateQC = async (id, status, notes) => {
  await db.query("UPDATE job_cards SET qc_status = ?, qc_notes = ? WHERE id = ?", [status, notes||null, id]);
};

const updateDiscount = async (id, requested, approved) => {
  await db.query("UPDATE job_cards SET discount_requested = ?, discount_approved = ? WHERE id = ?", [requested, approved ? 1 : 0, id]);
};

module.exports = { create, getAll, findById, getByCustomer, updateStatus, approve, reject, getPendingApprovals, addImage, getImages, getStats, updateQC, updateDiscount };

