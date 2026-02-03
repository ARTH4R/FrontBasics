/**
 * mobile-nav-complete.js
 * ─────────────────────
 * Handles:
 *   1. Open / close the mobile menu drawer + overlay
 *   2. Hamburger icon animation (3 bars ↔ ✕)
 *   3. Dark-mode toggle inside the drawer — stays in sync
 *      with the desktop toggle (calls the global toggleDarkMode())
 *   4. Language selector inside the drawer — stays in sync
 *      with the desktop <select>
 *   5. Close on overlay-click, Escape key, and nav-link click
 *   6. Focus-trap: when drawer is open, Tab stays inside it
 *   7. Scroll-lock: body scroll is prevented while drawer is open
 */
(function () {
    'use strict';

    // ── DOM refs ────────────────────────────────────────────────
    const hamburger      = document.getElementById('mobileMenuToggle');
    const drawer         = document.getElementById('mobileMenu');
    const overlay        = document.getElementById('mobileMenuOverlay');
    const closeBtn       = document.getElementById('mobileMenuClose');
    const mobileDark     = document.getElementById('mobileDarkToggle');
    const mobileLang     = document.getElementById('mobileLanguageSelect');
    const desktopLang    = document.getElementById('languageSelect');       // may be null on non-home pages
    const mobileSearch   = document.getElementById('mobileSearchInput');

    // ── state ───────────────────────────────────────────────────
    let isOpen = false;

    // ── helpers ─────────────────────────────────────────────────
    function open() {
        isOpen = true;
        hamburger.classList.add('is-open');
        hamburger.setAttribute('aria-expanded', 'true');
        drawer.classList.add('is-open');
        overlay.classList.add('is-open');
        document.body.style.overflow = 'hidden';   // scroll-lock

        // sync dark-mode pill visual with current body state
        syncDarkToggleVisual();

        // sync language select
        syncLanguageVisual();

        // focus the search input inside drawer for convenience
        if (mobileSearch) {
            setTimeout(() => mobileSearch.focus(), 350);
        }
    }

    function close() {
        isOpen = false;
        hamburger.classList.remove('is-open');
        hamburger.setAttribute('aria-expanded', 'false');
        drawer.classList.remove('is-open');
        overlay.classList.remove('is-open');
        document.body.style.overflow = '';          // restore scroll
    }

    function toggle() {
        isOpen ? close() : open();
    }

    // ── sync dark-mode pill visual with body.dark-mode ─────────
    function syncDarkToggleVisual() {
        // The CSS already reads body.dark-mode to style the pill;
        // nothing extra needed here — just a hook if you ever want
        // JS-driven class toggles on the button itself.
    }

    // ── sync mobile language <select> ↔ desktop <select> ───────
    function syncLanguageVisual() {
        if (!desktopLang || !mobileLang) return;
        mobileLang.value = desktopLang.value;
    }

    // ── event listeners ─────────────────────────────────────────

    // Hamburger click
    if (hamburger) hamburger.addEventListener('click', toggle);

    // Close button
    if (closeBtn) closeBtn.addEventListener('click', close);

    // Overlay click → close
    if (overlay) overlay.addEventListener('click', close);

    // Escape key → close
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && isOpen) close();
    });

    // Any nav-link inside drawer → close after navigation starts
    if (drawer) {
        drawer.querySelectorAll('.mobile-menu-link, .mobile-menu-btn-primary').forEach(function (link) {
            link.addEventListener('click', function () {
                close();
            });
        });
    }

    // ── Dark-mode toggle inside drawer ─────────────────────────
    if (mobileDark) {
        mobileDark.addEventListener('click', function () {
            // Reuse the global function that main-utilities.js provides
            if (typeof toggleDarkMode === 'function') {
                toggleDarkMode();
            }
            // The CSS handles the pill visual via body.dark-mode automatically
        });
    }

    // ── Language sync: mobile → desktop ────────────────────────
    if (mobileLang) {
        mobileLang.addEventListener('change', function () {
            // push value to desktop select so they stay in sync
            if (desktopLang) desktopLang.value = mobileLang.value;

            // If main-utilities.js exposes a language-change handler, call it.
            // Common pattern: dispatch a custom event that navSearchSystem listens to.
            desktopLang && desktopLang.dispatchEvent(new Event('change', { bubbles: true }));
        });
    }

    // ── Language sync: desktop → mobile (in case user resizes) ─
    if (desktopLang) {
        desktopLang.addEventListener('change', function () {
            if (mobileLang) mobileLang.value = desktopLang.value;
        });
    }

    // ── Focus-trap ──────────────────────────────────────────────
    if (drawer) {
        drawer.addEventListener('keydown', function (e) {
            if (e.key !== 'Tab' || !isOpen) return;

            // All focusable elements inside the drawer
            const focusable = drawer.querySelectorAll(
                'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (focusable.length === 0) return;

            const first = focusable[0];
            const last  = focusable[focusable.length - 1];

            if (e.shiftKey) {
                // Shift+Tab: if focus is on the first element, wrap to last
                if (document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                // Tab: if focus is on the last element, wrap to first
                if (document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        });
    }

    // ── On window resize: if drawer is open and viewport grows
    //    past 1024 px (desktop), auto-close it cleanly ──────────
    window.addEventListener('resize', function () {
        if (isOpen && window.innerWidth > 1024) {
            close();
        }
    });

})();