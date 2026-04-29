const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const RoleModel = require("./Role");
const UserModel = require("./User");
const ClientModel = require("./Client");
const CategoryModel = require("./Category");
const InvoiceSettingModel = require("./InvoiceSetting");
const InvoiceModel = require("./Invoice");
const TaskModel = require("./Task");
const SubTaskModel = require("./SubTask");
const TaskCommentModel = require("./TaskComment");
const TimesheetModel = require("./Timesheet");
const ProjectModel = require("./Project");
const ProjectGroupModel = require("./ProjectGroup");
const IssueModel = require("./Issue");
const AttachmentModel = require("./Attachment");
const NotificationModel = require("./Notification");
const MilestoneModel = require("./Milestone");
const AuditLogModel = require("./AuditLog");
const OrganizationModel = require("./Organization");
const TaskListModel = require("./TaskList");
const WorkflowRuleModel = require("./WorkflowRule");
const ApprovalModel = require("./Approval");
const TaskWatcherModel = require("./TaskWatcher");
const ProjectNoteModel = require("./ProjectNote");
const ExpenseModel = require("./Expense");
const SprintModel = require("./Sprint");
const CustomFieldModel = require("./CustomField");
const ForumPostModel = require("./ForumPost");
const AnnouncementModel = require("./Announcement");

const Role = RoleModel(sequelize, DataTypes);
const User = UserModel(sequelize, DataTypes);
const Client = ClientModel(sequelize, DataTypes);
const Category = CategoryModel(sequelize, DataTypes);
const InvoiceSetting = InvoiceSettingModel(sequelize, DataTypes);
const Task = TaskModel(sequelize, DataTypes);
const SubTask = SubTaskModel(sequelize, DataTypes);
const TaskComment = TaskCommentModel(sequelize, DataTypes);
const Timesheet = TimesheetModel(sequelize, DataTypes);
const Project = ProjectModel(sequelize, DataTypes);
const ProjectGroup = ProjectGroupModel(sequelize, DataTypes);
const Invoice = InvoiceModel(sequelize, DataTypes);
const Issue = IssueModel(sequelize, DataTypes);
const Attachment = AttachmentModel(sequelize, DataTypes);
const Notification = NotificationModel(sequelize, DataTypes);
const Milestone = MilestoneModel(sequelize, DataTypes);
const AuditLog = AuditLogModel(sequelize, DataTypes);
const Organization = OrganizationModel(sequelize, DataTypes);
const TaskList = TaskListModel(sequelize, DataTypes);
const WorkflowRule = WorkflowRuleModel(sequelize, DataTypes);
const Approval = ApprovalModel(sequelize, DataTypes);
const TaskWatcher = TaskWatcherModel(sequelize, DataTypes);
const ProjectNote = ProjectNoteModel(sequelize, DataTypes);
const Expense = ExpenseModel(sequelize, DataTypes);
const Sprint = SprintModel(sequelize, DataTypes);
const CustomField = CustomFieldModel(sequelize, DataTypes);
const ForumPost = ForumPostModel(sequelize, DataTypes);
const Announcement = AnnouncementModel(sequelize, DataTypes);

Role.hasMany(User, { foreignKey: "roleId" });
User.belongsTo(Role, { foreignKey: "roleId" });

Client.hasMany(User, { foreignKey: "clientId", as: "ClientUsers" });
User.belongsTo(Client, { foreignKey: "clientId", as: "ClientAccount" });

Client.hasMany(Task, { foreignKey: "clientId" });
Task.belongsTo(Client, { foreignKey: "clientId" });

Category.hasMany(Task, { foreignKey: "categoryId" });
Task.belongsTo(Category, { foreignKey: "categoryId" });

User.hasMany(Task, { foreignKey: "assigneeId", as: "AssignedTasks" });
Task.belongsTo(User, { foreignKey: "assigneeId", as: "Assignee" });

User.hasMany(Task, { foreignKey: "managerId", as: "ManagedTasks" });
Task.belongsTo(User, { foreignKey: "managerId", as: "Manager" });

User.hasMany(Project, { foreignKey: "createdById", as: "CreatedProjects" });
Project.belongsTo(User, { foreignKey: "createdById", as: "CreatedBy" });

Client.hasMany(Project, { foreignKey: "clientId", as: "Projects" });
Project.belongsTo(Client, { foreignKey: "clientId", as: "Client" });

