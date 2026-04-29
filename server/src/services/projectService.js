const { Op } = require("sequelize");
const { Project, User, Client, ProjectGroup, AuditLog, Expense, Timesheet, Task, TaskList, Milestone } = require("../models");

function makeProjectCode(count) {
  return `MI-${count + 1}`;
}

async function createProject(payload, user) {
  const {
    projectTitle,
    owner,
    template,
    startDate,
    endDate,
    strictProject,
    projectGroup,
    description,
    businessHours,
    taskLayout,
    tags,
    rollup,
    projectAccess,
    clientId,
    projectGroupId,
  } = payload || {};

  if (!projectTitle) {
    const error = new Error("projectTitle is required");
    error.status = 400;
    throw error;
  }

  let linkedClient = null;
  if (clientId) {
    linkedClient = await Client.findByPk(clientId);
    if (!linkedClient) {
      const error = new Error("Linked client not found");
      error.status = 404;
      throw error;
    }
  }

  let group = null;
  if (projectGroupId) {
    group = await ProjectGroup.findByPk(projectGroupId);
    if (!group) {
      const error = new Error("Project group not found");
      error.status = 404;
      throw error;
    }
  }

  const count = await Project.count();
  return Project.create({
    project_code: makeProjectCode(count),
    project_title: projectTitle,
    owner_name: owner || user.id,
    template: template || "Standard",
    start_date: startDate || null,
    end_date: endDate || null,
    strict_project: Boolean(strictProject),
    project_group: group?.code || projectGroup || null,
    description: description || null,
    business_hours: businessHours || "Standard Business Hours",
    task_layout: taskLayout || "Standard Layout",
    tags: tags || null,
    rollup: Boolean(rollup),
    project_access: projectAccess || "Private",
    status: "Active",
    progress: 0,
    createdById: user.id,
    clientId: linkedClient?.id || user.clientId || null,
    projectGroupId: group?.id || null,
  });
}

async function getProjects(user) {
  const currentUser = await User.findByPk(user.id);
  if (!currentUser) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  let where = {};
  if (user.role === "Manager") {
    where = { createdById: user.id };
  } else if (user.role === "Client") {
    where = { clientId: currentUser.clientId || -1 };
  }

  return Project.findAll({
    where,
    include: [
      { model: Client, as: "Client", attributes: ["id", "name", "client_code"] },
      { model: ProjectGroup, as: "ProjectGroup", attributes: ["id", "name", "code", "color"] },
    ],
    order: [["createdAt", "DESC"]],
  });
}

async function getProjectById(id, user) {
  const project = await Project.findByPk(id, {
    include: [
      { model: Client, as: "Client" },
      { model: ProjectGroup, as: "ProjectGroup" },
      { model: User, as: "CreatedBy", attributes: ["id", "name", "email"] },
    ],
  });

  if (!project) {
    const error = new Error("Project not found");
    error.status = 404;
    throw error;
  }

  // Basic access check
  if (user.role === "Manager" && project.createdById !== user.id) {
    const error = new Error("Access denied");
    error.status = 403;
    throw error;
  }
  if (user.role === "Client" && project.clientId !== user.clientId) {
    const error = new Error("Access denied");
    error.status = 403;
    throw error;
  }

  return project;
}

async function updateProject(id, payload, user) {
  const project = await Project.findByPk(id);
  if (!project) {
    const error = new Error("Project not found");
    error.status = 404;
    throw error;
  }
  if (user.role === "Manager" && project.createdById !== user.id) {
    const error = new Error("Access denied");
    error.status = 403;
    throw error;
  }
  const { projectTitle, description, startDate, endDate, status, progress, tags, projectAccess, budget_usd } = payload || {};
  if (projectTitle) project.project_title = projectTitle;
  if (description !== undefined) project.description = description;
  if (startDate !== undefined) project.start_date = startDate || null;
  if (endDate !== undefined) project.end_date = endDate || null;
  if (status) project.status = status;
  if (progress !== undefined) project.progress = progress;
  if (tags !== undefined) project.tags = tags;
  if (projectAccess) project.project_access = projectAccess;
  if (budget_usd !== undefined) project.budget_usd = budget_usd;
  await project.save();
  return project;
}

async function deleteProject(id, user) {
  const project = await Project.findByPk(id);
  if (!project) {
    const error = new Error("Project not found");
    error.status = 404;
    throw error;
  }
  if (user.role !== "Admin") {
    const error = new Error("Only Admin can delete projects");
    error.status = 403;
    throw error;
  }
  await project.destroy();
}

