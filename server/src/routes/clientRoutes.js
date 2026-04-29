const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const clientController = require("../controllers/clientController");

// ✅ Create Client (Admin Only)
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["Admin"]),
  clientController.createClient
);

// ✅ Get All Clients
router.get(
  "/",
  authMiddleware,
  roleMiddleware(["Admin", "Manager"]),
  clientController.getAllClients
);

// ✅ Client Portal Dashboard (Read-Only)
router.get(
  "/dashboard",
  authMiddleware,
  roleMiddleware(["Client"]),
  clientController.getClientDashboard
);

router.post(
  "/invoices/:id/pay",
  authMiddleware,
  roleMiddleware(["Client"]),
  clientController.payInvoice
);

// ✅ Delete Client (Admin Only)
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["Admin"]),
  clientController.deleteClient
);

module.exports = router;