ProjectGroup.hasMany(Project, { foreignKey: "projectGroupId", as: "Projects" });
Project.belongsTo(ProjectGroup, { foreignKey: "projectGroupId", as: "ProjectGroup" });

Project.hasMany(Task, { foreignKey: "projectId", as: "Tasks" });
Task.belongsTo(Project, { foreignKey: "projectId", as: "Project" });

Task.belongsTo(Task, { foreignKey: "predecessorTaskId", as: "PredecessorTask" });
Task.hasMany(Task, { foreignKey: "predecessorTaskId", as: "SuccessorTasks" });

Task.hasMany(SubTask, { foreignKey: "taskId", as: "SubTasks" });
SubTask.belongsTo(Task, { foreignKey: "taskId", as: "Task" });

Task.hasMany(TaskComment, { foreignKey: "taskId", as: "Comments" });
TaskComment.belongsTo(Task, { foreignKey: "taskId", as: "Task" });

User.hasMany(TaskComment, { foreignKey: "userId", as: "TaskComments" });
TaskComment.belongsTo(User, { foreignKey: "userId", as: "Author" });

Task.hasMany(Timesheet, { foreignKey: "taskId" });
Timesheet.belongsTo(Task, { foreignKey: "taskId" });

User.hasMany(Timesheet, { foreignKey: "employeeId", as: "TimeLogs" });
Timesheet.belongsTo(User, { foreignKey: "employeeId", as: "Employee" });

Client.hasMany(Invoice, { foreignKey: "clientId", as: "Invoices" });
Invoice.belongsTo(Client, { foreignKey: "clientId", as: "Client" });

Invoice.hasMany(Timesheet, { foreignKey: "invoiceId", as: "Entries" });
Timesheet.belongsTo(Invoice, { foreignKey: "invoiceId", as: "Invoice" });

User.hasMany(Issue, { foreignKey: "reporterId", as: "ReportedIssues" });
Issue.belongsTo(User, { foreignKey: "reporterId", as: "Reporter" });

User.hasMany(Issue, { foreignKey: "assigneeId", as: "AssignedIssues" });
Issue.belongsTo(User, { foreignKey: "assigneeId", as: "Assignee" });

Project.hasMany(Issue, { foreignKey: "projectId", as: "Issues" });
Issue.belongsTo(Project, { foreignKey: "projectId", as: "Project" });

Task.hasMany(Issue, { foreignKey: "taskId", as: "Issues" });
Issue.belongsTo(Task, { foreignKey: "taskId", as: "LinkedTask" });

User.hasMany(Attachment, { foreignKey: "uploadedById", as: "Uploads" });
Attachment.belongsTo(User, { foreignKey: "uploadedById", as: "UploadedBy" });
Task.hasMany(Attachment, { foreignKey: "taskId", as: "Attachments" });
Attachment.belongsTo(Task, { foreignKey: "taskId", as: "Task" });
Project.hasMany(Attachment, { foreignKey: "projectId", as: "Attachments" });
Attachment.belongsTo(Project, { foreignKey: "projectId", as: "Project" });
Issue.hasMany(Attachment, { foreignKey: "issueId", as: "Attachments" });
Attachment.belongsTo(Issue, { foreignKey: "issueId", as: "Issue" });

User.hasMany(Notification, { foreignKey: "userId", as: "Notifications" });
Notification.belongsTo(User, { foreignKey: "userId", as: "User" });

Project.hasMany(Milestone, { foreignKey: "projectId", as: "Milestones" });
Milestone.belongsTo(Project, { foreignKey: "projectId", as: "Project" });
User.hasMany(Milestone, { foreignKey: "createdById", as: "Milestones" });
Milestone.belongsTo(User, { foreignKey: "createdById", as: "CreatedBy" });

User.hasMany(AuditLog, { foreignKey: "actorId", as: "AuditEvents" });
AuditLog.belongsTo(User, { foreignKey: "actorId", as: "Actor" });
Task.hasMany(AuditLog, { foreignKey: "taskId", as: "Activity" });
AuditLog.belongsTo(Task, { foreignKey: "taskId", as: "Task" });
Project.hasMany(AuditLog, { foreignKey: "projectId", as: "Activity" });
AuditLog.belongsTo(Project, { foreignKey: "projectId", as: "Project" });

