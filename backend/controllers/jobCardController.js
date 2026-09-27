const jobCardModel = require("../models/jobCardModel");
const taskModel = require("../models/taskModel");
const notificationsModel = require("../models/notificationsModel");
const { sendJobCompletedEmail, sendJobApprovedEmail } = require("../utils/mailer");
const db = require("../config/db");

const getAll = async (req, res) => {
  try { res.json(await jobCardModel.getAll()); }
  catch (err) { res.status(500).json({ message: err.message }); }
};

const getOne = async (req, res) => {
  try {
    const jc = await jobCardModel.findById(req.params.id);
    if (!jc) return res.status(404).json({ message: "Job card not found" });
    const tasks = await taskModel.getByJobCard(req.params.id);
    const images = await jobCardModel.getImages(req.params.id);
    res.json({ ...jc, tasks, images });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const create = async (req, res) => {
  try {
    const { id: advisor_id } = req.user;
    const result = await jobCardModel.create({ ...req.body, advisor_id });

    // Notify customer about Job Card creation & request approval
    try {
      const [custRows] = await db.query(
        "SELECT c.user_id FROM customers c WHERE c.id = ?",
        [req.body.customer_id]
      );
      if (custRows.length) {
        await notificationsModel.create({
          user_id: custRows[0].user_id,
          title: "📋 New Job Card Created",
          message: `Job Card #${result.job_number} has been created for your vehicle. Please review the estimate and approve it to start workshop repair.`,
          type: "approval",
          job_card_id: result.id
        });
      }
    } catch (notifErr) { console.error("Notification error:", notifErr); }

    res.status(201).json(result);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const uploadImages = async (req, res) => {
  try {
    if (!req.files || !req.files.length) return res.status(400).json({ message: "No files uploaded" });
    for (const file of req.files) {
      await jobCardModel.addImage(req.params.id, file.filename, req.body.label || null);
    }
    res.json({ uploaded: req.files.length });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const updateStatus = async (req, res) => {
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

const deleteJobCard = async (req, res) => {
  try {
    const id = req.params.id;
    await jobCardModel.deleteJobCard(id);
    res.json({ message: "Job card deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const customerApprove = async (req, res) => {
  try {
    const id = req.params.id;
    const jc = await jobCardModel.findById(id);
    if (!jc) return res.status(404).json({ message: "Job card not found" });

    await jobCardModel.customerApprove(id);

    // Notify Advisor and Supervisor
    try {
      const [staff] = await db.query("SELECT id FROM users WHERE role IN ('manager', 'advisor', 'supervisor')");
      for (const s of staff) {
        await notificationsModel.create({
          user_id: s.id,
          title: "✅ Customer Approved Job Card",
          message: `Customer ${jc.customer_name} approved Job Card #${jc.job_number} (${jc.license_plate}). Ready for Bay / Technician allocation.`,
          type: "job_update",
          job_card_id: id
        });
      }
    } catch (e) {}

    res.json({ message: "Job Card approved successfully! Workshop repair is now in progress." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const customerReject = async (req, res) => {
  try {
    const id = req.params.id;
    const { reason } = req.body;
    const jc = await jobCardModel.findById(id);
    if (!jc) return res.status(404).json({ message: "Job card not found" });

    await jobCardModel.customerReject(id, reason);

    // Notify Advisor
    try {
      const [advisors] = await db.query("SELECT id FROM users WHERE role IN ('manager', 'advisor')");
      for (const a of advisors) {
        await notificationsModel.create({
          user_id: a.id,
          title: "❌ Customer Declined Job Card",
          message: `Customer ${jc.customer_name} declined Job Card #${jc.job_number}. Reason: ${reason || "Not specified"}`,
          type: "approval",
          job_card_id: id
        });
      }
    } catch (e) {}

    res.json({ message: "Job Card estimate declined. Service Advisor has been notified." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getStats = async (req, res) => {
  try { res.json(await jobCardModel.getStats()); }
  catch (err) { res.status(500).json({ message: err.message }); }
};

const getByCustomer = async (req, res) => {
  try { res.json(await jobCardModel.getByCustomer(req.params.customer_id)); }
  catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = {
  getAll,
  getOne,
  create,
  uploadImages,
  updateStatus,
  deleteJobCard,
  customerApprove,
  customerReject,
  getStats,
  getByCustomer
};
