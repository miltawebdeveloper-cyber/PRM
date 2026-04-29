const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { Project, Task, Issue, User, Milestone } = require("../models");
const { Op } = require("sequelize");

router.get("/", authMiddleware, async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json({ results: [] });

  const query = q.trim();

  try {
    const [projects, tasks, issues, milestones] = await Promise.all([
      Project.findAll({
        where: { project_title: { [Op.like]: `%${query}%` } },
        limit: 5,
        attributes: ["id", "project_title", "project_code"],
      }),
      Task.findAll({
        where: {
          [Op.or]: [
            { task_name: { [Op.like]: `%${query}%` } },
            { task_id: { [Op.like]: `%${query}%` } },
          ],
        },
        limit: 5,
        attributes: ["id", "task_name", "task_id"],
      }),
      Issue.findAll({
        where: { title: { [Op.like]: `%${query}%` } },
        limit: 5,
        attributes: ["id", "title", "issue_id"],
      }),
      Milestone.findAll({
        where: { name: { [Op.like]: `%${query}%` } },
        limit: 5,
        attributes: ["id", "name", "projectId"],
      }),
    ]);

    const results = [
      ...projects.map((p) => ({ id: p.id, title: p.project_title, type: "Project", code: p.project_code, url: `/projects/${p.id}` })),
      ...tasks.map((t) => ({ id: t.id, title: t.task_name, type: "Task", code: t.task_id, url: "/manager/tasks" })),
      ...issues.map((i) => ({ id: i.id, title: i.title, type: "Issue", code: i.issue_id, url: "/issues" })),
      ...milestones.map((m) => ({ id: m.id, title: m.name, type: "Milestone", url: "/milestones" })),
    ];

    return res.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return res.status(500).json({ message: "Search failed" });
  }
});

module.exports = router;
