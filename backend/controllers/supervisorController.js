const taskModel = require("../models/taskModel");
const userModel = require("../models/userModel");
const inventoryModel = require("../models/inventoryModel");

const getAllActiveTasks = async (req, res) => {
  try { res.json(await taskModel.getAllActive()); }
  catch (err) { res.status(500).json({ message: err.message }); }
};
const createTask = async (req, res) => {
  try { res.status(201).json({ id: await taskModel.create(req.body) }); }
  catch (err) { res.status(500).json({ message: err.message }); }
};
const assignTask = async (req, res) => {
  try {
    await taskModel.assign(req.params.id, req.body.technician_id, req.user.id);
    res.json({ message: "Task assigned" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
const getTechnicians = async (req, res) => {
  try { res.json(await userModel.getByRole("technician")); }
  catch (err) { res.status(500).json({ message: err.message }); }
};
const getRequisitions = async (req, res) => {
  try { res.json(await inventoryModel.getRequisitions(req.query.status || null)); }
  catch (err) { res.status(500).json({ message: err.message }); }
};
const reviewRequisition = async (req, res) => {
  try {
    await inventoryModel.updateRequisition(req.params.id, req.body.status, req.user.id);
    res.json({ message: "Requisition updated" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
module.exports = { getAllActiveTasks, createTask, assignTask, getTechnicians, getRequisitions, reviewRequisition };
