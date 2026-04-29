const { Op } = require("sequelize");
const { Timesheet, Task, User, Project, Client, Invoice, Issue } = require("../models");

async function getTimesheetReport({ startDate, endDate, employeeId, clientId }) {
  const where = { approval_status: "Approved" };
  if (startDate && endDate) {
    where.start_time = { [Op.between]: [new Date(startDate), new Date(endDate)] };
  } else if (startDate) {
    where.start_time = { [Op.gte]: new Date(startDate) };
  } else if (endDate) {
    where.start_time = { [Op.lte]: new Date(endDate) };
  }
  if (employeeId) where.employeeId = employeeId;

  const taskWhere = {};
  if (clientId) taskWhere.clientId = clientId;

  const entries = await Timesheet.findAll({
    where,
    include: [
      {
        model: User,
        as: "Employee",
        attributes: ["id", "name", "username", "hourly_rate"],
      },
      {
        model: Task,
        attributes: ["id", "task_id", "task_name", "clientId"],
        where: Object.keys(taskWhere).length ? taskWhere : undefined,
        required: Object.keys(taskWhere).length > 0,
        include: [
          { model: Client, attributes: ["id", "name", "client_code", "hourly_rate"] },
          { model: Project, as: "Project", attributes: ["id", "project_title", "project_code"], required: false },
        ],
      },
    ],
    order: [["start_time", "DESC"]],
  });

  const byEmployee = {};
  const byProject = {};

  for (const entry of entries) {
    const empId = entry.Employee?.id;
    if (empId) {
      if (!byEmployee[empId]) {
        byEmployee[empId] = {
          employeeId: empId,
          employeeName: entry.Employee.name,
          username: entry.Employee.username,
          hourlyRate: entry.Employee.hourly_rate || 0,
          totalHours: 0,
          billableHours: 0,
          entries: 0,
        };
      }
      byEmployee[empId].totalHours += Number(entry.hours_spent || 0);
      if (entry.billable_type === "Yes") byEmployee[empId].billableHours += Number(entry.hours_spent || 0);
      byEmployee[empId].entries += 1;
    }

    const proj = entry.Task?.Project;
    const key = proj?.id || "no-project";
    if (!byProject[key]) {
      byProject[key] = {
        projectId: proj?.id || null,
        projectTitle: proj?.project_title || "No Project",
        projectCode: proj?.project_code || "-",
        totalHours: 0,
        billableHours: 0,
      };
    }
    byProject[key].totalHours += Number(entry.hours_spent || 0);
    if (entry.billable_type === "Yes") byProject[key].billableHours += Number(entry.hours_spent || 0);
  }

  const totalHours = entries.reduce((sum, entry) => sum + Number(entry.hours_spent || 0), 0);
  const billableHours = entries
    .filter((entry) => entry.billable_type === "Yes")
    .reduce((sum, entry) => sum + Number(entry.hours_spent || 0), 0);

  return {
    summary: {
      totalEntries: entries.length,
      totalHours: Number(totalHours.toFixed(2)),
      billableHours: Number(billableHours.toFixed(2)),
      nonBillableHours: Number((totalHours - billableHours).toFixed(2)),
    },
    byEmployee: Object.values(byEmployee).map((entry) => ({
      ...entry,
      totalHours: Number(entry.totalHours.toFixed(2)),
      billableHours: Number(entry.billableHours.toFixed(2)),
    })),
    byProject: Object.values(byProject).map((entry) => ({
      ...entry,
      totalHours: Number(entry.totalHours.toFixed(2)),
      billableHours: Number(entry.billableHours.toFixed(2)),
    })),
  };
}

