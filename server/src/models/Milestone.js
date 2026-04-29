module.exports = (sequelize, DataTypes) => {
  const Milestone = sequelize.define("Milestone", {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("Not Started", "In Progress", "Completed", "Overdue"),
      allowNull: false,
      defaultValue: "Not Started",
    },
  });

  return Milestone;
};
