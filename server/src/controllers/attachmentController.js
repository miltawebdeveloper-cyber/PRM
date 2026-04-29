const path = require("path");
const fs = require("fs");
const { Attachment, User, Task, Project, Issue } = require("../models");
const { createNotification } = require("../services/notificationService");
const db = require("../models");
const { logActivity } = require("../services/auditLogService");

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file provided" });

    const { taskId, projectId, issueId } = req.body || {};

    const record = await Attachment.create({
      originalName: req.file.originalname,
      storedName:   req.file.filename,
      mimeType:     req.file.mimetype,
      size:         req.file.size,
      filePath:     req.file.path,
      fileUrl:      `${BASE_URL}/uploads/${req.file.filename}`,
      uploadedById: req.user.id,
      taskId:       taskId    ? Number(taskId)    : null,
      projectId:    projectId ? Number(projectId) : null,
      issueId:      issueId   ? Number(issueId)   : null,
    });

    await logActivity({
      actorId: req.user.id,
      action: "attachment_uploaded",
      entityType: "attachment",
      entityId: record.id,
      taskId: record.taskId || null,
      projectId: record.projectId || null,
      message: `${req.user.name || req.user.username || "User"} uploaded ${req.file.originalname}`,
    });

    // In-app notification to task assignee (if linked to task)
    if (taskId) {
      const task = await Task.findByPk(taskId);
      if (task?.assigneeId && task.assigneeId !== req.user.id) {
        await createNotification(db, {
          userId:      task.assigneeId,
          type:        "file_uploaded",
          title:       "New file attached to your task",
          message:     `${req.file.originalname} was uploaded to task ${task.task_id}.`,
          relatedId:   task.id,
          relatedType: "task",
        });
      }
    }

    const full = await Attachment.findByPk(record.id, {
      include: [{ model: User, as: "UploadedBy", attributes: ["id", "name", "username"] }],
    });
    return res.status(201).json(full);
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ message: "Failed to upload file" });
  }
};

exports.getAttachments = async (req, res) => {
  try {
    const { taskId, projectId, issueId } = req.query;
    const where = {};
    if (taskId)    where.taskId    = taskId;
    if (projectId) where.projectId = projectId;
    if (issueId)   where.issueId   = issueId;

    const files = await Attachment.findAll({
      where,
      include: [{ model: User, as: "UploadedBy", attributes: ["id", "name", "username"] }],
      order: [["createdAt", "DESC"]],
    });
    return res.json(files);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch attachments" });
  }
};

exports.deleteAttachment = async (req, res) => {
  try {
    const file = await Attachment.findByPk(req.params.id);
    if (!file) return res.status(404).json({ message: "Attachment not found" });

    const isOwner     = Number(file.uploadedById) === Number(req.user.id);
    const isPrivileged = ["Admin", "Manager"].includes(req.user.role);
    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ message: "You cannot delete this file" });
    }

    // Remove from disk
    if (fs.existsSync(file.filePath)) fs.unlinkSync(file.filePath);

    await logActivity({
      actorId: req.user.id,
      action: "attachment_deleted",
      entityType: "attachment",
      entityId: file.id,
      taskId: file.taskId || null,
      projectId: file.projectId || null,
      message: `${req.user.name || req.user.username || "User"} deleted ${file.originalName}`,
    });

    await file.destroy();
    return res.json({ message: "File deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete attachment" });
  }
};
