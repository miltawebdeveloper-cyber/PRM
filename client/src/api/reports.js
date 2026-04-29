import api from "./http";

export async function getTimesheetReport(params) {
  const response = await api.get("/reports/timesheets", { params: params || {} });
  return response.data;
}

export async function getProjectReport() {
  const response = await api.get("/reports/projects");
  return response.data;
}

export async function getReportsSummary() {
  const response = await api.get("/reports/summary");
  return response.data;
}

export async function getUtilizationReport() {
  const response = await api.get("/reports/utilization");
  return response.data;
}

export async function getHeatmapReport() {
  const response = await api.get("/reports/heatmap");
  return response.data;
}

export async function getProfitabilityReport() {
  const response = await api.get("/reports/profitability");
  return response.data;
}

export async function getWorkloadReport() {
  const response = await api.get("/reports/workload");
  return response.data;
}

export async function getPortfolioReport() {
  const response = await api.get("/reports/portfolio");
  return response.data;
}
