const { Milestone, Project, User, Client } = require("../models");
const { createNotification } = require("../services/notificationService");
const db = require("../models");

const ALLOWED_STATUS = ["Not Started", "In Progress", "Completed", "Overdue"];

exports.createMilestone = async (req, res) => {
  try {
    const { title, description, dueDate, status, projectId } = req.body || {};
    if (!title || !title.trim()) {
      return res.status(400).json({ message: "title is required" });
    }
    if (status && !ALLOWED_STATUS.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    let project = null;
    if (projectId) {
      project = await Project.findByPk(projectId);
      if (!project) return res.status(404).json({ message: "Project not found" });
    }

    const milestone = await Milestone.create({
      title:       title.trim(),
      description: description ? description.trim() : null,
      dueDate:     dueDate || null,
      status:      status || "Not Started",
      projectId:   project?.id || null,
      createdById: req.user.id,
    });

    // Notify the project creator if different from current user
    if (project && project.createdById && project.createdById !== req.user.id) {
      await createNotification(db, {
        userId:      project.createdById,
        type:        "milestone_due",
        title:       `New milestone added: ${title}`,
        message:     `A milestone was added to project "${project.project_title}".`,
        relatedId:   milestone.id,
        relatedType: "milestone",
      });
    }

    const full = await Milestone.findByPk(milestone.id, {
      include: [
        { model: Project, as: "Project", attributes: ["id", "project_code", "project_title"] },
        { model: User,    as: "CreatedBy", attributes: ["id", "name", "username"] },
      ],
    });
    return res.status(201).json(full);
  } catch (error) {
    console.error("Milestone create error:", error);
    return res.status(500).json({ message: "Failed to create milestone" });
  }
};

exports.getAllMilestones = async (req, res) => {
  try {
    const { projectId } = req.query;
    const where = {};
    if (projectId) where.projectId = projectId;

    const milestones = await Milestone.findAll({
      where,
      include: [
        { model: Project, as: "Project", attributes: ["id", "project_code", "project_title"] },
        { model: User,    as: "CreatedBy", attributes: ["id", "name", "username"] },
      ],
      order: [["dueDate", "ASC"]],
    });

    // Auto-mark overdue milestones
    const today = new Date().toISOString().slice(0, 10);
    for (const m of milestones) {
      if (m.dueDate && m.dueDate < today && !["Completed", "Overdue"].includes(m.status)) {
        m.status = "Overdue";
        await m.save();
      }
    }

    return res.json(milestones);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch milestones" });
  }
};

exports.updateMilestone = async (req, res) => {
  try {
    const milestone = await Milestone.findByPk(req.params.id);
    if (!milestone) return res.status(404).json({ message: "Milestone not found" });

    const isPrivileged = ["Admin", "Manager"].includes(req.user.role);
    const isOwner      = Number(milestone.createdById) === Number(req.user.id);
    if (!isPrivileged && !isOwner) {
      return res.status(403).json({ message: "Only the creator or Admin/Manager can edit this milestone" });
    }

    const { title, description, dueDate, status, projectId } = req.body || {};
    if (status && !ALLOWED_STATUS.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    if (title       !== undefined) milestone.title       = title.trim();
    if (description !== undefined) milestone.description = description ? description.trim() : null;
    if (dueDate     !== undefined) milestone.dueDate     = dueDate || null;
    if (status      !== undefined) milestone.status      = status;
    if (projectId   !== undefined) milestone.projectId   = projectId || null;

    await milestone.save();

    const full = await Milestone.findByPk(milestone.id, {
      include: [
        { model: Project, as: "Project", attributes: ["id", "project_code", "project_title"] },
        { model: User,    as: "CreatedBy", attributes: ["id", "name", "username"] },
      ],
    });
    return res.json({ message: "Milestone updated", milestone: full });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update milestone" });
  }
};

exports.deleteMilestone = async (req, res) => {
  try {
    const milestone = await Milestone.findByPk(req.params.id);
    if (!milestone) return res.status(404).json({ message: "Milestone not found" });
    await milestone.destroy();
    return res.json({ message: "Milestone deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete milestone" });
  }
};
