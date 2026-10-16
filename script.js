(() => {
  const root = document.documentElement;
  const languageButton = document.getElementById("langBtn");
  const themeButton = document.getElementById("themeBtn");
  const themeBall = document.getElementById("themeBall");
  let language = "es";

  function setLanguage(nextLanguage) {
    language = nextLanguage;
    root.lang = language;
    document.querySelectorAll("[data-es]").forEach((element) => {
      element.textContent = element.dataset[language];
    });
    languageButton.textContent = language === "es" ? "EN" : "ES";
    updateThemeButton();
  }

  function updateThemeButton() {
    const isNight = root.dataset.theme === "night";
    const labels =
      language === "en"
        ? ["Activate day theme", "Activate night theme"]
        : ["Activar tema día", "Activar tema noche"];

    themeButton.setAttribute("aria-checked", String(isNight));
    themeButton.setAttribute("aria-label", labels[isNight ? 0 : 1]);
    themeBall.src = isNight ? "img/ultraball.webp" : "img/honorball.png";
  }

  languageButton.addEventListener("click", () => {
    setLanguage(language === "es" ? "en" : "es");
  });

  themeButton.addEventListener("click", () => {
    const nextTheme = root.dataset.theme === "night" ? "day" : "night";
    root.dataset.theme = nextTheme;
    try {
      localStorage.setItem("tema", nextTheme);
    } catch {
      // El tema sigue funcionando sin almacenamiento local.
    }
    updateThemeButton();
  });
  updateThemeButton();

  const card = document.getElementById("card");
  const motionPreference = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );
  const reduceMotion = motionPreference.matches;

  function tiltCard(event) {
    if (reduceMotion) return;

    const bounds = card.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    card.style.setProperty("--mx", `${x * 100}%`);
    card.style.setProperty("--my", `${y * 100}%`);
    card.style.transform = `rotateY(${(x - 0.5) * 18}deg) rotateX(${(0.5 - y) * 18}deg)`;
  }

  function resetCard() {
    card.style.transform = "";
    card.style.setProperty("--mx", "50%");
    card.style.setProperty("--my", "50%");
  }

  card.addEventListener("pointermove", tiltCard);
  card.addEventListener("pointerleave", resetCard);
  card.addEventListener("pointerup", resetCard);

  const background = document.getElementById("bg");
  // [imagen, posición horizontal (%), posición vertical (px), ancho (px), profundidad]
  const spriteSpecs = [
    ["gengar3", 4, 80, 80, 0.3],
    ["pose-haunter", 14, 420, 100, 0.55],
    ["gengar2", 30, 640, 70, 0.22],
    ["pose-gastly", 46, 180, 82, 0.4],
    ["gengar4", 62, 560, 104, 0.65],
    ["gastly4", 74, 60, 70, 0.28],
    ["gengar1", 84, 330, 90, 0.5],
    ["pose-gengar", 88, 700, 95, 0.35],
    ["gastly3", 22, 260, 56, 0.18],
    ["pose-haunter", 54, 760, 84, 0.45],
    ["gastly2", 7, 590, 62, 0.24],
    ["pose-gengar", 78, 220, 78, 0.32],
  ];

  const sprites = spriteSpecs.map(([name, x, y, width, depth], index) => {
    const isSheet = name.startsWith("pose-");
    const element = document.createElement(isSheet ? "span" : "img");

    if (isSheet) {
      element.className = "sprite-sheet";
      const viewport = document.createElement("span");
      viewport.className = `pose-window ${name}`;
      const image = document.createElement("img");
      image.src = "img/pokemon-poses.jpg";
      image.alt = "";
      viewport.appendChild(image);
      element.appendChild(viewport);
    } else {
      element.src = `img/${name}.png`;
      element.alt = "";
    }

    element.setAttribute("aria-hidden", "true");
    element.style.left = `${x}%`;
    element.style.setProperty("--s", `${width}px`);
    background.appendChild(element);
    return { element, y, depth, index };
  });

  function drawBackground() {
    const scrollY = reduceMotion ? 0 : window.scrollY;
    const trackHeight = window.innerHeight + 200;

    sprites.forEach(({ element, y, depth, index }) => {
      // El módulo positivo devuelve cada sprite al inicio del recorrido.
      const offsetY =
        ((((y - scrollY * depth) % trackHeight) + trackHeight) % trackHeight) -
        100;
      const direction = index % 2 ? 1 : -1;
      element.style.transform = `translate3d(0, ${offsetY}px, 0) rotateX(${scrollY * 0.04 * depth * direction}deg) rotateY(${scrollY * 0.07 * depth}deg) rotateZ(${((index * 37) % 30) - 15}deg)`;
    });
  }

  let backgroundFramePending = false;
  window.addEventListener(
    "scroll",
    () => {
      if (backgroundFramePending) return;
      backgroundFramePending = true;
      requestAnimationFrame(() => {
        drawBackground();
        backgroundFramePending = false;
      });
    },
    { passive: true },
  );
  window.addEventListener("resize", drawBackground);
  drawBackground();

  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const gifCursor = document.createElement("span");
  gifCursor.className = "gif-cursor";
  gifCursor.hidden = true;
  gifCursor.setAttribute("aria-hidden", "true");

  const cursorImage = document.createElement("img");
  cursorImage.alt = "";
  cursorImage.width = 48;
  cursorImage.height = 40;
  gifCursor.appendChild(cursorImage);
  document.body.appendChild(gifCursor);

  let cursorRequested = false;
  let cursorFrame = 0;
  let cursorX = 0;
  let cursorY = 0;

  function hideGifCursor() {
    gifCursor.hidden = true;
    gifCursor.classList.remove("is-grabbing");
    root.classList.remove("gif-cursor-active");
  }

  cursorImage.addEventListener("error", hideGifCursor);
  document.addEventListener(
    "pointermove",
    (event) => {
      if (
        event.pointerType !== "mouse" ||
        !finePointer.matches ||
        motionPreference.matches
      ) {
        hideGifCursor();
        return;
      }

      if (!cursorRequested) {
        cursorRequested = true;
        cursorImage.src = "img/haunter-cursor.gif";
      }
      if (!cursorImage.complete || !cursorImage.naturalWidth) return;

      cursorX = event.clientX - 7;
      cursorY = event.clientY - 27;
      if (cursorFrame) return;

      cursorFrame = requestAnimationFrame(() => {
        cursorFrame = 0;
        if (
          !finePointer.matches ||
          motionPreference.matches ||
          !document.hasFocus()
        )
          return;
        gifCursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
        gifCursor.hidden = false;
        root.classList.add("gif-cursor-active");
      });
    },
    { passive: true },
  );

  document.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse") gifCursor.classList.add("is-grabbing");
  });
  document.addEventListener("pointerup", () => {
    gifCursor.classList.remove("is-grabbing");
  });
  document.addEventListener("pointerout", (event) => {
    if (!event.relatedTarget) hideGifCursor();
  });
  window.addEventListener("blur", hideGifCursor);
  window.addEventListener("pagehide", hideGifCursor);
  motionPreference.addEventListener("change", hideGifCursor);
  finePointer.addEventListener("change", hideGifCursor);
})();