async function getProjectBudget(id) {
  const project = await Project.findByPk(id, {
    include: [
      { model: Expense, as: "Expenses", attributes: ["id", "amount", "currency", "category", "description", "createdAt"] },
    ],
  });
  if (!project) {
    const error = new Error("Project not found");
    error.status = 404;
    throw error;
  }

  const expenses = project.Expenses || [];
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const tasks = await Task.findAll({ where: { projectId: id }, attributes: ["id"] });
  const taskIds = tasks.map((t) => t.id);
  let laborCost = 0;
  if (taskIds.length) {
    const sheets = await Timesheet.findAll({
      where: { taskId: { [Op.in]: taskIds }, approval_status: "Approved", billable_type: "Yes" },
      include: [{ model: User, as: "Employee", attributes: ["hourly_rate"] }],
    });
    laborCost = sheets.reduce((sum, s) => {
      const rate = Number(s.Employee?.hourly_rate || 0);
      return sum + Number(s.hours_spent || 0) * rate;
    }, 0);
  }

  const actualSpend = totalExpenses + laborCost;
  const budget = Number(project.budget_usd || 0);
  return {
    budget_usd: budget,
    actual_spend: actualSpend,
    labor_cost: laborCost,
    expense_cost: totalExpenses,
    remaining: budget - actualSpend,
    percent_used: budget > 0 ? Math.round((actualSpend / budget) * 100) : 0,
    expenses,
  };
}

async function getProjectActivity(id) {
  return AuditLog.findAll({
    where: { projectId: id },
    include: [{ model: User, as: "Actor", attributes: ["id", "name", "username"] }],
    order: [["createdAt", "DESC"]],
    limit: 100,
  });
}

async function getProjectTemplates() {
  return Project.findAll({
    where: { is_template: true },
    include: [
      { model: User, as: "CreatedBy", attributes: ["id", "name"] },
    ],
    order: [["createdAt", "DESC"]],
  });
}

async function createFromTemplate(templateId, payload, user) {
  const template = await Project.findByPk(templateId, {
    include: [
      { model: TaskList, as: "TaskLists", include: [{ model: Task, as: "Tasks", attributes: ["task_name", "description", "priority", "estimated_hours", "status"] }] },
      { model: Milestone, as: "Milestones", attributes: ["title", "description", "due_date"] },
    ],
  });
  if (!template || !template.is_template) {
    const error = new Error("Template not found");
    error.status = 404;
    throw error;
  }
  const { projectTitle, startDate, endDate, clientId, projectGroupId } = payload || {};
  if (!projectTitle) {
    const error = new Error("projectTitle is required");
    error.status = 400;
    throw error;
  }

  let linkedClient = null;
  if (clientId) linkedClient = await Client.findByPk(clientId);
  let group = null;
  if (projectGroupId) group = await ProjectGroup.findByPk(projectGroupId);

  const count = await Project.count();
  const project = await Project.create({
    project_code: `MI-${count + 1}`,
    project_title: projectTitle,
    owner_name: user.name || user.username,
    template: template.template,
    start_date: startDate || null,
    end_date: endDate || null,
    strict_project: template.strict_project,
    description: template.description,
    business_hours: template.business_hours,
    task_layout: template.task_layout,
    tags: template.tags,
    rollup: template.rollup,
    project_access: template.project_access,
    status: "Active",
    progress: 0,
    budget_usd: template.budget_usd,
    is_template: false,
    createdById: user.id,
    clientId: linkedClient?.id || null,
    projectGroupId: group?.id || null,
  });

  if (template.TaskLists?.length) {
    for (const tl of template.TaskLists) {
      const newTL = await TaskList.create({ name: tl.name, projectId: project.id, createdById: user.id });
      if (tl.Tasks?.length) {
        for (const t of tl.Tasks) {
          await Task.create({
            task_id: `TMPL-${project.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            task_name: t.task_name,
            description: t.description || "",
            priority: t.priority || "None",
            estimated_hours: t.estimated_hours,
            status: "Not Started",
            due_date: endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            taskListId: newTL.id,
            projectId: project.id,
            managerId: user.id,
          });
        }
      }
    }
  }

  return project;
}

async function getProjectNotes(id) {
  const { ProjectNote } = require("../models");
  return ProjectNote.findAll({
    where: { projectId: id },
    include: [{ model: User, as: "Author", attributes: ["id", "name", "username"] }],
    order: [["createdAt", "DESC"]],
  });
}

async function addProjectNote(id, content, user) {
  const { ProjectNote } = require("../models");
  if (!content?.trim()) {
    const error = new Error("Note content is required");
    error.status = 400;
    throw error;
  }
  return ProjectNote.create({ projectId: id, content: content.trim(), createdById: user.id });
}

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectBudget,
  getProjectActivity,
  getProjectTemplates,
  createFromTemplate,
  getProjectNotes,
  addProjectNote,
};
