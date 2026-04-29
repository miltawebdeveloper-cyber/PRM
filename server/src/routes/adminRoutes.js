const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const adminController = require("../controllers/adminController");
const { runReminders } = require("../jobs/deadlineReminder");
const { sendDeadlineAlertEmail } = require("../services/emailService");

router.get(
  "/dashboard",
  authMiddleware,
  roleMiddleware(["Admin"]),
  adminController.getDashboard
);

router.get(
  "/stats",
  authMiddleware,
  roleMiddleware(["Admin"]),
  adminController.getStats
);

router.get(
  "/invoice-settings",
  authMiddleware,
  roleMiddleware(["Admin"]),
  adminController.getInvoiceSettings
);

router.put(
  "/invoice-settings",
  authMiddleware,
  roleMiddleware(["Admin"]),
  adminController.updateInvoiceSettings
);

router.get(
  "/approvals",
  authMiddleware,
  roleMiddleware(["Admin"]),
  adminController.getApprovalPanel
);

router.get(
  "/invoice-preview",
  authMiddleware,
  roleMiddleware(["Admin"]),
  adminController.getInvoicePreview
);

router.post(
  "/invoices/generate",
  authMiddleware,
  roleMiddleware(["Admin"]),
  adminController.generateInvoices
);

router.get(
  "/invoices",
  authMiddleware,
  roleMiddleware(["Admin"]),
  adminController.getInvoices
);

// Test: send a sample email to the logged-in admin
router.post(
  "/test-email",
  authMiddleware,
  roleMiddleware(["Admin"]),
  async (req, res) => {
    try {
      await sendDeadlineAlertEmail({
        userName: req.user.name || "Admin",
        email: req.user.email,
        taskName: "Test Task — Email Verification",
        taskId: "TEST-001",
        dueDate: new Date().toISOString().slice(0, 10),
      });
      return res.json({ message: `Test email sent to ${req.user.email}` });
    } catch (err) {
      return res.status(500).json({ message: "Email failed", error: err.message });
    }
  }
);

// Test: manually trigger the full reminder job right now
router.post(
  "/test-reminders",
  authMiddleware,
  roleMiddleware(["Admin"]),
  async (req, res) => {
    try {
      await runReminders();
      return res.json({ message: "Reminder job ran — check server console for details" });
    } catch (err) {
      return res.status(500).json({ message: "Reminder job failed", error: err.message });
    }
  }
);

module.exports = router;
