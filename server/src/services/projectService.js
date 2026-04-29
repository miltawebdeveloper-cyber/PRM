const { Project, User, Client, ProjectGroup } = require("../models");

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

module.exports = {
  createProject,
  getProjects,
  getProjectById,
};
