import {
  ADMIN_TOKEN_KEY,
  BACKEND_URL_KEY,
  DEFAULT_BACKEND_URL,
  IOT_CAMERA_URL_KEY,
} from "./constants";

export function getCookieValue(name) {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];
}

export function getSavedIotCameraUrl() {
  return localStorage.getItem(IOT_CAMERA_URL_KEY) || decodeURIComponent(getCookieValue(IOT_CAMERA_URL_KEY) || "");
}

export function getSavedBackendUrl() {
  return localStorage.getItem(BACKEND_URL_KEY) || decodeURIComponent(getCookieValue(BACKEND_URL_KEY) || "") || DEFAULT_BACKEND_URL;
}

export function saveIotCameraUrl(url) {
  localStorage.setItem(IOT_CAMERA_URL_KEY, url);
  document.cookie = `${IOT_CAMERA_URL_KEY}=${encodeURIComponent(url)}; max-age=2592000; path=/; SameSite=Lax`;
}

export function saveBackendUrl(url) {
  localStorage.setItem(BACKEND_URL_KEY, url);
  document.cookie = `${BACKEND_URL_KEY}=${encodeURIComponent(url)}; max-age=2592000; path=/; SameSite=Lax`;
}

export function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY) || "";
}

export function saveAdminToken(token) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}
