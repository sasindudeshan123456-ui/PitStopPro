const inventoryModel = require("../models/inventoryModel");

const getAll = async (req, res) => {
  try { res.json(await inventoryModel.getAll()); }
  catch (err) { res.status(500).json({ message: err.message }); }
};
const getOne = async (req, res) => {
  try {
    const item = await inventoryModel.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    const transactions = await inventoryModel.getTransactions(req.params.id);
    res.json({ ...item, transactions });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
const create = async (req, res) => {
  try { res.status(201).json({ id: await inventoryModel.create(req.body) }); }
  catch (err) { res.status(500).json({ message: err.message }); }
};
const update = async (req, res) => {
  try { await inventoryModel.update(req.params.id, req.body); res.json({ message: "Updated" }); }
  catch (err) { res.status(500).json({ message: err.message }); }
};
const stockIn = async (req, res) => {
  try {
    await inventoryModel.adjustStock(req.params.id, req.body.quantity, "stock_in", req.body.reference, req.body.notes, req.user.id);
    res.json({ message: "Stock added" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
const stockOut = async (req, res) => {
  try {
    const item = await inventoryModel.findById(req.params.id);
    if (!item || item.quantity < req.body.quantity) return res.status(400).json({ message: "Insufficient stock" });
    await inventoryModel.adjustStock(req.params.id, -req.body.quantity, "stock_out", req.body.reference, req.body.notes, req.user.id);
    res.json({ message: "Stock deducted" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
const getLowStock = async (req, res) => {
  try { res.json(await inventoryModel.getLowStock()); }
  catch (err) { res.status(500).json({ message: err.message }); }
};
const getAllTransactions = async (req, res) => {
  try { res.json(await inventoryModel.getAllTransactions()); }
  catch (err) { res.status(500).json({ message: err.message }); }
};
const createRequisition = async (req, res) => {
  try { res.status(201).json({ id: await inventoryModel.createRequisition({ ...req.body, requested_by: req.user.id }) }); }
  catch (err) { res.status(500).json({ message: err.message }); }
};
module.exports = { getAll, getOne, create, update, stockIn, stockOut, getLowStock, getAllTransactions, createRequisition };
