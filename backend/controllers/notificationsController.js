const notificationsModel = require("../models/notificationsModel");

const getMyNotifications = async (req, res) => {
  try {
    const notifications = await notificationsModel.getByUser(req.user.id);
    const unreadCount = await notificationsModel.getUnreadCount(req.user.id);
    res.json({ notifications, unreadCount });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const markRead = async (req, res) => {
  try {
    await notificationsModel.markRead(req.params.id, req.user.id);
    res.json({ message: "Marked as read" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const markAllRead = async (req, res) => {
  try {
    await notificationsModel.markAllRead(req.user.id);
    res.json({ message: "All marked as read" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getMyNotifications, markRead, markAllRead };
