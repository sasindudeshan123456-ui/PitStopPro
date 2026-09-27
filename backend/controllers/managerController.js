const bcrypt = require("bcrypt");
const jobCardModel = require("../models/jobCardModel");
const invoiceModel = require("../models/invoiceModel");
const userModel = require("../models/userModel");
const inventoryModel = require("../models/inventoryModel");
const notificationsModel = require("../models/notificationsModel");
const servicesModel = require("../models/servicesModel");
const { sendJobApprovedEmail, sendJobCompletedEmail } = require("../utils/mailer");
const db = require("../config/db");


const getDashboard = async (req, res) => {
  try {
    const jobStats = await jobCardModel.getStats();
    const revenueStats = await invoiceModel.getRevenueStats();
    const pendingApprovals = await jobCardModel.getPendingApprovals();
    const inventorySummary = await inventoryModel.getLowStock();
    res.json({ jobStats, revenueStats, pendingApprovals, inventorySummary });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getPendingApprovals = async (req, res) => {
  try { res.json(await jobCardModel.getPendingApprovals()); }
  catch (err) { res.status(500).json({ message: err.message }); }
};

const approveJob = async (req, res) => {
  try {
    await jobCardModel.approve(req.params.id, req.user.id);

    // Notify customer
    try {
      const jc = await jobCardModel.findById(req.params.id);
      if (jc) {
        const [custRows] = await db.query(
          "SELECT c.user_id FROM customers c WHERE c.id = ?", [jc.customer_id]
        );
        if (custRows.length) {
          await notificationsModel.create({
            user_id: custRows[0].user_id,
            title: "✅ Estimate Approved",
            message: `Your estimate for Job ${jc.job_number} has been approved by the Workshop Manager. Work will proceed.`,
            type: "approval",
            job_card_id: jc.id,
          });
          await sendJobApprovedEmail({
            to: jc.customer_email,
            customerName: jc.customer_name,
            jobNumber: jc.job_number,
          });
        }
      }
    } catch (notifErr) {
      console.error("Notification error (non-fatal):", notifErr.message);
    }

    res.json({ message: "Job approved" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const rejectJob = async (req, res) => {
  try {
    const jc = await jobCardModel.findById(req.params.id);
    await jobCardModel.reject(req.params.id, req.user.id);

    // Notify customer on rejection & cancellation
    try {
      if (jc) {
        const [custRows] = await db.query(
          "SELECT c.user_id FROM customers c WHERE c.id = ?", [jc.customer_id]
        );
        if (custRows.length) {
          await notificationsModel.create({
            user_id: custRows[0].user_id,
            title: "❌ High-Value Estimate Rejected",
            message: `The estimate for Job ${jc.job_number} (LKR ${Number(jc.estimated_cost).toLocaleString()}) was reviewed and rejected by Workshop Management. The job card has been cancelled.`,
            type: "system",
            job_card_id: jc.id,
          });
        }
      }
    } catch (notifErr) {
      console.error("Notification error:", notifErr.message);
    }

    res.json({ message: "Job estimate rejected and cancelled successfully" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getAllStaff = async (req, res) => {
  try { res.json(await userModel.getAll()); }
  catch (err) { res.status(500).json({ message: err.message }); }
};

// Get staff members who self-registered and are pending manager approval
const getPendingStaff = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, full_name, email, phone, role, is_active, created_at FROM users WHERE role = 'staff_pending' OR (is_active = 0 AND role != 'customer') ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Approve a pending staff member: assign role and activate account
const approveStaffMember = async (req, res) => {
  try {
    const { role } = req.body;
    if (!role || role === 'staff_pending') {
      return res.status(400).json({ message: "A valid role must be assigned before approval" });
    }
    await userModel.updateUser(req.params.id, { role, is_active: 1 });
    res.json({ message: `Staff member approved and assigned role: ${role}` });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const updateUser = async (req, res) => {
  try {
    const { full_name, email, phone, role, is_active, password } = req.body;
    let hashedPassword;
    if (password && typeof password === "string" && password.trim().length > 0) {
      hashedPassword = await bcrypt.hash(password.trim(), 10);
    }
    if (email) {
      const existing = await userModel.findByEmail(email);
      if (existing && existing.id !== parseInt(req.params.id)) {
        return res.status(409).json({ message: "Email already in use by another account" });
      }
    }
    await userModel.updateUser(req.params.id, {
      full_name,
      email,
      phone,
      role,
      is_active,
      password: hashedPassword
    });
    res.json({ message: "User profile updated successfully" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const createStaff = async (req, res) => {
  try {
    const { full_name, email, password, role, phone } = req.body;
    if (!full_name || !email || !password || !role) {
      return res.status(400).json({ message: "Name, email, password and role required" });
    }
    const existing = await userModel.findByEmail(email);
    if (existing) return res.status(409).json({ message: "Email already registered" });
    const hashed = await bcrypt.hash(password, 10);
    const user_id = await userModel.create({ full_name, email, password: hashed, role, phone, is_active: 1 });
    res.status(201).json({ message: "Staff user created successfully", user_id });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const deleteUser = async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ message: "Cannot delete logged-in Manager account" });
    }
    await userModel.deleteUser(req.params.id);
    res.json({ message: "User deleted" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Inventory management for manager
const getInventory = async (req, res) => {
  try {
    const [items, lowStock] = await Promise.all([inventoryModel.getAll(), inventoryModel.getLowStock()]);
    res.json({ items, lowStock });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// All job cards for manager
const getAllJobs = async (req, res) => {
  try { res.json(await jobCardModel.getAll()); }
  catch (err) { res.status(500).json({ message: err.message }); }
};

// Requisition approvals
const getRequisitions = async (req, res) => {
  try { res.json(await inventoryModel.getRequisitions()); }
  catch (err) { res.status(500).json({ message: err.message }); }
};

const approveRequisition = async (req, res) => {
  try {
    await inventoryModel.updateRequisition(req.params.id, "approved", req.user.id);
    res.json({ message: "Requisition approved" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const rejectRequisition = async (req, res) => {
  try {
    await inventoryModel.updateRequisition(req.params.id, "rejected", req.user.id);
    res.json({ message: "Requisition rejected" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Update job status from manager panel
const updateJobStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const id = req.params.id;

    if (status === "cancelled") {
      await jobCardModel.reject(id, req.user.id);
      return res.json({ message: "Job card cancelled and deleted" });
    }

    const jc = await jobCardModel.findById(id);
    if (!jc) return res.status(404).json({ message: "Job card not found" });

    // Restrict starting repair until customer has approved
    if (status === "in_progress" && jc.customer_approval_status !== "approved") {
      return res.status(400).json({
        message: "Cannot start repair: Customer approval is pending. Customer must approve & authorize repairs first."
      });
    }

    await jobCardModel.updateStatus(id, status);

    // Trigger notification + email when job is completed
    if (status === "completed") {
      try {
        const jc = await jobCardModel.findById(id);
        if (jc) {
          const [custRows] = await db.query(
            "SELECT c.user_id FROM customers c WHERE c.id = ?",
            [jc.customer_id]
          );
          if (custRows.length) {
            const userId = custRows[0].user_id;
            await notificationsModel.create({
              user_id: userId,
              title: "🏁 Your Vehicle is Ready!",
              message: `Job ${jc.job_number} for your ${jc.make} ${jc.model} (${jc.license_plate}) has been completed. You can collect it now.`,
              type: "job_update",
              job_card_id: id,
            });
            await sendJobCompletedEmail({
              to: jc.customer_email,
              customerName: jc.customer_name,
              jobNumber: jc.job_number,
              vehicleMake: jc.make,
              vehicleModel: jc.model,
              licensePlate: jc.license_plate,
            });
          }
        }
      } catch (notifErr) {
        console.error("Notification error (non-fatal):", notifErr.message);
      }
    }

    res.json({ message: "Status updated" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Garage Services Management
const getAllServices = async (req, res) => {
  try { res.json(await servicesModel.getAll()); }
  catch (err) { res.status(500).json({ message: err.message }); }
};

const createService = async (req, res) => {
  try {
    const { service_code, name, category, description, base_price, estimated_hours, bay_type, required_items, image_url } = req.body;
    if (!service_code || !name) {
      return res.status(400).json({ message: "Service code and name are required" });
    }
    if (base_price !== undefined && parseFloat(base_price) < 0) {
      return res.status(400).json({ message: "Base Labor Price cannot be negative (Minus values not allowed)" });
    }
    if (estimated_hours !== undefined && parseFloat(estimated_hours) <= 0) {
      return res.status(400).json({ message: "Estimated Hours must be greater than 0 (Minus values not allowed)" });
    }
    const id = await servicesModel.create({ service_code, name, category, description, base_price: Math.max(0, parseFloat(base_price) || 0), estimated_hours: Math.max(0.1, parseFloat(estimated_hours) || 1), bay_type, required_items, image_url });
    res.status(201).json({ message: "Service created successfully", id });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const updateService = async (req, res) => {
  try {
    const { base_price, estimated_hours } = req.body;
    if (base_price !== undefined && parseFloat(base_price) < 0) {
      return res.status(400).json({ message: "Base Labor Price cannot be negative (Minus values not allowed)" });
    }
    if (estimated_hours !== undefined && parseFloat(estimated_hours) <= 0) {
      return res.status(400).json({ message: "Estimated Hours must be greater than 0 (Minus values not allowed)" });
    }
    await servicesModel.update(req.params.id, req.body);
    res.json({ message: "Service updated successfully" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const deleteService = async (req, res) => {
  try {
    await servicesModel.deleteService(req.params.id);
    res.json({ message: "Service deleted successfully" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Financial Report Analytics
const getFinancialReport = async (req, res) => {
  try {
    const report = await invoiceModel.getDetailedFinancialReport();
    res.json(report);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = {
  getDashboard, getPendingApprovals, approveJob, rejectJob,
  getAllStaff, getPendingStaff, approveStaffMember, updateUser, createStaff, deleteUser,
  getInventory, getAllJobs, getRequisitions, approveRequisition, rejectRequisition, updateJobStatus,
  getFinancialReport,
  getAllServices, createService, updateService, deleteService
};
