const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const userController = require("../controllers/userController");

router.post(
  "/",
  authMiddleware,
  roleMiddleware(["Admin"]),
  userController.createUser
);

router.get(
  "/",
  authMiddleware,
  roleMiddleware(["Admin", "Manager"]),
  userController.getAllUsers
);

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware(["Admin", "Manager"]),
  userController.getUserById
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["Admin"]),
  userController.deleteUser
);

router.patch(
  "/:id/status",
  authMiddleware,
  roleMiddleware(["Admin"]),
  userController.updateUserActiveStatus
);

module.exports = router;
