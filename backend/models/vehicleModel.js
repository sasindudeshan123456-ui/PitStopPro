const db = require("../config/db");

const create = async ({ customer_id, make, model, year, license_plate, color, mileage, vin }) => {
  const [r] = await db.query(
    "INSERT INTO vehicles (customer_id, make, model, year, license_plate, color, mileage, vin) VALUES (?,?,?,?,?,?,?,?)",
    [customer_id, make, model, year, license_plate, color||null, mileage||null, vin||null]);
  return r.insertId;
};

const findByCustomer = async (customer_id) => {
  const [rows] = await db.query("SELECT * FROM vehicles WHERE customer_id = ? ORDER BY created_at DESC", [customer_id]);
  return rows;
};

const findById = async (id) => {
  const [rows] = await db.query("SELECT * FROM vehicles WHERE id = ?", [id]);
  return rows[0];
};

const findByPlate = async (plate) => {
  const [rows] = await db.query("SELECT * FROM vehicles WHERE license_plate = ?", [plate]);
  return rows[0];
};

module.exports = { create, findByCustomer, findById, findByPlate };
