const jobCardModel = require("../models/jobCardModel");
const taskModel = require("../models/taskModel");
const path = require("path");

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
    await jobCardModel.updateStatus(req.params.id, req.body.status);
    res.json({ message: "Status updated" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getStats = async (req, res) => {
  try { res.json(await jobCardModel.getStats()); }
  catch (err) { res.status(500).json({ message: err.message }); }
};

const getByCustomer = async (req, res) => {
  try { res.json(await jobCardModel.getByCustomer(req.params.customer_id)); }
  catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getAll, getOne, create, uploadImages, updateStatus, getStats, getByCustomer };
