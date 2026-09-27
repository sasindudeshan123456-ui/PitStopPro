const customerModel = require("../models/customerModel");
const vehicleModel = require("../models/vehicleModel");
const servicesModel = require("../models/servicesModel");
const inventoryModel = require("../models/inventoryModel");
const jobCardModel = require("../models/jobCardModel");
const notificationsModel = require("../models/notificationsModel");
const db = require("../config/db");

const search = async (req, res) => {
  try { res.json(await customerModel.search(req.query.q || "")); }
  catch (err) { res.status(500).json({ message: err.message }); }
};

const getAll = async (req, res) => {
  try { res.json(await customerModel.getAll()); }
  catch (err) { res.status(500).json({ message: err.message }); }
};

const getOne = async (req, res) => {
  try {
    const c = await customerModel.findById(req.params.id);
    if (!c) return res.status(404).json({ message: "Customer not found" });
    const vehicles = await vehicleModel.findByCustomer(c.id);
    res.json({ ...c, vehicles });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const addVehicle = async (req, res) => {
  try {
    const existing = await vehicleModel.findByPlate(req.body.license_plate);
    if (existing) return res.status(409).json({ message: "License plate already registered" });
    const id = await vehicleModel.create({ ...req.body, customer_id: req.params.id });
    res.status(201).json({ id });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Customer Services & Store API
const getStoreServices = async (req, res) => {
  try {
    const services = await servicesModel.getAll();
    res.json(services.filter(s => s.is_active === undefined || s.is_active === null || Number(s.is_active) === 1 || Boolean(s.is_active)));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getStoreItems = async (req, res) => {
  try {
    const items = await inventoryModel.getAll();
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const directBuyItems = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const user_id = req.user.id;
    let customer = await customerModel.findByUserId(user_id);
    if (!customer) {
      const custId = await customerModel.create({ user_id });
      customer = await customerModel.findById(custId);
    }

    const { items = [], payment_method = "card", delivery_notes = "" } = req.body;
    if (!items.length) {
      return res.status(400).json({ message: "Cart is empty. Please select items to purchase." });
    }

    await conn.beginTransaction();

    let subtotal = 0;
    const validatedItems = [];

    for (const it of items) {
      const [rows] = await conn.query("SELECT id, name, unit_price, quantity, item_code FROM inventory_items WHERE id = ?", [it.item_id]);
      if (!rows.length) {
        throw new Error(`Item not found`);
      }
      const dbItem = rows[0];
      const buyQty = parseFloat(it.quantity) || 1;
      if (parseFloat(dbItem.quantity) < buyQty) {
        throw new Error(`Insufficient stock for ${dbItem.name}. Available: ${dbItem.quantity}`);
      }
      const unitPrice = parseFloat(dbItem.unit_price);
      const lineTotal = unitPrice * buyQty;
      subtotal += lineTotal;

      validatedItems.push({
        id: dbItem.id,
        name: dbItem.name,
        item_code: dbItem.item_code,
        quantity: buyQty,
        unit_price: unitPrice
      });
    }

    const total = subtotal;
    const invoiceNumber = "INV-DIR-" + Date.now().toString().slice(-6);

    // Create Direct Sale Invoice with 'pending' status awaiting garage approval
    const [invRes] = await conn.query(
      `INSERT INTO invoices (invoice_number, job_card_id, customer_id, subtotal, total, status, created_by, type)
       VALUES (?, NULL, ?, ?, ?, 'pending', 1, 'direct_sale')`,
      [invoiceNumber, customer.id, subtotal, total]
    );
    const invoiceId = invRes.insertId;

    // Create Invoice items & deduct inventory stock
    for (const vi of validatedItems) {
      await conn.query(
        `INSERT INTO invoice_items (invoice_id, description, type, quantity, unit_price)
         VALUES (?, ?, 'part', ?, ?)`,
        [invoiceId, `${vi.name} (${vi.item_code})`, vi.quantity, vi.unit_price]
      );

      // Reduce inventory
      await conn.query(
        "UPDATE inventory_items SET quantity = quantity - ? WHERE id = ?",
        [vi.quantity, vi.id]
      );

      // Record transaction
      await conn.query(
        `INSERT INTO stock_transactions (item_id, type, quantity, reference, notes, performed_by)
         VALUES (?, 'stock_out', ?, ?, 'Direct Customer Store Purchase (Pending Verification)', 1)`,
        [vi.id, vi.quantity, invoiceNumber]
      );
    }

    // Record Payment
    await conn.query(
      `INSERT INTO payments (invoice_id, amount, method, reference, received_by)
       VALUES (?, ?, ?, ?, 1)`,
      [invoiceId, total, payment_method, `DIRECT-PAY-${Date.now().toString().slice(-4)}`]
    );

    await conn.commit();

    // Notify Customer
    try {
      await notificationsModel.create({
        user_id,
        title: "🛒 Order Placed - Booking Pending",
        message: `Your store order of LKR ${Number(total).toLocaleString()} for ${validatedItems.length} item(s) was received. Order #${invoiceNumber} is currently Pending Garage Verification. Official receipt will be available once approved by garage.`,
        type: "system"
      });
    } catch (e) {}

    res.status(201).json({
      message: "Purchase completed successfully! Your invoice is ready.",
      invoice_id: invoiceId,
      invoice_number: invoiceNumber,
      total
    });
  } catch (err) {
    await conn.rollback();
    console.error("Direct buy error:", err);
    res.status(400).json({ message: err.message });
  } finally {
    conn.release();
  }
};

const userModel = require("../models/userModel");

const updateMyProfile = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { full_name, email, phone, address, nic, password } = req.body;

    const userPayload = {};
    if (full_name !== undefined) userPayload.full_name = full_name;
    if (phone !== undefined) userPayload.phone = phone;
    if (email && email.trim()) {
      const existingUser = await userModel.findByEmail(email.trim());
      if (existingUser && existingUser.id !== user_id) {
        return res.status(409).json({ message: "This email address is already registered to another account." });
      }
      userPayload.email = email.trim();
    }
    if (password && password.trim().length >= 6) {
      const bcrypt = require("bcrypt");
      userPayload.password = await bcrypt.hash(password.trim(), 10);
    }

    if (Object.keys(userPayload).length > 0) {
      await userModel.updateUser(user_id, userPayload);
    }

    await customerModel.updateCustomer(user_id, { address, nic });

    const updatedUser = await userModel.findById(user_id);
    const updatedCust = await customerModel.findByUserId(user_id);

    res.json({
      message: "Profile updated successfully!",
      user: {
        id: updatedUser.id,
        name: updatedUser.full_name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        customer_id: updatedCust ? updatedCust.id : null,
        address: updatedCust ? updatedCust.address : null,
        nic: updatedCust ? updatedCust.nic : null
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteMyAccount = async (req, res) => {
  try {
    const user_id = req.user.id;
    await userModel.updateUser(user_id, { is_active: 0 });
    res.json({ message: "Account deactivated and removed successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  search,
  getAll,
  getOne,
  addVehicle,
  getStoreServices,
  getStoreItems,
  directBuyItems,
  updateMyProfile,
  deleteMyAccount
};
