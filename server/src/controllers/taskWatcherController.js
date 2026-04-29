const { TaskWatcher, User } = require("../models");
const { createNotification } = require("../services/notificationService");
const db = require("../models");

exports.getWatchers = async (req, res) => {
  try {
    const watchers = await TaskWatcher.findAll({
      where: { taskId: req.params.id },
      include: [{ model: User, as: "User", attributes: ["id", "name", "username"] }],
    });
    res.json(watchers.map(w => w.User));
  } catch (err) {
    res.status(500).json({ message: "Failed to get watchers" });
  }
};

exports.watchTask = async (req, res) => {
  try {
    const { id: taskId } = req.params;
    const userId = req.user.id;
    const [watcher, created] = await TaskWatcher.findOrCreate({ where: { taskId, userId } });
    res.status(created ? 201 : 200).json({ watching: true, watcherId: watcher.id });
  } catch (err) {
    res.status(500).json({ message: "Failed to watch task" });
  }
};

exports.unwatchTask = async (req, res) => {
  try {
    const deleted = await TaskWatcher.destroy({ where: { taskId: req.params.id, userId: req.user.id } });
    if (!deleted) return res.status(404).json({ message: "Not watching this task" });
    res.json({ watching: false });
  } catch (err) {
    res.status(500).json({ message: "Failed to unwatch task" });
  }
};

async function notifyWatchers({ taskId, actorId, title, message }) {
  const watchers = await TaskWatcher.findAll({ where: { taskId } });
  await Promise.all(
    watchers
      .filter(w => w.userId !== actorId)
      .map(w => createNotification(db, {
        userId: w.userId,
        type: "task_update",
        title,
        message,
        relatedId: taskId,
        relatedType: "task",
      }))
  );
}

module.exports = { ...module.exports, notifyWatchers };
