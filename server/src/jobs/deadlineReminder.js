const cron = require("node-cron");
const { Op } = require("sequelize");
const { Task, Milestone, User, Project } = require("../models");
const {
  sendDeadlineAlertEmail,
  sendMilestoneDueEmail,
} = require("../services/emailService");

function getTomorrowRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + 1);

  const end = new Date(start);
  end.setHours(23, 59, 59, 999);

  return {
    startStr: start.toISOString().slice(0, 10),
    endStr: end.toISOString().slice(0, 10),
  };
}

async function sendTaskDeadlineReminders() {
  const { startStr, endStr } = getTomorrowRange();

  const dueTasks = await Task.findAll({
    where: {
      due_date: { [Op.between]: [startStr, endStr] },
      status: { [Op.notIn]: ["Completed"] },
      assigneeId: { [Op.not]: null },
    },
    include: [
      { model: User, as: "Assignee", attributes: ["id", "name", "email"] },
    ],
  });

  for (const task of dueTasks) {
    if (!task.Assignee?.email) continue;
    await sendDeadlineAlertEmail({
      userName: task.Assignee.name,
      email: task.Assignee.email,
      taskName: task.task_name,
      taskId: task.task_id,
      dueDate: task.due_date,
    });
    console.log(`[Reminder] Task deadline email sent to ${task.Assignee.email} for task ${task.task_id}`);
  }

  return dueTasks.length;
}

async function sendMilestoneDeadlineReminders() {
  const { startStr, endStr } = getTomorrowRange();

  const dueMilestones = await Milestone.findAll({
    where: {
      dueDate: { [Op.between]: [startStr, endStr] },
      status: { [Op.notIn]: ["Completed"] },
    },
    include: [
      { model: Project, as: "Project", attributes: ["id", "project_title", "createdById"] },
      { model: User, as: "CreatedBy", attributes: ["id", "name", "email"] },
    ],
  });

  for (const milestone of dueMilestones) {
    if (!milestone.CreatedBy?.email) continue;
    await sendMilestoneDueEmail({
      userName: milestone.CreatedBy.name,
      email: milestone.CreatedBy.email,
      milestoneTitle: milestone.title,
      dueDate: milestone.dueDate,
      projectTitle: milestone.Project?.project_title || "N/A",
    });
    console.log(`[Reminder] Milestone email sent to ${milestone.CreatedBy.email} for "${milestone.title}"`);
  }

  return dueMilestones.length;
}

async function runReminders() {
  try {
    const taskCount = await sendTaskDeadlineReminders();
    const milestoneCount = await sendMilestoneDeadlineReminders();
    console.log(`[Reminder Job] Done — tasks: ${taskCount}, milestones: ${milestoneCount}`);
  } catch (err) {
    console.error("[Reminder Job] Failed:", err.message);
  }
}

function startDeadlineReminderJob() {
  // Runs every day at 8:00 AM server time
  cron.schedule("0 8 * * *", () => {
    console.log("[Reminder Job] Running daily deadline check...");
    runReminders();
  });

  console.log("[Reminder Job] Scheduled — daily at 08:00");
}

module.exports = { startDeadlineReminderJob, runReminders };