// Organization associations
Organization.hasMany(User, { foreignKey: "organizationId", as: "Members" });
User.belongsTo(Organization, { foreignKey: "organizationId", as: "Organization" });

Organization.hasMany(Project, { foreignKey: "organizationId", as: "Projects" });
Project.belongsTo(Organization, { foreignKey: "organizationId", as: "Organization" });

Organization.hasMany(Task, { foreignKey: "organizationId", as: "Tasks" });
Task.belongsTo(Organization, { foreignKey: "organizationId", as: "Organization" });

// TaskList associations
Project.hasMany(TaskList, { foreignKey: "projectId", as: "TaskLists" });
TaskList.belongsTo(Project, { foreignKey: "projectId", as: "Project" });

TaskList.hasMany(Task, { foreignKey: "taskListId", as: "Tasks" });
Task.belongsTo(TaskList, { foreignKey: "taskListId", as: "TaskList" });

Organization.hasMany(Approval, { foreignKey: "organizationId", as: "Approvals" });
Approval.belongsTo(Organization, { foreignKey: "organizationId", as: "Organization" });

User.hasMany(Approval, { foreignKey: "requestedBy", as: "RequestedApprovals" });
Approval.belongsTo(User, { foreignKey: "requestedBy", as: "Requester" });

User.hasMany(Approval, { foreignKey: "approvedBy", as: "SignedApprovals" });
Approval.belongsTo(User, { foreignKey: "approvedBy", as: "Approver" });

// TaskWatcher
Task.hasMany(TaskWatcher, { foreignKey: "taskId", as: "Watchers" });
TaskWatcher.belongsTo(Task, { foreignKey: "taskId", as: "Task" });
User.hasMany(TaskWatcher, { foreignKey: "userId", as: "WatchedTasks" });
TaskWatcher.belongsTo(User, { foreignKey: "userId", as: "User" });

// ProjectNote
Project.hasMany(ProjectNote, { foreignKey: "projectId", as: "Notes" });
ProjectNote.belongsTo(Project, { foreignKey: "projectId", as: "Project" });
User.hasMany(ProjectNote, { foreignKey: "createdById", as: "ProjectNotes" });
ProjectNote.belongsTo(User, { foreignKey: "createdById", as: "Author" });

// Expense
Project.hasMany(Expense, { foreignKey: "projectId", as: "Expenses" });
Expense.belongsTo(Project, { foreignKey: "projectId", as: "Project" });
User.hasMany(Expense, { foreignKey: "createdById", as: "Expenses" });
Expense.belongsTo(User, { foreignKey: "createdById", as: "CreatedBy" });

// Sprint
Project.hasMany(Sprint, { foreignKey: "projectId", as: "Sprints" });
Sprint.belongsTo(Project, { foreignKey: "projectId", as: "Project" });
User.hasMany(Sprint, { foreignKey: "createdById", as: "Sprints" });
Sprint.belongsTo(User, { foreignKey: "createdById", as: "CreatedBy" });
Sprint.hasMany(Task, { foreignKey: "sprintId", as: "Tasks" });
Task.belongsTo(Sprint, { foreignKey: "sprintId", as: "Sprint" });

// CustomField
User.hasMany(CustomField, { foreignKey: "createdById", as: "CustomFields" });
CustomField.belongsTo(User, { foreignKey: "createdById", as: "CreatedBy" });

// ForumPost
Project.hasMany(ForumPost, { foreignKey: "projectId", as: "ForumPosts" });
ForumPost.belongsTo(Project, { foreignKey: "projectId", as: "Project" });
User.hasMany(ForumPost, { foreignKey: "authorId", as: "ForumPosts" });
ForumPost.belongsTo(User, { foreignKey: "authorId", as: "Author" });

// Announcement
User.hasMany(Announcement, { foreignKey: "authorId", as: "Announcements" });
Announcement.belongsTo(User, { foreignKey: "authorId", as: "Author" });

module.exports = {
  sequelize,
  Role,
  User,
  Client,
  Category,
  InvoiceSetting,
  Task,
  SubTask,
  TaskComment,
  Timesheet,
  Invoice,
  Project,
  ProjectGroup,
  Issue,
  Attachment,
  Notification,
  Milestone,
  AuditLog,
  Organization,
  TaskList,
  WorkflowRule,
  Approval,
  TaskWatcher,
  ProjectNote,
  Expense,
  Sprint,
  CustomField,
  ForumPost,
  Announcement,
};
