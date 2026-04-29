module.exports = (sequelize, DataTypes) => {
  const TaskWatcher = sequelize.define("TaskWatcher", {
    taskId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
  }, {
    indexes: [{ unique: true, fields: ["taskId", "userId"] }],
  });
  return TaskWatcher;
};
