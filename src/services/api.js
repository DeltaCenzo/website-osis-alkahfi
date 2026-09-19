const CORE_API = import.meta.env.VITE_CORE_API_URL ||
  "https://script.google.com/macros/s/AKfycbzQM8KdNCWvhWoyohJa5zfUDT42uxayG-6XVK7f1vU9UA0hRiDF50LItX8927kIvAlXew/exec";

// Galeri kini ditangani backend utama (Sheets). Tidak ada backend Drive terpisah.
const GALLERY_API = import.meta.env.VITE_GALLERY_API_URL ||
  "https://script.google.com/macros/s/AKfycbzQM8KdNCWvhWoyohJa5zfUDT42uxayG-6XVK7f1vU9UA0hRiDF50LItX8927kIvAlXew/exec";

export { CORE_API, GALLERY_API };

async function readJson(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Respons backend tidak valid (HTTP ${response.status}).`);
  }
}

export async function post(action, params = {}, { signal } = {}) {
  const body = new URLSearchParams({ action });
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      body.set(key, String(value));
    }
  });

  const response = await fetch(CORE_API, {
    method: "POST",
    body,
    signal,
    redirect: "follow",
  });

  const data = await readJson(response);
  if (data && data.success === false && !data.code) {
    data.error = data.message;
  }
  return data;
}

export function login(password, { rememberDevice = false, clientId = "" } = {}) {
  return post("login", {
    password,
    rememberDevice,
    clientId,
    deviceName: "Browser OSIS",
  });
}

export function submitAspiration(payload) {
  return post("submit", payload);
}

export function countAspirations() {
  return post("count");
}

export function listAspirations(token) {
  return post("list", { token });
}

export function updateAspiration(token, patch) {
  return post("update", { token, ...patch });
}

export function deleteAspiration(token, id) {
  return post("delete", { token, id });
}

export function fetchAnnouncements() {
  return post("announcementPublic");
}

export function listAnnouncements(token) {
  return post("announcementList", { token });
}

export function saveAnnouncement(token, item) {
  return post("announcementSave", { token, ...item });
}

export function deleteAnnouncement(token, id) {
  return post("announcementDelete", { token, id });
}

export function fetchEvent() {
  return post("eventPublic");
}

export function saveEvent(token, event) {
  return post("eventSave", { token, ...event });
}

export function changePassword(token, newPassword) {
  return post("changePassword", { token, newPassword });
}

export function trustedDeviceEnroll(token, clientId, deviceName) {
  return post("trustedDeviceEnroll", { token, clientId, deviceName });
}

export function trustedDeviceList(token) {
  return post("trustedDeviceList", { token });
}

export function trustedDeviceRevoke(token, deviceId) {
  return post("trustedDeviceRevoke", { token, deviceId });
}

export function pushConfig(token, { subscriptionId = "" } = {}) {
  return post("pushConfig", { token, subscriptionId });
}

export function pushRegister(token, { subscriptionId, deviceName, preferencesJson, siteUrl }) {
  return post("pushRegister", { token, subscriptionId, deviceName, preferencesJson, siteUrl });
}

export function pushUnregister(token, subscriptionId) {
  return post("pushUnregister", { token, subscriptionId });
}

export async function requestGalleryCredential(token) {
  return post("galleryCredential", { token });
}

export async function fetchGalleryData({ signal } = {}) {
  const url = new URL(GALLERY_API);
  url.searchParams.set("action", "gallery");
  const response = await fetch(url.toString(), { signal });
  return readJson(response);
}

export async function galleryMutation(authToken, action, payload = {}) {
  const body = new URLSearchParams({
    responseMode: "json",
    requestId: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    payload: JSON.stringify({ action, authToken, ...payload }),
  });

  const response = await fetch(GALLERY_API, { method: "POST", body });
  return readJson(response);
}

export function upsertAlbum(authToken, data) {
  return galleryMutation(authToken, "upsertAlbum", data);
}

export function uploadGalleryPhoto(authToken, data) {
  return galleryMutation(authToken, "uploadPhoto", data);
}

export function deleteGalleryPhoto(authToken, albumId, photoId) {
  return galleryMutation(authToken, "deletePhoto", { albumId, photoId });
}

export function deleteGalleryPhotos(authToken, albumId, photoIds) {
  return galleryMutation(authToken, "deletePhotos", { albumId, photoIds });
}

export function setGalleryCover(authToken, albumId, photoId) {
  return galleryMutation(authToken, "setCover", { albumId, photoId });
}

export function deleteGalleryAlbum(authToken, albumId) {
  return galleryMutation(authToken, "deleteAlbum", { albumId });
}

export function reorderGalleryPhotos(authToken, albumId, photoIds) {
  return galleryMutation(authToken, "reorderPhotos", { albumId, photoIds });
}

export async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Gagal membaca foto."));
    reader.readAsDataURL(file);
  });
}

export async function sha256Hex(file) {
  if (!crypto?.subtle) return "";
  const buffer = await file.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
