import api from "./http";

export async function getSprints(params) {
  const response = await api.get("/sprints", { params });
  return response.data;
}

export async function createSprint(data) {
  const response = await api.post("/sprints", data);
  return response.data;
}

export async function getSprintById(id) {
  const response = await api.get(`/sprints/${id}`);
  return response.data;
}

export async function updateSprint(id, data) {
  const response = await api.patch(`/sprints/${id}`, data);
  return response.data;
}

export async function deleteSprint(id) {
  const response = await api.delete(`/sprints/${id}`);
  return response.data;
}
