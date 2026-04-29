module.exports = (sequelize, DataTypes) => {
  const TaskComment = sequelize.define("TaskComment", {
    comment: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  });

  return TaskComment;
};
