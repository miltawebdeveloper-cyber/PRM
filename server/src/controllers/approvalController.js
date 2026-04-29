const { Approval, User, Notification } = require("../models");

exports.requestApproval = async (req, res) => {
  try {
    const { entityType, entityId, comments } = req.body;
    const approval = await Approval.create({
      entityType,
      entityId,
      comments,
      requestedBy: req.user.id,
      organizationId: req.user.organizationId,
    });

    return res.status(201).json(approval);
  } catch (error) {
    return res.status(500).json({ message: "Failed to request approval" });
  }
};

exports.respondToApproval = async (req, res) => {
  try {
    const { status, comments } = req.body;
    const approval = await Approval.findByPk(req.params.id);

    if (!approval) return res.status(404).json({ message: "Approval request not found" });

    await approval.update({
      status,
      comments: comments || approval.comments,
      approvedBy: req.user.id,
    });

    // Notify the requester
    await Notification.create({
      userId: approval.requestedBy,
      title: `Approval ${status}`,
      message: `Your approval request for ${approval.entityType} #${approval.entityId} has been ${status.toLowerCase()}.`,
      type: "Approval",
    });

    return res.json(approval);
  } catch (error) {
    return res.status(500).json({ message: "Failed to respond to approval" });
  }
};

exports.getApprovals = async (req, res) => {
  try {
    const where = { organizationId: req.user.organizationId };
    if (req.user.role === "Client") {
      // Clients only see things relevant to them (logic can be refined)
      where.status = "Pending";
    }

    const approvals = await Approval.findAll({
      where,
      include: [
        { model: User, as: "Requester", attributes: ["name", "username"] },
        { model: User, as: "Approver", attributes: ["name", "username"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.json(approvals);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch approvals" });
  }
};
