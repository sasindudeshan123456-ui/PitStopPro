const customerModel = require("../models/customerModel");
const vehicleModel = require("../models/vehicleModel");

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
module.exports = { search, getAll, getOne, addVehicle };
