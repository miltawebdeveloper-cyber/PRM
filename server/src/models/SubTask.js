module.exports = (sequelize, DataTypes) => {
  const SubTask = sequelize.define("SubTask", {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("Not Started", "In Progress", "Completed"),
      allowNull: false,
      defaultValue: "Not Started",
    },
    due_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  });

  return SubTask;
};
