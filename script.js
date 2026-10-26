(() => {
  const root = document.documentElement;
  const languageButton = document.getElementById('langBtn');
  const themeButton = document.getElementById('themeBtn');
  const themeBall = document.getElementById('themeBall');
  let language = 'es';

  function setLanguage(nextLanguage) {
    language = nextLanguage;
    root.lang = language;
    document.querySelectorAll('[data-es]').forEach((element) => {
      element.textContent = element.dataset[language];
    });
    languageButton.textContent = language === 'es' ? 'EN' : 'ES';
    document.querySelectorAll('[data-es-label]').forEach((element) => {
      element.setAttribute('aria-label', element.dataset[language + 'Label']);
    });
    document.querySelectorAll('[data-href-es]').forEach((element) => {
      element.href = element.dataset[language === 'es' ? 'hrefEs' : 'hrefEn'];
    });
    document.querySelectorAll('[data-es-alt]').forEach((element) => {
      element.alt = element.dataset[language + 'Alt'];
    });
    document.querySelectorAll('.details-toggle').forEach(updateDetailsButton);
    languageButton.setAttribute('aria-label', language === 'es' ? 'Switch to English' : 'Cambiar a español');
    document.querySelectorAll('[data-count-to]').forEach(formatCount);
    updateThemeButton();
  }

  function updateDetailsButton(button) {
    const open = button.getAttribute('aria-expanded') === 'true';
    button.dataset.es = open ? 'Ocultar detalles' : 'Ver detalles';
    button.dataset.en = open ? 'Hide details' : 'View details';
    button.textContent = button.dataset[language];
  }

  document.querySelectorAll('.details-toggle').forEach((button) => {
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      const panel = document.getElementById(button.getAttribute('aria-controls'));
      button.setAttribute('aria-expanded', String(open));
      panel.inert = !open;
      panel.classList.toggle('is-open', open);
      updateDetailsButton(button);
    });
  });

  function updateThemeButton() {
    const isNight = root.dataset.theme === 'night';
    const labels = language === 'en' ? ['Activate day theme', 'Activate night theme'] :
                                       ['Activar tema día', 'Activar tema noche'];

    document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
      meta.content = isNight ? '#0e0a17' : '#f3f0f9';
    });
    themeButton.setAttribute('aria-checked', String(isNight));
    themeButton.setAttribute('aria-label', labels[isNight ? 0 : 1]);
    themeBall.src = isNight ? 'img/ultraball.webp' : 'img/honorball.png';
  }

  languageButton.addEventListener('click', () => {
    setLanguage(language === 'es' ? 'en' : 'es');
  });

  themeButton.addEventListener('click', () => {
    const nextTheme = root.dataset.theme === 'night' ? 'day' : 'night';
    root.dataset.theme = nextTheme;
    try {
      localStorage.setItem('tema', nextTheme);
    } catch {
      // El tema sigue funcionando sin almacenamiento local.
    }
    updateThemeButton();
  });
  updateThemeButton();

  const menu = document.getElementById('menu');
  const menuButton = document.getElementById('menuBtn');
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('open', open);
  });
  menu.addEventListener('click', (event) => {
    if (!event.target.closest('a')) return;
    menu.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
  });

  const projectsButton = document.getElementById('proyectosBtn');
  const projectsMenu = document.getElementById('proyectosMenu');

  function toggleProjects(open) {
    projectsMenu.hidden = !open;
    projectsButton.setAttribute('aria-expanded', String(open));
  }

  projectsButton.addEventListener('click', () => toggleProjects(projectsMenu.hidden));
  projectsMenu.addEventListener('click', (event) => {
    if (event.target.closest('a')) toggleProjects(false);
  });
  document.addEventListener('click', (event) => {
    if (!projectsMenu.hidden && !event.target.closest('.rapidos')) toggleProjects(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || projectsMenu.hidden) return;
    toggleProjects(false);
    projectsButton.focus();
  });

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const journey = document.querySelector('.journey');
  const journeyItems = [...journey.querySelectorAll('.journey-item')];
  const journeyNodes = journeyItems.map((item) => item.querySelector('.journey-node'));
  let journeyFrame = 0;

  function updateJourney() {
    journeyFrame = 0;
    if (reducedMotion.matches) {
      journey.classList.remove('is-animated');
      journey.style.removeProperty('--journey-progress');
      journey.style.removeProperty('--journey-distance');
      return;
    }

    // Todas las medidas se leen antes de cambiar estilos.
    const bounds = journey.getBoundingClientRect();
    const nodePositions = journeyNodes.map((node) => {
      const rect = node.getBoundingClientRect();
      return rect.top + rect.height / 2 - bounds.top;
    });
    const distance = Math.max(0, Math.min(bounds.height, window.innerHeight * 0.78 - bounds.top));
    const progress = bounds.height ? distance / bounds.height : 0;

    journey.style.setProperty('--journey-progress', progress);
    journey.style.setProperty('--journey-distance', distance + 'px');
    journey.classList.add('is-animated');
    journeyItems.forEach((item, index) => {
      if (distance >= nodePositions[index]) item.classList.add('is-reached');
    });
  }

  function scheduleJourney() {
    if (!journeyFrame) journeyFrame = requestAnimationFrame(updateJourney);
  }

  window.addEventListener('scroll', scheduleJourney, { passive: true });
  window.addEventListener('resize', scheduleJourney);
  reducedMotion.addEventListener('change', scheduleJourney);
  if ('ResizeObserver' in window) {
    const journeyResize = new ResizeObserver(scheduleJourney);
    journeyResize.observe(document.querySelector('main'));
  }
  document.fonts?.ready.then(scheduleJourney);
  scheduleJourney();

  const countValues = new WeakMap();
  const countFrames = new Map();

  function formatCount(element) {
    const decimals = Number(element.dataset.countTo) % 1 ? 1 : 0;
    element.textContent = new Intl.NumberFormat(language, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(countValues.get(element) ?? Number(element.dataset.countTo));
    const before = element.parentElement.firstElementChild;
    before.textContent = new Intl.NumberFormat(language, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(Number(element.dataset.countFrom)) + (element.dataset.countUnit ? ' ' + element.dataset.countUnit : '');
  }

  function animateCount(element) {
    const from = Number(element.dataset.countFrom);
    const to = Number(element.dataset.countTo);
    if (reducedMotion.matches) return;
    let start;
    function tick(now) {
      start ??= now;
      const progress = Math.min((now - start) / 1000, 1);
      countValues.set(element, from + (to - from) * (1 - (1 - progress) ** 3));
      formatCount(element);
      if (progress < 1) countFrames.set(element, requestAnimationFrame(tick));
      else countFrames.delete(element);
    }
    countFrames.set(element, requestAnimationFrame(tick));
  }

  if ('IntersectionObserver' in window) {
    const metricObserver = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting || !target.closest('.project-details').classList.contains('is-open')) return;
        animateCount(target.querySelector('[data-count-to]'));
        metricObserver.unobserve(target);
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('.case-metric').forEach((metric) => metricObserver.observe(metric));

    const steps = document.querySelector('.work-steps');
    steps.classList.add('will-reveal');
    const stepObserver = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      steps.classList.add('is-visible');
      stepObserver.disconnect();
    }, { threshold: 0.15 });
    stepObserver.observe(steps);
  }

  reducedMotion.addEventListener('change', () => {
    if (!reducedMotion.matches) return;
    countFrames.forEach((frame, element) => {
      cancelAnimationFrame(frame);
      countValues.delete(element);
      formatCount(element);
    });
    countFrames.clear();
  });

  // La barra se marca un poco más cuando ya hay contenido detrás.
  const bar = document.getElementById('barra');
  const markBar = () => bar.classList.toggle('flotando', window.scrollY > 24);
  window.addEventListener('scroll', markBar, { passive: true });
  markBar();
})();
