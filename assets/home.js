(() => {
  const root = document.getElementById('jdb-current-rebalanced');
  if (!root) return;
  document.documentElement.classList.add('jdb-enhanced');
  const button = root.querySelector('.jdb-hamburger');
  const menu = root.querySelector('.jdb-grouped-nav');
  const screens = [...root.querySelectorAll('.jdb-screen')];
  const groups = [...menu.querySelectorAll('details')];
  // Keep the meaning of already-published section links. Personal About has its own URL.
  const aliases = {
    '#builds': 'jdb-current-rebalanced-builds',
    '#about': 'jdb-current-rebalanced-how-i-work',
    '#stack': 'jdb-current-rebalanced-stack',
    '#experience': 'jdb-current-rebalanced-experience',
    '#fun': 'jdb-current-rebalanced-fun',
    '#connect': 'jdb-current-rebalanced-connect',
    '#personal-about': 'jdb-current-rebalanced-about',
    '#professional-builds': 'jdb-current-rebalanced-professional-builds',
    '#work': 'jdb-current-rebalanced-work'
  };
  function targetFor(hash) {
    if (!hash || hash === '#') return screens.find(screen => screen.dataset.screen === 'home');
    let id;
    try { id = aliases[hash] || decodeURIComponent(hash.slice(1)); } catch { return null; }
    const target = document.getElementById(id);
    return target && root.contains(target) ? target : null;
  }
  function closeGroups(except) {
    groups.forEach(group => { if (group !== except) group.open = false; });
  }
  function closeMenu() {
    closeGroups(); menu.classList.remove('jdb-open');
    button.setAttribute('aria-expanded', 'false'); button.setAttribute('aria-label', 'Open menu');
  }
  function navigate(hash, focus = false) {
    const target = targetFor(hash);
    if (!target) return false;
    const name = target.closest('.jdb-screen')?.dataset.screen || 'home';
    screens.forEach(screen => { screen.hidden = screen.dataset.screen !== name; });
    root.querySelector('.jdb-footer-personal').hidden = name === 'work';
    root.querySelector('.jdb-footer-professional').hidden = name !== 'work';
    menu.querySelectorAll('[aria-current]').forEach(link => link.removeAttribute('aria-current'));
    const current = [...menu.querySelectorAll('a[href^="#"]')].find(link => targetFor(link.hash) === target);
    current?.setAttribute('aria-current', 'location');
    const group = current?.closest('details');
    groups.forEach(item => item.classList.toggle('jdb-current-group', item === group));
    if (focus) {
      const destination = target.querySelector('h1,h2,h3') || target;
      if (!destination.hasAttribute('tabindex')) destination.setAttribute('tabindex', '-1');
      destination.focus({ preventScroll: true });
    }
    (target.classList.contains('jdb-screen') ? root : target).scrollIntoView({ behavior: 'auto', block: 'start' });
    return true;
  }
  groups.forEach(group => group.addEventListener('toggle', () => { if (group.open) closeGroups(group); }));
  button.addEventListener('click', () => {
    const open = menu.classList.toggle('jdb-open');
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (!open) closeGroups();
  });
  root.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (link && root.contains(link)) {
      // External links, downloads, mail, new tabs and modifier clicks remain native browser actions.
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
      const href = link.getAttribute('href');
      if (href?.startsWith('#') && targetFor(href)) {
        event.preventDefault(); closeMenu();
        if (window.location.hash !== href) window.history.pushState(null, '', href);
        navigate(href, true);
        return;
      }
      closeMenu();
    } else if (!menu.contains(event.target) && !button.contains(event.target)) closeMenu();
  });
  root.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const open = groups.find(group => group.open);
    const mobileOpen = menu.classList.contains('jdb-open');
    closeMenu();
    if (mobileOpen) button.focus(); else open?.querySelector('summary').focus();
  });
  menu.addEventListener('focusout', () => setTimeout(() => {
    if (!menu.contains(document.activeElement) && document.activeElement !== button) closeMenu();
  }, 0));
  function incoming() { closeMenu(); navigate(window.location.hash || '', false); }
  window.addEventListener('hashchange', incoming);
  window.addEventListener('popstate', incoming);
  window.matchMedia('(max-width:800px)').addEventListener('change', closeMenu);
  navigate('', false);
  incoming();
})();
