const jobCardModel = require("../models/jobCardModel");
const invoiceModel = require("../models/invoiceModel");
const userModel = require("../models/userModel");

const getDashboard = async (req, res) => {
  try {
    const jobStats = await jobCardModel.getStats();
    const revenueStats = await invoiceModel.getRevenueStats();
    const pendingApprovals = await jobCardModel.getPendingApprovals();
    res.json({ jobStats, revenueStats, pendingApprovals });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
const getPendingApprovals = async (req, res) => {
  try { res.json(await jobCardModel.getPendingApprovals()); }
  catch (err) { res.status(500).json({ message: err.message }); }
};
const approveJob = async (req, res) => {
  try {
    await jobCardModel.approve(req.params.id, req.user.id);
    res.json({ message: "Job approved" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
const rejectJob = async (req, res) => {
  try {
    await jobCardModel.reject(req.params.id, req.user.id);
    res.json({ message: "Job rejected" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
const getAllStaff = async (req, res) => {
  try { res.json(await userModel.getAll()); }
  catch (err) { res.status(500).json({ message: err.message }); }
};
const updateUser = async (req, res) => {
  try {
    await userModel.updateUser(req.params.id, req.body);
    res.json({ message: "User updated successfully" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getDashboard, getPendingApprovals, approveJob, rejectJob, getAllStaff, updateUser };

