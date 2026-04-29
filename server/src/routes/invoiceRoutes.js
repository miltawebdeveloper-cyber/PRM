const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const invoiceController = require("../controllers/invoiceController");

router.get(
  "/",
  authMiddleware,
  roleMiddleware(["Admin", "Manager"]),
  invoiceController.getAllInvoices
);

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware(["Admin", "Manager"]),
  invoiceController.getInvoiceById
);

router.patch(
  "/:id/status",
  authMiddleware,
  roleMiddleware(["Admin"]),
  invoiceController.updateInvoiceStatus
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["Admin"]),
  invoiceController.deleteInvoice
);

module.exports = router;
