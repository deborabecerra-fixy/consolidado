document.addEventListener("DOMContentLoaded", () => {
  const numbers = [...document.querySelectorAll(".metric-number[data-count]")];
  if (!numbers.length) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const format = (element, value) => {
    const decimals = Number(element.dataset.decimals || 0);
    const prefix = element.dataset.prefix || "";
    const suffix = element.dataset.suffix || "";
    const number = decimals ? value.toFixed(decimals).replace(".", ",") : Math.round(value);
    element.textContent = `${prefix}${number}${suffix}`;
  };

  const animate = (element) => {
    if (element.dataset.animated === "true") return;
    element.dataset.animated = "true";
    const target = Number(element.dataset.count);
    const duration = 900;
    const start = performance.now();

    const frame = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      format(element, target * eased);

      if (progress < 1) {
        requestAnimationFrame(frame);
        return;
      }

      const star = element.parentElement.querySelector(".metric-star");
      if (star) star.classList.add("is-shining");
    };

    requestAnimationFrame(frame);
  };

  if (reducedMotion || !("IntersectionObserver" in window)) {
    numbers.forEach((element) => format(element, Number(element.dataset.count)));
    return;
  }

  numbers.forEach((element) => format(element, 0));
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animate(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.35 });

  numbers.forEach((element) => observer.observe(element));
});
