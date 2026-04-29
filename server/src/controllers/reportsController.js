const reportsService = require("../services/reportsService");

exports.getTimesheetReport = async (req, res) => {
  try {
    const report = await reportsService.getTimesheetReport(req.query || {});
    return res.json(report);
  } catch (error) {
    console.error("Timesheet report error:", error);
    return res.status(error.status || 500).json({ message: error.message || "Failed to generate timesheet report" });
  }
};

exports.getProjectReport = async (_req, res) => {
  try {
    const report = await reportsService.getProjectReport();
    return res.json(report);
  } catch (error) {
    console.error("Project report error:", error);
    return res.status(error.status || 500).json({ message: error.message || "Failed to generate project report" });
  }
};

exports.getSummary = async (_req, res) => {
  try {
    const summary = await reportsService.getSummary();
    return res.json(summary);
  } catch (error) {
    console.error("Summary report error:", error);
    return res.status(error.status || 500).json({ message: error.message || "Failed to generate summary report" });
  }
};
exports.getUtilizationReport = async (_req, res) => {
  try {
    const report = await reportsService.getUtilizationReport();
    return res.json(report);
  } catch (error) {
    console.error("Utilization report error:", error);
    return res.status(error.status || 500).json({ message: error.message || "Failed to generate utilization report" });
  }
};

exports.getProfitabilityReport = async (_req, res) => {
  try {
    const report = await reportsService.getProfitabilityReport();
    return res.json(report);
  } catch (error) {
    console.error("Profitability report error:", error);
    return res.status(error.status || 500).json({ message: error.message || "Failed to generate profitability report" });
  }
};

exports.getHeatmapReport = async (_req, res) => {
  try {
    const report = await reportsService.getHeatmapReport();
    return res.json(report);
  } catch (error) {
    console.error("Heatmap report error:", error);
    return res.status(error.status || 500).json({ message: error.message || "Failed to generate heatmap report" });
  }
};
