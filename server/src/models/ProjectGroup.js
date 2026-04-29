module.exports = (sequelize, DataTypes) => {
  const ProjectGroup = sequelize.define("ProjectGroup", {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    color: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "#63b5ff",
    },
  });

  return ProjectGroup;
};
