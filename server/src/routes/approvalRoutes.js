const express = require("express");
const router = express.Router();
const approvalController = require("../controllers/approvalController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.post(
  "/request",
  authMiddleware,
  roleMiddleware(["Admin", "Manager"]),
  approvalController.requestApproval
);

router.post(
  "/:id/respond",
  authMiddleware,
  roleMiddleware(["Admin", "Manager", "Client"]),
  approvalController.respondToApproval
);

router.get(
  "/",
  authMiddleware,
  approvalController.getApprovals
);

module.exports = router;
