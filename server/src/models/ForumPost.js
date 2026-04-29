module.exports = (sequelize, DataTypes) => {
  const ForumPost = sequelize.define("ForumPost", {
    title: { type: DataTypes.STRING, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
  });
  return ForumPost;
};
