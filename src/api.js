export class ApiError extends Error {
  constructor(message, status, fields = {}) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

function errorMessage(data) {
  if (data?.error || data?.detail) return String(data.error || data.detail);
  const errors = Object.entries(data || {}).map(([field, messages]) => {
    const text = Array.isArray(messages) ? messages.join(" ") : String(messages);
    return `${field.replaceAll("_", " ")}: ${text}`;
  });
  return errors.join(" ") || "The request failed. Please try again.";
}

async function fetchJSON(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    signal: AbortSignal.timeout(15000),
    ...options,
  });
  const data = response.headers.get("content-type")?.includes("application/json")
    ? await response.json()
    : null;
  if (!response.ok) {
    throw new ApiError(data ? errorMessage(data) : "The server could not complete the request.", response.status, data || {});
  }
  if (data === null) throw new ApiError("The API returned an unexpected response. Make sure Django is running.", response.status);
  return data;
}

export async function api(url, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const headers = { ...options.headers };
  if (["POST", "PATCH", "PUT", "DELETE"].includes(method)) {
    const { csrfToken } = await fetchJSON("/api/admin/csrf/");
    headers["X-CSRFToken"] = csrfToken;
  }
  if (options.body != null) headers["Content-Type"] = "application/json";
  return fetchJSON(url, { ...options, method, headers });
}
