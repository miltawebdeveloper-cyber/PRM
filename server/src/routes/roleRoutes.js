const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const roleController = require("../controllers/roleController");

// ✅ Create Role (Admin Only)
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["Admin"]),
  roleController.createRole
);

// ✅ Get All Roles
router.get(
  "/",
  authMiddleware,
  roleController.getAllRoles
);

// ✅ Update Role (Admin Only)
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware(["Admin"]),
  roleController.getRoleById
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["Admin"]),
  roleController.updateRole
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["Admin"]),
  roleController.deleteRole
);

module.exports = router;