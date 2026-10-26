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
    document.querySelectorAll('[data-es-alt]').forEach((element) => {
      element.alt = element.dataset[language + 'Alt'];
    });
    document.querySelectorAll('.details-toggle').forEach(updateDetailsButton);
    languageButton.setAttribute('aria-label', language === 'es' ? 'Switch to English' : 'Cambiar a español');
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

  // La barra se marca un poco más cuando ya hay contenido detrás.
  const bar = document.getElementById('barra');
  const markBar = () => bar.classList.toggle('flotando', window.scrollY > 24);
  window.addEventListener('scroll', markBar, { passive: true });
  markBar();
})();
