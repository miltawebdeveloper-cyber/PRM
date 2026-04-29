import api from "./http";

export async function getManagerTasks() {
  const response = await api.get("/tasks/manager");
  return response.data;
}

export async function createTask(input) {
  const response = await api.post("/tasks", input);
  return response.data;
}

export async function getAllTasks(params = {}) {
  const response = await api.get("/tasks", { params });
  return response.data;
}

export async function getMyTasks() {
  const response = await api.get("/tasks/my");
  return response.data;
}

export async function updateTaskStatus(taskId, payload) {
  const response = await api.patch(`/tasks/${taskId}/status`, payload);
  return response.data;
}

export async function updateTask(taskId, payload) {
  const response = await api.patch(`/tasks/${taskId}`, payload);
  return response.data;
}

export async function getTaskComments(taskId) {
  const response = await api.get(`/tasks/${taskId}/comments`);
  return response.data;
}

export async function createTaskComment(taskId, payload) {
  const response = await api.post(`/tasks/${taskId}/comments`, payload);
  return response.data;
}

export async function getTaskActivity(taskId) {
  const response = await api.get(`/tasks/${taskId}/activity`);
  return response.data;
}

export async function importTasks(formData) {
  const response = await api.post("/tasks/import", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data;
}
