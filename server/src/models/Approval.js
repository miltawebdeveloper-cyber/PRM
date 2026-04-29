module.exports = (sequelize, DataTypes) => {
  const Approval = sequelize.define("Approval", {
    entityType: {
      type: DataTypes.ENUM("Milestone", "Invoice", "Task"),
      allowNull: false,
    },
    entityId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("Pending", "Approved", "Rejected"),
      defaultValue: "Pending",
    },
    requestedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    approvedBy: {
      type: DataTypes.INTEGER,
      allowNull: true, // Client user ID
    },
    comments: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    organizationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  });

  return Approval;
};
