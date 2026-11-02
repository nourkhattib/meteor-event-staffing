import { APP_STORAGE_KEYS, ROUTES } from "./config.js";

const SESSION_KEY = APP_STORAGE_KEYS.session;
const SESSION_VERIFY_URL =
  "https://lfjzqxnvddynzetpztrd.functions.supabase.co/verify-session";

export function saveSession(sessionData) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
}

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error("Failed to parse session:", error);
    return null;
  }
}

export function getSessionToken() {
  const session = getSession();
  return session?.session_token || null;
}

export function getCurrentUser() {
  const session = getSession();
  return session?.user || null;
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function isLoggedIn() {
  const session = getSession();
  return !!(session?.session_token && session?.user);
}

export function logout() {
  clearSession();
  window.location.href = ROUTES.login;
}

export async function verifySessionWithServer() {
  const session = getSession();

  if (!session?.session_token) {
    return { ok: false, error: "No session token" };
  }

  try {
    const response = await fetch(SESSION_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        session_token: session.session_token
      })
    });

    let result = null;

    try {
      result = await response.json();
    } catch {
      result = null;
    }

    if (!response.ok || !result?.ok || !result?.user) {
      clearSession();
      return {
        ok: false,
        error: result?.error || "Session verification failed"
      };
    }

    const freshSession = {
      session_token: session.session_token,
      user: result.user
    };

    saveSession(freshSession);

    return {
      ok: true,
      user: result.user
    };
  } catch (error) {
    console.error("Session verification error:", error);
    clearSession();
    return {
      ok: false,
      error: "Server connection failed"
    };
  }
}

export async function requireAuth(requiredRole = null) {
  const result = await verifySessionWithServer();

  if (!result.ok || !result.user) {
    window.location.href = ROUTES.login;
    return null;
  }

  const user = result.user;

  if (requiredRole && user.role !== requiredRole) {
    if (user.role === "admin") {
      window.location.href = ROUTES.admin;
    } else if (user.role === "contractor") {
      window.location.href = ROUTES.contractor;
    } else {
      window.location.href = ROUTES.login;
    }
    return null;
  }

  return user;
}

export async function redirectIfLoggedIn() {
  const session = getSession();

  if (!session?.session_token) return;

  const result = await verifySessionWithServer();

  if (!result.ok || !result.user) return;

  const user = result.user;

  if (user.role === "admin") {
    window.location.href = ROUTES.admin;
    return;
  }

  if (user.role === "contractor") {
    window.location.href = ROUTES.contractor;
    return;
  }
}