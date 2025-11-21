export const API_BASE = import.meta.env.VITE_BACKEND_URL || "";

export async function api(path, { method = "GET", body, token } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    throw new Error(text || "Invalid server response");
  }
  if (!res.ok) {
    throw new Error(data?.detail || data?.message || `Request failed (${res.status})`);
  }
  return data;
}

export function saveAuth(token, role) {
  localStorage.setItem("agro_token", token);
  localStorage.setItem("agro_role", role);
}
export function clearAuth() {
  localStorage.removeItem("agro_token");
  localStorage.removeItem("agro_role");
}
export function getAuth() {
  return {
    token: localStorage.getItem("agro_token"),
    role: localStorage.getItem("agro_role"),
  };
}
