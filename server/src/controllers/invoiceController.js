const { Invoice, Client, Timesheet, User } = require("../models");

function getInvoiceInclude() {
  return [
    { model: Client, as: "Client", attributes: ["id", "name", "client_code"] },
    {
      model: Timesheet,
      as: "Entries",
      attributes: ["id", "hours_spent", "billable_type", "start_time", "end_time", "notes"],
      include: [{ model: User, as: "Employee", attributes: ["id", "name", "username"] }],
    },
  ];
}

exports.getAllInvoices = async (req, res) => {
  try {
    const { clientId, status } = req.query;
    const where = {};
    if (clientId) where.clientId = clientId;
    if (status) where.status = status;

    const invoices = await Invoice.findAll({
      where,
      include: [{ model: Client, as: "Client", attributes: ["id", "name", "client_code"] }],
      order: [["generated_at", "DESC"]],
    });

    return res.json(invoices);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch invoices" });
  }
};

exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id, {
      include: getInvoiceInclude(),
    });

    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    return res.json(invoice);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch invoice" });
  }
};

exports.updateInvoiceStatus = async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    const { status, notes } = req.body || {};

    const ALLOWED = ["Pending", "Paid"];
    if (status && !ALLOWED.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${ALLOWED.join(", ")}` });
    }

    if (status) {
      invoice.status = status;
      if (status === "Paid" && !invoice.paid_at) {
        invoice.paid_at = new Date();
      }
      if (status === "Pending") {
        invoice.paid_at = null;
      }
    }

    if (notes !== undefined) invoice.notes = notes || null;

    await invoice.save();

    const updated = await Invoice.findByPk(invoice.id, {
      include: [{ model: Client, as: "Client", attributes: ["id", "name", "client_code"] }],
    });

    return res.json({ message: "Invoice updated", invoice: updated });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update invoice" });
  }
};

exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    if (invoice.status === "Paid") {
      return res.status(400).json({ message: "Cannot delete a paid invoice" });
    }

    // Unlink timesheets before deleting
    await Timesheet.update({ invoiceId: null }, { where: { invoiceId: invoice.id } });

    await invoice.destroy();
    return res.json({ message: "Invoice deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete invoice" });
  }
};
