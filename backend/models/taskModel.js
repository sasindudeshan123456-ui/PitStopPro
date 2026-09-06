const db = require("../config/db");

const create = async ({ job_card_id, task_name, bay_type, description, estimated_hours }) => {
  const [r] = await db.query(
    "INSERT INTO job_tasks (job_card_id, task_name, bay_type, description, estimated_hours) VALUES (?,?,?,?,?)",
    [job_card_id, task_name, bay_type, description||null, estimated_hours||0]);
  return r.insertId;
};

const getByJobCard = async (job_card_id) => {
  const [rows] = await db.query(
    `SELECT jt.*, ta.technician_id, u.full_name AS technician_name
     FROM job_tasks jt
     LEFT JOIN task_assignments ta ON ta.task_id = jt.id
     LEFT JOIN users u ON u.id = ta.technician_id
     WHERE jt.job_card_id = ? ORDER BY jt.created_at`, [job_card_id]);
  return rows;
};

const getByTechnician = async (technician_id) => {
  const [rows] = await db.query(
    `SELECT jt.*, jc.job_number, v.license_plate, v.make, v.model
     FROM job_tasks jt
     JOIN task_assignments ta ON ta.task_id = jt.id
     JOIN job_cards jc ON jc.id = jt.job_card_id
     JOIN vehicles v ON v.id = jc.vehicle_id
     WHERE ta.technician_id = ? ORDER BY jt.created_at DESC`, [technician_id]);
  return rows;
};

const assign = async (task_id, technician_id, assigned_by) => {
  await db.query("DELETE FROM task_assignments WHERE task_id = ?", [task_id]);
  await db.query("INSERT INTO task_assignments (task_id, technician_id, assigned_by) VALUES (?,?,?)", [task_id, technician_id, assigned_by]);
  await db.query("UPDATE job_tasks SET status = 'assigned' WHERE id = ?", [task_id]);
};

const updateStatus = async (id, status) => {
  await db.query("UPDATE job_tasks SET status = ? WHERE id = ?", [status, id]);
};

const qcUpdate = async (id, qc_passed, qc_notes, qc_inspector_id) => {
  const status = qc_passed ? "completed" : "rework";
  await db.query("UPDATE job_tasks SET qc_passed = ?, qc_notes = ?, qc_inspector_id = ?, status = ? WHERE id = ?",
    [qc_passed, qc_notes||null, qc_inspector_id, status, id]);
};

const clockIn = async (task_id, technician_id) => {
  await db.query("INSERT INTO labor_logs (task_id, technician_id, clock_in) VALUES (?,?,NOW())", [task_id, technician_id]);
  await db.query("UPDATE job_tasks SET status = 'in_progress' WHERE id = ?", [task_id]);
};

const clockOut = async (task_id, technician_id, notes) => {
  await db.query(
    "UPDATE labor_logs SET clock_out = NOW(), notes = ? WHERE task_id = ? AND technician_id = ? AND clock_out IS NULL",
    [notes||null, task_id, technician_id]);
};

const getLaborLogs = async (task_id) => {
  const [rows] = await db.query(
    `SELECT ll.*, u.full_name FROM labor_logs ll JOIN users u ON u.id = ll.technician_id WHERE ll.task_id = ?`, [task_id]);
  return rows;
};

const getAllActive = async () => {
  const [rows] = await db.query(
    `SELECT jt.*, jc.job_number, v.license_plate, v.make, v.model, ta.technician_id, u.full_name AS technician_name
     FROM job_tasks jt
     JOIN job_cards jc ON jc.id = jt.job_card_id
     JOIN vehicles v ON v.id = jc.vehicle_id
     LEFT JOIN task_assignments ta ON ta.task_id = jt.id
     LEFT JOIN users u ON u.id = ta.technician_id
     WHERE jt.status NOT IN ("completed")
     ORDER BY jt.created_at DESC`);
  return rows;
};

module.exports = { create, getByJobCard, getByTechnician, assign, updateStatus, qcUpdate, clockIn, clockOut, getLaborLogs, getAllActive };
