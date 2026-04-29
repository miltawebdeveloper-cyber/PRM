import api from "./http";

export async function getForumPosts(params) {
  const response = await api.get("/forum-posts", { params });
  return response.data;
}

export async function createForumPost(data) {
  const response = await api.post("/forum-posts", data);
  return response.data;
}
