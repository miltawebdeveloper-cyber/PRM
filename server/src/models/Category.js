module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define("Category", {
    name: DataTypes.STRING,
    category_code: {
      type: DataTypes.STRING,
      unique: true,
    },
  });

  return Category;
};