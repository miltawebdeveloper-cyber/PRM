const path = require("path");
const dotenv = require("dotenv");
const express = require("express");

// Support both server/.env and server/src/.env
dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config({ path: path.resolve(__dirname, "src", ".env"), override: false });

const { Op } = require("sequelize");

const sequelize = require("./src/config/db");
const { Role, User } = require("./src/models");
const bcrypt = require("bcryptjs");
const http = require("http");
const { Server } = require("socket.io");
const app = require("./src/app");

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",")
      : ["http://localhost:3000"],
    credentials: true,
  },
});

// Attach io to app to use in routes
app.set("io", io);

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join-project", (projectId) => {
    socket.join(`project-${projectId}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});
const { startDeadlineReminderJob } = require("./src/jobs/deadlineReminder");

// Static files from React build (only when build folder exists — not needed when frontend is on Vercel)
const buildPath = path.join(__dirname, "../client/build");
const fs = require("fs");
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
  app.use((req, res, next) => {
    if (req.method === "GET") {
      res.sendFile(path.join(buildPath, "index.html"));
    } else {
      next();
    }
  });
}

const PORT = process.env.PORT || 5000;
const ADMIN_NAME = process.env.ADMIN_NAME || "System Admin";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@prm.local";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123";

async function ensureSystemSetup() {
  const requiredRoles = ["Admin", "Manager", "Employee", "Client"];
  for (const roleName of requiredRoles) {
    await Role.findOrCreate({ where: { name: roleName }, defaults: { name: roleName } });
  }

  const adminRole = await Role.findOne({ where: { name: "Admin" } });
  const existingAdmin = await User.findOne({
    where: { [Op.or]: [{ username: ADMIN_USERNAME }, { email: ADMIN_EMAIL }] },
  });
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await User.create({
      name: ADMIN_NAME,
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      password: hashedPassword,
      roleId: adminRole.id,
      is_active: true,
    });
  } else if (!existingAdmin.username) {
    existingAdmin.username = ADMIN_USERNAME;
    existingAdmin.is_active = true;
    await existingAdmin.save();
  }
}

sequelize
  .sync({ alter: process.env.NODE_ENV !== "production" })
  .then(async () => {
    await ensureSystemSetup();
    console.log("Database connected");

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    startDeadlineReminderJob();
  })
  .catch((err) => {
    console.error("DB connection failed", err);
    process.exit(1);
  });
