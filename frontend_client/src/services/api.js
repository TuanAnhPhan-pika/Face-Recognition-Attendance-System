export function buildAdminHeaders(token, hasJsonBody = false) {
  const headers = { "x-admin-token": token };
  if (hasJsonBody) headers["Content-Type"] = "application/json";
  return headers;
}

export async function adminRequest(backend, endpoint, { method = "GET", token, body = null } = {}) {
  const options = {
    method,
    headers: buildAdminHeaders(token, Boolean(body)),
  };

  if (body) options.body = JSON.stringify(body);

  try {
    const res = await fetch(`${backend}${endpoint}`, options);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const errMsg = data.error || data.message || `Lỗi ${res.status}`;
      throw new Error(errMsg);
    }
    return method === "DELETE" ? true : await res.json();
  } catch (err) {
    const isNetworkErr = ["Failed to fetch", "NetworkError"].some(e => err.message.includes(e));
    throw new Error(isNetworkErr ? "Không thể kết nối tới server!" : err.message);
  }
}
