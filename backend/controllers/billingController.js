const invoiceModel = require("../models/invoiceModel");
const jobCardModel = require("../models/jobCardModel");
const inventoryModel = require("../models/inventoryModel");

const createInvoice = async (req, res) => {
  try {
    const { job_card_id, items, discount_pct, tax_pct, discount_authorized_by } = req.body;
    const jc = await jobCardModel.findById(job_card_id);
    if (!jc) return res.status(404).json({ message: "Job card not found" });
    const subtotal = items.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0);
    const inv = await invoiceModel.create({ job_card_id, customer_id: jc.customer_id, subtotal, discount_pct: discount_pct||0, tax_pct: tax_pct||0, created_by: req.user.id, discount_authorized_by: discount_authorized_by||null });
    for (const item of items) await invoiceModel.addItem(inv.id, item);
    await jobCardModel.updateStatus(job_card_id, "invoiced");
    res.status(201).json(inv);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
const getAll = async (req, res) => {
  try { res.json(await invoiceModel.getAll()); }
  catch (err) { res.status(500).json({ message: err.message }); }
};
const getOne = async (req, res) => {
  try {
    const inv = await invoiceModel.findById(req.params.id);
    if (!inv) return res.status(404).json({ message: "Invoice not found" });
    const items = await invoiceModel.getItems(req.params.id);
    res.json({ ...inv, items });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
const recordPayment = async (req, res) => {
  try {
    await invoiceModel.recordPayment({ ...req.body, invoice_id: req.params.id, received_by: req.user.id });
    res.json({ message: "Payment recorded" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
const getByCustomer = async (req, res) => {
  try { res.json(await invoiceModel.getByCustomer(req.params.customer_id)); }
  catch (err) { res.status(500).json({ message: err.message }); }
};
module.exports = { createInvoice, getAll, getOne, recordPayment, getByCustomer };
