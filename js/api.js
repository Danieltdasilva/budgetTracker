const API_BASE = ""; // empty = same domain

async function request(path, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "Request failed");
  }

  return res.json();
}

export const api = {
  login: (email, password) =>
    request("/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    }),

  signup: (email, password) =>
    request("/signup", {
      method: "POST",
      body: JSON.stringify({ email, password })
    }),

  getEntries: () =>
    request("/entries"),

  createEntry: (entry) =>
    request("/entries", {
      method: "POST",
      body: JSON.stringify(entry)
    }),

  updateEntry: (id, updates) =>
    request(`/entries/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates)
    }),

  deleteEntry: (id) =>
    request(`/entries/${id}`, {
      method: "DELETE"
    })
};
