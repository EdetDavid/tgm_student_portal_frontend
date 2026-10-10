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
  let response;
  try {
    response = await fetch(url, {
      credentials: "same-origin",
      signal: AbortSignal.timeout(15000),
      ...options,
    });
  } catch (error) {
    if (import.meta.env.DEV) console.error("[Student Portal API] Request failed", { url, error });
    if (error.name === "AbortError" || error.name === "TimeoutError") {
      throw new ApiError("The request took too long. Please try again.", 0);
    }
    throw new ApiError("We couldn't reach the service. Check your connection and try again.", 0);
  }
  let data = null;
  if (response.headers.get("content-type")?.includes("application/json")) {
    try {
      data = await response.json();
    } catch (error) {
      if (import.meta.env.DEV) console.error("[Student Portal API] Invalid JSON response", { url, status: response.status, error });
      if (response.status >= 500) throw new ApiError("Something went wrong on our side. Please try again shortly.", response.status);
    }
  }
  if (!response.ok) {
    if (response.status >= 500) {
      if (import.meta.env.DEV) console.error("[Student Portal API] Server error", { url, status: response.status, response: data });
      throw new ApiError("Something went wrong on our side. Please try again shortly.", response.status);
    }
    throw new ApiError(data ? errorMessage(data) : "We couldn't complete that request. Please try again.", response.status, data || {});
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
