const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const projectGroupController = require("../controllers/projectGroupController");

router.get(
  "/",
  authMiddleware,
  roleMiddleware(["Admin", "Manager", "Employee", "Client"]),
  projectGroupController.getProjectGroups
);

router.get(
  "/stats",
  authMiddleware,
  roleMiddleware(["Admin", "Manager", "Employee", "Client"]),
  projectGroupController.getProjectGroupStats
);

router.post(
  "/",
  authMiddleware,
  roleMiddleware(["Admin", "Manager"]),
  projectGroupController.createProjectGroup
);

module.exports = router;
