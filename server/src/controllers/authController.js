const authService = require("../services/authService");

exports.signup = async (_req, res) => {
  return res
    .status(403)
    .json({ message: "Self signup is disabled. Admin must create employee/client accounts." });
};

exports.login = async (req, res) => {
  try {
    const result = await authService.login(req.body || {});
    return res.json(result);
  } catch (error) {
    console.error("Login failed:", error);
    return res.status(error.status || 500).json({ message: error.message || "Login failed" });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const result = await authService.forgotPassword(req.body?.email);
    return res.json(result);
  } catch (error) {
    console.error("Forgot password failed:", error);
    return res.status(error.status || 500).json({ message: error.message || "Failed to process request" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const result = await authService.resetPassword(req.body || {});
    return res.json(result);
  } catch (error) {
    console.error("Reset password failed:", error);
    return res.status(error.status || 500).json({ message: error.message || "Failed to reset password" });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await authService.getCurrentUser(req.user.id);
    return res.json({ user });
  } catch (error) {
    console.error("Fetch current user failed:", error);
    return res.status(error.status || 500).json({ message: error.message || "Failed to fetch user" });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const result = await authService.changePassword({
      userId: req.user.id,
      currentPassword: req.body?.currentPassword,
      newPassword: req.body?.newPassword,
    });
    return res.json(result);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message || "Failed to change password" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const result = await authService.updateProfile({
      userId: req.user.id,
      name: req.body?.name,
      email: req.body?.email,
    });
    return res.json(result);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message || "Failed to update profile" });
  }
};
