const { Timesheet, Task, User, Client } = require("../models");
const { logActivity } = require("./auditLogService");

function calculateHours(startTime, endTime) {
  const ms = new Date(endTime).getTime() - new Date(startTime).getTime();
  if (ms <= 0) return 0;
  return Number((ms / (1000 * 60 * 60)).toFixed(2));
}

function getDateKey(value) {
  return new Date(value).toISOString().slice(0, 10);
}

async function startTimer({ taskId, billable_type, notes }, user) {
  if (!taskId) {
    const error = new Error("taskId is required");
    error.status = 400;
    throw error;
  }

  const task = await Task.findByPk(taskId);
  if (!task) {
    const error = new Error("Task not found");
    error.status = 404;
    throw error;
  }
  if (task.assigneeId !== user.id) {
    const error = new Error("You can only log your assigned tasks");
    error.status = 403;
    throw error;
  }

  const runningLog = await Timesheet.findOne({
    where: { employeeId: user.id, end_time: null },
  });
  if (runningLog) {
    const error = new Error("Stop current running timer first");
    error.status = 400;
    throw error;
  }

  const log = await Timesheet.create({
    taskId: task.id,
    employeeId: user.id,
    start_time: new Date(),
    billable_type: billable_type || "Yes",
    approval_status: "Pending",
    notes: notes || null,
  });

  if (task.status === "Not Started") {
    task.status = "In Progress";
    await task.save();
  }

  await logActivity({
    actorId: user.id,
    action: "timer_started",
    entityType: "timesheet",
    entityId: log.id,
    taskId: task.id,
    projectId: task.projectId || null,
    message: `${user.name || user.username || "User"} started a timer on ${task.task_id}`,
  });

  return log;
}

async function stopTimer(logId, { notes }, user) {
  const log = await Timesheet.findByPk(logId, { include: [{ model: Task }] });
  if (!log) {
    const error = new Error("Timesheet entry not found");
    error.status = 404;
    throw error;
  }
  if (log.employeeId !== user.id) {
    const error = new Error("You can only stop your own timer");
    error.status = 403;
    throw error;
  }
  if (log.end_time) {
    const error = new Error("Timer already stopped");
    error.status = 400;
    throw error;
  }
  if (log.approval_status !== "Pending") {
    const error = new Error("Approved/reviewed logs cannot be edited");
    error.status = 400;
    throw error;
  }

  log.end_time = new Date();
  log.hours_spent = calculateHours(log.start_time, log.end_time);
  if (typeof notes === "string" && notes.trim()) {
    log.notes = notes.trim();
  }
  await log.save();

  await logActivity({
    actorId: user.id,
    action: "timer_stopped",
    entityType: "timesheet",
    entityId: log.id,
    taskId: log.Task?.id || null,
    projectId: log.Task?.projectId || null,
    message: `${user.name || user.username || "User"} logged ${log.hours_spent}h on ${log.Task?.task_id || "task"}`,
  });

  return log;
}

async function getMyTimesheets(user) {
  return Timesheet.findAll({
    where: { employeeId: user.id },
    include: [
      {
        model: Task,
        attributes: ["id", "task_id", "task_name", "description", "status", "clientId"],
        include: [{ model: Client, attributes: ["name", "client_code"] }],
      },
    ],
    order: [["createdAt", "DESC"]],
  });
}

async function getPendingApprovals() {
  return Timesheet.findAll({
    where: { approval_status: "Pending" },
    include: [
      {
        model: Task,
        attributes: ["id", "task_id", "description", "status", "projectId"],
        include: [{ model: Client, attributes: ["name", "client_code"] }],
      },
      { model: User, as: "Employee", attributes: ["id", "name", "username", "email"] },
    ],
    order: [["createdAt", "DESC"]],
  });
}

async function reviewTimesheet(logId, { approval_status, review_note }, user) {
  const allowed = ["Approved", "Rejected", "Correction Requested"];
  if (!allowed.includes(approval_status)) {
    const error = new Error("Invalid approval_status");
    error.status = 400;
    throw error;
  }

  const log = await Timesheet.findByPk(logId, { include: [{ model: Task }] });
  if (!log) {
    const error = new Error("Timesheet entry not found");
    error.status = 404;
    throw error;
  }
  if (!log.end_time) {
    const error = new Error("Cannot review running timer entry");
    error.status = 400;
    throw error;
  }

  log.approval_status = approval_status;
  log.review_note = review_note || null;
  await log.save();

  await logActivity({
    actorId: user.id,
    action: "timesheet_reviewed",
    entityType: "timesheet",
    entityId: log.id,
    taskId: log.Task?.id || null,
    projectId: log.Task?.projectId || null,
    message: `${user.name || user.username || "Admin"} marked timesheet as ${approval_status}`,
    metadata: { review_note: review_note || null },
  });

  return { message: "Timesheet reviewed", log };
}

