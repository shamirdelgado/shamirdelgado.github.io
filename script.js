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
    menuButton.textContent = language === 'es' ? 'Menú' : 'Menu';
    updateThemeButton();
  }

  function updateThemeButton() {
    const isNight = root.dataset.theme === 'night';
    const labels = language === 'en' ? ['Activate day theme', 'Activate night theme'] :
                                       ['Activar tema día', 'Activar tema noche'];

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
})();
