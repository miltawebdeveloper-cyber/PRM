const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const { authRateLimit } = require("../middleware/rateLimit");

router.post("/signup", authController.signup);
router.post("/login", authRateLimit, authController.login);
router.get("/me", authMiddleware, authController.me);
router.post("/", authRateLimit, authController.login);
router.post("/forgot-password", authRateLimit, authController.forgotPassword);
router.post("/reset-password", authRateLimit, authController.resetPassword);
router.patch("/change-password", authMiddleware, authController.changePassword);
router.patch("/profile", authMiddleware, authController.updateProfile);

module.exports = router;
