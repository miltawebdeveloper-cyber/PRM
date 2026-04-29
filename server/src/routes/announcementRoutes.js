const express = require("express");
const router = express.Router();
const announcementController = require("../controllers/announcementController");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);
router.route("/").get(announcementController.getAnnouncements).post(announcementController.createAnnouncement);

module.exports = router;
