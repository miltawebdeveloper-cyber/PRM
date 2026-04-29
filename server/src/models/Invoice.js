module.exports = (sequelize, DataTypes) => {
  const Invoice = sequelize.define("Invoice", {
    invoice_number: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    total_hours: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    hourly_rate_usd: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    usd_inr_rate: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 83,
    },
    total_amount_usd: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    total_amount_inr: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM("Pending", "Paid"),
      allowNull: false,
      defaultValue: "Pending",
    },
    generated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    paid_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  });

  return Invoice;
};
