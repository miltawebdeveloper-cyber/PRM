const { Op } = require("sequelize");
const { Task, Client, Category, User, Role, Timesheet, Project, SubTask, TaskComment } = require("../models");
const db = require("../models");
const { sendTaskAssignmentEmail } = require("../services/emailService");
const { createNotification }      = require("../services/notificationService");
const { getTaskActivity, logActivity } = require("../services/auditLogService");
const { executeWorkflows } = require("../services/workflowEngine");
const fs = require("fs");
const { parse } = require("csv-parse");

async function notifyTaskAssignee({ assignee, actorId, task, dueDate }) {
  if (!assignee || Number(assignee.id) === Number(actorId)) return;

  const manager = await User.findByPk(actorId, { attributes: ["name"] });

  await Promise.all([
    createNotification(db, {
      userId: assignee.id,
      type: "task_assigned",
      title: `New task assigned: ${task.task_name}`,
      message: `Task ${task.task_id} has been assigned to you by ${manager?.name || "Manager"}. Due: ${dueDate || "TBD"}.`,
      relatedId: task.id,
      relatedType: "task",
    }),
    assignee.email
      ? sendTaskAssignmentEmail({
          assigneeName: assignee.name,
          assigneeEmail: assignee.email,
          taskName: task.task_name,
          taskId: task.task_id,
          dueDate,
          managerName: manager?.name || "Manager",
        })
      : Promise.resolve(),
  ]);
}

function makeEmployeeCode(user) {
  if (!user) return "UNA00000";
  const username = (user.username || "EMP").replace(/[^a-zA-Z0-9]/g, "");
  const prefix = username.slice(0, 3).toUpperCase().padEnd(3, "X");
  const numeric = String(user.id).padStart(5, "0");
  return `${prefix}${numeric}`;
}

async function generateTaskId({ categoryCode, clientCode, assignee }) {
  const cat = (categoryCode || "CAT").slice(0, 2).toUpperCase();
  const cli = (clientCode || "CLI").slice(0, 3).toUpperCase();
  const emp = makeEmployeeCode(assignee);
  const prefix = `${cat}-${cli}-${emp}`;

  const existingCount = await Task.count({
    where: {
      task_id: { [Op.like]: `${prefix}-%` },
    },
  });
  const serial = String(existingCount + 1).padStart(4, "0");
  return `${prefix}-${serial}`;
}

function getTaskInclude({ employeeId } = {}) {
  const include = [
    { model: Client, attributes: ["id", "name", "client_code", "hourly_rate"] },
    { model: Category, attributes: ["id", "name", "category_code"], required: false },
    {
      model: User,
      as: "Assignee",
      attributes: ["id", "name", "username", "email"],
      required: false,
    },
    { model: User, as: "Manager", attributes: ["id", "name", "username"] },
    { model: Project, as: "Project", attributes: ["id", "project_code", "project_title"] },
    { model: Task, as: "PredecessorTask", attributes: ["id", "task_id", "task_name"], required: false },
    {
      model: SubTask,
      as: "SubTasks",
      attributes: ["id", "title", "description", "status", "due_date", "sort_order"],
      required: false,
    },
    {
      model: TaskComment,
      as: "Comments",
      attributes: ["id", "comment", "createdAt", "updatedAt"],
      required: false,
      include: [
        {
          model: User,
          as: "Author",
          attributes: ["id", "name", "username"],
        },
      ],
    },
  ];

  if (employeeId) {
    include.push({
      model: Timesheet,
      attributes: ["id", "start_time", "end_time", "hours_spent", "billable_type", "approval_status"],
      where: { employeeId },
      required: false,
    });
  }

  return include;
}

async function getTaskForAccess(taskId) {
  return Task.findByPk(taskId);
}

function canAccessTask(task, user) {
  if (!task || !user) return false;
  if (user.role === "Admin") return true;
  return Number(task.managerId) === Number(user.id) || Number(task.assigneeId) === Number(user.id);
}

