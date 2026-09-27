const router = require("express").Router();
const { login, register, staffRegister, me } = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
router.post("/login", login);
router.post("/register", register);
router.post("/staff-register", staffRegister);
router.get("/me", authenticate, me);
module.exports = router;
