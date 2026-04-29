const { CustomField } = require("../models");

exports.getCustomFields = async (req, res) => {
  try {
    const where = {};
    if (req.query.entity_type) where.entity_type = req.query.entity_type;
    const fields = await CustomField.findAll({ where, order: [["sort_order", "ASC"], ["createdAt", "ASC"]] });
    res.json(fields);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch custom fields" });
  }
};

exports.createCustomField = async (req, res) => {
  try {
    const { name, field_type, options, entity_type, is_required, sort_order } = req.body || {};
    if (!name || !field_type) return res.status(400).json({ message: "name and field_type are required" });
    const field = await CustomField.create({
      name, field_type, options: options || null,
      entity_type: entity_type || "task",
      is_required: Boolean(is_required),
      sort_order: sort_order || 0,
      createdById: req.user.id,
    });
    res.status(201).json(field);
  } catch (err) {
    res.status(500).json({ message: "Failed to create custom field" });
  }
};

exports.updateCustomField = async (req, res) => {
  try {
    const field = await CustomField.findByPk(req.params.id);
    if (!field) return res.status(404).json({ message: "Custom field not found" });
    const { name, options, is_required, sort_order } = req.body || {};
    if (name) field.name = name;
    if (options !== undefined) field.options = options;
    if (is_required !== undefined) field.is_required = Boolean(is_required);
    if (sort_order !== undefined) field.sort_order = sort_order;
    await field.save();
    res.json(field);
  } catch (err) {
    res.status(500).json({ message: "Failed to update custom field" });
  }
};

exports.deleteCustomField = async (req, res) => {
  try {
    const deleted = await CustomField.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ message: "Custom field not found" });
    res.json({ message: "Custom field deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete custom field" });
  }
};