async function getTimesheetSummary(user) {
  const isAdmin = user.role === "Admin";
  const where = isAdmin ? {} : { employeeId: user.id };

  const logs = await Timesheet.findAll({
    where,
    include: [
      {
        model: Task,
        attributes: ["id", "task_id", "task_name", "description", "status"],
        include: [{ model: Client, attributes: ["id", "name", "client_code"] }],
      },
      { model: User, as: "Employee", attributes: ["id", "name", "username", "email"] },
    ],
    order: [["start_time", "DESC"]],
  });

  const employeeMap = new Map();
  const dailyMap = new Map();
  let billableHours = 0;
  let nonBillableHours = 0;
  let breakHours = 0;

  logs.forEach((log) => {
    const hours = Number(log.hours_spent || 0);
    const employeeKey = log.Employee?.id || user.id;
    const employeeName = log.Employee?.name || user.name || "Team Member";
    const dateKey = log.start_time ? getDateKey(log.start_time) : null;

    if (log.billable_type === "Yes") billableHours += hours;
    if (log.billable_type === "No") nonBillableHours += hours;
    if (log.billable_type === "Break") breakHours += hours;

    if (!employeeMap.has(employeeKey)) {
      employeeMap.set(employeeKey, {
        employeeId: employeeKey,
        employeeName,
        username: log.Employee?.username || user.username || "",
        totalHours: 0,
        approvedHours: 0,
        pendingHours: 0,
        billableHours: 0,
        entries: 0,
        capacityHours: 40,
      });
    }

    const employeeEntry = employeeMap.get(employeeKey);
    employeeEntry.totalHours += hours;
    employeeEntry.entries += 1;
    if (log.approval_status === "Approved") employeeEntry.approvedHours += hours;
    if (log.approval_status === "Pending") employeeEntry.pendingHours += hours;
    if (log.billable_type === "Yes") employeeEntry.billableHours += hours;

    if (dateKey) {
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, {
          date: dateKey,
          totalHours: 0,
          approvedHours: 0,
          pendingHours: 0,
          billableHours: 0,
          nonBillableHours: 0,
          breakHours: 0,
        });
      }
      const dayEntry = dailyMap.get(dateKey);
      dayEntry.totalHours += hours;
      if (log.approval_status === "Approved") dayEntry.approvedHours += hours;
      if (log.approval_status === "Pending") dayEntry.pendingHours += hours;
      if (log.billable_type === "Yes") dayEntry.billableHours += hours;
      if (log.billable_type === "No") dayEntry.nonBillableHours += hours;
      if (log.billable_type === "Break") dayEntry.breakHours += hours;
    }
  });

  const workload = Array.from(employeeMap.values())
    .map((entry) => {
      const utilization = entry.capacityHours
        ? Number(((entry.totalHours / entry.capacityHours) * 100).toFixed(1))
        : 0;
      return {
        ...entry,
        totalHours: Number(entry.totalHours.toFixed(2)),
        approvedHours: Number(entry.approvedHours.toFixed(2)),
        pendingHours: Number(entry.pendingHours.toFixed(2)),
        billableHours: Number(entry.billableHours.toFixed(2)),
        utilization,
        workloadState:
          entry.totalHours >= entry.capacityHours
            ? "Overloaded"
            : entry.totalHours >= entry.capacityHours * 0.7
            ? "Balanced"
            : "Available",
      };
    })
    .sort((a, b) => b.totalHours - a.totalHours);

  const daily = Array.from(dailyMap.values())
    .map((entry) => ({
      ...entry,
      totalHours: Number(entry.totalHours.toFixed(2)),
      approvedHours: Number(entry.approvedHours.toFixed(2)),
      pendingHours: Number(entry.pendingHours.toFixed(2)),
      billableHours: Number(entry.billableHours.toFixed(2)),
      nonBillableHours: Number(entry.nonBillableHours.toFixed(2)),
      breakHours: Number(entry.breakHours.toFixed(2)),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totals: {
      entries: logs.length,
      hours: Number(logs.reduce((sum, log) => sum + Number(log.hours_spent || 0), 0).toFixed(2)),
      billableHours: Number(billableHours.toFixed(2)),
      nonBillableHours: Number(nonBillableHours.toFixed(2)),
      breakHours: Number(breakHours.toFixed(2)),
    },
    workload,
    daily,
  };
}

module.exports = {
  startTimer,
  stopTimer,
  getMyTimesheets,
  getPendingApprovals,
  reviewTimesheet,
  getTimesheetSummary,
};
