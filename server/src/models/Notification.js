module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define("Notification", {
    type: {
      type: DataTypes.ENUM(
        "task_assigned",
        "deadline_alert",
        "issue_reported",
        "milestone_due",
        "file_uploaded",
        "general"
      ),
      allowNull: false,
      defaultValue: "general",
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    relatedId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    relatedType: {
      type: DataTypes.ENUM("task", "project", "milestone", "issue", "file"),
      allowNull: true,
    },
  });

  return Notification;
};
