const ADMIN_SESSION_KEY = "daily-doodlebook-admin-session";
export const ADMIN_SESSION_EVENT = "daily-doodlebook-admin-session-updated";

export interface AdminSession {
  email: string;
}

function getStorage() {
  if (typeof window === "undefined") return null;

  const storage = window.localStorage;
  if (
    !storage ||
    typeof storage.getItem !== "function" ||
    typeof storage.setItem !== "function" ||
    typeof storage.removeItem !== "function"
  ) {
    return null;
  }

  return storage;
}

function readAdminSession(): AdminSession | null {
  const storage = getStorage();
  if (!storage) return null;

  const raw = storage.getItem(ADMIN_SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AdminSession;
  } catch (error) {
    console.error("Unable to parse admin session", error);
    return null;
  }
}

export function persistAdminSession(session: AdminSession) {
  const storage = getStorage();
  if (!storage || typeof window === "undefined") return;

  storage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new CustomEvent(ADMIN_SESSION_EVENT));
}

export function clearAdminSession() {
  const storage = getStorage();
  if (!storage || typeof window === "undefined") return;

  storage.removeItem(ADMIN_SESSION_KEY);
  window.dispatchEvent(new CustomEvent(ADMIN_SESSION_EVENT));
}

export function getAdminSession(): AdminSession | null {
  return readAdminSession();
}

export function isAdminLoggedIn() {
  return Boolean(getAdminSession());
}
