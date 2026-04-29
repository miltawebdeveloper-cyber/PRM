module.exports = (sequelize, DataTypes) => {
  const Issue = sequelize.define("Issue", {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM("Bug", "Feature Request", "Improvement", "Question", "Other"),
      allowNull: false,
      defaultValue: "Bug",
    },
    status: {
      type: DataTypes.ENUM("Open", "In Progress", "Resolved", "Closed"),
      allowNull: false,
      defaultValue: "Open",
    },
    priority: {
      type: DataTypes.ENUM("Low", "Medium", "High", "Critical"),
      allowNull: false,
      defaultValue: "Medium",
    },
  });

  return Issue;
};
