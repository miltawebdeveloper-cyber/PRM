module.exports = (sequelize, DataTypes) => {
  const ProjectNote = sequelize.define("ProjectNote", {
    title: { type: DataTypes.STRING, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: true },
  });
  return ProjectNote;
};
