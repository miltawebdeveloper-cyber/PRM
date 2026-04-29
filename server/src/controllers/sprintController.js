const { Sprint, Project, Task, User, Category, Client } = require("../models");

const SPRINT_TASK_INCLUDE = [
  { model: User, as: "Assignee", attributes: ["id", "name", "username"], required: false },
  { model: User, as: "Manager", attributes: ["id", "name"], required: false },
  { model: Project, as: "Project", attributes: ["id", "project_code", "project_title"], required: false },
];

exports.getSprints = async (req, res) => {
  try {
    const where = {};
    if (req.query.projectId) where.projectId = req.query.projectId;
    const sprints = await Sprint.findAll({
      where,
      include: [
        { model: Project, as: "Project", attributes: ["id", "project_code", "project_title"] },
        { model: User, as: "CreatedBy", attributes: ["id", "name"] },
        { model: Task, as: "Tasks", attributes: ["id", "task_id", "task_name", "status", "priority", "due_date"], required: false },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json(sprints);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch sprints" });
  }
};

exports.createSprint = async (req, res) => {
  try {
    const { name, goal, start_date, end_date, projectId } = req.body || {};
    if (!name || !projectId) return res.status(400).json({ message: "name and projectId are required" });
    const sprint = await Sprint.create({
      name, goal: goal || null, start_date: start_date || null,
      end_date: end_date || null, projectId, createdById: req.user.id,
    });
    res.status(201).json(sprint);
  } catch (err) {
    res.status(500).json({ message: "Failed to create sprint" });
  }
};

exports.updateSprint = async (req, res) => {
  try {
    const sprint = await Sprint.findByPk(req.params.id);
    if (!sprint) return res.status(404).json({ message: "Sprint not found" });
    const { name, goal, start_date, end_date, status } = req.body || {};
    if (name) sprint.name = name;
    if (goal !== undefined) sprint.goal = goal;
    if (start_date !== undefined) sprint.start_date = start_date;
    if (end_date !== undefined) sprint.end_date = end_date;
    if (status) sprint.status = status;
    await sprint.save();
    res.json(sprint);
  } catch (err) {
    res.status(500).json({ message: "Failed to update sprint" });
  }
};

exports.deleteSprint = async (req, res) => {
  try {
    await Task.update({ sprintId: null }, { where: { sprintId: req.params.id } });
    const deleted = await Sprint.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ message: "Sprint not found" });
    res.json({ message: "Sprint deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete sprint" });
  }
};

exports.updateSprintStatus = async (req, res) => {
  try {
    const sprint = await Sprint.findByPk(req.params.id);
    if (!sprint) return res.status(404).json({ message: "Sprint not found" });
    const { status } = req.body || {};
    if (!status) return res.status(400).json({ message: "status is required" });
    sprint.status = status;
    await sprint.save();
    res.json(sprint);
  } catch (err) {
    res.status(500).json({ message: "Failed to update sprint status" });
  }
};

exports.addTaskToSprint = async (req, res) => {
  try {
    const { taskId } = req.body || {};
    if (!taskId) return res.status(400).json({ message: "taskId required" });
    const task = await Task.findByPk(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });
    task.sprintId = req.params.id;
    await task.save();
    res.json({ message: "Task added to sprint" });
  } catch (err) {
    res.status(500).json({ message: "Failed to add task to sprint" });
  }
};

exports.removeTaskFromSprint = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });
    task.sprintId = null;
    await task.save();
    res.json({ message: "Task removed from sprint" });
  } catch (err) {
    res.status(500).json({ message: "Failed to remove task from sprint" });
  }
};

exports.getBacklog = async (req, res) => {
  try {
    const where = { sprintId: null };
    if (req.query.projectId) where.projectId = req.query.projectId;
    const tasks = await Task.findAll({
      where,
      include: SPRINT_TASK_INCLUDE,
      order: [["createdAt", "DESC"]],
      limit: 200,
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch backlog" });
  }
};

exports.getBurndown = async (req, res) => {
  try {
    const sprint = await Sprint.findByPk(req.params.id, {
      include: [{ model: Task, as: "Tasks", attributes: ["id", "status", "estimated_hours", "createdAt", "updatedAt"] }],
    });
    if (!sprint) return res.status(404).json({ message: "Sprint not found" });

    const tasks = sprint.Tasks || [];
    const totalPoints = tasks.reduce((sum, t) => sum + Number(t.estimated_hours || 1), 0);
    const start = sprint.start_date ? new Date(sprint.start_date) : new Date(sprint.createdAt);
    const end = sprint.end_date ? new Date(sprint.end_date) : new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000);

    const days = [];
    const current = new Date(start);
    while (current <= end) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    const totalDays = days.length - 1 || 1;

    const burndown = days.map((day, idx) => {
      const ideal = totalPoints - (totalPoints * idx) / totalDays;
      const completedOnDay = tasks
        .filter((t) => t.status === "Completed" && new Date(t.updatedAt) <= day)
        .reduce((sum, t) => sum + Number(t.estimated_hours || 1), 0);
      const actual = totalPoints - completedOnDay;
      return {
        date: day.toISOString().split("T")[0],
        ideal: Math.max(0, Math.round(ideal * 10) / 10),
        actual: Math.max(0, Math.round(actual * 10) / 10),
      };
    });

    res.json({
      sprintId: sprint.id,
      name: sprint.name,
      totalPoints,
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
      taskCount: tasks.length,
      completedCount: tasks.filter((t) => t.status === "Completed").length,
      burndown,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to generate burndown" });
  }
};
