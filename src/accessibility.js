export function setupAccessibility({ el, notice }) {
  const controls = document.createElement("div");
  controls.className = "accessibility-controls";
  const motion = document.createElement("button");
  motion.type = "button";
  motion.id = "motion-toggle";
  motion.textContent = "Animationen pausieren";
  controls.append(motion);
  document.querySelector(".sidebar-bottom").append(controls);
  const media = matchMedia("(prefers-reduced-motion: reduce)");
  let paused = false;
  try {
    paused = localStorage.getItem("cryo-motion-v1") === "paused";
  } catch {}
  function updateMotion() {
    const reduce = paused || media.matches;
    document.documentElement.classList.toggle("motion-paused", reduce);
    motion.setAttribute("aria-pressed", String(reduce));
    motion.disabled = media.matches;
    motion.textContent = media.matches
      ? "Bewegung reduziert (System)"
      : paused
        ? "Animationen fortsetzen"
        : "Animationen pausieren";
  }
  motion.addEventListener("click", () => {
    paused = !paused;
    try {
      localStorage.setItem("cryo-motion-v1", paused ? "paused" : "running");
    } catch {
      notice("Bewegungseinstellung gilt nur für diese Sitzung.");
    }
    updateMotion();
  });
  media.addEventListener("change", updateMotion);
  updateMotion();
  // A fixed notification must not cover keyboard focus; reserve its height and reveal focus.
  const banner = el("notice");
  function revealFocus() {
    const focus = document.activeElement;
    if (
      !focus ||
      focus === document.body ||
      banner.hidden ||
      !banner.textContent ||
      banner.contains(focus) ||
      !focus.getClientRects().length
    )
      return;
    const a = focus.getBoundingClientRect(),
      b = banner.getBoundingClientRect();
    if (
      a.bottom > b.top &&
      a.top < b.bottom &&
      a.right > b.left &&
      a.left < b.right
    )
      focus.scrollIntoView({ block: "center", inline: "nearest" });
  }
  new ResizeObserver(() => {
    document
      .querySelector("main")
      .style.setProperty(
        "--notice-space",
        banner.hidden || !banner.textContent
          ? "0px"
          : banner.getBoundingClientRect().height + 36 + "px",
      );
    requestAnimationFrame(revealFocus);
  }).observe(banner);
  document.addEventListener("focusin", () =>
    requestAnimationFrame(revealFocus),
  );
}
