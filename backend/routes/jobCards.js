const router = require("express").Router();
const c = require("../controllers/jobCardController");
const { authenticate, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");

router.use(authenticate);

router.get("/stats", c.getStats);
router.get("/", c.getAll);
router.post("/", authorize("advisor", "manager"), c.create);
router.get("/:id", c.getOne);
router.patch("/:id/status", authorize("supervisor", "manager", "advisor"), c.updateStatus);
router.delete("/:id", authorize("customer", "manager", "advisor"), c.deleteJobCard);
router.patch("/:id/customer-approve", authorize("customer", "manager"), c.customerApprove);
router.patch("/:id/customer-reject", authorize("customer", "manager"), c.customerReject);
router.post("/:id/images", authorize("advisor", "manager"), upload.array("images", 10), c.uploadImages);
router.get("/customer/:customer_id", c.getByCustomer);

module.exports = router;
