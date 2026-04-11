const ADMIN_SESSION_KEY = "daily-doodlebook-admin-session";
export const ADMIN_SESSION_EVENT = "daily-doodlebook-admin-session-updated";

export interface AdminSession {
  email: string;
}

function readAdminSession(): AdminSession | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(ADMIN_SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AdminSession;
  } catch (error) {
    console.error("Unable to parse admin session", error);
    return null;
  }
}

export function persistAdminSession(session: AdminSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new CustomEvent(ADMIN_SESSION_EVENT));
}

export function clearAdminSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ADMIN_SESSION_KEY);
  window.dispatchEvent(new CustomEvent(ADMIN_SESSION_EVENT));
}

export function getAdminSession(): AdminSession | null {
  return readAdminSession();
}

export function isAdminLoggedIn() {
  return Boolean(getAdminSession());
}
