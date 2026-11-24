/* ==========================================================================
   render.js — turns a block-based Strapi page into a static HTML page.
   Used by generate.js: after a Strapi publish, it fetches pages from the
   Strapi API and calls renderProgramPage() for each, writing <slug>.html.
   Output uses the site's own CSS (main.css + program.css) and a per-page
   theme, so generated pages match the hand-built ones.

   Block components supported (Strapi dynamic-zone __component values):
     block.rich-text | block.card-grid | block.steps | block.testimonials |
     block.logos | block.cta | block.stats | block.gallery | block.custom-html
   ========================================================================== */
'use strict';

/* ---------- helpers ---------- */
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Strapi media fields return { url, ... }, with url relative to the Strapi
// host for locally-stored uploads (e.g. "/uploads/foo.png") and absolute for
// provider-hosted ones (e.g. S3/Cloudinary) — pass through absolute URLs.
function mediaUrl(media, strapiUrl) {
  if (!media || !media.url) return '';
  return /^https?:\/\//i.test(media.url) ? media.url : `${strapiUrl}${media.url}`;
}

function hexToRgba(hex, a) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(String(hex).trim());
  if (!m) return `rgba(0,230,118,${a})`;
  return `rgba(${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}, ${a})`;
}

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d)) return esc(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function initials(name) {
  return String(name || '').trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase();
}

/* ---------- shared chrome ---------- */
function navHtml(programs, activeSlug) {
  const links = programs
    .filter(p => !p.isHomepage)
    .slice().sort((a, b) => (a.order || 0) - (b.order || 0))
    .map(p => `<a href="${esc(p.slug)}.html"${p.slug === activeSlug ? ' class="active"' : ''}>${esc(p.navLabel)}</a>`)
    .join('\n            ');
  return `<nav class="navbar" role="navigation" aria-label="Main navigation">
        <a href="index.html" class="logo-lockup" aria-label="Innovatrium, BNU Incubation Center Home">
            <span class="logo-text">INNO<img src="assets/images/logos/logo-va.png" alt="" class="logo-va">TRIUM</span>
        </a>
        <div class="nav-links">
            <a href="index.html">Home</a>
            ${links}
            <a href="#" class="nav-contact" data-cms="contact-email"><i class="fas fa-envelope"></i> Contact Us</a>
        </div>
        <button class="mobile-toggle" aria-label="Toggle menu"><i class="fas fa-bars"></i></button>
    </nav>`;
}

function footerHtml(programs) {
  const links = programs
    .filter(p => !p.isHomepage)
    .slice().sort((a, b) => (a.order || 0) - (b.order || 0))
    .map(p => `<li><a href="${esc(p.slug)}.html">${esc(p.navLabel)}</a></li>`)
    .join('\n                        ');
  return `<footer class="footer">
        <div class="container">
            <div class="footer-grid">
                <div class="footer-brand">
                    <div class="logo-text">INNO<img src="assets/images/logos/logo-va.png" alt="" class="logo-va">TRIUM</div>
                    <p>BNU Incubation Center. Start. Build. Succeed.</p>
                    <div class="footer-social">
                        <a href="#" data-cms="instagram" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
                        <a href="#" data-cms="facebook" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
                        <a href="#" data-cms="linkedin" aria-label="LinkedIn"><i class="fab fa-linkedin-in"></i></a>
                    </div>
                </div>
                <div class="footer-links">
                    <h4>Programs</h4>
                    <ul>
                        ${links}
                    </ul>
                </div>
                <div class="footer-links">
                    <h4>Contact Us</h4>
                    <ul>
                        <li><a href="#" data-cms="contact-email" data-cms-text="show"><i class="fas fa-envelope"></i></a></li>
                        <li><a href="#" data-cms="phone" data-cms-text="show"><i class="fas fa-phone"></i></a></li>
                        <li><span class="footer-address" data-cms="address" data-cms-text="show"><i class="fas fa-map-marker-alt"></i></span></li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom"><p>&copy; 2026 Innovatrium. BNU Incubation Center. All Rights Reserved.</p></div>
        </div>
    </footer>`;
}

/* ---------- per-page visual variants ----------------------------------
   Some legacy pages keep their own bespoke card/step/CTA markup and CSS
   (rather than the shared program.css look aistudio.html uses) so the
   converted page is visually identical to the hand-built one it replaces.
   Content (headings/cards/steps/cta text) still comes from the same block
   schema — only the HTML/class names emitted differ, driven by slug.
   ------------------------------------------------------------------- */
// Each block type's variant config is keyed by an optional "styleKey" on the
// block itself (falls back to "default"), since a single page can need more
// than one bespoke style — e.g. Venture Den has both "ventures" and
// "benefits" card grids, each with their own markup/CSS.
const LEGACY_VARIANTS = {
  skilltoearn: {
    css: 'assets/css/pages/legacy-program.css',
    cardGrid: { default: { container: 'skill-tracks', card: 'track-card', iconWrap: 'icon-wrap' } },
    steps: { default: { container: 'how-grid', step: 'how-step', num: 'step-num', heading: 'h4' } },
    cta: { default: { box: 'cta-box', icon: 'fas fa-graduation-cap' } },
  },
  ventureden: {
    css: 'assets/css/pages/legacy-program.css',
    cardGrid: {
      ventures: { container: 'ventures-grid', card: 'venture-card', iconWrap: 'venture-icon', showTag: true },
      benefits: { container: 'benefits', card: 'benefit-card', iconWrap: null, heading: 'h4' },
    },
    cta: { default: { box: 'cta-box', icon: 'fas fa-paper-plane' } },
  },
  incubation: {
    css: 'assets/css/pages/legacy-program.css',
    cardGrid: {
      features: { container: 'feature-list', card: 'feature-card', iconWrap: 'icon-wrap' },
      startups: { container: 'startups-grid', card: 'startup-card', custom: 'startup' },
    },
    steps: { default: { container: 'timeline', step: 'timeline-item', heading: 'h4', dotOnly: true } },
    cta: { default: { box: 'cta-box', icon: 'fas fa-paper-plane' } },
  },
  index: {
    css: 'assets/css/pages/index.css',
    cta: { dark: { box: 'cta-banner', icon: 'fas fa-arrow-right', darkBtn: true, showDemoForm: true } },
  },
  cybersecurity: {
    css: 'assets/css/pages/cybersecurity.css',
    cardGrid: {
      who: { container: 'who-section', card: 'who-card', iconWrap: null, heading: 'h4' },
    },
    testimonials: {
      default: {
        container: 'testimonials', item: 'testimonial', quoteMark: 'quote-mark',
        author: 'testimonial-author', avatar: 'testimonial-avatar', name: 'name', role: 'role',
      },
    },
    gallery: { default: { container: 'cohort-gallery', plain: true } },
    logos: { default: { container: 'funding-logos' } },
    customHtml: { default: { map: true } },
    cta: { default: { box: 'cta-box', icon: 'fas fa-paper-plane' } },
  },
};

// Fixed metadata for the homepage's auto-generated program-nav cards — icon
// and icon-tint colors are presentational choices with no natural home in
// the Strapi schema (they mirrored hardcoded CSS classes originally, not any
// page's own theme), so they stay here as code, keyed by slug.
const PROGRAM_CARD_META = {
  incubation: { icon: 'fas fa-rocket', accent: '#A8D5BA', iconBg: 'rgba(168,213,186,0.35)', iconFg: 'var(--text-main)' },
  cybersecurity: { icon: 'fas fa-shield-halved', accent: '#7C3AAD', iconBg: 'rgba(124,58,173,0.10)', iconFg: '#7C3AAD' },
  skilltoearn: { icon: 'fas fa-laptop-code', accent: '#2A9D8F', iconBg: 'rgba(42,157,143,0.10)', iconFg: '#2A9D8F' },
  ventureden: { icon: 'fas fa-chart-line', accent: '#49B96B', iconBg: 'var(--primary-soft)', iconFg: 'var(--primary-dark)' },
  aistudio: { icon: 'fas fa-robot', accent: '#6366f1', iconBg: 'rgba(99,102,241,0.10)', iconFg: '#6366f1' },
};

function variantFor(slug) {
  return LEGACY_VARIANTS[slug] || null;
}

function pickVariant(byType, styleKey) {
  if (!byType) return null;
  return byType[styleKey || 'default'] || null;
}

/* ---------- block renderers ---------- */
function badge(text) {
  return text ? `<span class="section-badge">${esc(text)}</span>` : '';
}

// Escapes first (so no raw HTML can sneak through), then turns the simple
// **bold** markdown convention into <strong> — the only inline formatting
// editors need for occasional emphasis inside a paragraph.
function escWithInlineFormatting(s) {
  return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function blockRichText(b) {
  // body is a single string (Strapi richtext field); paragraphs are
  // separated by blank lines, matching how editors naturally write prose.
  const paras = String(b.body || '')
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => `<p>${escWithInlineFormatting(p)}</p>`)
    .join('\n                ');
  const list = (b.items || []).length
    ? `<ul class="learn-list">
                    ${b.items.map(i => `<li><i class="fas fa-chevron-right" aria-hidden="true"></i> ${esc(i.text)}</li>`).join('\n                    ')}
                </ul>`
    : '';
  const textCol = `<div class="reveal">
                    ${badge(b.badge)}
                    ${b.heading ? `<h2>${esc(b.heading)}</h2>` : ''}
                    ${paras}
                    ${list}
                </div>`;

  // Two-column "text + decorative icon tile" layout, used by cybersecurity.
  if (b.tileIcon) {
    const tile = `<div class="reveal reveal-delay-2">
                    <div class="cyber-tile" role="img" aria-label="${esc(b.heading || '')}">
                        <span class="tile-badge"><i class="${esc(b.tileIcon)}" aria-hidden="true"></i></span>
                    </div>
                </div>`;
    return `<div class="cyber-grid">
                ${b.reverse ? tile : textCol}
                ${b.reverse ? textCol : tile}
            </div>`;
  }

  return `<div class="prog-section prog-rich reveal${b.align === 'center' ? ' center' : ''}">
                ${badge(b.badge)}
                ${b.heading ? `<h2>${esc(b.heading)}</h2>` : ''}
                ${paras}
                ${list}
            </div>`;
}

function blockCardGrid(b, opts) {
  const v = pickVariant(opts && opts.variant && opts.variant.cardGrid, b.styleKey);
  if (v && v.custom === 'startup') {
    const cards = (b.cards || []).map(c => `<div class="${v.card} reveal">
                    <div class="startup-head">
                        <div class="startup-logo"><i class="${esc(c.icon || 'fas fa-star')}"></i></div>
                        <div>
                            <h3 class="startup-name">${esc(c.title)}</h3>
                            <span class="startup-tag">${esc(c.tag || '')}</span>
                        </div>
                    </div>
                    <p>${esc(c.text)}</p>
                    ${c.badgeLabel ? `<span class="startup-badge"><i class="${esc(c.badgeIcon || 'fas fa-star')}"></i> ${esc(c.badgeLabel)}</span>` : ''}
                </div>`).join('\n                ');
    return `<div class="reveal text-center" style="margin-top: 5rem;">
                ${badge(b.badge)}
                ${b.heading ? `<h2>${esc(b.heading)}</h2>` : ''}
                ${b.intro ? `<p style="max-width: 640px; margin: 0.5rem auto 0;">${escWithInlineFormatting(b.intro)}</p>` : ''}
            </div>
            <div class="${v.container}">
                ${cards}
            </div>`;
  }
  if (v) {
    const heading = v.heading || 'h3';
    const cards = (b.cards || []).map((c, i) => `<div class="${v.card} reveal reveal-delay-${(i % 4) + 1}">
                    ${v.iconWrap ? `<div class="${v.iconWrap}"><i class="${esc(c.icon || 'fas fa-star')}"></i></div>` : `<i class="${esc(c.icon || 'fas fa-star')}"></i>`}
                    <${heading}>${esc(c.title)}</${heading}>
                    ${v.showTag && c.tag ? `<span class="venture-tag">${esc(c.tag)}</span>` : ''}
                    <p>${esc(c.text)}</p>
                </div>`).join('\n                ');
    return `<div class="reveal" style="margin-top: 4rem; text-align: center;">
                ${badge(b.badge)}
                ${b.heading ? `<h2>${esc(b.heading)}</h2>` : ''}
                ${b.intro ? `<p>${escWithInlineFormatting(b.intro)}</p>` : ''}
            </div>
            <div class="${v.container}">
                ${cards}
            </div>`;
  }
  const cards = (b.cards || []).map(c => `<div class="prog-card reveal">
                    <div class="ic"><i class="${esc(c.icon || 'fas fa-star')}"></i></div>
                    <h3>${esc(c.title)}</h3>
                    <p>${esc(c.text)}</p>
                </div>`).join('\n                ');
  return `<div class="prog-section reveal">
                <div class="prog-head">
                    ${badge(b.badge)}
                    ${b.heading ? `<h2>${esc(b.heading)}</h2>` : ''}
                    ${b.intro ? `<p>${escWithInlineFormatting(b.intro)}</p>` : ''}
                </div>
                <div class="prog-cards">
                    ${cards}
                </div>
            </div>`;
}

function blockSteps(b, opts) {
  const v = pickVariant(opts && opts.variant && opts.variant.steps, b.styleKey);
  if (v) {
    const heading = v.heading || 'h3';
    const steps = (b.steps || []).map((s, i) => `<div class="${v.step} reveal reveal-delay-${(i % 4) + 1}">
                    ${v.dotOnly ? '<div class="timeline-dot"></div>' : `<div class="${v.num}">${s.icon ? `<i class="${esc(s.icon)}"></i>` : (i + 1)}</div>`}
                    <${heading}>${esc(s.title)}</${heading}>
                    <p>${esc(s.text)}</p>
                </div>`).join('\n                ');
    return `<div class="reveal text-center" style="margin-top: 5rem;">
                ${b.heading ? `<h2>${esc(b.heading)}</h2>` : ''}
                ${b.intro ? `<p>${escWithInlineFormatting(b.intro)}</p>` : ''}
            </div>
            <div class="${v.container}">
                ${steps}
            </div>`;
  }
  const steps = (b.steps || []).map((s, i) => `<div class="prog-step reveal">
                    <div class="num">${s.icon ? `<i class="${esc(s.icon)}"></i>` : (i + 1)}</div>
                    <div class="body">
                        <h3>${esc(s.title)}</h3>
                        <p>${esc(s.text)}</p>
                    </div>
                </div>`).join('\n                ');
  return `<div class="prog-section reveal">
                <div class="prog-head">
                    ${badge(b.badge)}
                    ${b.heading ? `<h2>${esc(b.heading)}</h2>` : ''}
                    ${b.intro ? `<p>${escWithInlineFormatting(b.intro)}</p>` : ''}
                </div>
                <div class="prog-steps">
                    ${steps}
                </div>
            </div>`;
}

function blockTestimonials(b, opts) {
  const v = pickVariant(opts && opts.variant && opts.variant.testimonials, b.styleKey);
  if (v) {
    const items = (b.items || []).map((t, i) => `<div class="${v.item} reveal reveal-delay-${(i % 4) + 1}">
                    <div class="${v.quoteMark}">&ldquo;</div>
                    <p>${esc(t.quote)}</p>
                    <div class="${v.author}">
                        <div class="${v.avatar}">${esc(initials(t.name))}</div>
                        <div><div class="${v.name}">${esc(t.name)}</div><div class="${v.role}">${esc(t.role || '')}</div></div>
                    </div>
                </div>`).join('\n                ');
    return `<div class="reveal text-center" style="margin-top: 5rem;">
                ${badge(b.badge)}
                ${b.heading ? `<h2>${esc(b.heading)}</h2>` : ''}
                ${b.intro ? `<p style="max-width: 640px; margin: 0.5rem auto 0;">${escWithInlineFormatting(b.intro)}</p>` : ''}
            </div>
            <div class="${v.container}">
                ${items}
            </div>`;
  }
  const items = (b.items || []).map(t => `<div class="prog-tml reveal">
                    <div class="q">&ldquo;</div>
                    <p>${esc(t.quote)}</p>
                    <div class="who">
                        <div class="av">${esc(initials(t.name))}</div>
                        <div><div class="nm">${esc(t.name)}</div><div class="rl">${esc(t.role || '')}</div></div>
                    </div>
                </div>`).join('\n                ');
  return `<div class="prog-section reveal">
                <div class="prog-head">
                    ${badge(b.badge)}
                    ${b.heading ? `<h2>${esc(b.heading)}</h2>` : ''}
                    ${b.intro ? `<p>${escWithInlineFormatting(b.intro)}</p>` : ''}
                </div>
                <div class="prog-tmls">
                    ${items}
                </div>
            </div>`;
}

function logoImg(l, strapiUrl) {
  const classes = [l.mono ? 'mono-mark' : '', l.sizeClass || ''].filter(Boolean).join(' ');
  return `<img src="${esc(mediaUrl(l.src, strapiUrl))}" alt="${esc(l.alt || '')}"${classes ? ` class="${esc(classes)}"` : ''}>`;
}

function blockLogos(b, opts) {
  const v = pickVariant(opts && opts.variant && opts.variant.logos, b.styleKey);
  const strapiUrl = opts && opts.strapiUrl;
  const row1 = (b.logos || []).map(l => logoImg(l, strapiUrl)).join('\n                    ');
  if (v) {
    const row2 = (b.logos2 || []).map(l => logoImg(l, strapiUrl)).join('\n                    ');
    return `<div class="reveal" style="margin-top: 5rem; text-align: center;">
                ${badge(b.badge)}
                ${b.heading ? `<h2>${esc(b.heading)}</h2>` : ''}
                ${b.intro ? `<p style="max-width: 680px; margin: 0.5rem auto 0;">${escWithInlineFormatting(b.intro)}</p>` : ''}
                <div class="${v.container}">
                    ${row1}
                </div>
                ${row2 ? `<div class="${v.container} ${v.container}--row2">
                    ${row2}
                </div>` : ''}
            </div>`;
  }
  return `<div class="prog-section reveal">
                <div class="prog-head">
                    ${badge(b.badge)}
                    ${b.heading ? `<h2>${esc(b.heading)}</h2>` : ''}
                    ${b.intro ? `<p>${escWithInlineFormatting(b.intro)}</p>` : ''}
                </div>
                <div class="prog-logos">
                    ${row1}
                </div>
            </div>`;
}

// Sticky-left / 2-up stats layout — currently only used by the homepage.
function blockStats(b) {
  const cells = (b.items || []).map(s => `<div class="stat-cell">
                    <div class="stat-num" data-count="${esc(s.value)}">${esc(s.value)}</div>
                    <div class="stat-label">${esc(s.label)}</div>
                </div>`).join('\n                    ');
  return `<div class="stats-section">
                <div class="stats-layout reveal">
                    <div class="stats-intro">
                        ${badge(b.badge)}
                        ${b.intro ? `<p>${escWithInlineFormatting(b.intro)}</p>` : ''}
                        ${b.linkLabel ? `<a href="${esc(b.linkHref || '#')}" class="stats-link">${esc(b.linkLabel)}</a>` : ''}
                    </div>
                    <div class="stats-track">
                    ${cells}
                    </div>
                </div>
            </div>`;
}

function blockGallery(b, opts) {
  const v = pickVariant(opts && opts.variant && opts.variant.gallery, b.styleKey);
  if (v && v.plain) {
    // Plain image grid, no captions — used by cybersecurity's cohort gallery.
    const imgs = (b.items || [])
      .map(g => `<img src="${esc(mediaUrl(g.image, opts && opts.strapiUrl))}" alt="${esc(g.caption || '')}" loading="lazy">`)
      .join('\n                        ');
    return `<div class="reveal" style="margin-top: 5rem; text-align: center;">
                ${badge(b.badge)}
                ${b.heading ? `<h2>${esc(b.heading)}</h2>` : ''}
                ${b.intro ? `<p style="max-width: 640px; margin: 0.5rem auto 0;">${escWithInlineFormatting(b.intro)}</p>` : ''}
                    <div class="${v.container}">
                        ${imgs}
                    </div>
            </div>`;
  }
  const items = (b.items || []).map((g, i) => `<figure class="reveal reveal-delay-${(i % 4) + 1}">
                    <img src="${esc(mediaUrl(g.image, opts && opts.strapiUrl))}" alt="${esc(g.caption || '')}" loading="lazy">
                    ${g.caption ? `<figcaption>${esc(g.caption)}</figcaption>` : ''}
                </figure>`).join('\n                ');
  return `<div class="text-center reveal">
                ${badge(b.badge)}
                ${b.heading ? `<h2>${esc(b.heading)}</h2>` : ''}
                ${b.intro ? `<p style="max-width: 600px; margin: 0.75rem auto 0;">${escWithInlineFormatting(b.intro)}</p>` : ''}
            </div>
            <div class="home-gallery">
                ${items}
            </div>`;
}

// "Go Global" style section: badge/heading/text + a checklist + one button
// (linked to the sitewide WhatsApp/community link via data-cms, matching
// the other live, no-rebuild-needed contact fields) + a decorative image.
function blockHighlight(b, opts) {
  const items = (b.items || []).map(i => `<li><i class="fas fa-check-circle"></i> ${esc(i.text)}</li>`).join('\n                        ');
  return `<div class="highlight-content">
                <div class="highlight-text reveal">
                    ${badge(b.badge)}
                    ${b.heading ? `<h2>${esc(b.heading)}</h2>` : ''}
                    ${b.text ? `<p>${esc(b.text)}</p>` : ''}
                    <ul class="checklist">
                        ${items}
                    </ul>
                    <a href="#" class="btn btn-primary" data-cms="whatsapp"><i class="fab fa-whatsapp"></i> ${esc(b.buttonLabel || 'Join the Community')}</a>
                </div>
                <div class="highlight-visual reveal reveal-delay-2">
                    <div class="highlight-glow" aria-hidden="true"></div>
                    <div class="highlight-frame">
                        <img src="${esc(mediaUrl(b.image, opts && opts.strapiUrl))}" alt="">
                    </div>
                </div>
            </div>`;
}

// The cybersecurity map's marker positions/SVG silhouette are fixed,
// hand-placed geography — not content an editor would resize or reposition —
// so only each marker's tooltip copy (city + description) is CMS-editable,
// via this block's `items` (one per marker, in the same order as the markers
// below). First marker renders "in progress" (outline, pulsing); the rest
// render "live" (solid).
function cyberMapMarkup(items) {
  const positions = [
    { left: '57.6%', top: '35.7%', id: 'tip-isb', outline: true },
    { left: '78.2%', top: '55.2%', id: 'tip-lhe', outline: false },
  ];
  const markers = positions.map((pos, i) => {
    const item = items[i] || {};
    return `<button class="map-marker${pos.outline ? ' map-marker--outline' : ''}" style="left:${pos.left}; top:${pos.top};" aria-describedby="${pos.id}">
                            <span class="marker-glow"></span>
                            <span class="marker-dot"></span>
                        </button>
                        <div class="map-tooltip" id="${pos.id}" style="left:${pos.left}; top:${pos.top};">
                            <strong>${esc(item.label || '')}</strong>
                            <p>${esc(item.text || '')}</p>
                        </div>`;
  }).join('\n                        ');

  return `<div class="cyber-map-wrap reveal">
                    <div class="cyber-map">
                        <svg class="cyber-map-svg" viewBox="0 0 243 308" aria-hidden="true">
                            <defs>
                                <pattern id="dotPattern" width="7" height="7" patternUnits="userSpaceOnUse">
                                    <circle cx="1.4" cy="1.4" r="1.2" fill="#9CA3AF" opacity="0.55"/>
                                </pattern>
                            </defs>
                            <path d="M168,10 L178,22 L188,14 L200,28 L212,20 L222,38 L215,55 L228,68 L220,90 L226,115 L215,140 L222,165 L210,190 L218,215 L235,230 L215,250 L200,275 L178,290 L150,300 L120,292 L95,298 L70,285 L48,270 L28,250 L15,220 L10,185 L18,155 L8,125 L22,100 L10,78 L30,58 L20,40 L45,30 L60,15 L85,8 L110,18 L135,10 L150,18 Z"/>
                        </svg>

                        ${markers}
                    </div>
                </div>`;
}

function blockCustomHtml(b, opts) {
  const v = pickVariant(opts && opts.variant && opts.variant.customHtml, b.styleKey);
  if (v && v.map) {
    return `<div class="reveal" style="margin-top: 5rem; text-align: center;">
                ${badge(b.badge)}
                ${b.heading ? `<h2>${esc(b.heading)}</h2>` : ''}
                ${b.intro ? `<p style="max-width: 640px; margin: 0.5rem auto 0;">${escWithInlineFormatting(b.intro)}</p>` : ''}
            </div>
            ${cyberMapMarkup(b.items || [])}`;
  }
  const items = (b.items || []).map(i => `<div class="custom-html-item" data-label="${esc(i.label)}">
                    <p>${esc(i.text)}</p>
                </div>`).join('\n                ');
  return `<div class="prog-section reveal">
                ${b.heading ? `<h2>${esc(b.heading)}</h2>` : ''}
                ${items}
            </div>`;
}

// Demo-only signup form shown under the homepage's dark CTA — decorative UI
// (per the design brief, "not brand copy"), not real functional content, so
// it isn't modeled as CMS-editable — it never submits anywhere (onsubmit
// returns false) and its labels aren't expected to change.
const DEMO_TALK_FORM = `<form class="talk-form" onsubmit="return false;">
                <div class="field">
                    <label for="tf-name">Name</label>
                    <input id="tf-name" type="text" placeholder="Your name">
                </div>
                <div class="field">
                    <label for="tf-email">Email</label>
                    <input id="tf-email" type="email" placeholder="you@email.com">
                </div>
                <button class="btn btn-dark-cta" type="submit">Notify Me</button>
            </form>`;

function blockCta(b, app, opts) {
  const v = pickVariant(opts && opts.variant && opts.variant.cta, b.styleKey);
  const box = v ? v.box : 'prog-cta';
  const icon = v ? v.icon : 'fas fa-paper-plane';
  const btnClass = v && v.darkBtn ? 'btn-dark-cta' : 'btn-primary';
  let href, disabled, linkAttrs;
  if (b.buttonHref) {
    href = esc(b.buttonHref);
    disabled = '';
    linkAttrs = '';
  } else {
    const open = !app || app.status !== 'closed';
    href = (app && app.formUrl) ? esc(app.formUrl) : '#';
    disabled = open ? '' : ' is-disabled" aria-disabled="true';
    linkAttrs = ' target="_blank" rel="noopener"';
  }
  return `<div class="${box} reveal">
                <h2>${esc(b.heading || 'Ready to apply?')}</h2>
                <p>${esc(b.text || '')}</p>
                <a href="${href}" class="btn ${btnClass}${disabled}"${linkAttrs}><i class="${esc(icon)}"></i> ${esc(b.buttonLabel || 'Apply Now')}</a>
                ${v && v.showDemoForm ? DEMO_TALK_FORM : ''}
            </div>`;
}

const BLOCKS = {
  'block.rich-text': blockRichText,
  'block.card-grid': blockCardGrid,
  'block.steps': blockSteps,
  'block.testimonials': blockTestimonials,
  'block.logos': blockLogos,
  'block.stats': blockStats,
  'block.gallery': blockGallery,
  'block.custom-html': blockCustomHtml,
  'block.highlight': blockHighlight,
};

function renderBlocks(blocks, app, opts) {
  return (blocks || []).map(b => {
    if (b.__component === 'block.cta') return blockCta(b, app, opts);
    const fn = BLOCKS[b.__component];
    return fn ? fn(b, opts) : `<!-- unknown block: ${esc(b.__component)} -->`;
  }).join('\n\n            ');
}

/* ---------- hero meta (status + deadline, baked at generate time) ---------- */
function heroMeta(app) {
  if (!app) return '';
  const open = app.status !== 'closed';
  // Same destination as the "Apply Now" button while open, so the pill
  // itself is clickable; a plain <span> (no href) while closed.
  const pillTag = open ? 'a' : 'span';
  const hrefAttr = open && app.formUrl ? ` href="${esc(app.formUrl)}" target="_blank" rel="noopener"` : '';
  const pill = `<${pillTag} class="status-pill ${open ? 'is-open' : 'is-closed'}"${hrefAttr}><span class="status-dot"></span> Applications ${open ? 'Open' : 'Closed'}</${pillTag}>`;
  const chip = app.deadline
    ? `<span class="deadline-chip"><i class="fas fa-calendar-day" aria-hidden="true"></i> Deadline: <strong>${fmtDate(app.deadline)}</strong></span>`
    : '';
  return `<div class="hero-meta">
                ${pill}
                ${chip}
            </div>`;
}

// Wraps `accentText`, if it appears inside `subtitle`, in the italic-serif
// accent span the homepage's scroll effect targets — lets an editor write a
// natural full sentence while marking which phrase gets the treatment.
function withAccent(subtitle, accentText) {
  if (!subtitle) return '';
  if (!accentText) return esc(subtitle);
  const idx = subtitle.indexOf(accentText);
  if (idx === -1) return esc(subtitle);
  const before = subtitle.slice(0, idx);
  const after = subtitle.slice(idx + accentText.length);
  return `${esc(before)}<span class="hero-accent" id="heroAccent">${esc(accentText)}</span>${esc(after)}`;
}

/* ---------- homepage (bespoke chrome: hero, auto-generated program-nav
   cards, per-section layout, scroll-fx script — not shared with the
   generic program-page template) ---------- */
function renderHomePage(program, allPrograms, strapiUrl) {
  const theme = program.theme || {};
  const primary = theme.primary || '#49B96B';
  const primaryDark = theme.primaryDark || '#2F9E5B';
  const hero = program.hero || {};
  const blocks = program.blocks || [];
  const find = comp => blocks.find(b => b.__component === comp);
  const opts = { strapiUrl, variant: variantFor(program.slug) };

  const statsBlock = find('block.stats');
  const galleryBlock = find('block.gallery');
  const highlightBlock = find('block.highlight');
  const logosBlock = find('block.logos');
  const ctaBlock = find('block.cta');

  const otherPrograms = allPrograms.filter(p => !p.isHomepage).slice().sort((a, b) => (a.order || 0) - (b.order || 0));

  const themeCss = `        :root {
            --primary: ${primary};
            --primary-dark: ${primaryDark};
            --primary-soft: ${hexToRgba(primary, 0.10)};
            --primary-soft-line: ${hexToRgba(primary, 0.18)};
            --primary-soft-ink: ${hexToRgba(primary, 0.22)};
            --shadow-glow: 0 10px 28px ${hexToRgba(primary, 0.22)};
        }`;

  const programCards = otherPrograms.map((p, i) => {
    const meta = PROGRAM_CARD_META[p.slug] || { icon: 'fas fa-star', accent: '#00e676', iconBg: 'var(--primary-soft)', iconFg: 'var(--primary-dark)' };
    const blurb = (p.hero && p.hero.subtitle) || '';
    return `<a href="${esc(p.slug)}.html" class="program-card reveal reveal-delay-${(i % 4) + 1}" style="--card-accent: ${esc(meta.accent)}; --icon-bg: ${esc(meta.iconBg)}; --icon-fg: ${esc(meta.iconFg)};">
                    <div class="card-icon"><i class="${esc(meta.icon)}"></i></div>
                    <h3><span class="program-name-underline">${esc(p.navLabel)}</span></h3>
                    <p>${esc(blurb)}</p>
                    <div class="card-arrow">Learn More <i class="fas fa-arrow-right"></i></div>
                </a>`;
  }).join('\n                ');

  const titleText = (hero.title || 'Innovatrium').replace(/\n+/g, ' ');

  const partnersLogos = (logosBlock ? (logosBlock.logos || []) : [])
    .map(l => `<img src="${esc(mediaUrl(l.src, strapiUrl))}" alt="${esc(l.alt || '')}"${l.mono ? ' class="mono-mark"' : ''}>`)
    .join('\n                ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(titleText)} | BNU Incubation Center</title>
    <meta name="description" content="${esc(hero.subtitle || '')}">
    <meta name="keywords" content="BNU, incubation, startups, Lahore, innovation, cybersecurity, venture capital, skills">
    <meta name="author" content="Innovatrium, BNU">
    <meta property="og:title" content="${esc(titleText)} | BNU Incubation Center">
    <meta property="og:description" content="${esc(hero.subtitle || '')}">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="generator" content="Innovatrium CMS">
    <link rel="icon" type="image/png" href="assets/images/logos/logo-va.png">
    <link rel="apple-touch-icon" href="assets/images/logos/logo-va.png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@1,9..144,500;1,9..144,600;1,9..144,700&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="assets/css/main.css">
    <link rel="stylesheet" href="assets/css/pages/index.css">
    <style>
${themeCss}
    </style>
</head>
<body>

    ${navHtml(otherPrograms, program.slug)}

    <main>

    <section class="hero" id="home">
        <div class="hero-content reveal">
            ${badge(hero.badge || 'BNU Incubation Center')}
            <h1>${esc(hero.title || 'Igniting Innovation, Empowering Growth').replace(/\n/g, '<br>')}</h1>
            <p>${withAccent(hero.subtitle, hero.accentText)}</p>
            <div class="hero-btns">
                <a href="#programs" class="btn btn-primary"><i class="fas fa-compass"></i> Discover Programs</a>
                <a href="ventureden.html" class="btn btn-outline"><i class="fas fa-paper-plane"></i> Apply for Funding</a>
            </div>
            <div class="scroll-indicator">
                <span>Scroll</span>
                <i class="fas fa-chevron-down"></i>
            </div>
        </div>
    </section>

    ${statsBlock ? blockStats(statsBlock) : ''}

    <section id="programs" class="section-padding">
        <div class="container">
            <div class="text-center reveal">
                <span class="section-badge">What We Offer</span>
                <h2>Our Programs</h2>
                <p style="max-width: 600px; margin: 0.75rem auto 0;">Nurturing startups with dedicated incubation, specialized clinics, hands-on skills, and venture funding.</p>
            </div>
            <div class="programs-grid">
                ${programCards}
            </div>
        </div>
    </section>

    ${galleryBlock ? `<section class="section-padding"><div class="container">${blockGallery(galleryBlock, opts)}</div></section>` : ''}

    ${highlightBlock ? `<section class="section-padding highlight-section"><div class="container">${blockHighlight(highlightBlock, opts)}</div></section>` : ''}

    ${logosBlock ? `<section class="section-padding partners">
        <div class="container text-center reveal">
            ${badge(logosBlock.badge)}
            ${logosBlock.heading ? `<h2>${esc(logosBlock.heading)}</h2>` : ''}
            <div class="partners-logos">
                ${partnersLogos}
            </div>
        </div>
    </section>` : ''}

    ${ctaBlock ? `<section class="section-padding cta-banner"><div class="container">${blockCta(ctaBlock, null, opts)}</div></section>` : ''}

    </main>

    ${footerHtml(otherPrograms)}

    <button class="back-to-top" aria-label="Back to top"><i class="fas fa-arrow-up"></i></button>

    <script src="assets/js/site-config.js"></script>
    <script src="assets/js/main.js"></script>

    <script>
    /* GSAP + Lenis — Signature Moment #1: scroll-linked blur/fade on the hero's
       italic mission line ONLY, as the user scrolls from the hero into
       Programs. Not used anywhere else on this or any other page. */
    (function(){
      function loadScript(src){
        return new Promise(function(resolve, reject){
          var s = document.createElement('script');
          s.src = src; s.onload = resolve; s.onerror = reject;
          document.head.appendChild(s);
        });
      }
      var GSAP_URL = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js';
      var SCROLLTRIGGER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js';
      var LENIS_URL = 'https://unpkg.com/lenis@1.1.14/dist/lenis.min.js';

      Promise.all([loadScript(GSAP_URL), loadScript(SCROLLTRIGGER_URL), loadScript(LENIS_URL)])
        .then(init)
        .catch(function(err){ console.warn('Scroll-fx libraries failed to load:', err); });

      function init(){
        if (typeof gsap === 'undefined' || typeof Lenis === 'undefined') return;
        gsap.registerPlugin(ScrollTrigger);

        var lenis = new Lenis({ duration: 1.15, smoothWheel: true });
        gsap.ticker.add(function(time){ lenis.raf(time * 1000); });
        gsap.ticker.lagSmoothing(0);
        lenis.on('scroll', ScrollTrigger.update);

        var accent = document.getElementById('heroAccent');
        var heroEl = document.getElementById('home');
        if (!accent || !heroEl) return;

        gsap.to(accent, {
          filter: 'blur(14px)',
          opacity: 0,
          ease: 'none',
          scrollTrigger: { trigger: heroEl, start: 'center center', end: 'bottom top', scrub: true }
        });
      }
    })();
    </script>
</body>
</html>
`;
}

/* ---------- full page ---------- */
function renderProgramPage(program, allPrograms, strapiUrl) {
  if (program.isHomepage) return renderHomePage(program, allPrograms, strapiUrl);

  const theme = program.theme || {};
  const primary = theme.primary || '#00e676';
  const primaryDark = theme.primaryDark || primary;
  const hero = program.hero || {};
  const app = program.application || null;
  const variant = variantFor(program.slug);
  const opts = { strapiUrl, variant };

  const themeCss = `        :root {
            --primary: ${primary};
            --primary-dark: ${primaryDark};
            --primary-soft: ${hexToRgba(primary, 0.10)};
            --primary-soft-line: ${hexToRgba(primary, 0.18)};
            --primary-soft-ink: ${hexToRgba(primary, 0.22)};
            --shadow-glow: 0 10px 28px ${hexToRgba(primary, 0.22)};
        }`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(hero.title || program.navLabel)} | Innovatrium, BNU</title>
    <meta name="description" content="${esc(hero.subtitle || '')}">
    <meta property="og:title" content="${esc(hero.title || program.navLabel)} | Innovatrium">
    <meta name="generator" content="Innovatrium CMS">
    <link rel="icon" type="image/png" href="assets/images/logos/logo-va.png">
    <link rel="apple-touch-icon" href="assets/images/logos/logo-va.png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <!-- See assets/css/base/_variables.css for the font-choice + AA-contrast notes -->
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="assets/css/main.css">
    <link rel="stylesheet" href="assets/css/pages/program.css">
    ${variant ? `<link rel="stylesheet" href="${variant.css}">` : ''}
    <style>
${themeCss}
    </style>
</head>
<body>

    ${navHtml(allPrograms, program.slug)}

    <main>
        <header class="page-hero">
            <div class="container reveal">
                ${badge(hero.badge || 'Program')}
                <h1>${esc(hero.title || program.navLabel)}</h1>
                ${hero.subtitle ? `<p>${esc(hero.subtitle)}</p>` : ''}
                ${heroMeta(app)}
            </div>
        </header>

        <section class="content-section light-section">
            <div class="container">
            ${renderBlocks(program.blocks, app, opts)}
            </div>
        </section>
    </main>

    ${footerHtml(allPrograms)}

    <button class="back-to-top" aria-label="Back to top"><i class="fas fa-arrow-up"></i></button>
    <script src="assets/js/site-config.js"></script>
    <script src="assets/js/main.js"></script>
</body>
</html>
`;
}

module.exports = { renderProgramPage, navHtml, footerHtml };
