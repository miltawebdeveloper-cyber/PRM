const { TaskList, Project, Task, User } = require("../models");

function getListInclude() {
  return [
    { model: Project, as: "Project", attributes: ["id", "project_code", "project_title"], required: false },
  ];
}

exports.createTaskList = async (req, res) => {
  try {
    const { name, description, sort_order, projectId } = req.body || {};

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "name is required" });
    }

    if (projectId) {
      const project = await Project.findByPk(projectId);
      if (!project) return res.status(404).json({ message: "Project not found" });
    }

    const list = await TaskList.create({
      name: name.trim(),
      description: description ? description.trim() : null,
      sort_order: sort_order !== undefined ? Number(sort_order) : 0,
      projectId: projectId || null,
    });

    const full = await TaskList.findByPk(list.id, { include: getListInclude() });
    return res.status(201).json(full);
  } catch (error) {
    return res.status(500).json({ message: "Failed to create task list" });
  }
};

exports.getAllTaskLists = async (req, res) => {
  try {
    const { projectId } = req.query;
    const where = {};
    if (projectId) where.projectId = projectId;

    const lists = await TaskList.findAll({
      where,
      include: getListInclude(),
      order: [["sort_order", "ASC"], ["name", "ASC"]],
    });

    return res.json(lists);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch task lists" });
  }
};

exports.getTaskListById = async (req, res) => {
  try {
    const list = await TaskList.findByPk(req.params.id, {
      include: [
        ...getListInclude(),
        {
          model: Task,
          as: "Tasks",
          attributes: ["id", "task_id", "task_name", "status", "priority", "due_date"],
        },
      ],
    });
    if (!list) return res.status(404).json({ message: "Task list not found" });
    return res.json(list);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch task list" });
  }
};

exports.updateTaskList = async (req, res) => {
  try {
    const list = await TaskList.findByPk(req.params.id);
    if (!list) return res.status(404).json({ message: "Task list not found" });

    const { name, description, sort_order, projectId } = req.body || {};

    if (name !== undefined) list.name = name.trim();
    if (description !== undefined) list.description = description ? description.trim() : null;
    if (sort_order !== undefined) list.sort_order = Number(sort_order);
    if (projectId !== undefined) {
      if (projectId) {
        const project = await Project.findByPk(projectId);
        if (!project) return res.status(404).json({ message: "Project not found" });
      }
      list.projectId = projectId || null;
    }

    await list.save();

    const full = await TaskList.findByPk(list.id, { include: getListInclude() });
    return res.json({ message: "Task list updated", taskList: full });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update task list" });
  }
};

exports.deleteTaskList = async (req, res) => {
  try {
    const list = await TaskList.findByPk(req.params.id);
    if (!list) return res.status(404).json({ message: "Task list not found" });

    const taskCount = await Task.count({ where: { taskListId: list.id } });
    if (taskCount > 0) {
      return res.status(400).json({
        message: `Cannot delete task list with ${taskCount} task(s). Move or delete tasks first.`,
      });
    }

    await list.destroy();
    return res.json({ message: "Task list deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete task list" });
  }
};
