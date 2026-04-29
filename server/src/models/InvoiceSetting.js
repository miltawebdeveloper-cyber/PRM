module.exports = (sequelize, DataTypes) => {
  const InvoiceSetting = sequelize.define("InvoiceSetting", {
    currency: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "USD",
    },
    tax_rate: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    payment_terms_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30,
    },
    usd_inr_rate: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 83,
    },
    default_hourly_rate_usd: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 25,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  });

  return InvoiceSetting;
};
