const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const validate = require("../middleware/validateRequest");
const taskListCtrl = require("../controllers/taskListController");

const createSchema = {
  name: { required: true, type: "string", minLength: 1, maxLength: 200 },
};

const ALL_STAFF = ["Admin", "Manager", "Employee"];

router.post(
  "/",
  authMiddleware,
  roleMiddleware(["Admin", "Manager"]),
  validate(createSchema),
  taskListCtrl.createTaskList
);

router.get(
  "/",
  authMiddleware,
  roleMiddleware(ALL_STAFF),
  taskListCtrl.getAllTaskLists
);

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware(ALL_STAFF),
  taskListCtrl.getTaskListById
);

router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware(["Admin", "Manager"]),
  taskListCtrl.updateTaskList
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["Admin", "Manager"]),
  taskListCtrl.deleteTaskList
);

module.exports = router;
