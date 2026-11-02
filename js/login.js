import { saveSession, redirectIfLoggedIn } from "./auth.js";
import { ROUTES } from "./config.js";

const form = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const msgBox = document.getElementById("msgBox");
const togglePasswordBtn = document.getElementById("togglePassword");
const eyeOpenIcon = document.getElementById("eyeOpenIcon");
const eyeClosedIcon = document.getElementById("eyeClosedIcon");

const LOGIN_FUNCTION_URL =
  "https://lfjzqxnvddynzetpztrd.functions.supabase.co/login-user";

init();

async function init() {
  await redirectIfLoggedIn();
  initRevealAnimation();
}

function initRevealAnimation() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
        }
      });
    },
    { threshold: 0.12 }
  );

  document.querySelectorAll(".fade-up").forEach((el) => {
    observer.observe(el);
  });
}

function showMessage(message, type = "error") {
  msgBox.innerHTML = `
    <div class="meteor-alert meteor-alert-${type}">
      <div class="meteor-alert-icon">
        ${getAlertIcon(type)}
      </div>
      <div class="meteor-alert-text">${message}</div>
    </div>
  `;
}

function clearMessage() {
  msgBox.innerHTML = "";
}

function getAlertIcon(type) {
  if (type === "success") {
    return `
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M20 6 9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }

  if (type === "warning") {
    return `
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M12 9v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <circle cx="12" cy="16.5" r="1" fill="currentColor"/>
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
      </svg>
    `;
  }

  return `
    <svg viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.8"/>
      <path d="M12 8v5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <circle cx="12" cy="16.5" r="1" fill="currentColor"/>
    </svg>
  `;
}

function setLoading(isLoading) {
  loginBtn.disabled = isLoading;
  loginBtn.classList.toggle("is-loading", isLoading);

  const textEl = loginBtn.querySelector(".btn-text");
  const loaderEl = loginBtn.querySelector(".btn-loader");

  if (textEl) {
    textEl.textContent = isLoading ? "מתחבר..." : "התחבר למערכת";
  }

  if (loaderEl) {
    loaderEl.classList.toggle("d-none", !isLoading);
  }
}

function markInvalid(input, shouldMark = true) {
  input.classList.toggle("is-invalid", shouldMark);
}

function validateForm() {
  clearMessage();

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  markInvalid(usernameInput, false);
  markInvalid(passwordInput, false);

  if (!username && !password) {
    markInvalid(usernameInput, true);
    markInvalid(passwordInput, true);
    showMessage("יש למלא שם משתמש וסיסמה.", "warning");
    return false;
  }

  if (!username) {
    markInvalid(usernameInput, true);
    showMessage("יש למלא שם משתמש.", "warning");
    usernameInput.focus();
    return false;
  }

  if (!password) {
    markInvalid(passwordInput, true);
    showMessage("יש למלא סיסמה.", "warning");
    passwordInput.focus();
    return false;
  }

  return true;
}

function getErrorMessage(errorCode) {
  switch (errorCode) {
    case "Missing credentials":
      return { message: "יש למלא שם משתמש וסיסמה.", type: "warning" };
    case "User not found":
      return { message: "המשתמש לא נמצא במערכת.", type: "error" };
    case "User inactive":
      return { message: "המשתמש אינו פעיל. יש לפנות למנהל המערכת.", type: "warning" };
    case "Wrong password":
      return { message: "סיסמה שגויה.", type: "error" };
    case "Failed to create session":
      return { message: "יצירת session נכשלה. נסה שוב.", type: "error" };
    default:
      return { message: "אירעה שגיאה בהתחברות. נסה שוב.", type: "error" };
  }
}

async function handleLogin(event) {
  event.preventDefault();

  if (!validateForm()) return;

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  try {
    setLoading(true);
    clearMessage();

    const response = await fetch(LOGIN_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });

    let result = null;

    try {
      result = await response.json();
    } catch {
      result = null;
    }

    if (!response.ok || !result?.ok) {
      const errorCode = result?.error || "Unknown error";
      const { message, type } = getErrorMessage(errorCode);

      if (errorCode === "User not found") {
        markInvalid(usernameInput, true);
        markInvalid(passwordInput, true);
      }

      if (errorCode === "Wrong password") {
        markInvalid(passwordInput, true);
        passwordInput.focus();
        passwordInput.select();
      }

      if (errorCode === "Missing credentials") {
        markInvalid(usernameInput, !username);
        markInvalid(passwordInput, !password);
      }

      showMessage(message, type);
      return;
    }

    if (!result.session_token || !result.user) {
      showMessage("תגובת השרת אינה תקינה.", "error");
      return;
    }

    saveSession({
      session_token: result.session_token,
      user: result.user
    });

    showMessage("ההתחברות הצליחה. מעביר אותך למערכת...", "success");

    setTimeout(() => {
      if (result.user.role === "admin") {
        window.location.href = ROUTES.admin;
      } else if (result.user.role === "contractor") {
        window.location.href = ROUTES.contractor;
      } else {
        window.location.href = ROUTES.home;
      }
    }, 650);

  } catch (error) {
    console.error("Login error:", error);
    showMessage("אירעה שגיאה בהתחברות לשרת. בדוק שהפונקציה login-user פורסמה ונסה שוב.", "error");
  } finally {
    setLoading(false);
  }
}

function togglePasswordVisibility() {
  const isPassword = passwordInput.type === "password";
  passwordInput.type = isPassword ? "text" : "password";

  eyeOpenIcon.style.display = isPassword ? "none" : "block";
  eyeClosedIcon.style.display = isPassword ? "block" : "none";
}

form?.addEventListener("submit", handleLogin);

togglePasswordBtn?.addEventListener("click", togglePasswordVisibility);

usernameInput?.addEventListener("input", () => {
  markInvalid(usernameInput, false);
  clearMessage();
});

passwordInput?.addEventListener("input", () => {
  markInvalid(passwordInput, false);
  clearMessage();
});