async function buildTaskRelations({
  projectId,
  clientId,
  categoryId,
  assigneeId,
  predecessorTaskId,
}) {
  const [project, requestedClient, requestedCategory, fallbackCategory, assignee, predecessorTask] =
    await Promise.all([
      projectId ? Project.findByPk(projectId) : null,
      clientId ? Client.findByPk(clientId) : null,
      categoryId ? Category.findByPk(categoryId) : null,
      categoryId ? null : Category.findOne({ order: [["id", "ASC"]] }),
      assigneeId
        ? User.findByPk(assigneeId, { include: [{ model: Role, attributes: ["name"] }] })
        : null,
      predecessorTaskId ? Task.findByPk(predecessorTaskId) : null,
    ]);

  return {
    project,
    requestedClient,
    requestedCategory,
    fallbackCategory,
    assignee,
    predecessorTask,
  };
}

function normalizeSubtasks(subtasks, taskId) {
  if (!Array.isArray(subtasks)) return [];

  return subtasks
    .map((entry, index) => ({
      title: String(entry?.title || "").trim(),
      description: entry?.description ? String(entry.description).trim() : null,
      due_date: entry?.due_date || null,
      status: entry?.status || "Not Started",
      sort_order: index,
      taskId,
    }))
    .filter((entry) => entry.title);
}

exports.createTask = async (req, res) => {
  try {
    const {
      taskName,
      projectId,
      clientId,
      categoryId,
      description,
      phaseName,
      taskListName,
      assigneeId,
      due_date,
      start_date,
      priority,
      tags,
      estimated_hours,
      status,
      recurring,
      recurrence_pattern,
      predecessorTaskId,
      subtasks,
    } = req.body || {};

    const normalizedTaskName = (taskName || description || "").trim();
    if (!normalizedTaskName || !due_date) {
      return res.status(400).json({
        message: "taskName (or description) and due_date are required",
      });
    }

    const allowedStatus = ["Not Started", "In Progress", "Completed", "Waiting for Client"];
    const allowedPriority = ["None", "Low", "Medium", "High", "Critical"];
    const allowedRecurrence = ["None", "Daily", "Weekly", "Monthly"];

    if (status && !allowedStatus.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }
    if (priority && !allowedPriority.includes(priority)) {
      return res.status(400).json({ message: "Invalid priority value" });
    }
    if (recurrence_pattern && !allowedRecurrence.includes(recurrence_pattern)) {
      return res.status(400).json({ message: "Invalid recurrence pattern" });
    }

    const { project, requestedClient, requestedCategory, fallbackCategory, assignee, predecessorTask } =
      await buildTaskRelations({
        projectId,
        clientId,
        categoryId,
        assigneeId,
        predecessorTaskId,
      });

    if (projectId && !project) return res.status(404).json({ message: "Project not found" });
    if (clientId && !requestedClient) return res.status(404).json({ message: "Client not found" });
    if (categoryId && !requestedCategory) return res.status(404).json({ message: "Category not found" });
    if (assigneeId && !assignee) return res.status(404).json({ message: "Assignee not found" });
    if (predecessorTaskId && !predecessorTask) {
      return res.status(404).json({ message: "Predecessor task not found" });
    }
    if (assignee && !["Employee", "Manager", "Admin"].includes(assignee.Role?.name)) {
      return res.status(400).json({ message: "Assignee must be Employee, Manager, or Admin" });
    }

    const finalClient =
      requestedClient || (project?.clientId ? await Client.findByPk(project.clientId) : null);
    const finalCategory = requestedCategory || fallbackCategory;

    const taskId = await generateTaskId({
      categoryCode: finalCategory?.category_code,
      clientCode: finalClient?.client_code,
      assignee,
    });

    const task = await Task.create({
      task_id: taskId,
      task_name: normalizedTaskName,
      description: description?.trim() || normalizedTaskName,
      phase_name: phaseName?.trim() || null,
      task_list_name: taskListName?.trim() || null,
      due_date,
      start_date: start_date || null,
      priority: priority || "None",
      tags: tags || null,
      estimated_hours: estimated_hours ? Number(estimated_hours) : null,
      recurring: Boolean(recurring),
      recurrence_pattern: recurrence_pattern || (recurring ? "Weekly" : "None"),
      predecessorTaskId: predecessorTask?.id || null,
      status: status || "Not Started",
      assignment_status: assignee ? "Assigned" : "Unassigned",
      clientId: finalClient?.id || null,
      categoryId: finalCategory?.id || null,
      assigneeId: assignee?.id || null,
      projectId: project?.id || null,
      managerId: req.user.id,
      organizationId: req.user.organizationId,
      custom_fields: req.body.custom_fields || {},
    });

    // Trigger Workflows
    executeWorkflows("Task", "created", task, req.user.organizationId).catch((e) =>
      console.error("[Workflow Error]", e.message)
    );

    const normalizedSubtasks = normalizeSubtasks(subtasks, task.id);
    if (normalizedSubtasks.length > 0) {
      await SubTask.bulkCreate(normalizedSubtasks);
    }

    await logActivity({
      actorId: req.user.id,
      action: "task_created",
      entityType: "task",
      entityId: task.id,
      taskId: task.id,
      projectId: task.projectId || null,
      message: `${req.user.name || req.user.username || "Manager"} created task ${task.task_id}`,
      metadata: { status: task.status, assigneeId: task.assigneeId || null },
    });

    // Notify assignee (fire-and-forget — errors must not block the response)
    if (assignee && assignee.id !== req.user.id) {
      notifyTaskAssignee({ assignee, actorId: req.user.id, task, dueDate: due_date }).catch((e) =>
        console.error("[Task notify error]", e.message)
      );
    }

    const fullTask = await Task.findByPk(task.id, {
      include: getTaskInclude(),
    });

    const io = req.app.get("io");
    if (io) {
      if (fullTask.projectId) {
        io.to(`project-${fullTask.projectId}`).emit("task-created", fullTask);
      }
      io.emit("task-created", fullTask);
    }

    return res.status(201).json(fullTask);
  } catch (error) {
    return res.status(500).json({ message: "Failed to create task" });
  }
};

