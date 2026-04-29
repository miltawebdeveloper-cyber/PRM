const bcrypt = require("bcryptjs");
const { User, Role, Client, Notification } = require("../models");
const { sendWelcomeEmail } = require("../services/emailService");

exports.createUser = async (req, res) => {
  try {
    const { name, username, email, password, role_name, hourly_rate, clientId } = req.body || {};

    if (!name || !username || !email || !password || !role_name) {
      return res.status(400).json({
        message: "name, username, email, password and role_name are required",
      });
    }

    if (!["Employee", "Manager", "Client"].includes(role_name)) {
      return res
        .status(400)
        .json({ message: "role_name must be Employee, Manager, or Client" });
    }

    const role = await Role.findOne({ where: { name: role_name } });
    if (!role) return res.status(400).json({ message: "Role does not exist in system" });

    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      return res.status(409).json({ message: "Username already in use" });
    }

    const hashed = await bcrypt.hash(password, 10);

    let linkedClient = null;
    if (role_name === "Client") {
      if (!clientId) {
        return res.status(400).json({ message: "clientId is required for Client users" });
      }
      linkedClient = await Client.findByPk(clientId);
      if (!linkedClient) {
        return res.status(404).json({ message: "Linked client not found" });
      }
      const existingClientUser = await User.findOne({ where: { clientId: linkedClient.id } });
      if (existingClientUser) {
        return res.status(409).json({ message: "Login already exists for this client" });
      }
    }

    const user = await User.create({
      name,
      username,
      email,
      password: hashed,
      roleId: role.id,
      hourly_rate: hourly_rate || null,
      is_active: true,
      clientId: role_name === "Client" ? linkedClient.id : null,
    });

    const loginUrl = process.env.BASE_URL || "http://localhost:5000";

    // Send welcome email with credentials (non-blocking)
    sendWelcomeEmail({ name, email, username, password, role: role.name, loginUrl }).catch(
      (err) => console.error("[Welcome email failed]", err.message)
    );

    // Create in-app welcome notification
    Notification.create({
      userId: user.id,
      type: "System",
      title: "Welcome to Milta PRM",
      message: `Your ${role.name} account has been created. Log in at ${loginUrl} with username: ${username}`,
      isRead: false,
    }).catch((err) => console.error("[Welcome notification failed]", err.message));

    return res.status(201).json({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      hourly_rate: user.hourly_rate,
      is_active: user.is_active,
      role: role.name,
      client: linkedClient
        ? { id: linkedClient.id, name: linkedClient.name, client_code: linkedClient.client_code }
        : null,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to create user" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password"] },
      include: [
        { model: Role, attributes: ["id", "name"] },
        { model: Client, as: "ClientAccount", attributes: ["id", "name", "client_code"] },
      ],
    });

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ["password"] },
      include: [
        { model: Role, attributes: ["id", "name"] },
        { model: Client, as: "ClientAccount", attributes: ["id", "name", "client_code"] },
      ],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const deleted = await User.destroy({ where: { id: req.params.id } });

    if (!deleted) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete user" });
  }
};

exports.updateUserActiveStatus = async (req, res) => {
  try {
    const { is_active } = req.body || {};
    if (typeof is_active !== "boolean") {
      return res.status(400).json({ message: "is_active must be boolean" });
    }

    const user = await User.findByPk(req.params.id, { include: Role });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.Role?.name === "Admin") {
      return res.status(400).json({ message: "Admin status cannot be changed" });
    }

    user.is_active = is_active;
    await user.save();

    return res.json({
      message: "User status updated",
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        is_active: user.is_active,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update user status" });
  }
};
