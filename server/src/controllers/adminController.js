const { Op } = require("sequelize");
const { InvoiceSetting, User, Role, Client, Category, Timesheet, Task, Invoice } = require("../models");

exports.getDashboard = async (req, res) => {
  return res.json({ message: "Welcome Admin" });
};

exports.getStats = async (req, res) => {
  try {
    const [users, clients, categories] = await Promise.all([
      User.count(),
      Client.count(),
      Category.count(),
    ]);
    return res.json({ users, clients, categories });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load admin stats" });
  }
};

exports.getInvoiceSettings = async (req, res) => {
  try {
    const [settings] = await InvoiceSetting.findOrCreate({
      where: { id: 1 },
      defaults: {
        currency: "USD",
        tax_rate: 0,
        payment_terms_days: 30,
        usd_inr_rate: 83,
        default_hourly_rate_usd: 25,
        notes: "",
      },
    });
    return res.json(settings);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch invoice settings" });
  }
};

exports.updateInvoiceSettings = async (req, res) => {
  try {
    const { currency, tax_rate, payment_terms_days, usd_inr_rate, default_hourly_rate_usd, notes } = req.body || {};
    const [settings] = await InvoiceSetting.findOrCreate({
      where: { id: 1 },
      defaults: {
        currency: "USD",
        tax_rate: 0,
        payment_terms_days: 30,
        usd_inr_rate: 83,
        default_hourly_rate_usd: 25,
        notes: "",
      },
    });

    settings.currency = currency || settings.currency;
    settings.tax_rate = Number.isFinite(Number(tax_rate))
      ? Number(tax_rate)
      : settings.tax_rate;
    settings.payment_terms_days = Number.isInteger(Number(payment_terms_days))
      ? Number(payment_terms_days)
      : settings.payment_terms_days;
    settings.usd_inr_rate = Number.isFinite(Number(usd_inr_rate))
      ? Number(usd_inr_rate)
      : settings.usd_inr_rate;
    settings.default_hourly_rate_usd = Number.isFinite(Number(default_hourly_rate_usd))
      ? Number(default_hourly_rate_usd)
      : settings.default_hourly_rate_usd;
    settings.notes = typeof notes === "string" ? notes : settings.notes;

    await settings.save();
    return res.json(settings);
  } catch (error) {
    return res.status(500).json({ message: "Failed to update invoice settings" });
  }
};

exports.getApprovalPanel = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "name", "username", "email", "hourly_rate", "is_active"],
      include: [{ model: Role, attributes: ["name"] }],
      order: [["createdAt", "DESC"]],
    });

    const approvals = users
      .filter((user) => user.Role?.name !== "Admin")
      .map((user) => ({
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        hourly_rate: user.hourly_rate,
        role: user.Role?.name || null,
        is_active: user.is_active,
      }));

    return res.json(approvals);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch approval panel" });
  }
};

