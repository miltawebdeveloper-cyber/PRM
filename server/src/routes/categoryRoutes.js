const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const categoryController = require("../controllers/categoryController");

// ✅ Create Category (Admin Only)
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["Admin"]),
  categoryController.createCategory
);

// ✅ Get All Categories
router.get(
  "/",
  authMiddleware,
  categoryController.getAllCategories
);

// ✅ Delete Category (Admin Only)
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["Admin"]),
  categoryController.deleteCategory
);

module.exports = router;