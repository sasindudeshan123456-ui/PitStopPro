const db = require("../config/db");

const genJobNumber = () => {
  const d = new Date();
  return `JC-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}-${Date.now().toString().slice(-4)}`;
};

const create = async ({ vehicle_id, customer_id, advisor_id, reported_issue, diagnosis_notes, estimated_cost, exterior_damage, appointment_id }) => {
  const job_number = genJobNumber();
  const approval_required = estimated_cost && parseFloat(estimated_cost) > 5000 ? 1 : 0;
  const approval_status = approval_required ? "pending" : "not_required";
  // If manager approval not required (low-value estimate), still require customer approval
  // But if cost is 0 or very low (walk-in with no estimate), auto-approve customer too
  const customer_approval_status = "pending";

  const [r] = await db.query(
    `INSERT INTO job_cards (job_number, vehicle_id, customer_id, advisor_id, reported_issue, diagnosis_notes, estimated_cost, approval_required, approval_status, customer_approval_status, exterior_damage, appointment_id)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [job_number, vehicle_id, customer_id, advisor_id, reported_issue, diagnosis_notes||null, estimated_cost||0, approval_required, approval_status, customer_approval_status, exterior_damage||null, appointment_id||null]);

  // If created from appointment, update appointment status
  if (appointment_id) {
    try {
      await db.query("UPDATE appointments SET status = 'checked_in', job_card_id = ? WHERE id = ?", [r.insertId, appointment_id]);
    } catch (e) { console.error("Could not link appointment:", e); }
  }

  return { id: r.insertId, job_number };
};

const getAll = async () => {
  const [rows] = await db.query(
    `SELECT jc.*, u.full_name AS customer_name, u.phone AS customer_phone, u.email AS customer_email,
            v.license_plate, v.make, v.model, v.year AS vehicle_year,
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
            c.address AS customer_address, c.nic AS customer_nic,
            v.license_plate, v.make, v.model, v.year, v.color, v.mileage, v.vin,
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
    `SELECT jc.*, v.license_plate, v.make, v.model, v.year, v.color
     FROM job_cards jc
     JOIN vehicles v ON v.id = jc.vehicle_id
     WHERE jc.customer_id = ?
     ORDER BY jc.created_at DESC`, [customer_id]);

  for (const jc of rows) {
    const [images] = await db.query("SELECT * FROM vehicle_images WHERE job_card_id = ?", [jc.id]);
    jc.images = images;
  }
  return rows;
};

const updateStatus = async (id, status) => {
  await db.query("UPDATE job_cards SET status = ? WHERE id = ?", [status, id]);
  try {
    const [rows] = await db.query("SELECT * FROM job_cards WHERE id = ?", [id]);
    const jc = rows[0];
    const aptId = jc?.appointment_id;
    const aptStatus = status === "invoiced" ? "invoiced" : status === "completed" ? "completed" : status === "in_progress" || status === "qc_check" ? "checked_in" : status;
    if (aptId) {
      await db.query("UPDATE appointments SET status = ? WHERE id = ?", [aptStatus, aptId]);
    }
    await db.query("UPDATE appointments SET status = ? WHERE job_card_id = ?", [aptStatus, id]);

    // Auto-generate invoice when moving to invoiced status if not already created
    if (status === "invoiced" && jc) {
      const [existingInv] = await db.query("SELECT id FROM invoices WHERE job_card_id = ?", [id]);
      if (!existingInv.length) {
        const d = new Date();
        const invoice_number = `INV-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}-${Date.now().toString().slice(-4)}${jc.id}`;
        const subtotal = parseFloat(jc.estimated_cost || 0);

        const [r] = await db.query(
          `INSERT INTO invoices (invoice_number, job_card_id, customer_id, subtotal, discount_pct, discount_amount, tax_pct, tax_amount, total, status, created_by) 
           VALUES (?, ?, ?, ?, 0, 0, 0, 0, ?, 'paid', ?)`,
          [invoice_number, id, jc.customer_id, subtotal, subtotal, jc.advisor_id || 1]
        );
        const invId = r.insertId;

        await db.query(
          "INSERT INTO invoice_items (invoice_id, description, type, quantity, unit_price) VALUES (?, ?, 'labor', 1, ?)",
          [invId, jc.reported_issue || "Garage Workshop Service & Repairs", subtotal]
        );

        await db.query(
          "INSERT INTO payments (invoice_id, amount, method, reference, received_by) VALUES (?, ?, 'cash', 'Settled at Vehicle Handover', ?)",
          [invId, subtotal, jc.advisor_id || 1]
        );
      }
    }
  } catch (e) {
    console.error("Error in jobCardModel updateStatus:", e);
  }
};

const approve = async (id, approved_by) => {
  await db.query(
    "UPDATE job_cards SET approval_status = 'approved', approved_by = ?, approved_at = NOW() WHERE id = ?",
    [approved_by, id]);
};

const reject = async (id, approved_by) => {
  await db.query(
    "UPDATE job_cards SET approval_status = 'rejected', status = 'cancelled' WHERE id = ?",
    [id]
  );
  try {
    const [rows] = await db.query("SELECT appointment_id FROM job_cards WHERE id = ?", [id]);
    const aptId = rows[0]?.appointment_id;
    if (aptId) {
      await db.query("UPDATE appointments SET status = 'cancelled' WHERE id = ?", [aptId]);
    }
    await db.query("UPDATE appointments SET status = 'cancelled' WHERE job_card_id = ?", [id]);
  } catch (e) {}
};

