const router = require("express").Router();
const c = require("../controllers/managerController");
const { authenticate, authorize } = require("../middleware/auth");
router.use(authenticate, authorize("manager"));
router.get("/dashboard", c.getDashboard);
router.get("/approvals", c.getPendingApprovals);
router.patch("/approvals/:id/approve", c.approveJob);
router.patch("/approvals/:id/reject", c.rejectJob);
router.get("/staff", c.getAllStaff);
router.put("/staff/:id", c.updateUser);
module.exports = router;

