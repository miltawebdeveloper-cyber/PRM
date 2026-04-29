module.exports = (sequelize, DataTypes) => {
  const Task = sequelize.define("Task", {
    task_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    task_name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "Task",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    phase_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    task_list_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(
        "Not Started",
        "In Progress",
        "Completed",
        "Waiting for Client"
      ),
      allowNull: false,
      defaultValue: "Not Started",
    },
    due_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    priority: {
      type: DataTypes.ENUM("None", "Low", "Medium", "High", "Critical"),
      allowNull: false,
      defaultValue: "None",
    },
    tags: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    estimated_hours: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    recurring: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    recurrence_pattern: {
      type: DataTypes.ENUM("None", "Daily", "Weekly", "Monthly"),
      allowNull: false,
      defaultValue: "None",
    },
    predecessorTaskId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    assignment_status: {
      type: DataTypes.ENUM("Assigned", "Unassigned"),
      allowNull: false,
      defaultValue: "Assigned",
    },
    taskListId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    custom_fields: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
    reminder_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    sprintId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    organizationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  });

  return Task;
};
