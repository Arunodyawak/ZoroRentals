const searchForm = document.querySelector(".search-panel");

if (searchForm) {
  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
  });
}

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealItems = [...document.querySelectorAll(".reveal-item")];
const parallaxItems = [...document.querySelectorAll("[data-parallax]")];

if (!prefersReducedMotion) {
  document.documentElement.classList.add("motion-ready");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.18,
      rootMargin: "0px 0px -8% 0px",
    },
  );

  revealItems.forEach((item) => observer.observe(item));

  let ticking = false;

  const updateParallax = () => {
    const viewportCenter = window.innerHeight / 2;

    parallaxItems.forEach((item) => {
      const strength = Number(item.dataset.parallax || 0);
      const rect = item.getBoundingClientRect();
      const itemCenter = rect.top + rect.height / 2;
      const offset = (viewportCenter - itemCenter) * strength;

      item.style.setProperty("--parallax-y", `${offset.toFixed(2)}px`);
    });

    ticking = false;
  };

  const requestParallax = () => {
    if (!ticking) {
      window.requestAnimationFrame(updateParallax);
      ticking = true;
    }
  };

  window.addEventListener("scroll", requestParallax, { passive: true });
  window.addEventListener("resize", requestParallax);
  requestParallax();
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}