exports.getManagerTasks = async (req, res) => {
  try {
    const tasks = await Task.findAll({
      where: { managerId: req.user.id },
      include: getTaskInclude(),
      order: [["createdAt", "DESC"]],
    });

    return res.json(tasks);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch manager tasks" });
  }
};

exports.getAllTasks = async (req, res) => {
  try {
    const { page = 1, limit = 50, sortField = "createdAt", sortOrder = "DESC", status, priority, projectId } = req.query || {};
    
    const offset = (Number(page) - 1) * Number(limit);
    const where = req.user.role === "Admin" ? {} : { managerId: req.user.id };
    
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (projectId) where.projectId = projectId;

    const { count, rows } = await Task.findAndCountAll({
      where,
      include: getTaskInclude(),
      order: [[sortField, sortOrder.toUpperCase()]],
      limit: Number(limit),
      offset: Number(offset),
      distinct: true,
    });

    return res.json({
      tasks: rows,
      total: count,
      page: Number(page),
      totalPages: Math.ceil(count / Number(limit)),
    });
  } catch (error) {
    console.error("Fetch tasks error:", error);
    return res.status(500).json({ message: "Failed to fetch tasks" });
  }
};

exports.getEmployeeTasks = async (req, res) => {
  try {
    const tasks = await Task.findAll({
      where: { assigneeId: req.user.id },
      include: getTaskInclude({ employeeId: req.user.id }),
      order: [["createdAt", "DESC"]],
    });

    return res.json(tasks);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch employee tasks" });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const {
      taskName,
      projectId,
      clientId,
      categoryId,
      description,
      phaseName,
      taskListName,
      assigneeId,
      due_date,
      start_date,
      priority,
      tags,
      estimated_hours,
      status,
      recurring,
      recurrence_pattern,
      predecessorTaskId,
      subtasks,
    } = req.body || {};

    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (Number(task.managerId) !== Number(req.user.id)) {
      return res.status(403).json({ message: "Only the task creator can edit this task" });
    }
    const previousAssigneeId = task.assigneeId;

    const allowedStatus = ["Not Started", "In Progress", "Completed", "Waiting for Client"];
    const allowedPriority = ["None", "Low", "Medium", "High", "Critical"];
    const allowedRecurrence = ["None", "Daily", "Weekly", "Monthly"];

    if (status && !allowedStatus.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }
    if (priority && !allowedPriority.includes(priority)) {
      return res.status(400).json({ message: "Invalid priority value" });
    }
    if (recurrence_pattern && !allowedRecurrence.includes(recurrence_pattern)) {
      return res.status(400).json({ message: "Invalid recurrence pattern" });
    }

    const nextTaskName = typeof taskName === "string" ? taskName.trim() : task.task_name;
    const nextDescription =
      typeof description === "string" ? (description.trim() || nextTaskName) : task.description;
    const nextDueDate = due_date !== undefined ? due_date : task.due_date;

    if (!nextTaskName || !nextDueDate) {
      return res.status(400).json({ message: "taskName and due_date are required" });
    }

    const { project, requestedClient, requestedCategory, assignee, predecessorTask } =
      await buildTaskRelations({
        projectId:
          projectId !== undefined && projectId !== null && projectId !== "" ? projectId : null,
        clientId: clientId !== undefined && clientId !== null && clientId !== "" ? clientId : null,
        categoryId:
          categoryId !== undefined && categoryId !== null && categoryId !== "" ? categoryId : null,
        assigneeId:
          assigneeId !== undefined && assigneeId !== null && assigneeId !== "" ? assigneeId : null,
        predecessorTaskId:
          predecessorTaskId !== undefined &&
          predecessorTaskId !== null &&
          predecessorTaskId !== ""
            ? predecessorTaskId
            : null,
      });

    if (projectId !== undefined && projectId !== null && projectId !== "" && !project) {
      return res.status(404).json({ message: "Project not found" });
    }
    if (clientId !== undefined && clientId !== null && clientId !== "" && !requestedClient) {
      return res.status(404).json({ message: "Client not found" });
    }
    if (categoryId !== undefined && categoryId !== null && categoryId !== "" && !requestedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }
    if (assigneeId !== undefined && assigneeId !== null && assigneeId !== "" && !assignee) {
      return res.status(404).json({ message: "Assignee not found" });
    }
    if (
      predecessorTaskId !== undefined &&
      predecessorTaskId !== null &&
      predecessorTaskId !== "" &&
      !predecessorTask
    ) {
      return res.status(404).json({ message: "Predecessor task not found" });
    }
    if (assignee && !["Employee", "Manager", "Admin"].includes(assignee.Role?.name)) {
      return res.status(400).json({ message: "Assignee must be Employee, Manager, or Admin" });
    }

    if (taskName !== undefined) task.task_name = nextTaskName;
    if (description !== undefined) task.description = nextDescription;
    if (phaseName !== undefined) task.phase_name = phaseName?.trim() || null;
    if (taskListName !== undefined) task.task_list_name = taskListName?.trim() || null;
    if (due_date !== undefined) task.due_date = due_date;
    if (start_date !== undefined) task.start_date = start_date || null;
    if (priority !== undefined) task.priority = priority || "None";
    if (tags !== undefined) task.tags = tags || null;
    if (estimated_hours !== undefined) {
      task.estimated_hours =
        estimated_hours === null || estimated_hours === "" ? null : Number(estimated_hours);
    }
    if (status !== undefined) task.status = status || task.status;
    if (recurring !== undefined) task.recurring = Boolean(recurring);
    if (recurrence_pattern !== undefined) task.recurrence_pattern = recurrence_pattern || "None";
    if (clientId !== undefined) task.clientId = requestedClient?.id || null;
    if (categoryId !== undefined) task.categoryId = requestedCategory?.id || null;
    if (assigneeId !== undefined) {
      task.assigneeId = assignee?.id || null;
      task.assignment_status = assignee ? "Assigned" : "Unassigned";
    }
    if (projectId !== undefined) task.projectId = project?.id || null;
    if (predecessorTaskId !== undefined) task.predecessorTaskId = predecessorTask?.id || null;
    if (req.body.custom_fields !== undefined) {
      task.custom_fields = { ...(task.custom_fields || {}), ...req.body.custom_fields };
    }

    await task.save();

    // Trigger Workflows
    executeWorkflows("Task", "updated", task, req.user.organizationId).catch((e) =>
      console.error("[Workflow Error]", e.message)
    );

    await logActivity({
      actorId: req.user.id,
      action: "task_updated",
      entityType: "task",
      entityId: task.id,
      taskId: task.id,
      projectId: task.projectId || null,
      message: `${req.user.name || req.user.username || "Manager"} updated task ${task.task_id}`,
      metadata: {
        status: task.status,
        assigneeId: task.assigneeId || null,
        due_date: task.due_date || null,
      },
    });

    if (Array.isArray(subtasks)) {
      await SubTask.destroy({ where: { taskId: task.id } });
      const normalizedSubtasks = normalizeSubtasks(subtasks, task.id);
      if (normalizedSubtasks.length > 0) {
        await SubTask.bulkCreate(normalizedSubtasks);
      }
    }

    if (assigneeId !== undefined && assignee && Number(previousAssigneeId) !== Number(assignee.id)) {
      notifyTaskAssignee({
        assignee,
        actorId: req.user.id,
        task,
        dueDate: task.due_date,
      }).catch((e) => console.error("[Task reassign notify error]", e.message));
    }

    const fullTask = await Task.findByPk(task.id, {
      include: getTaskInclude(),
    });

    const io = req.app.get("io");
    if (io) {
      if (fullTask.projectId) {
        io.to(`project-${fullTask.projectId}`).emit("task-updated", fullTask);
      }
      io.emit("task-updated", fullTask);
    }

    notifyWatchers(task.id, req.user.id, "Task Details Updated", `${req.user.name} updated task ${task.task_id}`).catch(e => console.error("[Watcher Notify Error]", e.message));

    return res.json({ message: "Task updated", task: fullTask });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update task" });
  }
};

