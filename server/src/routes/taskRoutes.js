const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const taskController = require("../controllers/taskController");

router.post(
  "/",
  authMiddleware,
  roleMiddleware(["Manager", "Admin"]),
  taskController.createTask
);

router.get(
  "/",
  authMiddleware,
  roleMiddleware(["Manager", "Admin"]),
  taskController.getAllTasks
);

router.get(
  "/manager",
  authMiddleware,
  roleMiddleware(["Manager", "Admin"]),
  taskController.getManagerTasks
);

router.get(
  "/my",
  authMiddleware,
  roleMiddleware(["Employee", "Manager", "Admin"]),
  taskController.getEmployeeTasks
);

router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware(["Manager", "Admin"]),
  taskController.updateTask
);

router.patch(
  "/:id/status",
  authMiddleware,
  roleMiddleware(["Manager", "Admin"]),
  taskController.updateTaskProgress
);

router.get(
  "/:id/comments",
  authMiddleware,
  roleMiddleware(["Employee", "Manager", "Admin"]),
  taskController.getTaskComments
);

router.get(
  "/:id/activity",
  authMiddleware,
  roleMiddleware(["Employee", "Manager", "Admin"]),
  taskController.getTaskActivity
);

router.post(
  "/:id/comments",
  authMiddleware,
  roleMiddleware(["Employee", "Manager", "Admin"]),
  taskController.addTaskComment
);

// ✅ Watchers
router.get(
  "/:id/watchers",
  authMiddleware,
  taskController.getTaskWatchers
);

router.post(
  "/:id/watchers",
  authMiddleware,
  taskController.watchTask
);

router.delete(
  "/:id/watchers",
  authMiddleware,
  taskController.unwatchTask
);

router.get(
  "/:id/watchers/me",
  authMiddleware,
  taskController.isWatchingTask
);

module.exports = router;
