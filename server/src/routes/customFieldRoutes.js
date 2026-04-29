const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const ctrl = require("../controllers/customFieldController");

router.get("/", authMiddleware, roleMiddleware(["Admin", "Manager", "Employee"]), ctrl.getCustomFields);
router.post("/", authMiddleware, roleMiddleware(["Admin"]), ctrl.createCustomField);
router.patch("/:id", authMiddleware, roleMiddleware(["Admin"]), ctrl.updateCustomField);
router.delete("/:id", authMiddleware, roleMiddleware(["Admin"]), ctrl.deleteCustomField);

module.exports = router;
