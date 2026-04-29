const express = require("express");
const router  = express.Router();

const authMiddleware  = require("../middleware/authMiddleware");
const roleMiddleware  = require("../middleware/roleMiddleware");
const validate        = require("../middleware/validateRequest");
const milestoneCtrl   = require("../controllers/milestoneController");

const createSchema = {
  title: { required: true, type: "string", minLength: 2, maxLength: 200 },
};

router.post(
  "/",
  authMiddleware,
  roleMiddleware(["Admin", "Manager"]),
  validate(createSchema),
  milestoneCtrl.createMilestone
);

router.get(
  "/",
  authMiddleware,
  roleMiddleware(["Admin", "Manager", "Employee"]),
  milestoneCtrl.getAllMilestones
);

router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware(["Admin", "Manager"]),
  milestoneCtrl.updateMilestone
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["Admin", "Manager"]),
  milestoneCtrl.deleteMilestone
);

module.exports = router;
