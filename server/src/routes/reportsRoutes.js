const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const reportsController = require("../controllers/reportsController");

router.get(
  "/timesheets",
  authMiddleware,
  roleMiddleware(["Admin", "Manager"]),
  reportsController.getTimesheetReport
);

router.get(
  "/projects",
  authMiddleware,
  roleMiddleware(["Admin", "Manager"]),
  reportsController.getProjectReport
);

router.get(
  "/summary",
  authMiddleware,
  roleMiddleware(["Admin", "Manager"]),
  reportsController.getSummary
);

router.get(
  "/utilization",
  authMiddleware,
  roleMiddleware(["Admin", "Manager"]),
  reportsController.getUtilizationReport
);

router.get(
  "/profitability",
  authMiddleware,
  roleMiddleware(["Admin", "Manager"]),
  reportsController.getProfitabilityReport
);

router.get(
  "/heatmap",
  authMiddleware,
  roleMiddleware(["Admin", "Manager"]),
  reportsController.getHeatmapReport
);

module.exports = router;
