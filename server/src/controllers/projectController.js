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
    const project = await projectService.updateProjectStatus(req.params.id, req.body.status, req.user);
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
exports.getProjects = async (req, res) => {
  try {
    const projects = await projectService.getProjects(req.user);
    return res.json(projects);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message || "Failed to fetch projects" });
  }
};

