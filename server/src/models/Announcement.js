module.exports = (sequelize, DataTypes) => {
  const Announcement = sequelize.define("Announcement", {
    title: { type: DataTypes.STRING, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    type: { type: DataTypes.STRING, defaultValue: 'general' },
    targetAudience: { type: DataTypes.STRING, defaultValue: 'all' },
  });
  return Announcement;
};