exports.getInvoicePreview = async (req, res) => {
  try {
    const [settings] = await InvoiceSetting.findOrCreate({
      where: { id: 1 },
      defaults: {
        currency: "USD",
        tax_rate: 0,
        payment_terms_days: 30,
        usd_inr_rate: 83,
        default_hourly_rate_usd: 25,
        notes: "",
      },
    });
    const usdInrRate = Number(settings.usd_inr_rate || 83);
    const defaultHourlyRateUsd = Number(settings.default_hourly_rate_usd || 25);

    const where = { approval_status: "Approved", invoiceId: null };
    if (req.query.from || req.query.to) {
      where.createdAt = {};
      if (req.query.from) {
        where.createdAt[Op.gte] = new Date(req.query.from);
      }
      if (req.query.to) {
        where.createdAt[Op.lte] = new Date(req.query.to);
      }
    }

    const logs = await Timesheet.findAll({
      where,
      include: [
        {
          model: Task,
          attributes: ["id", "task_id", "task_name", "description", "clientId"],
          include: [{ model: Client, attributes: ["id", "name", "client_code", "hourly_rate"] }],
        },
        { model: User, as: "Employee", attributes: ["id", "name", "username"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    const byClient = new Map();
    logs.forEach((entry) => {
      const client = entry.Task?.Client;
      if (!client) return;
      const key = client.id;
      if (!byClient.has(key)) {
        byClient.set(key, {
          clientId: client.id,
          clientName: client.name,
          clientCode: client.client_code,
          hourlyRate: Number(client.hourly_rate || defaultHourlyRateUsd),
          hourlyRateInr: Number(
            (Number(client.hourly_rate || defaultHourlyRateUsd) * usdInrRate).toFixed(2)
          ),
          approvedHours: 0,
          amountUsd: 0,
          amountInr: 0,
          entries: [],
        });
      }
      const row = byClient.get(key);
      const hours = Number(entry.hours_spent || 0);
      row.approvedHours += hours;
      row.amountUsd = Number((row.approvedHours * row.hourlyRate).toFixed(2));
      row.amountInr = Number((row.approvedHours * row.hourlyRateInr).toFixed(2));
      row.entries.push({
        timesheetId: entry.id,
        taskId: entry.Task?.task_id,
        taskName: entry.Task?.task_name || entry.Task?.description,
        employee: entry.Employee?.name || "-",
        date: entry.createdAt,
        hours,
        amountUsd: Number((hours * row.hourlyRate).toFixed(2)),
        amountInr: Number((hours * row.hourlyRateInr).toFixed(2)),
      });
    });

    const clients = Array.from(byClient.values())
      .map((c) => ({
        ...c,
        approvedHours: Number(c.approvedHours.toFixed(2)),
      }))
      .sort((a, b) => a.clientName.localeCompare(b.clientName));

    const summary = {
      totalClients: clients.length,
      totalApprovedHours: Number(
        clients.reduce((sum, item) => sum + Number(item.approvedHours || 0), 0).toFixed(2)
      ),
      totalAmountUsd: Number(
        clients.reduce((sum, item) => sum + Number(item.amountUsd || 0), 0).toFixed(2)
      ),
      totalAmountInr: Number(
        clients.reduce((sum, item) => sum + Number(item.amountInr || 0), 0).toFixed(2)
      ),
      usdInrRate,
      defaultHourlyRateUsd,
    };

    return res.json({ summary, clients });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load invoice preview" });
  }
};

function makeInvoiceNumber(index) {
  const dateKey = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `INV-${dateKey}-${String(index).padStart(4, "0")}`;
}

exports.generateInvoices = async (req, res) => {
  try {
    const [settings, existingCount] = await Promise.all([
      InvoiceSetting.findByPk(1),
      Invoice.count(),
    ]);
    const usdInrRate = Number(settings?.usd_inr_rate || 83);
    const defaultHourlyRateUsd = Number(settings?.default_hourly_rate_usd || 25);

    const approvedUnbilledLogs = await Timesheet.findAll({
      where: { approval_status: "Approved", invoiceId: null },
      include: [
        {
          model: Task,
          attributes: ["id", "task_id", "task_name", "description", "clientId"],
          include: [{ model: Client, attributes: ["id", "name", "client_code", "hourly_rate"] }],
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    const logsByClient = new Map();
    approvedUnbilledLogs.forEach((log) => {
      const client = log.Task?.Client;
      if (!client) return;
      if (!logsByClient.has(client.id)) {
        logsByClient.set(client.id, { client, logs: [] });
      }
      logsByClient.get(client.id).logs.push(log);
    });

    const createdInvoices = [];
    let runningIndex = existingCount + 1;
    for (const { client, logs } of logsByClient.values()) {
      const totalHours = Number(
        logs.reduce((sum, item) => sum + Number(item.hours_spent || 0), 0).toFixed(2)
      );
      const hourlyRateUsd = Number(client.hourly_rate || defaultHourlyRateUsd);
      const totalAmountUsd = Number((totalHours * hourlyRateUsd).toFixed(2));
      const totalAmountInr = Number((totalAmountUsd * usdInrRate).toFixed(2));

      const invoice = await Invoice.create({
        invoice_number: makeInvoiceNumber(runningIndex++),
        clientId: client.id,
        total_hours: totalHours,
        hourly_rate_usd: hourlyRateUsd,
        usd_inr_rate: usdInrRate,
        total_amount_usd: totalAmountUsd,
        total_amount_inr: totalAmountInr,
        status: "Pending",
      });

      await Timesheet.update(
        { invoiceId: invoice.id },
        { where: { id: { [Op.in]: logs.map((entry) => entry.id) } } }
      );

      createdInvoices.push(invoice);
    }

    return res.json({
      message: createdInvoices.length
        ? "Invoices generated from approved timesheets"
        : "No approved unbilled timesheets available",
      createdCount: createdInvoices.length,
      invoices: createdInvoices,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to generate invoices" });
  }
};

exports.getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.findAll({
      include: [{ model: Client, as: "Client", attributes: ["id", "name", "client_code"] }],
      order: [["createdAt", "DESC"]],
    });
    return res.json(invoices);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch invoices" });
  }
};
