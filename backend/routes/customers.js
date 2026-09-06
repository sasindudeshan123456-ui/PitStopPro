const router = require("express").Router();
const { search, getAll, getOne, addVehicle } = require("../controllers/customerController");
const { authenticate, authorize } = require("../middleware/auth");
router.use(authenticate);
router.get("/", authorize("manager","advisor","cashier","supervisor"), getAll);
router.get("/search", authorize("manager","advisor","cashier","supervisor"), search);
router.get("/:id", authorize("manager","advisor","cashier","supervisor"), getOne);
router.post("/:id/vehicles", authorize("manager","advisor"), addVehicle);
module.exports = router;
