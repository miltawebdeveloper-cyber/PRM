const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const sprintController = require("../controllers/sprintController");

router.get("/", authMiddleware, sprintController.getSprints);
router.post("/", authMiddleware, roleMiddleware(["Admin", "Manager"]), sprintController.createSprint);
router.get("/backlog", authMiddleware, sprintController.getBacklog);
router.get("/:id/burndown", authMiddleware, sprintController.getBurndown);
router.post("/:id/tasks", authMiddleware, roleMiddleware(["Admin", "Manager"]), sprintController.addTaskToSprint);
router.delete("/:id/tasks/:taskId", authMiddleware, roleMiddleware(["Admin", "Manager"]), sprintController.removeTaskFromSprint);
router.put("/:id", authMiddleware, roleMiddleware(["Admin", "Manager"]), sprintController.updateSprint);
router.delete("/:id", authMiddleware, roleMiddleware(["Admin", "Manager"]), sprintController.deleteSprint);
router.patch("/:id/status", authMiddleware, roleMiddleware(["Admin", "Manager"]), sprintController.updateSprintStatus);

module.exports = router;
