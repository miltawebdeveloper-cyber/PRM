const { Sprint, Project } = require('../models');

// Get all sprints, optionally filtered by project
async function getSprints(user) {
  const where = {};
  if (user.role !== 'Admin') {
    // Non-admins can only see sprints in projects they are part of
    where.organizationId = user.organizationId;
  }
  return Sprint.findAll({ where, include: [{ model: Project, as: 'Project', attributes: ['id', 'project_code', 'project_title'] }] });
}

async function createSprint(data, user) {
  // Ensure project belongs to user's organization
  if (data.projectId) {
    const project = await Project.findByPk(data.projectId);
    if (!project || project.organizationId !== user.organizationId) {
      const err = new Error('Invalid project');
      err.status = 400;
      throw err;
    }
  }
  return Sprint.create({ ...data, createdById: user.id, organizationId: user.organizationId });
}

async function updateSprint(id, data, user) {
  const sprint = await Sprint.findByPk(id);
  if (!sprint) {
    const err = new Error('Sprint not found');
    err.status = 404;
    throw err;
  }
  if (sprint.createdById !== user.id && user.role !== 'Admin') {
    const err = new Error('Access denied');
    err.status = 403;
    throw err;
  }
  await sprint.update(data);
  return sprint;
}

async function deleteSprint(id, user) {
  const sprint = await Sprint.findByPk(id);
  if (!sprint) {
    const err = new Error('Sprint not found');
    err.status = 404;
    throw err;
  }
  if (sprint.createdById !== user.id && user.role !== 'Admin') {
    const err = new Error('Access denied');
    err.status = 403;
    throw err;
  }
  await sprint.destroy();
  return true;
}

async function updateSprintStatus(id, status, user) {
  const sprint = await Sprint.findByPk(id);
  if (!sprint) {
    const err = new Error('Sprint not found');
    err.status = 404;
    throw err;
  }
  if (sprint.createdById !== user.id && user.role !== 'Admin') {
    const err = new Error('Access denied');
    err.status = 403;
    throw err;
  }
  await sprint.update({ status });
  return sprint;
}

module.exports = {
  getSprints,
  createSprint,
  updateSprint,
  deleteSprint,
  updateSprintStatus,
};
