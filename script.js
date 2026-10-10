(() => {
  const root = document.documentElement;
  const sections = [...document.querySelectorAll('[data-page]')];
  const navigation = document.querySelector('.nav');
  const menuToggle = document.querySelector('.menu-toggle');
  const themePicker = document.querySelector('.theme-picker');
  const contactPickers = [...document.querySelectorAll('.contact-picker')];
  const themeButtons = [...document.querySelectorAll('[data-theme-choice]')];
  const systemDark = matchMedia('(prefers-color-scheme: dark)');
  const motionAllowed = matchMedia('(prefers-reduced-motion: no-preference)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  let themeChoice = 'system';

  try {
    const saved = localStorage.getItem('jonathan-theme');
    if (['light', 'dark', 'system'].includes(saved)) themeChoice = saved;
  } catch { /* System theme still works when browser storage is unavailable. */ }

  function applyTheme() {
    root.dataset.theme = themeChoice === 'system' ? (systemDark.matches ? 'dark' : 'light') : themeChoice;
    for (const button of themeButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.themeChoice === themeChoice));
    }
    themePicker.querySelector('summary').setAttribute('aria-label', `Color theme: ${themeChoice}`);
  }

  applyTheme();
  function closeContacts(returnFocus = false) {
    for (const picker of contactPickers) {
      if (!picker.open) continue;
      picker.open = false;
      if (returnFocus) picker.querySelector('summary').focus({ preventScroll: true });
    }
  }
  for (const picker of contactPickers) {
    picker.addEventListener('toggle', () => {
      if (!picker.open) return;
      themePicker.open = false;
      for (const other of contactPickers) if (other !== picker) other.open = false;
    });
    picker.addEventListener('click', event => {
      if (event.target.closest('.email-option')) {
        picker.open = false;
        picker.querySelector('summary').focus({ preventScroll: true });
      }
    });
  }
  themePicker.addEventListener('toggle', () => {
    if (themePicker.open) closeContacts();
  });
  systemDark.addEventListener('change', applyTheme);
  for (const button of themeButtons) {
    button.addEventListener('click', () => {
      themeChoice = button.dataset.themeChoice;
      try { localStorage.setItem('jonathan-theme', themeChoice); } catch { /* Keep the choice for this visit. */ }
      applyTheme();
      themePicker.open = false;
      themePicker.querySelector('summary').focus({ preventScroll: true });
    });
  }

  function closeMenu(returnFocus = false) {
    navigation.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation');
    if (returnFocus) menuToggle.focus({ preventScroll: true });
  }
  menuToggle.addEventListener('click', () => {
    const open = navigation.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });

  // Hash navigation works on GitHub Pages and keeps each section shareable.
  function showPage(moveFocus = false) {
    const requested = location.hash.slice(1) || 'home';
    const page = sections.find(section => section.id === requested) || sections[0];
    for (const section of sections) section.hidden = section !== page;
    for (const link of document.querySelectorAll('.nav a')) {
      if (link.hash === `#${page.id}`) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
    document.title = page.id === 'home' ? 'Jonathan Jongbin Kim' : `${page.dataset.page} · Jonathan Jongbin Kim`;
    closeMenu();
    themePicker.open = false;
    closeContacts();
    if (moveFocus) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      const heading = page.querySelector('h1, h2');
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }
  }
  window.addEventListener('hashchange', () => showPage(true));
  document.querySelector('.skip-link').addEventListener('click', event => {
    event.preventDefault();
    document.querySelector('main').focus();
  });
  navigation.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('click', event => {
    if (!themePicker.contains(event.target)) themePicker.open = false;
    for (const picker of contactPickers) if (!picker.contains(event.target)) picker.open = false;
    if (!event.target.closest('.nav-container')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    closeContacts(true);
    if (themePicker.open) {
      themePicker.open = false;
      themePicker.querySelector('summary').focus({ preventScroll: true });
    }
    if (navigation.classList.contains('is-open')) closeMenu(true);
  });
  showPage();
  root.classList.add('is-enhanced');
  for (const control of document.querySelectorAll('[data-js-control]')) control.hidden = false;

  // Limit the dot and trailing ring to a real mouse with motion enabled.
  const dot = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  const hero = document.querySelector('.hero');
  let targetX = 0, targetY = 0, ringX = 0, ringY = 0;
  let frame = 0;
  function animateCursor() {
    ringX += (targetX - ringX) * 0.24;
    ringY += (targetY - ringY) * 0.24;
    ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
    if (Math.abs(targetX - ringX) + Math.abs(targetY - ringY) > 0.2) frame = requestAnimationFrame(animateCursor);
    else frame = 0;
  }
  function hideCursor() {
    root.classList.remove('cursor-visible', 'cursor-hover');
    hero.classList.remove('has-pointer');
    cancelAnimationFrame(frame);
    frame = 0;
  }
  function updatePointerMode() {
    root.classList.remove('custom-cursor');
    hideCursor();
  }
  finePointer.addEventListener('change', updatePointerMode);
  motionAllowed.addEventListener('change', updatePointerMode);
  document.addEventListener('pointermove', event => {
    if (!finePointer.matches || !motionAllowed.matches || event.pointerType !== 'mouse') return;
    targetX = event.clientX;
    targetY = event.clientY;
    if (!root.classList.contains('cursor-visible')) { ringX = targetX; ringY = targetY; }
    dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%)`;
    root.classList.add('custom-cursor', 'cursor-visible');
    root.classList.toggle('cursor-hover', Boolean(event.target.closest('a, button, summary')));
    if (!frame) frame = requestAnimationFrame(animateCursor);
    const withinHero = !hero.closest('[hidden]') && hero.contains(event.target);
    hero.classList.toggle('has-pointer', withinHero);
    if (withinHero) {
      const rect = hero.getBoundingClientRect();
      hero.style.setProperty('--pointer-x', `${targetX - rect.left}px`);
      hero.style.setProperty('--pointer-y', `${targetY - rect.top}px`);
    }
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', updatePointerMode);
  window.addEventListener('blur', updatePointerMode);
  document.addEventListener('keydown', updatePointerMode);
})();
