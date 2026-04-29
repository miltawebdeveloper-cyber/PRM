module.exports = (sequelize, DataTypes) => {
  const Expense = sequelize.define("Expense", {
    title: { type: DataTypes.STRING, allowNull: false },
    amount: { type: DataTypes.FLOAT, allowNull: false },
    currency: { type: DataTypes.STRING, allowNull: false, defaultValue: "USD" },
    expense_date: { type: DataTypes.DATEONLY, allowNull: false },
    category: { type: DataTypes.STRING, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
  });
  return Expense;
};
