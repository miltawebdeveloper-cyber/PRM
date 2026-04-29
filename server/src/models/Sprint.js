module.exports = (sequelize, DataTypes) => {
  const Sprint = sequelize.define("Sprint", {
    name: { type: DataTypes.STRING, allowNull: false },
    goal: { type: DataTypes.TEXT, allowNull: true },
    start_date: { type: DataTypes.DATEONLY, allowNull: true },
    end_date: { type: DataTypes.DATEONLY, allowNull: true },
    status: {
      type: DataTypes.ENUM("Planning", "Active", "Completed"),
      allowNull: false,
      defaultValue: "Planning",
    },
  });
  return Sprint;
};
