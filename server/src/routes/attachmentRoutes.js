const express = require("express");
const router  = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const upload          = require("../config/upload");
const attachmentCtrl  = require("../controllers/attachmentController");

const ALL_STAFF = ["Admin", "Manager", "Employee"];

router.post(
  "/",
  authMiddleware,
  roleMiddleware(ALL_STAFF),
  upload.single("file"),
  attachmentCtrl.uploadFile
);

router.get(
  "/",
  authMiddleware,
  roleMiddleware(ALL_STAFF),
  attachmentCtrl.getAttachments
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(ALL_STAFF),
  attachmentCtrl.deleteAttachment
);

module.exports = router;
