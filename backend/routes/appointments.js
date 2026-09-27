const router = require("express").Router();
const c = require("../controllers/appointmentController");
const { authenticate, authorize } = require("../middleware/auth");

router.use(authenticate);

router.post("/", authorize("customer"), c.create);
router.get("/my", authorize("customer"), c.getMyAppointments);
router.get("/", authorize("manager", "advisor"), c.getAllAppointments);
router.put("/:id", authorize("customer", "manager", "advisor"), c.update);
router.patch("/:id/cancel", authorize("customer", "manager", "advisor"), c.cancel);
router.delete("/:id", authorize("customer", "manager", "advisor"), c.cancel);
router.patch("/:id/status", authorize("manager", "advisor", "customer"), c.updateStatus);

module.exports = router;
