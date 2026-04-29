const { Client, User, Timesheet, Task, Invoice } = require("../models");

// ✅ Create Client
exports.createClient = async (req, res) => {
  try {
    const { name, client_code, hourly_rate } = req.body;

    const client = await Client.create({
      name,
      client_code,
      hourly_rate,
    });

    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get All Clients
exports.getAllClients = async (req, res) => {
  try {
    const clients = await Client.findAll();
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Delete Client
exports.deleteClient = async (req, res) => {
  try {
    const { id } = req.params;

    const client = await Client.findByPk(id);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    await client.destroy();
    res.json({ message: "Client deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Client Read-Only Dashboard
exports.getClientDashboard = async (req, res) => {
  try {
    const currentUser = await User.findByPk(req.user.id, {
      include: [{ model: Client, as: "ClientAccount", attributes: ["id", "name", "client_code"] }],
    });

    if (!currentUser?.ClientAccount) {
      return res.status(400).json({ message: "Client account is not linked to any client profile" });
    }

    const logs = await Timesheet.findAll({
      where: { approval_status: "Approved" },
      include: [
        {
          model: Task,
          where: { clientId: currentUser.ClientAccount.id },
          attributes: ["id", "task_id", "task_name", "description", "status"],
          include: [{ model: Client, attributes: ["id", "name", "client_code", "hourly_rate"] }],
        },
        {
          model: User,
          as: "Employee",
          attributes: ["id", "name", "username"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const totalHours = logs.reduce((sum, item) => sum + Number(item.hours_spent || 0), 0);
    const hourlyRate = Number(currentUser.ClientAccount.hourly_rate || 0);
    const estimatedAmount = Number((totalHours * hourlyRate).toFixed(2));
    const taskSummaryMap = new Map();
    logs.forEach((entry) => {
      const key = entry.Task?.id;
      if (!key) return;
      if (!taskSummaryMap.has(key)) {
        taskSummaryMap.set(key, {
          taskId: entry.Task.task_id,
          taskName: entry.Task.task_name || entry.Task.description,
          hours: 0,
          amount: 0,
        });
      }
      const item = taskSummaryMap.get(key);
      item.hours += Number(entry.hours_spent || 0);
      item.amount = Number((item.hours * hourlyRate).toFixed(2));
    });

    const invoices = await Invoice.findAll({
      where: { clientId: currentUser.ClientAccount.id },
      order: [["createdAt", "DESC"]],
    });
    const pendingInvoices = invoices.filter((inv) => inv.status === "Pending");
    const paidInvoices = invoices.filter((inv) => inv.status === "Paid");

    return res.json({
      client: currentUser.ClientAccount,
      summary: {
        totalHours: Number(totalHours.toFixed(2)),
        hourlyRate,
        estimatedAmount,
        pendingUsd: Number(
          pendingInvoices.reduce((sum, item) => sum + Number(item.total_amount_usd || 0), 0).toFixed(2)
        ),
        pendingInr: Number(
          pendingInvoices.reduce((sum, item) => sum + Number(item.total_amount_inr || 0), 0).toFixed(2)
        ),
        paidUsd: Number(
          paidInvoices.reduce((sum, item) => sum + Number(item.total_amount_usd || 0), 0).toFixed(2)
        ),
        paidInr: Number(
          paidInvoices.reduce((sum, item) => sum + Number(item.total_amount_inr || 0), 0).toFixed(2)
        ),
      },
      taskSummary: Array.from(taskSummaryMap.values()).sort((a, b) =>
        a.taskId.localeCompare(b.taskId)
      ),
      invoices,
      entries: logs,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load client dashboard" });
  }
};

exports.payInvoice = async (req, res) => {
  try {
    const currentUser = await User.findByPk(req.user.id, {
      include: [{ model: Client, as: "ClientAccount", attributes: ["id"] }],
    });
    if (!currentUser?.ClientAccount) {
      return res.status(400).json({ message: "Client account is not linked" });
    }

    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    if (invoice.clientId !== currentUser.ClientAccount.id) {
      return res.status(403).json({ message: "Not allowed to pay this invoice" });
    }
    if (invoice.status === "Paid") {
      return res.status(400).json({ message: "Invoice already paid" });
    }

    invoice.status = "Paid";
    invoice.paid_at = new Date();
    await invoice.save();

    return res.json({ message: "Invoice paid successfully", invoice });
  } catch (error) {
    return res.status(500).json({ message: "Failed to pay invoice" });
  }
};