async function getProjectReport() {
  const projects = await Project.findAll({
    include: [
      { model: Client, as: "Client", attributes: ["id", "name", "client_code"] },
      {
        model: Task,
        as: "Tasks",
        attributes: ["id", "status", "priority", "estimated_hours"],
        required: false,
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  return projects.map((proj) => {
    const tasks = proj.Tasks || [];
    const statusCounts = { "Not Started": 0, "In Progress": 0, Completed: 0, "Waiting for Client": 0 };
    let estimatedHours = 0;

    for (const task of tasks) {
      if (statusCounts[task.status] !== undefined) statusCounts[task.status] += 1;
      estimatedHours += Number(task.estimated_hours || 0);
    }

    return {
      id: proj.id,
      project_code: proj.project_code,
      project_title: proj.project_title,
      status: proj.status,
      client: proj.Client ? { id: proj.Client.id, name: proj.Client.name } : null,
      start_date: proj.start_date,
      end_date: proj.end_date,
      totalTasks: tasks.length,
      statusCounts,
      estimatedHours: Number(estimatedHours.toFixed(2)),
      completionPct: tasks.length > 0 ? Math.round((statusCounts.Completed / tasks.length) * 100) : 0,
    };
  });
}

async function getSummary() {
  const [
    totalTimesheets,
    approvedTimesheets,
    pendingTimesheets,
    totalIssues,
    openIssues,
    resolvedIssues,
    totalInvoices,
    paidInvoices,
  ] = await Promise.all([
    Timesheet.count(),
    Timesheet.count({ where: { approval_status: "Approved" } }),
    Timesheet.count({ where: { approval_status: "Pending" } }),
    Issue.count(),
    Issue.count({ where: { status: "Open" } }),
    Issue.count({ where: { status: "Resolved" } }),
    Invoice.count(),
    Invoice.count({ where: { status: "Paid" } }),
  ]);

  const approvedEntries = await Timesheet.findAll({
    where: { approval_status: "Approved" },
    attributes: ["hours_spent", "billable_type"],
  });

  const totalApprovedHours = approvedEntries.reduce((sum, entry) => sum + Number(entry.hours_spent || 0), 0);
  const billableHours = approvedEntries
    .filter((entry) => entry.billable_type === "Yes")
    .reduce((sum, entry) => sum + Number(entry.hours_spent || 0), 0);

  return {
    timesheets: {
      total: totalTimesheets,
      approved: approvedTimesheets,
      pending: pendingTimesheets,
      totalApprovedHours: Number(totalApprovedHours.toFixed(2)),
      billableHours: Number(billableHours.toFixed(2)),
    },
    issues: {
      total: totalIssues,
      open: openIssues,
      resolved: resolvedIssues,
      closed: totalIssues - openIssues - resolvedIssues,
    },
    invoices: {
      total: totalInvoices,
      paid: paidInvoices,
    },
  };
}

async function getUtilizationReport() {
  const users = await User.findAll({
    where: { is_active: true },
    attributes: ["id", "name", "username"],
    include: [
      {
        model: Timesheet,
        as: "Timesheets",
        where: {
          start_time: {
            [Op.gte]: new Date(new Date().setDate(new Date().getDate() - 30)), // Last 30 days
          },
        },
        required: false,
      },
    ],
  });

  const standardCapacity = 160; // 4 weeks * 40 hours

  return users.map((u) => {
    const hours = (u.Timesheets || []).reduce((sum, t) => sum + Number(t.hours_spent || 0), 0);
    return {
      userId: u.id,
      name: u.name,
      username: u.username,
      hoursLogged: Number(hours.toFixed(2)),
      capacity: standardCapacity,
      utilization: Math.round((hours / standardCapacity) * 100),
    };
  });
}

async function getProfitabilityReport() {
  const { Expense, Invoice, Timesheet, InvoiceSetting } = require("../models");

  const [projects, invoices, expenses, settings] = await Promise.all([
    Project.findAll({
      include: [
        { model: Client, as: "Client", attributes: ["id", "name", "hourly_rate"] },
        { model: Task, as: "Tasks", attributes: ["id"], required: false,
          include: [{ model: Timesheet, attributes: ["hours_spent", "billable_type", "employeeId"], required: false }] },
      ],
    }),
    Invoice.findAll({ include: [{ model: Client, as: "Client", attributes: ["id"] }] }),
    Expense.findAll(),
    InvoiceSetting.findOne(),
  ]);

  const defaultRate = settings?.default_hourly_rate_usd || 0;

  return projects.map((proj) => {
    const allTimesheets = (proj.Tasks || []).flatMap(t => t.Timesheets || []);
    const laborHours = allTimesheets.reduce((s, t) => s + Number(t.hours_spent || 0), 0);
    const laborCost = laborHours * defaultRate;

    const projExpenses = expenses.filter(e => e.projectId === proj.id);
    const expenseTotal = projExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);

    const projInvoices = invoices.filter(i => i.Client?.id === proj.clientId);
    const revenue = projInvoices.filter(i => i.status === "Paid").reduce((s, i) => s + Number(i.total_amount_usd || 0), 0);
    const pendingRevenue = projInvoices.filter(i => i.status !== "Paid").reduce((s, i) => s + Number(i.total_amount_usd || 0), 0);

    const totalCost = laborCost + expenseTotal;
    const profit = revenue - totalCost;

    return {
      id: proj.id,
      project_code: proj.project_code,
      project_title: proj.project_title,
      status: proj.status,
      budget_usd: proj.budget_usd || null,
      client: proj.Client ? { id: proj.Client.id, name: proj.Client.name } : null,
      laborHours: Number(laborHours.toFixed(2)),
      laborCost: Number(laborCost.toFixed(2)),
      expenseTotal: Number(expenseTotal.toFixed(2)),
      totalCost: Number(totalCost.toFixed(2)),
      revenue: Number(revenue.toFixed(2)),
      pendingRevenue: Number(pendingRevenue.toFixed(2)),
      profit: Number(profit.toFixed(2)),
      margin: revenue > 0 ? Number(((profit / revenue) * 100).toFixed(1)) : 0,
      budgetUsed: proj.budget_usd ? Number(((totalCost / proj.budget_usd) * 100).toFixed(1)) : null,
    };
  });
}

async function getHeatmapReport() {
  const weeks = 8;
  const users = await User.findAll({
    where: { is_active: true },
    attributes: ["id", "name", "username"],
    include: [{ model: Timesheet, as: "TimeLogs", attributes: ["hours_spent", "start_time"], required: false }],
  });

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - weeks * 7);

  return users.map(u => {
    const weeklyHours = Array.from({ length: weeks }, (_, i) => {
      const wStart = new Date(startDate);
      wStart.setDate(startDate.getDate() + i * 7);
      const wEnd = new Date(wStart);
      wEnd.setDate(wStart.getDate() + 7);

      const hours = (u.TimeLogs || [])
        .filter(t => {
          const d = new Date(t.start_time);
          return d >= wStart && d < wEnd;
        })
        .reduce((s, t) => s + Number(t.hours_spent || 0), 0);

      return { week: wStart.toISOString().slice(0, 10), hours: Number(hours.toFixed(1)) };
    });

    const totalHours = weeklyHours.reduce((s, w) => s + w.hours, 0);
    return { userId: u.id, name: u.name, username: u.username, weeklyHours, totalHours: Number(totalHours.toFixed(1)) };
  });
}

async function getWorkloadReport() {
  const { Op } = require("sequelize");
  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const standardWeeklyHours = 40;

  const users = await User.findAll({
    where: { is_active: true },
    attributes: ["id", "name", "username", "hourly_rate"],
    include: [
      {
        model: Task,
        as: "AssignedTasks",
        where: { status: { [Op.ne]: "Completed" } },
        attributes: ["id", "task_name", "task_id", "status", "priority", "due_date", "estimated_hours", "projectId"],
        required: false,
        include: [{ model: Project, as: "Project", attributes: ["id", "project_title", "project_code"], required: false }],
      },
    ],
  });

  return users.map((u) => {
    const tasks = u.AssignedTasks || [];
    const totalEstimated = tasks.reduce((s, t) => s + Number(t.estimated_hours || 0), 0);
    const overdue = tasks.filter((t) => t.due_date && new Date(t.due_date) < now).length;
    const dueSoon = tasks.filter((t) => {
      if (!t.due_date) return false;
      const d = new Date(t.due_date);
      return d >= now && d <= in30;
    }).length;

    const utilization = Math.round((totalEstimated / (standardWeeklyHours * 4)) * 100);
    const status = utilization > 100 ? "overloaded" : utilization > 75 ? "busy" : utilization > 30 ? "normal" : "available";

    return {
      userId: u.id,
      name: u.name,
      username: u.username,
      taskCount: tasks.length,
      estimatedHours: Number(totalEstimated.toFixed(1)),
      overdueCount: overdue,
      dueSoonCount: dueSoon,
      utilization,
      status,
      tasks: tasks.map((t) => ({
        id: t.id,
        task_id: t.task_id,
        task_name: t.task_name,
        status: t.status,
        priority: t.priority,
        due_date: t.due_date,
        estimated_hours: t.estimated_hours,
        project: t.Project ? { id: t.Project.id, title: t.Project.project_title } : null,
      })),
    };
  });
}

async function getPortfolioReport() {
  const { Expense } = require("../models");

  const projects = await Project.findAll({
    where: { is_template: false },
    include: [
      { model: Client, as: "Client", attributes: ["id", "name"] },
      { model: ProjectGroup, as: "ProjectGroup", attributes: ["id", "name", "color"] },
      {
        model: Task,
        as: "Tasks",
        attributes: ["id", "status", "priority", "estimated_hours", "due_date"],
        required: false,
      },
      { model: Expense, as: "Expenses", attributes: ["amount"], required: false },
    ],
    order: [["createdAt", "DESC"]],
  });

  const now = new Date();

  return projects.map((proj) => {
    const tasks = proj.Tasks || [];
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "Completed").length;
    const overdue = tasks.filter(
      (t) => t.due_date && new Date(t.due_date) < now && t.status !== "Completed"
    ).length;
    const criticalCount = tasks.filter((t) => t.priority === "Critical").length;
    const estimatedHours = tasks.reduce((s, t) => s + Number(t.estimated_hours || 0), 0);
    const expenses = (proj.Expenses || []).reduce((s, e) => s + Number(e.amount || 0), 0);
    const health =
      overdue > 2 || criticalCount > 3 ? "at_risk" : overdue > 0 ? "needs_attention" : "on_track";

    return {
      id: proj.id,
      project_code: proj.project_code,
      project_title: proj.project_title,
      status: proj.status,
      progress: proj.progress,
      start_date: proj.start_date,
      end_date: proj.end_date,
      budget_usd: proj.budget_usd,
      expenses: Number(expenses.toFixed(2)),
      client: proj.Client,
      group: proj.ProjectGroup,
      taskCount: total,
      completedTasks: completed,
      overdueTasks: overdue,
      criticalTasks: criticalCount,
      estimatedHours: Number(estimatedHours.toFixed(1)),
      completionPct: total > 0 ? Math.round((completed / total) * 100) : proj.progress,
      health,
    };
  });
}

module.exports = {
  getTimesheetReport,
  getProjectReport,
  getSummary,
  getUtilizationReport,
  getProfitabilityReport,
  getHeatmapReport,
  getWorkloadReport,
  getPortfolioReport,
};
