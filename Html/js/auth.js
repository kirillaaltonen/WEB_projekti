/**
 * auth.js
 * Handles login and registration forms on Kirjaudu.html.
 * Communicates with Express backend: POST /api/auth/login and /api/auth/register
 */

const API = "http://10.120.32.63:3000/api/auth";
// ─── Tab switching ────────────────────────────────────────────────────────────

const tabLogin = document.getElementById("tab-login");
const tabRegister = document.getElementById("tab-register");
const formLogin = document.getElementById("form-login");
const formRegister = document.getElementById("form-register");

tabLogin.addEventListener("click", () => {
  tabLogin.classList.add("active");
  tabRegister.classList.remove("active");
  formLogin.style.display = "block";
  formRegister.style.display = "none";
  clearMessages();
});

tabRegister.addEventListener("click", () => {
  tabRegister.classList.add("active");
  tabLogin.classList.remove("active");
  formRegister.style.display = "block";
  formLogin.style.display = "none";
  clearMessages();
});

// "Luo uusi tili" button inside login form — same as clicking the tab
document.getElementById("goto-register")?.addEventListener("click", () => {
  tabRegister.click();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Show a message inside the given form.
 * @param {string} formId   - 'form-login' or 'form-register'
 * @param {string} msg      - message text
 * @param {'error'|'success'} type
 */
function showMessage(formId, msg, type) {
  const form = document.getElementById(formId);
  let el = form.querySelector(".auth-message");

  if (!el) {
    el = document.createElement("div");
    el.className = "auth-message";
    form.prepend(el);
  }

  el.textContent = msg;
  el.dataset.type = type;
}

/** Remove all message banners */
function clearMessages() {
  document.querySelectorAll(".auth-message").forEach((el) => el.remove());
}

/**
 * Set a button to loading state or restore it.
 * @param {HTMLButtonElement} btn
 * @param {boolean} loading
 * @param {string} originalText
 */
function setLoading(btn, loading, originalText) {
  btn.disabled = loading;
  btn.textContent = loading ? "Odota…" : originalText;
}

// ─── Login ────────────────────────────────────────────────────────────────────

const loginBtn = document.getElementById("login-btn");

loginBtn.addEventListener("click", async () => {
  const sahkoposti = document.getElementById("login-email").value.trim();
  const salasana = document.getElementById("login-password").value;

  if (!sahkoposti || !salasana) {
    showMessage("form-login", "Täytä sähköposti ja salasana.", "error");
    return;
  }

  setLoading(loginBtn, true, "Kirjaudu sisään");

  try {
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sahkoposti, salasana }),
    });

    const data = await res.json();

    if (!res.ok) {
      showMessage(
        "form-login",
        data.error || "Kirjautuminen epäonnistui.",
        "error",
      );
      return;
    }

    // Save token and user info
    localStorage.setItem("token", data.token);
    localStorage.setItem("kayttaja", JSON.stringify(data.kayttaja));

    // Redirect based on role
    if (data.kayttaja.rooli === "admin") {
      window.location.href = "hallinta.html";
    } else {
      window.location.href = "index.html";
    }
  } catch (_err) {
    showMessage("form-login", "Palvelimeen ei saatu yhteyttä.", "error");
  } finally {
    setLoading(loginBtn, false, "Kirjaudu sisään");
  }
});

// ─── Register ─────────────────────────────────────────────────────────────────

const registerBtn = document.getElementById("register-btn");

registerBtn.addEventListener("click", async () => {
  const etunimi = document.getElementById("register-etunimi").value.trim();
  const sukunimi = document.getElementById("register-sukunimi").value.trim();
  const sahkoposti = document.getElementById("register-email").value.trim();
  const opiskelijanumero = document
    .getElementById("register-opiskelijanumero")
    .value.trim();
  const salasana = document.getElementById("register-password").value;

  if (!etunimi || !sukunimi || !sahkoposti || !salasana) {
    showMessage("form-register", "Täytä kaikki pakolliset kentät.", "error");
    return;
  }

  if (salasana.length < 8) {
    showMessage(
      "form-register",
      "Salasanan on oltava vähintään 8 merkkiä.",
      "error",
    );
    return;
  }

  setLoading(registerBtn, true, "Luo tili");

  try {
    const res = await fetch(`${API}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nimi: `${etunimi} ${sukunimi}`,
        sahkoposti,
        salasana,
        opiskelijanumero: opiskelijanumero || null,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      showMessage(
        "form-register",
        data.error || "Rekisteröinti epäonnistui.",
        "error",
      );
      return;
    }

    // Success — switch to login tab with a success message
    tabLogin.click();
    showMessage("form-login", "Tili luotu! Kirjaudu nyt sisään.", "success");
  } catch (_err) {
    showMessage("form-register", "Palvelimeen ei saatu yhteyttä.", "error");
  } finally {
    setLoading(registerBtn, false, "Luo tili");
  }
});
