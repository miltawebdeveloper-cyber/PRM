module.exports = (sequelize, DataTypes) => {
  const WorkflowRule = sequelize.define("WorkflowRule", {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    module: {
      type: DataTypes.ENUM("Task", "Project", "Issue"),
      allowNull: false,
    },
    trigger_event: {
      type: DataTypes.STRING, // e.g., 'status_changed', 'created'
      allowNull: false,
    },
    conditions: {
      type: DataTypes.JSON, // e.g., { status: 'Completed' }
      allowNull: true,
    },
    actions: {
      type: DataTypes.JSON, // e.g., [{ type: 'notify', recipient: 'owner' }]
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    organizationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  });

  return WorkflowRule;
};
