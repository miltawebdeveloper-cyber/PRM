const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const projectController = require("../controllers/projectController");

// Templates (must be before /:id)
router.get(
  "/templates",
  authMiddleware,
  roleMiddleware(["Admin", "Manager"]),
  projectController.getProjectTemplates
);

router.post(
  "/from-template/:templateId",
  authMiddleware,
  roleMiddleware(["Admin", "Manager"]),
  projectController.createFromTemplate
);

router.post(
  "/",
  authMiddleware,
  roleMiddleware(["Admin", "Manager"]),
  projectController.createProject
);

router.get(
  "/",
  authMiddleware,
  roleMiddleware(["Admin", "Manager", "Employee", "Client"]),
  projectController.getProjects
);

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware(["Admin", "Manager", "Employee", "Client"]),
  projectController.getProjectById
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["Admin", "Manager"]),
  projectController.updateProject
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["Admin"]),
  projectController.deleteProject
);

router.patch(
  "/:id/status",
  authMiddleware,
  roleMiddleware(["Admin", "Manager"]),
  projectController.updateProjectStatus
);

router.post(
  "/:id/save-as-template",
  authMiddleware,
  roleMiddleware(["Admin", "Manager"]),
  projectController.saveAsTemplate
);

// Project Notes
router.get("/:id/notes", authMiddleware, projectController.getProjectNotes);
router.post("/:id/notes", authMiddleware, projectController.addProjectNote);

// Project Budget
router.get(
  "/:id/budget",
  authMiddleware,
  roleMiddleware(["Admin", "Manager"]),
  projectController.getProjectBudget
);

// Project Activity Feed
router.get(
  "/:id/activity",
  authMiddleware,
  roleMiddleware(["Admin", "Manager"]),
  projectController.getProjectActivity
);

module.exports = router;
