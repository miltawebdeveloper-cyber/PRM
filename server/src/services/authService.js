const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User, Role, Client } = require("../models");
const { logActivity } = require("./auditLogService");

async function login({ email, username, password }) {
  if ((!email && !username) || !password) {
    const error = new Error("Email or username, and password are required");
    error.status = 400;
    throw error;
  }

  const where = email ? { email } : { username };
  const user = await User.findOne({
    where,
    include: [
      { model: Role, attributes: ["id", "name", "permissions"] },
      { model: Client, as: "ClientAccount", attributes: ["id", "name", "client_code"] }
    ],
  });

  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }
  if (!user.is_active) {
    const error = new Error("User is inactive. Contact admin.");
    error.status = 403;
    throw error;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    const error = new Error("Invalid password");
    error.status = 401;
    throw error;
  }

  const token = jwt.sign(
    { 
      id: user.id, 
      role: user.Role?.name,
      permissions: user.Role?.permissions || {},
      organizationId: user.organizationId
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  await logActivity({
    actorId: user.id,
    action: "login",
    entityType: "user",
    entityId: user.id,
    message: `${user.name || user.username || "User"} logged in`,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.Role?.name || null,
      permissions: user.Role?.permissions || {},
      organizationId: user.organizationId,
      client: user.ClientAccount
        ? {
            id: user.ClientAccount.id,
            name: user.ClientAccount.name,
            client_code: user.ClientAccount.client_code,
          }
        : null,
    },
  };
}

async function forgotPassword(email) {
  if (!email) {
    const error = new Error("Email is required");
    error.status = 400;
    throw error;
  }

  const user = await User.findOne({ where: { email } });
  if (!user) {
    const error = new Error("No account found with that email");
    error.status = 404;
    throw error;
  }

  const token = crypto.randomBytes(32).toString("hex");
  user.reset_token = token;
  user.reset_token_expires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  return {
    message: "Password reset token generated. Share this token with the user to complete the reset.",
    reset_token: token,
    expires_in: "1 hour",
  };
}

async function resetPassword({ token, newPassword }) {
  if (!token || !newPassword) {
    const error = new Error("Token and newPassword are required");
    error.status = 400;
    throw error;
  }
  if (newPassword.length < 6) {
    const error = new Error("Password must be at least 6 characters");
    error.status = 400;
    throw error;
  }

  const user = await User.findOne({ where: { reset_token: token } });
  if (!user) {
    const error = new Error("Invalid or expired reset token");
    error.status = 400;
    throw error;
  }
  if (new Date() > new Date(user.reset_token_expires)) {
    const error = new Error("Reset token has expired. Please request a new one.");
    error.status = 400;
    throw error;
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.reset_token = null;
  user.reset_token_expires = null;
  await user.save();

  await logActivity({
    actorId: user.id,
    action: "password_reset",
    entityType: "user",
    entityId: user.id,
    message: `${user.name || user.username || "User"} reset password`,
  });

  return { message: "Password reset successfully. You can now log in with your new password." };
}

async function getCurrentUser(userId) {
  const user = await User.findByPk(userId, {
    attributes: ["id", "name", "username", "email", "hourly_rate", "is_active"],
    include: [
      { model: Role, attributes: ["name", "permissions"] },
      { model: Client, as: "ClientAccount", attributes: ["id", "name", "client_code"] },
    ],
  });

  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    hourly_rate: user.hourly_rate,
    is_active: user.is_active,
    role: user.Role?.name || null,
    permissions: user.Role?.permissions || {},
    organizationId: user.organizationId,
    client: user.ClientAccount
      ? {
          id: user.ClientAccount.id,
          name: user.ClientAccount.name,
          client_code: user.ClientAccount.client_code,
        }
      : null,
  };
}

async function changePassword({ userId, currentPassword, newPassword }) {
  if (!currentPassword || !newPassword) {
    const error = new Error("Current password and new password are required");
    error.status = 400;
    throw error;
  }
  if (newPassword.length < 6) {
    const error = new Error("New password must be at least 6 characters");
    error.status = 400;
    throw error;
  }

  const user = await User.findByPk(userId);
  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) {
    const error = new Error("Current password is incorrect");
    error.status = 401;
    throw error;
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  await logActivity({
    actorId: userId,
    action: "password_changed",
    entityType: "user",
    entityId: userId,
    message: `${user.name || user.username} changed their password`,
  });

  return { message: "Password changed successfully" };
}

async function updateProfile({ userId, name, email }) {
  const user = await User.findByPk(userId);
  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  if (email && email !== user.email) {
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      const error = new Error("Email already in use");
      error.status = 409;
      throw error;
    }
    user.email = email;
  }

  if (name && name.trim()) user.name = name.trim();
  await user.save();

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    message: "Profile updated successfully",
  };
}

module.exports = {
  login,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  changePassword,
  updateProfile,
};
