const { Expense, Project, User } = require("../models");

exports.getExpenses = async (req, res) => {
  try {
    const where = {};
    if (req.query.projectId) where.projectId = req.query.projectId;
    const expenses = await Expense.findAll({
      where,
      include: [
        { model: Project, as: "Project", attributes: ["id", "project_code", "project_title"] },
        { model: User, as: "CreatedBy", attributes: ["id", "name"] },
      ],
      order: [["expense_date", "DESC"]],
    });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch expenses" });
  }
};

exports.createExpense = async (req, res) => {
  try {
    const { title, amount, currency, expense_date, category, description, projectId } = req.body || {};
    if (!title || !amount || !expense_date || !projectId)
      return res.status(400).json({ message: "title, amount, expense_date, projectId are required" });
    const expense = await Expense.create({
      title, amount: Number(amount), currency: currency || "USD",
      expense_date, category: category || null, description: description || null,
      projectId, createdById: req.user.id,
    });
    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ message: "Failed to create expense" });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findByPk(req.params.id);
    if (!expense) return res.status(404).json({ message: "Expense not found" });
    const { title, amount, currency, expense_date, category, description } = req.body || {};
    if (title) expense.title = title;
    if (amount !== undefined) expense.amount = Number(amount);
    if (currency) expense.currency = currency;
    if (expense_date) expense.expense_date = expense_date;
    if (category !== undefined) expense.category = category;
    if (description !== undefined) expense.description = description;
    await expense.save();
    res.json(expense);
  } catch (err) {
    res.status(500).json({ message: "Failed to update expense" });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const deleted = await Expense.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ message: "Expense not found" });
    res.json({ message: "Expense deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete expense" });
  }
};
