module.exports = (sequelize, DataTypes) => {
  const Project = sequelize.define("Project", {
    project_code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    project_title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    owner_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    template: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "Standard",
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    strict_project: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    project_group: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    business_hours: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "Standard Business Hours",
    },
    task_layout: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "Standard Layout",
    },
    tags: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    rollup: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    project_access: {
      type: DataTypes.ENUM("Private", "Public"),
      allowNull: false,
      defaultValue: "Private",
    },
    status: {
      type: DataTypes.ENUM("Active", "In Progress", "Completed"),
      allowNull: false,
      defaultValue: "Active",
    },
    progress: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    custom_fields: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
    budget_usd: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    is_template: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    organizationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  });

  return Project;
};
