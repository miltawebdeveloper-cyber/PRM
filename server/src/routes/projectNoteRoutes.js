const express = require("express");
const router = express.Router({ mergeParams: true });
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const ctrl = require("../controllers/projectNoteController");

const staff = roleMiddleware(["Admin", "Manager", "Employee"]);
const managers = roleMiddleware(["Admin", "Manager"]);

router.get("/", authMiddleware, staff, ctrl.getNotes);
router.post("/", authMiddleware, managers, ctrl.createNote);
router.patch("/:noteId", authMiddleware, managers, ctrl.updateNote);
router.delete("/:noteId", authMiddleware, managers, ctrl.deleteNote);

module.exports = router;
