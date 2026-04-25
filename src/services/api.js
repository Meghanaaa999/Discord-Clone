import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

function authHeader(token) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

function getErrorMessage(error) {
  if (error?.code === "ERR_NETWORK" || !error?.response) {
    return "Cannot connect to server. Please run backend and try again.";
  }
  return error?.response?.data?.message || error.message || "Request failed";
}

export async function registerUser(payload) {
  try {
    const { data } = await api.post("/auth/register", payload);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function loginUser(payload) {
  try {
    const { data } = await api.post("/auth/login", payload);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getMe(token) {
  try {
    const { data } = await api.get("/auth/me", authHeader(token));
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getGroups(token) {
  try {
    const { data } = await api.get("/chat/groups", authHeader(token));
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getDiscoverGroups(token) {
  try {
    const { data } = await api.get("/chat/groups/discover", authHeader(token));
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function createGroup(token, payload) {
  try {
    const { data } = await api.post("/chat/groups", payload, authHeader(token));
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function joinGroup(token, groupId) {
  try {
    const { data } = await api.post(`/chat/groups/${groupId}/join`, {}, authHeader(token));
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getMessages(token, groupId) {
  try {
    const { data } = await api.get(`/chat/groups/${groupId}/messages`, authHeader(token));
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
