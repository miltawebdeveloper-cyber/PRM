const { ProjectGroup, Project } = require("../models");

exports.getProjectGroups = async (req, res) => {
  try {
    const groups = await ProjectGroup.findAll({ order: [["name", "ASC"]] });
    return res.json(groups);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch project groups" });
  }
};

exports.createProjectGroup = async (req, res) => {
  try {
    const { name, code, color } = req.body || {};
    if (!name || !code) {
      return res.status(400).json({ message: "name and code are required" });
    }

    const existsByName = await ProjectGroup.findOne({ where: { name } });
    if (existsByName) {
      return res.status(409).json({ message: "Project group name already exists" });
    }
    const existsByCode = await ProjectGroup.findOne({ where: { code } });
    if (existsByCode) {
      return res.status(409).json({ message: "Project group code already exists" });
    }

    const group = await ProjectGroup.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      color: color || "#63b5ff",
    });
    return res.status(201).json(group);
  } catch (error) {
    return res.status(500).json({ message: "Failed to create project group" });
  }
};

exports.getProjectGroupStats = async (req, res) => {
  try {
    const groups = await ProjectGroup.findAll({ order: [["name", "ASC"]] });
    const projects = await Project.findAll({
      attributes: ["id", "projectGroupId", "project_group"],
    });

    const map = new Map();
    groups.forEach((g) => map.set(g.id, { ...g.toJSON(), projectCount: 0 }));

    projects.forEach((project) => {
      if (project.projectGroupId && map.has(project.projectGroupId)) {
        map.get(project.projectGroupId).projectCount += 1;
      }
    });

    return res.json(Array.from(map.values()));
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch project group stats" });
  }
};
