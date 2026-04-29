const { Organization, User, Project } = require("../models");

function getOrgInclude() {
  return [
    { model: User, as: "Members", attributes: ["id", "name", "username", "email"] },
  ];
}

exports.createOrganization = async (req, res) => {
  try {
    const { name, code, description, logo_url } = req.body || {};

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "name is required" });
    }
    if (!code || !code.trim()) {
      return res.status(400).json({ message: "code is required" });
    }

    const existing = await Organization.findOne({ where: { code: code.trim().toUpperCase() } });
    if (existing) {
      return res.status(409).json({ message: "Organization code already exists" });
    }

    const org = await Organization.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description ? description.trim() : null,
      logo_url: logo_url || null,
      is_active: true,
    });

    return res.status(201).json(org);
  } catch (error) {
    return res.status(500).json({ message: "Failed to create organization" });
  }
};

exports.getAllOrganizations = async (req, res) => {
  try {
    const orgs = await Organization.findAll({
      order: [["name", "ASC"]],
    });
    return res.json(orgs);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch organizations" });
  }
};

exports.getOrganizationById = async (req, res) => {
  try {
    const org = await Organization.findByPk(req.params.id, {
      include: getOrgInclude(),
    });
    if (!org) return res.status(404).json({ message: "Organization not found" });
    return res.json(org);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch organization" });
  }
};

exports.updateOrganization = async (req, res) => {
  try {
    const org = await Organization.findByPk(req.params.id);
    if (!org) return res.status(404).json({ message: "Organization not found" });

    const { name, description, logo_url, is_active } = req.body || {};

    if (name !== undefined) org.name = name.trim();
    if (description !== undefined) org.description = description ? description.trim() : null;
    if (logo_url !== undefined) org.logo_url = logo_url || null;
    if (is_active !== undefined) org.is_active = Boolean(is_active);

    await org.save();
    return res.json({ message: "Organization updated", organization: org });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update organization" });
  }
};

exports.deleteOrganization = async (req, res) => {
  try {
    const org = await Organization.findByPk(req.params.id);
    if (!org) return res.status(404).json({ message: "Organization not found" });

    const memberCount = await User.count({ where: { organizationId: org.id } });
    if (memberCount > 0) {
      return res.status(400).json({
        message: `Cannot delete organization with ${memberCount} active member(s). Reassign members first.`,
      });
    }

    await org.destroy();
    return res.json({ message: "Organization deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete organization" });
  }
};

exports.assignMember = async (req, res) => {
  try {
    const org = await Organization.findByPk(req.params.id);
    if (!org) return res.status(404).json({ message: "Organization not found" });

    const { userId } = req.body || {};
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.organizationId = org.id;
    await user.save();

    return res.json({ message: "Member assigned to organization" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to assign member" });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.organizationId = null;
    await user.save();

    return res.json({ message: "Member removed from organization" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to remove member" });
  }
};
