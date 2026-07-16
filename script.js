(() => {
  'use strict';

  // Footer year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Header scroll shadow
  const header = document.getElementById('header');
  const onScroll = () => {
    if (window.scrollY > 12) header.classList.add('is-scrolled');
    else header.classList.remove('is-scrolled');
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile nav toggle
  const menuToggle = document.getElementById('menuToggle');
  const mobileNav = document.getElementById('mobileNav');

  const closeMobileNav = () => {
    menuToggle.setAttribute('aria-expanded', 'false');
    mobileNav.classList.remove('is-open');
    mobileNav.setAttribute('aria-hidden', 'true');
  };

  const toggleMobileNav = () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!isOpen));
    mobileNav.classList.toggle('is-open', !isOpen);
    mobileNav.setAttribute('aria-hidden', String(isOpen));
  };

  menuToggle.addEventListener('click', toggleMobileNav);

  mobileNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMobileNav);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMobileNav();
  });

  // Smooth-scroll offset for sticky header on anchor links.
  // Measures only the fixed top bar, not the mobile dropdown — the dropdown
  // is a child of <header> too, so header.offsetHeight would briefly include
  // its open height and throw off the scroll target when a nav link is clicked.
  const headerBar = header.firstElementChild;
  const headerOffset = () => headerBar.offsetHeight;

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - headerOffset() + 1;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // Cookie consent (gates the Google Maps embed in the contact section).
  // Nothing under data-map-src is ever requested until the user explicitly
  // accepts — the iframe element itself is only created at that point.
  // Only index.html has the map/banner markup, so this whole block is
  // skipped on pages (like the legal page) that don't include it.
  const consentBanner = document.getElementById('cookieConsent');
  const mapContainer = document.getElementById('contactMap');

  if (consentBanner && mapContainer) {
    const CONSENT_KEY = 'gl-map-consent';
    const CONSENT_MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000; // re-ask after ~6 months
    const consentAcceptBtn = document.getElementById('cookieAccept');
    const consentRejectBtn = document.getElementById('cookieReject');
    const consentSettingsLink = document.getElementById('cookieSettingsLink');
    const mapPlaceholder = document.getElementById('contactMapPlaceholder');
    const mapEnableBtn = document.getElementById('contactMapEnable');

    const getConsent = () => {
      try {
        const raw = localStorage.getItem(CONSENT_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || (parsed.value !== 'granted' && parsed.value !== 'denied')) return null;
        if (Date.now() - parsed.ts > CONSENT_MAX_AGE_MS) return null; // expired — ask again
        return parsed.value;
      } catch (err) {
        return null; // storage unavailable or an old/unrecognized format
      }
    };

    const setConsent = (value) => {
      try {
        localStorage.setItem(CONSENT_KEY, JSON.stringify({ value, ts: Date.now() }));
      } catch (err) {
        /* storage unavailable — the choice still applies for this page view */
      }
    };

    const lockScroll = () => document.documentElement.classList.add('consent-lock');
    const unlockScroll = () => document.documentElement.classList.remove('consent-lock');

    const loadMap = () => {
      if (mapContainer.querySelector('iframe')) return;
      const iframe = document.createElement('iframe');
      iframe.src = mapContainer.dataset.mapSrc;
      iframe.title = mapContainer.dataset.mapTitle;
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'no-referrer-when-downgrade';
      mapContainer.innerHTML = '';
      mapContainer.appendChild(iframe);
    };

    const showMapPlaceholder = () => {
      if (!mapContainer.contains(mapPlaceholder)) {
        mapContainer.innerHTML = '';
        mapContainer.appendChild(mapPlaceholder);
      }
    };

    const openConsentBanner = () => {
      consentBanner.hidden = false;
      lockScroll();
      consentAcceptBtn.focus();
    };

    const closeConsentBanner = () => {
      consentBanner.hidden = true;
      unlockScroll();
    };

    const requestsSettings = new URLSearchParams(window.location.search).get('cookies') === 'open';
    const clearSettingsRequest = () => {
      const params = new URLSearchParams(window.location.search);
      params.delete('cookies');
      const newSearch = params.toString();
      const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash;
      window.history.replaceState({}, '', newUrl);
    };

    const initialConsent = getConsent();
    if (initialConsent === 'granted') {
      loadMap();
    } else {
      showMapPlaceholder();
    }

    if (requestsSettings) {
      openConsentBanner();
      clearSettingsRequest();
    } else if (initialConsent === null) {
      openConsentBanner();
    }

    consentAcceptBtn.addEventListener('click', () => {
      setConsent('granted');
      loadMap();
      closeConsentBanner();
    });

    consentRejectBtn.addEventListener('click', () => {
      setConsent('denied');
      showMapPlaceholder();
      closeConsentBanner();
    });

    mapEnableBtn.addEventListener('click', () => {
      setConsent('granted');
      loadMap();
    });

    if (consentSettingsLink) {
      consentSettingsLink.addEventListener('click', () => openConsentBanner());
    }
  }

  // Reveal-on-scroll
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -20px 0px' }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }
})();
