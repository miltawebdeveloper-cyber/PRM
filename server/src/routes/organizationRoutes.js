const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const validate = require("../middleware/validateRequest");
const orgCtrl = require("../controllers/organizationController");

const createSchema = {
  name: { required: true, type: "string", minLength: 2, maxLength: 200 },
  code: { required: true, type: "string", minLength: 2, maxLength: 20 },
};

const assignSchema = {
  userId: { required: true, type: "number" },
};

router.post(
  "/",
  authMiddleware,
  roleMiddleware(["Admin"]),
  validate(createSchema),
  orgCtrl.createOrganization
);

router.get(
  "/",
  authMiddleware,
  roleMiddleware(["Admin", "Manager"]),
  orgCtrl.getAllOrganizations
);

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware(["Admin", "Manager"]),
  orgCtrl.getOrganizationById
);

router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware(["Admin"]),
  orgCtrl.updateOrganization
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["Admin"]),
  orgCtrl.deleteOrganization
);

router.post(
  "/:id/members",
  authMiddleware,
  roleMiddleware(["Admin"]),
  validate(assignSchema),
  orgCtrl.assignMember
);

router.delete(
  "/:id/members/:userId",
  authMiddleware,
  roleMiddleware(["Admin"]),
  orgCtrl.removeMember
);

module.exports = router;