exports.updateTaskProgress = async (req, res) => {
  try {
    const { status, notes } = req.body || {};
    const allowedStatus = ["Not Started", "In Progress", "Completed", "Waiting for Client"];
    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    const isCreator = Number(task.managerId) === Number(req.user.id);
    if (!isCreator) {
      return res.status(403).json({ message: "Only the task creator can edit this task" });
    }

    task.status = status;
    if (typeof notes === "string" && notes.trim()) {
      task.description = `${task.description}\n\n[Progress Note] ${notes.trim()}`;
    }
    await task.save();

    const io = req.app.get("io");
    if (io) {
      if (task.projectId) {
        io.to(`project-${task.projectId}`).emit("task-updated", task);
      }
      io.emit("task-updated", task);
    }

    await logActivity({
      actorId: req.user.id,
      action: "task_status_updated",
      entityType: "task",
      entityId: task.id,
      taskId: task.id,
      projectId: task.projectId || null,
      message: `${req.user.name || req.user.username || "Manager"} changed status to ${status}`,
      metadata: { notes: notes || null },
    });

    notifyWatchers(task.id, req.user.id, "Status Changed", `${req.user.name} changed status of ${task.task_id} to ${status}`).catch(e => console.error("[Watcher Notify Error]", e.message));

    return res.json({ message: "Task status updated", task });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update task status" });
  }
};

