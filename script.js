/* =============================================================================
   script.js — Utkarsh Choudhary · portfolio
   Vanilla JS, no modules, no dependencies. Runs from file:// as-is.

   Contents
     00  Feature detection / helpers
     01  JS flags on <html> and <body>
     02  Theme toggle (+ prefers-color-scheme change, only without a stored pref)
     03  Mobile navigation (#navToggle / #siteNav)
     04  Scroll reveal with per-group stagger
     05  Meter fills
     06  Copy email to clipboard with layered fallbacks
     07  Scroll-spy (aria-current on the in-view nav link)
     08  Scroll-progress fallback for browsers without animation-timeline
     09  #year
     10  External links open in a new tab
   ========================================================================== */

(function () {
  'use strict';

  /* ---------------------------------------------------------------------
     00  Helpers
     --------------------------------------------------------------------- */

  var docEl = document.documentElement;
  var body = document.body;
  var THEME_KEY = 'theme';
  var NAV_BREAKPOINT = 780;
  var COPY_FEEDBACK_MS = 1800;

  /** document.querySelector that returns null instead of throwing. */
  function $(selector, scope) {
    try {
      return (scope || document).querySelector(selector);
    } catch (err) {
      return null;
    }
  }

  /** document.querySelectorAll -> real Array, safe on a null root. */
  function $$(selector, scope) {
    try {
      return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
    } catch (err) {
      return [];
    }
  }

  function on(el, type, handler, options) {
    if (el) el.addEventListener(type, handler, options || false);
  }

  /** localStorage can throw in private mode / file:// sandboxes. */
  function storageGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (err) {
      return null;
    }
  }

  function storageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (err) {
      /* preference simply will not persist — non-fatal */
    }
  }

  var reduceMotionQuery =
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null;

  function prefersReducedMotion() {
    return !!(reduceMotionQuery && reduceMotionQuery.matches);
  }

  /* ---------------------------------------------------------------------
     01  Mark the document as scripted as early as possible, so CSS can
         skip entrance animations that would otherwise replay on load.
     --------------------------------------------------------------------- */

  if (docEl) docEl.classList.add('js');


  /* ---------------------------------------------------------------------
     02  Theme toggle
         The inline <head> script has already set data-theme; we only
         own the runtime behaviour from here on.
     --------------------------------------------------------------------- */

  function resolveTheme() {
    return docEl && docEl.dataset ? docEl.dataset.theme === 'dark' ? 'dark' : 'light' : 'light';
  }

  function setTheme(theme) {
    if (!docEl) return;
    docEl.dataset.theme = theme;
  }

  function initTheme() {
    var toggle = $('#themeToggle');
    if (!toggle) return;

    // The span marked with data-theme-label owns the wording; without it we
    // have to fall back to editing the button's own content.
    var label = toggle.querySelector('[data-theme-label]') || toggle;

    function render() {
      var theme = resolveTheme();
      var dark = theme === 'dark';
      toggle.setAttribute('aria-pressed', dark ? 'true' : 'false');
      var text = dark ? 'Light theme' : 'Dark theme';
      if (label === toggle) {
        // Rewrite an existing text node in place rather than replacing the
        // button's content, so a sibling icon element survives.
        var textNode = null;
        for (var i = 0; i < toggle.childNodes.length; i++) {
          if (toggle.childNodes[i].nodeType === 3 && toggle.childNodes[i].nodeValue.trim()) {
            textNode = toggle.childNodes[i];
            break;
          }
        }
        if (textNode) textNode.nodeValue = text;
        else toggle.textContent = text;
      } else {
        label.textContent = text;
      }
    }

    function flip() {
      var next = resolveTheme() === 'dark' ? 'light' : 'dark';
      setTheme(next);
      storageSet(THEME_KEY, next);
      render();
    }

    on(toggle, 'click', flip);
    render();

    // Follow the OS only while the user has expressed no stored preference.
    if (typeof window.matchMedia === 'function') {
      var darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
      var onSystemChange = function (event) {
        if (storageGet(THEME_KEY)) return;
        setTheme(event.matches ? 'dark' : 'light');
        render();
      };
      if (typeof darkQuery.addEventListener === 'function') {
        darkQuery.addEventListener('change', onSystemChange);
      } else if (typeof darkQuery.addListener === 'function') {
        darkQuery.addListener(onSystemChange); // Safari < 14
      }
    }
  }

  /* ---------------------------------------------------------------------
     03  Mobile navigation
     --------------------------------------------------------------------- */

  function initNav() {
    var toggle = $('#navToggle');
    var nav = $('#siteNav');
    if (!toggle || !nav) return;

    function isOpen() {
      return !nav.hasAttribute('hidden');
    }

    function setOpen(open) {
      if (open) nav.removeAttribute('hidden');
      else nav.setAttribute('hidden', '');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      // Announce the current action for screen readers on the control itself.
      toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
      // The lock is for the mobile panel only; above the breakpoint the nav
      // is always on screen and there is nothing to lock.
      if (body) body.style.overflow = open && window.innerWidth <= NAV_BREAKPOINT ? 'hidden' : '';
    }

    function close(returnFocus) {
      if (!isOpen()) return;
      setOpen(false);
      if (returnFocus) toggle.focus();
    }

    on(toggle, 'click', function () {
      setOpen(!isOpen());
    });

    on(document, 'keydown', function (event) {
      if (event.key === 'Escape' || event.key === 'Esc') close(true);
    });

    $$('a', nav).forEach(function (link) {
      on(link, 'click', function () {
        close(false);
      });
    });

    // Growing past the breakpoint reveals the full nav again; make sure the
    // hidden attribute and scroll lock do not survive into that layout.
    on(window, 'resize', function () {
      if (window.innerWidth > NAV_BREAKPOINT) close(false);
    });

    // Always start collapsed. The CSS shows the full nav above the
    // breakpoint regardless of the attribute, so wide screens are unaffected
    // while the control's state stays truthful.
    setOpen(false);
  }

  /* ---------------------------------------------------------------------
     04  Scroll reveal
     --------------------------------------------------------------------- */

  function initReveal() {
    var targets = $$('[data-reveal]');
    if (!targets.length) return;

    function showAll() {
      targets.forEach(function (el) {
        el.classList.add('is-visible');
      });
    }

    if (prefersReducedMotion() || typeof window.IntersectionObserver !== 'function') {
      showAll();
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          // Stagger siblings inside a shared group so rows cascade rather
          // than snapping in as one block. Elements carry an empty
          // data-reveal, so group by the nearest section unless one is named.
          var group = el.getAttribute('data-reveal') || el.closest('section, footer, header');
          if (group) {
            var peers = $$('[data-reveal]', group);
            var index = peers.indexOf(el);
            // The first peer fires immediately, and the delay is capped so a
            // long list does not leave its tail waiting seconds.
            if (index > 0) el.style.transitionDelay = Math.min(index, 6) * 70 + 'ms';
          }
          el.classList.add('is-visible');
          observer.unobserve(el);
        });
      },
      { root: null, rootMargin: '0px 0px -12% 0px', threshold: 0.12 }
    );

    targets.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ---------------------------------------------------------------------
     05  Meter fills
         Each .meter holds a .meter__fill. When reduced motion is on or
         IntersectionObserver is missing there is nothing to wait for, so
         every meter is filled up front instead.
     --------------------------------------------------------------------- */

  function initMeters() {
    var meters = $$('.meter');
    if (!meters.length) return;

    function fill(meter) {
      var bar = meter.querySelector('.meter__fill');
      if (bar) bar.classList.add('is-visible');
      meter.classList.add('is-visible');
    }

    function fillAll() {
      meters.forEach(fill);
    }

    if (prefersReducedMotion() || typeof window.IntersectionObserver !== 'function') {
      fillAll();
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          fill(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { root: null, rootMargin: '0px 0px -15% 0px', threshold: 0.3 }
    );

    meters.forEach(function (meter) {
      observer.observe(meter);
    });
  }

  /* ---------------------------------------------------------------------
     06  Copy email
     --------------------------------------------------------------------- */

  // Last-resort path for browsers with no navigator.clipboard, and for the
  // insecure-context case where it exists but writeText() rejects. The
  // textarea is parked off-screen because it has to be in the document and
  // selectable for execCommand to see a selection at all.
  function legacyCopy(text) {
    var area = document.createElement('textarea');
    area.value = text;
    // Keep it off-screen but still focusable/selectable.
    area.setAttribute('readonly', '');
    area.setAttribute('aria-hidden', 'true');
    area.setAttribute('tabindex', '-1');
    area.style.position = 'fixed';
    area.style.top = '-1000px';
    area.style.left = '-1000px';
    area.style.opacity = '0';
    document.body.appendChild(area);

    var selection = document.getSelection();
    var previousRange =
      selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

    var ok = false;
    try {
      area.select();
      area.setSelectionRange(0, text.length);
      ok = document.execCommand('copy');
    } catch (err) {
      ok = false;
    }

    document.body.removeChild(area);

    if (previousRange && selection) {
      selection.removeAllRanges();
      selection.addRange(previousRange);
    }
    return ok;
  }

  function initCopyEmail() {
    var button = $('#copyEmail');
    if (!button) return;

    var email = button.getAttribute('data-email') || 'utkarsh6624@gmail.com';

    // A separate polite live region: changing a button's own text is not
    // reliably announced, a live region is.
    var live = $('#copyStatus');
    if (!live) {
      live = document.createElement('span');
      live.id = 'copyStatus';
      live.className = 'copy-status';
      live.setAttribute('role', 'status');
      live.setAttribute('aria-live', 'polite');
      live.setAttribute('aria-atomic', 'true');
      live.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;';
      if (button.parentNode) button.parentNode.appendChild(live);
    }

    var idleLabel = button.getAttribute('data-label-idle') || button.textContent;
    var resetTimer = null;

    function announce(message) {
      live.textContent = message;
      if (resetTimer) window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(function () {
        live.textContent = '';
        button.textContent = idleLabel;
        button.classList.remove('is-copied');
        resetTimer = null;
      }, COPY_FEEDBACK_MS);
    }

    function confirmSuccess() {
      button.textContent = 'Copied';
      button.classList.add('is-copied');
      announce(email + ' copied to clipboard');
    }

    function failToMailto() {
      window.location.href = 'mailto:' + email;
    }

    on(button, 'click', function () {
      // Prefer the async Clipboard API where available.
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText(email).then(confirmSuccess, function () {
          if (legacyCopy(email)) confirmSuccess();
          else failToMailto();
        });
        return;
      }
      if (legacyCopy(email)) confirmSuccess();
      else failToMailto();
    });
  }

  /* ---------------------------------------------------------------------
     07  Scroll-spy — mark the in-view section's nav link with aria-current
     --------------------------------------------------------------------- */

  function initScrollSpy() {
    var nav = $('#siteNav');
    if (!nav || typeof window.IntersectionObserver !== 'function') return;

    var links = $$('a[href^="#"]', nav).filter(function (link) {
      return link.getAttribute('href') !== '#' && document.getElementById(link.getAttribute('href').slice(1));
    });
    if (!links.length) return;

    var sections = links
      .map(function (link) {
        return document.getElementById(link.getAttribute('href').slice(1));
      })
      .filter(Boolean);

    var visible = [];

    function setCurrent(id) {
      links.forEach(function (link) {
        var match = link.getAttribute('href') === '#' + id;
        if (match) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var id = entry.target.id;
          var at = visible.indexOf(id);
          if (entry.isIntersecting && at === -1) visible.push(id);
          else if (!entry.isIntersecting && at !== -1) visible.splice(at, 1);
        });
        // When nothing is in the band — scrolling back up past the first
        // section, or inside one with no nav entry — clear the marker
        // rather than leaving a stale section marked as current.
        if (visible.length) setCurrent(visible[0]);
        else setCurrent(null);
      },
      // A thin band from 20% to 30% of the viewport height. Keeping it narrow
      // means tall sections do not straddle it — the one crossing the band
      // is the section the reader is actually looking at, which wins the
      // marker.
      { root: null, rootMargin: '-20% 0px -70% 0px', threshold: 0 }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  /* ---------------------------------------------------------------------
     08  Scroll-progress fallback
         The gauge dot animates with animation-timeline: scroll() in modern
         browsers; this drives --progress for the rest.
     --------------------------------------------------------------------- */

  function initProgressFallback() {
    var dot = $('.gauge-dot');
    if (!dot) return;

    var host = dot.parentNode || docEl;

    var nativeSupport =
      typeof window.CSS !== 'undefined' &&
      typeof window.CSS.supports === 'function' &&
      window.CSS.supports('animation-timeline', 'scroll()');

    if (nativeSupport) {
      // CSS is handling it; the custom property is left at its default.
      host.style.setProperty('--progress', '0');
      return;
    }

    if (prefersReducedMotion()) {
      // No motion: jump straight to the end state and stop listening.
      host.style.setProperty('--progress', '1');
      return;
    }

    var ticking = false;

    function update() {
      ticking = false;
      var doc = document.documentElement;
      var scrollable = doc.scrollHeight - window.innerHeight;
      var progress = scrollable > 0 ? window.pageYOffset / scrollable : 0;
      progress = Math.max(0, Math.min(1, progress));
      host.style.setProperty('--progress', progress.toFixed(4));
      dot.style.transform = 'scaleY(' + (0.35 + 0.65 * progress).toFixed(4) + ')';
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    on(window, 'scroll', onScroll, { passive: true });
    on(window, 'resize', onScroll);
    update();
  }

  /* ---------------------------------------------------------------------
     09  Footer year
     --------------------------------------------------------------------- */

  function initYear() {
    var year = $('#year');
    if (!year) return;
    year.textContent = String(new Date().getFullYear());
  }

  /* ---------------------------------------------------------------------
     10  External links open in a new tab
         The markup already says target="_blank"; this keeps any link added
         later correct too. In-page anchors, mailto: and relative files are
         left alone — they should stay in the current tab.
     --------------------------------------------------------------------- */

  function initExternalLinks() {
    $$('a[href]').forEach(function (link) {
      var href = link.getAttribute('href') || '';
      if (!/^https?:\/\//i.test(href)) return;
      link.setAttribute('target', '_blank');
      // noopener keeps the new tab from reaching back into this page.
      link.setAttribute('rel', 'noopener noreferrer');
    });
  }

  /* ---------------------------------------------------------------------
     11  Projects Carousel — horizontal scroll with prev/next buttons
     --------------------------------------------------------------------- */

  function initProjectsCarousel() {
    var carousel = $('.projects-carousel');
    if (!carousel) return;

    var track = $('.projects-track', carousel);
    var prevBtn = $('.carousel-btn--prev', carousel);
    var nextBtn = $('.carousel-btn--next', carousel);
    if (!track || !prevBtn || !nextBtn) return;

    // Calculate scroll amount based on visible item width + gap
    function getScrollAmount() {
      var firstItem = track.querySelector('[role="listitem"]');
      if (!firstItem) return 300;
      var style = window.getComputedStyle(firstItem);
      var gap = parseFloat(style.marginRight) || 16;
      return firstItem.offsetWidth + gap;
    }

    function scrollTrack(direction) {
      var amount = getScrollAmount() * 3; // Scroll 3 items at a time
      track.scrollBy({ left: direction * amount, behavior: 'smooth' });
    }

    function updateButtons() {
      var maxScroll = track.scrollWidth - track.clientWidth;
      var atStart = track.scrollLeft <= 10;
      var atEnd = track.scrollLeft >= maxScroll - 10;

      prevBtn.disabled = atStart;
      nextBtn.disabled = atEnd;

      prevBtn.style.opacity = atStart ? '0.3' : '1';
      prevBtn.style.pointerEvents = atStart ? 'none' : 'auto';
      nextBtn.style.opacity = atEnd ? '0.3' : '1';
      nextBtn.style.pointerEvents = atEnd ? 'none' : 'auto';
    }

    on(prevBtn, 'click', function () { scrollTrack(-1); });
    on(nextBtn, 'click', function () { scrollTrack(1); });

    // Update buttons on scroll
    on(track, 'scroll', function () {
      if (track._scrollTimer) return;
      track._scrollTimer = setTimeout(function () {
        updateButtons();
        track._scrollTimer = null;
      }, 50);
    }, { passive: true });

    // Update on resize
    on(window, 'resize', updateButtons);

    // Keyboard navigation
    on(track, 'keydown', function (event) {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        scrollTrack(-1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        scrollTrack(1);
      }
    });

    // Initial button state
    updateButtons();
  }

  /* ---------------------------------------------------------------------
     Boot
     --------------------------------------------------------------------- */

  function init() {
    initTheme();
    initNav();
    initReveal();
    initMeters();
    initCopyEmail();
    initScrollSpy();
    initProgressFallback();
    initYear();
    initExternalLinks();
    initProjectsCarousel();
  }

  if (body) init();
  else on(document, 'DOMContentLoaded', init);

  // A back/forward-cache restore replays the original markup, so re-apply
  // the stored preference if there is one. With no stored preference the
  // inline head script's system-derived value stands.
  on(window, 'pageshow', function () {
    if (storageGet(THEME_KEY)) setTheme(storageGet(THEME_KEY));
  });
})();
