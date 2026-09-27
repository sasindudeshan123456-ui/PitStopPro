const router = require("express").Router();
const c = require("../controllers/notificationsController");
const { authenticate } = require("../middleware/auth");
router.use(authenticate);
router.get("/", c.getMyNotifications);
router.patch("/:id/read", c.markRead);
router.patch("/read-all", c.markAllRead);
module.exports = router;
