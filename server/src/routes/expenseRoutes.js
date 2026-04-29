const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const expenseController = require("../controllers/expenseController");

router.get("/", authMiddleware, expenseController.getExpenses);
router.post("/", authMiddleware, roleMiddleware(["Admin", "Manager"]), expenseController.createExpense);
router.put("/:id", authMiddleware, roleMiddleware(["Admin", "Manager"]), expenseController.updateExpense);
router.delete("/:id", authMiddleware, roleMiddleware(["Admin"]), expenseController.deleteExpense);

module.exports = router;
