document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const href = link.getAttribute("href");
    if (!href || href === "#") return;

    const target = document.querySelector(href);
    if (!target) return;

    event.preventDefault();

    const nav = document.getElementById("mainNav");
    if (nav) {
      nav.classList.remove("is-open");
    }

    target.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });
});

/* Sticky header effect */
window.addEventListener("scroll", () => {
  const topbar = document.querySelector(".meteor-topbar");
  if (!topbar) return;

  if (window.scrollY > 20) {
    topbar.classList.add("scrolled");
  } else {
    topbar.classList.remove("scrolled");
  }
});

/* Reveal on scroll */
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
      }
    });
  },
  {
    threshold: 0.12
  }
);

document.querySelectorAll(".fade-up").forEach((el) => {
  observer.observe(el);
});

/* Mobile nav */
const mobileNavToggle = document.getElementById("mobileNavToggle");
const mainNav = document.getElementById("mainNav");

if (mobileNavToggle && mainNav) {
  mobileNavToggle.addEventListener("click", () => {
    mainNav.classList.toggle("is-open");
  });
}