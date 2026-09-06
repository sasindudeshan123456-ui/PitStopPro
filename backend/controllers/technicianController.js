const taskModel = require("../models/taskModel");

const myTasks = async (req, res) => {
  try { res.json(await taskModel.getByTechnician(req.user.id)); }
  catch (err) { res.status(500).json({ message: err.message }); }
};
const clockIn = async (req, res) => {
  try { await taskModel.clockIn(req.params.id, req.user.id); res.json({ message: "Clocked in" }); }
  catch (err) { res.status(500).json({ message: err.message }); }
};
const clockOut = async (req, res) => {
  try { await taskModel.clockOut(req.params.id, req.user.id, req.body.notes); res.json({ message: "Clocked out" }); }
  catch (err) { res.status(500).json({ message: err.message }); }
};
const qcUpdate = async (req, res) => {
  try {
    await taskModel.qcUpdate(req.params.id, req.body.qc_passed, req.body.qc_notes, req.user.id);
    res.json({ message: "QC updated" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
const getLogs = async (req, res) => {
  try { res.json(await taskModel.getLaborLogs(req.params.id)); }
  catch (err) { res.status(500).json({ message: err.message }); }
};
module.exports = { myTasks, clockIn, clockOut, qcUpdate, getLogs };
