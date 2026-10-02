import { adminRequest, buildAdminHeaders } from "./api";

export function getAttendance(backend, token) {
  return adminRequest(backend, "/api/attendance", { token });
}

export async function fetchAttendanceRaw(backend, token) {
  const res = await fetch(`${backend}/api/attendance`, {
    method: "GET",
    headers: buildAdminHeaders(token),
  });
  return res;
}

export async function submitAttendance(backend, body) {
  const res = await fetch(`${backend}/api/attendance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}
