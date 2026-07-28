(() => {
  'use strict';

  const ready = (fn) => {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  };

  ready(() => {
    const body = document.body;
    const normalizePath = () => {
      const clean = location.pathname.replace(/\/index\.html$/, '/');
      const withoutProject = clean.replace(/^\/consolidado(?=\/|$)/, '');
      return withoutProject || '/';
    };
    const path = normalizePath();
    const routeClass =
      path === '/' ? 'route-home' :
      path.startsWith('/servicios/') ? 'route-service' :
      path === '/tecnologia/' || path === '/tecnologia' ? 'route-technology' :
      path === '/developers/' || path === '/developers' ? 'route-developers' :
      path === '/recursos/' || path === '/recursos' ? 'route-resources' :
      path.startsWith('/recursos/') ? 'route-article' :
      path.startsWith('/operar-en-argentina') ? 'route-journey' : 'route-page';
    body.classList.add(routeClass, 'app-shell-ready');

    const syncActiveNavigation = () => {
      const pathname = normalizePath();
      const hash = location.hash.slice(1);
      let active = '';
      if (hash === 'contacto') active = 'contacto';
      else if (pathname === '/') active = 'inicio';
      else if (pathname.startsWith('/tecnologia')) active = 'tecnologia';
      else if (pathname.startsWith('/recursos')) active = 'recursos';
      else if (pathname.startsWith('/servicios') || pathname.startsWith('/operar-en-argentina')) active = 'soluciones';
      document.querySelectorAll('[data-nav]').forEach((link) => {
        const current = link.dataset.nav === active;
        link.classList.toggle('active', current);
        if (current) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
      document.querySelectorAll('.dd-menu a').forEach((link) => {
        const linkPath = new URL(link.href, location.href).pathname.replace(/\/$/, '');
        const current = pathname.replace(/\/$/, '') === linkPath;
        link.classList.toggle('active', current);
        if (current) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
    };
    syncActiveNavigation();
    addEventListener('hashchange', syncActiveNavigation);

    const header = document.querySelector('header.nav');
    const toggle = document.querySelector('.nav-toggle');
    const menu = document.querySelector('.nav-links');
    const dropdown = menu?.querySelector('.dd');
    const dropdownToggle = dropdown?.querySelector('.dd-toggle');
    let returnFocus = null;
    let menuScrollLock = null;

    const progress = document.createElement('div');
    progress.className = 'app-progress';
    progress.setAttribute('aria-hidden', 'true');
    body.append(progress);

    const scrim = document.createElement('div');
    scrim.className = 'app-menu-scrim';
    scrim.setAttribute('aria-hidden', 'true');
    body.append(scrim);

    const setScrolled = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      const ratio = Math.min(1, Math.max(0, scrollY / max));
      header?.classList.toggle('scrolled', scrollY > 10);
      document.documentElement.style.setProperty('--app-scroll', ratio.toFixed(4));
    };
    setScrolled();
    addEventListener('scroll', setScrolled, { passive: true });
    addEventListener('resize', setScrolled, { passive: true });

    if (toggle && menu) {
      menu.id ||= 'app-navigation';
      toggle.setAttribute('aria-controls', menu.id);
      dropdownToggle?.setAttribute('aria-expanded', dropdown?.classList.contains('open') ? 'true' : 'false');

      const focusable = () => [...menu.querySelectorAll('a[href],button:not([disabled])')].filter((el) => el.offsetParent !== null);
      const lockMenuScroll = () => {
        if (menuScrollLock) return;
        menuScrollLock = {
          y: window.scrollY,
          position: body.style.position,
          top: body.style.top,
          left: body.style.left,
          right: body.style.right,
          width: body.style.width
        };
        body.style.position = 'fixed';
        body.style.top = `-${menuScrollLock.y}px`;
        body.style.left = '0';
        body.style.right = '0';
        body.style.width = '100%';
      };
      const unlockMenuScroll = () => {
        if (!menuScrollLock) return;
        const lock = menuScrollLock;
        menuScrollLock = null;
        body.style.position = lock.position;
        body.style.top = lock.top;
        body.style.left = lock.left;
        body.style.right = lock.right;
        body.style.width = lock.width;
        window.scrollTo({ top: lock.y, left: 0, behavior: 'instant' });
      };
      const setMenu = (open) => {
        if (open) {
          returnFocus = document.activeElement;
          lockMenuScroll();
        }
        toggle.setAttribute('aria-expanded', String(open));
        menu.classList.toggle('open', open);
        scrim.classList.toggle('is-open', open);
        body.classList.toggle('app-menu-open', open);
        if (open) requestAnimationFrame(() => focusable()[0]?.focus());
        else {
          dropdown?.classList.remove('open');
          dropdownToggle?.setAttribute('aria-expanded', 'false');
          unlockMenuScroll();
          if (returnFocus instanceof HTMLElement) returnFocus.focus();
        }
      };

      toggle.addEventListener('click', (event) => {
        if (innerWidth > 900) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        setMenu(toggle.getAttribute('aria-expanded') !== 'true');
      }, true);

      dropdownToggle?.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        const open = !dropdown.classList.contains('open');
        dropdown.classList.toggle('open', open);
        dropdownToggle.setAttribute('aria-expanded', String(open));
      }, true);

      menu.addEventListener('click', (event) => {
        const link = event.target.closest('a:not(.dd-toggle)');
        if (link && innerWidth <= 900) setMenu(false);
      }, true);
      scrim.addEventListener('click', () => setMenu(false));
      document.addEventListener('pointerdown', (event) => {
        if (innerWidth <= 900 || !dropdown?.classList.contains('open') || dropdown.contains(event.target)) return;
        dropdown.classList.remove('open');
        dropdownToggle?.setAttribute('aria-expanded', 'false');
      });

      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && dropdown?.classList.contains('open') && !body.classList.contains('app-menu-open')) {
          event.preventDefault();
          dropdown.classList.remove('open');
          dropdownToggle?.setAttribute('aria-expanded', 'false');
          dropdownToggle?.focus();
          return;
        }
        if (!body.classList.contains('app-menu-open')) return;
        if (event.key === 'Escape') {
          event.preventDefault();
          setMenu(false);
          return;
        }
        if (event.key !== 'Tab') return;
        const items = [toggle, ...focusable()];
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      });

      addEventListener('resize', () => {
        if (innerWidth > 900 && body.classList.contains('app-menu-open')) setMenu(false);
      }, { passive: true });
    }

    document.querySelectorAll('details').forEach((detail) => {
      const summary = detail.querySelector(':scope > summary');
      if (!summary) return;
      summary.setAttribute('aria-expanded', String(detail.open));
      detail.addEventListener('toggle', () => summary.setAttribute('aria-expanded', String(detail.open)));
    });

    const mapStages = [...document.querySelectorAll('.map-rail details')];
    mapStages.forEach((detail) => {
      detail.addEventListener('toggle', () => {
        if (!detail.open) return;
        mapStages.forEach((other) => {
          if (other !== detail) other.open = false;
        });
      });
    });

    document.querySelectorAll('.painchips .chip[onclick]').forEach((chip) => {
      chip.setAttribute('role', 'button');
      chip.setAttribute('tabindex', '0');
      chip.setAttribute('aria-pressed', 'false');
      chip.addEventListener('click', () => {
        chip.parentElement?.querySelectorAll('.chip').forEach((other) => {
          other.classList.toggle('active', other === chip);
          other.setAttribute('aria-pressed', String(other === chip));
        });
      });
      chip.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        chip.click();
      });
    });

    const siteFooter = document.querySelector('.site-footer');
    if (!document.querySelector('#contacto') && siteFooter) siteFooter.id = 'contacto';

    document.querySelectorAll('input,select,textarea').forEach((field) => {
      if (field.tagName === 'INPUT' && !field.getAttribute('type')) field.setAttribute('type', 'text');
      const key = `${field.name || ''} ${field.id || ''}`.toLowerCase();
      if (/mail|correo/.test(key)) {
        field.setAttribute('type', 'email');
        field.setAttribute('inputmode', 'email');
        field.setAttribute('autocomplete', 'email');
      } else if (/tel|phone|whatsapp/.test(key)) {
        field.setAttribute('type', 'tel');
        field.setAttribute('inputmode', 'tel');
        field.setAttribute('autocomplete', 'tel');
      } else if (/nombre|name/.test(key)) {
        field.setAttribute('autocomplete', 'name');
      } else if (/empresa|company/.test(key)) {
        field.setAttribute('autocomplete', 'organization');
      }
    });

    const dock = document.querySelector('.sticky-cta');
    const contact = document.querySelector('#contacto');
    const footer = document.querySelector('.site-footer');
    if (dock && 'IntersectionObserver' in window) {
      const dockHref = dock.querySelector('a[href^="#"]')?.getAttribute('href');
      const duplicateActions = dockHref ? [...document.querySelectorAll('a[href]')]
        .filter((link) => !dock.contains(link) && link.getAttribute('href') === dockHref) : [];
      const heroActions = document.querySelector('.hero .cta-row');
      const observed = [contact, footer, heroActions, ...duplicateActions].filter(Boolean);
      const visibility = new Map(observed.map((element) => [element, false]));
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => visibility.set(entry.target, entry.isIntersecting));
        dock.classList.toggle('is-hidden', [...visibility.values()].some(Boolean));
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.02 });
      observed.forEach((element) => observer.observe(element));
      document.addEventListener('focusin', (event) => {
        dock.classList.toggle('is-hidden', Boolean(event.target.closest('input,select,textarea')));
      });
      document.addEventListener('focusout', () => {
        requestAnimationFrame(() => dock.classList.toggle('is-hidden', [...visibility.values()].some(Boolean)));
      });
    }
  });
})();
