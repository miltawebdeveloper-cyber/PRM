const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const timesheetController = require("../controllers/timesheetController");

router.post(
  "/start",
  authMiddleware,
  roleMiddleware(["Employee", "Manager", "Admin"]),
  timesheetController.startTimer
);

router.post(
  "/:id/stop",
  authMiddleware,
  roleMiddleware(["Employee", "Manager", "Admin"]),
  timesheetController.stopTimer
);

router.get(
  "/my",
  authMiddleware,
  roleMiddleware(["Employee", "Manager", "Admin"]),
  timesheetController.getMyTimesheets
);

router.get(
  "/summary",
  authMiddleware,
  roleMiddleware(["Employee", "Manager", "Admin"]),
  timesheetController.getTimesheetSummary
);

router.get(
  "/pending",
  authMiddleware,
  roleMiddleware(["Admin"]),
  timesheetController.getPendingApprovals
);

router.patch(
  "/:id/review",
  authMiddleware,
  roleMiddleware(["Admin"]),
  timesheetController.reviewTimesheet
);

module.exports = router;
