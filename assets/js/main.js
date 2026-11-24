document.addEventListener('DOMContentLoaded', () => {

  /* === CMS: apply site-config.js to the page ============================= */
  /* Binds values from window.SITE_CONFIG to any element carrying a
     data-cms="..." attribute, so form links / deadlines / open-closed status
     are edited in ONE place (assets/js/site-config.js or admin.html).        */
  (function applySiteConfig() {
    const cfg = window.SITE_CONFIG;
    if (!cfg) return;

    // Which program page are we on? (index -> null, no application block)
    const file = (location.pathname.split('/').pop() || 'index.html')
      .replace('.html', '');
    // cfg.pages may not exist at all now that per-page status/deadline/form
    // data is generated straight into static HTML by the Strapi pipeline —
    // guard against that instead of assuming this key is always present.
    const page = (cfg.pages && cfg.pages[file]) || null;

    const fmtDate = (iso) => {
      if (!iso) return '';
      const d = new Date(iso + 'T00:00:00');
      if (isNaN(d)) return iso;
      return d.toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric'
      });
    };

    const setLink = (el, url) => {
      if (!url) return;
      el.setAttribute('href', url);
      if (/^https?:/i.test(url)) { el.target = '_blank'; el.rel = 'noopener'; }
    };

    document.querySelectorAll('[data-cms]').forEach(el => {
      const key = el.getAttribute('data-cms');

      switch (key) {
        case 'form':
          if (page) {
            const open = page.status !== 'closed';
            setLink(el, page.formUrl);
            if (!open) {
              el.classList.add('is-disabled');
              el.setAttribute('aria-disabled', 'true');
              el.addEventListener('click', e => e.preventDefault());
            }
          }
          break;

        case 'status':
          if (page) {
            const open = page.status !== 'closed';
            el.classList.add('status-pill', open ? 'is-open' : 'is-closed');
            el.innerHTML = open
              ? '<span class="status-dot"></span> Applications Open'
              : '<span class="status-dot"></span> Applications Closed';
            // Same destination as the page's "Apply Now" button, so the
            // status pill itself is clickable while applications are open.
            if (open) setLink(el, page.formUrl);
          }
          break;

        case 'deadline':
          if (page && page.deadline) {
            el.innerHTML =
              '<i class="fas fa-calendar-day" aria-hidden="true"></i> ' +
              'Deadline: <strong>' + fmtDate(page.deadline) + '</strong>';
          } else {
            el.style.display = 'none';
          }
          break;

        case 'whatsapp':      setLink(el, cfg.whatsapp); break;
        case 'instagram':     setLink(el, cfg.socials.instagram); break;
        case 'facebook':      setLink(el, cfg.socials.facebook); break;
        case 'linkedin':      setLink(el, cfg.socials.linkedin); break;

        case 'contact-email':
          setLink(el, 'mailto:' + cfg.contactEmail);
          el.target = ''; el.rel = '';           // mailto opens in same context
          if (el.dataset.cmsText === 'show') {
            const icon = el.querySelector('i');
            el.textContent = ' ' + cfg.contactEmail;
            if (icon) el.prepend(icon);
          }
          break;

        case 'phone':
          setLink(el, 'tel:' + cfg.phone.replace(/[^0-9+]/g, ''));
          if (el.dataset.cmsText === 'show') {
            const icon = el.querySelector('i');
            el.textContent = ' ' + cfg.phone;
            if (icon) el.prepend(icon);
          }
          break;

        case 'address':
          if (el.dataset.cmsText === 'show') {
            const icon = el.querySelector('i');
            el.textContent = ' ' + cfg.address;
            if (icon) el.prepend(icon);
          }
          break;
      }
    });
  })();

  /* === Mobile Navigation === */
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      const isOpen = navLinks.classList.contains('active');
      mobileToggle.innerHTML = isOpen
        ? '<i class="fas fa-times"></i>'
        : '<i class="fas fa-bars"></i>';
    });

    // Close menu when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
      });
    });
  }

  /* === Navbar Scroll Effect === */
  const navbar = document.querySelector('.navbar');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;
    if (currentScroll > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    lastScroll = currentScroll;
  });

  /* === Scroll Reveal (Intersection Observer) === */
  const revealElements = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  revealElements.forEach(el => revealObserver.observe(el));

  /* === Active Nav Link === */
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage) {
      link.classList.add('active');
    }
  });

  /* === Back to Top Button === */
  const backBtn = document.querySelector('.back-to-top');
  if (backBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 500) {
        backBtn.classList.add('visible');
      } else {
        backBtn.classList.remove('visible');
      }
    });

    backBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* === Cyber map — tap-to-toggle tooltip for touch devices =============== */
  /* Hover/focus already show the tooltip via CSS; this just adds tap support
     wherever a `.map-marker` + adjacent `.map-tooltip` pair exists (currently
     only the Cyber Clinic map on cybersecurity.html), so it's a no-op on
     every other page. */
  document.querySelectorAll('.map-marker').forEach(marker => {
    marker.addEventListener('click', e => {
      e.preventDefault();
      const tip = marker.nextElementSibling;
      document.querySelectorAll('.map-tooltip.is-open').forEach(t => {
        if (t !== tip) t.classList.remove('is-open');
      });
      if (tip) tip.classList.toggle('is-open');
    });
  });

  /* === Animated Counters === */
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const target = el.getAttribute('data-count');
            const suffix = el.getAttribute('data-suffix') || '';
            const numTarget = parseInt(target);
            const duration = 2000;
            const startTime = performance.now();

            function updateCounter(currentTime) {
              const elapsed = currentTime - startTime;
              const progress = Math.min(elapsed / duration, 1);
              // Ease out cubic
              const easeOut = 1 - Math.pow(1 - progress, 3);
              const current = Math.floor(easeOut * numTarget);
              el.textContent = current + suffix;

              if (progress < 1) {
                requestAnimationFrame(updateCounter);
              } else {
                el.textContent = target + suffix;
              }
            }

            requestAnimationFrame(updateCounter);
            counterObserver.unobserve(el);
          }
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach(c => counterObserver.observe(c));
  }
});
