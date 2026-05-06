/**
 * nav-auth.js
 * Vaihtaa navigaation "Kirjaudu" linkin "Tilaukseni" linkiksi,
 * ja lisää kirjautuneelle käyttäjälle "Kirjaudu ulos" -napin.
 */

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");

  document.querySelectorAll(".auth-nav-link").forEach((link) => {
    if (token) {
      link.textContent = "Tilaukseni";
      link.href = "tilaukseni.html";

      const parentLi = link.closest("li");

      // Estetään tupla logout-nappi, jos script latautuu uudestaan
      const navList = parentLi?.parentElement;
      if (navList && !navList.querySelector(".logout-nav-link")) {
        const logoutLi = document.createElement("li");
        logoutLi.innerHTML = `<a href="#" class="logout-nav-link">Kirjaudu ulos</a>`;
        parentLi.after(logoutLi);
      }
    } else {
      link.textContent = "Kirjaudu";
      link.href = "kirjaudu.html";
    }
  });

  document.querySelectorAll(".logout-nav-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();

      localStorage.removeItem("token");
      localStorage.removeItem("kayttaja");

      window.location.href = "index.html";
    });
  });
});
