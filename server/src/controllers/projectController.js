const projectService = require("../services/projectService");
const { logActivity } = require("../services/auditLogService");

exports.createProject = async (req, res) => {
  try {
    const project = await projectService.createProject(req.body || {}, req.user);
    await logActivity({
      actorId: req.user.id,
      action: "project_created",
      entityType: "project",
      entityId: project.id,
      projectId: project.id,
      message: `${req.user.name || req.user.username || "User"} created project ${project.project_code}`,
    });
    return res.status(201).json(project);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message || "Failed to create project" });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const project = await projectService.getProjectById(req.params.id, req.user);
    return res.json(project);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message || "Failed to fetch project" });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const project = await projectService.updateProject(req.params.id, req.body, req.user);
    await logActivity({
      actorId: req.user.id,
      action: "project_updated",
      entityType: "project",
      entityId: project.id,
      projectId: project.id,
      message: `${req.user.name || req.user.username || "User"} updated project ${project.project_code}`,
    });
    return res.json(project);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message || "Failed to update project" });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    await projectService.deleteProject(req.params.id, req.user);
    return res.json({ message: "Project deleted" });
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message || "Failed to delete project" });
  }
};

exports.updateProjectStatus = async (req, res) => {
  try {
    const project = await projectService.updateProject(req.params.id, { status: req.body.status }, req.user);
    return res.json(project);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message || "Failed to update project status" });
  }
};

exports.getProjectNotes = async (req, res) => {
  try {
    const notes = await projectService.getProjectNotes(req.params.id);
    return res.json(notes);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message || "Failed to fetch project notes" });
  }
};

exports.addProjectNote = async (req, res) => {
  try {
    const note = await projectService.addProjectNote(req.params.id, req.body.content, req.user);
    return res.status(201).json(note);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message || "Failed to add project note" });
  }
};

exports.getProjectBudget = async (req, res) => {
  try {
    const budget = await projectService.getProjectBudget(req.params.id);
    return res.json(budget);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message || "Failed to fetch project budget" });
  }
};

exports.getProjectActivity = async (req, res) => {
  try {
    const activity = await projectService.getProjectActivity(req.params.id);
    return res.json(activity);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message || "Failed to fetch project activity" });
  }
};

exports.getProjects = async (req, res) => {
  try {
    const projects = await projectService.getProjects(req.user);
    return res.json(projects);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message || "Failed to fetch projects" });
  }
};

exports.getProjectTemplates = async (req, res) => {
  try {
    const templates = await projectService.getProjectTemplates();
    return res.json(templates);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message || "Failed to fetch templates" });
  }
};

exports.createFromTemplate = async (req, res) => {
  try {
    const project = await projectService.createFromTemplate(req.params.templateId, req.body, req.user);
    await logActivity({
      actorId: req.user.id,
      action: "project_created_from_template",
      entityType: "project",
      entityId: project.id,
      projectId: project.id,
      message: `${req.user.name || req.user.username || "User"} created project ${project.project_code} from template`,
    });
    return res.status(201).json(project);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message || "Failed to create project from template" });
  }
};

exports.saveAsTemplate = async (req, res) => {
  try {
    const project = await projectService.getProjectById(req.params.id, req.user);
    const { projectTitle } = req.body || {};
    const count = await require("../models").Project.count();
    const template = await require("../models").Project.create({
      project_code: `TMPL-${count + 1}`,
      project_title: projectTitle || `${project.project_title} (Template)`,
      owner_name: req.user.name || req.user.username,
      template: project.template,
      description: project.description,
      business_hours: project.business_hours,
      task_layout: project.task_layout,
      tags: project.tags,
      rollup: project.rollup,
      project_access: "Private",
      status: "Active",
      progress: 0,
      budget_usd: project.budget_usd,
      is_template: true,
      createdById: req.user.id,
    });
    return res.status(201).json(template);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message || "Failed to save as template" });
  }
};
