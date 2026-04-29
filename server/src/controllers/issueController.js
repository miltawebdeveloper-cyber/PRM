const { Issue, User, Project, Task } = require("../models");

const ALLOWED_STATUS = ["Open", "In Progress", "Resolved", "Closed"];
const ALLOWED_PRIORITY = ["Low", "Medium", "High", "Critical"];
const ALLOWED_TYPE = ["Bug", "Feature Request", "Improvement", "Question", "Other"];

function getIssueInclude() {
  return [
    { model: User, as: "Reporter", attributes: ["id", "name", "username"] },
    { model: User, as: "Assignee", attributes: ["id", "name", "username"], required: false },
    { model: Project, as: "Project", attributes: ["id", "project_code", "project_title"], required: false },
    { model: Task, as: "LinkedTask", attributes: ["id", "task_id", "task_name"], required: false },
  ];
}

exports.createIssue = async (req, res) => {
  try {
    const { title, description, type, status, priority, assigneeId, projectId, taskId } = req.body || {};

    if (status && !ALLOWED_STATUS.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }
    if (priority && !ALLOWED_PRIORITY.includes(priority)) {
      return res.status(400).json({ message: "Invalid priority value" });
    }
    if (type && !ALLOWED_TYPE.includes(type)) {
      return res.status(400).json({ message: "Invalid type value" });
    }

    if (assigneeId) {
      const assignee = await User.findByPk(assigneeId);
      if (!assignee) return res.status(404).json({ message: "Assignee not found" });
    }
    if (projectId) {
      const project = await Project.findByPk(projectId);
      if (!project) return res.status(404).json({ message: "Project not found" });
    }
    if (taskId) {
      const task = await Task.findByPk(taskId);
      if (!task) return res.status(404).json({ message: "Linked task not found" });
    }

    const issue = await Issue.create({
      title: title.trim(),
      description: description ? description.trim() : null,
      type: type || "Bug",
      status: status || "Open",
      priority: priority || "Medium",
      reporterId: req.user.id,
      assigneeId: assigneeId || null,
      projectId: projectId || null,
      taskId: taskId || null,
    });

    const full = await Issue.findByPk(issue.id, { include: getIssueInclude() });
    return res.status(201).json(full);
  } catch (error) {
    return res.status(500).json({ message: "Failed to create issue" });
  }
};

exports.getAllIssues = async (req, res) => {
  try {
    const isAdminOrManager = ["Admin", "Manager"].includes(req.user.role);
    const where = isAdminOrManager
      ? {}
      : { [require("sequelize").Op.or]: [{ reporterId: req.user.id }, { assigneeId: req.user.id }] };

    const issues = await Issue.findAll({
      where,
      include: getIssueInclude(),
      order: [["createdAt", "DESC"]],
    });

    return res.json(issues);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch issues" });
  }
};

exports.getIssueById = async (req, res) => {
  try {
    const issue = await Issue.findByPk(req.params.id, { include: getIssueInclude() });
    if (!issue) return res.status(404).json({ message: "Issue not found" });

    const isAdminOrManager = ["Admin", "Manager"].includes(req.user.role);
    const isOwner =
      Number(issue.reporterId) === Number(req.user.id) ||
      Number(issue.assigneeId) === Number(req.user.id);

    if (!isAdminOrManager && !isOwner) {
      return res.status(403).json({ message: "Access denied" });
    }

    return res.json(issue);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch issue" });
  }
};

exports.updateIssue = async (req, res) => {
  try {
    const issue = await Issue.findByPk(req.params.id);
    if (!issue) return res.status(404).json({ message: "Issue not found" });

    const isAdminOrManager = ["Admin", "Manager"].includes(req.user.role);
    const isOwner =
      Number(issue.reporterId) === Number(req.user.id) ||
      Number(issue.assigneeId) === Number(req.user.id);

    if (!isAdminOrManager && !isOwner) {
      return res.status(403).json({ message: "Only the reporter, assignee, or Admin/Manager can edit this issue" });
    }

    const { title, description, type, status, priority, assigneeId, projectId, taskId } = req.body || {};

    if (status && !ALLOWED_STATUS.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }
    if (priority && !ALLOWED_PRIORITY.includes(priority)) {
      return res.status(400).json({ message: "Invalid priority value" });
    }
    if (type && !ALLOWED_TYPE.includes(type)) {
      return res.status(400).json({ message: "Invalid type value" });
    }

    if (title !== undefined) issue.title = title.trim();
    if (description !== undefined) issue.description = description ? description.trim() : null;
    if (type !== undefined) issue.type = type;
    if (status !== undefined) issue.status = status;
    if (priority !== undefined) issue.priority = priority;
    if (assigneeId !== undefined) issue.assigneeId = assigneeId || null;
    if (projectId !== undefined) issue.projectId = projectId || null;
    if (taskId !== undefined) issue.taskId = taskId || null;

    await issue.save();

    const full = await Issue.findByPk(issue.id, { include: getIssueInclude() });
    return res.json({ message: "Issue updated", issue: full });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update issue" });
  }
};

exports.deleteIssue = async (req, res) => {
  try {
    const issue = await Issue.findByPk(req.params.id);
    if (!issue) return res.status(404).json({ message: "Issue not found" });

    await issue.destroy();
    return res.json({ message: "Issue deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete issue" });
  }
};
