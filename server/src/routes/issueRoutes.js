const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const validate = require("../middleware/validateRequest");
const issueController = require("../controllers/issueController");

const createSchema = {
  title: { required: true, type: "string", minLength: 3, maxLength: 200 },
};

router.post(
  "/",
  authMiddleware,
  roleMiddleware(["Admin", "Manager", "Employee"]),
  validate(createSchema),
  issueController.createIssue
);

router.get(
  "/",
  authMiddleware,
  roleMiddleware(["Admin", "Manager", "Employee"]),
  issueController.getAllIssues
);

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware(["Admin", "Manager", "Employee"]),
  issueController.getIssueById
);

router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware(["Admin", "Manager", "Employee"]),
  issueController.updateIssue
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["Admin", "Manager"]),
  issueController.deleteIssue
);

module.exports = router;