const deleteJobCard = async (id) => {
  let aptId = null;
  try {
    const [rows] = await db.query("SELECT appointment_id FROM job_cards WHERE id = ?", [id]);
    aptId = rows[0]?.appointment_id;
  } catch (e) {}

  // 1. Delete payments related to invoices for this job card
  try {
    await db.query(
      "DELETE FROM payments WHERE invoice_id IN (SELECT id FROM invoices WHERE job_card_id = ?)",
      [id]
    );
  } catch (e) {}

  // 2. Delete invoice_items related to invoices for this job card
  try {
    await db.query(
      "DELETE FROM invoice_items WHERE invoice_id IN (SELECT id FROM invoices WHERE job_card_id = ?)",
      [id]
    );
  } catch (e) {}

  // 3. Delete invoices
  try {
    await db.query("DELETE FROM invoices WHERE job_card_id = ?", [id]);
  } catch (e) {}

  // 4. Delete labor logs, task assignments, and job tasks
  try {
    await db.query(
      "DELETE FROM labor_logs WHERE task_id IN (SELECT id FROM job_tasks WHERE job_card_id = ?)",
      [id]
    );
  } catch (e) {}
  try {
    await db.query(
      "DELETE FROM task_assignments WHERE task_id IN (SELECT id FROM job_tasks WHERE job_card_id = ?)",
      [id]
    );
  } catch (e) {}
  try {
    await db.query("DELETE FROM job_tasks WHERE job_card_id = ?", [id]);
  } catch (e) {}

  // 5. Delete requisitions and job parts
  try {
    await db.query("DELETE FROM requisitions WHERE job_card_id = ?", [id]);
  } catch (e) {}
  try {
    await db.query("DELETE FROM job_parts WHERE job_card_id = ?", [id]);
  } catch (e) {}

  // 6. Delete vehicle images & notifications
  try {
    await db.query("DELETE FROM vehicle_images WHERE job_card_id = ?", [id]);
  } catch (e) {}
  try {
    await db.query("DELETE FROM notifications WHERE job_card_id = ?", [id]);
  } catch (e) {}

  // 7. Unlink and delete linked appointments
  try {
    await db.query("UPDATE appointments SET job_card_id = NULL WHERE job_card_id = ?", [id]);
  } catch (e) {}
  if (aptId) {
    try {
      await db.query("UPDATE appointments SET job_card_id = NULL WHERE id = ?", [aptId]);
      await db.query("DELETE FROM appointments WHERE id = ?", [aptId]);
    } catch (e) {}
  }
  try {
    await db.query("DELETE FROM appointments WHERE job_card_id = ?", [id]);
  } catch (e) {}

  // 8. Delete job card
  await db.query("DELETE FROM job_cards WHERE id = ?", [id]);
};

const customerApprove = async (id) => {
  await db.query(
    "UPDATE job_cards SET customer_approval_status = 'approved', customer_approved_at = NOW(), status = 'in_progress' WHERE id = ?",
    [id]
  );
};

const customerReject = async (id, reason) => {
  await db.query(
    "UPDATE job_cards SET customer_approval_status = 'rejected', customer_rejection_reason = ?, status = 'cancelled' WHERE id = ?",
    [reason || null, id]
  );
  try {
    const [rows] = await db.query("SELECT appointment_id FROM job_cards WHERE id = ?", [id]);
    const aptId = rows[0]?.appointment_id;
    if (aptId) {
      await db.query("UPDATE appointments SET status = 'cancelled' WHERE id = ?", [aptId]);
    }
    await db.query("UPDATE appointments SET status = 'cancelled' WHERE job_card_id = ?", [id]);
  } catch (e) {}
};

const getPendingApprovals = async () => {
  const [rows] = await db.query(
    `SELECT jc.*, u.full_name AS customer_name, v.license_plate, v.make, v.model
     FROM job_cards jc
     JOIN customers c ON c.id = jc.customer_id
     JOIN users u ON u.id = c.user_id
     JOIN vehicles v ON v.id = jc.vehicle_id
     WHERE jc.approval_status = 'pending' AND jc.status != 'cancelled' ORDER BY jc.created_at DESC`);
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
    FROM job_cards
    WHERE status != 'cancelled' AND approval_status != 'rejected'`);
  return rows[0];
};

const updateQC = async (id, status, notes) => {
  await db.query("UPDATE job_cards SET qc_status = ?, qc_notes = ? WHERE id = ?", [status, notes||null, id]);
};

const updateDiscount = async (id, requested, approved) => {
  await db.query("UPDATE job_cards SET discount_requested = ?, discount_approved = ? WHERE id = ?", [requested, approved ? 1 : 0, id]);
};

module.exports = {
  create,
  getAll,
  findById,
  getByCustomer,
  updateStatus,
  approve,
  reject,
  deleteJobCard,
  customerApprove,
  customerReject,
  getPendingApprovals,
  addImage,
  getImages,
  getStats,
  updateQC,
  updateDiscount
};
