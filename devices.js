(() => {
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const gallery = document.querySelector("[data-device-gallery]");
  const heroButton = document.querySelector("[data-hero-motion]");
  const hero = heroButton.closest(".video-shell");
  const heroVideo = hero.querySelector("video");
  const slides = [...gallery.querySelectorAll(".device-slide")];
  const families = [...gallery.querySelectorAll("[data-family]")];
  const modes = [...gallery.querySelectorAll("[data-mode-index]")];
  const rotationButton = gallery.querySelector("[data-rotation]");
  const clipButton = gallery.querySelector("[data-clip]");
  const note = gallery.querySelector("[data-device-note]");
  const status = gallery.querySelector("[data-device-status]");
  const strings = window.deviceStrings || {};
  let index = 0;
  let rotation = !motion.matches;
  let heroMotion = !motion.matches;
  let clipMotion = !motion.matches;
  let galleryVisible = false;
  let heroVisible = false;
  let timer;
  let swipe;

  function setVideo(video, active) {
    if (!video) return;
    if (active) {
      if (!video.hasAttribute("src")) video.src = video.dataset.src;
      video.play().catch(() => {});
    } else {
      video.pause();
      video.classList.remove("is-playing");
    }
  }

  document.querySelectorAll("video[data-src]").forEach((video) => {
    video.addEventListener("playing", () => video.classList.add("is-playing"));
    video.addEventListener("error", () => video.classList.remove("is-playing"));
  });

  function sync() {
    const visible = !document.hidden;
    heroButton.setAttribute("aria-pressed", String(heroMotion));
    rotationButton.setAttribute("aria-pressed", String(rotation));
    clipButton.setAttribute("aria-pressed", String(clipMotion));
    clipButton.hidden = !slides[index].querySelector("video");
    setVideo(heroVideo, heroMotion && heroVisible && visible);
    slides.forEach((slide, i) => {
      setVideo(slide.querySelector("video"), i === index && clipMotion && galleryVisible && visible);
    });

    clearTimeout(timer);
    if (rotation && galleryVisible && visible) {
      timer = setTimeout(() => select(index + 1), 8000);
    }
  }

  function select(next, manual = false) {
    index = (next + slides.length) % slides.length;
    const family = slides[index].dataset.device;
    if (manual) rotation = false;

    slides.forEach((slide, i) => { slide.hidden = i !== index; });
    families.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.family === family));
    });
    modes.forEach((button, i) => {
      button.hidden = slides[i].dataset.device !== family;
      button.setAttribute("aria-pressed", String(i === index));
    });
    note.textContent = strings["devices.caption." + family + "." + slides[index].dataset.mode] || "";
    if (manual) {
      const name = families.find((button) => button.dataset.family === family).textContent;
      status.textContent = name + " · " + modes[index].textContent;
    }
    sync();
  }

  families.forEach((button) => button.addEventListener("click", () => {
    select(slides.findIndex((slide) => slide.dataset.device === button.dataset.family), true);
  }));
  modes.forEach((button) => button.addEventListener("click", () => {
    select(Number(button.dataset.modeIndex), true);
  }));
  gallery.querySelector("[data-previous]").addEventListener("click", () => select(index - 1, true));
  gallery.querySelector("[data-next]").addEventListener("click", () => select(index + 1, true));
  rotationButton.addEventListener("click", () => { rotation = !rotation; sync(); });
  clipButton.addEventListener("click", () => { rotation = false; clipMotion = !clipMotion; sync(); });
  heroButton.addEventListener("click", () => { heroMotion = !heroMotion; sync(); });

  const stage = gallery.querySelector(".device-stage");
  stage.addEventListener("touchstart", (event) => {
    swipe = event.touches.length === 1 ? event.touches[0] : null;
  }, { passive: true });
  stage.addEventListener("touchend", (event) => {
    if (!swipe || event.touches.length) return;
    const end = event.changedTouches[0];
    const dx = end.clientX - swipe.clientX;
    const dy = end.clientY - swipe.clientY;
    swipe = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) select(index + (dx < 0 ? 1 : -1), true);
  }, { passive: true });
  stage.addEventListener("touchcancel", () => { swipe = null; });

  gallery.addEventListener("focusin", (event) => {
    if (event.target !== rotationButton && rotation) { rotation = false; sync(); }
  });
  document.addEventListener("visibilitychange", sync);
  motion.addEventListener("change", () => {
    if (motion.matches) { rotation = false; heroMotion = false; clipMotion = false; sync(); }
  });
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.target === hero) heroVisible = entry.isIntersecting;
      else galleryVisible = entry.isIntersecting;
    }
    sync();
  }, { threshold: .25 });
  observer.observe(hero);
  observer.observe(stage);
  gallery.querySelectorAll("[data-device-controls]").forEach((controls) => { controls.hidden = false; });
  heroButton.hidden = false;
  select(0);
})();
