const express = require("express");
const router  = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const notificationCtrl = require("../controllers/notificationController");

router.get("/",            authMiddleware, notificationCtrl.getMyNotifications);
router.get("/unread",      authMiddleware, notificationCtrl.getUnreadCount);
router.patch("/read-all",  authMiddleware, notificationCtrl.markAllAsRead);
router.patch("/:id/read",  authMiddleware, notificationCtrl.markAsRead);
router.delete("/:id",      authMiddleware, notificationCtrl.deleteNotification);

module.exports = router;
