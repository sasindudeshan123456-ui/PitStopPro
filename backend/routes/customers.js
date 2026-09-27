const router = require("express").Router();
const c = require("../controllers/customerController");
const { authenticate, authorize } = require("../middleware/auth");

router.use(authenticate);

// Public / Customer store & catalog
router.get("/store/services", c.getStoreServices);
router.get("/store/items", c.getStoreItems);
router.post("/store/direct-buy", authorize("customer"), c.directBuyItems);

// Customer profile management
router.put("/profile/me", authorize("customer"), c.updateMyProfile);
router.delete("/profile/me", authorize("customer"), c.deleteMyAccount);

// Customer management
router.get("/search", authorize("advisor", "manager", "cashier"), c.search);
router.get("/", authorize("advisor", "manager", "cashier"), c.getAll);
router.get("/:id", c.getOne);
router.post("/:id/vehicles", authorize("advisor", "manager", "customer"), c.addVehicle);

module.exports = router;
