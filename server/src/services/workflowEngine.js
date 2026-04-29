const { WorkflowRule, Notification, User } = require("../models");

async function executeWorkflows(moduleName, eventName, entity, organizationId) {
  try {
    const rules = await WorkflowRule.findAll({
      where: {
        module: moduleName,
        trigger_event: eventName,
        is_active: true,
        organizationId: organizationId || null,
      },
    });

    for (const rule of rules) {
      if (checkConditions(rule.conditions, entity)) {
        await runActions(rule.actions, entity);
      }
    }
  } catch (error) {
    console.error("Workflow Engine Error:", error);
  }
}

function checkConditions(conditions, entity) {
  if (!conditions || Object.keys(conditions).length === 0) return true;
  
  for (const [key, value] of Object.entries(conditions)) {
    if (entity[key] !== value) return false;
  }
  return true;
}

async function runActions(actions, entity) {
  if (!Array.isArray(actions)) return;

  for (const action of actions) {
    switch (action.type) {
      case "notify":
        await createNotification(action, entity);
        break;
      case "update":
        await updateEntity(action, entity);
        break;
      // Add more action types here (e.g., email, webhook)
    }
  }
}

async function createNotification(action, entity) {
  let userId;
  if (action.recipient === "owner" && entity.createdById) userId = entity.createdById;
  if (action.recipient === "assignee" && entity.assigneeId) userId = entity.assigneeId;
  if (action.recipient === "fixed") userId = action.userId;

  if (userId) {
    await Notification.create({
      userId,
      title: action.title || "Workflow Alert",
      message: action.message || `Workflow triggered for ${entity.id}`,
      type: "Workflow",
    });
  }
}

async function updateEntity(action, entity) {
  if (action.field && action.value !== undefined) {
    await entity.update({ [action.field]: action.value });
  }
}

module.exports = {
  executeWorkflows,
};
