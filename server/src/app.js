const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

const userRoutes = require("./routes/userRoutes");
const roleRoutes = require("./routes/roleRoutes");
const clientRoutes = require("./routes/clientRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const taskRoutes = require("./routes/taskRoutes");
const timesheetRoutes = require("./routes/timesheetRoutes");
const projectRoutes = require("./routes/projectRoutes");
const projectGroupRoutes = require("./routes/projectGroupRoutes");
const issueRoutes = require("./routes/issueRoutes");
const reportsRoutes = require("./routes/reportsRoutes");
const attachmentRoutes = require("./routes/attachmentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const milestoneRoutes = require("./routes/milestoneRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const organizationRoutes = require("./routes/organizationRoutes");
const taskListRoutes = require("./routes/taskListRoutes");
const searchRoutes = require("./routes/searchRoutes");
const approvalRoutes = require("./routes/approvalRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const sprintRoutes = require("./routes/sprintRoutes");
const customFieldRoutes = require("./routes/customFieldRoutes");
const forumPostRoutes = require("./routes/forumPostRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const errorHandler = require("./middleware/errorHandler");
const { apiRateLimit } = require("./middleware/rateLimit");

const app = express();

// Required for Render/Heroku — they sit behind a reverse proxy
app.set("trust proxy", 1);

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000"];

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));

app.get("/", (_req, res) => {
  res.json({ message: "Milta Task System API Running" });
});

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/api", apiRateLimit);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/timesheets", timesheetRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/project-groups", projectGroupRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/attachments", attachmentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/milestones", milestoneRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/task-lists", taskListRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/approvals", approvalRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/sprints", sprintRoutes);
app.use("/api/custom-fields", customFieldRoutes);
app.use("/api/forum-posts", forumPostRoutes);
app.use("/api/announcements", announcementRoutes);

app.use(errorHandler);

module.exports = app;
