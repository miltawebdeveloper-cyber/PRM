module.exports = (sequelize, DataTypes) => {
  const Timesheet = sequelize.define("Timesheet", {
    start_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    hours_spent: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    billable_type: {
      type: DataTypes.ENUM("Yes", "No", "Break"),
      allowNull: false,
      defaultValue: "Yes",
    },
    approval_status: {
      type: DataTypes.ENUM("Pending", "Approved", "Rejected", "Correction Requested"),
      allowNull: false,
      defaultValue: "Pending",
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    review_note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  });

  return Timesheet;
};
