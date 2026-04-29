import api from "./http";

export async function getAnnouncements() {
  const response = await api.get("/announcements");
  return response.data;
}

export async function createAnnouncement(data) {
  const response = await api.post("/announcements", data);
  return response.data;
}
