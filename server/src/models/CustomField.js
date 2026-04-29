module.exports = (sequelize, DataTypes) => {
  const CustomField = sequelize.define("CustomField", {
    name: { type: DataTypes.STRING, allowNull: false },
    field_type: {
      type: DataTypes.ENUM("text", "number", "date", "select", "checkbox"),
      allowNull: false,
      defaultValue: "text",
    },
    options: { type: DataTypes.JSON, allowNull: true },
    entity_type: {
      type: DataTypes.ENUM("task", "project"),
      allowNull: false,
      defaultValue: "task",
    },
    is_required: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  });
  return CustomField;
};
