const timesheetService = require("../services/timesheetService");

exports.startTimer = async (req, res) => {
  try {
    const log = await timesheetService.startTimer(req.body || {}, req.user);
    return res.status(201).json(log);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message || "Failed to start timer" });
  }
};

exports.stopTimer = async (req, res) => {
  try {
    const log = await timesheetService.stopTimer(req.params.id, req.body || {}, req.user);
    return res.json(log);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message || "Failed to stop timer" });
  }
};

exports.getMyTimesheets = async (req, res) => {
  try {
    const logs = await timesheetService.getMyTimesheets(req.user);
    return res.json(logs);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message || "Failed to fetch timesheets" });
  }
};

exports.getPendingApprovals = async (_req, res) => {
  try {
    const logs = await timesheetService.getPendingApprovals();
    return res.json(logs);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message || "Failed to fetch pending approvals" });
  }
};

exports.reviewTimesheet = async (req, res) => {
  try {
    const result = await timesheetService.reviewTimesheet(req.params.id, req.body || {}, req.user);
    return res.json(result);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message || "Failed to review timesheet entry" });
  }
};

exports.getTimesheetSummary = async (req, res) => {
  try {
    const summary = await timesheetService.getTimesheetSummary(req.user);
    return res.json(summary);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message || "Failed to fetch timesheet summary" });
  }
};
