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

const getStoreOrders = async (req, res) => {
  try {
    const orders = await invoiceModel.getStoreOrders();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const notificationsModel = require("../models/notificationsModel");
const db = require("../config/db");

const approveStoreOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const inv = await invoiceModel.findById(id);
    if (!inv) return res.status(404).json({ message: "Store order invoice not found" });
    
    await invoiceModel.updateStatus(id, "paid");
    
    try {
      if (inv.customer_id) {
        const [cust] = await db.query("SELECT user_id FROM customers WHERE id = ?", [inv.customer_id]);
        if (cust.length && cust[0].user_id) {
          await notificationsModel.create({
            user_id: cust[0].user_id,
            title: "✅ Store Order Approved & Confirmed",
            message: `Your store order #${inv.invoice_number} has been verified and approved by the garage. You can now view and print your official receipt.`,
            type: "system"
          });
        }
      }
    } catch (e) {}

    res.json({ message: "Store order approved successfully! Official receipt is now active." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const rejectStoreOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const inv = await invoiceModel.findById(id);
    if (!inv) return res.status(404).json({ message: "Store order not found" });

    await invoiceModel.updateStatus(id, "cancelled");

    try {
      if (inv.customer_id) {
        const [cust] = await db.query("SELECT user_id FROM customers WHERE id = ?", [inv.customer_id]);
        if (cust.length && cust[0].user_id) {
          await notificationsModel.create({
            user_id: cust[0].user_id,
            title: "❌ Store Order Cancelled / Rejected",
            message: `Your store order #${inv.invoice_number} was rejected by the garage. Please contact support.`,
            type: "system"
          });
        }
      }
    } catch (e) {}

    res.json({ message: "Store order rejected." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteStoreOrder = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM invoice_items WHERE invoice_id = ?", [id]);
    await db.query("DELETE FROM payments WHERE invoice_id = ?", [id]);
    await db.query("DELETE FROM invoices WHERE id = ?", [id]);
    res.json({ message: "Store order record deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createInvoice, getAll, getOne, recordPayment, getByCustomer,
  getStoreOrders, approveStoreOrder, rejectStoreOrder, deleteStoreOrder
};