exports.getTaskComments = async (req, res) => {
  try {
    const task = await getTaskForAccess(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (!canAccessTask(task, req.user)) {
      return res.status(403).json({ message: "You do not have access to this task discussion" });
    }

    const comments = await TaskComment.findAll({
      where: { taskId: task.id },
      include: [
        {
          model: User,
          as: "Author",
          attributes: ["id", "name", "username"],
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    return res.json(comments);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch task comments" });
  }
};

exports.addTaskComment = async (req, res) => {
  try {
    const task = await getTaskForAccess(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (!canAccessTask(task, req.user)) {
      return res.status(403).json({ message: "You do not have access to this task discussion" });
    }

    const commentText = String(req.body?.comment || "").trim();
    if (!commentText) {
      return res.status(400).json({ message: "Comment is required" });
    }

    const comment = await TaskComment.create({
      taskId: task.id,
      userId: req.user.id,
      comment: commentText,
    });

    await logActivity({
      actorId: req.user.id,
      action: "task_comment_added",
      entityType: "comment",
      entityId: comment.id,
      taskId: task.id,
      projectId: task.projectId || null,
      message: commentText,
    });

    const fullComment = await TaskComment.findByPk(comment.id, {
      include: [
        {
          model: User,
          as: "Author",
          attributes: ["id", "name", "username"],
        },
      ],
    });

    // Handle @mentions
    const mentionRegex = /@(\w+)/g;
    const matches = commentText.match(mentionRegex);
    if (matches) {
      const usernames = matches.map(m => m.slice(1));
      User.findAll({ where: { username: usernames } }).then(mentionedUsers => {
        mentionedUsers.forEach(u => {
          if (u.id !== req.user.id) {
            createNotification(db, {
              userId: u.id,
              type: "task_mention",
              title: `Mentioned in ${task.task_id}`,
              message: `${req.user.name} mentioned you in a comment.`,
              relatedId: task.id,
              relatedType: "task"
            }).catch(e => console.error("[Mention Notify Error]", e.message));
          }
        });
      });
    }

    notifyWatchers(task.id, req.user.id, "New Comment", `${req.user.name} added a comment to ${task.task_id}`).catch(e => console.error("[Watcher Notify Error]", e.message));

    return res.status(201).json(fullComment);
  } catch (error) {
    return res.status(500).json({ message: "Failed to add task comment" });
  }
};

exports.getTaskActivity = async (req, res) => {
  try {
    const task = await getTaskForAccess(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (!canAccessTask(task, req.user)) {
      return res.status(403).json({ message: "You do not have access to this task activity" });
    }

    const activity = await getTaskActivity(task.id);
    return res.json(activity);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch task activity" });
  }
};

// ✅ Watchers Implementation
exports.getTaskWatchers = async (req, res) => {
  try {
    const watchers = await db.TaskWatcher.findAll({
      where: { taskId: req.params.id },
      include: [{ model: User, as: "User", attributes: ["id", "name", "username"] }],
    });
    return res.json(watchers);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch watchers" });
  }
};

exports.watchTask = async (req, res) => {
  try {
    const [watcher, created] = await db.TaskWatcher.findOrCreate({
      where: { taskId: req.params.id, userId: req.user.id },
    });
    return res.json({ message: created ? "Watching task" : "Already watching", watcher });
  } catch (error) {
    return res.status(500).json({ message: "Failed to watch task" });
  }
};

exports.unwatchTask = async (req, res) => {
  try {
    await db.TaskWatcher.destroy({
      where: { taskId: req.params.id, userId: req.user.id },
    });
    return res.json({ message: "Unwatched task" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to unwatch task" });
  }
};

exports.isWatchingTask = async (req, res) => {
  try {
    const watcher = await db.TaskWatcher.findOne({
      where: { taskId: req.params.id, userId: req.user.id },
    });
    return res.json({ isWatching: !!watcher });
  } catch (error) {
    return res.status(500).json({ message: "Failed to check watch status" });
  }
};

// ✅ Helper for Watcher Notifications
async function notifyWatchers(taskId, actorId, action, message) {
  const watchers = await db.TaskWatcher.findAll({ where: { taskId } });
  const promises = watchers
    .filter(w => Number(w.userId) !== Number(actorId))
    .map(w => createNotification(db, {
      userId: w.userId,
      type: "task_update",
      title: `Task Update: ${action}`,
      message,
      relatedId: taskId,
      relatedType: "task"
    }));
  return Promise.all(promises);
}

exports.importTasks = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No CSV file uploaded" });
    }

    const fileContent = fs.readFileSync(req.file.path, "utf8");
    parse(fileContent, { columns: true, skip_empty_lines: true }, async (err, records) => {
      if (err) {
        return res.status(400).json({ message: "Failed to parse CSV file" });
      }

      const tasksToCreate = [];
      const { projectId } = req.body;
      
      let index = 0;
      for (const record of records) {
        const taskName = record.task_name || record.taskName || record.title;
        if (!taskName) continue;

        const taskId = `IMP-${Date.now()}-${index++}`; 

        tasksToCreate.push({
          task_id: taskId,
          task_name: taskName,
          description: record.description || taskName,
          status: record.status || "Not Started",
          priority: record.priority || "Medium",
          due_date: record.due_date || new Date(),
          estimated_hours: record.estimated_hours ? Number(record.estimated_hours) : null,
          managerId: req.user.id,
          projectId: projectId || null,
          organizationId: req.user.organizationId,
        });
      }

      if (tasksToCreate.length > 0) {
        const createdTasks = await Task.bulkCreate(tasksToCreate);
        return res.json({ message: `Successfully imported ${createdTasks.length} tasks`, count: createdTasks.length });
      } else {
        return res.json({ message: "No valid tasks found in CSV", count: 0 });
      }
    });
  } catch (error) {
    console.error("Import error:", error);
    res.status(500).json({ message: "Task import failed" });
  }
};
