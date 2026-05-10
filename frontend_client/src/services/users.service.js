import { adminRequest, buildAdminHeaders } from "./api";

export async function validateAdminToken(backend, token) {
  return fetch(`${backend}/api/users`, {
    headers: buildAdminHeaders(token),
  });
}

export function getUsers(backend, token) {
  return adminRequest(backend, "/api/users", { token });
}

export function createUser(backend, token, body) {
  return adminRequest(backend, "/api/users", { method: "POST", token, body });
}

export function deleteUserById(backend, token, id) {
  return adminRequest(backend, `/api/users/${id}`, { method: "DELETE", token });
}

export function addUserFace(backend, token, id, body) {
  return adminRequest(backend, `/api/users/${id}/face`, { method: "POST", token, body });
}
