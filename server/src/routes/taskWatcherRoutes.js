const express = require("express");
const router = express.Router({ mergeParams: true });
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const ctrl = require("../controllers/taskWatcherController");

const staff = roleMiddleware(["Admin", "Manager", "Employee"]);

router.get("/", authMiddleware, staff, ctrl.getWatchers);
router.post("/", authMiddleware, staff, ctrl.watchTask);
router.delete("/", authMiddleware, staff, ctrl.unwatchTask);

module.exports = router;
