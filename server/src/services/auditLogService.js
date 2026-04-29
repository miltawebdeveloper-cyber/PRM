const { AuditLog, User } = require("../models");

async function logActivity({
  actorId,
  action,
  entityType,
  entityId,
  taskId = null,
  projectId = null,
  message,
  metadata = null,
}) {
  try {
    await AuditLog.create({
      actorId: actorId || null,
      action,
      entityType,
      entityId: entityId || null,
      taskId,
      projectId,
      message,
      metadata,
    });
  } catch (error) {
    console.error("[Audit log failed]", error.message);
  }
}

async function getTaskActivity(taskId) {
  return AuditLog.findAll({
    where: { taskId },
    include: [{ model: User, as: "Actor", attributes: ["id", "name", "username"] }],
    order: [["createdAt", "ASC"]],
  });
}

module.exports = {
  logActivity,
  getTaskActivity,
};
