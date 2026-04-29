const {
  sequelize,
  Announcement,
  ForumPost,
  CustomField,
  Sprint,
  Expense,
  ProjectNote,
  TaskWatcher,
  Approval,
  WorkflowRule,
  TaskList,
  AuditLog,
  Milestone,
  Notification,
  Attachment,
  Issue,
  ProjectGroup,
  Project,
  Invoice,
  Timesheet,
  TaskComment,
  SubTask,
  Task,
  InvoiceSetting,
  Category,
  Client,
  // We keep Role, User, Organization intact for login
} = require("../models");

async function eraseData() {
  try {
    await sequelize.authenticate();
    console.log("Connected to database...");

    // Disable foreign key checks for PostgreSQL
    // In PostgreSQL, to truncate multiple tables with foreign keys, it's easiest to CASCADE
    // Wait, since we're using destroy(), Sequelize handles deletion if we delete in the right order,
    // but destroying individually might violate constraints.
    // Let's drop and re-sync those specific models, or truncate cascade.

    console.log("Erasing data from models...");

    const modelsToClear = [
      Announcement, ForumPost, CustomField, Sprint, Expense, ProjectNote,
      TaskWatcher, Approval, WorkflowRule, TaskList, AuditLog, Milestone,
      Notification, Attachment, Issue, ProjectGroup, Project, Invoice,
      Timesheet, TaskComment, SubTask, Task, InvoiceSetting, Category, Client
    ];

    // Using force: false and truncate: true cascade where supported
    // But since order matters, let's execute raw SQL to truncate cascade all these tables
    const tableNames = modelsToClear.map(model => `"${model.tableName}"`).join(", ");

    await sequelize.query(`TRUNCATE TABLE ${tableNames} CASCADE;`);

    console.log("Data erased successfully (excluding Users, Roles, Organizations).");
    process.exit(0);
  } catch (err) {
    console.error("Error erasing data:", err);
    process.exit(1);
  }
}

eraseData();
