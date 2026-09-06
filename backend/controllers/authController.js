const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");
const customerModel = require("../models/customerModel");

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });
    const user = await userModel.findByEmail(email);
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    // Enforce Admin Approval & Active Check
    if (!user.is_active) {
      return res.status(403).json({ message: "Account pending Administrator approval & role assignment. Please contact Workshop Manager." });
    }

    const token = jwt.sign({ id: user.id, role: user.role, name: user.full_name }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    let customer_id = null;
    if (user.role === "customer") {
      const cust = await customerModel.findByUserId(user.id);
      customer_id = cust ? cust.id : null;
    }
    res.json({ token, user: { id: user.id, name: user.full_name, email: user.email, role: user.role, phone: user.phone, customer_id } });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const register = async (req, res) => {
  try {
    const { full_name, email, password, phone, address, nic } = req.body;
    if (!full_name || !email || !password) return res.status(400).json({ message: "Name, email and password required" });
    const existing = await userModel.findByEmail(email);
    if (existing) return res.status(409).json({ message: "Email already registered" });
    const hashed = await bcrypt.hash(password, 10);
    // Newly self-registered users are created as pending approval (is_active = 0)
    const user_id = await userModel.create({ full_name, email, password: hashed, role: "customer", phone, is_active: 0 });
    const customer_id = await customerModel.create({ user_id, address, nic });
    res.status(201).json({ message: "Registration submitted! Pending Admin approval & role assignment.", user_id, customer_id });
  } catch (err) { res.status(500).json({ message: err.message }); }
};


const me = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id);
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { login, register, me };
